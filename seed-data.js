'use strict';

const seedCollections = {
  coaches: [
    { id: 1, name: 'د. ريم العبدالله', specialty: 'إرشاد نفسي', city: 'عن بعد', rating: 4.9, price: 220, next: 'اليوم 7:30م', badge: 'جلسات قلق وتوازن', image: 'ر', experience: 11 },
    { id: 2, name: 'أ. ناصر الحربي', specialty: 'كوتشينج مهني', city: 'الرياض', rating: 4.8, price: 180, next: 'غداً 5:00م', badge: 'تخطيط مسار', image: 'ن', experience: 8 },
    { id: 3, name: 'د. ليان الشمري', specialty: 'إرشاد أسري', city: 'جدة', rating: 4.95, price: 260, next: 'الأربعاء 8:00م', badge: 'العلاقات الأسرية', image: 'ل', experience: 13 },
    { id: 4, name: 'أ. مها اليامي', specialty: 'تطوير الذات', city: 'عن بعد', rating: 4.7, price: 150, next: 'الخميس 6:30م', badge: 'عادات وإنجاز', image: 'م', experience: 6 },
    { id: 5, name: 'د. سامي القحطاني', specialty: 'إرشاد نفسي', city: 'الدمام', rating: 4.85, price: 240, next: 'السبت 4:00م', badge: 'إدارة الضغوط', image: 'س', experience: 10 },
    { id: 6, name: 'أ. جود الرشيد', specialty: 'كوتشينج علاقات', city: 'عن بعد', rating: 4.78, price: 190, next: 'الأحد 9:00م', badge: 'وعي وحدود', image: 'ج', experience: 7 }
  ],
  programs: [
    { id: 1, title: 'دفتر الهدوء الرقمي', category: 'وعي ذاتي', type: 'منتج تدريبي رقمي', duration: '21 يوم', price: 89, level: 'مبتدئ', icon: '🌿', status: 'تم التفعيل', outcome: 'تمارين يومية قصيرة للتنفس والتدوين واستعادة الهدوء' },
    { id: 2, title: 'برنامج وضوح المسار', category: 'كوتشينج ذاتي', type: 'برنامج كوتشينج ذاتي', duration: '4 أسابيع', price: 240, level: 'متوسط', icon: '🧭', status: 'تم التفعيل', outcome: 'خارطة أهداف شخصية قابلة للقياس مع مراجعات أسبوعية' },
    { id: 3, title: 'حقيبة مهارات التواصل الأسري', category: 'أسري', type: 'حقيبة تدريبية', duration: '10 وحدات', price: 170, level: 'عائلي', icon: '🏡', status: 'تم التفعيل', outcome: 'نماذج حوار وحدود صحية وتمارين تطبيقية للأسرة' },
    { id: 4, title: 'خطة التعافي من الاحتراق', category: 'صحة نفسية', type: 'برنامج صوتي وعملي', duration: '14 يوم', price: 120, level: 'عملي', icon: '✨', status: 'تم التفعيل', outcome: 'خطة عملية لاستعادة الطاقة وتنظيم الجهد والراحة' },
    { id: 5, title: 'قوالب جلسات التأمل الموجه', category: 'مكتبة رقمية', type: 'مكتبة رقمية', duration: '30 ملف', price: 65, level: 'متاح للجميع', icon: '🎧', status: 'تم التفعيل', outcome: 'ملفات صوتية وقوالب تأمل تساعد على بناء روتين هادئ' }
  ],
  children: [
    { id: 1, title: 'برنامج تنظيم الانفعالات للأطفال', category: 'سلوكي', age: '6 - 9 سنوات', format: 'جلسات تفاعلية', duration: '6 أسابيع', price: 520, level: 'تأسيسي', icon: '🧩', status: 'تم التفعيل', outcome: 'تعزيز التعبير عن المشاعر وتقليل نوبات الغضب' },
    { id: 2, title: 'رحلة المهارات الاجتماعية', category: 'نمائي', age: '8 - 12 سنة', format: 'مجموعة صغيرة', duration: '8 أسابيع', price: 680, level: 'متوسط', icon: '🤝', status: 'تم التفعيل', outcome: 'بناء مهارات المشاركة، الدور، وبدء الحوار' },
    { id: 3, title: 'خطة تعديل السلوك المنزلية', category: 'سلوكي أسري', age: '4 - 10 سنوات', format: 'إرشاد والدين', duration: '4 أسابيع', price: 430, level: 'عملي', icon: '🏡', status: 'تم التفعيل', outcome: 'جدول تعزيز ومتابعة يومية قابلة للتطبيق في المنزل' },
    { id: 4, title: 'برنامج الانتباه والروتين', category: 'نمائي', age: '7 - 13 سنة', format: 'تمارين منزلية', duration: '5 أسابيع', price: 390, level: 'تأسيسي', icon: '🎯', status: 'تم التفعيل', outcome: 'تحسين الالتزام بالروتين والانتباه للمهام القصيرة' },
    { id: 5, title: 'مسار الاستعداد المدرسي', category: 'نمائي مدرسي', age: '5 - 7 سنوات', format: 'تقييم وخطة', duration: '3 أسابيع', price: 350, level: 'مبكر', icon: '🎒', status: 'تم التفعيل', outcome: 'خطة انتقال للمدرسة تشمل المهارات الاستقلالية والاجتماعية' },
    { id: 6, title: 'برنامج المرونة للمراهقين', category: 'سلوكي', age: '13 - 16 سنة', format: 'كوتشينج مراهقين', duration: '6 أسابيع', price: 590, level: 'متقدم', icon: '🌈', status: 'تم التفعيل', outcome: 'رفع الوعي الذاتي وإدارة الضغوط والعلاقات' }
  ],
  courses: [
    { id: 1, title: 'دورة أساسيات الكوتشينج الشخصي', category: 'كوتشينج', audience: 'أفراد وممارسون', format: 'مباشر عن بعد', duration: '12 ساعة', price: 450, level: 'مبتدئ', icon: '🎓', status: 'تم التفعيل', outcome: 'إتقان أدوات الأسئلة القوية وبناء هدف قابل للقياس' },
    { id: 2, title: 'برنامج إدارة الضغوط والاتزان', category: 'صحة نفسية', audience: 'الأفراد والفرق', format: 'مسجل + لقاءات', duration: '4 أسابيع', price: 320, level: 'متوسط', icon: '🍃', status: 'تم التفعيل', outcome: 'خطة شخصية للتعامل مع الضغط والاحتراق' },
    { id: 3, title: 'دورة مهارات التواصل الأسري', category: 'أسري', audience: 'الوالدان والأزواج', format: 'ورشة تفاعلية', duration: '6 ساعات', price: 260, level: 'عملي', icon: '💬', status: 'تم التفعيل', outcome: 'تطبيق نماذج حوار وحدود صحية داخل الأسرة' },
    { id: 4, title: 'برنامج بناء العادات والإنجاز', category: 'تطوير ذات', audience: 'طلاب وموظفون', format: 'تحدي تطبيقي', duration: '21 يوم', price: 180, level: 'مبتدئ', icon: '✅', status: 'تم التفعيل', outcome: 'تصميم نظام متابعة عادات أسبوعي قابل للاستمرار' },
    { id: 5, title: 'دورة صناعة التقارير المهنية', category: 'مهني', audience: 'مستشارون ومزودو خدمة', format: 'تدريب تطبيقي', duration: '8 ساعات', price: 520, level: 'متقدم', icon: '📊', status: 'تم التفعيل', outcome: 'كتابة تقرير واضح بتوصيات قابلة للتنفيذ' },
    { id: 6, title: 'برنامج الوعي بالقيم والقرار', category: 'تطوير ذات', audience: 'أفراد', format: 'مسار ذاتي', duration: '10 أيام', price: 140, level: 'مبتدئ', icon: '🧭', status: 'تم التفعيل', outcome: 'تحديد القيم الأساسية وربطها بالقرارات اليومية' }
  ],
  leadership: [
    { id: 1, title: 'برنامج القيادة الواعية للمنظمات', category: 'قيادة تنفيذية', audience: 'قيادات عليا', format: 'حضوري/عن بعد', duration: '5 أيام', price: 12500, level: 'تنفيذي', icon: '🏛️', status: 'تم التفعيل', outcome: 'مواءمة الرؤية والسلوك القيادي ومؤشرات الأثر' },
    { id: 2, title: 'مختبر بناء فرق عالية الأداء', category: 'فرق العمل', audience: 'إدارات وفرق', format: 'ورشة تطبيقية', duration: '3 أيام', price: 8800, level: 'متوسط', icon: '🚀', status: 'تم التفعيل', outcome: 'رفع الثقة وتوزيع الأدوار وبناء اتفاقيات عمل واضحة' },
    { id: 3, title: 'مسار إدارة التغيير المؤسسي', category: 'تحول وتغيير', audience: 'منظمات', format: 'استشارات + تدريب', duration: '6 أسابيع', price: 18500, level: 'متقدم', icon: '🔄', status: 'تم التفعيل', outcome: 'خارطة تغيير تشمل أصحاب المصلحة والمخاطر والتواصل' },
    { id: 4, title: 'برنامج ذكاء التواصل القيادي', category: 'تواصل مؤسسي', audience: 'مدراء أقسام', format: 'تدريب تنفيذي', duration: '16 ساعة', price: 7200, level: 'متوسط', icon: '🗣️', status: 'تم التفعيل', outcome: 'تحسين المحادثات الصعبة والتغذية الراجعة والاجتماعات' },
    { id: 5, title: 'أكاديمية قادة الصف الثاني', category: 'إعداد قيادات', audience: 'مرشحون للترقية', format: 'رحلة تعلم', duration: '8 أسابيع', price: 16000, level: 'متقدم', icon: '⭐', status: 'تم التفعيل', outcome: 'تطوير الكفاءات القيادية وخطة نمو فردية لكل مشارك' },
    { id: 6, title: 'تقييم الثقافة والرفاه المؤسسي', category: 'تشخيص مؤسسي', audience: 'جهات ومنظمات', format: 'تقييم وتقرير', duration: '4 أسابيع', price: 21000, level: 'استراتيجي', icon: '📈', status: 'تم التفعيل', outcome: 'تقرير قياس ثقافة ورفاه مع توصيات تنفيذية' }
  ],
  assessments: [
    { id: 1, name: 'مقياس الاتزان النفسي', category: 'نفسي', questions: 48, report: 'تحليل مستويات الضغط والمرونة', accuracy: '92%', status: 'تم التفعيل' },
    { id: 2, name: 'بوصلة القيم الشخصية', category: 'شخصي', questions: 36, report: 'خريطة أولويات وقرارات', accuracy: '89%', status: 'تم التفعيل' },
    { id: 3, name: 'مؤشر جودة العلاقة الأسرية', category: 'أسري', questions: 42, report: 'نقاط قوة وتوصيات حوار', accuracy: '91%', status: 'تم التفعيل' },
    { id: 4, name: 'مقياس أنماط الإنجاز', category: 'مهني', questions: 30, report: 'أسلوب العمل والتحفيز', accuracy: '87%', status: 'تم التفعيل' }
  ],
  reports: [
    { id: 'WR-1042', client: 'سارة م.', type: 'اتزان نفسي', date: '2026-02-12', progress: 82, status: 'جاهز' },
    { id: 'WR-1041', client: 'خالد ع.', type: 'كوتشينج مهني', date: '2026-02-10', progress: 68, status: 'قيد الإعداد' },
    { id: 'WR-1039', client: 'نورة ف.', type: 'إرشاد أسري', date: '2026-02-08', progress: 94, status: 'جاهز' },
    { id: 'WR-1037', client: 'عبدالله ر.', type: 'قيم شخصية', date: '2026-02-05', progress: 76, status: 'مراجعة' }
  ],
  subscriptions: [
    { id: 1, title: 'اشتراك نمو شهري', category: 'أفراد', period: 'شهري', price: 199, level: 'أساسي', icon: '🌱', status: 'تم التفعيل', outcome: 'جلسة متابعة شهرية مع محتوى تطبيقي وخطة تقدم' },
    { id: 2, title: 'اشتراك الأسرة الواعية', category: 'أسري', period: 'ربع سنوي', price: 549, level: 'متقدم', icon: '🏡', status: 'تم التفعيل', outcome: 'إرشاد أسري ومكتبة أدوات منزلية وتقارير متابعة' },
    { id: 3, title: 'اشتراك فرق العمل', category: 'جهات', period: 'سنوي', price: 8900, level: 'مؤسسي', icon: '🏛️', status: 'قريبا', outcome: 'مقاييس رفاه وفريق دعم وبرامج قيادية للموظفين' }
  ],
  phrases: [
    { id: 1, area: 'الرئيسية', text: 'مساحة آمنة للنمو', status: 'تم التفعيل' },
    { id: 2, area: 'المنتجات', text: 'ابدأ بخطوة صغيرة وواضحة اليوم', status: 'تم التفعيل' },
    { id: 3, area: 'الدعم', text: 'فريقنا يتابع طلبك حتى الإغلاق', status: 'قريبا' }
  ],
  supportTickets: [
    { id: 'SUP-1001', client: 'نورة ف.', issue: 'مشكلة في تحميل تقرير PDF', priority: 'عالي', status: 'مفتوح', resolution: 'تمت إعادة توليد الرابط وإرساله للعميلة' },
    { id: 'SUP-1002', client: 'خالد ع.', issue: 'تعديل موعد جلسة الكوتشينج', priority: 'متوسط', status: 'قيد الحل', resolution: 'بانتظار تأكيد الموعد الجديد من المختص' },
    { id: 'SUP-1003', client: 'سارة م.', issue: 'استفسار عن تفعيل الاشتراك', priority: 'منخفض', status: 'مغلق', resolution: 'تم شرح خطوات الدخول وتأكيد التفعيل' }
  ],
  platformSettings: [
    { id: 'brand-name', title: 'اسم المنصة', group: 'الهوية', value: 'Adrek', visibility: 'عام', status: 'تم التفعيل', updated: '2026-02-15', description: 'الاسم المعروض في رأس الموقع والتقارير والرسائل النظامية.' },
    { id: 'support-email', title: 'بريد الدعم الرئيسي', group: 'التواصل', value: 'care@adrek.example', visibility: 'عام', status: 'تم التفعيل', updated: '2026-02-14', description: 'البريد الذي يستقبل طلبات العملاء ومشاكل الدعم.' },
    { id: 'default-session-duration', title: 'مدة الجلسة الافتراضية', group: 'الحجوزات', value: '50 دقيقة', visibility: 'داخلي', status: 'تم التفعيل', updated: '2026-02-12', description: 'المدة المقترحة عند إنشاء مواعيد جديدة للمستشارين والكوتشز.' },
    { id: 'booking-window', title: 'نافذة الحجز المسبق', group: 'الحجوزات', value: '14 يوم', visibility: 'داخلي', status: 'تم التفعيل', updated: '2026-02-10', description: 'أقصى فترة متاحة أمام المستفيد لاختيار موعد جلسة قادمة.' },
    { id: 'currency', title: 'عملة التسعير', group: 'المدفوعات', value: 'ريال سعودي', visibility: 'عام', status: 'تم التفعيل', updated: '2026-02-09', description: 'العملة المستخدمة في بطاقات البرامج والاشتراكات والفواتير.' },
    { id: 'privacy-level', title: 'مستوى الخصوصية', group: 'الخصوصية', value: 'خصوصية عالية وتشفير للملفات', visibility: 'عام', status: 'تم التفعيل', updated: '2026-02-08', description: 'نص يوضح مستوى حماية بيانات المستفيدين في المنصة.' },
    { id: 'sms-notifications', title: 'تنبيهات الرسائل القصيرة', group: 'الإشعارات', value: 'تذكير قبل الجلسة بـ 24 ساعة', visibility: 'داخلي', status: 'قريبا', updated: '2026-02-06', description: 'سياسة إرسال رسائل التذكير للمستفيدين ومزودي الخدمة.' },
    { id: 'report-watermark', title: 'وسم التقارير', group: 'التقارير', value: 'تقرير Adrek المهني', visibility: 'عام', status: 'تم التفعيل', updated: '2026-02-05', description: 'الوسم النصي الذي يظهر داخل ملفات التقارير المهنية.' }
  ]
};

const ownerSeed = {
  username: 'admin',
  password: 'ChangeMe-2026!'
};

module.exports = {
  seedCollections,
  ownerSeed
};
