'use strict';

const ownerSessionStorage = window.adrekStorage?.session || {
  getItem(key) { try { return window.sessionStorage.getItem(key); } catch (error) { return null; } },
  setItem(key, value) { try { window.sessionStorage.setItem(key, String(value)); } catch (error) {} },
  removeItem(key) { try { window.sessionStorage.removeItem(key); } catch (error) {} }
};

const ownerPhrases = [];
const supportTickets = [];

function isOwnerLoggedIn() {
  return ownerSessionStorage.getItem(OWNER_AUTH_KEY) === 'true';
}

function ownerLoginPage() {
  return shell('دخول لوحة المالك', 'صفحة خاصة لإدارة البرامج والاشتراكات والمنتجات والعبارات والدعم. اسم المستخدم الافتراضي هو admin وكلمة المرور الافتراضية هي 12345678 عند أول تشغيل، ثم يمكن تغييرها من تبويب الأمان.', `
    <form class="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); ownerLogin()">
      <div class="grid gap-4">
        <input id="ownerUser" autocomplete="username" required placeholder="اسم المستخدم" class="rounded-2xl border border-moss/10 px-4 py-3">
        <input id="ownerPass" type="password" autocomplete="current-password" required placeholder="كلمة المرور" class="rounded-2xl border border-moss/10 px-4 py-3">
        <button class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1">دخول المالك</button>
      </div>
    </form>`, 'admin');
}

async function ownerLogin() {
  const user = document.getElementById('ownerUser')?.value.trim();
  const pass = document.getElementById('ownerPass')?.value;

  try {
    const response = await window.adrekApi.loginOwner(user, pass);
    window.adrekApi.setAdminToken(response.token);
    await window.adrekApi.loadAdminData();
    ownerSessionStorage.setItem(OWNER_AUTH_KEY, 'true');
    showToast('تم دخول لوحة المالك');
    navigate('/admin/overview');
  } catch (error) {
    showToast(error.message || 'بيانات الدخول غير صحيحة');
  }
}

function ownerLogout() {
  ownerSessionStorage.removeItem(OWNER_AUTH_KEY);
  window.adrekApi.clearAdminToken();
  showToast('تم تسجيل خروج المالك');
  navigate('/admin');
}

function adminTabButton(tab, label) {
  return `<a href="/admin/${tab}" data-route="/admin/${tab}" class="tone-tab ${state.adminTab === tab ? 'tone-tab-active' : ''}">${label}</a>`;
}

function adminShell(body) {
  const tabs = [['overview', 'نظرة عامة'], ['programs', 'البرامج والمنتجات'], ['subscriptions', 'الاشتراكات'], ['settings', 'الإعدادات العامة'], ['phrases', 'العبارات'], ['support', 'الدعم'], ['security', 'الأمان']];
  return shell('لوحة تحكم المالك', 'إدارة مركزية لكل المحتوى مع إضافة وتعديل وحذف وإعادة ترتيب وتحديد ما تم تفعيله وما هو قريبا، مع صفحة عميقة لكل تبويب.', `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/70 bg-white/65 p-4 shadow-sm">
      <div class="flex flex-wrap gap-2">${tabs.map(([tab, label]) => adminTabButton(tab, label)).join('')}</div>
      <button onclick="ownerLogout()" class="rounded-2xl bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 transition hover:-translate-y-1">خروج</button>
    </div>
    ${body}`, 'مسار خاص /admin');
}

function adminOverview() {
  const managedItems = Object.values(adminCollections).flatMap((config) => config.items);
  const activeCount = managedItems.filter((item) => (item.status || 'تم التفعيل') === 'تم التفعيل').length;
  const openSupport = supportTickets.filter((ticket) => ticket.status !== 'مغلق').length;
  const activeSettings = platformSettings.filter((setting) => setting.status === 'تم التفعيل').length;
  return `<div class="grid gap-5 md:grid-cols-4">
    ${stat(managedItems.length, 'عنصر قابل للإدارة')}${stat(activeCount, 'تم التفعيل')}${stat(activeSettings, 'إعداد عام نشط')}${stat(openSupport, 'طلبات دعم مفتوحة')}
  </div>
  <div class="mt-6 grid gap-5 lg:grid-cols-2">
    <div class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm"><h3 class="font-display text-2xl font-extrabold text-moss">إجراءات سريعة</h3><div class="mt-5 grid gap-3 sm:grid-cols-2"><button onclick="navigate('/admin/programs')" class="rounded-2xl bg-moss px-5 py-3 font-extrabold text-white">إدارة البرامج</button><button onclick="navigate('/admin/subscriptions')" class="rounded-2xl bg-mint px-5 py-3 font-extrabold text-moss">إدارة الاشتراكات</button><button onclick="navigate('/admin/settings')" class="rounded-2xl bg-sand px-5 py-3 font-extrabold text-moss">الإعدادات العامة</button><button onclick="navigate('/admin/support')" class="rounded-2xl bg-white px-5 py-3 font-extrabold text-moss">حل مشاكل الدعم</button></div></div>
    <div class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm"><h3 class="font-display text-2xl font-extrabold text-moss">آخر مشاكل الدعم</h3><div class="mt-4 grid gap-3">${supportTickets.slice(0, 3).map((ticket) => `<div class="rounded-2xl bg-mint/55 p-4"><b class="text-moss">${escapeHTML(ticket.id)} · ${escapeHTML(ticket.client)}</b><p class="mt-1 text-sm text-ink/65">${escapeHTML(ticket.issue)}</p></div>`).join('')}</div></div>
  </div>`;
}

function adminCatalogsPage() {
  const activeKey = adminCollections[state.adminCollection] ? state.adminCollection : 'programs';
  const config = adminCollections[activeKey];
  const statuses = ['الكل', ...ADMIN_STATUS_OPTIONS];
  const activeFilter = statuses.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['order', 'title', 'price', 'status'].includes(state.sort) ? state.sort : 'order';
  let list = config.items.map((item, index) => ({ item, index }))
    .filter(({ item }) => activeFilter === 'الكل' || (item.status || 'تم التفعيل') === activeFilter)
    .filter(({ item }) => config.fields.some((field) => includesTerm(item[field], state.search)));
  list.sort((a, b) => (activeSort === 'price' ? Number(a.item.price || 0) - Number(b.item.price || 0) : activeSort === 'status' ? String(a.item.status || '').localeCompare(String(b.item.status || ''), 'ar') : activeSort === 'title' ? String(a.item.title || a.item.name).localeCompare(String(b.item.title || b.item.name), 'ar') : a.index - b.index));
  const { pages, visible } = getPagedItems(list);
  const collectionButtons = Object.entries(adminCollections).map(([key, itemConfig]) => `<button onclick="setAdminCollection('${key}')" class="tone-tab ${key === activeKey ? 'tone-tab-active' : ''}">${itemConfig.label}</button>`).join('');
  return `<div class="rounded-[2rem] border border-white/70 bg-white/65 p-4 shadow-sm"><div class="mb-4 flex flex-wrap gap-2">${collectionButtons}</div>${listToolbar({ placeholder: 'ابحث في الاسم أو الفئة أو الوصف', filters: statuses, activeFilter, activeSort, sorts: [{ value: 'order', label: 'الترتيب اليدوي' }, { value: 'title', label: 'الاسم' }, { value: 'price', label: 'السعر' }, { value: 'status', label: 'الحالة' }] })}<button onclick="createAdminItem('${activeKey}')" class="mt-4 rounded-2xl bg-moss px-5 py-3 font-extrabold text-white transition hover:-translate-y-1">إضافة عنصر جديد</button></div>
  <div class="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-calm"><div class="overflow-x-auto"><table class="w-full min-w-[900px] text-right"><thead class="bg-moss text-sm text-white"><tr><th class="p-4">#</th><th class="p-4">العنصر</th><th class="p-4">الفئة</th><th class="p-4">السعر</th><th class="p-4">الحالة</th><th class="p-4">إعادة الترتيب</th><th class="p-4">إجراءات CRUD</th></tr></thead><tbody>${visible.map(({ item, index }) => adminCatalogRow(activeKey, item, index)).join('')}</tbody></table>${visible.length ? '' : emptyState()}</div></div>${pagination(pages)}`;
}

function adminCatalogRow(key, item, index) {
  const title = item.title || item.name;
  return `<tr class="border-t border-moss/10"><td class="p-4 font-bold text-moss">${index + 1}</td><td class="p-4"><b class="text-moss">${escapeHTML(title)}</b><p class="mt-1 max-w-md text-sm text-ink/55">${escapeHTML(item.outcome || item.report || '')}</p></td><td class="p-4">${escapeHTML(item.category || 'عام')}</td><td class="p-4">${item.price ? Number(item.price).toLocaleString('ar-SA') + ' ر.س' : '-'}</td><td class="p-4">${statusBadge(item.status)}</td><td class="p-4"><div class="flex gap-2"><button onclick="moveAdminItem('${key}', ${index}, -1)" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">أعلى</button><button onclick="moveAdminItem('${key}', ${index}, 1)" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">أسفل</button></div></td><td class="p-4"><div class="flex flex-wrap gap-2"><button onclick="adminViewItem('${key}', ${index})" class="table-action rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white">عرض</button><button onclick="editAdminItem('${key}', ${index})" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل</button><button onclick="toggleAdminStatus('${key}', ${index})" class="table-action rounded-xl bg-sand px-3 py-2 text-xs font-bold text-moss">تغيير الحالة</button><button onclick="deleteAdminItem('${key}', ${index})" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></td></tr>`;
}

function promptItemData(config, item = {}) {
  const next = { ...item };
  for (const field of config.fields) {
    const label = ({ title: 'العنوان', name: 'الاسم', category: 'الفئة', type: 'النوع', duration: 'المدة', level: 'المستوى', price: 'السعر', icon: 'الأيقونة', status: 'الحالة (تم التفعيل أو قريبا)', outcome: 'الوصف/المخرجات', age: 'العمر', format: 'الصيغة', audience: 'الجمهور', period: 'مدة الاشتراك', questions: 'عدد الأسئلة', accuracy: 'الدقة', report: 'وصف التقرير' }[field] || field);
    const value = prompt(label, next[field] ?? (field === 'status' ? 'تم التفعيل' : ''));
    if (value === null) return null;
    next[field] = ['price', 'questions'].includes(field) ? Number(value) || 0 : value.trim();
  }
  next.status = ADMIN_STATUS_OPTIONS.includes(next.status) ? next.status : 'تم التفعيل';
  return next;
}

async function createAdminItem(key) {
  const config = adminCollections[key];
  const item = promptItemData(config, { id: Date.now(), icon: '✨', status: 'تم التفعيل' });
  if (!item) return;
  config.items.push(item);
  await saveAdminCollection(key);
  showToast('تمت إضافة العنصر');
  render();
}

async function editAdminItem(key, index) {
  const config = adminCollections[key];
  const item = promptItemData(config, config.items[index]);
  if (!item) return;
  config.items[index] = { ...config.items[index], ...item };
  await saveAdminCollection(key);
  showToast('تم حفظ التعديل');
  render();
}

async function deleteAdminItem(key, index) {
  if (!confirm('هل تريد حذف هذا العنصر نهائياً من اللوحة؟')) return;
  adminCollections[key].items.splice(index, 1);
  await saveAdminCollection(key);
  showToast('تم حذف العنصر');
  render();
}

async function moveAdminItem(key, index, direction) {
  const list = adminCollections[key].items;
  const target = index + direction;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  await saveAdminCollection(key);
  showToast('تم تحديث ترتيب العناصر');
  render();
}

async function toggleAdminStatus(key, index) {
  const item = adminCollections[key].items[index];
  item.status = item.status === 'تم التفعيل' ? 'قريبا' : 'تم التفعيل';
  await saveAdminCollection(key);
  showToast(`تم تغيير الحالة إلى ${item.status}`);
  render();
}

function setAdminCollection(key) { state.adminCollection = key; state.page = 1; state.search = ''; state.filter = 'الكل'; state.sort = 'order'; render(); }
function adminViewItem(key, index) { const config = adminCollections[key]; const item = config.items[index]; if (config.route.startsWith('/admin')) return showToast(`${config.label}: ${item.title || item.name}`); navigate(`${config.route}/${item.id}`); }

async function savePhrases() {
  await window.adrekApi.saveCollection('phrases', ownerPhrases);
}

function phrasePrompt(phrase = {}) {
  const area = prompt('موضع العبارة', phrase.area || 'الرئيسية');
  if (area === null) return null;
  const text = prompt('نص العبارة', phrase.text || '');
  if (text === null) return null;
  const status = prompt('الحالة: تم التفعيل أو قريبا', phrase.status || 'تم التفعيل');
  if (status === null) return null;
  return { ...phrase, id: phrase.id || Date.now(), area: area.trim(), text: text.trim(), status: ADMIN_STATUS_OPTIONS.includes(status) ? status : 'تم التفعيل' };
}

async function createPhrase() { const phrase = phrasePrompt(); if (!phrase) return; ownerPhrases.push(phrase); await savePhrases(); showToast('تمت إضافة العبارة'); render(); }
async function editPhrase(index) { const phrase = phrasePrompt(ownerPhrases[index]); if (!phrase) return; ownerPhrases[index] = phrase; await savePhrases(); showToast('تم تعديل العبارة'); render(); }
async function togglePhraseStatus(index) { ownerPhrases[index].status = ownerPhrases[index].status === 'تم التفعيل' ? 'قريبا' : 'تم التفعيل'; await savePhrases(); showToast('تم تحديث حالة العبارة'); render(); }
async function deletePhrase(index) { if (!confirm('حذف العبارة؟')) return; ownerPhrases.splice(index, 1); await savePhrases(); showToast('تم حذف العبارة'); render(); }

function adminPhrasesPage() {
  const statuses = ['الكل', ...ADMIN_STATUS_OPTIONS];
  const activeFilter = statuses.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['area', 'text', 'status'].includes(state.sort) ? state.sort : 'area';
  let list = ownerPhrases.map((phrase, index) => ({ phrase, index })).filter(({ phrase }) => activeFilter === 'الكل' || phrase.status === activeFilter).filter(({ phrase }) => [phrase.area, phrase.text, phrase.status].some((value) => includesTerm(value, state.search)));
  list.sort((a, b) => (activeSort === 'status' ? a.phrase.status.localeCompare(b.phrase.status, 'ar') : activeSort === 'text' ? a.phrase.text.localeCompare(b.phrase.text, 'ar') : a.phrase.area.localeCompare(b.phrase.area, 'ar')));
  const { pages, visible } = getPagedItems(list);
  return `${listToolbar({ placeholder: 'ابحث في العبارات أو موضعها', filters: statuses, activeFilter, activeSort, sorts: [{ value: 'area', label: 'الموضع' }, { value: 'text', label: 'العبارة' }, { value: 'status', label: 'الحالة' }] })}<button onclick="createPhrase()" class="mt-4 rounded-2xl bg-moss px-5 py-3 font-extrabold text-white">إضافة عبارة</button><div class="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-calm"><div class="overflow-x-auto"><table class="w-full min-w-[760px] text-right"><thead class="bg-moss text-sm text-white"><tr><th class="p-4">الموضع</th><th class="p-4">العبارة</th><th class="p-4">الحالة</th><th class="p-4">إجراءات CRUD</th></tr></thead><tbody>${visible.map(({ phrase, index }) => `<tr class="border-t border-moss/10"><td class="p-4 font-bold text-moss">${escapeHTML(phrase.area)}</td><td class="p-4">${escapeHTML(phrase.text)}</td><td class="p-4">${statusBadge(phrase.status)}</td><td class="p-4"><div class="flex gap-2"><button onclick="editPhrase(${index})" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل</button><button onclick="togglePhraseStatus(${index})" class="table-action rounded-xl bg-sand px-3 py-2 text-xs font-bold text-moss">الحالة</button><button onclick="deletePhrase(${index})" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></td></tr>`).join('')}</tbody></table>${visible.length ? '' : emptyState()}</div></div>${pagination(pages)}`;
}

async function saveSupportTickets() {
  await window.adrekApi.saveCollection('supportTickets', supportTickets);
}

function supportPrompt(ticket = {}) {
  const client = prompt('اسم العميل', ticket.client || '');
  if (client === null) return null;
  const issue = prompt('وصف المشكلة', ticket.issue || '');
  if (issue === null) return null;
  const priority = prompt('الأولوية', ticket.priority || 'متوسط');
  if (priority === null) return null;
  const status = prompt('الحالة', ticket.status || 'مفتوح');
  if (status === null) return null;
  const resolution = prompt('الحل أو خطة المعالجة', ticket.resolution || '');
  if (resolution === null) return null;
  return { ...ticket, id: ticket.id || `SUP-${Date.now().toString().slice(-5)}`, client: client.trim(), issue: issue.trim(), priority: priority.trim(), status: status.trim(), resolution: resolution.trim() };
}

async function createSupportTicket() { const ticket = supportPrompt(); if (!ticket) return; supportTickets.unshift(ticket); await saveSupportTickets(); showToast('تمت إضافة مشكلة الدعم'); render(); }
async function editSupportTicket(index) { const ticket = supportPrompt(supportTickets[index]); if (!ticket) return; supportTickets[index] = ticket; await saveSupportTickets(); showToast('تم تحديث الدعم'); render(); }
async function closeSupportTicket(index) { supportTickets[index].status = 'مغلق'; supportTickets[index].resolution = prompt('اكتب الحل النهائي', supportTickets[index].resolution) || supportTickets[index].resolution; await saveSupportTickets(); showToast('تم إغلاق مشكلة الدعم'); render(); }
async function deleteSupportTicket(index) { if (!confirm('حذف مشكلة الدعم؟')) return; supportTickets.splice(index, 1); await saveSupportTickets(); showToast('تم حذف مشكلة الدعم'); render(); }

function adminSupportPage() {
  const statuses = ['الكل', ...new Set(supportTickets.map((ticket) => ticket.status))];
  const activeFilter = statuses.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['client', 'priority', 'status'].includes(state.sort) ? state.sort : 'status';
  let list = supportTickets.map((ticket, index) => ({ ticket, index })).filter(({ ticket }) => activeFilter === 'الكل' || ticket.status === activeFilter).filter(({ ticket }) => [ticket.id, ticket.client, ticket.issue, ticket.priority, ticket.status, ticket.resolution].some((value) => includesTerm(value, state.search)));
  list.sort((a, b) => (activeSort === 'client' ? a.ticket.client.localeCompare(b.ticket.client, 'ar') : activeSort === 'priority' ? a.ticket.priority.localeCompare(b.ticket.priority, 'ar') : a.ticket.status.localeCompare(b.ticket.status, 'ar')));
  const { pages, visible } = getPagedItems(list);
  return `${listToolbar({ placeholder: 'ابحث في مشاكل الدعم أو العملاء', filters: statuses, activeFilter, activeSort, sorts: [{ value: 'status', label: 'الحالة' }, { value: 'priority', label: 'الأولوية' }, { value: 'client', label: 'العميل' }] })}<button onclick="createSupportTicket()" class="mt-4 rounded-2xl bg-moss px-5 py-3 font-extrabold text-white">إضافة مشكلة دعم</button><div class="mt-6 grid gap-4">${visible.map(({ ticket, index }) => `<article class="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-sm"><div class="flex flex-wrap items-start justify-between gap-3"><div><b class="text-moss">${escapeHTML(ticket.id)} · ${escapeHTML(ticket.client)}</b><p class="mt-2 leading-7 text-ink/65">${escapeHTML(ticket.issue)}</p></div><span class="rounded-full bg-sand px-3 py-1 text-xs font-extrabold text-moss">${escapeHTML(ticket.priority)} · ${escapeHTML(ticket.status)}</span></div><p class="mt-3 rounded-2xl bg-mint/55 p-3 text-sm text-ink/65">الحل: ${escapeHTML(ticket.resolution)}</p><div class="mt-4 flex flex-wrap gap-2"><button onclick="editSupportTicket(${index})" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل الحل</button><button onclick="closeSupportTicket(${index})" class="table-action rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white">إغلاق المشكلة</button><button onclick="deleteSupportTicket(${index})" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></article>`).join('') || emptyState()}</div>${pagination(pages)}`;
}

function adminSecurityPage() {
  return `<form class="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); changeOwnerPassword()"><h3 class="font-display text-2xl font-extrabold text-moss">تغيير كلمة مرور المالك</h3><p class="mt-2 leading-7 text-ink/65">استخدم هذه الصفحة لتغيير كلمة المرور الحالية إلى كلمة خاصة محفوظة في قاعدة البيانات.</p><div class="mt-5 grid gap-4"><input id="oldOwnerPass" type="password" required placeholder="كلمة المرور الحالية" class="rounded-2xl border border-moss/10 px-4 py-3"><input id="newOwnerPass" type="password" required minlength="8" placeholder="كلمة المرور الجديدة" class="rounded-2xl border border-moss/10 px-4 py-3"><button class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">حفظ كلمة المرور</button></div></form>`;
}

async function changeOwnerPassword() {
  const oldPass = document.getElementById('oldOwnerPass')?.value;
  const newPass = document.getElementById('newOwnerPass')?.value;

  try {
    await window.adrekApi.changeOwnerPassword(oldPass, newPass);
    showToast('تم تغيير كلمة مرور المالك');
  } catch (error) {
    showToast(error.message || 'تعذر تغيير كلمة المرور');
  }
}

function adminPage() {
  if (!isOwnerLoggedIn() || !window.adrekApi.hasAdminToken()) return ownerLoginPage();
  if (!state.adminDataLoaded) {
    if (!state.adminLoading) {
      state.adminLoading = true;
      window.adrekApi.loadAdminData()
        .then(() => {
          state.adminLoading = false;
          render();
        })
        .catch((error) => {
          state.adminLoading = false;
          showToast(error.message || 'انتهت صلاحية جلسة المالك');
          ownerLogout();
        });
    }
    return shell('لوحة تحكم المالك', 'جاري تحميل البيانات الإدارية المحمية من قاعدة البيانات.', `<div class="rounded-[2rem] border border-white/70 bg-white/75 p-8 text-center shadow-calm"><p class="font-display text-2xl font-extrabold text-moss">تحميل بيانات الإدارة...</p></div>`, 'مسار خاص /admin');
  }
  state.adminTab = state.route.split('/')[2] || 'overview';
  if (state.adminTab === 'subscriptions') state.adminCollection = 'subscriptions';
  if (state.adminTab === 'programs' && state.adminCollection === 'subscriptions') state.adminCollection = 'programs';
  const body = state.adminTab === 'overview' ? adminOverview() : state.adminTab === 'settings' ? adminSettingsPage() : state.adminTab === 'phrases' ? adminPhrasesPage() : state.adminTab === 'support' ? adminSupportPage() : state.adminTab === 'security' ? adminSecurityPage() : adminCatalogsPage();
  return adminShell(body);
}

Object.assign(window, { adminPage, ownerLogin, ownerLogout, createAdminItem, editAdminItem, deleteAdminItem, moveAdminItem, toggleAdminStatus, setAdminCollection, adminViewItem, createPhrase, editPhrase, togglePhraseStatus, deletePhrase, createSupportTicket, editSupportTicket, closeSupportTicket, deleteSupportTicket, changeOwnerPassword });
