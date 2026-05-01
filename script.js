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
const OWNER_TOKEN_KEY = 'adrek-owner-token';
const OWNER_USERNAME = 'admin';
const ADMIN_STATUS_OPTIONS = ['تم التفعيل', 'قريبا'];
const BOOKING_STORAGE_KEY = 'adrek-confirmed-bookings';
const PAYMENT_STORAGE_KEY = 'adrek-booking-payments';
const BOOKING_NOTIFICATIONS_KEY = 'adrek-booking-whatsapp-notifications';
const PAYMENT_CONFIRM_WINDOW_HOURS = 2;
const OWNER_WHATSAPP_NUMBER = '+966562777284';
const BOOKING_OWNER_CONFIRM_STATUS = 'بانتظار اعتماد المالك';
const BOOKING_READY_FOR_PAYMENT_STATUS = 'مؤكد من المالك بانتظار الدفع';
const BOOKING_ALTERNATIVE_STATUS = 'وقت بديل مقترح';
const BOOKING_PAID_STATUS = 'مدفوع ومؤكد نهائياً';
const BOOKING_METHODS = [
  { id: 'video', label: 'جلسة مرئية', icon: '🎥', description: 'رابط اجتماع آمن يرسل بعد التأكيد مع تذكير قبل الموعد.' },
  { id: 'voice', label: 'اتصال فقط', icon: '📞', description: 'اتصال صوتي خاص لمن يفضل الخصوصية أو ضعف الاتصال المرئي.' }
];
const BOOKING_SESSION_TYPES = ['إرشاد نفسي', 'كوتشينج مهني', 'إرشاد أسري', 'تطوير ذات', 'كوتشينج علاقات'];
const BOOKING_TIME_SLOTS = ['09:00', '10:30', '12:00', '16:00', '17:30', '19:00', '20:30'];
const PAYMENT_METHODS = [
  { id: 'mada', label: 'بطاقة مدى', icon: '💳', note: 'خصم فوري عبر شبكة مدى مع إيصال إلكتروني.' },
  { id: 'visa', label: 'فيزا / ماستر كارد', icon: '💳', note: 'دفع آمن بالبطاقات الائتمانية والمدينة.' },
  { id: 'apple-pay', label: 'Apple Pay', icon: '', note: 'تأكيد سريع عبر المحفظة الرقمية عند توفرها.' }
];
const DEFAULT_PAYMENT_DRAFT = {
  method: 'mada',
  cardholder: '',
  number: '',
  expiry: '',
  cvv: '',
  saveCard: false
};
const PAYMENT_VAT_RATE = 0.15;
const DEFAULT_BOOKING_DRAFT = {
  sessionType: 'إرشاد نفسي',
  coachId: '',
  date: '',
  time: '',
  method: 'video',
  clientName: '',
  phone: '',
  email: '',
  goal: '',
  reminder: 'رسالة واتساب قبل 24 ساعة',
  agreement: false
};

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
  loadError: '',
  adminDataLoaded: false,
  adminLoading: false,
  bookingStep: 1,
  booking: { ...DEFAULT_BOOKING_DRAFT },
  bookingConfirmation: null,
  payment: { ...DEFAULT_PAYMENT_DRAFT },
  paymentProcessing: false,
  discovery: { answers: {}, result: null }
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
window.adrekState = state;
window.adrekCollections = { coaches, assessments };

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

function clearProtectedCollections() {
  if (typeof platformSettings !== 'undefined') replaceCollectionContents(platformSettings, []);
  if (typeof ownerPhrases !== 'undefined') replaceCollectionContents(ownerPhrases, []);
  if (typeof supportTickets !== 'undefined') replaceCollectionContents(supportTickets, []);
  state.adminDataLoaded = false;
  state.adminLoading = false;
}

function getAdminToken() {
  return adrekStorage.session.getItem(OWNER_TOKEN_KEY) || '';
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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
    headers: { 'x-owner-token': getAdminToken() },
    body: JSON.stringify({ items })
  });
  updateCollectionReference(key, response.items || items);
  return response.items || items;
}

function applyBootstrap(payload = {}) {
  const collections = payload.collections || {};
  Object.entries(bootstrapCollections).forEach(([key, list]) => replaceCollectionContents(list, collections[key]));
  if (typeof platformSettings !== 'undefined' && collections.platformSettings) replaceCollectionContents(platformSettings, collections.platformSettings);
  if (typeof ownerPhrases !== 'undefined' && collections.phrases) replaceCollectionContents(ownerPhrases, collections.phrases);
  if (typeof supportTickets !== 'undefined' && collections.supportTickets) replaceCollectionContents(supportTickets, collections.supportTickets);
}

async function initializeApp() {
  state.loading = true;
  state.loadError = '';
  clearProtectedCollections();
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
  async saveCollection(key, items) {
    return saveCollection(key, items);
  },
  setAdminToken(token) {
    adrekStorage.session.setItem(OWNER_TOKEN_KEY, token);
  },
  clearAdminToken() {
    adrekStorage.session.removeItem(OWNER_TOKEN_KEY);
    clearProtectedCollections();
  },
  hasAdminToken() {
    return Boolean(getAdminToken());
  },
  loginOwner(username, password) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  changeOwnerPassword(oldPassword, newPassword) {
    return apiRequest('/api/auth/password', {
      method: 'POST',
      headers: { 'x-owner-token': getAdminToken() },
      body: JSON.stringify({ oldPassword, newPassword })
    });
  },
  async loadAdminData() {
    const payload = await apiRequest('/api/admin/bootstrap', {
      headers: { 'x-owner-token': getAdminToken() }
    });
    applyBootstrap(payload);
    state.adminDataLoaded = true;
    return payload;
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
          <a data-route="/discover" href="/discover" class="soft-button rounded-2xl border border-moss/15 bg-white/70 px-7 py-4 text-center font-extrabold text-moss">اكتشف نفسك أولاً (اختياري)</a>
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

function getStoredBookings() {
  try { const value = JSON.parse(adrekStorage.local.getItem(BOOKING_STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch (error) { return []; }
}
function saveStoredBookings(items) { adrekStorage.local.setItem(BOOKING_STORAGE_KEY, JSON.stringify(items.slice(0, 30))); }
function getStoredPayments() {
  try { const value = JSON.parse(adrekStorage.local.getItem(PAYMENT_STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch (error) { return []; }
}
function saveStoredPayments(items) { adrekStorage.local.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(items.slice(0, 30))); }
function getStoredBookingNotifications() {
  try { const value = JSON.parse(adrekStorage.local.getItem(BOOKING_NOTIFICATIONS_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch (error) { return []; }
}
function saveStoredBookingNotifications(items) { adrekStorage.local.setItem(BOOKING_NOTIFICATIONS_KEY, JSON.stringify(items.slice(0, 120))); }
function addBookingNotification(bookingId, recipientType, recipient, message, messageType = 'whatsapp') {
  const notification = { id: `NT-${Date.now().toString().slice(-7)}-${Math.floor(Math.random() * 900 + 100)}`, bookingId, recipientType, recipient, channel: 'WhatsApp', messageType, message, status: 'جاهز للإرسال', createdAt: new Date().toISOString() };
  saveStoredBookingNotifications([notification, ...getStoredBookingNotifications()]);
  return notification;
}
function bookingNotifications(bookingId, recipientType = '') {
  return getStoredBookingNotifications().filter((item) => String(item.bookingId) === String(bookingId) && (!recipientType || item.recipientType === recipientType));
}
function findBookingById(id) { return getStoredBookings().find((booking) => String(booking.id) === String(id)) || null; }
function findPaymentByBookingId(id) { return getStoredPayments().find((payment) => String(payment.bookingId) === String(id) && payment.status === 'paid') || null; }
function paymentDeadlineFromNow() { return new Date(Date.now() + PAYMENT_CONFIRM_WINDOW_HOURS * 60 * 60 * 1000).toISOString(); }
function isPaymentWindowOpen(booking) { return !booking?.paymentDeadline || new Date(booking.paymentDeadline).getTime() >= Date.now(); }
function updateStoredBookingStatus(id, status, payment = null, extras = {}) {
  const bookings = getStoredBookings();
  const index = bookings.findIndex((booking) => String(booking.id) === String(id));
  if (index < 0) return null;
  bookings[index] = { ...bookings[index], ...extras, status, paymentStatus: payment?.status || extras.paymentStatus || bookings[index].paymentStatus || 'pending', paymentId: payment?.transactionId || bookings[index].paymentId || '', paidAt: payment?.paidAt || bookings[index].paidAt || '' };
  saveStoredBookings(bookings);
  return bookings[index];
}
function ownerConfirmBooking(id, overrides = {}) {
  const booking = findBookingById(id);
  if (!booking) return showToast('تعذر العثور على الحجز');
  const confirmedAt = new Date().toISOString();
  const updated = updateStoredBookingStatus(id, BOOKING_READY_FOR_PAYMENT_STATUS, null, { ...overrides, confirmedAt, paymentDeadline: paymentDeadlineFromNow(), paymentStatus: 'pending' });
  addBookingNotification(id, 'client', updated.phone, `تم تأكيد حجزك رقم ${id} مع ${updated.coachName} بتاريخ ${formatBookingDate(updated.date)} الساعة ${updated.time}. لإتمام الدفع لديك ساعتان فقط حتى ${new Date(updated.paymentDeadline).toLocaleString('ar-SA')}.`, 'client-confirmed');
  showToast('تم تأكيد الحجز وإرسال رسالة واتساب للعميل');
  render();
}
function ownerSuggestBookingAlternative(id, alternativeDate, alternativeTime, note = '') {
  const booking = findBookingById(id);
  if (!booking) return showToast('تعذر العثور على الحجز');
  if (!alternativeDate || !alternativeTime) return showToast('حدد تاريخ ووقت بديلين');
  const updated = updateStoredBookingStatus(id, BOOKING_ALTERNATIVE_STATUS, null, { alternativeDate, alternativeTime, alternativeNote: note, paymentStatus: 'pending' });
  addBookingNotification(id, 'client', updated.phone, `تم اقتراح وقت بديل لحجزك رقم ${id} مع ${updated.coachName}: ${formatBookingDate(alternativeDate)} الساعة ${alternativeTime}. يمكنك قبول المقترح من صفحة التأكيد.`, 'client-alternative');
  showToast('تم إرسال اقتراح الوقت البديل للعميل عبر واتساب');
  render();
}
function acceptSuggestedBooking(id) {
  const booking = findBookingById(id);
  if (!booking || booking.status !== BOOKING_ALTERNATIVE_STATUS) return showToast('لا يوجد وقت بديل قابل للقبول');
  ownerConfirmBooking(id, { date: booking.alternativeDate, time: booking.alternativeTime, acceptedAlternativeAt: new Date().toISOString() });
  navigate('/booking/confirmation');
}
function deleteStoredBooking(id) {
  saveStoredBookings(getStoredBookings().filter((booking) => String(booking.id) !== String(id)));
  saveStoredBookingNotifications(getStoredBookingNotifications().filter((item) => String(item.bookingId) !== String(id)));
  showToast('تم حذف الحجز من سجل المالك');
  render();
}
function viewStoredBooking(id) {
  const booking = findBookingById(id);
  if (!booking) return showToast('تعذر العثور على الحجز');
  state.bookingConfirmation = booking;
  navigate('/booking/confirmation');
}
function bookingCoach() { return coaches.find((coach) => String(coach.id) === String(state.booking.coachId)) || null; }
function bookingMethod() { return BOOKING_METHODS.find((method) => method.id === state.booking.method) || BOOKING_METHODS[0]; }
function formatBookingDate(value, compact = false) {
  if (!value) return 'لم يحدد بعد';
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('ar-SA', compact ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function bookingDates() {
  const dates = [];
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  while (dates.length < 10) { date.setDate(date.getDate() + 1); if (date.getDay() !== 5) dates.push(new Date(date)); }
  return dates;
}
function bookingSlots(coachId, date) {
  const reserved = getStoredBookings().filter((item) => String(item.coachId) === String(coachId) && item.date === date).map((item) => item.time);
  return BOOKING_TIME_SLOTS.map((time, index) => ({ time, disabled: (index + (Number(coachId) || 1)) % 5 === 0 || reserved.includes(time) }));
}
function calculatePaymentTotals(price = 0) {
  const subtotal = Number(price) || 0;
  const vat = Math.round(subtotal * PAYMENT_VAT_RATE * 100) / 100;
  return { subtotal, vat, total: Math.round((subtotal + vat) * 100) / 100 };
}
function formatCurrency(value = 0) { return `${Number(value || 0).toLocaleString('ar-SA')} ر.س`; }
function maskCardNumber(value = '') { return String(value).replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19); }
function paymentMethod() { return PAYMENT_METHODS.find((method) => method.id === state.payment.method) || PAYMENT_METHODS[0]; }
function updatePaymentField(field, value) {
  state.payment[field] = field === 'saveCard' ? Boolean(value) : field === 'number' ? maskCardNumber(value) : value;
  render();
}
function bookingStepError(step) {
  const draft = state.booking;
  if (step >= 2 && (!draft.sessionType || !draft.coachId)) return 'اختر نوع الاستشارة والمختص أولاً.';
  if (step >= 3 && (!draft.date || !draft.time)) return 'حدد اليوم والوقت المناسبين.';
  if (step >= 4 && (!draft.clientName.trim() || !draft.phone.trim() || !draft.email.trim() || !draft.agreement)) return 'أكمل بيانات التواصل ووافق على سياسة الحجز.';
  return '';
}
function setBookingStep(step) {
  const error = bookingStepError(step - 1);
  if (error) return showToast(error);
  state.bookingStep = Math.min(Math.max(step, 1), 4);
  render();
}
function updateBookingField(field, value) {
  state.booking[field] = field === 'agreement' ? Boolean(value) : value;
  if (field === 'sessionType') Object.assign(state.booking, { coachId: '', date: '', time: '' });
  if (field === 'coachId') { const coach = bookingCoach(); if (coach) state.booking.sessionType = coach.specialty; Object.assign(state.booking, { date: '', time: '' }); }
  render();
}
function chooseBookingSlot(date, time) { Object.assign(state.booking, { date, time }); state.bookingStep = 3; render(); }
function bookingPage() {
  const draft = state.booking;
  const coach = bookingCoach();
  const method = bookingMethod();
  const candidates = coaches.filter((item) => item.specialty === draft.sessionType || (draft.sessionType === 'تطوير ذات' && item.specialty.includes('تطوير')));
  const stepper = ['المختص', 'التاريخ والوقت', 'النوع والبيانات', 'التأكيد'].map((label, index) => `<button type="button" onclick="setBookingStep(${index + 1})" class="rounded-2xl px-4 py-3 font-extrabold ${state.bookingStep === index + 1 ? 'bg-moss text-white shadow-leaf' : 'bg-white/75 text-moss'}">${index + 1}. ${label}</button>`).join('');
  let body = '';
  if (state.bookingStep === 1) body = `<select onchange="updateBookingField('sessionType', this.value)" class="rounded-2xl border border-moss/10 bg-white px-4 py-3">${BOOKING_SESSION_TYPES.map((type) => `<option ${draft.sessionType === type ? 'selected' : ''}>${type}</option>`).join('')}</select><div class="mt-4 grid gap-3 md:grid-cols-2">${(candidates.length ? candidates : coaches).map((item) => `<button type="button" onclick="updateBookingField('coachId','${item.id}'); setBookingStep(2)" class="rounded-2xl border p-4 text-right ${String(draft.coachId) === String(item.id) ? 'border-moss bg-mint' : 'border-moss/10 bg-white'}"><b class="text-moss">${item.image} ${item.name}</b><p class="mt-1 text-sm text-ink/60">${item.specialty} · ★ ${item.rating} · ${item.price} ر.س</p></button>`).join('')}</div>`;
  if (state.bookingStep === 2) body = `<div class="grid gap-3 md:grid-cols-5">${bookingDates().map((date) => { const value = date.toISOString().slice(0, 10); return `<button onclick="state.booking.date='${value}'; state.booking.time=''; render()" class="rounded-2xl px-3 py-4 font-extrabold ${draft.date === value ? 'bg-moss text-white' : 'bg-white text-moss'}">${formatBookingDate(date, true)}</button>`; }).join('')}</div><div class="mt-5 grid gap-3 md:grid-cols-4">${draft.date ? bookingSlots(draft.coachId, draft.date).map((slot) => `<button ${slot.disabled ? 'disabled' : ''} onclick="chooseBookingSlot('${draft.date}','${slot.time}')" class="rounded-2xl px-4 py-3 font-extrabold ${slot.disabled ? 'bg-ink/10 text-ink/35' : draft.time === slot.time ? 'bg-moss text-white' : 'bg-mint text-moss'}">${slot.time}</button>`).join('') : '<p class="rounded-2xl bg-mint/55 p-4 font-bold text-ink/60">اختر تاريخاً لعرض الأوقات المتاحة.</p>'}</div>`;
  if (state.bookingStep === 3) body = `<div class="grid gap-3 md:grid-cols-2">${BOOKING_METHODS.map((item) => `<button onclick="updateBookingField('method','${item.id}')" class="rounded-2xl border p-4 text-right ${draft.method === item.id ? 'border-moss bg-mint' : 'border-moss/10 bg-white'}"><b class="text-moss">${item.icon} ${item.label}</b><p class="mt-1 text-sm text-ink/60">${item.description}</p></button>`).join('')}</div><div class="mt-5 grid gap-3 md:grid-cols-2"><input oninput="state.booking.clientName=this.value" value="${escapeHTML(draft.clientName)}" placeholder="الاسم الكامل" class="rounded-2xl border border-moss/10 px-4 py-3"><input oninput="state.booking.phone=this.value" value="${escapeHTML(draft.phone)}" placeholder="رقم الجوال" class="rounded-2xl border border-moss/10 px-4 py-3"><input oninput="state.booking.email=this.value" value="${escapeHTML(draft.email)}" placeholder="البريد الإلكتروني" class="rounded-2xl border border-moss/10 px-4 py-3"><select onchange="state.booking.reminder=this.value" class="rounded-2xl border border-moss/10 bg-white px-4 py-3"><option>رسالة واتساب قبل 24 ساعة</option><option>بريد إلكتروني قبل 24 ساعة</option><option>بدون تذكير</option></select><textarea oninput="state.booking.goal=this.value" class="min-h-28 rounded-2xl border border-moss/10 px-4 py-3 md:col-span-2" placeholder="ما الهدف من الجلسة؟">${escapeHTML(draft.goal)}</textarea></div><label class="mt-4 flex gap-3 rounded-2xl bg-mint/55 p-4 font-bold text-ink/70"><input type="checkbox" ${draft.agreement ? 'checked' : ''} onchange="state.booking.agreement=this.checked"> أوافق على سياسة الإلغاء والتعديل قبل 12 ساعة.</label>`;
  if (state.bookingStep === 4) body = `<div class="grid gap-3 md:grid-cols-2">${[['المختص', coach?.name || 'غير محدد'], ['نوع الاستشارة', draft.sessionType], ['الموعد', `${formatBookingDate(draft.date)} · ${draft.time || '-'}`], ['نوع الحجز', method.label], ['المستفيد', draft.clientName || '-'], ['التكلفة', coach ? `${coach.price} ر.س` : '-']].map(([label, value]) => `<div class="rounded-2xl bg-mint/55 p-4"><span class="text-xs font-extrabold text-ink/50">${label}</span><p class="mt-1 font-bold text-moss">${escapeHTML(value)}</p></div>`).join('')}</div><button onclick="confirmBooking()" class="mt-5 w-full rounded-2xl bg-moss px-6 py-4 font-extrabold text-white shadow-leaf">تأكيد الموعد وإصدار رقم الحجز</button>`;
  const summary = `<div class="rounded-[2rem] bg-moss p-6 text-white"><h3 class="font-display text-2xl font-extrabold">ملخص الحجز</h3><p class="mt-4">${coach ? escapeHTML(coach.name) : 'اختر المستشار'} · ${formatBookingDate(draft.date)} · ${draft.time || 'وقت غير محدد'}</p><p class="mt-2">${method.icon} ${method.label}</p></div>`;
  return shell('حجز جلسة احترافي عن بعد', 'آلية حجز كاملة: اختيار نوع الاستشارة والمختص، تحديد التاريخ والوقت، اختيار جلسة مرئية أو اتصال فقط، ثم تأكيد الموعد.', `<div class="mb-6 grid gap-3 md:grid-cols-4">${stepper}</div><div class="grid gap-6 lg:grid-cols-[1fr_22rem]"><div class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm">${body}<div class="mt-6 flex justify-between"><button onclick="setBookingStep(${Math.max(1, state.bookingStep - 1)})" class="rounded-2xl bg-white px-5 py-3 font-extrabold text-moss">السابق</button><button onclick="setBookingStep(${Math.min(4, state.bookingStep + 1)})" class="rounded-2xl bg-moss px-5 py-3 font-extrabold text-white">التالي</button></div></div>${summary}</div>`, 'مسار الحجز /booking');
}

function confirmBooking() {
  const error = bookingStepError(4);
  const coach = bookingCoach();
  if (error) return showToast(error);
  if (!coach) return showToast('اختر مختصاً متاحاً قبل التأكيد.');
  const item = { ...state.booking, id: `BK-${Date.now().toString().slice(-6)}`, coachId: coach.id, coachName: coach.name, price: coach.price, methodLabel: bookingMethod().label, status: BOOKING_OWNER_CONFIRM_STATUS, paymentStatus: 'pending', createdAt: new Date().toISOString() };
  saveStoredBookings([item, ...getStoredBookings()]);
  addBookingNotification(item.id, 'owner', OWNER_WHATSAPP_NUMBER, `طلب حجز جديد ${item.id}: ${item.clientName} مع ${item.coachName} (${item.sessionType}) بتاريخ ${formatBookingDate(item.date)} الساعة ${item.time}. يرجى تأكيد الحجز أو اقتراح وقت بديل للعميل.`, 'owner-request');
  addBookingNotification(item.id, 'client', item.phone, `مرحباً ${item.clientName}، استلمنا طلب حجزك رقم ${item.id} مع ${item.coachName}. سيقوم المالك بمراجعة الموعد وتأكيده أو اقتراح وقت بديل قريباً.`, 'client-received');
  state.bookingConfirmation = item;
  state.booking = { ...DEFAULT_BOOKING_DRAFT };
  state.bookingStep = 1;
  showToast('تم استلام طلب الحجز وإرسال رسائل واتساب');
  navigate('/booking/confirmation');
}

function resetBooking() {
  state.booking = { ...DEFAULT_BOOKING_DRAFT };
  state.bookingStep = 1;
  state.bookingConfirmation = null;
  navigate('/booking');
}

function paymentError(booking) {
  const draft = state.payment;
  if (!booking) return 'تعذر العثور على الحجز المطلوب للدفع.';
  if (findPaymentByBookingId(booking.id)) return 'تم دفع هذا الحجز مسبقاً.';
  if (booking.status !== BOOKING_READY_FOR_PAYMENT_STATUS) return 'ينتظر الحجز تأكيد المالك قبل الدفع.';
  if (!isPaymentWindowOpen(booking)) return 'انتهت مهلة الدفع خلال ساعتين من تأكيد الحجز.';
  if (!draft.method) return 'اختر وسيلة الدفع الإلكتروني.';
  if (!draft.cardholder.trim()) return 'اكتب اسم حامل البطاقة.';
  const digits = draft.number.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return 'أدخل رقم بطاقة صحيح.';
  if (!/^\d{2}\/\d{2}$/.test(draft.expiry.trim())) return 'أدخل تاريخ الانتهاء بصيغة MM/YY.';
  if (!/^\d{3,4}$/.test(draft.cvv.trim())) return 'أدخل رمز التحقق الصحيح.';
  return '';
}

async function processBookingPayment(bookingId) {
  const booking = findBookingById(bookingId) || (state.bookingConfirmation?.id === bookingId ? state.bookingConfirmation : null);
  const error = paymentError(booking);
  if (error) return showToast(error);
  const totals = calculatePaymentTotals(booking.price);
  const cardDigits = state.payment.number.replace(/\D/g, '');
  state.paymentProcessing = true;
  render();
  try {
    const response = await apiRequest('/api/payments/booking', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: booking.id,
        amount: totals.total,
        currency: 'SAR',
        method: state.payment.method,
        cardholder: state.payment.cardholder,
        last4: cardDigits.slice(-4),
        clientName: booking.clientName,
        email: booking.email
      })
    });
    const payment = { ...response.payment, bookingId: booking.id, methodLabel: paymentMethod().label, paidAt: response.payment?.paidAt || new Date().toISOString() };
    saveStoredPayments([payment, ...getStoredPayments().filter((item) => String(item.bookingId) !== String(booking.id))]);
    const updated = updateStoredBookingStatus(booking.id, BOOKING_PAID_STATUS, payment) || { ...booking, status: BOOKING_PAID_STATUS, paymentStatus: 'paid', paymentId: payment.transactionId, paidAt: payment.paidAt };
    state.bookingConfirmation = updated;
    state.payment = { ...DEFAULT_PAYMENT_DRAFT };
    showToast('تم الدفع الإلكتروني وتثبيت الحجز نهائياً');
    navigate('/booking/confirmation');
  } catch (error) {
    showToast(error.message || 'تعذر إتمام عملية الدفع.');
  } finally {
    state.paymentProcessing = false;
    render();
  }
}

function bookingPaymentPage(bookingId) {
  const booking = findBookingById(bookingId) || (state.bookingConfirmation?.id === bookingId ? state.bookingConfirmation : null);
  if (!booking) return shell('الحجز غير موجود', 'لا يمكن فتح صفحة الدفع دون رقم حجز مؤكد.', `<button onclick="resetBooking()" class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">بدء حجز جديد</button>`, 'دفع إلكتروني');
  const paidPayment = findPaymentByBookingId(booking.id);
  const totals = calculatePaymentTotals(booking.price);
  const methods = PAYMENT_METHODS.map((method) => `<button type="button" onclick="updatePaymentField('method','${method.id}')" class="rounded-2xl border p-4 text-right ${state.payment.method === method.id ? 'border-moss bg-mint' : 'border-moss/10 bg-white'}"><b class="text-moss">${method.icon} ${method.label}</b><p class="mt-1 text-sm text-ink/60">${method.note}</p></button>`).join('');
  if (booking.status !== BOOKING_READY_FOR_PAYMENT_STATUS && !paidPayment) return shell('الدفع بانتظار تأكيد المالك', 'سيظهر رابط الدفع بعد تأكيد المالك للموعد أو بعد قبولك للوقت البديل المقترح.', `<div class="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-calm"><span class="rounded-full bg-sand px-4 py-2 text-sm font-extrabold text-moss">${escapeHTML(booking.status)}</span><p class="mt-4 leading-8 text-ink/65">تم إرسال رسالة واتساب باستلام الطلب، وسيتم إشعارك برسالة ثانية عند التأكيد لإتمام الدفع خلال ساعتين.</p><button onclick="navigate('/booking/confirmation')" class="mt-5 rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">العودة للتأكيد</button></div>`, 'مسار عميق /booking/payment');
  if (!isPaymentWindowOpen(booking) && !paidPayment) return shell('انتهت مهلة الدفع', 'انتهت نافذة السداد المحددة بساعتين من وقت تأكيد المالك للحجز. يرجى طلب موعد جديد أو التواصل مع الدعم.', `<button onclick="resetBooking()" class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">بدء حجز جديد</button>`, 'مهلة الدفع');
  if (paidPayment) {
    return shell('تم الدفع مسبقاً', 'هذا الحجز مثبت ومدفوع إلكترونياً ويمكنك الرجوع لتفاصيل التأكيد.', `<div class="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-calm"><span class="rounded-full bg-mint px-4 py-2 text-sm font-extrabold text-moss">مدفوع</span><h2 class="mt-4 font-display text-3xl font-extrabold text-moss">${escapeHTML(paidPayment.transactionId)}</h2><p class="mt-3 text-ink/65">تم السداد بمبلغ ${formatCurrency(paidPayment.amount)}.</p><button onclick="navigate('/booking/confirmation')" class="mt-5 rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">العودة للتأكيد</button></div>`, 'مسار عميق /booking/payment');
  }
  return shell('الدفع الإلكتروني لتثبيت الحجز', 'بعد تأكيد الموعد يمكنك إتمام السداد الآمن وإصدار إيصال إلكتروني وربط حالة الدفع بالحجز مباشرة.', `<div class="grid gap-6 lg:grid-cols-[1.05fr_.95fr]"><form class="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-calm" onsubmit="event.preventDefault(); processBookingPayment('${escapeHTML(booking.id)}')"><h3 class="font-display text-2xl font-extrabold text-moss">اختر وسيلة الدفع</h3><div class="mt-4 grid gap-3 md:grid-cols-3">${methods}</div><div class="mt-6 grid gap-3 md:grid-cols-2"><input required value="${escapeHTML(state.payment.cardholder)}" oninput="state.payment.cardholder=this.value" placeholder="اسم حامل البطاقة" class="rounded-2xl border border-moss/10 px-4 py-3"><input required inputmode="numeric" value="${escapeHTML(state.payment.number)}" oninput="this.value=maskCardNumber(this.value); state.payment.number=this.value" placeholder="رقم البطاقة" class="rounded-2xl border border-moss/10 px-4 py-3"><input required inputmode="numeric" maxlength="5" value="${escapeHTML(state.payment.expiry)}" oninput="state.payment.expiry=this.value" placeholder="MM/YY" class="rounded-2xl border border-moss/10 px-4 py-3"><input required inputmode="numeric" maxlength="4" value="${escapeHTML(state.payment.cvv)}" oninput="state.payment.cvv=this.value" placeholder="CVV" class="rounded-2xl border border-moss/10 px-4 py-3"></div><label class="mt-4 flex gap-3 rounded-2xl bg-mint/55 p-4 font-bold text-ink/70"><input type="checkbox" ${state.payment.saveCard ? 'checked' : ''} onchange="state.payment.saveCard=this.checked"> حفظ البطاقة بشكل رمزي للمدفوعات القادمة دون تخزين رقم البطاقة كاملاً.</label><button ${state.paymentProcessing ? 'disabled' : ''} class="mt-5 w-full rounded-2xl bg-moss px-6 py-4 font-extrabold text-white shadow-leaf">${state.paymentProcessing ? 'جاري معالجة الدفع...' : `ادفع الآن ${formatCurrency(totals.total)}`}</button></form><aside class="rounded-[2rem] bg-moss p-6 text-white shadow-calm"><h3 class="font-display text-2xl font-extrabold">ملخص الدفع</h3><div class="mt-5 grid gap-3"><div class="rounded-2xl bg-white/10 p-4"><b>رقم الحجز</b><p>${escapeHTML(booking.id)}</p></div><div class="rounded-2xl bg-white/10 p-4"><b>المختص</b><p>${escapeHTML(booking.coachName)}</p></div><div class="rounded-2xl bg-white/10 p-4"><b>الموعد</b><p>${formatBookingDate(booking.date)} · ${escapeHTML(booking.time)}</p></div></div><dl class="mt-5 grid gap-2 border-t border-white/15 pt-5"><div class="flex justify-between"><dt>قيمة الجلسة</dt><dd>${formatCurrency(totals.subtotal)}</dd></div><div class="flex justify-between"><dt>ضريبة القيمة المضافة 15%</dt><dd>${formatCurrency(totals.vat)}</dd></div><div class="flex justify-between text-xl font-extrabold"><dt>الإجمالي</dt><dd>${formatCurrency(totals.total)}</dd></div></dl><p class="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-7 text-white/75">يتم تسجيل آخر 4 أرقام فقط وإصدار معرف عملية آمن عند نجاح الدفع.</p></aside></div>`, 'مسار عميق /booking/payment/:id');
}

function bookingConfirmationPage() {
  const item = state.bookingConfirmation || getStoredBookings()[0];
  if (!item) return shell('لا يوجد حجز مؤكد بعد', 'ابدأ الحجز من صفحة المواعيد لاختيار مستشار وتاريخ ووقت مناسبين.', `<button onclick="resetBooking()" class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">بدء حجز جديد</button>`, 'تأكيد الحجز');
  const payment = findPaymentByBookingId(item.id);
  const totals = calculatePaymentTotals(item.price);
  const isPaid = Boolean(payment) || item.paymentStatus === 'paid';
  const deadlineText = item.paymentDeadline ? new Date(item.paymentDeadline).toLocaleString('ar-SA') : '';
  const clientMessages = bookingNotifications(item.id, 'client');
  const nextSteps = [isPaid ? 'تم الدفع الإلكتروني وتثبيت الموعد نهائياً.' : item.status === BOOKING_OWNER_CONFIRM_STATUS ? 'تم إرسال طلبك للمالك لتأكيد الموعد أو اقتراح وقت بديل.' : item.status === BOOKING_ALTERNATIVE_STATUS ? 'يمكنك قبول الوقت البديل المقترح ثم الدفع خلال ساعتين.' : `استكمل الدفع قبل انتهاء المهلة: ${deadlineText}.`, item.method === 'video' ? 'سيتم إرسال رابط الجلسة المرئية قبل الموعد.' : 'سيتم تثبيت رقم الاتصال الصوتي الخاص بالجلسة.', 'يمكن تعديل الموعد قبل 12 ساعة من بدايته.', 'سيصل تذكير حسب القناة المختارة.'];
  const alternativePanel = item.status === BOOKING_ALTERNATIVE_STATUS ? `<div class="mt-5 rounded-2xl border border-clay/20 bg-sand/70 p-4"><span class="text-xs font-extrabold text-ink/50">وقت بديل مقترح</span><p class="mt-1 font-bold text-moss">${formatBookingDate(item.alternativeDate)} · ${escapeHTML(item.alternativeTime)}</p><p class="mt-1 text-sm text-ink/60">${escapeHTML(item.alternativeNote || 'قبول المقترح يفتح نافذة دفع مدتها ساعتان.')}</p><button onclick="acceptSuggestedBooking('${escapeHTML(item.id)}')" class="mt-4 w-full rounded-2xl bg-moss px-5 py-3 font-extrabold text-white">قبول الوقت البديل</button></div>` : '';
  const paymentPanel = isPaid ? `<div class="mt-5 rounded-2xl bg-mint/55 p-4"><span class="text-xs font-extrabold text-ink/50">حالة الدفع</span><p class="mt-1 font-bold text-moss">مدفوع إلكترونياً · ${escapeHTML(payment?.transactionId || item.paymentId || 'تم السداد')}</p></div>` : item.status === BOOKING_READY_FOR_PAYMENT_STATUS && isPaymentWindowOpen(item) ? `<div class="mt-5 rounded-2xl border border-clay/20 bg-sand/70 p-4"><span class="text-xs font-extrabold text-ink/50">مطلوب للدفع خلال ساعتين من التأكيد</span><p class="mt-1 font-display text-2xl font-extrabold text-moss">${formatCurrency(totals.total)}</p><p class="mt-1 text-sm text-ink/60">المهلة تنتهي: ${deadlineText} · تشمل ضريبة القيمة المضافة 15%</p><button onclick="navigate('/booking/payment/${escapeHTML(item.id)}')" class="mt-4 w-full rounded-2xl bg-moss px-5 py-3 font-extrabold text-white">الدفع الإلكتروني الآن</button></div>` : `<div class="mt-5 rounded-2xl bg-mint/55 p-4"><span class="text-xs font-extrabold text-ink/50">حالة الدفع</span><p class="mt-1 font-bold text-moss">${item.status === BOOKING_OWNER_CONFIRM_STATUS ? 'ينتظر تأكيد المالك قبل الدفع' : item.status === BOOKING_ALTERNATIVE_STATUS ? 'ينتظر قبول الوقت البديل' : 'مهلة الدفع غير متاحة حالياً'}</p></div>`;
  const messagesPanel = `<div class="mt-5 rounded-2xl bg-white/70 p-4"><h3 class="font-display text-xl font-extrabold text-moss">رسائل واتساب للعميل</h3><div class="mt-3 grid gap-2">${clientMessages.length ? clientMessages.map((msg) => `<div class="rounded-2xl bg-mint/55 p-3 text-sm leading-7"><b>${escapeHTML(msg.channel)} · ${escapeHTML(msg.status)}</b><p>${escapeHTML(msg.message)}</p></div>`).join('') : '<p class="text-sm text-ink/60">لا توجد رسائل بعد.</p>'}</div></div>`;
  return shell(item.status === BOOKING_OWNER_CONFIRM_STATUS ? 'تم استلام طلب الحجز' : 'تفاصيل الحجز', 'تتم مراجعة الموعد من المالك أولاً، ثم تصلك رسالة واتساب عند استلام الطلب ورسالة أخرى عند التأكيد لإتمام الدفع خلال ساعتين.', `<div class="grid gap-6 lg:grid-cols-[1.05fr_.95fr]"><div class="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-calm"><span class="rounded-full bg-mint px-4 py-2 text-sm font-extrabold text-moss">${escapeHTML(isPaid ? BOOKING_PAID_STATUS : item.status)}</span><h2 class="mt-4 font-display text-4xl font-extrabold text-moss">${escapeHTML(item.id)}</h2><div class="mt-6 grid gap-4 md:grid-cols-2">${[['المستفيد', item.clientName], ['المختص', item.coachName], ['نوع الاستشارة', item.sessionType], ['نوع الحجز', item.methodLabel], ['التاريخ', formatBookingDate(item.date)], ['الوقت', item.time], ['التكلفة', `${item.price} ر.س`], ['التذكير', item.reminder]].map(([label, value]) => `<div class="rounded-2xl bg-mint/55 p-4"><span class="text-xs font-extrabold text-ink/50">${label}</span><p class="mt-1 font-bold text-moss">${escapeHTML(value)}</p></div>`).join('')}</div>${alternativePanel}${paymentPanel}${messagesPanel}</div><aside class="rounded-[2rem] bg-moss p-6 text-white shadow-calm"><h3 class="font-display text-2xl font-extrabold">الخطوات التالية</h3><div class="mt-5 grid gap-3">${nextSteps.map((next, index) => `<div class="rounded-2xl bg-white/10 p-4"><b>${index + 1}.</b> ${next}</div>`).join('')}</div><button onclick="resetBooking()" class="mt-5 w-full rounded-2xl bg-white px-5 py-3 font-extrabold text-moss">حجز موعد آخر</button></aside></div>`, 'مسار عميق /booking/confirmation');
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
  } else if (base.startsWith('/booking/payment/')) {
    app.innerHTML = bookingPaymentPage(decodeURIComponent(base.split('/').pop()));
  } else if (base === '/discover/result') {
    app.innerHTML = window.discoveryResultPage ? window.discoveryResultPage() : notFoundPage();
  } else if (base.startsWith('/programs/')) {
    app.innerHTML = catalogDetailPage(programs.find((program) => program.id === Number(base.split('/').pop())), '/programs', 'صفحة عميقة للمنتجات الرقمية', 'إضافة للسلة');
  } else if (base.startsWith('/children-programs/')) {
    app.innerHTML = catalogDetailPage(childrenPrograms.find((program) => program.id === Number(base.split('/').pop())), '/children-programs', 'صفحة عميقة لبرامج الأطفال', 'طلب الخطة');
  } else if (base.startsWith('/courses/')) {
    app.innerHTML = catalogDetailPage(courses.find((course) => course.id === Number(base.split('/').pop())), '/courses', 'صفحة عميقة للبرامج والدورات', 'تسجيل');
  } else if (base.startsWith('/leadership-programs/')) {
    app.innerHTML = catalogDetailPage(leadershipPrograms.find((program) => program.id === Number(base.split('/').pop())), '/leadership-programs', 'صفحة عميقة للبرامج القيادية', 'طلب عرض');
  } else {
    app.innerHTML = ({ '/': homePage, '/coaches': coachesPage, '/programs': programsPage, '/children-programs': childrenProgramsPage, '/courses': coursesPage, '/leadership-programs': leadershipProgramsPage, '/assessments': assessmentsPage, '/discover': () => window.discoveryPage ? window.discoveryPage() : notFoundPage(), '/reports': reportsPage, '/join-provider': joinProviderPage, '/dashboard/reports': dashboardReportsPage, '/booking': bookingPage, '/booking/confirmation': bookingConfirmationPage, '/login': loginPage }[base] || notFoundPage)();
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
  state.booking = { ...state.booking, coachId: coach.id, sessionType: coach.specialty, date: '', time: '' };
  state.bookingStep = 2;
  showToast(`تم اختيار ${coach.name} للحجز`);
  setTimeout(() => navigate('/booking'), 600);
}

window.setPage = setPage;
window.openCoach = openCoach;
window.navigate = navigate;
window.bookCoach = bookCoach;
window.showToast = showToast;
window.shell = shell;
window.render = render;
window.setBookingStep = setBookingStep;
window.updateBookingField = updateBookingField;
window.chooseBookingSlot = chooseBookingSlot;
window.confirmBooking = confirmBooking;
window.resetBooking = resetBooking;
window.updatePaymentField = updatePaymentField;
window.processBookingPayment = processBookingPayment;
window.maskCardNumber = maskCardNumber;
window.getStoredBookings = getStoredBookings;
window.saveStoredBookings = saveStoredBookings;
window.getStoredBookingNotifications = getStoredBookingNotifications;
window.bookingNotifications = bookingNotifications;
window.ownerConfirmBooking = ownerConfirmBooking;
window.ownerSuggestBookingAlternative = ownerSuggestBookingAlternative;
window.acceptSuggestedBooking = acceptSuggestedBooking;
window.deleteStoredBooking = deleteStoredBooking;
window.viewStoredBooking = viewStoredBooking;
window.formatBookingDate = formatBookingDate;
window.formatCurrency = formatCurrency;
window.BOOKING_OWNER_CONFIRM_STATUS = BOOKING_OWNER_CONFIRM_STATUS;
window.BOOKING_READY_FOR_PAYMENT_STATUS = BOOKING_READY_FOR_PAYMENT_STATUS;
window.BOOKING_ALTERNATIVE_STATUS = BOOKING_ALTERNATIVE_STATUS;
window.BOOKING_PAID_STATUS = BOOKING_PAID_STATUS;
window.adminCollections = adminCollections;
window.ADMIN_STATUS_OPTIONS = ADMIN_STATUS_OPTIONS;
window.OWNER_AUTH_KEY = OWNER_AUTH_KEY;
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
