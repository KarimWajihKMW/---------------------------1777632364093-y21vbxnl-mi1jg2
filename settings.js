'use strict';

const PLATFORM_SETTING_TYPES = ['الهوية', 'التواصل', 'الحجوزات', 'المدفوعات', 'الخصوصية', 'الإشعارات', 'التقارير'];
const PLATFORM_SETTING_VISIBILITY = ['عام', 'داخلي', 'للمالك فقط'];
const platformSettings = [];

async function savePlatformSettings() {
  await window.adrekApi.saveCollection('platformSettings', platformSettings);
}

function settingPrompt(setting = {}) {
  const title = prompt('اسم الإعداد', setting.title || '');
  if (title === null) return null;
  const group = prompt(`المجموعة (${PLATFORM_SETTING_TYPES.join('، ')})`, setting.group || 'الهوية');
  if (group === null) return null;
  const value = prompt('قيمة الإعداد', setting.value || '');
  if (value === null) return null;
  const visibility = prompt(`نطاق الظهور (${PLATFORM_SETTING_VISIBILITY.join('، ')})`, setting.visibility || 'داخلي');
  if (visibility === null) return null;
  const status = prompt('الحالة: تم التفعيل أو قريبا', setting.status || 'تم التفعيل');
  if (status === null) return null;
  const description = prompt('وصف الإعداد وطريقة استخدامه', setting.description || '');
  if (description === null) return null;

  return {
    ...setting,
    id: setting.id || `setting-${Date.now()}`,
    title: title.trim() || 'إعداد عام',
    group: PLATFORM_SETTING_TYPES.includes(group.trim()) ? group.trim() : 'الهوية',
    value: value.trim(),
    visibility: PLATFORM_SETTING_VISIBILITY.includes(visibility.trim()) ? visibility.trim() : 'داخلي',
    status: ADMIN_STATUS_OPTIONS.includes(status.trim()) ? status.trim() : 'تم التفعيل',
    updated: new Date().toISOString().slice(0, 10),
    description: description.trim()
  };
}

async function createPlatformSetting() {
  const setting = settingPrompt();
  if (!setting) return;
  platformSettings.unshift(setting);
  await savePlatformSettings();
  showToast('تمت إضافة الإعداد العام');
  render();
}

async function editPlatformSetting(index) {
  const setting = settingPrompt(platformSettings[index]);
  if (!setting) return;
  platformSettings[index] = setting;
  await savePlatformSettings();
  showToast('تم حفظ الإعداد العام');
  render();
}

async function togglePlatformSetting(index) {
  platformSettings[index].status = platformSettings[index].status === 'تم التفعيل' ? 'قريبا' : 'تم التفعيل';
  platformSettings[index].updated = new Date().toISOString().slice(0, 10);
  await savePlatformSettings();
  showToast('تم تحديث حالة الإعداد');
  render();
}

async function deletePlatformSetting(index) {
  if (!confirm('حذف هذا الإعداد العام؟')) return;
  platformSettings.splice(index, 1);
  await savePlatformSettings();
  showToast('تم حذف الإعداد العام');
  if (state.route.startsWith('/admin/settings/')) navigate('/admin/settings'); else render();
}

function viewPlatformSetting(id) { navigate(`/admin/settings/${encodeURIComponent(id)}`); }

function adminSettingsDetail(setting, index) {
  return `<div class="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
    <article class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm">
      <div class="flex flex-wrap items-start justify-between gap-3"><div><span class="rounded-full bg-mint px-3 py-1 text-xs font-extrabold text-moss">${escapeHTML(setting.group)}</span><h3 class="mt-4 font-display text-3xl font-extrabold text-moss">${escapeHTML(setting.title)}</h3></div>${statusBadge(setting.status)}</div>
      <dl class="mt-6 grid gap-4 sm:grid-cols-2">
        <div class="rounded-2xl bg-mint/55 p-4"><dt class="text-xs font-extrabold text-ink/55">القيمة الحالية</dt><dd class="mt-2 font-bold text-moss">${escapeHTML(setting.value)}</dd></div>
        <div class="rounded-2xl bg-sand/70 p-4"><dt class="text-xs font-extrabold text-ink/55">نطاق الظهور</dt><dd class="mt-2 font-bold text-moss">${escapeHTML(setting.visibility)}</dd></div>
        <div class="rounded-2xl bg-white p-4"><dt class="text-xs font-extrabold text-ink/55">آخر تحديث</dt><dd class="mt-2 font-bold text-moss">${escapeHTML(setting.updated)}</dd></div>
        <div class="rounded-2xl bg-white p-4"><dt class="text-xs font-extrabold text-ink/55">المعرف</dt><dd class="mt-2 font-bold text-moss">${escapeHTML(setting.id)}</dd></div>
      </dl>
      <p class="mt-6 rounded-2xl bg-white/70 p-4 leading-8 text-ink/65">${escapeHTML(setting.description)}</p>
    </article>
    <aside class="rounded-[2rem] bg-moss p-6 text-white shadow-calm"><h3 class="font-display text-2xl font-extrabold">إجراءات CRUD</h3><div class="mt-5 grid gap-3"><button onclick="editPlatformSetting(${index})" class="rounded-2xl bg-white px-5 py-3 font-extrabold text-moss transition hover:-translate-y-1">تعديل الإعداد</button><button onclick="togglePlatformSetting(${index})" class="rounded-2xl bg-white/10 px-5 py-3 font-extrabold text-white transition hover:-translate-y-1">تغيير الحالة</button><button onclick="deletePlatformSetting(${index})" class="rounded-2xl bg-red-50 px-5 py-3 font-extrabold text-red-700 transition hover:-translate-y-1">حذف الإعداد</button><a href="/admin/settings" data-route="/admin/settings" class="rounded-2xl border border-white/20 px-5 py-3 text-center font-extrabold text-white">العودة للإعدادات</a></div></aside>
  </div>`;
}

function adminSettingsPage() {
  const requestedId = decodeURIComponent(state.route.split('/')[3] || '');
  if (requestedId) {
    const index = platformSettings.findIndex((setting) => setting.id === requestedId);
    if (index >= 0) return adminSettingsDetail(platformSettings[index], index);
  }

  const filters = ['الكل', ...PLATFORM_SETTING_TYPES, ...ADMIN_STATUS_OPTIONS];
  const activeFilter = filters.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['title', 'group', 'updated', 'status'].includes(state.sort) ? state.sort : 'updated';
  let list = platformSettings.map((setting, index) => ({ setting, index }))
    .filter(({ setting }) => activeFilter === 'الكل' || setting.group === activeFilter || setting.status === activeFilter)
    .filter(({ setting }) => [setting.title, setting.group, setting.value, setting.visibility, setting.status, setting.description].some((value) => includesTerm(value, state.search)));
  list.sort((a, b) => (activeSort === 'title' ? a.setting.title.localeCompare(b.setting.title, 'ar') : activeSort === 'group' ? a.setting.group.localeCompare(b.setting.group, 'ar') : activeSort === 'status' ? a.setting.status.localeCompare(b.setting.status, 'ar') : new Date(b.setting.updated) - new Date(a.setting.updated)));
  const { pages, visible } = getPagedItems(list);

  return `<div class="rounded-[2rem] border border-white/70 bg-white/65 p-4 shadow-sm">${listToolbar({ placeholder: 'ابحث في اسم الإعداد أو قيمته أو وصفه', filters, activeFilter, activeSort, sorts: [{ value: 'updated', label: 'الأحدث تحديثاً' }, { value: 'title', label: 'اسم الإعداد' }, { value: 'group', label: 'المجموعة' }, { value: 'status', label: 'الحالة' }] })}<button onclick="createPlatformSetting()" class="mt-4 rounded-2xl bg-moss px-5 py-3 font-extrabold text-white transition hover:-translate-y-1">إضافة إعداد عام</button></div>
  <div class="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-calm"><div class="overflow-x-auto"><table class="w-full min-w-[920px] text-right"><thead class="bg-moss text-sm text-white"><tr><th class="p-4">الإعداد</th><th class="p-4">المجموعة</th><th class="p-4">القيمة</th><th class="p-4">الظهور</th><th class="p-4">آخر تحديث</th><th class="p-4">الحالة</th><th class="p-4">إجراءات CRUD</th></tr></thead><tbody>${visible.map(({ setting, index }) => `<tr class="border-t border-moss/10"><td class="p-4"><b class="text-moss">${escapeHTML(setting.title)}</b><p class="mt-1 max-w-xs text-sm text-ink/55">${escapeHTML(setting.description)}</p></td><td class="p-4">${escapeHTML(setting.group)}</td><td class="p-4 font-bold text-moss">${escapeHTML(setting.value)}</td><td class="p-4">${escapeHTML(setting.visibility)}</td><td class="p-4">${escapeHTML(setting.updated)}</td><td class="p-4">${statusBadge(setting.status)}</td><td class="p-4"><div class="flex flex-wrap gap-2"><button onclick="viewPlatformSetting('${escapeHTML(setting.id)}')" class="table-action rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white">عرض</button><button onclick="editPlatformSetting(${index})" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل</button><button onclick="togglePlatformSetting(${index})" class="table-action rounded-xl bg-sand px-3 py-2 text-xs font-bold text-moss">الحالة</button><button onclick="deletePlatformSetting(${index})" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></td></tr>`).join('')}</tbody></table>${visible.length ? '' : emptyState()}</div></div>${pagination(pages)}`;
}

Object.assign(window, { createPlatformSetting, editPlatformSetting, togglePlatformSetting, deletePlatformSetting, viewPlatformSetting, adminSettingsPage, platformSettings });
