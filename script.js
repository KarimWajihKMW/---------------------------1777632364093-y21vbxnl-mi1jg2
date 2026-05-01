'use strict';

const coaches = [];
const programs = [];
const childrenPrograms = [];
const courses = [];
const leadershipPrograms = [];
const assessments = [];
const reports = [];
const subscriptions = [];

const PAGE_SIZE = 4;
const DEBOUNCE_MS = 140;
const OWNER_AUTH_KEY = 'adrek-owner-authenticated';
const OWNER_PASSWORD_KEY = 'adrek-owner-password';
const OWNER_DEFAULT_PASSWORD = '12345678';
const OWNER_USERNAME = 'admin';
const ADMIN_STATUS_OPTIONS = ['تم التفعيل', 'قريبا'];

const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const includesTerm = (value = '', term = '') => String(value).toLocaleLowerCase('ar').includes(String(term).toLocaleLowerCase('ar'));
const parseDurationValue = (duration = '') => Number.parseInt(String(duration).replace(/[^0-9]/g, ''), 10) || 999;

function debounce(callback, wait = DEBOUNCE_MS) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), wait);
  };
}

function listToolbar({ placeholder, filters, activeFilter, sorts, activeSort }) {
  return `
    <div class="reveal grid gap-4 rounded-[2rem] border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur-xl md:grid-cols-4">
      <label class="sr-only" for="searchInput">بحث</label>
      <input id="searchInput" value="${escapeHTML(state.search)}" placeholder="${placeholder}" class="rounded-2xl border border-moss/10 bg-white px-4 py-3 transition focus:border-sage md:col-span-2">
      <label class="sr-only" for="filterSelect">تصفية</label>
      <select id="filterSelect" class="rounded-2xl border border-moss/10 bg-white px-4 py-3">${filters.map((filter) => `<option value="${escapeHTML(filter)}" ${filter === activeFilter ? 'selected' : ''}>${escapeHTML(filter)}</option>`).join('')}</select>
      <label class="sr-only" for="sortSelect">ترتيب</label>
      <select id="sortSelect" class="rounded-2xl border border-moss/10 bg-white px-4 py-3">${sorts.map((sort) => `<option value="${sort.value}" ${sort.value === activeSort ? 'selected' : ''}>${sort.label}</option>`).join('')}</select>
    </div>`;
}

function getPagedItems(list, perPage = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  state.page = Math.min(Math.max(1, state.page), pages);
  const start = (state.page - 1) * perPage;
  return { pages, visible: list.slice(start, start + perPage) };
}

function emptyState(message = 'لا توجد نتائج مطابقة حالياً') {
  return `<div class="rounded-[2rem] border border-dashed border-moss/20 bg-white/60 p-8 text-center font-bold text-ink/60">${message}</div>`;
}

const canUseHistoryRouting = window.location.protocol !== 'about:' && window.location.origin !== 'null';

function normalizeRoute(path) {
  if (!path || path === '/index.html' || path === 'index.html' || path === 'srcdoc') return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function getCurrentRoute() {
  if (!canUseHistoryRouting && window.location.hash.startsWith('#/')) {
    return normalizeRoute(window.location.hash.slice(1));
  }
  return normalizeRoute(window.location.pathname);
}

const state = {
  route: getCurrentRoute(),
  page: 1,
  filter: 'الكل',
  sort: 'rating',
  search: '',
  adminTab: 'programs',
  adminCollection: 'programs',
  loading: true,
  loadError: ''
};

const createSafeStorage = (storageName) => {
  const memoryStore = new Map();
  let storage = null;

  try {
    storage = window[storageName];
    const testKey = '__adrek_storage_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
  } catch (error) {
    storage = null;
  }

  return {
    getItem(key) {
      if (storage) {
        try { return storage.getItem(key); } catch (error) { storage = null; }
      }
      return memoryStore.has(key) ? memoryStore.get(key) : null;
    },
    setItem(key, value) {
      const stringValue = String(value);
      if (storage) {
        try { storage.setItem(key, stringValue); return; } catch (error) { storage = null; }
      }
      memoryStore.set(key, stringValue);
    },
    removeItem(key) {
      if (storage) {
        try { storage.removeItem(key); return; } catch (error) { storage = null; }
      }
      memoryStore.delete(key);
    }
  };
};

const adrekStorage = {
  local: createSafeStorage('localStorage'),
  session: createSafeStorage('sessionStorage')
};

window.adrekStorage = adrekStorage;

const bootstrapCollections = {
  coaches,
  programs,
  children: childrenPrograms,
  courses,
  leadership: leadershipPrograms,
  assessments,
  reports,
  subscriptions
};

const adminCollections = {
  programs: { label: 'المنتجات الرقمية', route: '/programs', items: programs, fields: ['title', 'category', 'type', 'duration', 'level', 'price', 'icon', 'status', 'outcome'] },
  children: { label: 'برامج الأطفال', route: '/children-programs', items: childrenPrograms, fields: ['title', 'category', 'age', 'format', 'duration', 'level', 'price', 'icon', 'status', 'outcome'] },
  courses: { label: 'البرامج والدورات', route: '/courses', items: courses, fields: ['title', 'category', 'audience', 'format', 'duration', 'level', 'price', 'icon', 'status', 'outcome'] },
  leadership: { label: 'البرامج القيادية', route: '/leadership-programs', items: leadershipPrograms, fields: ['title', 'category', 'audience', 'format', 'duration', 'level', 'price', 'icon', 'status', 'outcome'] },
  subscriptions: { label: 'الاشتراكات', route: '/admin/subscriptions', items: subscriptions, fields: ['title', 'category', 'period', 'level', 'price', 'icon', 'status', 'outcome'] },
  assessments: { label: 'المقاييس', route: '/assessments', items: assessments, fields: ['name', 'category', 'questions', 'accuracy', 'status', 'report'] }
};

function replaceCollectionContents(target, items) {
  target.splice(0, target.length, ...(Array.isArray(items) ? items : []));
}

function updateCollectionReference(key, items) {
  if (bootstrapCollections[key]) {
    replaceCollectionContents(bootstrapCollections[key], items);
    return;
  }

  if (key === 'platformSettings' && typeof platformSettings !== 'undefined') replaceCollectionContents(platformSettings, items);
  if (key === 'phrases' && typeof ownerPhrases !== 'undefined') replaceCollectionContents(ownerPhrases, items);
  if (key === 'supportTickets' && typeof supportTickets !== 'undefined') replaceCollectionContents(supportTickets, items);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.error || 'تعذر إكمال الطلب.');
  }
  return data;
}

async function saveCollection(key, items) {
  const response = await apiRequest(`/api/collections/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ items })
  });
  updateCollectionReference(key, response.items || items);
  return response.items || items;
}

function applyBootstrap(payload = {}) {
  const collections = payload.collections || {};
  Object.entries(bootstrapCollections).forEach(([key, list]) => replaceCollectionContents(list, collections[key]));
  if (typeof platformSettings !== 'undefined') replaceCollectionContents(platformSettings, collections.platformSettings);
  if (typeof ownerPhrases !== 'undefined') replaceCollectionContents(ownerPhrases, collections.phrases);
  if (typeof supportTickets !== 'undefined') replaceCollectionContents(supportTickets, collections.supportTickets);
}

async function initializeApp() {
  state.loading = true;
  state.loadError = '';
  render();

  try {
    const payload = await apiRequest('/api/bootstrap');
    applyBootstrap(payload);
    state.loading = false;
    render();
  } catch (error) {
    state.loading = false;
    state.loadError = error.message || 'تعذر تحميل بيانات المنصة.';
    render();
  }
}

window.retryBootstrap = initializeApp;
window.adrekApi = {
  saveCollection,
  loginOwner(username, password) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  changeOwnerPassword(oldPassword, newPassword) {
    return apiRequest('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword })
    });
  },
  reloadBootstrap: initializeApp
};

const app = document.getElementById('app');
const toast = document.getElementById('toast');

function getRouteSection(route) {
  return normalizeRoute(route).split('/')[1] || 'home';
}

function navigate(path) {
  const nextRoute = normalizeRoute(path);
  const sectionChanged = getRouteSection(nextRoute) !== getRouteSection(state.route);
  if (getCurrentRoute() !== nextRoute) {
    try {
      if (canUseHistoryRouting) {
        history.pushState({}, '', nextRoute);
      } else if (window.location.hash !== `#${nextRoute}`) {
        window.location.hash = nextRoute;
      }
    } catch (error) {
      if (window.location.hash !== `#${nextRoute}`) {
        window.location.hash = nextRoute;
      }
    }
  }
  state.route = nextRoute;
  state.page = 1;
  if (sectionChanged) {
    state.filter = 'الكل';
    state.sort = 'title';
    state.search = '';
  }
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('opacity-0', 'translate-y-6');
  toast.classList.add('opacity-100', 'translate-y-0');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-6');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 2400);
}

function shell(title, subtitle, body, eyebrow = 'Adrek') {
  return `
    <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="reveal mb-8 rounded-[2rem] border border-white/70 bg-white/55 p-6 shadow-calm backdrop-blur-xl md:p-8">
        <span class="mb-3 inline-flex rounded-full bg-mint px-4 py-2 text-xs font-extrabold text-moss">${eyebrow}</span>
        <h1 class="font-display text-3xl font-extrabold leading-tight text-moss md:text-5xl">${title}</h1>
        <p class="mt-4 max-w-3xl text-lg leading-9 text-ink/68">${subtitle}</p>
      </div>
      ${body}
    </section>`;
}

function loadingPage() {
  return shell('جاري تحميل بيانات المنصة', 'يتم جلب البيانات مباشرة من قاعدة PostgreSQL المتصلة بالتطبيق.', `
    <div class="rounded-[2rem] border border-white/70 bg-white/75 p-10 text-center shadow-calm">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-3xl">⏳</div>
      <p class="mt-5 font-display text-2xl font-extrabold text-moss">لحظات من فضلك</p>
      <p class="mt-3 leading-8 text-ink/65">نقوم بتحميل الجداول والبيانات اللازمة قبل عرض المحتوى.</p>
    </div>
  `, 'PostgreSQL');
}

function loadErrorPage() {
  return shell('تعذر تحميل البيانات', 'فشل الاتصال بخدمة البيانات. تأكد من أن الخادم يعمل وقاعدة البيانات متاحة ثم أعد المحاولة.', `
    <div class="rounded-[2rem] border border-red-100 bg-white/80 p-8 shadow-calm">
      <p class="font-bold text-red-700">${escapeHTML(state.loadError || 'حدث خطأ غير متوقع')}</p>
      <button onclick="retryBootstrap()" class="mt-6 rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1">إعادة المحاولة</button>
    </div>
  `, 'تنبيه');
}

function homePage() {
  return `
  <section class="relative overflow-hidden">
    <div class="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-20">
      <div class="reveal">
        <span class="mb-5 inline-flex items-center gap-2 rounded-full border border-moss/10 bg-white/70 px-4 py-2 text-sm font-extrabold text-moss shadow-sm"><span class="h-2 w-2 rounded-full bg-sage"></span> منصة واحدة للمستفيد ومزود الخدمة</span>
        <h1 class="font-display text-4xl font-extrabold leading-[1.25] text-moss sm:text-6xl">جلسات كوتشينج .دعم نفسي وأسري . تطوير مهني وقيادي. برامج نمائية وسلوكية للأطفال والمراهقين .</h1>
        <p class="mt-6 max-w-2xl text-lg leading-9 text-ink/70">في Adrek نربطك بالمختص المناسب، ونساعدك على تحديد مسارك التطويري عبر مقاييس شخصية ونفسية، وتقارير احترافية، وبرامج تدريبية، لتفهم ذاتك وتبدأ خطوتك القادمة بثقة ووضوح.</p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <a data-route="/booking" href="/booking" class="soft-button rounded-2xl bg-moss px-7 py-4 text-center font-extrabold text-white shadow-leaf">ابدأ الحجز الآن</a>
          <a data-route="/join-provider" href="/join-provider" class="soft-button rounded-2xl border border-moss/15 bg-white/70 px-7 py-4 text-center font-extrabold text-moss">انضم كمزود خدمة</a>
        </div>
        <div class="mt-10 grid grid-cols-3 gap-3 text-center sm:max-w-xl">
          ${stat('16K+', 'مستفيد')}${stat('320+', 'مختص معتمد')}${stat('42K+', 'تقرير صادر')}
        </div>
      </div>
      <div class="hero-card reveal reveal-delay-2 rounded-[2.5rem] p-5 md:p-7">
        <div class="relative z-10 rounded-[2rem] bg-[#f9fbf4]/90 p-5">
          <div class="mb-5 flex items-center justify-between">
            <div><p class="text-sm font-bold text-ink/55">لوحة الاتزان اليوم</p><h2 class="font-display text-2xl font-extrabold text-moss">خريطة الرحلة العلاجية</h2></div>
            <span class="rounded-2xl bg-moss px-4 py-2 text-sm font-extrabold text-white">خصوصي</span>
          </div>
          <div class="grid gap-4 md:grid-cols-[.8fr_1fr]">
            <div class="relative flex min-h-64 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-mint to-sand/80 p-6">
              <div class="breath-ring absolute h-40 w-40 rounded-full border border-moss/20"></div>
              <div class="breath-ring absolute h-28 w-28 rounded-full border border-moss/30" style="animation-delay:.5s"></div>
              <div class="z-10 text-center"><div class="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl shadow-calm">🌱</div><p class="font-display text-3xl font-extrabold text-moss">82%</p><p class="text-sm font-bold text-ink/60">مؤشر التحسن</p></div>
            </div>
            <div class="space-y-3">
              ${journey('مقياس أولي', 'اكتمل', 100)}${journey('جلسة كوتشينج', 'اليوم 7:30م', 64)}${journey('تقرير مهني', 'قيد المراجعة', 48)}
              <div class="rounded-3xl bg-white p-4 shadow-sm"><p class="mb-2 text-sm font-extrabold text-moss">توصية ذكية</p><p class="text-sm leading-7 text-ink/65">ابدأ ببرنامج وضوح المسار مع جلسة متابعة بعد 7 أيام.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
    <div class="grid gap-4 md:grid-cols-4">
      ${feature('🧑‍⚕️', 'حجز مختصين', 'بحث وفرز حسب التخصص والسعر والتقييم مع مواعيد مباشرة.', '/coaches')}
      ${feature('🧩', 'برامج الأطفال', 'برامج نمائية وسلوكية للأطفال والمراهقين بخطط للأسرة والمدرسة.', '/children-programs')}
      ${feature('🎓', 'برامج ودورات', 'دورات تدريبية مباشرة ومسجلة للأفراد والممارسين.', '/courses')}
      ${feature('🏛️', 'برامج قيادية', 'مسارات تطوير قيادي للجهات والمنظمات وفرق العمل.', '/leadership-programs')}
    </div>
  </section>
  <section class="bg-moss py-16 text-white">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div class="lg:col-span-1"><span class="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">رحلة واضحة</span><h2 class="mt-4 font-display text-3xl font-extrabold">من سؤالك الأول حتى التقرير النهائي</h2></div>
      <div class="grid gap-4 lg:col-span-2 md:grid-cols-3">${step('01', 'اختر المسار', 'كوتشينج، نفسي، أسري، أو تطوير ذات.')}${step('02', 'احجز أو ابدأ مقياس', 'مواعيد مباشرة ومنتجات رقمية فورية.')}${step('03', 'استلم تقريرك', 'ملخص احترافي وتوصيات قابلة للتنفيذ.')}</div>
    </div>
  </section>`;
}

function stat(number, label) { return `<div class="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm"><p class="font-display text-2xl font-extrabold text-moss">${number}</p><p class="text-xs font-bold text-ink/55">${label}</p></div>`; }
function journey(title, meta, value) { return `<div class="rounded-3xl bg-white p-4 shadow-sm"><div class="mb-2 flex justify-between text-sm"><b class="text-moss">${title}</b><span class="text-ink/55">${meta}</span></div><div class="h-2 rounded-full bg-mint"><div class="progress-wave h-2 rounded-full" style="width:${value}%"></div></div></div>`; }
function feature(icon, title, text, route) { return `<a href="${route}" data-route="${route}" class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl"><span class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-2xl">${icon}</span><h3 class="font-display text-xl font-extrabold text-moss">${title}</h3><p class="mt-3 leading-7 text-ink/62">${text}</p></a>`; }
function step(num, title, text) { return `<div class="rounded-[2rem] border border-white/15 bg-white/10 p-6"><span class="text-sm font-extrabold text-sand">${num}</span><h3 class="mt-3 font-display text-xl font-extrabold">${title}</h3><p class="mt-3 leading-7 text-white/70">${text}</p></div>`; }

function coachesPage() {
  const specialties = ['الكل', ...new Set(coaches.map((coach) => coach.specialty))];
  const activeFilter = specialties.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['rating', 'price', 'experience'].includes(state.sort) ? state.sort : 'rating';
  let list = coaches.filter((coach) => activeFilter === 'الكل' || coach.specialty === activeFilter).filter((coach) => includesTerm(coach.name, state.search) || includesTerm(coach.specialty, state.search) || includesTerm(coach.city, state.search));
  list.sort((a, b) => (activeSort === 'price' ? a.price - b.price : activeSort === 'experience' ? b.experience - a.experience : b.rating - a.rating));
  const { pages, visible } = getPagedItems(list);
  return shell('دليل المستشارين والكوتشز', 'قائمة قابلة للبحث والفرز والتصفية مع صفحات مستقلة وتفاصيل عميقة لكل مزود خدمة.', `
    ${listToolbar({ placeholder: 'ابحث بالاسم أو التخصص أو المدينة', filters: specialties, activeFilter, activeSort, sorts: [{ value: 'rating', label: 'الأعلى تقييماً' }, { value: 'price', label: 'الأقل سعراً' }, { value: 'experience', label: 'الأكثر خبرة' }] })}
    <div class="mt-6 grid gap-5 md:grid-cols-2">${visible.length ? visible.map(coachCard).join('') : emptyState('لا يوجد مستشارون متاحون حالياً')}</div>
    ${pagination(pages)}
  `, 'حجز الأطباء بصيغة الكوتشينج');
}

function coachCard(coach) {
  return `<article class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
    <div class="flex gap-4"><div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-mint to-sand text-3xl font-display font-extrabold text-moss">${coach.image}</div>
      <div class="flex-1"><div class="flex flex-wrap items-start justify-between gap-2"><div><h3 class="font-display text-xl font-extrabold text-moss">${coach.name}</h3><p class="font-bold text-ink/60">${coach.specialty} · ${coach.city}</p></div><span class="rounded-full bg-sand/70 px-3 py-1 text-xs font-extrabold text-moss">★ ${coach.rating}</span></div>
      <p class="mt-3 text-sm leading-7 text-ink/60">${coach.badge} · خبرة ${coach.experience} سنوات · أقرب موعد ${coach.next}</p></div></div>
    <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-moss/10 pt-4"><b class="text-moss">${coach.price} ر.س / جلسة</b><div class="flex gap-2"><button onclick="openCoach(${coach.id})" class="table-action rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-moss">عرض</button><button onclick="bookCoach(${coach.id})" class="table-action rounded-2xl bg-moss px-4 py-2 text-sm font-extrabold text-white">حجز</button></div></div>
  </article>`;
}

function pagination(pages) {
  if (pages <= 1) return '';
  const pageButtons = Array.from({ length: pages }, (_, index) => `<button type="button" onclick="setPage(${index + 1})" aria-label="الصفحة ${index + 1}" class="h-11 w-11 rounded-2xl font-extrabold transition ${state.page === index + 1 ? 'bg-moss text-white shadow-leaf' : 'bg-white/75 text-moss hover:-translate-y-1'}">${index + 1}</button>`).join('');
  return `<div class="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="ترقيم الصفحات"><button type="button" onclick="setPage(${Math.max(1, state.page - 1)})" class="rounded-2xl bg-white/75 px-4 py-3 font-extrabold text-moss transition hover:-translate-y-1">السابق</button>${pageButtons}<button type="button" onclick="setPage(${Math.min(pages, state.page + 1)})" class="rounded-2xl bg-white/75 px-4 py-3 font-extrabold text-moss transition hover:-translate-y-1">التالي</button></div>`;
}

function programsPage() {
  const categories = ['الكل', ...new Set(programs.map((program) => program.category))];
  const activeFilter = categories.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['title', 'price', 'duration'].includes(state.sort) ? state.sort : 'title';
  let list = programs
    .filter((program) => activeFilter === 'الكل' || program.category === activeFilter)
    .filter((program) => [program.title, program.type, program.category, program.level].some((value) => includesTerm(value, state.search)));
  list.sort((a, b) => (activeSort === 'price' ? a.price - b.price : activeSort === 'duration' ? parseDurationValue(a.duration) - parseDurationValue(b.duration) : a.title.localeCompare(b.title, 'ar')));
  const { pages, visible } = getPagedItems(list);
  return shell('المنتجات الرقمية التدريبية', 'مكتبة برامج وحقائب رقمية بأيقونة واضحة ومسارات قابلة للشراء أو الإهداء أو الإضافة لخطة المستفيد.', `
    ${listToolbar({ placeholder: 'ابحث باسم المنتج أو نوعه', filters: categories, activeFilter, activeSort, sorts: [{ value: 'title', label: 'ترتيب أبجدي' }, { value: 'price', label: 'الأقل سعراً' }, { value: 'duration', label: 'الأقصر مدة' }] })}
    <div class="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">${visible.length ? visible.map(programCard).join('') : emptyState('لا توجد منتجات رقمية حالياً')}</div>
    ${pagination(pages)}
  `, 'أيقونة المنتجات الرقمية');
}

function statusBadge(status = 'تم التفعيل') {
  const active = status === 'تم التفعيل';
  return `<span class="rounded-full ${active ? 'bg-mint text-moss' : 'bg-sand text-clay'} px-3 py-1 text-xs font-extrabold">${escapeHTML(status)}</span>`;
}

function programCard(program) {
  return `<article class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
    <div class="mb-5 flex items-start justify-between gap-3"><span class="flex h-16 w-16 items-center justify-center rounded-3xl bg-mint text-3xl">${program.icon}</span>${statusBadge(program.status)}</div>
    <p class="text-xs font-extrabold text-clay">${program.type}</p>
    <h3 class="mt-2 font-display text-xl font-extrabold text-moss">${program.title}</h3>
    <p class="mt-3 leading-7 text-ink/62">${program.outcome}</p>
    <div class="mt-4 flex flex-wrap gap-2 text-xs font-bold text-ink/60"><span class="rounded-full bg-sand/70 px-3 py-1">${program.duration}</span><span class="rounded-full bg-sand/70 px-3 py-1">${program.level}</span><span class="rounded-full bg-sand/70 px-3 py-1">${program.category}</span></div>
    <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-moss/10 pt-4"><b class="text-moss">${program.price} ر.س</b><div class="flex flex-wrap gap-2"><button onclick="navigate('/programs/${program.id}')" class="table-action rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-moss">عرض</button><button onclick="showToast('تمت إضافة ${program.title} إلى السلة')" class="table-action rounded-2xl bg-moss px-4 py-2 text-sm font-extrabold text-white">إضافة</button><button onclick="showToast('تم فتح تعديل المنتج')" class="table-action rounded-2xl bg-sand px-4 py-2 text-sm font-extrabold text-moss">تعديل</button><button onclick="showToast('تم حذف المنتج من القائمة')" class="table-action rounded-2xl bg-red-50 px-4 py-2 text-sm font-extrabold text-red-700">حذف</button></div></div>
  </article>`;
}

function catalogPage(config) {
  const categories = ['الكل', ...new Set(config.items.map((item) => item.category))];
  const activeFilter = categories.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['title', 'price', 'duration'].includes(state.sort) ? state.sort : 'title';
  let list = config.items
    .filter((item) => activeFilter === 'الكل' || item.category === activeFilter)
    .filter((item) => [item.title, item.category, item.level, item.format, item.audience, item.age].filter(Boolean).some((value) => includesTerm(value, state.search)));
  list.sort((a, b) => (activeSort === 'price' ? a.price - b.price : activeSort === 'duration' ? parseDurationValue(a.duration) - parseDurationValue(b.duration) : a.title.localeCompare(b.title, 'ar')));
  const { pages, visible } = getPagedItems(list);
  return shell(config.title, config.subtitle, `
    ${listToolbar({ placeholder: 'ابحث باسم البرنامج أو الفئة', filters: categories, activeFilter, activeSort, sorts: [{ value: 'title', label: 'ترتيب أبجدي' }, { value: 'price', label: 'الأقل تكلفة' }, { value: 'duration', label: 'الأقصر مدة' }] })}
    <div class="mt-6 grid gap-5 md:grid-cols-2">${visible.length ? visible.map((item) => catalogCard(item, config.route, config.actionLabel)).join('') : emptyState('لا توجد عناصر حالياً')}</div>
    ${pagination(pages)}
  `, config.eyebrow);
}

function catalogCard(item, route, actionLabel) {
  return `<article class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
    <div class="flex items-start gap-4"><span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-mint text-3xl">${item.icon}</span><div class="flex-1"><div class="flex flex-wrap items-start justify-between gap-2"><p class="text-xs font-extrabold text-clay">${item.category}</p>${statusBadge(item.status)}</div><h3 class="mt-2 font-display text-xl font-extrabold text-moss">${item.title}</h3><p class="mt-3 leading-7 text-ink/62">${item.outcome}</p></div></div>
    <div class="mt-5 flex flex-wrap gap-2 text-xs font-bold text-ink/60"><span class="rounded-full bg-sand/70 px-3 py-1">${item.duration}</span><span class="rounded-full bg-sand/70 px-3 py-1">${item.level}</span><span class="rounded-full bg-sand/70 px-3 py-1">${item.audience || item.age}</span><span class="rounded-full bg-sand/70 px-3 py-1">${item.format}</span></div>
    <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-moss/10 pt-4"><b class="text-moss">${Number(item.price || 0).toLocaleString('ar-SA')} ر.س</b><div class="flex gap-2"><button onclick="navigate('${route}/${item.id}')" class="table-action rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-moss">عرض</button><button onclick="showToast('${actionLabel}: ${item.title}')" class="table-action rounded-2xl bg-moss px-4 py-2 text-sm font-extrabold text-white">${actionLabel}</button></div></div>
  </article>`;
}

function childrenProgramsPage() { return catalogPage({ route: '/children-programs', items: childrenPrograms, title: 'البرامج النمائية والسلوكية للأطفال', subtitle: 'مسارات متخصصة للأطفال والمراهقين تجمع بين التقييم، تدريب المهارات، تعديل السلوك، وإرشاد الوالدين بخطط متابعة واضحة.', eyebrow: 'برامج الأطفال', actionLabel: 'طلب الخطة' }); }
function coursesPage() { return catalogPage({ route: '/courses', items: courses, title: 'البرامج والدورات', subtitle: 'دورات وبرامج تدريبية مباشرة ومسجلة للأفراد والأسر والممارسين، مع خيارات فرز وتصفية حسب المجال والمستوى والتكلفة.', eyebrow: 'تعلم وتطوير', actionLabel: 'تسجيل' }); }
function leadershipProgramsPage() { return catalogPage({ route: '/leadership-programs', items: leadershipPrograms, title: 'البرامج القيادية للجهات والمنظمات', subtitle: 'حلول تطوير قيادي وتشخيص ثقافة وبناء فرق مصممة للجهات والمنظمات مع مخرجات تنفيذية قابلة للقياس.', eyebrow: 'حلول مؤسسية', actionLabel: 'طلب عرض' }); }

function catalogDetailPage(item, route, eyebrow, ctaLabel) {
  if (!item) return notFoundPage();
  const format = item.format || item.type || 'مسار رقمي';
  const audience = item.audience || item.age || item.level;
  return shell(item.title, `${item.category} · ${item.duration} · ${item.level}`, `
    <div class="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm"><div class="mb-4 flex items-start justify-between gap-3"><span class="flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-mint text-4xl">${item.icon}</span>${statusBadge(item.status)}</div><h3 class="font-display text-2xl font-extrabold text-moss">مخرجات البرنامج</h3><p class="mt-4 leading-9 text-ink/65">${item.outcome}. يتضمن المسار جلسة تعريفية، مواد تطبيقية، ومتابعة تقدم لضمان انتقال الأثر إلى الحياة اليومية أو بيئة العمل.</p><div class="mt-6 flex flex-wrap gap-2 text-sm font-bold text-ink/60"><span class="rounded-full bg-sand/70 px-4 py-2">${format}</span><span class="rounded-full bg-sand/70 px-4 py-2">${audience}</span><span class="rounded-full bg-sand/70 px-4 py-2">${Number(item.price || 0).toLocaleString('ar-SA')} ر.س</span></div></div>
      <div class="rounded-[2rem] bg-moss p-6 text-white shadow-calm"><h3 class="font-display text-2xl font-extrabold">إجراءات البرنامج</h3><div class="mt-5 grid gap-3"><button onclick="showToast('${ctaLabel}: ${item.title}')" class="rounded-2xl bg-white px-5 py-3 font-extrabold text-moss transition hover:-translate-y-1">${ctaLabel}</button><button onclick="showToast('تم فتح نموذج تعديل البرنامج')" class="rounded-2xl bg-white/10 px-5 py-3 font-extrabold text-white transition hover:-translate-y-1">تعديل</button><button onclick="showToast('تم نسخ رابط الصفحة')" class="rounded-2xl bg-white/10 px-5 py-3 font-extrabold text-white transition hover:-translate-y-1">نسخ الرابط</button><button onclick="showToast('تم أرشفة البرنامج')" class="rounded-2xl bg-red-50 px-5 py-3 font-extrabold text-red-700 transition hover:-translate-y-1">حذف</button></div><a href="${route}" data-route="${route}" class="mt-6 inline-flex rounded-2xl border border-white/20 px-5 py-3 font-extrabold text-white">العودة للقائمة</a></div>
    </div>
  `, eyebrow);
}

function assessmentsPage() {
  const categories = ['الكل', ...new Set(assessments.map((assessment) => assessment.category))];
  const activeFilter = categories.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['name', 'questions', 'accuracy'].includes(state.sort) ? state.sort : 'name';
  let list = assessments
    .filter((assessment) => activeFilter === 'الكل' || assessment.category === activeFilter)
    .filter((assessment) => [assessment.name, assessment.category, assessment.report].some((value) => includesTerm(value, state.search)));
  list.sort((a, b) => (activeSort === 'questions' ? b.questions - a.questions : activeSort === 'accuracy' ? Number.parseFloat(b.accuracy) - Number.parseFloat(a.accuracy) : a.name.localeCompare(b.name, 'ar')));
  const { pages, visible } = getPagedItems(list);
  return shell('برامج المقاييس الشخصية والنفسية', 'مقاييس منظمة للمستفيدين ومزودي الخدمة، مع تصنيف واضح وتقرير مهني قابل للإصدار بعد الإكمال.', `
    ${listToolbar({ placeholder: 'ابحث باسم المقياس أو التقرير', filters: categories, activeFilter, activeSort, sorts: [{ value: 'name', label: 'ترتيب أبجدي' }, { value: 'questions', label: 'الأكثر أسئلة' }, { value: 'accuracy', label: 'الأعلى دقة' }] })}
    <div class="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-calm">
      <div class="overflow-x-auto"><table class="w-full min-w-[720px] text-right"><thead class="bg-mint/70 text-sm text-moss"><tr><th class="p-4">المقياس</th><th class="p-4">الفئة</th><th class="p-4">الأسئلة</th><th class="p-4">دقة معيارية</th><th class="p-4">إجراءات CRUD</th></tr></thead><tbody>${visible.map(assessmentRow).join('')}</tbody></table>${visible.length ? '' : emptyState('لا توجد مقاييس حالياً')}</div>
    </div>
    ${pagination(pages)}
  `, 'مقاييس بتقارير احترافية');
}

function assessmentRow(assessment) {
  return `<tr class="border-t border-moss/10"><td class="p-4 font-bold text-moss">${assessment.name}<p class="text-sm font-normal text-ink/55">${assessment.report}</p></td><td class="p-4">${assessment.category}</td><td class="p-4">${assessment.questions}</td><td class="p-4">${assessment.accuracy}</td><td class="p-4"><div class="flex gap-2"><button onclick="showToast('بدء ${assessment.name}')" class="table-action rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white">بدء</button><button onclick="showToast('تم فتح تحرير المقياس')" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل</button><button onclick="showToast('تم نسخ رابط المقياس')" class="table-action rounded-xl bg-sand px-3 py-2 text-xs font-bold text-moss">نسخ</button><button onclick="showToast('تم أرشفة المقياس')" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></td></tr>`;
}

function reportsPage() {
  return shell('إصدار التقارير الاحترافية', 'نموذج بصري لتقارير Adrek: ملخص تنفيذي، درجات المقاييس، توصيات الجلسة، وخطة متابعة قابلة للطباعة.', `
    <div class="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <div class="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm"><h3 class="font-display text-2xl font-extrabold text-moss">مكونات التقرير</h3><div class="mt-5 space-y-3">${['ملخص تنفيذي بلغة واضحة', 'رسم تقدم ودرجات معيارية', 'توصيات عملية لمدة 14 يوم', 'ملاحظات المختص وسجل الجلسات', 'رابط مشاركة آمن وصلاحيات'].map((item, index) => `<div class="flex items-center gap-3 rounded-2xl bg-mint/55 p-4"><span class="flex h-8 w-8 items-center justify-center rounded-full bg-moss text-sm font-bold text-white">${index + 1}</span><b>${item}</b></div>`).join('')}</div></div>
      <div class="rounded-[2.2rem] bg-moss p-3 shadow-calm"><div class="rounded-[1.8rem] bg-[#fbf7ed] p-6"><div class="flex justify-between"><div><p class="text-sm font-bold text-ink/55">تقرير Adrek المهني</p><h3 class="font-display text-3xl font-extrabold text-moss">ملف الاتزان النفسي</h3></div><span class="rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-moss">PDF</span></div><div class="mt-6 grid gap-3 sm:grid-cols-3">${stat('82%', 'مرونة نفسية')}${stat('68%', 'إدارة ضغط')}${stat('91%', 'وعي ذاتي')}</div><div class="mt-6 rounded-3xl bg-white p-5"><h4 class="font-display font-extrabold text-moss">توصية مختصرة</h4><p class="mt-2 leading-8 text-ink/65">جلسة متابعة أسبوعية مع برنامج صوتي لإدارة الضغط وتمرين تدوين يومي.</p></div></div></div>
    </div>
  `, 'تقارير قابلة للإصدار');
}

function joinProviderPage() {
  return shell('انضم كمزود خدمة', 'مسار احترافي للمدربين والمستشارين: ملف تعريفي، اعتماد، إدارة مواعيد، منتجات رقمية، وتقارير للمستفيدين.', `
    <div class="grid gap-6 lg:grid-cols-2"><form class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); showToast('تم إرسال طلب الانضمام بنجاح')"><div class="grid gap-4"><input required placeholder="الاسم الكامل" class="rounded-2xl border border-moss/10 px-4 py-3"><input required placeholder="البريد المهني" class="rounded-2xl border border-moss/10 px-4 py-3"><select class="rounded-2xl border border-moss/10 px-4 py-3"><option>كوتشينج مهني</option><option>إرشاد نفسي</option><option>إرشاد أسري</option><option>تطوير ذات</option></select><textarea placeholder="نبذة عن خبرتك وشهاداتك" class="min-h-32 rounded-2xl border border-moss/10 px-4 py-3"></textarea><button class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1">إرسال الطلب</button></div></form><div class="space-y-4">${['إدارة جدول ومواعيد مرنة', 'بيع المنتجات الرقمية والحقائب', 'إصدار تقارير للمستفيدين', 'صفحة عامة قابلة للمشاركة'].map((item, index) => `<div class="card-hover rounded-[2rem] border border-white/70 bg-white/65 p-5"><span class="text-sm font-extrabold text-clay">ميزة ${index + 1}</span><h3 class="mt-2 font-display text-xl font-extrabold text-moss">${item}</h3></div>`).join('')}</div></div>
  `, 'للمزودين');
}

function dashboardReportsPage() {
  const statuses = ['الكل', ...new Set(reports.map((report) => report.status))];
  const activeFilter = statuses.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['date', 'progress', 'client'].includes(state.sort) ? state.sort : 'date';
  let list = reports
    .filter((report) => activeFilter === 'الكل' || report.status === activeFilter)
    .filter((report) => [report.id, report.client, report.type, report.status].some((value) => includesTerm(value, state.search)));
  list.sort((a, b) => (activeSort === 'progress' ? b.progress - a.progress : activeSort === 'client' ? a.client.localeCompare(b.client, 'ar') : new Date(b.date) - new Date(a.date)));
  const { pages, visible } = getPagedItems(list);
  return shell('لوحة التقارير وإدارة المحتوى', 'جدول تقارير يحتوي على إجراءات عرض وتعديل وإصدار وحذف، مع متابعة حالة التقرير وتقدم المستفيد.', `
    ${listToolbar({ placeholder: 'ابحث برقم التقرير أو المستفيد', filters: statuses, activeFilter, activeSort, sorts: [{ value: 'date', label: 'الأحدث تاريخاً' }, { value: 'progress', label: 'الأعلى تقدماً' }, { value: 'client', label: 'اسم المستفيد' }] })}
    <div class="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-calm"><div class="overflow-x-auto"><table class="w-full min-w-[760px] text-right"><thead class="bg-moss text-sm text-white"><tr><th class="p-4">رقم التقرير</th><th class="p-4">المستفيد</th><th class="p-4">النوع</th><th class="p-4">التاريخ</th><th class="p-4">التقدم</th><th class="p-4">الحالة</th><th class="p-4">إجراءات CRUD</th></tr></thead><tbody>${visible.map(reportRow).join('')}</tbody></table>${visible.length ? '' : emptyState('لا توجد تقارير حالياً')}</div></div>
    ${pagination(pages)}
  `, 'مسار عميق /dashboard/reports');
}

function reportRow(report) {
  return `<tr class="border-t border-moss/10"><td class="p-4 font-bold text-moss">${report.id}</td><td class="p-4">${report.client}</td><td class="p-4">${report.type}</td><td class="p-4">${report.date}</td><td class="p-4"><div class="h-2 w-28 rounded-full bg-mint"><div class="progress-wave h-2 rounded-full" style="width:${report.progress}%"></div></div></td><td class="p-4"><span class="rounded-full bg-sand/70 px-3 py-1 text-xs font-bold text-moss">${report.status}</span></td><td class="p-4"><div class="flex gap-2"><button onclick="showToast('عرض ${report.id}')" class="table-action rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white">عرض</button><button onclick="showToast('تحرير ${report.id}')" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل</button><button onclick="showToast('إصدار PDF')" class="table-action rounded-xl bg-sand px-3 py-2 text-xs font-bold text-moss">إصدار</button><button onclick="showToast('تم حذف المسودة')" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></td></tr>`;
}

function bookingPage() {
  return shell('حجز جلسة جديدة', 'نموذج حجز سريع يربط المستفيد بالمختص المناسب مع اختيار نوع الجلسة والوقت.', `
    <form class="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); showToast('تم تأكيد طلب الحجز')"><div class="grid gap-4 md:grid-cols-2"><select class="rounded-2xl border border-moss/10 px-4 py-3"><option>إرشاد نفسي</option><option>كوتشينج مهني</option><option>إرشاد أسري</option><option>تطوير ذات</option></select><select class="rounded-2xl border border-moss/10 px-4 py-3">${coaches.map((coach) => `<option>${coach.name}</option>`).join('')}</select><input type="date" class="rounded-2xl border border-moss/10 px-4 py-3"><input type="time" class="rounded-2xl border border-moss/10 px-4 py-3"><textarea class="min-h-32 rounded-2xl border border-moss/10 px-4 py-3 md:col-span-2" placeholder="ما الهدف من الجلسة؟"></textarea><button class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1 md:col-span-2">تأكيد الحجز</button></div></form>
  `, 'حجز آمن');
}

function loginPage() {
  return shell('تسجيل الدخول', 'دخول موحد للمستفيد ومزود الخدمة مع واجهة هادئة وواضحة.', `<form class="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); showToast('تم تسجيل الدخول تجريبياً')"><input placeholder="البريد الإلكتروني" class="mb-4 w-full rounded-2xl border border-moss/10 px-4 py-3"><input type="password" placeholder="كلمة المرور" class="mb-4 w-full rounded-2xl border border-moss/10 px-4 py-3"><button class="w-full rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1">دخول</button></form>`, 'حسابك');
}

function notFoundPage() {
  return shell('الصفحة غير موجودة', 'يمكنك العودة للصفحة الرئيسية أو اختيار أحد مسارات المنصة.', `<a href="/" data-route="/" class="inline-flex rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">العودة للرئيسية</a>`);
}

function render() {
  const base = state.route;
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', base === link.dataset.route || base.startsWith(`${link.dataset.route}/`)));

  if (state.loading) {
    app.innerHTML = loadingPage();
    bindDynamicControls();
    return;
  }

  if (state.loadError) {
    app.innerHTML = loadErrorPage();
    bindDynamicControls();
    return;
  }

  if (base.startsWith('/admin')) {
    app.innerHTML = adminPage();
  } else if (base.startsWith('/coaches/')) {
    const id = Number(base.split('/').pop());
    const coach = coaches.find((item) => item.id === id);
    app.innerHTML = coach
      ? shell(coach.name, `${coach.specialty} · ${coach.city} · تقييم ${coach.rating}`, `<div class="grid gap-6 lg:grid-cols-2"><div class="rounded-[2rem] bg-white/75 p-6 shadow-calm"><h3 class="font-display text-2xl font-extrabold text-moss">نبذة مهنية</h3><p class="mt-4 leading-8 text-ink/65">مختص بخبرة ${coach.experience} سنوات في ${coach.badge}. يقدم جلسات فردية وخطط متابعة وتقارير تقدم مختصرة.</p></div><div class="rounded-[2rem] bg-moss p-6 text-white"><h3 class="font-display text-2xl font-extrabold">أقرب موعد</h3><p class="mt-4 text-white/75">${coach.next}</p><button onclick="bookCoach(${coach.id})" class="mt-6 rounded-2xl bg-white px-5 py-3 font-extrabold text-moss transition hover:-translate-y-1">احجز الآن</button></div></div>`, 'صفحة تفصيلية')
      : notFoundPage();
  } else if (base.startsWith('/programs/')) {
    app.innerHTML = catalogDetailPage(programs.find((program) => program.id === Number(base.split('/').pop())), '/programs', 'صفحة عميقة للمنتجات الرقمية', 'إضافة للسلة');
  } else if (base.startsWith('/children-programs/')) {
    app.innerHTML = catalogDetailPage(childrenPrograms.find((program) => program.id === Number(base.split('/').pop())), '/children-programs', 'صفحة عميقة لبرامج الأطفال', 'طلب الخطة');
  } else if (base.startsWith('/courses/')) {
    app.innerHTML = catalogDetailPage(courses.find((course) => course.id === Number(base.split('/').pop())), '/courses', 'صفحة عميقة للبرامج والدورات', 'تسجيل');
  } else if (base.startsWith('/leadership-programs/')) {
    app.innerHTML = catalogDetailPage(leadershipPrograms.find((program) => program.id === Number(base.split('/').pop())), '/leadership-programs', 'صفحة عميقة للبرامج القيادية', 'طلب عرض');
  } else {
    app.innerHTML = ({ '/': homePage, '/coaches': coachesPage, '/programs': programsPage, '/children-programs': childrenProgramsPage, '/courses': coursesPage, '/leadership-programs': leadershipProgramsPage, '/assessments': assessmentsPage, '/reports': reportsPage, '/join-provider': joinProviderPage, '/dashboard/reports': dashboardReportsPage, '/booking': bookingPage, '/login': loginPage }[base] || notFoundPage)();
  }
  bindDynamicControls();
}

const debouncedRender = debounce(() => render());

function bindDynamicControls() {
  document.querySelectorAll('a[data-route]').forEach((link) => {
    link.onclick = (event) => {
      event.preventDefault();
      navigate(link.dataset.route);
      const navLinks = document.getElementById('navLinks');
      const menuToggle = document.getElementById('menuToggle');
      navLinks?.classList.add('hidden');
      menuToggle?.setAttribute('aria-expanded', 'false');
    };
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.oninput = (event) => { state.search = event.target.value.trim(); state.page = 1; debouncedRender(); };
  const filterSelect = document.getElementById('filterSelect');
  if (filterSelect) filterSelect.onchange = (event) => { state.filter = event.target.value; state.page = 1; render(); };
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.onchange = (event) => { state.sort = event.target.value; render(); };
}

function setPage(page) { state.page = page; render(); }
function openCoach(id) { navigate(`/coaches/${id}`); }
function bookCoach(id) {
  const coach = coaches.find((item) => item.id === id);
  if (!coach) return showToast('تعذر العثور على المختص المطلوب');
  showToast(`تم اختيار ${coach.name} للحجز`);
  setTimeout(() => navigate('/booking'), 600);
}

window.setPage = setPage;
window.openCoach = openCoach;
window.navigate = navigate;
window.bookCoach = bookCoach;
window.showToast = showToast;
window.adminCollections = adminCollections;
window.ADMIN_STATUS_OPTIONS = ADMIN_STATUS_OPTIONS;
window.OWNER_AUTH_KEY = OWNER_AUTH_KEY;
window.OWNER_PASSWORD_KEY = OWNER_PASSWORD_KEY;
window.OWNER_DEFAULT_PASSWORD = OWNER_DEFAULT_PASSWORD;
window.OWNER_USERNAME = OWNER_USERNAME;

window.addEventListener('popstate', () => { state.route = getCurrentRoute(); render(); });
window.addEventListener('hashchange', () => {
  if (!canUseHistoryRouting) {
    state.route = getCurrentRoute();
    render();
  }
});

document.getElementById('menuToggle').addEventListener('click', (event) => {
  const navLinks = document.getElementById('navLinks');
  const isHidden = navLinks.classList.toggle('hidden');
  event.currentTarget.setAttribute('aria-expanded', String(!isHidden));
});

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});
