import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Globe, ArrowLeft, ArrowRight, Star,
  Target, Eye, Zap, ShieldCheck, Headphones, TrendingUp,
  Lightbulb, MapPin, Quote, Building, Cpu, Check, X, Mail
} from 'lucide-react'

/* ── Bilingual content ── */
const ABOUT_T = {
  ar: {
    dir: 'rtl', lang: 'ar',
    nav: { features: 'المميزات', pricing: 'الأسعار', about: 'من نحن', faq: 'الأسئلة', login: 'دخول', register: 'ابدأ مجاناً', toggle: 'EN' },
    hero: {
      badge: 'من نحن — قصة CearCar',
      title1: 'بنينا النظام الذي',
      titleAccent: 'تمنّينا وجوده',
      sub: 'CearCar وُلد داخل ورش العراق، لا في غرفة اجتماعات بعيدة. مهمتنا واحدة: أن يدير صاحب المركز عمله بثقة، بأدوات بسيطة بقدر ما هي قوية — من أول سيارة تدخل حتى آخر فاتورة في اليوم.',
      cta1: 'ابدأ الآن مجاناً',
      cta2: 'تعرّف على المنصة',
      trust: 'يثق بنا أكثر من ٢٠٠ مركز في العراق',
    },
    stats: [
      { val: '+٢٠٠', label: 'مركز يعتمد علينا' },
      { val: '+٥٠ ألف', label: 'سيارة تُدار عبر النظام' },
      { val: '٩٩٪', label: 'رضا أصحاب المراكز' },
      { val: '٢٠٢٤', label: 'سنة الانطلاق' },
    ],
    story: {
      eyebrow: 'قصتنا',
      title: 'بدأت من دفتر ممزّق وزحمة آخر النهار',
      p1: 'في مركز لتغيير الزيت في بغداد، كان كل شيء يُكتب بخط اليد: أرقام اللوحات على ورقة، الأسعار في رأس صاحب المحل، وموعد الزيت القادم… ينساه الزبون غالباً. عند آخر النهار، لا أحد يعرف بدقة كم دخل ولا كم بقي في المخزن.',
      p2: 'رأينا المشكلة عن قرب، فقررنا ألّا نبيع برنامجاً معقّداً مستورداً، بل أن نبني أداة عراقية يفهمها أي موظف من أول يوم: تسجّل السيارة، تحسب الفاتورة، تنبّه الزبون، وتقول لك بصدق أين تذهب أرباحك.',
      quote: 'لم نُرد أن نُعلّم المراكز كيف تعمل — أردنا أن نمنحها الوقت لتعمل أكثر.',
      quoteBy: 'فريق CearCar',
    },
    mv: {
      eyebrow: 'رسالتنا ورؤيتنا',
      title: 'لماذا نستيقظ كل صباح',
      mission: { tag: 'الرسالة', title: 'نُبسّط إدارة المراكز', desc: 'أن نضع بين يدي كل مركز في العراق نظاماً واحداً يدير السيارات والخدمات والفواتير والمخزون بثقة — بلغته، وبسعر يقدر عليه.' },
      vision: { tag: 'الرؤية', title: 'مستوى عالمي بهوية محلية', desc: 'أن يصبح CearCar المعيار الذي تُدار به ورش ومراكز السيارات في العراق والمنطقة، حيث تتساوى البساطة مع القوة، والتقنية مع الواقع اليومي.' },
    },
    values: {
      eyebrow: 'قيمنا',
      title: 'مبادئ نُهندس عليها كل تفصيل',
      sub: 'ليست شعارات على الجدار — هي القرارات التي نتخذها في كل شاشة.',
      items: [
        { icon: 'Lightbulb', title: 'بساطة قبل كل شيء', desc: 'إن احتاجت الميزة إلى شرح طويل، فهي غير جاهزة بعد. نختصر حتى يفهمها أي موظف فوراً.' },
        { icon: 'MapPin', title: 'عراقي حتى النخاع', desc: 'بالدينار العراقي، بالعربية، وبفهمٍ لواقع الورشة — لا ترجمة باهتة لمنتج أجنبي.' },
        { icon: 'ShieldCheck', title: 'بياناتك ملكك', desc: 'قاعدة بيانات معزولة لكل مركز، تشفير، ونسخ احتياطي تلقائي. أمانك ليس خياراً إضافياً.' },
        { icon: 'Zap', title: 'السرعة احترام للوقت', desc: 'فاتورة في ثانية، وسيارة تُسجَّل قبل أن يُغلق الزبون باب سيارته.' },
        { icon: 'Headphones', title: 'دعم بشري حقيقي', desc: 'فريق عراقي يردّ عليك بلسانك، لا روبوت ولا رسائل آلية باردة.' },
        { icon: 'TrendingUp', title: 'ننمو معك', desc: 'من مركز واحد إلى عدة فروع — النظام يكبر بقدر طموحك دون أن يتعثّر.' },
      ],
    },
    why: {
      eyebrow: 'لماذا CearCar',
      title: 'الفرق بين أن «تشتغل» وأن «تدير»',
      sub: 'هكذا يبدو يومك قبل CearCar وبعده.',
      oldTitle: 'الطريقة التقليدية',
      newTitle: 'مع CearCar',
      rows: [
        { old: 'دفاتر وأوراق تضيع وتتلف', neu: 'كل شيء محفوظ سحابياً ومنظّم' },
        { old: 'الزبون ينسى موعد الزيت', neu: 'تذكير واتساب يصله تلقائياً' },
        { old: 'لا تعرف أرباح اليوم إلا بالحَزر', neu: 'تقرير لحظي بضغطة واحدة' },
        { old: 'المخزون ينفد فجأة', neu: 'خصم تلقائي وتنبيه قبل النفاد' },
        { old: 'فاتورة بخط اليد غير احترافية', neu: 'فاتورة بشعارك جاهزة للطباعة' },
      ],
    },
    timeline: {
      eyebrow: 'رحلتنا',
      title: 'من فكرة إلى ٢٠٠ مركز',
      items: [
        { year: '٢٠٢٤', title: 'الشرارة الأولى', desc: 'انطلقت الفكرة من ورشة حقيقية، وبُنيت أول نسخة تجريبية مع ثلاثة مراكز في بغداد.' },
        { year: '٢٠٢٤', title: 'الإطلاق الرسمي', desc: 'أطلقنا CearCar بواجهة عربية كاملة، فواتير فورية، وإدارة سيارات وخدمات.' },
        { year: '٢٠٢٥', title: 'الذكاء يدخل الورشة', desc: 'أضفنا قراءة اللوحة بالكاميرا، تذكيرات واتساب، والمخزون الذكي.' },
        { year: 'اليوم', title: '+٢٠٠ مركز ونكبر', desc: 'منصة يعتمد عليها مئات المراكز يومياً، ونعمل على دعم الفروع المتعددة والمنطقة.' },
      ],
    },
    studio: {
      eyebrow: 'من يقف خلف CearCar',
      title: 'صُنع بفخر في العراق',
      desc: 'CearCar من تطوير وتشغيل Baghdad Future AI — فريق هندسي عراقي يبني أدوات ذكاء اصطناعي وبرمجيات تخدم السوق المحلي بمعايير عالمية. نؤمن أن التقنية الجادة تُبنى قريباً من الناس الذين تخدمهم، لا بعيداً عنهم.',
      cta: 'زيارة Baghdad Future AI',
      pills: ['هندسة محلية', 'ذكاء اصطناعي تطبيقي', 'دعم باللغة العربية', 'بنية سحابية آمنة'],
    },
    pricing: {
      eyebrow: 'أسعار واضحة',
      title: 'اختر الخطة التي تناسب مركزك',
      sub: 'بالدينار العراقي. بدون رسوم خفية. ألغِ في أي وقت.',
      currency: 'د.ع / شهرياً',
      popular: 'الأكثر طلباً',
      cta: 'ابدأ بهذه الخطة',
      plans: [
        { name: 'الأساسية', price: '100,000', popular: false,
          features: ['سيارات الزبائن وتاريخ الخدمة', 'خدمة سريعة وفواتير', 'تقارير أساسية', 'إعدادات المركز والشعار'],
          no: ['تذكيرات واتساب', 'إدارة المخزون', 'كاميرا IP', 'قراءة اللوحة'] },
        { name: 'الاحترافية', price: '150,000', popular: true,
          features: ['كل مميزات الأساسية', 'المخزون مع خصم تلقائي', 'تذكيرات واتساب التلقائية', 'تقارير متقدمة'],
          no: ['كاميرا IP', 'قراءة اللوحة OCR'] },
        { name: 'المؤسسية', price: '250,000', popular: false,
          features: ['كل مميزات الاحترافية', 'ربط كاميرا IP', 'قراءة اللوحة بالكاميرا', 'دعم متقدم وإعداد مخصص'],
          no: [] },
      ],
    },
    cta: { title: 'جاهز ترفع مستوى مركزك؟', sub: 'انضم لمئات المراكز التي تدير عملها باحتراف — وابدأ اليوم مجاناً.', btn: 'ابدأ مجاناً الآن' },
    footer: { desc: 'منصة الإدارة الأذكى لمراكز تغيير الزيت في العراق.', product: 'المنتج', company: 'الشركة', contact: 'تواصل معنا', dev: 'تطوير وتشغيل', rights: 'جميع الحقوق محفوظة' },
  },
  en: {
    dir: 'ltr', lang: 'en',
    nav: { features: 'Features', pricing: 'Pricing', about: 'About', faq: 'FAQ', login: 'Login', register: 'Start Free', toggle: 'عربي' },
    hero: {
      badge: 'About — the CearCar story',
      title1: 'We built the system',
      titleAccent: 'we wished existed',
      sub: "CearCar was born inside Iraqi workshops, not in a distant boardroom. Our mission is singular: let a center owner run the business with confidence, using tools as simple as they are powerful — from the first car in to the last invoice of the day.",
      cta1: 'Start Free Now',
      cta2: 'Explore the platform',
      trust: 'Trusted by 200+ centers across Iraq',
    },
    stats: [
      { val: '200+', label: 'Centers rely on us' },
      { val: '50K+', label: 'Cars managed via the system' },
      { val: '99%', label: 'Owner satisfaction' },
      { val: '2024', label: 'Year we launched' },
    ],
    story: {
      eyebrow: 'Our story',
      title: 'It started with a torn notebook and end-of-day chaos',
      p1: "At an oil-change center in Baghdad, everything was handwritten: plate numbers on a scrap of paper, prices in the owner's head, and the next oil date… usually forgotten by the customer. At day's end, nobody knew exactly how much came in or what was left in stock.",
      p2: 'We saw the problem up close, so we decided not to sell a complex imported program, but to build an Iraqi tool any employee understands on day one: it logs the car, totals the invoice, reminds the customer, and tells you honestly where your profit goes.',
      quote: 'We never wanted to teach centers how to work — we wanted to give them the time to work more.',
      quoteBy: 'The CearCar team',
    },
    mv: {
      eyebrow: 'Mission & Vision',
      title: 'Why we get up every morning',
      mission: { tag: 'Mission', title: 'Make center management simple', desc: "To put in every Iraqi center's hands one system that runs cars, services, invoices, and inventory with confidence — in their language, at a price they can afford." },
      vision: { tag: 'Vision', title: 'World-class, locally rooted', desc: 'For CearCar to become the standard by which car workshops and centers are run across Iraq and the region, where simplicity meets power and technology meets daily reality.' },
    },
    values: {
      eyebrow: 'Our values',
      title: 'Principles we engineer every detail on',
      sub: 'Not slogans on a wall — the decisions we make on every screen.',
      items: [
        { icon: 'Lightbulb', title: 'Simplicity first', desc: "If a feature needs a long explanation, it isn't ready yet. We trim until any employee gets it instantly." },
        { icon: 'MapPin', title: 'Iraqi to the core', desc: 'In Iraqi Dinar, in Arabic, with a real grasp of the workshop — not a faded translation of a foreign product.' },
        { icon: 'ShieldCheck', title: 'Your data is yours', desc: 'An isolated database per center, encryption, and automatic backups. Your safety is not an add-on.' },
        { icon: 'Zap', title: 'Speed respects time', desc: 'An invoice in a second, and a car logged before the customer shuts their door.' },
        { icon: 'Headphones', title: 'Real human support', desc: 'An Iraqi team that answers in your language — no bots, no cold automated replies.' },
        { icon: 'TrendingUp', title: 'We grow with you', desc: 'From a single center to multiple branches — the system scales with your ambition without stumbling.' },
      ],
    },
    why: {
      eyebrow: 'Why CearCar',
      title: 'The difference between "working" and "running"',
      sub: "Here's what your day looks like before CearCar and after.",
      oldTitle: 'The traditional way',
      newTitle: 'With CearCar',
      rows: [
        { old: 'Notebooks and papers that get lost or damaged', neu: 'Everything stored in the cloud and organized' },
        { old: 'The customer forgets the oil date', neu: 'A WhatsApp reminder reaches them automatically' },
        { old: "You only guess today's profit", neu: 'A live report with one tap' },
        { old: 'Inventory runs out suddenly', neu: 'Auto-deduction and a low-stock alert' },
        { old: 'An unprofessional handwritten invoice', neu: 'An invoice with your logo, ready to print' },
      ],
    },
    timeline: {
      eyebrow: 'Our journey',
      title: 'From an idea to 200 centers',
      items: [
        { year: '2024', title: 'The first spark', desc: 'The idea began in a real workshop, and a first beta was built with three centers in Baghdad.' },
        { year: '2024', title: 'Official launch', desc: 'We launched CearCar with a fully Arabic interface, instant invoices, and car & service management.' },
        { year: '2025', title: 'Intelligence enters the workshop', desc: 'We added camera plate-reading, WhatsApp reminders, and smart inventory.' },
        { year: 'Today', title: '200+ centers and growing', desc: 'A platform hundreds of centers rely on daily, while we work on multi-branch and regional support.' },
      ],
    },
    studio: {
      eyebrow: 'Who stands behind CearCar',
      title: 'Proudly made in Iraq',
      desc: 'CearCar is built and operated by Baghdad Future AI — an Iraqi engineering team building AI tools and software for the local market to global standards. We believe serious technology is built close to the people it serves, not far from them.',
      cta: 'Visit Baghdad Future AI',
      pills: ['Local engineering', 'Applied AI', 'Arabic-language support', 'Secure cloud infrastructure'],
    },
    pricing: {
      eyebrow: 'Clear pricing',
      title: 'Pick the plan that fits your center',
      sub: 'In Iraqi Dinar. No hidden fees. Cancel anytime.',
      currency: 'IQD / month',
      popular: 'Most Popular',
      cta: 'Start with this plan',
      plans: [
        { name: 'Basic', price: '100,000', popular: false,
          features: ['Customer cars & service history', 'Fast service & invoices', 'Basic reports', 'Center settings & logo'],
          no: ['WhatsApp reminders', 'Inventory management', 'IP camera', 'Plate reading'] },
        { name: 'Pro', price: '150,000', popular: true,
          features: ['Everything in Basic', 'Inventory with auto-deduction', 'Automatic WhatsApp reminders', 'Advanced reports'],
          no: ['IP camera', 'OCR plate reading'] },
        { name: 'Enterprise', price: '250,000', popular: false,
          features: ['Everything in Pro', 'IP camera integration', 'Camera plate reading', 'Advanced support & custom setup'],
          no: [] },
      ],
    },
    cta: { title: 'Ready to level up your center?', sub: 'Join hundreds of centers running professionally — and start today, free.', btn: 'Start Free Now' },
    footer: { desc: 'The smartest management platform for oil-change centers in Iraq.', product: 'Product', company: 'Company', contact: 'Contact', dev: 'Built & operated by', rights: 'All rights reserved' },
  },
}

const ICONS = { Lightbulb, MapPin, ShieldCheck, Zap, Headphones, TrendingUp, Target, Eye }

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg accent-grad flex items-center justify-center shadow-md" style={{ boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}>
        <Sparkles size={16} className="text-white" />
      </span>
      <span className="font-black text-lg tracking-tight text-slate-900">CearCar</span>
    </div>
  )
}

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold accent-text mb-4">
      <span className="w-6 h-px accent-line-bg" />
      {children}
    </span>
  )
}

export default function LandingPage() {
  const [lang, setLang] = useState('ar')
  const navigate = useNavigate()
  const c = ABOUT_T[lang]
  const isRtl = lang === 'ar'
  const Arrow = isRtl ? ArrowLeft : ArrowRight

  useEffect(() => {
    document.documentElement.dir = c.dir
    document.documentElement.lang = c.lang
    return () => {
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = 'ar'
    }
  }, [c.dir, c.lang])

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div dir={c.dir} className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo('top')} className="flex items-center"><Logo /></button>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 font-medium">
            <button onClick={() => scrollTo('values')} className="hover:text-slate-900 transition-colors">{c.nav.features}</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-slate-900 transition-colors">{c.nav.pricing}</button>
            <span className="accent-text font-semibold">{c.nav.about}</span>
            <button onClick={() => scrollTo('why')} className="hover:text-slate-900 transition-colors">{c.nav.faq}</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(isRtl ? 'en' : 'ar')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <Globe size={15} />{c.nav.toggle}
            </button>
            <button onClick={() => navigate('/login')} className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors font-medium">{c.nav.login}</button>
            <button onClick={() => navigate('/register')} className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">{c.nav.register}</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header id="top" className="relative min-h-[88vh] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src="/hero-suv.png" alt="" aria-hidden="true"
            className={`w-full h-full object-cover ${isRtl ? 'object-left' : 'object-right'}`} />
          <div className={`absolute inset-0 ${isRtl
            ? 'bg-gradient-to-l from-[#060a14]/96 via-[#060a14]/78 to-[#060a14]/15'
            : 'bg-gradient-to-r from-[#060a14]/96 via-[#060a14]/78 to-[#060a14]/15'}`} />
        </div>
        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 py-20">
          <div className={`max-w-xl ${isRtl ? 'mr-0 ml-auto' : 'ml-0 mr-auto'}`}>
            <span className="inline-flex items-center gap-2 text-sm accent-text-light bg-white/[0.08] border border-white/15 px-4 py-1.5 rounded-full mb-7">
              <span className="w-1.5 h-1.5 rounded-full accent-dot animate-pulse" />
              {c.hero.badge}
            </span>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tight mb-5 text-white">
              {c.hero.title1}<br />
              <span className="lp-gradient-text">{c.hero.titleAccent}</span>
            </h1>
            <p className="text-lg text-white/65 leading-relaxed mb-8">{c.hero.sub}</p>
            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={() => navigate('/register')}
                className="group flex items-center gap-2 accent-bg text-white px-7 py-3.5 rounded-xl font-bold text-base hover:brightness-110 hover:scale-[1.02] transition-all"
                style={{ boxShadow: '0 16px 40px -10px rgba(37,99,235,0.5)' }}>
                {c.hero.cta1}<Arrow size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={() => scrollTo('story')} className="px-7 py-3.5 rounded-xl font-semibold text-base border border-white/25 text-white hover:bg-white/10 transition-all">
                {c.hero.cta2}
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <span className="flex gap-0.5">{[0,1,2,3,4].map(i => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}</span>
              {c.hero.trust}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </header>

      {/* ── Stats ── */}
      <section className="relative px-5 -mt-8 z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden border border-slate-200 bg-white lp-card-shadow divide-x divide-slate-100">
          {c.stats.map((s, i) => (
            <div key={i} className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-black text-slate-900">{s.val}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Story ── */}
      <section id="story" className="relative px-5 py-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="order-2 lg:order-1">
            <Eyebrow>{c.story.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6 text-slate-900 leading-tight">{c.story.title}</h2>
            <p className="text-slate-500 leading-relaxed text-lg mb-4">{c.story.p1}</p>
            <p className="text-slate-500 leading-relaxed text-lg mb-8">{c.story.p2}</p>
            <div className="relative rounded-2xl accent-soft-bg border border-slate-200/60 p-6 pr-7">
              <Quote size={22} className="accent-text mb-3" />
              <p className="text-slate-800 text-xl font-bold leading-snug mb-2">{c.story.quote}</p>
              <p className="text-slate-400 text-sm font-medium">— {c.story.quoteBy}</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative rounded-3xl overflow-hidden lp-soft-shadow border border-slate-200">
              <img src="/car-garage.png" alt="" className="w-full h-full object-cover aspect-[4/3]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060a14]/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="relative px-5 py-28 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Eyebrow>{c.mv.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">{c.mv.title}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[{ d: c.mv.mission, Icon: Target }, { d: c.mv.vision, Icon: Eye }].map(({ d, Icon }, i) => (
              <div key={i} className="h-full rounded-3xl bg-white border border-slate-200 p-9 lp-card-shadow">
                <div className="w-14 h-14 rounded-2xl accent-soft-bg flex items-center justify-center mb-6">
                  <Icon size={26} className="accent-text" />
                </div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider accent-text accent-soft-bg px-3 py-1 rounded-full mb-4">{d.tag}</span>
                <h3 className="text-2xl font-black mb-3 text-slate-900">{d.title}</h3>
                <p className="text-slate-500 leading-relaxed text-[15px]">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section id="values" className="relative px-5 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow>{c.values.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">{c.values.title}</h2>
            <p className="text-slate-500 text-lg">{c.values.sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {c.values.items.map((v, i) => {
              const Icon = ICONS[v.icon] || Lightbulb
              return (
                <div key={i} className="group h-full rounded-2xl border border-slate-200 bg-white p-7 lp-card-shadow hover:border-blue-200 transition-colors">
                  <div className="w-12 h-12 rounded-xl accent-soft-bg flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                    <Icon size={22} className="accent-text" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">{v.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-[15px]">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Visual break ── */}
      <div className="relative overflow-hidden h-64 md:h-80 mx-5 my-4 rounded-3xl lp-soft-shadow">
        <img src="/hero-suv.png" alt="" aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover ${isRtl ? 'object-left' : 'object-right'}`} />
        <div className={`absolute inset-0 ${isRtl
          ? 'bg-gradient-to-l from-slate-950/90 via-slate-900/65 to-transparent'
          : 'bg-gradient-to-r from-slate-950/90 via-slate-900/65 to-transparent'}`} />
        <div className={`absolute inset-0 flex items-center ${isRtl ? 'justify-end px-10 md:px-16' : 'justify-start px-10 md:px-16'}`}>
          <div className="max-w-md">
            <p className="accent-text-light text-xs font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
              <Cpu size={14} />{isRtl ? 'ذكاء اصطناعي عراقي' : 'Iraqi-built AI'}
            </p>
            <h3 className="text-white text-2xl md:text-3xl font-black leading-snug">
              {isRtl ? 'بُني داخل الورشة، لا بعيداً عنها' : 'Built inside the workshop, not far from it'}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Why CearCar ── */}
      <section id="why" className="relative px-5 py-28 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Eyebrow>{c.why.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">{c.why.title}</h2>
            <p className="text-slate-500 text-lg">{c.why.sub}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-px rounded-3xl overflow-hidden border border-slate-200 bg-slate-200 lp-card-shadow">
            <div className="bg-white p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-5 text-slate-400 font-bold">
                <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center"><X size={16} /></span>
                {c.why.oldTitle}
              </div>
              <ul className="space-y-4">
                {c.why.rows.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400 text-[15px] leading-snug">
                    <X size={17} className="shrink-0 mt-0.5 text-slate-300" />{r.old}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 sm:p-7 relative">
              <div className="absolute inset-0 accent-soft-bg opacity-50 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-5 accent-text font-bold">
                  <span className="w-7 h-7 rounded-lg accent-bg text-white flex items-center justify-center"><Check size={16} /></span>
                  {c.why.newTitle}
                </div>
                <ul className="space-y-4">
                  {c.why.rows.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 text-[15px] font-medium leading-snug">
                      <span className="mt-0.5 w-[18px] h-[18px] rounded-full accent-bg flex items-center justify-center shrink-0"><Check size={11} className="text-white" /></span>{r.neu}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative px-5 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow>{c.pricing.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">{c.pricing.title}</h2>
            <p className="text-slate-500 text-lg">{c.pricing.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {c.pricing.plans.map((plan, i) => (
              <div key={i} className="relative">
                <div className={`relative h-full rounded-3xl p-7 flex flex-col bg-white ${plan.popular
                  ? 'lp-soft-shadow md:-mt-3 md:mb-3 border-2 border-blue-500'
                  : 'border border-slate-200 lp-card-shadow'}`}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 accent-grad text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap"
                      style={{ boxShadow: '0 6px 16px -4px rgba(37,99,235,0.4)' }}>
                      {c.pricing.popular}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-800 mb-3">{plan.name}</h3>
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className={`text-4xl font-black ${plan.popular ? 'lp-gradient-text' : 'text-slate-900'}`}>{plan.price}</span>
                  </div>
                  <div className="text-sm text-slate-400 mb-7">{c.pricing.currency}</div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="mt-0.5 w-4 h-4 rounded-full accent-soft-bg flex items-center justify-center shrink-0">
                          <Check size={11} className="accent-text" />
                        </span>{f}
                      </li>
                    ))}
                    {plan.no.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-300 line-through decoration-slate-200">
                        <span className="mt-0.5 w-4 h-4 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/register')}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.popular
                      ? 'accent-grad text-white hover:scale-[1.02]'
                      : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                    {c.pricing.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="relative px-5 py-28 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Eyebrow>{c.timeline.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">{c.timeline.title}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 inset-x-[12%] h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            {c.timeline.items.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="relative z-10 w-16 h-16 mx-auto mb-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-center lp-card-shadow">
                  <span className="accent-text font-black text-sm">{i + 1}</span>
                  <span className="absolute -top-2 -right-2 px-2 h-6 rounded-full accent-bg text-white text-[11px] font-bold flex items-center justify-center whitespace-nowrap">{s.year}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-900">{s.title}</h3>
                <p className="text-slate-500 leading-relaxed text-[15px]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Baghdad Future AI Studio ── */}
      <section className="relative px-5 py-12">
        <div className="relative max-w-5xl mx-auto rounded-[32px] overflow-hidden border border-slate-800 bg-[#060a14]">
          <div className="absolute inset-0 studio-mesh" />
          <div className="relative z-10 px-8 md:px-14 py-16 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-sm accent-text-light bg-white/[0.07] border border-white/15 px-4 py-1.5 rounded-full mb-6">
                <Building size={14} />{c.studio.eyebrow}
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-5 leading-tight">{c.studio.title}</h2>
              <p className="text-white/60 leading-relaxed text-lg mb-8">{c.studio.desc}</p>
              <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform">
                {c.studio.cta}<Arrow size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {c.studio.pills.map((p, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white/80 text-sm font-medium flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full accent-dot shrink-0" />{p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-5 py-12">
        <div className="relative max-w-5xl mx-auto rounded-[32px] overflow-hidden lp-soft-shadow">
          <img src="/hero-white.png" alt="" aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover ${isRtl ? 'object-left' : 'object-right'}`} />
          <div className={`absolute inset-0 cta-overlay ${isRtl ? 'cta-overlay-rtl' : 'cta-overlay-ltr'}`} />
          <div className="relative z-10 text-center px-6 py-20 text-white">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{c.cta.title}</h2>
            <p className="text-white/85 text-lg mb-9 max-w-xl mx-auto">{c.cta.sub}</p>
            <button onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 bg-white px-9 py-4 rounded-xl font-black text-lg hover:scale-[1.03] transition-transform shadow-xl accent-text">
              {c.cta.btn}<Arrow size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative px-5 pt-20 pb-10 border-t border-slate-100 bg-slate-50 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4"><Logo /></div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{c.footer.desc}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm">{c.footer.product}</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><button onClick={() => scrollTo('values')} className="hover:text-slate-900 transition-colors">{c.nav.features}</button></li>
              <li><button onClick={() => scrollTo('pricing')} className="hover:text-slate-900 transition-colors">{c.nav.pricing}</button></li>
              <li><button onClick={() => scrollTo('why')} className="hover:text-slate-900 transition-colors">{c.nav.faq}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm">{c.footer.company}</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><span className="accent-text font-medium">{c.nav.about}</span></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-slate-900 transition-colors">{c.nav.register}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm">{c.footer.contact}</h4>
            <p className="text-sm text-slate-500 mb-3 flex items-center gap-2"><Mail size={15} className="accent-text" />cptstaf2018@gmail.com</p>
            <p className="text-xs text-slate-400">{c.footer.dev}{' '}
              <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer" className="accent-text hover:underline font-medium">Baghdad Future AI</a>
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} CearCar — {c.footer.rights}.
        </div>
      </footer>
    </div>
  )
}
