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
const COLLECTION_NAMES = new Set(Object.keys(seedCollections));
const PUBLIC_COLLECTION_NAMES = new Set(['coaches', 'programs', 'children', 'courses', 'leadership', 'assessments', 'reports', 'subscriptions']);
const ADMIN_COLLECTION_NAMES = new Set([...COLLECTION_NAMES].filter((name) => !PUBLIC_COLLECTION_NAMES.has(name)));
const BODY_LIMIT_BYTES = Number(process.env.MAX_REQUEST_BODY_BYTES) || 1024 * 1024;
const OWNER_SESSION_TTL_MS = Number(process.env.OWNER_SESSION_TTL_MS) || 12 * 60 * 60 * 1000;
const DEFAULT_OWNER_PASSWORD = '12345678';
const INITIAL_OWNER_PASSWORD = process.env.OWNER_INITIAL_PASSWORD?.trim() || DEFAULT_OWNER_PASSWORD;
const STATIC_FILES = new Map([
  ['/', { file: 'index.html', type: 'text/html; charset=utf-8' }],
  ['/index.html', { file: 'index.html', type: 'text/html; charset=utf-8' }],
  ['/script.js', { file: 'script.js', type: 'application/javascript; charset=utf-8' }],
  ['/admin.js', { file: 'admin.js', type: 'application/javascript; charset=utf-8' }],
  ['/settings.js', { file: 'settings.js', type: 'application/javascript; charset=utf-8' }],
  ['/style.css', { file: 'style.css', type: 'text/css; charset=utf-8' }],
  ['/logo.svg', { file: 'logo.svg', type: 'image/svg+xml' }]
]);
const scrypt = promisify(crypto.scrypt);
const adminSessions = new Map();

function createPoolConfig() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRESQL_URL;
  const sslMode = connectionString ? new URL(connectionString).searchParams.get('sslmode') : '';
  const sslEnabled = process.env.PGSSL === 'true' || ['require', 'verify-ca', 'verify-full'].includes(String(process.env.PGSSLMODE || sslMode || '').toLowerCase());
  const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false';
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
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized } : false
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

  for (const entry of normalized) {
    await client.query(
      `INSERT INTO app_collection_items (collection_name, item_key, position, payload)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [collectionName, entry.itemKey, entry.position, JSON.stringify(entry.payload)]
    );
  }
}

async function loadCollections(collectionNames = COLLECTION_NAMES) {
  const requestedCollections = [...collectionNames];
  const result = await pool.query(
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

async function getOwnerCredentials() {
  const result = await pool.query('SELECT value FROM app_meta WHERE key = $1', [OWNER_CREDENTIALS_KEY]);
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

    const existingOwner = await client.query('SELECT key FROM app_meta WHERE key = $1', [OWNER_CREDENTIALS_KEY]);
    if (!existingOwner.rowCount) {
      if (!INITIAL_OWNER_PASSWORD) {
        throw new Error('Missing OWNER_INITIAL_PASSWORD for initial owner setup.');
      }
      const passwordHash = await hashPassword(INITIAL_OWNER_PASSWORD);
      await setOwnerCredentials({ username: ownerSeed.username, ...passwordHash }, client);
    }
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

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, expiresAt] of adminSessions.entries()) {
    if (expiresAt <= now) adminSessions.delete(token);
  }
}

function createSessionToken() {
  cleanupExpiredSessions();
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, Date.now() + OWNER_SESSION_TTL_MS);
  return token;
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

function isAuthorizedRequest(request) {
  cleanupExpiredSessions();
  const token = getRequestToken(request);
  if (!token) return false;
  const expiresAt = adminSessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return false;
  }
  adminSessions.set(token, Date.now() + OWNER_SESSION_TTL_MS);
  return true;
}

function requireAdmin(request, response) {
  if (isAuthorizedRequest(request)) return true;
  sendJson(response, 401, { error: 'يلزم تسجيل دخول المالك أولاً' });
  return false;
}

async function handleBootstrap(response, collectionNames = PUBLIC_COLLECTION_NAMES) {
  const collections = await loadCollections(collectionNames);
  sendJson(response, 200, { collections });
}

async function handleCollectionSave(request, response, pathname) {
  if (!requireAdmin(request, response)) return;
  const collectionName = decodeURIComponent(pathname.replace('/api/collections/', ''));
  if (!COLLECTION_NAMES.has(collectionName)) {
    return sendJson(response, 404, { error: 'Unknown collection.' });
  }

  const body = await readJsonBody(request);
  await replaceCollection(collectionName, body.items || []);
  const result = await pool.query(
    `SELECT payload
     FROM app_collection_items
     WHERE collection_name = $1
     ORDER BY position ASC, updated_at ASC`,
    [collectionName]
  );

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

  sendJson(response, 200, { ok: true, username: credentials.username, token: createSessionToken() });
}

async function handleOwnerPasswordChange(request, response) {
  if (!requireAdmin(request, response)) return;
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
    if (!requireAdmin(request, response)) return;
    return handleBootstrap(response, ADMIN_COLLECTION_NAMES);
  }

  if (request.method === 'PUT' && pathname.startsWith('/api/collections/')) {
    return handleCollectionSave(request, response, pathname);
  }

  if (request.method === 'POST' && pathname === '/api/auth/login') {
    return handleOwnerLogin(request, response);
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
