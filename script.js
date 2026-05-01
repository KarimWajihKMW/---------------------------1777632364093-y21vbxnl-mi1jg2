console.log('Akwadra Super Builder Initialized - Wazen Platform');

const coaches = [
  { id: 1, name: 'د. ريم العبدالله', specialty: 'إرشاد نفسي', city: 'عن بعد', rating: 4.9, price: 220, next: 'اليوم 7:30م', badge: 'جلسات قلق وتوازن', image: 'ر', experience: 11 },
  { id: 2, name: 'أ. ناصر الحربي', specialty: 'كوتشينق مهني', city: 'الرياض', rating: 4.8, price: 180, next: 'غداً 5:00م', badge: 'تخطيط مسار', image: 'ن', experience: 8 },
  { id: 3, name: 'د. ليان الشمري', specialty: 'إرشاد أسري', city: 'جدة', rating: 4.95, price: 260, next: 'الأربعاء 8:00م', badge: 'العلاقات الأسرية', image: 'ل', experience: 13 },
  { id: 4, name: 'أ. مها اليامي', specialty: 'تطوير الذات', city: 'عن بعد', rating: 4.7, price: 150, next: 'الخميس 6:30م', badge: 'عادات وإنجاز', image: 'م', experience: 6 },
  { id: 5, name: 'د. سامي القحطاني', specialty: 'إرشاد نفسي', city: 'الدمام', rating: 4.85, price: 240, next: 'السبت 4:00م', badge: 'إدارة الضغوط', image: 'س', experience: 10 },
  { id: 6, name: 'أ. جود الرشيد', specialty: 'كوتشينق علاقات', city: 'عن بعد', rating: 4.78, price: 190, next: 'الأحد 9:00م', badge: 'وعي وحدود', image: 'ج', experience: 7 }
];

const programs = [
  { id: 1, title: 'دفتر الهدوء الرقمي', type: 'منتج تدريبي رقمي', duration: '21 يوم', price: 89, level: 'مبتدئ', icon: '🌿' },
  { id: 2, title: 'برنامج وضوح المسار', type: 'برنامج كوتشينق ذاتي', duration: '4 أسابيع', price: 240, level: 'متوسط', icon: '🧭' },
  { id: 3, title: 'حقيبة مهارات التواصل الأسري', type: 'حقيبة تدريبية', duration: '10 وحدات', price: 170, level: 'عائلي', icon: '🏡' },
  { id: 4, title: 'خطة التعافي من الاحتراق', type: 'برنامج صوتي وعملي', duration: '14 يوم', price: 120, level: 'عملي', icon: '✨' },
  { id: 5, title: 'قوالب جلسات التأمل الموجه', type: 'مكتبة رقمية', duration: '30 ملف', price: 65, level: 'متاح للجميع', icon: '🎧' }
];

const assessments = [
  { id: 1, name: 'مقياس الاتزان النفسي', category: 'نفسي', questions: 48, report: 'تحليل مستويات الضغط والمرونة', accuracy: '92%' },
  { id: 2, name: 'بوصلة القيم الشخصية', category: 'شخصي', questions: 36, report: 'خريطة أولويات وقرارات', accuracy: '89%' },
  { id: 3, name: 'مؤشر جودة العلاقة الأسرية', category: 'أسري', questions: 42, report: 'نقاط قوة وتوصيات حوار', accuracy: '91%' },
  { id: 4, name: 'مقياس أنماط الإنجاز', category: 'مهني', questions: 30, report: 'أسلوب العمل والتحفيز', accuracy: '87%' }
];

const reports = [
  { id: 'WR-1042', client: 'سارة م.', type: 'اتزان نفسي', date: '2026-02-12', progress: 82, status: 'جاهز' },
  { id: 'WR-1041', client: 'خالد ع.', type: 'كوتشينق مهني', date: '2026-02-10', progress: 68, status: 'قيد الإعداد' },
  { id: 'WR-1039', client: 'نورة ف.', type: 'إرشاد أسري', date: '2026-02-08', progress: 94, status: 'جاهز' },
  { id: 'WR-1037', client: 'عبدالله ر.', type: 'قيم شخصية', date: '2026-02-05', progress: 76, status: 'مراجعة' }
];

const state = {
  route: window.location.pathname === '/index.html' ? '/' : window.location.pathname,
  page: 1,
  filter: 'الكل',
  sort: 'rating',
  search: ''
};

const app = document.getElementById('app');
const toast = document.getElementById('toast');

function navigate(path) {
  if (window.location.pathname !== path) history.pushState({}, '', path);
  state.route = path;
  state.page = 1;
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

function shell(title, subtitle, body, eyebrow = 'وازن') {
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
        <h1 class="font-display text-4xl font-extrabold leading-[1.25] text-moss sm:text-6xl">احجز استشارة نفسية أو أسرية أو جلسة كوتشينق في مساحة آمنة وهادئة.</h1>
        <p class="mt-6 max-w-2xl text-lg leading-9 text-ink/70">وازن تجمع المختصين، المنتجات التدريبية الرقمية، برامج المقاييس الشخصية والنفسية، وإصدار تقارير احترافية تساعدك على فهم ذاتك وخطوتك التالية.</p>
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
              ${journey('مقياس أولي', 'اكتمل', 100)}${journey('جلسة كوتشينق', 'اليوم 7:30م', 64)}${journey('تقرير مهني', 'قيد المراجعة', 48)}
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
      ${feature('🎓','منتجات رقمية','أيقونة خاصة للحقائب والبرامج التدريبية الذاتية.','/programs')}
      ${feature('📏','مقاييس نفسية','اختبارات شخصية ونفسية وأسرية بتقارير قابلة للمشاركة.','/assessments')}
      ${feature('📊','تقارير احترافية','لوحة تقارير بصلاحيات وتقدم ورسوم متابعة.','/reports')}
    </div>
  </section>
  <section class="bg-moss py-16 text-white">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div class="lg:col-span-1"><span class="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">رحلة واضحة</span><h2 class="mt-4 font-display text-3xl font-extrabold">من سؤالك الأول حتى التقرير النهائي</h2></div>
      <div class="grid gap-4 lg:col-span-2 md:grid-cols-3">${step('01','اختر المسار','كوتشينق، نفسي، أسري، أو تطوير ذات.')}${step('02','احجز أو ابدأ مقياس','مواعيد مباشرة ومنتجات رقمية فورية.')}${step('03','استلم تقريرك','ملخص احترافي وتوصيات قابلة للتنفيذ.')}</div>
    </div>
  </section>`;
}

function stat(number, label) { return `<div class="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm"><p class="font-display text-2xl font-extrabold text-moss">${number}</p><p class="text-xs font-bold text-ink/55">${label}</p></div>`; }
function journey(title, meta, value) { return `<div class="rounded-3xl bg-white p-4 shadow-sm"><div class="mb-2 flex justify-between text-sm"><b class="text-moss">${title}</b><span class="text-ink/55">${meta}</span></div><div class="h-2 rounded-full bg-mint"><div class="progress-wave h-2 rounded-full" style="width:${value}%"></div></div></div>`; }
function feature(icon, title, text, route) { return `<a href="${route}" data-route="${route}" class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl"><span class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-2xl">${icon}</span><h3 class="font-display text-xl font-extrabold text-moss">${title}</h3><p class="mt-3 leading-7 text-ink/62">${text}</p></a>`; }
function step(num, title, text) { return `<div class="rounded-[2rem] border border-white/15 bg-white/10 p-6"><span class="text-sm font-extrabold text-sand">${num}</span><h3 class="mt-3 font-display text-xl font-extrabold">${title}</h3><p class="mt-3 leading-7 text-white/70">${text}</p></div>`; }

function coachesPage() {
  const specialties = ['الكل', ...new Set(coaches.map(c => c.specialty))];
  let list = coaches.filter(c => state.filter === 'الكل' || c.specialty === state.filter).filter(c => c.name.includes(state.search) || c.specialty.includes(state.search));
  list.sort((a,b) => state.sort === 'price' ? a.price - b.price : state.sort === 'experience' ? b.experience - a.experience : b.rating - a.rating);
  const perPage = 4;
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  state.page = Math.min(state.page, pages);
  const visible = list.slice((state.page - 1) * perPage, state.page * perPage);
  return shell('دليل المستشارين والكوتشز', 'قائمة قابلة للبحث والفرز والتصفية مع صفحات مستقلة وتفاصيل عميقة لكل مزود خدمة.', `
    <div class="reveal grid gap-4 rounded-[2rem] border border-white/70 bg-white/65 p-4 shadow-sm md:grid-cols-4">
      <input id="searchInput" value="${state.search}" placeholder="ابحث بالاسم أو التخصص" class="rounded-2xl border border-moss/10 bg-white px-4 py-3 transition focus:border-sage md:col-span-2">
      <select id="filterSelect" class="rounded-2xl border border-moss/10 bg-white px-4 py-3">${specialties.map(s => `<option ${s===state.filter?'selected':''}>${s}</option>`).join('')}</select>
      <select id="sortSelect" class="rounded-2xl border border-moss/10 bg-white px-4 py-3"><option value="rating" ${state.sort==='rating'?'selected':''}>الأعلى تقييماً</option><option value="price" ${state.sort==='price'?'selected':''}>الأقل سعراً</option><option value="experience" ${state.sort==='experience'?'selected':''}>الأكثر خبرة</option></select>
    </div>
    <div class="mt-6 grid gap-5 md:grid-cols-2">${visible.map(coachCard).join('')}</div>
    ${pagination(pages)}
  `, 'حجز الأطباء بصيغة الكوتشينق');
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
  return `<div class="mt-8 flex items-center justify-center gap-2">${Array.from({length: pages}, (_, i) => `<button onclick="setPage(${i+1})" class="h-11 w-11 rounded-2xl font-extrabold transition ${state.page===i+1?'bg-moss text-white shadow-leaf':'bg-white/75 text-moss hover:-translate-y-1'}">${i+1}</button>`).join('')}</div>`;
}

function programsPage() {
  return shell('المنتجات الرقمية التدريبية', 'مكتبة برامج وحقائب رقمية بأيقونة واضحة ومسارات قابلة للشراء أو الإهداء أو الإضافة لخطة المستفيد.', `
    <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">${programs.map(p => `<article class="card-hover reveal rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm"><span class="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-mint text-3xl">${p.icon}</span><p class="text-xs font-extrabold text-clay">${p.type}</p><h3 class="mt-2 font-display text-xl font-extrabold text-moss">${p.title}</h3><div class="mt-4 flex flex-wrap gap-2 text-xs font-bold text-ink/60"><span class="rounded-full bg-sand/70 px-3 py-1">${p.duration}</span><span class="rounded-full bg-sand/70 px-3 py-1">${p.level}</span></div><div class="mt-6 flex items-center justify-between"><b class="text-moss">${p.price} ر.س</b><button onclick="showToast('تمت إضافة ${p.title} إلى السلة')" class="rounded-2xl bg-moss px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-1">إضافة</button></div></article>`).join('')}</div>
  `, 'أيقونة المنتجات الرقمية');
}

function assessmentsPage() {
  return shell('برامج المقاييس الشخصية والنفسية', 'مقاييس منظمة للمستفيدين ومزودي الخدمة، مع تصنيف واضح وتقرير مهني قابل للإصدار بعد الإكمال.', `
    <div class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-calm">
      <div class="overflow-x-auto"><table class="w-full min-w-[720px] text-right"><thead class="bg-mint/70 text-sm text-moss"><tr><th class="p-4">المقياس</th><th class="p-4">الفئة</th><th class="p-4">الأسئلة</th><th class="p-4">دقة معيارية</th><th class="p-4">إجراءات CRUD</th></tr></thead><tbody>${assessments.map(a => `<tr class="border-t border-moss/10"><td class="p-4 font-bold text-moss">${a.name}<p class="text-sm font-normal text-ink/55">${a.report}</p></td><td class="p-4">${a.category}</td><td class="p-4">${a.questions}</td><td class="p-4">${a.accuracy}</td><td class="p-4"><div class="flex gap-2"><button onclick="showToast('بدء ${a.name}')" class="table-action rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white">بدء</button><button onclick="showToast('تم فتح تحرير المقياس')" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل</button><button onclick="showToast('تم نسخ رابط المقياس')" class="table-action rounded-xl bg-sand px-3 py-2 text-xs font-bold text-moss">نسخ</button><button onclick="showToast('تم أرشفة المقياس')" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></td></tr>`).join('')}</tbody></table></div>
    </div>
  `, 'مقاييس بتقارير احترافية');
}

function reportsPage() {
  return shell('إصدار التقارير الاحترافية', 'نموذج بصري لتقارير وازن: ملخص تنفيذي، درجات المقاييس، توصيات الجلسة، وخطة متابعة قابلة للطباعة.', `
    <div class="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <div class="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm"><h3 class="font-display text-2xl font-extrabold text-moss">مكونات التقرير</h3><div class="mt-5 space-y-3">${['ملخص تنفيذي بلغة واضحة','رسم تقدم ودرجات معيارية','توصيات عملية لمدة 14 يوم','ملاحظات المختص وسجل الجلسات','رابط مشاركة آمن وصلاحيات'].map((x,i)=>`<div class="flex items-center gap-3 rounded-2xl bg-mint/55 p-4"><span class="flex h-8 w-8 items-center justify-center rounded-full bg-moss text-sm font-bold text-white">${i+1}</span><b>${x}</b></div>`).join('')}</div></div>
      <div class="rounded-[2.2rem] bg-moss p-3 shadow-calm"><div class="rounded-[1.8rem] bg-[#fbf7ed] p-6"><div class="flex justify-between"><div><p class="text-sm font-bold text-ink/55">تقرير وازن المهني</p><h3 class="font-display text-3xl font-extrabold text-moss">ملف الاتزان النفسي</h3></div><span class="rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-moss">PDF</span></div><div class="mt-6 grid gap-3 sm:grid-cols-3">${stat('82%','مرونة نفسية')}${stat('68%','إدارة ضغط')}${stat('91%','وعي ذاتي')}</div><div class="mt-6 rounded-3xl bg-white p-5"><h4 class="font-display font-extrabold text-moss">توصية مختصرة</h4><p class="mt-2 leading-8 text-ink/65">جلسة متابعة أسبوعية مع برنامج صوتي لإدارة الضغط وتمرين تدوين يومي.</p></div></div></div>
    </div>
  `, 'تقارير قابلة للإصدار');
}

function joinProviderPage() {
  return shell('انضم كمزود خدمة', 'مسار احترافي للمدربين والمستشارين: ملف تعريفي، اعتماد، إدارة مواعيد، منتجات رقمية، وتقارير للمستفيدين.', `
    <div class="grid gap-6 lg:grid-cols-2"><form class="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); showToast('تم إرسال طلب الانضمام بنجاح')"><div class="grid gap-4"><input required placeholder="الاسم الكامل" class="rounded-2xl border border-moss/10 px-4 py-3"><input required placeholder="البريد المهني" class="rounded-2xl border border-moss/10 px-4 py-3"><select class="rounded-2xl border border-moss/10 px-4 py-3"><option>كوتشينق مهني</option><option>إرشاد نفسي</option><option>إرشاد أسري</option><option>تطوير ذات</option></select><textarea placeholder="نبذة عن خبرتك وشهاداتك" class="min-h-32 rounded-2xl border border-moss/10 px-4 py-3"></textarea><button class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1">إرسال الطلب</button></div></form><div class="space-y-4">${['إدارة جدول ومواعيد مرنة','بيع المنتجات الرقمية والحقائب','إصدار تقارير للمستفيدين','صفحة عامة قابلة للمشاركة'].map((x,i)=>`<div class="card-hover rounded-[2rem] border border-white/70 bg-white/65 p-5"><span class="text-sm font-extrabold text-clay">ميزة ${i+1}</span><h3 class="mt-2 font-display text-xl font-extrabold text-moss">${x}</h3></div>`).join('')}</div></div>
  `, 'للمزودين');
}

function dashboardReportsPage() {
  return shell('لوحة التقارير وإدارة المحتوى', 'جدول تقارير يحتوي على إجراءات عرض وتعديل وإصدار وحذف، مع متابعة حالة التقرير وتقدم المستفيد.', `
    <div class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-calm"><div class="overflow-x-auto"><table class="w-full min-w-[760px] text-right"><thead class="bg-moss text-sm text-white"><tr><th class="p-4">رقم التقرير</th><th class="p-4">المستفيد</th><th class="p-4">النوع</th><th class="p-4">التاريخ</th><th class="p-4">التقدم</th><th class="p-4">الحالة</th><th class="p-4">إجراءات CRUD</th></tr></thead><tbody>${reports.map(r => `<tr class="border-t border-moss/10"><td class="p-4 font-bold text-moss">${r.id}</td><td class="p-4">${r.client}</td><td class="p-4">${r.type}</td><td class="p-4">${r.date}</td><td class="p-4"><div class="h-2 w-28 rounded-full bg-mint"><div class="progress-wave h-2 rounded-full" style="width:${r.progress}%"></div></div></td><td class="p-4"><span class="rounded-full bg-sand/70 px-3 py-1 text-xs font-bold text-moss">${r.status}</span></td><td class="p-4"><div class="flex gap-2"><button onclick="showToast('عرض ${r.id}')" class="table-action rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white">عرض</button><button onclick="showToast('تحرير ${r.id}')" class="table-action rounded-xl bg-mint px-3 py-2 text-xs font-bold text-moss">تعديل</button><button onclick="showToast('إصدار PDF')" class="table-action rounded-xl bg-sand px-3 py-2 text-xs font-bold text-moss">إصدار</button><button onclick="showToast('تم حذف المسودة')" class="table-action rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">حذف</button></div></td></tr>`).join('')}</tbody></table></div></div>
  `, 'مسار عميق /dashboard/reports');
}

function bookingPage() {
  return shell('حجز جلسة جديدة', 'نموذج حجز سريع يربط المستفيد بالمختص المناسب مع اختيار نوع الجلسة والوقت.', `
    <form class="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); showToast('تم تأكيد طلب الحجز')"><div class="grid gap-4 md:grid-cols-2"><select class="rounded-2xl border border-moss/10 px-4 py-3"><option>إرشاد نفسي</option><option>كوتشينق مهني</option><option>إرشاد أسري</option><option>تطوير ذات</option></select><select class="rounded-2xl border border-moss/10 px-4 py-3">${coaches.map(c=>`<option>${c.name}</option>`).join('')}</select><input type="date" class="rounded-2xl border border-moss/10 px-4 py-3"><input type="time" class="rounded-2xl border border-moss/10 px-4 py-3"><textarea class="min-h-32 rounded-2xl border border-moss/10 px-4 py-3 md:col-span-2" placeholder="ما الهدف من الجلسة؟"></textarea><button class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1 md:col-span-2">تأكيد الحجز</button></div></form>
  `, 'حجز آمن');
}

function loginPage() {
  return shell('تسجيل الدخول', 'دخول موحد للمستفيد ومزود الخدمة مع واجهة هادئة وواضحة.', `<form class="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-calm" onsubmit="event.preventDefault(); showToast('تم تسجيل الدخول تجريبياً')"><input placeholder="البريد الإلكتروني" class="mb-4 w-full rounded-2xl border border-moss/10 px-4 py-3"><input type="password" placeholder="كلمة المرور" class="mb-4 w-full rounded-2xl border border-moss/10 px-4 py-3"><button class="w-full rounded-2xl bg-moss px-6 py-4 font-extrabold text-white transition hover:-translate-y-1">دخول</button></form>`, 'حسابك');
}

function notFoundPage() { return shell('الصفحة غير موجودة', 'يمكنك العودة للصفحة الرئيسية أو اختيار أحد مسارات المنصة.', `<a href="/" data-route="/" class="inline-flex rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">العودة للرئيسية</a>`); }

function render() {
  const base = state.route;
  document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.route === base));
  if (base.startsWith('/coaches/')) {
    const id = Number(base.split('/').pop());
    const c = coaches.find(item => item.id === id) || coaches[0];
    app.innerHTML = shell(c.name, `${c.specialty} · ${c.city} · تقييم ${c.rating}`, `<div class="grid gap-6 lg:grid-cols-2"><div class="rounded-[2rem] bg-white/75 p-6 shadow-calm"><h3 class="font-display text-2xl font-extrabold text-moss">نبذة مهنية</h3><p class="mt-4 leading-8 text-ink/65">مختص بخبرة ${c.experience} سنوات في ${c.badge}. يقدم جلسات فردية وخطط متابعة وتقارير تقدم مختصرة.</p></div><div class="rounded-[2rem] bg-moss p-6 text-white"><h3 class="font-display text-2xl font-extrabold">أقرب موعد</h3><p class="mt-4 text-white/75">${c.next}</p><button onclick="bookCoach(${c.id})" class="mt-6 rounded-2xl bg-white px-5 py-3 font-extrabold text-moss transition hover:-translate-y-1">احجز الآن</button></div></div>`, 'صفحة تفصيلية');
  } else {
    app.innerHTML = ({ '/': homePage, '/coaches': coachesPage, '/programs': programsPage, '/assessments': assessmentsPage, '/reports': reportsPage, '/join-provider': joinProviderPage, '/dashboard/reports': dashboardReportsPage, '/booking': bookingPage, '/login': loginPage }[base] || notFoundPage)();
  }
  bindDynamicControls();
}

function bindDynamicControls() {
  document.querySelectorAll('a[data-route]').forEach(link => {
    link.onclick = (event) => { event.preventDefault(); navigate(link.dataset.route); document.getElementById('navLinks').classList.add('hidden'); };
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.oninput = (e) => { state.search = e.target.value.trim(); state.page = 1; render(); };
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
window.bookCoach = bookCoach;
window.showToast = showToast;

window.addEventListener('popstate', () => { state.route = window.location.pathname; render(); });
document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('navLinks').classList.toggle('hidden'));

document.addEventListener('DOMContentLoaded', render);
