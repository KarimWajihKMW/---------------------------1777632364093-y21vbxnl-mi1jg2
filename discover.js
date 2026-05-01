'use strict';

const DISCOVERY_STORAGE_KEY = 'adrek-self-discovery-result';
const DISCOVERY_SCALE = [
  { value: 1, label: 'نادراً' },
  { value: 2, label: 'أحياناً' },
  { value: 3, label: 'غالباً' },
  { value: 4, label: 'بوضوح شديد' }
];
const DISCOVERY_QUESTIONS = [
  { id: 'stress', dimension: 'إرشاد نفسي', assessmentCategory: 'نفسي', title: 'أشعر أن الضغط أو القلق يؤثر على قراراتي وروتيني.' },
  { id: 'energy', dimension: 'إرشاد نفسي', assessmentCategory: 'نفسي', title: 'أحتاج إلى استعادة الهدوء والطاقة قبل أي خطة تطوير.' },
  { id: 'career', dimension: 'كوتشينج مهني', assessmentCategory: 'مهني', title: 'أرغب في وضوح مهني وخارطة أهداف قابلة للقياس.' },
  { id: 'decision', dimension: 'كوتشينج مهني', assessmentCategory: 'مهني', title: 'أجد صعوبة في ترتيب أولوياتي واتخاذ قرارات مهنية.' },
  { id: 'family', dimension: 'إرشاد أسري', assessmentCategory: 'أسري', title: 'تحتاج علاقاتي الأسرية إلى حوار وحدود واتفاقات أوضح.' },
  { id: 'relationships', dimension: 'كوتشينج علاقات', assessmentCategory: 'أسري', title: 'أحتاج لفهم نمط علاقاتي وبناء تواصل صحي.' },
  { id: 'values', dimension: 'تطوير الذات', assessmentCategory: 'شخصي', title: 'أريد اكتشاف قيمي وبناء عادات تعبر عني.' },
  { id: 'growth', dimension: 'تطوير الذات', assessmentCategory: 'شخصي', title: 'أحتاج إلى مسار نمو ذاتي منظم ومتابعة بسيطة.' }
];
const DISCOVERY_PATH_COPY = {
  'إرشاد نفسي': { icon: '🌿', title: 'مسار الاتزان النفسي', description: 'الأولوية الآن لخفض الضغط وفهم الانفعالات قبل بناء خطة طويلة.' },
  'كوتشينج مهني': { icon: '🧭', title: 'مسار وضوح مهني', description: 'النتيجة تشير لحاجة قوية لترتيب الأهداف المهنية والقرارات القادمة.' },
  'إرشاد أسري': { icon: '🏡', title: 'مسار العلاقات الأسرية', description: 'ابدأ بدعم متخصص لتحسين الحوار والحدود وتخفيف التوتر داخل الأسرة.' },
  'كوتشينج علاقات': { icon: '🤝', title: 'مسار وعي العلاقات', description: 'التركيز الأنسب هو فهم أنماط التواصل وبناء علاقات أكثر اتزاناً.' },
  'تطوير الذات': { icon: '✨', title: 'مسار النمو الشخصي', description: 'المناسب لك مسار عملي لاكتشاف القيم وبناء عادات صغيرة مستمرة.' }
};

const discoveryEscapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function discoveryState() {
  const state = window.adrekState;
  if (!state.discovery) state.discovery = { answers: {}, result: null };
  return state;
}

function getStoredDiscoveryResult() {
  try { return JSON.parse(window.adrekStorage.local.getItem(DISCOVERY_STORAGE_KEY) || 'null'); } catch (error) { return null; }
}

function saveDiscoveryResult(result) {
  window.adrekStorage.local.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(result));
}

function setDiscoveryAnswer(questionId, value) {
  discoveryState().discovery.answers[questionId] = Number(value);
  window.render();
}

function resetDiscovery() {
  const state = discoveryState();
  state.discovery = { answers: {}, result: null };
  window.adrekStorage.local.removeItem(DISCOVERY_STORAGE_KEY);
  window.navigate('/discover');
}

function showStoredDiscovery() {
  discoveryState().discovery.result = getStoredDiscoveryResult();
  window.navigate('/discover/result');
}

function discoveryProgress() {
  const answers = discoveryState().discovery.answers;
  const answered = DISCOVERY_QUESTIONS.filter((question) => answers[question.id]).length;
  return { answered, total: DISCOVERY_QUESTIONS.length, percent: Math.round((answered / DISCOVERY_QUESTIONS.length) * 100) };
}

function computeDiscoveryResult() {
  const state = discoveryState();
  const { answered, total } = discoveryProgress();
  if (answered < total) return null;

  const scores = DISCOVERY_QUESTIONS.reduce((acc, question) => {
    acc[question.dimension] = (acc[question.dimension] || 0) + Number(state.discovery.answers[question.id] || 0);
    return acc;
  }, {});
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primaryPath = ranked[0]?.[0] || 'تطوير الذات';
  const secondaryPath = ranked[1]?.[0] || 'إرشاد نفسي';
  const coaches = window.adrekCollections.coaches;
  const assessments = window.adrekCollections.assessments;
  const recommendedCoach = coaches
    .filter((coach) => coach.specialty === primaryPath || coach.specialty.includes(primaryPath.split(' ')[0]))
    .sort((a, b) => b.rating - a.rating || a.price - b.price)[0]
    || coaches.slice().sort((a, b) => b.rating - a.rating)[0]
    || null;
  const priorityCategories = DISCOVERY_QUESTIONS
    .filter((question) => [primaryPath, secondaryPath].includes(question.dimension))
    .map((question) => question.assessmentCategory);
  const recommendedAssessments = assessments
    .filter((assessment) => priorityCategories.includes(assessment.category))
    .slice(0, 3);
  const confidence = Math.min(96, Math.max(62, Math.round(((ranked[0]?.[1] || 0) / 8) * 100) + 18));

  return {
    id: `DS-${Date.now().toString().slice(-6)}`,
    primaryPath,
    secondaryPath,
    scores,
    confidence,
    recommendedCoach,
    recommendedAssessments,
    createdAt: new Date().toISOString()
  };
}

function finishDiscovery() {
  const result = computeDiscoveryResult();
  if (!result) return window.showToast('أكمل جميع إجابات اكتشف نفسك أولاً');
  discoveryState().discovery.result = result;
  saveDiscoveryResult(result);
  window.showToast('تم إنشاء توصيتك الذكية');
  window.navigate('/discover/result');
}

function discoveryAnswerButton(question, option) {
  const active = Number(discoveryState().discovery.answers[question.id]) === option.value;
  return `<button type="button" onclick="setDiscoveryAnswer('${question.id}', ${option.value})" class="rounded-2xl px-4 py-3 text-sm font-extrabold transition ${active ? 'bg-moss text-white shadow-leaf' : 'bg-white/75 text-moss hover:-translate-y-1'}">${option.label}</button>`;
}

function discoveryPage() {
  const { answered, total, percent } = discoveryProgress();
  const stored = getStoredDiscoveryResult();
  const questions = DISCOVERY_QUESTIONS.map((question, index) => `
    <article class="reveal rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div><span class="rounded-full bg-mint px-3 py-1 text-xs font-extrabold text-moss">${index + 1} من ${total} · ${question.dimension}</span><h3 class="mt-3 font-display text-xl font-extrabold leading-9 text-moss">${question.title}</h3></div>
        <span class="text-2xl">${DISCOVERY_PATH_COPY[question.dimension]?.icon || '🌱'}</span>
      </div>
      <div class="mt-5 grid gap-2 sm:grid-cols-4">${DISCOVERY_SCALE.map((option) => discoveryAnswerButton(question, option)).join('')}</div>
    </article>`).join('');

  return window.shell('اكتشف نفسك', 'اختبار اختياري سريع يجمع بين مقاييس شخصية واحترافية، وبعد الإكمال يعطيك توصية ذكية للمسار الأنسب والمختص المقترح دون أن يمنعك من الحجز المباشر.', `
    <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        <div class="mb-5 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-sm">
          <div class="flex items-center justify-between gap-4"><b class="text-moss">تقدم الإجابات: ${answered}/${total}</b><span class="font-extrabold text-clay">${percent}%</span></div>
          <div class="mt-3 h-3 rounded-full bg-mint"><div class="progress-wave h-3 rounded-full" style="width:${percent}%"></div></div>
        </div>
        <div class="grid gap-4">${questions}</div>
        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onclick="finishDiscovery()" class="rounded-2xl bg-moss px-7 py-4 font-extrabold text-white shadow-leaf">إظهار التوصية الذكية</button>
          <a data-route="/booking" href="/booking" class="rounded-2xl border border-moss/15 bg-white/70 px-7 py-4 text-center font-extrabold text-moss">تخطي والانتقال للحجز</a>
        </div>
      </div>
      <aside class="rounded-[2rem] bg-moss p-6 text-white shadow-calm">
        <h3 class="font-display text-2xl font-extrabold">اختياري بالكامل</h3>
        <p class="mt-4 leading-8 text-white/75">يمكنك استخدام اكتشف نفسك قبل الحجز للحصول على توصية، أو تجاهله والضغط على الحجز مباشرة.</p>
        <div class="mt-5 grid gap-3">${['يرشح المسار الأقرب لاحتياجك', 'يربطك بمختص مناسب من الدليل', 'يقترح مقاييس شخصية/مهنية داعمة', 'ينشئ صفحة نتيجة عميقة /discover/result'].map((item, index) => `<div class="rounded-2xl bg-white/10 p-4"><b>${index + 1}.</b> ${item}</div>`).join('')}</div>
        ${stored ? '<button onclick="showStoredDiscovery()" class="mt-5 w-full rounded-2xl bg-white px-5 py-3 font-extrabold text-moss">عرض آخر توصية</button>' : ''}
      </aside>
    </div>`, 'مسار اختياري /discover');
}

function discoveryResultPage() {
  const state = discoveryState();
  const result = state.discovery.result || getStoredDiscoveryResult();
  if (!result) return window.shell('لا توجد توصية بعد', 'أجب على أسئلة اكتشف نفسك أولاً للحصول على مسار ذكي ومختص مقترح.', `<a href="/discover" data-route="/discover" class="rounded-2xl bg-moss px-6 py-4 font-extrabold text-white">ابدأ اكتشف نفسك</a>`, 'نتيجة اكتشف نفسك');
  state.discovery.result = result;

  const copy = DISCOVERY_PATH_COPY[result.primaryPath] || DISCOVERY_PATH_COPY['تطوير الذات'];
  const coach = result.recommendedCoach;
  const assessmentCards = (result.recommendedAssessments || []).length
    ? result.recommendedAssessments.map((assessment) => `<div class="rounded-2xl bg-mint/55 p-4"><b class="text-moss">${discoveryEscapeHTML(assessment.name)}</b><p class="mt-1 text-sm leading-7 text-ink/60">${discoveryEscapeHTML(assessment.report)} · ${discoveryEscapeHTML(assessment.accuracy)}</p></div>`).join('')
    : '<p class="rounded-2xl bg-mint/55 p-4 text-ink/65">ابدأ بمقياس عام من صفحة المقاييس لاستكمال التقرير.</p>';
  const scores = Object.entries(result.scores || {}).sort((a, b) => b[1] - a[1]).map(([path, score]) => `
    <div class="rounded-2xl bg-white/70 p-4">
      <div class="flex justify-between"><b class="text-moss">${discoveryEscapeHTML(path)}</b><span class="font-extrabold text-clay">${score}/8</span></div>
      <div class="mt-2 h-2 rounded-full bg-mint"><div class="progress-wave h-2 rounded-full" style="width:${Math.round((score / 8) * 100)}%"></div></div>
    </div>`).join('');

  return window.shell('توصيتك الذكية', 'تم تحليل إجاباتك عبر مؤشرات شخصية واحترافية لتحديد المسار والمختص الأنسب كبداية اختيارية قبل الحجز.', `
    <div class="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <article class="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-calm">
        <span class="flex h-16 w-16 items-center justify-center rounded-3xl bg-mint text-3xl">${copy.icon}</span>
        <h2 class="mt-4 font-display text-4xl font-extrabold text-moss">${copy.title}</h2>
        <p class="mt-4 leading-9 text-ink/65">${copy.description}</p>
        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl bg-sand/70 p-4"><span class="text-xs font-extrabold text-ink/50">المسار الأساسي</span><p class="mt-1 font-bold text-moss">${discoveryEscapeHTML(result.primaryPath)}</p></div>
          <div class="rounded-2xl bg-mint/55 p-4"><span class="text-xs font-extrabold text-ink/50">مسار داعم</span><p class="mt-1 font-bold text-moss">${discoveryEscapeHTML(result.secondaryPath)}</p></div>
          <div class="rounded-2xl bg-white p-4"><span class="text-xs font-extrabold text-ink/50">درجة الثقة</span><p class="mt-1 font-bold text-moss">${result.confidence}%</p></div>
          <div class="rounded-2xl bg-white p-4"><span class="text-xs font-extrabold text-ink/50">رقم النتيجة</span><p class="mt-1 font-bold text-moss">${discoveryEscapeHTML(result.id)}</p></div>
        </div>
        <h3 class="mt-6 font-display text-2xl font-extrabold text-moss">تفصيل المؤشرات</h3>
        <div class="mt-4 grid gap-3">${scores}</div>
      </article>
      <aside class="rounded-[2rem] bg-moss p-6 text-white shadow-calm">
        <h3 class="font-display text-2xl font-extrabold">المختص المقترح</h3>
        ${coach ? `<div class="mt-5 rounded-2xl bg-white/10 p-4"><b class="text-xl">${discoveryEscapeHTML(coach.image)} ${discoveryEscapeHTML(coach.name)}</b><p class="mt-2 text-white/75">${discoveryEscapeHTML(coach.specialty)} · ★ ${coach.rating} · ${coach.price} ر.س</p><p class="mt-1 text-sm text-white/65">أقرب موعد: ${discoveryEscapeHTML(coach.next)}</p></div><button onclick="bookCoach(${coach.id})" class="mt-4 w-full rounded-2xl bg-white px-5 py-3 font-extrabold text-moss">حجز المختص المقترح</button>` : '<p class="mt-4 text-white/75">سيظهر المختص المقترح بعد تحميل بيانات الدليل.</p>'}
        <h3 class="mt-7 font-display text-2xl font-extrabold">مقاييس مقترحة</h3>
        <div class="mt-4 grid gap-3 text-ink">${assessmentCards}</div>
        <div class="mt-5 grid gap-3">
          <a href="/assessments" data-route="/assessments" class="rounded-2xl bg-white/10 px-5 py-3 text-center font-extrabold text-white">فتح المقاييس</a>
          <button onclick="resetDiscovery()" class="rounded-2xl bg-white/10 px-5 py-3 font-extrabold text-white">إعادة اكتشف نفسك</button>
          <a href="/booking" data-route="/booking" class="rounded-2xl bg-white px-5 py-3 text-center font-extrabold text-moss">الحجز بدون توصية</a>
        </div>
      </aside>
    </div>`, 'مسار عميق /discover/result');
}

Object.assign(window, {
  discoveryPage,
  discoveryResultPage,
  setDiscoveryAnswer,
  finishDiscovery,
  resetDiscovery,
  showStoredDiscovery,
  getStoredDiscoveryResult
});
