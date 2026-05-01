'use strict';

const coaches = [
  { id: 1, name: 'د. ريم العبدالله', specialty: 'إرشاد نفسي', city: 'عن بعد', rating: 4.9, price: 220, next: 'اليوم 7:30م', badge: 'جلسات قلق وتوازن', image: 'ر', experience: 11 },
  { id: 2, name: 'أ. ناصر الحربي', specialty: 'كوتشينج مهني', city: 'الرياض', rating: 4.8, price: 180, next: 'غداً 5:00م', badge: 'تخطيط مسار', image: 'ن', experience: 8 },
  { id: 3, name: 'د. ليان الشمري', specialty: 'إرشاد أسري', city: 'جدة', rating: 4.95, price: 260, next: 'الأربعاء 8:00م', badge: 'العلاقات الأسرية', image: 'ل', experience: 13 },
  { id: 4, name: 'أ. مها اليامي', specialty: 'تطوير الذات', city: 'عن بعد', rating: 4.7, price: 150, next: 'الخميس 6:30م', badge: 'عادات وإنجاز', image: 'م', experience: 6 },
  { id: 5, name: 'د. سامي القحطاني', specialty: 'إرشاد نفسي', city: 'الدمام', rating: 4.85, price: 240, next: 'السبت 4:00م', badge: 'إدارة الضغوط', image: 'س', experience: 10 },
  { id: 6, name: 'أ. جود الرشيد', specialty: 'كوتشينج علاقات', city: 'عن بعد', rating: 4.78, price: 190, next: 'الأحد 9:00م', badge: 'وعي وحدود', image: 'ج', experience: 7 }
];

const programs = [
  { id: 1, title: 'دفتر الهدوء الرقمي', category: 'وعي ذاتي', type: 'منتج تدريبي رقمي', duration: '21 يوم', price: 89, level: 'مبتدئ', icon: '🌿', outcome: 'تمارين يومية قصيرة للتنفس والتدوين واستعادة الهدوء' },
  { id: 2, title: 'برنامج وضوح المسار', category: 'كوتشينج ذاتي', type: 'برنامج كوتشينج ذاتي', duration: '4 أسابيع', price: 240, level: 'متوسط', icon: '🧭', outcome: 'خارطة أهداف شخصية قابلة للقياس مع مراجعات أسبوعية' },
  { id: 3, title: 'حقيبة مهارات التواصل الأسري', category: 'أسري', type: 'حقيبة تدريبية', duration: '10 وحدات', price: 170, level: 'عائلي', icon: '🏡', outcome: 'نماذج حوار وحدود صحية وتمارين تطبيقية للأسرة' },
  { id: 4, title: 'خطة التعافي من الاحتراق', category: 'صحة نفسية', type: 'برنامج صوتي وعملي', duration: '14 يوم', price: 120, level: 'عملي', icon: '✨', outcome: 'خطة عملية لاستعادة الطاقة وتنظيم الجهد والراحة' },
  { id: 5, title: 'قوالب جلسات التأمل الموجه', category: 'مكتبة رقمية', type: 'مكتبة رقمية', duration: '30 ملف', price: 65, level: 'متاح للجميع', icon: '🎧', outcome: 'ملفات صوتية وقوالب تأمل تساعد على بناء روتين هادئ' }
];

const childrenPrograms = [
  { id: 1, title: 'برنامج تنظيم الانفعالات للأطفال', category: 'سلوكي', age: '6 - 9 سنوات', format: 'جلسات تفاعلية', duration: '6 أسابيع', price: 520, level: 'تأسيسي', icon: '🧩', outcome: 'تعزيز التعبير عن المشاعر وتقليل نوبات الغضب' },
  { id: 2, title: 'رحلة المهارات الاجتماعية', category: 'نمائي', age: '8 - 12 سنة', format: 'مجموعة صغيرة', duration: '8 أسابيع', price: 680, level: 'متوسط', icon: '🤝', outcome: 'بناء مهارات المشاركة، الدور، وبدء الحوار' },
  { id: 3, title: 'خطة تعديل السلوك المنزلية', category: 'سلوكي أسري', age: '4 - 10 سنوات', format: 'إرشاد والدين', duration: '4 أسابيع', price: 430, level: 'عملي', icon: '🏡', outcome: 'جدول تعزيز ومتابعة يومية قابلة للتطبيق في المنزل' },
  { id: 4, title: 'برنامج الانتباه والروتين', category: 'نمائي', age: '7 - 13 سنة', format: 'تمارين منزلية', duration: '5 أسابيع', price: 390, level: 'تأسيسي', icon: '🎯', outcome: 'تحسين الالتزام بالروتين والانتباه للمهام القصيرة' },
  { id: 5, title: 'مسار الاستعداد المدرسي', category: 'نمائي مدرسي', age: '5 - 7 سنوات', format: 'تقييم وخطة', duration: '3 أسابيع', price: 350, level: 'مبكر', icon: '🎒', outcome: 'خطة انتقال للمدرسة تشمل المهارات الاستقلالية والاجتماعية' },
  { id: 6, title: 'برنامج المرونة للمراهقين', category: 'سلوكي', age: '13 - 16 سنة', format: 'كوتشينج مراهقين', duration: '6 أسابيع', price: 590, level: 'متقدم', icon: '🌈', outcome: 'رفع الوعي الذاتي وإدارة الضغوط والعلاقات' }
];

const courses = [
  { id: 1, title: 'دورة أساسيات الكوتشينج الشخصي', category: 'كوتشينج', audience: 'أفراد وممارسون', format: 'مباشر عن بعد', duration: '12 ساعة', price: 450, level: 'مبتدئ', icon: '🎓', outcome: 'إتقان أدوات الأسئلة القوية وبناء هدف قابل للقياس' },
  { id: 2, title: 'برنامج إدارة الضغوط والاتزان', category: 'صحة نفسية', audience: 'الأفراد والفرق', format: 'مسجل + لقاءات', duration: '4 أسابيع', price: 320, level: 'متوسط', icon: '🍃', outcome: 'خطة شخصية للتعامل مع الضغط والاحتراق' },
  { id: 3, title: 'دورة مهارات التواصل الأسري', category: 'أسري', audience: 'الوالدان والأزواج', format: 'ورشة تفاعلية', duration: '6 ساعات', price: 260, level: 'عملي', icon: '💬', outcome: 'تطبيق نماذج حوار وحدود صحية داخل الأسرة' },
  { id: 4, title: 'برنامج بناء العادات والإنجاز', category: 'تطوير ذات', audience: 'طلاب وموظفون', format: 'تحدي تطبيقي', duration: '21 يوم', price: 180, level: 'مبتدئ', icon: '✅', outcome: 'تصميم نظام متابعة عادات أسبوعي قابل للاستمرار' },
  { id: 5, title: 'دورة صناعة التقارير المهنية', category: 'مهني', audience: 'مستشارون ومزودو خدمة', format: 'تدريب تطبيقي', duration: '8 ساعات', price: 520, level: 'متقدم', icon: '📊', outcome: 'كتابة تقرير واضح بتوصيات قابلة للتنفيذ' },
  { id: 6, title: 'برنامج الوعي بالقيم والقرار', category: 'تطوير ذات', audience: 'أفراد', format: 'مسار ذاتي', duration: '10 أيام', price: 140, level: 'مبتدئ', icon: '🧭', outcome: 'تحديد القيم الأساسية وربطها بالقرارات اليومية' }
];

const leadershipPrograms = [
  { id: 1, title: 'برنامج القيادة الواعية للمنظمات', category: 'قيادة تنفيذية', audience: 'قيادات عليا', format: 'حضوري/عن بعد', duration: '5 أيام', price: 12500, level: 'تنفيذي', icon: '🏛️', outcome: 'مواءمة الرؤية والسلوك القيادي ومؤشرات الأثر' },
  { id: 2, title: 'مختبر بناء فرق عالية الأداء', category: 'فرق العمل', audience: 'إدارات وفرق', format: 'ورشة تطبيقية', duration: '3 أيام', price: 8800, level: 'متوسط', icon: '🚀', outcome: 'رفع الثقة وتوزيع الأدوار وبناء اتفاقيات عمل واضحة' },
  { id: 3, title: 'مسار إدارة التغيير المؤسسي', category: 'تحول وتغيير', audience: 'منظمات', format: 'استشارات + تدريب', duration: '6 أسابيع', price: 18500, level: 'متقدم', icon: '🔄', outcome: 'خارطة تغيير تشمل أصحاب المصلحة والمخاطر والتواصل' },
  { id: 4, title: 'برنامج ذكاء التواصل القيادي', category: 'تواصل مؤسسي', audience: 'مدراء أقسام', format: 'تدريب تنفيذي', duration: '16 ساعة', price: 7200, level: 'متوسط', icon: '🗣️', outcome: 'تحسين المحادثات الصعبة والتغذية الراجعة والاجتماعات' },
  { id: 5, title: 'أكاديمية قادة الصف الثاني', category: 'إعداد قيادات', audience: 'مرشحون للترقية', format: 'رحلة تعلم', duration: '8 أسابيع', price: 16000, level: 'متقدم', icon: '⭐', outcome: 'تطوير الكفاءات القيادية وخطة نمو فردية لكل مشارك' },
  { id: 6, title: 'تقييم الثقافة والرفاه المؤسسي', category: 'تشخيص مؤسسي', audience: 'جهات ومنظمات', format: 'تقييم وتقرير', duration: '4 أسابيع', price: 21000, level: 'استراتيجي', icon: '📈', outcome: 'تقرير قياس ثقافة ورفاه مع توصيات تنفيذية' }
];

const assessments = [
  { id: 1, name: 'مقياس الاتزان النفسي', category: 'نفسي', questions: 48, report: 'تحليل مستويات الضغط والمرونة', accuracy: '92%' },
  { id: 2, name: 'بوصلة القيم الشخصية', category: 'شخصي', questions: 36, report: 'خريطة أولويات وقرارات', accuracy: '89%' },
  { id: 3, name: 'مؤشر جودة العلاقة الأسرية', category: 'أسري', questions: 42, report: 'نقاط قوة وتوصيات حوار', accuracy: '91%' },
  { id: 4, name: 'مقياس أنماط الإنجاز', category: 'مهني', questions: 30, report: 'أسلوب العمل والتحفيز', accuracy: '87%' }
];

const reports = [
  { id: 'WR-1042', client: 'سارة م.', type: 'اتزان نفسي', date: '2026-02-12', progress: 82, status: 'جاهز' },
  { id: 'WR-1041', client: 'خالد ع.', type: 'كوتشينج مهني', date: '2026-02-10', progress: 68, status: 'قيد الإعداد' },
  { id: 'WR-1039', client: 'نورة ف.', type: 'إرشاد أسري', date: '2026-02-08', progress: 94, status: 'جاهز' },
  { id: 'WR-1037', client: 'عبدالله ر.', type: 'قيم شخصية', date: '2026-02-05', progress: 76, status: 'مراجعة' }
];

const subscriptions = [
  { id: 1, title: 'اشتراك نمو شهري', category: 'أفراد', period: 'شهري', price: 199, level: 'أساسي', icon: '🌱', status: 'تم التفعيل', outcome: 'جلسة متابعة شهرية مع محتوى تطبيقي وخطة تقدم' },
  { id: 2, title: 'اشتراك الأسرة الواعية', category: 'أسري', period: 'ربع سنوي', price: 549, level: 'متقدم', icon: '🏡', status: 'تم التفعيل', outcome: 'إرشاد أسري ومكتبة أدوات منزلية وتقارير متابعة' },
  { id: 3, title: 'اشتراك فرق العمل', category: 'جهات', period: 'سنوي', price: 8900, level: 'مؤسسي', icon: '🏛️', status: 'قريبا', outcome: 'مقاييس رفاه وفريق دعم وبرامج قيادية للموظفين' }
];

const ownerPhrases = [
  { id: 1, area: 'الرئيسية', text: 'مساحة آمنة للنمو', status: 'تم التفعيل' },
  { id: 2, area: 'المنتجات', text: 'ابدأ بخطوة صغيرة وواضحة اليوم', status: 'تم التفعيل' },
  { id: 3, area: 'الدعم', text: 'فريقنا يتابع طلبك حتى الإغلاق', status: 'قريبا' }
];

const supportTickets = [
  { id: 'SUP-1001', client: 'نورة ف.', issue: 'مشكلة في تحميل تقرير PDF', priority: 'عالي', status: 'مفتوح', resolution: 'تمت إعادة توليد الرابط وإرساله للعميلة' },
  { id: 'SUP-1002', client: 'خالد ع.', issue: 'تعديل موعد جلسة الكوتشينج', priority: 'متوسط', status: 'قيد الحل', resolution: 'بانتظار تأكيد الموعد الجديد من المختص' },
  { id: 'SUP-1003', client: 'سارة م.', issue: 'استفسار عن تفعيل الاشتراك', priority: 'منخفض', status: 'مغلق', resolution: 'تم شرح خطوات الدخول وتأكيد التفعيل' }
];

const PAGE_SIZE = 4;
const DEBOUNCE_MS = 140;

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
      <select id="filterSelect" class="rounded-2xl border border-moss/10 bg-white px-4 py-3">${filters.map(filter => `<option value="${escapeHTML(filter)}" ${filter === activeFilter ? 'selected' : ''}>${escapeHTML(filter)}</option>`).join('')}</select>
      <label class="sr-only" for="sortSelect">ترتيب</label>
      <select id="sortSelect" class="rounded-2xl border border-moss/10 bg-white px-4 py-3">${sorts.map(sort => `<option value="${sort.value}" ${sort.value === activeSort ? 'selected' : ''}>${sort.label}</option>`).join('')}</select>
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
  adminCollection: 'programs'
};

const OWNER_AUTH_KEY = 'adrek-owner-authenticated';
const OWNER_PASSWORD_KEY = 'adrek-owner-password';
const OWNER_DEFAULT_PASSWORD = '12345678';
const OWNER_USERNAME = 'admin';
const ADMIN_STATUS_OPTIONS = ['تم التفعيل', 'قريبا'];

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
const adminCollections = {
  programs: { label: 'المنتجات الرقمية', route: '/programs', items: programs, fields: ['title', 'category', 'type', 'duration', 'level', 'price', 'icon', 'status', 'outcome'] },
  children: { label: 'برامج الأطفال', route: '/children-programs', items: childrenPrograms, fields: ['title', 'category', 'age', 'format', 'duration', 'level', 'price', 'icon', 'status', 'outcome'] },
  courses: { label: 'البرامج والدورات', route: '/courses', items: courses, fields: ['title', 'category', 'audience', 'format', 'duration', 'level', 'price', 'icon', 'status', 'outcome'] },
  leadership: { label: 'البرامج القيادية', route: '/leadership-programs', items: leadershipPrograms, fields: ['title', 'category', 'audience', 'format', 'duration', 'level', 'price', 'icon', 'status', 'outcome'] },
  subscriptions: { label: 'الاشتراكات', route: '/admin/subscriptions', items: subscriptions, fields: ['title', 'category', 'period', 'level', 'price', 'icon', 'status', 'outcome'] },
  assessments: { label: 'المقاييس', route: '/assessments', items: assessments, fields: ['name', 'category', 'questions', 'accuracy', 'status', 'report'] }
};

Object.entries(adminCollections).forEach(([key, config]) => {
  const saved = adrekStorage.local.getItem(`adrek-admin-${key}`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) config.items.splice(0, config.items.length, ...parsed);
    } catch (error) {
      console.warn(`تعذر تحميل بيانات ${key}`, error);
    }
  }
});

function saveAdminCollection(key) {
  adrekStorage.local.setItem(`adrek-admin-${key}`, JSON.stringify(adminCollections[key].items));
}

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
      ${feature('🧑‍⚕️','حجز مختصين','بحث وفرز حسب التخصص والسعر والتقييم مع مواعيد مباشرة.','/coaches')}
      ${feature('🧩','برامج الأطفال','برامج نمائية وسلوكية للأطفال والمراهقين بخطط للأسرة والمدرسة.','/children-programs')}
      ${feature('🎓','برامج ودورات','دورات تدريبية مباشرة ومسجلة للأفراد والممارسين.','/courses')}
      ${feature('🏛️','برامج قيادية','مسارات تطوير قيادي للجهات والمنظمات وفرق العمل.','/leadership-programs')}
    </div>
  </section>
  <section class="bg-moss py-16 text-white">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div class="lg:col-span-1"><span class="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">رحلة واضحة</span><h2 class="mt-4 font-display text-3xl font-extrabold">من سؤالك الأول حتى التقرير النهائي</h2></div>
      <div class="grid gap-4 lg:col-span-2 md:grid-cols-3">${step('01','اختر المسار','كوتشينج، نفسي، أسري، أو تطوير ذات.')}${step('02','احجز أو ابدأ مقياس','مواعيد مباشرة ومنتجات رقمية فورية.')}${step('03','استلم تقريرك','ملخص احترافي وتوصيات قابلة للتنفيذ.')}</div>
    </div>
  </section>`;
}

function stat(number, label) { return `<div class="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm"><p class="font-display text-2xl font-extrabold text-moss">${number}</p><p class="text-xs font-bold text-ink/55">${label}</p></div>`; }
function journey(title, meta, value) { return `<div class="rounded-3xl bg-white p-4 shadow-sm"><div class="mb-2 flex justify-between text-sm"><b class="text-moss">${title}</b><span class="text-ink/55">${meta}</span></div><div class="h-2 rounded-full bg-mint"><div class="progress-wave h-2 rounded-full" style="width:${value}%"></div></div></div>`; }
function feature(icon, title, text, route) { return `<a href="${route}" data-route="${route}" class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl"><span class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-2xl">${icon}</span><h3 class="font-display text-xl font-extrabold text-moss">${title}</h3><p class="mt-3 leading-7 text-ink/62">${text}</p></a>`; }
function step(num, title, text) { return `<div class="rounded-[2rem] border border-white/15 bg-white/10 p-6"><span class="text-sm font-extrabold text-sand">${num}</span><h3 class="mt-3 font-display text-xl font-extrabold">${title}</h3><p class="mt-3 leading-7 text-white/70">${text}</p></div>`; }

function coachesPage() {
  const specialties = ['الكل', ...new Set(coaches.map(c => c.specialty))];
  const activeFilter = specialties.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['rating', 'price', 'experience'].includes(state.sort) ? state.sort : 'rating';
  let list = coaches.filter(c => activeFilter === 'الكل' || c.specialty === activeFilter).filter(c => includesTerm(c.name, state.search) || includesTerm(c.specialty, state.search) || includesTerm(c.city, state.search));
  list.sort((a,b) => activeSort === 'price' ? a.price - b.price : activeSort === 'experience' ? b.experience - a.experience : b.rating - a.rating);
  const { pages, visible } = getPagedItems(list);
  return shell('دليل المستشارين والكوتشز', 'قائمة قابلة للبحث والفرز والتصفية مع صفحات مستقلة وتفاصيل عميقة لكل مزود خدمة.', `
    ${listToolbar({ placeholder: 'ابحث بالاسم أو التخصص أو المدينة', filters: specialties, activeFilter, activeSort, sorts: [{ value: 'rating', label: 'الأعلى تقييماً' }, { value: 'price', label: 'الأقل سعراً' }, { value: 'experience', label: 'الأكثر خبرة' }] })}
    <div class="mt-6 grid gap-5 md:grid-cols-2">${visible.length ? visible.map(coachCard).join('') : emptyState()}</div>
    ${pagination(pages)}
  `, 'حجز الأطباء بصيغة الكوتشينج');
}

function coachCard(c) {
  return `<article class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
    <div class="flex gap-4"><div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-mint to-sand text-3xl font-display font-extrabold text-moss">${c.image}</div>
      <div class="flex-1"><div class="flex flex-wrap items-start justify-between gap-2"><div><h3 class="font-display text-xl font-extrabold text-moss">${c.name}</h3><p class="font-bold text-ink/60">${c.specialty} · ${c.city}</p></div><span class="rounded-full bg-sand/70 px-3 py-1 text-xs font-extrabold text-moss">★ ${c.rating}</span></div>
      <p class="mt-3 text-sm leading-7 text-ink/60">${c.badge} · خبرة ${c.experience} سنوات · أقرب موعد ${c.next}</p></div></div>
    <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-moss/10 pt-4"><b class="text-moss">${c.price} ر.س / جلسة</b><div class="flex gap-2"><button onclick="openCoach(${c.id})" class="table-action rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-moss">عرض</button><button onclick="bookCoach(${c.id})" class="table-action rounded-2xl bg-moss px-4 py-2 text-sm font-extrabold text-white">حجز</button></div></div>
  </article>`;
}

function pagination(pages) {
  if (pages <= 1) return '';
  const pageButtons = Array.from({length: pages}, (_, i) => `<button type="button" onclick="setPage(${i+1})" aria-label="الصفحة ${i+1}" class="h-11 w-11 rounded-2xl font-extrabold transition ${state.page===i+1?'bg-moss text-white shadow-leaf':'bg-white/75 text-moss hover:-translate-y-1'}">${i+1}</button>`).join('');
  return `<div class="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="ترقيم الصفحات"><button type="button" onclick="setPage(${Math.max(1, state.page - 1)})" class="rounded-2xl bg-white/75 px-4 py-3 font-extrabold text-moss transition hover:-translate-y-1">السابق</button>${pageButtons}<button type="button" onclick="setPage(${Math.min(pages, state.page + 1)})" class="rounded-2xl bg-white/75 px-4 py-3 font-extrabold text-moss transition hover:-translate-y-1">التالي</button></div>`;
}

function programsPage() {
  const categories = ['الكل', ...new Set(programs.map(program => program.category))];
  const activeFilter = categories.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['title', 'price', 'duration'].includes(state.sort) ? state.sort : 'title';
  let list = programs
    .filter(program => activeFilter === 'الكل' || program.category === activeFilter)
    .filter(program => [program.title, program.type, program.category, program.level].some(value => includesTerm(value, state.search)));
  list.sort((a, b) => activeSort === 'price' ? a.price - b.price : activeSort === 'duration' ? parseDurationValue(a.duration) - parseDurationValue(b.duration) : a.title.localeCompare(b.title, 'ar'));
  const { pages, visible } = getPagedItems(list);
  return shell('المنتجات الرقمية التدريبية', 'مكتبة برامج وحقائب رقمية بأيقونة واضحة ومسارات قابلة للشراء أو الإهداء أو الإضافة لخطة المستفيد.', `
    ${listToolbar({ placeholder: 'ابحث باسم المنتج أو نوعه', filters: categories, activeFilter, activeSort, sorts: [{ value: 'title', label: 'ترتيب أبجدي' }, { value: 'price', label: 'الأقل سعراً' }, { value: 'duration', label: 'الأقصر مدة' }] })}
    <div class="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">${visible.length ? visible.map(programCard).join('') : emptyState()}</div>
    ${pagination(pages)}
  `, 'أيقونة المنتجات الرقمية');
}

function statusBadge(status = 'تم التفعيل') {
  const active = status === 'تم التفعيل';
  return `<span class="rounded-full ${active ? 'bg-mint text-moss' : 'bg-sand text-clay'} px-3 py-1 text-xs font-extrabold">${escapeHTML(status)}</span>`;
}

function programCard(p) {
  return `<article class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
    <div class="mb-5 flex items-start justify-between gap-3"><span class="flex h-16 w-16 items-center justify-center rounded-3xl bg-mint text-3xl">${p.icon}</span>${statusBadge(p.status)}</div>
    <p class="text-xs font-extrabold text-clay">${p.type}</p>
    <h3 class="mt-2 font-display text-xl font-extrabold text-moss">${p.title}</h3>
    <p class="mt-3 leading-7 text-ink/62">${p.outcome}</p>
    <div class="mt-4 flex flex-wrap gap-2 text-xs font-bold text-ink/60"><span class="rounded-full bg-sand/70 px-3 py-1">${p.duration}</span><span class="rounded-full bg-sand/70 px-3 py-1">${p.level}</span><span class="rounded-full bg-sand/70 px-3 py-1">${p.category}</span></div>
    <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-moss/10 pt-4"><b class="text-moss">${p.price} ر.س</b><div class="flex flex-wrap gap-2"><button onclick="navigate('/programs/${p.id}')" class="table-action rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-moss">عرض</button><button onclick="showToast('تمت إضافة ${p.title} إلى السلة')" class="table-action rounded-2xl bg-moss px-4 py-2 text-sm font-extrabold text-white">إضافة</button><button onclick="showToast('تم فتح تعديل المنتج')" class="table-action rounded-2xl bg-sand px-4 py-2 text-sm font-extrabold text-moss">تعديل</button><button onclick="showToast('تم حذف المنتج من القائمة')" class="table-action rounded-2xl bg-red-50 px-4 py-2 text-sm font-extrabold text-red-700">حذف</button></div></div>
  </article>`;
}

function catalogPage(config) {
  const categories = ['الكل', ...new Set(config.items.map(item => item.category))];
  const activeFilter = categories.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['title', 'price', 'duration'].includes(state.sort) ? state.sort : 'title';
  let list = config.items
    .filter(item => activeFilter === 'الكل' || item.category === activeFilter)
    .filter(item => [item.title, item.category, item.level, item.format, item.audience, item.age].filter(Boolean).some(value => includesTerm(value, state.search)));
  list.sort((a, b) => activeSort === 'price' ? a.price - b.price : activeSort === 'duration' ? parseDurationValue(a.duration) - parseDurationValue(b.duration) : a.title.localeCompare(b.title, 'ar'));
  const { pages, visible } = getPagedItems(list);
  return shell(config.title, config.subtitle, `
    ${listToolbar({ placeholder: 'ابحث باسم البرنامج أو الفئة', filters: categories, activeFilter, activeSort, sorts: [{ value: 'title', label: 'ترتيب أبجدي' }, { value: 'price', label: 'الأقل تكلفة' }, { value: 'duration', label: 'الأقصر مدة' }] })}
    <div class="mt-6 grid gap-5 md:grid-cols-2">${visible.length ? visible.map(item => catalogCard(item, config.route, config.actionLabel)).join('') : emptyState()}</div>
    ${pagination(pages)}
  `, config.eyebrow);
}

function catalogCard(item, route, actionLabel) {
  return `<article class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
    <div class="flex items-start gap-4"><span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-mint text-3xl">${item.icon}</span><div class="flex-1"><div class="flex flex-wrap items-start justify-between gap-2"><p class="text-xs font-extrabold text-clay">${item.category}</p>${statusBadge(item.status)}</div><h3 class="mt-2 font-display text-xl font-extrabold text-moss">${item.title}</h3><p class="mt-3 leading-7 text-ink/62">${item.outcome}</p></div></div>
    <div class="mt-5 flex flex-wrap gap-2 text-xs font-bold text-ink/60"><span class="rounded-full bg-sand/70 px-3 py-1">${item.duration}</span><span class="rounded-full bg-sand/70 px-3 py-1">${item.level}</span><span class="rounded-full bg-sand/70 px-3 py-1">${item.audience || item.age}</span><span class="rounded-full bg-sand/70 px-3 py-1">${item.format}</span></div>
    <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-moss/10 pt-4"><b class="text-moss">${item.price.toLocaleString('ar-SA')} ر.س</b><div class="flex gap-2"><button onclick="navigate('${route}/${item.id}')" class="table-action rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-moss">عرض</button><button onclick="showToast('${actionLabel}: ${item.title}')" class="table-action rounded-2xl bg-moss px-4 py-2 text-sm font-extrabold text-white">${actionLabel}</button></div></div>
  </article>`;
}

function childrenProgramsPage() { return catalogPage({ route: '/children-programs', items: childrenPrograms, title: 'البرامج النمائية والسلوكية للأطفال', subtitle: 'مسارات متخصصة للأطفال والمراهقين تجمع بين التقييم، تدريب المهارات، تعديل السلوك، وإرشاد الوالدين بخطط متابعة واضحة.', eyebrow: 'برامج الأطفال', actionLabel: 'طلب الخطة' }); }
function coursesPage() { return catalogPage({ route: '/courses', items: courses, title: 'البرامج والدورات', subtitle: 'دورات وبرامج تدريبية مباشرة ومسجلة للأفراد والأسر والممارسين، مع خيارات فرز وتصفية حسب المجال والمستوى والتكلفة.', eyebrow: 'تعلم وتطوير', actionLabel: 'تسجيل' }); }
function leadershipProgramsPage() { return catalogPage({ route: '/leadership-programs', items: leadershipPrograms, title: 'البرامج القيادية للجهات والمنظمات', subtitle: 'حلول تطوير قيادي وتشخيص ثقافة وبناء فرق مصممة للجهات والمنظمات مع مخرجات تنفيذية قابلة للقياس.', eyebrow: 'حلول مؤسسية', actionLabel: 'طلب عرض' }); }

function catalogDetailPage(item, route, eyebrow, ctaLabel) {
  const format = item.format || item.type || 'مسار رقمي';
  const audience = item.audience || item.age || item.level;
  return shell(item.title, `${item.category} · ${item.duration} · ${item.level}`, `
    <div class="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm"><div class="mb-4 flex items-start justify-between gap-3"><span class="flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-mint text-4xl">${item.icon}</span>${statusBadge(item.status)}</div><h3 class="font-display text-2xl font-extrabold text-moss">مخرجات البرنامج</h3><p class="mt-4 leading-9 text-ink/65">${item.outcome}. يتضمن المسار جلسة تعريفية، مواد تطبيقية، ومتابعة تقدم لضمان انتقال الأثر إلى الحياة اليومية أو بيئة العمل.</p><div class="mt-6 flex flex-wrap gap-2 text-sm font-bold text-ink/60"><span class="rounded-full bg-sand/70 px-4 py-2">${format}</span><span class="rounded-full bg-sand/70 px-4 py-2">${audience}</span><span class="rounded-full bg-sand/70 px-4 py-2">${item.price.toLocaleString('ar-SA')} ر.س</span></div></div>
      <div class="rounded-[2rem] bg-moss p-6 text-white shadow-calm"><h3 class="font-display text-2xl font-extrabold">إجراءات البرنامج</h3><div class="mt-5 grid gap-3"><button onclick="showToast('${ctaLabel}: ${item.title}')" class="rounded-2xl bg-white px-5 py-3 font-extrabold text-moss transition hover:-translate-y-1">${ctaLabel}</button><button onclick="showToast('تم فتح نموذج تعديل البرنامج')" class="rounded-2xl bg-white/10 px-5 py-3 font-extrabold text-white transition hover:-translate-y-1">تعديل</button><button onclick="showToast('تم نسخ رابط الصفحة')" class="rounded-2xl bg-white/10 px-5 py-3 font-extrabold text-white transition hover:-translate-y-1">نسخ الرابط</button><button onclick="showToast('تم أرشفة البرنامج')" class="rounded-2xl bg-red-50 px-5 py-3 font-extrabold text-red-700 transition hover:-translate-y-1">حذف</button></div><a href="${route}" data-route="${route}" class="mt-6 inline-flex rounded-2xl border border-white/20 px-5 py-3 font-extrabold text-white">العودة للقائمة</a></div>
    </div>
  `, eyebrow);
}

function assessmentsPage() {
  const categories = ['الكل', ...new Set(assessments.map(assessment => assessment.category))];
  const activeFilter = categories.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['name', 'questions', 'accuracy'].includes(state.sort) ? state.sort : 'name';
  let list = assessments
    .filter(assessment => activeFilter === 'الكل' || assessment.category === activeFilter)
    .filter(assessment => [assessment.name, assessment.category, assessment.report].some(value => includesTerm(value, state.search)));
  list.sort((a, b) => activeSort === 'questions' ? b.questions - a.questions : activeSort === 'accuracy' ? Number.parseFloat(b.accuracy) - Number.parseFloat(a.accuracy) : a.name.localeCompare(b.name, 'ar'));
  const { pages, visible } = getPagedItems(list);
  return shell('برامج المقاييس الشخصية والنفسية', 'مقاييس منظمة للمستفيدين ومزودي الخدمة، مع تصنيف واضح وتقرير مهني قابل للإصدار بعد الإكمال.', `
    ${listToolbar({ placeholder: 'ابحث باسم المقياس أو التقرير', filters: categories, activeFilter, activeSort, sorts: [{ value: 'name', label: 'ترتيب أبجدي' }, { value: 'questions', label: 'الأكثر أسئلة' }, { value: 'accuracy', label: 'الأعلى دقة' }] })}
    <div class="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-calm">
      <div class="overflow-x-auto"><table class="w-full min-w-[720px] text-right"><thead class="bg-mint/70 text-sm text-moss"><tr><th class="p-4">المقياس</th><th class="p-4">الفئة</th><th class="p-4">الأسئلة</th><th class="p-4">دقة معيارية</th><th class="p-4">إجراءات CRUD</th></tr></thead><tbody>${visible.map(assessmentRow).join('')}</tbody></table>${visible.length ? '' : emptyState()}</div>
    </div>
    ${pagination(pages)}
  `, 'مقاييس بتقارير احترافية');
}

function assessmentRow(a) {
  return `<tr class="border-t border-moss/10"><td class="p-4 font-bold text-moss">${a.name}<p class="text-sm font-normal text-ink/55">${a.report}</p></td><td class="p-4">${a.category}</td><td class="p-4">${a.questions}</td><td class="p-4">${a.accuracy}</td><td class="p-4"><div class="flex gap-2"><button onclick="showToast('بدء ${a.name}')" class="table-action rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white">بدء</button><button onclick="showToast('تم فتح تحرير المقياس')" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل</button><button onclick="showToast('تم نسخ رابط المقياس')" class="table-action rounded-xl bg-sand px-3 py-2 text-xs font-bold text-moss">نسخ</button><button onclick="showToast('تم أرشفة المقياس')" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></td></tr>`;
}

function reportsPage() {
  return shell('إصدار التقارير الاحترافية', 'نموذج بصري لتقارير Adrek: ملخص تنفيذي، درجات المقاييس، توصيات الجلسة، وخطة متابعة قابلة للطباعة.', `
    <div class="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <div class="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm"><h3 class="font-display text-2xl font-extrabold text-moss">مكونات التقرير</h3><div class="mt-5 space-y-3">${['ملخص تنفيذي بلغة واضحة','رسم تقدم ودرجات معيارية','توصيات عملية لمدة 14 يوم','ملاحظات المختص وسجل الجلسات','رابط مشاركة آمن وصلاحيات'].map((x,i)=>`<div class="flex items-center gap-3 rounded-2xl bg-mint/55 p-4"><span class="flex h-8 w-8 items-center justify-center rounded-full bg-moss text-sm font-bold text-white">${i+1}</span><b>${x}</b></div>`).join('')}</div></div>
      <div class="rounded-[2.2rem] bg-moss p-3 shadow-calm"><div class="rounded-[1.8rem] bg-[#fbf7ed] p-6"><div class="flex justify-between"><div><p class="text-sm font-bold text-ink/55">تقرير Adrek المهني</p><h3 class="font-display text-3xl font-extrabold text-moss">ملف الاتزان النفسي</h3></div><span class="rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-moss">PDF</span></div><div class="mt-6 grid gap-3 sm:grid-cols-3">${stat('82%','مرونة نفسية')}${stat('68%','إدارة ضغط')}${stat('91%','وعي ذاتي')}</div><div class="mt-6 rounded-3xl bg-white p-5"><h4 class="font-display font-extrabold text-moss">توصية مختصرة</h4><p class="mt-2 leading-8 text-ink/65">جلسة متابعة أسبوعية مع برنامج صوتي لإدارة الضغط وتمرين تدوين يومي.</p></div></div></div>
    </div>
  `, 'تقارير قابلة للإصدار');
}

function joinProviderPage() {
  return shell('انضم كمزود خدمة', 'مسار احترافي للمدربين والمستشارين: ملف تعريفي، اعتماد، إدارة مواعيد، منتجات رقمية، وتقارير للمستفيدين.', `
    <div class="grid gap-6 lg:grid-cols-2"><form class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); showToast('تم إرسال طلب الانضمام بنجاح')"><div class="grid gap-4"><input required placeholder="الاسم الكامل" class="rounded-2xl border border-moss/10 px-4 py-3"><input required placeholder="البريد المهني" class="rounded-2xl border border-moss/10 px-4 py-3"><select class="rounded-2xl border border-moss/10 px-4 py-3"><option>كوتشينج مهني</option><option>إرشاد نفسي</option><option>إرشاد أسري</option><option>تطوير ذات</option></select><textarea placeholder="نبذة عن خبرتك وشهاداتك" class="min-h-32 rounded-2xl border border-moss/10 px-4 py-3"></textarea><button class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1">إرسال الطلب</button></div></form><div class="space-y-4">${['إدارة جدول ومواعيد مرنة','بيع المنتجات الرقمية والحقائب','إصدار تقارير للمستفيدين','صفحة عامة قابلة للمشاركة'].map((x,i)=>`<div class="card-hover rounded-[2rem] border border-white/70 bg-white/65 p-5"><span class="text-sm font-extrabold text-clay">ميزة ${i+1}</span><h3 class="mt-2 font-display text-xl font-extrabold text-moss">${x}</h3></div>`).join('')}</div></div>
  `, 'للمزودين');
}

function dashboardReportsPage() {
  const statuses = ['الكل', ...new Set(reports.map(report => report.status))];
  const activeFilter = statuses.includes(state.filter) ? state.filter : 'الكل';
  const activeSort = ['date', 'progress', 'client'].includes(state.sort) ? state.sort : 'date';
  let list = reports
    .filter(report => activeFilter === 'الكل' || report.status === activeFilter)
    .filter(report => [report.id, report.client, report.type, report.status].some(value => includesTerm(value, state.search)));
  list.sort((a, b) => activeSort === 'progress' ? b.progress - a.progress : activeSort === 'client' ? a.client.localeCompare(b.client, 'ar') : new Date(b.date) - new Date(a.date));
  const { pages, visible } = getPagedItems(list);
  return shell('لوحة التقارير وإدارة المحتوى', 'جدول تقارير يحتوي على إجراءات عرض وتعديل وإصدار وحذف، مع متابعة حالة التقرير وتقدم المستفيد.', `
    ${listToolbar({ placeholder: 'ابحث برقم التقرير أو المستفيد', filters: statuses, activeFilter, activeSort, sorts: [{ value: 'date', label: 'الأحدث تاريخاً' }, { value: 'progress', label: 'الأعلى تقدماً' }, { value: 'client', label: 'اسم المستفيد' }] })}
    <div class="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-calm"><div class="overflow-x-auto"><table class="w-full min-w-[760px] text-right"><thead class="bg-moss text-sm text-white"><tr><th class="p-4">رقم التقرير</th><th class="p-4">المستفيد</th><th class="p-4">النوع</th><th class="p-4">التاريخ</th><th class="p-4">التقدم</th><th class="p-4">الحالة</th><th class="p-4">إجراءات CRUD</th></tr></thead><tbody>${visible.map(reportRow).join('')}</tbody></table>${visible.length ? '' : emptyState()}</div></div>
    ${pagination(pages)}
  `, 'مسار عميق /dashboard/reports');
}

function reportRow(r) {
  return `<tr class="border-t border-moss/10"><td class="p-4 font-bold text-moss">${r.id}</td><td class="p-4">${r.client}</td><td class="p-4">${r.type}</td><td class="p-4">${r.date}</td><td class="p-4"><div class="h-2 w-28 rounded-full bg-mint"><div class="progress-wave h-2 rounded-full" style="width:${r.progress}%"></div></div></td><td class="p-4"><span class="rounded-full bg-sand/70 px-3 py-1 text-xs font-bold text-moss">${r.status}</span></td><td class="p-4"><div class="flex gap-2"><button onclick="showToast('عرض ${r.id}')" class="table-action rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white">عرض</button><button onclick="showToast('تحرير ${r.id}')" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل</button><button onclick="showToast('إصدار PDF')" class="table-action rounded-xl bg-sand px-3 py-2 text-xs font-bold text-moss">إصدار</button><button onclick="showToast('تم حذف المسودة')" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></td></tr>`;
}

function bookingPage() {
  return shell('حجز جلسة جديدة', 'نموذج حجز سريع يربط المستفيد بالمختص المناسب مع اختيار نوع الجلسة والوقت.', `
    <form class="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); showToast('تم تأكيد طلب الحجز')"><div class="grid gap-4 md:grid-cols-2"><select class="rounded-2xl border border-moss/10 px-4 py-3"><option>إرشاد نفسي</option><option>كوتشينج مهني</option><option>إرشاد أسري</option><option>تطوير ذات</option></select><select class="rounded-2xl border border-moss/10 px-4 py-3">${coaches.map(c=>`<option>${c.name}</option>`).join('')}</select><input type="date" class="rounded-2xl border border-moss/10 px-4 py-3"><input type="time" class="rounded-2xl border border-moss/10 px-4 py-3"><textarea class="min-h-32 rounded-2xl border border-moss/10 px-4 py-3 md:col-span-2" placeholder="ما الهدف من الجلسة؟"></textarea><button class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1 md:col-span-2">تأكيد الحجز</button></div></form>
  `, 'حجز آمن');
}

function loginPage() {
  return shell('تسجيل الدخول', 'دخول موحد للمستفيد ومزود الخدمة مع واجهة هادئة وواضحة.', `<form class="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); showToast('تم تسجيل الدخول تجريبياً')"><input placeholder="البريد الإلكتروني" class="mb-4 w-full rounded-2xl border border-moss/10 px-4 py-3"><input type="password" placeholder="كلمة المرور" class="mb-4 w-full rounded-2xl border border-moss/10 px-4 py-3"><button class="w-full rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1">دخول</button></form>`, 'حسابك');
}

function notFoundPage() { return shell('الصفحة غير موجودة', 'يمكنك العودة للصفحة الرئيسية أو اختيار أحد مسارات المنصة.', `<a href="/" data-route="/" class="inline-flex rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">العودة للرئيسية</a>`); }

function render() {
  const base = state.route;
  document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', base === a.dataset.route || base.startsWith(`${a.dataset.route}/`)));
  if (base.startsWith('/admin')) {
    app.innerHTML = adminPage();
  } else if (base.startsWith('/coaches/')) {
    const id = Number(base.split('/').pop());
    const c = coaches.find(item => item.id === id) || coaches[0];
    app.innerHTML = shell(c.name, `${c.specialty} · ${c.city} · تقييم ${c.rating}`, `<div class="grid gap-6 lg:grid-cols-2"><div class="rounded-[2rem] bg-white/75 p-6 shadow-calm"><h3 class="font-display text-2xl font-extrabold text-moss">نبذة مهنية</h3><p class="mt-4 leading-8 text-ink/65">مختص بخبرة ${c.experience} سنوات في ${c.badge}. يقدم جلسات فردية وخطط متابعة وتقارير تقدم مختصرة.</p></div><div class="rounded-[2rem] bg-moss p-6 text-white"><h3 class="font-display text-2xl font-extrabold">أقرب موعد</h3><p class="mt-4 text-white/75">${c.next}</p><button onclick="bookCoach(${c.id})" class="mt-6 rounded-2xl bg-white px-5 py-3 font-extrabold text-moss transition hover:-translate-y-1">احجز الآن</button></div></div>`, 'صفحة تفصيلية');
  } else if (base.startsWith('/programs/')) {
    const item = programs.find(program => program.id === Number(base.split('/').pop())) || programs[0];
    app.innerHTML = catalogDetailPage(item, '/programs', 'صفحة عميقة للمنتجات الرقمية', 'إضافة للسلة');
  } else if (base.startsWith('/children-programs/')) {
    const item = childrenPrograms.find(program => program.id === Number(base.split('/').pop())) || childrenPrograms[0];
    app.innerHTML = catalogDetailPage(item, '/children-programs', 'صفحة عميقة لبرامج الأطفال', 'طلب الخطة');
  } else if (base.startsWith('/courses/')) {
    const item = courses.find(course => course.id === Number(base.split('/').pop())) || courses[0];
    app.innerHTML = catalogDetailPage(item, '/courses', 'صفحة عميقة للبرامج والدورات', 'تسجيل');
  } else if (base.startsWith('/leadership-programs/')) {
    const item = leadershipPrograms.find(program => program.id === Number(base.split('/').pop())) || leadershipPrograms[0];
    app.innerHTML = catalogDetailPage(item, '/leadership-programs', 'صفحة عميقة للبرامج القيادية', 'طلب عرض');
  } else {
    app.innerHTML = ({ '/': homePage, '/coaches': coachesPage, '/programs': programsPage, '/children-programs': childrenProgramsPage, '/courses': coursesPage, '/leadership-programs': leadershipProgramsPage, '/assessments': assessmentsPage, '/reports': reportsPage, '/join-provider': joinProviderPage, '/dashboard/reports': dashboardReportsPage, '/booking': bookingPage, '/login': loginPage }[base] || notFoundPage)();
  }
  bindDynamicControls();
}

const debouncedRender = debounce(() => render());

function bindDynamicControls() {
  document.querySelectorAll('a[data-route]').forEach(link => {
    link.onclick = (event) => { event.preventDefault(); navigate(link.dataset.route); document.getElementById('navLinks').classList.add('hidden'); document.getElementById('menuToggle').setAttribute('aria-expanded', 'false'); };
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.oninput = (e) => { state.search = e.target.value.trim(); state.page = 1; debouncedRender(); };
  const filterSelect = document.getElementById('filterSelect');
  if (filterSelect) filterSelect.onchange = (e) => { state.filter = e.target.value; state.page = 1; render(); };
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.onchange = (e) => { state.sort = e.target.value; render(); };
}

function setPage(page) { state.page = page; render(); }
function openCoach(id) { navigate(`/coaches/${id}`); }
function bookCoach(id) { const coach = coaches.find(c => c.id === id); showToast(`تم اختيار ${coach.name} للحجز`); setTimeout(() => navigate('/booking'), 600); }

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
  render();
});
