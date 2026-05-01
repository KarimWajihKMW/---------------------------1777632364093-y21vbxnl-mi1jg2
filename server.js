'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const http = require('http');
const path = require('path');
const { promisify } = require('util');
const { Pool } = require('pg');

const { ownerSeed, seedCollections } = require('./seed-data');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;
const OWNER_CREDENTIALS_KEY = 'owner_credentials';
const USERS_TABLE = 'users';
const SESSIONS_TABLE = 'sessions';
const ELECTRONIC_PAYMENTS_TABLE = 'electronic_payments';
const COLLECTION_NAMES = new Set(Object.keys(seedCollections));
const COLLECTION_TABLE_NAMES = new Map(
  [...COLLECTION_NAMES].map((name) => [name, name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()])
);
const ALLOWED_TABLE_NAMES = new Set([...COLLECTION_TABLE_NAMES.values(), USERS_TABLE, SESSIONS_TABLE, ELECTRONIC_PAYMENTS_TABLE]);
const PUBLIC_COLLECTION_NAMES = new Set(['coaches', 'programs', 'children', 'courses', 'leadership', 'assessments', 'reports', 'subscriptions']);
const ADMIN_COLLECTION_NAMES = new Set([...COLLECTION_NAMES].filter((name) => !PUBLIC_COLLECTION_NAMES.has(name)));
const BODY_LIMIT_BYTES = Number(process.env.MAX_REQUEST_BODY_BYTES) || 1024 * 1024;
const OWNER_SESSION_TTL_MS = Number(process.env.OWNER_SESSION_TTL_MS) || 12 * 60 * 60 * 1000;
const MAX_SESSION_TOKEN_RETRIES = 5;
const INITIAL_OWNER_PASSWORD = process.env.OWNER_INITIAL_PASSWORD?.trim() || null;
const STATIC_FILES = new Map([
  ['/', { file: 'index.html', type: 'text/html; charset=utf-8' }],
  ['/index.html', { file: 'index.html', type: 'text/html; charset=utf-8' }],
  ['/script.js', { file: 'script.js', type: 'application/javascript; charset=utf-8' }],
  ['/discover.js', { file: 'discover.js', type: 'application/javascript; charset=utf-8' }],
  ['/admin.js', { file: 'admin.js', type: 'application/javascript; charset=utf-8' }],
  ['/settings.js', { file: 'settings.js', type: 'application/javascript; charset=utf-8' }],
  ['/style.css', { file: 'style.css', type: 'text/css; charset=utf-8' }],
  ['/logo.svg', { file: 'logo.svg', type: 'image/svg+xml' }]
]);
const scrypt = promisify(crypto.scrypt);
const adminSessions = new Map();

function isLocalDatabaseHost(hostname = '') {
  return ['localhost', '127.0.0.1', '::1'].includes(hostname);
}

function resolveConnectionString() {
  return ['DATABASE_URL', 'DATABASE_PRIVATE_URL', 'DATABASE_PUBLIC_URL', 'POSTGRES_URL', 'POSTGRESQL_URL']
    .map((key) => process.env[key])
    .find(Boolean) || '';
}

function quoteIdentifier(identifier) {
  if (!ALLOWED_TABLE_NAMES.has(identifier)) {
    throw new Error(`Invalid PostgreSQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function getCollectionTableName(collectionName) {
  const tableName = COLLECTION_TABLE_NAMES.get(collectionName);
  if (!tableName) {
    throw new Error(`Unknown collection table for "${collectionName}".`);
  }
  return tableName;
}

function parseConnectionStringUrl(connectionString) {
  if (!connectionString) return null;
  try {
    return new URL(connectionString);
  } catch (error) {
    throw new Error(`Invalid PostgreSQL connection string: ${error.message}`);
  }
}

function resolveRejectUnauthorized(sslMode) {
  if (process.env.PGSSL_REJECT_UNAUTHORIZED === 'true') return true;
  if (process.env.PGSSL_REJECT_UNAUTHORIZED === 'false') return false;
  return ['verify-ca', 'verify-full'].includes(sslMode);
}

function resolveSslConfig() {
  const connectionString = resolveConnectionString();
  const connectionUrl = parseConnectionStringUrl(connectionString);
  const databaseHost = connectionUrl?.hostname || process.env.PGHOST || '';
  const sslMode = String(
    process.env.PGSSLMODE
    || connectionUrl?.searchParams.get('sslmode')
    || ''
  ).toLowerCase();
  const sslEnabled = process.env.PGSSL === 'true'
    || ['require', 'verify-ca', 'verify-full'].includes(sslMode)
    || (databaseHost && !isLocalDatabaseHost(databaseHost));
  const rejectUnauthorized = resolveRejectUnauthorized(sslMode);
  return { connectionString, sslEnabled, rejectUnauthorized };
}

function createPoolConfig() {
  const { connectionString, sslEnabled, rejectUnauthorized } = resolveSslConfig();
  if (connectionString) {
    return sslEnabled ? { connectionString, ssl: { rejectUnauthorized } } : { connectionString };
  }

  if (process.env.PGHOST) {
    return {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: sslEnabled ? { rejectUnauthorized } : false
    };
  }

  throw new Error('Missing PostgreSQL connection settings. Set DATABASE_URL or PGHOST/PGDATABASE/PGUSER/PGPASSWORD.');
}

const pool = new Pool(createPoolConfig());

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = (await scrypt(password, salt, 64)).toString('hex');
  return { salt, hash: derivedKey };
}

async function verifyPassword(password, credentials) {
  if (!credentials?.salt || !credentials?.hash) return false;
  const candidate = await scrypt(password, credentials.salt, 64);
  const expected = Buffer.from(credentials.hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
}

function resolveItemKey(collectionName, item, index) {
  if (item && Object.prototype.hasOwnProperty.call(item, 'id') && item.id !== null && item.id !== undefined && String(item.id).trim()) {
    return String(item.id);
  }
  return `${collectionName}-${index + 1}`;
}

function normalizeItems(collectionName, items) {
  if (!Array.isArray(items)) {
    throw new Error(`Collection "${collectionName}" must be an array.`);
  }

  return items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Collection "${collectionName}" contains an invalid item at index ${index}.`);
    }

    const itemKey = resolveItemKey(collectionName, item, index);
    return {
      itemKey,
      position: index,
      payload: Object.prototype.hasOwnProperty.call(item, 'id') ? item : { ...item, id: itemKey }
    };
  });
}

async function replaceCollection(collectionName, items, client = pool) {
  const normalized = normalizeItems(collectionName, items);
  await client.query('DELETE FROM app_collection_items WHERE collection_name = $1', [collectionName]);
  await syncCollectionTable(collectionName, normalized, client);

  for (const entry of normalized) {
    await client.query(
      `INSERT INTO app_collection_items (collection_name, item_key, position, payload)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [collectionName, entry.itemKey, entry.position, JSON.stringify(entry.payload)]
    );
  }
}

async function loadCollections(collectionNames = COLLECTION_NAMES, client = pool) {
  const requestedCollections = [...collectionNames];
  const result = await client.query(
    `SELECT collection_name, payload
     FROM app_collection_items
     WHERE collection_name = ANY($1::text[])
     ORDER BY collection_name ASC, position ASC, updated_at ASC`,
    [requestedCollections]
  );

  const collections = {};
  for (const name of requestedCollections) collections[name] = [];
  for (const row of result.rows) {
    if (!collections[row.collection_name]) collections[row.collection_name] = [];
    collections[row.collection_name].push(row.payload);
  }
  return collections;
}

async function getOwnerCredentials(client = pool) {
  const result = await client.query('SELECT value FROM app_meta WHERE key = $1', [OWNER_CREDENTIALS_KEY]);
  return result.rows[0]?.value || null;
}

async function setOwnerCredentials(value, client = pool) {
  await client.query(
    `INSERT INTO app_meta (key, value)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [OWNER_CREDENTIALS_KEY, JSON.stringify(value)]
  );
  await syncOwnerUser(value, client);
}

async function syncCollectionTable(collectionName, normalizedItems, client = pool) {
  const tableName = quoteIdentifier(getCollectionTableName(collectionName));
  await client.query(`DELETE FROM ${tableName}`);
  for (const entry of normalizedItems) {
    await client.query(
      `INSERT INTO ${tableName} (item_key, position, payload)
       VALUES ($1, $2, $3::jsonb)`,
      [entry.itemKey, entry.position, JSON.stringify(entry.payload)]
    );
  }
}

async function ensureCollectionMirror(collectionName, client = pool) {
  if (!COLLECTION_NAMES.has(collectionName)) {
    throw new Error(`Unknown collection mirror "${collectionName}".`);
  }
  const tableName = quoteIdentifier(getCollectionTableName(collectionName));
  const mirrorPresenceResult = await client.query(`SELECT EXISTS(SELECT 1 FROM ${tableName} LIMIT 1) AS has_rows`);
  if (mirrorPresenceResult.rows[0]?.has_rows) return;

  const sourceResult = await client.query(
    `SELECT payload
     FROM app_collection_items
     WHERE collection_name = $1
     ORDER BY position ASC, updated_at ASC`,
    [collectionName]
  );

  if (sourceResult.rowCount === 0) return;
  await syncCollectionTable(
    collectionName,
    normalizeItems(collectionName, sourceResult.rows.map((row) => row.payload)),
    client
  );
}

async function syncOwnerUser(credentials, client = pool) {
  if (!credentials?.username || !credentials?.salt || !credentials?.hash) return;
  await client.query(
    `INSERT INTO ${quoteIdentifier(USERS_TABLE)} (username, password_salt, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (username)
     DO UPDATE SET password_salt = EXCLUDED.password_salt, password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
    [credentials.username, credentials.salt, credentials.hash]
  );
}

async function cleanupExpiredSessions(client = pool) {
  const now = Date.now();
  for (const [token, expiresAt] of adminSessions.entries()) {
    if (expiresAt <= now) adminSessions.delete(token);
  }
  await client.query(`DELETE FROM ${quoteIdentifier(SESSIONS_TABLE)} WHERE expires_at <= NOW()`);
}

async function ensureDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_collection_items (
      collection_name TEXT NOT NULL,
      item_key TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (collection_name, item_key)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const tableName of COLLECTION_TABLE_NAMES.values()) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${quoteIdentifier(tableName)} (
        item_key TEXT PRIMARY KEY,
        position INTEGER NOT NULL DEFAULT 0,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${quoteIdentifier(USERS_TABLE)} (
      username TEXT PRIMARY KEY,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${quoteIdentifier(SESSIONS_TABLE)} (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${quoteIdentifier(ELECTRONIC_PAYMENTS_TABLE)} (
      transaction_id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SAR',
      method TEXT NOT NULL,
      last4 TEXT NOT NULL,
      cardholder TEXT NOT NULL,
      client_name TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'paid',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [collectionName, items] of Object.entries(seedCollections)) {
      const countResult = await client.query(
        'SELECT COUNT(*)::int AS count FROM app_collection_items WHERE collection_name = $1',
        [collectionName]
      );
      if (!countResult.rows[0].count) {
        await replaceCollection(collectionName, items, client);
      }
    }

    for (const collectionName of COLLECTION_NAMES) {
      await ensureCollectionMirror(collectionName, client);
    }

    const existingOwner = await client.query('SELECT key FROM app_meta WHERE key = $1', [OWNER_CREDENTIALS_KEY]);
    if (!existingOwner.rowCount) {
      if (!INITIAL_OWNER_PASSWORD) {
        throw new Error('Missing OWNER_INITIAL_PASSWORD for initial owner setup.');
      }
      const passwordHash = await hashPassword(INITIAL_OWNER_PASSWORD);
      await setOwnerCredentials({ username: ownerSeed.username, ...passwordHash }, client);
    }
    await syncOwnerUser(await getOwnerCredentials(client), client);
    await cleanupExpiredSessions(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function sendJson(response, statusCode, body) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  });
  response.end(payload);
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(body);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > BODY_LIMIT_BYTES) {
      throw new Error('Request body is too large.');
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

async function createSessionToken(username, client = pool) {
  await cleanupExpiredSessions(client);
  for (let attempt = 0; attempt < MAX_SESSION_TOKEN_RETRIES; attempt += 1) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + OWNER_SESSION_TTL_MS);
    try {
      await client.query(
        `INSERT INTO ${quoteIdentifier(SESSIONS_TABLE)} (token, username, expires_at)
         VALUES ($1, $2, $3)`,
        [token, username, expiresAt.toISOString()]
      );
      adminSessions.set(token, expiresAt.getTime());
      return token;
    } catch (error) {
      if (error.code !== '23505') throw error;
    }
  }
  throw new Error('Failed to create a unique owner session token.');
}

function getRequestToken(request) {
  const headerToken = request.headers['x-owner-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) return headerToken.trim();
  const authHeader = request.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  return '';
}

async function isAuthorizedRequest(request) {
  await cleanupExpiredSessions();
  const token = getRequestToken(request);
  if (!token) return false;
  let expiresAt = adminSessions.get(token);
  if (!expiresAt) {
    const sessionResult = await pool.query(
      `SELECT expires_at
       FROM ${quoteIdentifier(SESSIONS_TABLE)}
       WHERE token = $1`,
      [token]
    );
    if (!sessionResult.rowCount) return false;
    expiresAt = new Date(sessionResult.rows[0].expires_at).getTime();
    adminSessions.set(token, expiresAt);
  }
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    adminSessions.delete(token);
    await pool.query(`DELETE FROM ${quoteIdentifier(SESSIONS_TABLE)} WHERE token = $1`, [token]);
    return false;
  }
  const nextExpiresAt = new Date(Date.now() + OWNER_SESSION_TTL_MS);
  adminSessions.set(token, nextExpiresAt.getTime());
  await pool.query(
    `UPDATE ${quoteIdentifier(SESSIONS_TABLE)}
     SET expires_at = $2
     WHERE token = $1`,
    [token, nextExpiresAt.toISOString()]
  );
  return true;
}

async function requireAdmin(request, response) {
  if (await isAuthorizedRequest(request)) return true;
  sendJson(response, 401, { error: 'يلزم تسجيل دخول المالك أولاً' });
  return false;
}

async function handleBootstrap(response, collectionNames = PUBLIC_COLLECTION_NAMES) {
  const collections = await loadCollections(collectionNames);
  sendJson(response, 200, { collections });
}

async function handleCollectionSave(request, response, pathname) {
  if (!await requireAdmin(request, response)) return;
  const collectionName = decodeURIComponent(pathname.replace('/api/collections/', ''));
  if (!COLLECTION_NAMES.has(collectionName)) {
    return sendJson(response, 404, { error: 'Unknown collection.' });
  }

  const body = await readJsonBody(request);
  const client = await pool.connect();
  let result;
  try {
    await client.query('BEGIN');
    await replaceCollection(collectionName, body.items || [], client);
    result = await client.query(
      `SELECT payload
       FROM app_collection_items
       WHERE collection_name = $1
       ORDER BY position ASC, updated_at ASC`,
      [collectionName]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Failed to save collection "${collectionName}": ${error.message}`);
  } finally {
    client.release();
  }

  sendJson(response, 200, {
    ok: true,
    items: result.rows.map((row) => row.payload)
  });
}

async function handleOwnerLogin(request, response) {
  const body = await readJsonBody(request);
  const credentials = await getOwnerCredentials();
  const matchesUser = body?.username === (credentials?.username || ownerSeed.username);
  const matchesPassword = typeof body?.password === 'string' && await verifyPassword(body.password, credentials);

  if (!matchesUser || !matchesPassword) {
    return sendJson(response, 401, { error: 'بيانات الدخول غير صحيحة' });
  }

  sendJson(response, 200, { ok: true, username: credentials.username, token: await createSessionToken(credentials.username) });
}

async function handleBookingPayment(request, response) {
  const body = await readJsonBody(request);
  const amount = Number(body?.amount);
  const bookingId = String(body?.bookingId || '').trim();
  const method = String(body?.method || '').trim();
  const cardholder = String(body?.cardholder || '').trim();
  const last4 = String(body?.last4 || '').replace(/\D/g, '').slice(-4);
  const currency = String(body?.currency || 'SAR').trim().toUpperCase();

  if (!bookingId) return sendJson(response, 400, { error: 'رقم الحجز مطلوب لإتمام الدفع' });
  if (!Number.isFinite(amount) || amount <= 0) return sendJson(response, 400, { error: 'قيمة الدفع غير صحيحة' });
  if (!['SAR'].includes(currency)) return sendJson(response, 400, { error: 'عملة الدفع غير مدعومة' });
  if (!['mada', 'visa', 'apple-pay'].includes(method)) return sendJson(response, 400, { error: 'وسيلة الدفع غير مدعومة' });
  if (!cardholder || last4.length !== 4) return sendJson(response, 400, { error: 'بيانات البطاقة غير مكتملة' });

  const transactionId = `PAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const paidAt = new Date().toISOString();
  const payload = {
    gateway: 'Adrek Secure Checkout',
    authorizationCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
    saveCardRequested: Boolean(body?.saveCard),
    source: 'booking-confirmation'
  };

  await pool.query(
    `INSERT INTO ${quoteIdentifier(ELECTRONIC_PAYMENTS_TABLE)}
      (transaction_id, booking_id, amount, currency, method, last4, cardholder, client_name, email, status, payload, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'paid', $10::jsonb, $11)`,
    [
      transactionId,
      bookingId,
      amount.toFixed(2),
      currency,
      method,
      last4,
      cardholder,
      String(body?.clientName || '').trim(),
      String(body?.email || '').trim(),
      JSON.stringify(payload),
      paidAt
    ]
  );

  sendJson(response, 200, {
    ok: true,
    payment: {
      transactionId,
      bookingId,
      amount,
      currency,
      method,
      last4,
      status: 'paid',
      paidAt
    }
  });
}

async function handleOwnerPasswordChange(request, response) {
  if (!await requireAdmin(request, response)) return;
  const body = await readJsonBody(request);
  const credentials = await getOwnerCredentials();
  if (typeof body?.oldPassword !== 'string' || !body.oldPassword.trim()) {
    return sendJson(response, 400, { error: 'كلمة المرور الحالية مطلوبة' });
  }

  if (!await verifyPassword(body.oldPassword, credentials)) {
    return sendJson(response, 400, { error: 'كلمة المرور الحالية غير صحيحة' });
  }

  if (typeof body?.newPassword !== 'string' || body.newPassword.trim().length < 8) {
    return sendJson(response, 400, { error: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' });
  }

  const passwordHash = await hashPassword(body.newPassword.trim());
  await setOwnerCredentials({ username: credentials.username, ...passwordHash });
  sendJson(response, 200, { ok: true });
}

async function serveStatic(response, pathname, method) {
  const entry = STATIC_FILES.get(pathname);
  if (!entry) return false;

  const filePath = path.join(ROOT_DIR, entry.file);
  const content = await fs.readFile(filePath);
  response.writeHead(200, {
    'Content-Type': entry.type,
    'Content-Length': content.length,
    'Cache-Control': pathname === '/' || pathname === '/index.html' ? 'no-store' : 'public, max-age=300'
  });
  if (method !== 'HEAD') response.end(content);
  else response.end();
  return true;
}

async function serveSpa(response, method) {
  const content = await fs.readFile(path.join(ROOT_DIR, 'index.html'));
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': content.length,
    'Cache-Control': 'no-store'
  });
  if (method !== 'HEAD') response.end(content);
  else response.end();
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const { pathname } = url;

  if (pathname === '/health') {
    return sendJson(response, 200, { status: 'ok' });
  }

  if (request.method === 'GET' && pathname === '/api/bootstrap') {
    return handleBootstrap(response);
  }

  if (request.method === 'GET' && pathname === '/api/admin/bootstrap') {
    if (!await requireAdmin(request, response)) return;
    return handleBootstrap(response, ADMIN_COLLECTION_NAMES);
  }

  if (request.method === 'PUT' && pathname.startsWith('/api/collections/')) {
    return handleCollectionSave(request, response, pathname);
  }

  if (request.method === 'POST' && pathname === '/api/auth/login') {
    return handleOwnerLogin(request, response);
  }

  if (request.method === 'POST' && pathname === '/api/payments/booking') {
    return handleBookingPayment(request, response);
  }

  if (request.method === 'POST' && pathname === '/api/auth/password') {
    return handleOwnerPasswordChange(request, response);
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    if (await serveStatic(response, pathname, request.method)) return;
    return serveSpa(response, request.method);
  }

  return sendText(response, 405, 'Method not allowed');
}

async function start() {
  await ensureDatabase();

  const server = http.createServer((request, response) => {
    Promise.resolve(handleRequest(request, response)).catch((error) => {
      console.error('Request failed:', error);
      if (!response.headersSent) {
        sendJson(response, 500, { error: 'Internal server error' });
      } else {
        response.end();
      }
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Startup failed:', error);
  pool.end().catch(() => {});
  process.exit(1);
});
