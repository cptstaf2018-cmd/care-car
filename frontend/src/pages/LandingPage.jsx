import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Globe, ArrowLeft, ArrowRight, Star,
  Target, Eye, Zap, ShieldCheck, Headphones, TrendingUp,
  Lightbulb, MapPin, Quote, Building, Cpu, Check, X, Mail,
  ChevronRight, Award, Users, BarChart3, Clock
} from 'lucide-react'

/* ─────────────────────── Bilingual content ─────────────────────── */
const T = {
  ar: {
    dir: 'rtl', lang: 'ar',
    nav: { features: 'المميزات', pricing: 'الأسعار', about: 'من نحن', faq: 'لماذا نحن', login: 'دخول', register: 'ابدأ مجاناً', toggle: 'EN' },
    hero: {
      badge: 'قصة CearCar',
      title1: 'بنينا النظام الذي',
      titleAccent: 'تمنّينا وجوده',
      sub: 'CearCar وُلد داخل ورش العراق، لا في غرفة اجتماعات بعيدة. مهمتنا: أن يدير صاحب المركز عمله بثقة، بأدوات بسيطة بقدر ما هي قوية.',
      cta1: 'ابدأ مجاناً',
      cta2: 'اعرف أكثر',
      trust: 'يثق بنا أكثر من ٢٠٠ مركز في العراق',
    },
    stats: [
      { val: '+٢٠٠', label: 'مركز يعتمدنا', icon: 'Users' },
      { val: '+٥٠ ألف', label: 'سيارة مُدارة', icon: 'BarChart3' },
      { val: '٩٩٪', label: 'رضا العملاء', icon: 'Award' },
      { val: '٢٠٢٤', label: 'سنة الانطلاق', icon: 'Clock' },
    ],
    story: {
      eyebrow: 'قصتنا',
      title: 'بدأت من دفتر ممزّق وزحمة آخر النهار',
      p1: 'في مركز لتغيير الزيت في بغداد، كان كل شيء يُكتب بخط اليد: أرقام اللوحات على ورقة، الأسعار في رأس صاحب المحل، وموعد الزيت القادم… ينساه الزبون غالباً.',
      p2: 'رأينا المشكلة عن قرب، فقررنا أن نبني أداة عراقية يفهمها أي موظف من أول يوم: تسجّل السيارة، تحسب الفاتورة، تنبّه الزبون، وتقول لك أين تذهب أرباحك.',
      quote: 'لم نُرد أن نُعلّم المراكز كيف تعمل — أردنا أن نمنحها الوقت لتعمل أكثر.',
      quoteBy: 'فريق CearCar',
    },
    mv: {
      eyebrow: 'رسالتنا ورؤيتنا',
      title: 'لماذا نستيقظ كل صباح',
      mission: { tag: 'الرسالة', title: 'نُبسّط إدارة المراكز', desc: 'أن نضع بين يدي كل مركز في العراق نظاماً واحداً يدير السيارات والخدمات والفواتير والمخزون بثقة — بلغته، وبسعر يقدر عليه.' },
      vision:  { tag: 'الرؤية',  title: 'مستوى عالمي بهوية محلية', desc: 'أن يصبح CearCar المعيار الذي تُدار به ورش ومراكز السيارات في العراق والمنطقة، حيث تتساوى البساطة مع القوة.' },
    },
    values: {
      eyebrow: 'قيمنا',
      title: 'مبادئ نُهندس عليها كل تفصيل',
      sub: 'ليست شعارات على الجدار — هي القرارات التي نتخذها في كل شاشة.',
      items: [
        { icon: 'Lightbulb', title: 'بساطة قبل كل شيء', desc: 'إن احتاجت الميزة إلى شرح طويل، فهي غير جاهزة بعد.' },
        { icon: 'MapPin',    title: 'عراقي حتى النخاع',  desc: 'بالدينار العراقي، بالعربية، وبفهمٍ لواقع الورشة.' },
        { icon: 'ShieldCheck', title: 'بياناتك ملكك',    desc: 'قاعدة بيانات معزولة لكل مركز، تشفير، ونسخ احتياطي تلقائي.' },
        { icon: 'Zap',        title: 'السرعة احترام للوقت', desc: 'فاتورة في ثانية، وسيارة تُسجَّل قبل أن يُغلق الزبون باب سيارته.' },
        { icon: 'Headphones', title: 'دعم بشري حقيقي',   desc: 'فريق عراقي يردّ عليك بلسانك، لا روبوت ولا رسائل آلية.' },
        { icon: 'TrendingUp', title: 'ننمو معك',          desc: 'من مركز واحد إلى عدة فروع — النظام يكبر بقدر طموحك.' },
      ],
    },
    why: {
      eyebrow: 'لماذا CearCar',
      title: 'الفرق بين أن «تشتغل» وأن «تدير»',
      sub: 'هكذا يبدو يومك قبل CearCar وبعده.',
      oldTitle: 'الطريقة التقليدية',
      newTitle: 'مع CearCar',
      rows: [
        { old: 'دفاتر وأوراق تضيع وتتلف',              neu: 'كل شيء محفوظ سحابياً ومنظّم' },
        { old: 'الزبون ينسى موعد الزيت',               neu: 'تذكير واتساب يصله تلقائياً' },
        { old: 'لا تعرف أرباح اليوم إلا بالحَزر',      neu: 'تقرير لحظي بضغطة واحدة' },
        { old: 'المخزون ينفد فجأة',                    neu: 'خصم تلقائي وتنبيه قبل النفاد' },
        { old: 'فاتورة بخط اليد غير احترافية',          neu: 'فاتورة بشعارك جاهزة للطباعة' },
      ],
    },
    timeline: {
      eyebrow: 'رحلتنا',
      title: 'من فكرة إلى ٢٠٠ مركز',
      items: [
        { year: '٢٠٢٤', title: 'الشرارة الأولى',       desc: 'انطلقت الفكرة من ورشة حقيقية، وبُنيت أول نسخة مع ثلاثة مراكز في بغداد.' },
        { year: '٢٠٢٤', title: 'الإطلاق الرسمي',       desc: 'أطلقنا CearCar بواجهة عربية كاملة، فواتير فورية، وإدارة سيارات وخدمات.' },
        { year: '٢٠٢٥', title: 'الذكاء يدخل الورشة',   desc: 'أضفنا قراءة اللوحة بالكاميرا، تذكيرات واتساب، والمخزون الذكي.' },
        { year: 'اليوم', title: '+٢٠٠ مركز ونكبر',     desc: 'منصة يعتمد عليها مئات المراكز يومياً، ونعمل على دعم الفروع المتعددة.' },
      ],
    },
    studio: {
      eyebrow: 'من يقف خلف CearCar',
      title: 'صُنع بفخر في العراق',
      desc: 'CearCar من تطوير وتشغيل Baghdad Future AI — فريق هندسي عراقي يبني أدوات ذكاء اصطناعي وبرمجيات تخدم السوق المحلي بمعايير عالمية.',
      cta: 'زيارة Baghdad Future AI',
      pills: ['هندسة محلية', 'ذكاء اصطناعي تطبيقي', 'دعم عربي', 'بنية سحابية آمنة'],
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
    nav: { features: 'Features', pricing: 'Pricing', about: 'About', faq: 'Why Us', login: 'Login', register: 'Start Free', toggle: 'عربي' },
    hero: {
      badge: 'The CearCar story',
      title1: 'We built the system',
      titleAccent: 'we wished existed',
      sub: "CearCar was born inside Iraqi workshops, not in a distant boardroom. Our mission: let a center owner run the business with confidence, using tools as simple as they are powerful.",
      cta1: 'Start Free',
      cta2: 'Learn More',
      trust: 'Trusted by 200+ centers across Iraq',
    },
    stats: [
      { val: '200+',  label: 'Centers rely on us',    icon: 'Users' },
      { val: '50K+',  label: 'Cars managed',           icon: 'BarChart3' },
      { val: '99%',   label: 'Owner satisfaction',     icon: 'Award' },
      { val: '2024',  label: 'Year we launched',       icon: 'Clock' },
    ],
    story: {
      eyebrow: 'Our story',
      title: 'It started with a torn notebook and end-of-day chaos',
      p1: "At an oil-change center in Baghdad, everything was handwritten: plate numbers on a scrap of paper, prices in the owner's head, and the next oil date… usually forgotten by the customer.",
      p2: 'We saw the problem up close, so we decided to build an Iraqi tool any employee understands on day one: it logs the car, totals the invoice, reminds the customer, and tells you where your profit goes.',
      quote: 'We never wanted to teach centers how to work — we wanted to give them the time to work more.',
      quoteBy: 'The CearCar team',
    },
    mv: {
      eyebrow: 'Mission & Vision',
      title: 'Why we get up every morning',
      mission: { tag: 'Mission', title: 'Make center management simple', desc: "To put in every Iraqi center's hands one system that runs cars, services, invoices, and inventory with confidence — in their language, at a price they can afford." },
      vision:  { tag: 'Vision',  title: 'World-class, locally rooted',   desc: 'For CearCar to become the standard by which car workshops and centers are run across Iraq and the region, where simplicity meets power.' },
    },
    values: {
      eyebrow: 'Our values',
      title: 'Principles we engineer every detail on',
      sub: "Not slogans on a wall — the decisions we make on every screen.",
      items: [
        { icon: 'Lightbulb',   title: 'Simplicity first',     desc: "If a feature needs a long explanation, it isn't ready yet." },
        { icon: 'MapPin',      title: 'Iraqi to the core',    desc: 'In Iraqi Dinar, in Arabic, with a real grasp of the workshop.' },
        { icon: 'ShieldCheck', title: 'Your data is yours',   desc: 'Isolated database per center, encryption, and automatic backups.' },
        { icon: 'Zap',         title: 'Speed respects time',  desc: 'An invoice in a second, a car logged before the door shuts.' },
        { icon: 'Headphones',  title: 'Real human support',   desc: 'An Iraqi team that answers in your language — no bots.' },
        { icon: 'TrendingUp',  title: 'We grow with you',     desc: 'From a single center to multiple branches — scales with your ambition.' },
      ],
    },
    why: {
      eyebrow: 'Why CearCar',
      title: 'The difference between "working" and "running"',
      sub: "Here's what your day looks like before CearCar and after.",
      oldTitle: 'The old way',
      newTitle: 'With CearCar',
      rows: [
        { old: 'Notebooks and papers that get lost',    neu: 'Everything stored in the cloud' },
        { old: 'Customer forgets the oil date',         neu: 'WhatsApp reminder sent automatically' },
        { old: "You only guess today's profit",         neu: 'Live report with one tap' },
        { old: 'Inventory runs out suddenly',           neu: 'Auto-deduction and low-stock alert' },
        { old: 'Unprofessional handwritten invoice',    neu: 'Branded invoice ready to print' },
      ],
    },
    timeline: {
      eyebrow: 'Our journey',
      title: 'From an idea to 200 centers',
      items: [
        { year: '2024', title: 'The first spark',               desc: 'The idea began in a real workshop, first beta with three centers in Baghdad.' },
        { year: '2024', title: 'Official launch',               desc: 'Launched CearCar with a fully Arabic interface, instant invoices, car & service management.' },
        { year: '2025', title: 'Intelligence enters workshop',  desc: 'Added camera plate-reading, WhatsApp reminders, and smart inventory.' },
        { year: 'Today', title: '200+ centers and growing',    desc: 'Hundreds of centers rely on us daily, while we expand to multi-branch and regional support.' },
      ],
    },
    studio: {
      eyebrow: 'Who stands behind CearCar',
      title: 'Proudly made in Iraq',
      desc: 'CearCar is built and operated by Baghdad Future AI — an Iraqi engineering team building AI tools and software for the local market to global standards.',
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
    cta: { title: 'Ready to level up your center?', sub: 'Join hundreds of centers running professionally — start today, free.', btn: 'Start Free Now' },
    footer: { desc: 'The smartest management platform for oil-change centers in Iraq.', product: 'Product', company: 'Company', contact: 'Contact', dev: 'Built & operated by', rights: 'All rights reserved' },
  },
}

const ICONS = { Lightbulb, MapPin, ShieldCheck, Zap, Headphones, TrendingUp, Users, BarChart3, Award, Clock }

/* ── Scroll reveal hook ── */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-visible'); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

/* ── Sub-components ── */
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
        <Sparkles size={16} className="text-white" />
      </div>
      <span className="font-black text-lg tracking-tight text-slate-900">CearCar</span>
    </div>
  )
}

function Eyebrow({ children, light }) {
  return (
    <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-4 ${light ? 'text-blue-300' : 'text-blue-600'}`}>
      <span className={`w-5 h-[2px] rounded-full ${light ? 'bg-blue-400' : 'bg-blue-500'}`} />
      {children}
    </div>
  )
}

function Section({ id, children, className = '' }) {
  const ref = useReveal()
  return (
    <section id={id} ref={ref} className={`lp-reveal ${className}`}>
      {children}
    </section>
  )
}

/* ── Main component ── */
export default function LandingPage() {
  const [lang, setLang] = useState('ar')
  const navigate = useNavigate()
  const c = T[lang]
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
    <div dir={c.dir} className={`min-h-screen bg-white text-slate-900 antialiased ${!isRtl ? 'lang-en' : ''}`}>

      {/* ══ NAVBAR ══ */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <button onClick={() => scrollTo('top')}><Logo /></button>

          <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-500">
            <button onClick={() => scrollTo('values')} className="hover:text-slate-900 transition-colors">{c.nav.features}</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-slate-900 transition-colors">{c.nav.pricing}</button>
            <button onClick={() => scrollTo('why')} className="hover:text-slate-900 transition-colors">{c.nav.faq}</button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setLang(isRtl ? 'en' : 'ar')}
              className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium">
              <Globe size={14} />{c.nav.toggle}
            </button>
            <button onClick={() => navigate('/login')}
              className="hidden sm:block text-[13px] text-slate-600 hover:text-slate-900 px-3 py-1.5 font-medium transition-colors">
              {c.nav.login}
            </button>
            <button onClick={() => navigate('/register')}
              className="text-[13px] font-bold text-white px-4 py-2 rounded-xl transition-all hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 6px 20px -4px rgba(37,99,235,0.45)' }}>
              {c.nav.register}
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <header id="top" className="relative min-h-screen flex items-center overflow-hidden pt-16 lp-hero-bg lp-noise">
        {/* Glow layers */}
        <div className="absolute inset-0 lp-hero-glow-a pointer-events-none" />
        <div className="absolute inset-0 lp-hero-glow-b pointer-events-none" />
        <div className="absolute inset-0 lp-hero-glow-c pointer-events-none" />

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }} />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 py-24">
          <div className={`max-w-2xl ${isRtl ? '' : ''}`}>

            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full border border-white/15 bg-white/[0.07] backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-xs font-semibold tracking-wide">{c.hero.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6 text-white">
              {c.hero.title1}
              <br />
              <span className="lp-gradient-text">{c.hero.titleAccent}</span>
            </h1>

            <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-xl">{c.hero.sub}</p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-12">
              <button onClick={() => navigate('/register')}
                className="group flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-white text-[15px] transition-all hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 16px 40px -8px rgba(37,99,235,0.55)' }}>
                {c.hero.cta1}
                <Arrow size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={() => scrollTo('story')}
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-[15px] border border-white/20 text-white/85 hover:bg-white/10 hover:border-white/30 transition-all">
                {c.hero.cta2}
                <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>

            {/* Trust */}
            <div className="flex items-center gap-3 text-sm text-white/40">
              <div className="flex">
                {[0,1,2,3,4].map(i => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
              </div>
              <span>{c.hero.trust}</span>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white to-transparent" />
      </header>

      {/* ══ STATS ══ */}
      <div className="relative z-10 px-5 -mt-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {c.stats.map((s, i) => {
            const Icon = ICONS[s.icon]
            return (
              <div key={i}
                className="rounded-2xl bg-white border border-slate-100 p-6 text-center transition-all hover:-translate-y-1"
                style={{ boxShadow: '0 4px 24px -6px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.06)' }}>
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#eff6ff,#e0e7ff)' }}>
                  <Icon size={18} className="text-blue-600" />
                </div>
                <div className="text-2xl md:text-3xl font-black lp-num-grad mb-1">{s.val}</div>
                <div className="text-xs text-slate-400 font-medium">{s.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ STORY ══ */}
      <Section id="story" className="px-5 py-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className={isRtl ? 'order-2 lg:order-1' : 'order-2 lg:order-2'}>
            <Eyebrow>{c.story.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6 text-slate-900 leading-tight">
              {c.story.title}
            </h2>
            <p className="text-slate-500 leading-relaxed text-lg mb-4">{c.story.p1}</p>
            <p className="text-slate-500 leading-relaxed text-lg mb-8">{c.story.p2}</p>

            {/* Quote */}
            <div className="relative rounded-2xl p-6 overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#eff6ff,#eef2ff)', border: '1px solid #dbeafe' }}>
              <Quote size={20} className="text-blue-400 mb-3" />
              <p className="text-slate-800 text-lg font-bold leading-snug mb-2">{c.story.quote}</p>
              <p className="text-slate-400 text-sm">— {c.story.quoteBy}</p>
            </div>
          </div>

          <div className={isRtl ? 'order-1 lg:order-2' : 'order-1 lg:order-1'}>
            <div className="relative rounded-3xl overflow-hidden"
              style={{ boxShadow: '0 40px 80px -20px rgba(15,23,42,0.25)' }}>
              {/* Fallback gradient when image missing */}
              <div className="w-full aspect-[4/3] flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#0f1f48,#1e3a8a,#1d4ed8)' }}>
                <div className="text-center text-white/30">
                  <Cpu size={64} />
                  <div className="mt-4 font-black text-2xl text-white/20">CearCar</div>
                </div>
              </div>
              <img src="/car-garage.png" alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" />

              {/* Floating badge */}
              <div className="absolute bottom-5 inset-x-5 rounded-xl bg-white/95 backdrop-blur-sm p-4 flex items-center gap-3"
                style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.15)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">CearCar</div>
                  <div className="text-xs text-slate-400">{isRtl ? 'مبني في العراق، للعراق' : 'Built in Iraq, for Iraq'}</div>
                </div>
                <div className={`${isRtl ? 'mr-auto' : 'ml-auto'} flex gap-0.5`}>
                  {[0,1,2,3,4].map(i => <Star key={i} size={11} className="text-amber-400 fill-amber-400" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ MISSION & VISION ══ */}
      <Section className="px-5 py-24" style={{ background: 'linear-gradient(180deg,#f8fafc 0%,#ffffff 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Eyebrow>{c.mv.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">{c.mv.title}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { d: c.mv.mission, Icon: Target, color: '#2563eb' },
              { d: c.mv.vision,  Icon: Eye,    color: '#4f46e5' },
            ].map(({ d, Icon, color }, i) => (
              <div key={i} className="lp-grad-border p-8 lp-card-shadow">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: `linear-gradient(135deg,${color}22,${color}11)` }}>
                  <Icon size={26} style={{ color }} />
                </div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                  style={{ color, background: `${color}15` }}>{d.tag}</span>
                <h3 className="text-xl font-black mb-3 text-slate-900">{d.title}</h3>
                <p className="text-slate-500 leading-relaxed text-[15px]">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══ VALUES ══ */}
      <Section id="values" className="px-5 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow>{c.values.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">{c.values.title}</h2>
            <p className="text-slate-400 text-lg">{c.values.sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {c.values.items.map((v, i) => {
              const Icon = ICONS[v.icon] || Lightbulb
              return (
                <div key={i}
                  className="group rounded-2xl bg-white border border-slate-100 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 cursor-default"
                  style={{ boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 8px 24px -8px rgba(15,23,42,0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                    style={{ background: 'linear-gradient(135deg,#eff6ff,#eef2ff)' }}>
                    <Icon size={22} className="text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-slate-900">{v.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ══ WHY CEARCAR ══ */}
      <Section id="why" className="px-5 py-28" style={{ background: 'linear-gradient(180deg,#f8fafc,#ffffff)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Eyebrow>{c.why.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">{c.why.title}</h2>
            <p className="text-slate-400 text-lg">{c.why.sub}</p>
          </div>

          <div className="rounded-3xl overflow-hidden border border-slate-200"
            style={{ boxShadow: '0 20px 60px -20px rgba(15,23,42,0.15)' }}>
            <div className="grid sm:grid-cols-2">
              {/* Old */}
              <div className="p-7 bg-white border-b sm:border-b-0 border-e border-slate-100">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <X size={15} className="text-slate-400" />
                  </div>
                  <span className="font-bold text-slate-400 text-sm">{c.why.oldTitle}</span>
                </div>
                <ul className="space-y-4">
                  {c.why.rows.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                      <X size={15} className="shrink-0 mt-0.5 text-slate-200" />
                      <span className="line-through decoration-slate-200">{r.old}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* New */}
              <div className="p-7 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#eef2ff 100%)' }}>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                    <Check size={15} className="text-white" />
                  </div>
                  <span className="font-bold text-blue-700 text-sm">{c.why.newTitle}</span>
                </div>
                <ul className="space-y-4">
                  {c.why.rows.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm font-medium leading-relaxed">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                        <Check size={11} className="text-white" />
                      </div>
                      {r.neu}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ PRICING ══ */}
      <Section id="pricing" className="px-5 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow>{c.pricing.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">{c.pricing.title}</h2>
            <p className="text-slate-400 text-lg">{c.pricing.sub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center max-w-5xl mx-auto">
            {c.pricing.plans.map((plan, i) => (
              <div key={i} className={`relative rounded-3xl p-7 flex flex-col h-full ${
                plan.popular ? 'text-white md:-mt-4 md:mb-4' : 'bg-white border border-slate-200'
              }`}
                style={plan.popular
                  ? { background: 'linear-gradient(145deg,#1e3a8a,#2563eb,#4f46e5)', boxShadow: '0 32px 64px -16px rgba(37,99,235,0.5)' }
                  : { boxShadow: '0 4px 20px -8px rgba(15,23,42,0.12)' }
                }>

                {plan.popular && (
                  <div className="absolute -top-3 inset-x-0 flex justify-center">
                    <span className="bg-amber-400 text-amber-900 text-[11px] font-black px-4 py-1 rounded-full">
                      ⭐ {c.pricing.popular}
                    </span>
                  </div>
                )}

                <h3 className={`text-base font-bold mb-4 ${plan.popular ? 'text-blue-200' : 'text-slate-500'}`}>
                  {plan.name}
                </h3>
                <div className={`text-4xl font-black mb-1 ${plan.popular ? 'text-white' : 'lp-num-grad'}`}>
                  {plan.price}
                </div>
                <div className={`text-sm mb-7 ${plan.popular ? 'text-blue-200' : 'text-slate-400'}`}>
                  {c.pricing.currency}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-start gap-2.5 text-sm ${plan.popular ? 'text-blue-100' : 'text-slate-600'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.popular ? 'bg-white/20' : ''
                      }`}
                        style={!plan.popular ? { background: 'linear-gradient(135deg,#eff6ff,#eef2ff)' } : {}}>
                        <Check size={11} className={plan.popular ? 'text-white' : 'text-blue-600'} />
                      </div>
                      {f}
                    </li>
                  ))}
                  {plan.no.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-200 line-through">
                      <div className="w-5 h-5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button onClick={() => navigate('/register')}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] ${
                    plan.popular
                      ? 'bg-white text-blue-700 hover:bg-blue-50'
                      : 'text-white'
                  }`}
                  style={!plan.popular
                    ? { background: 'linear-gradient(135deg,#1e293b,#0f172a)' }
                    : {}
                  }>
                  {c.pricing.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══ TIMELINE ══ */}
      <Section className="px-5 py-28" style={{ background: 'linear-gradient(180deg,#f8fafc,#ffffff)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Eyebrow>{c.timeline.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">{c.timeline.title}</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connector line desktop */}
            <div className="hidden md:block absolute top-[2.25rem] inset-x-[12.5%] h-[2px]"
              style={{ background: 'linear-gradient(90deg,transparent,#bfdbfe 20%,#a5b4fc 80%,transparent)' }} />

            {c.timeline.items.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="relative z-10 w-[4.5rem] h-[4.5rem] mx-auto mb-5 rounded-2xl bg-white border-2 border-blue-100 flex flex-col items-center justify-center"
                  style={{ boxShadow: '0 4px 16px -4px rgba(37,99,235,0.2)' }}>
                  <span className="text-[11px] font-black text-blue-500">{s.year}</span>
                  <span className="text-lg font-black lp-num-grad">{i + 1}</span>
                </div>
                <h3 className="text-base font-bold mb-2 text-slate-900">{s.title}</h3>
                <p className="text-slate-400 leading-relaxed text-[13px]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══ STUDIO ══ */}
      <Section className="px-5 py-10">
        <div className="max-w-5xl mx-auto rounded-[2rem] overflow-hidden relative lp-noise"
          style={{ background: 'linear-gradient(135deg,#060a14,#0d1630,#0f1f48)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-0 studio-mesh pointer-events-none" />
          <div className="relative z-10 px-8 md:px-14 py-16 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.06]">
                <Building size={13} className="text-blue-300" />
                <span className="text-blue-300 text-xs font-semibold">{c.studio.eyebrow}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-5 leading-tight">
                {c.studio.title}
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">{c.studio.desc}</p>
              <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:scale-[1.03] transition-transform">
                {c.studio.cta}
                <Arrow size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {c.studio.pills.map((p, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4 flex items-center gap-3 text-sm text-white/70 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ══ CTA ══ */}
      <Section className="px-5 py-10">
        <div className="max-w-5xl mx-auto rounded-[2rem] overflow-hidden relative text-center px-6 py-20"
          style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb,#4f46e5)', boxShadow: '0 40px 80px -20px rgba(37,99,235,0.4)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">{c.cta.title}</h2>
            <p className="text-blue-200 text-lg mb-9 max-w-xl mx-auto">{c.cta.sub}</p>
            <button onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2.5 bg-white px-9 py-4 rounded-2xl font-black text-lg text-blue-700 hover:scale-[1.03] transition-transform"
              style={{ boxShadow: '0 12px 32px -8px rgba(15,23,42,0.3)' }}>
              {c.cta.btn}
              <Arrow size={20} />
            </button>
          </div>
        </div>
      </Section>

      {/* ══ FOOTER ══ */}
      <footer className="relative px-5 pt-20 pb-10 bg-slate-50 border-t border-slate-100 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4"><Logo /></div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">{c.footer.desc}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-4 text-sm">{c.footer.product}</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><button onClick={() => scrollTo('values')} className="hover:text-slate-700 transition-colors">{c.nav.features}</button></li>
              <li><button onClick={() => scrollTo('pricing')} className="hover:text-slate-700 transition-colors">{c.nav.pricing}</button></li>
              <li><button onClick={() => scrollTo('why')} className="hover:text-slate-700 transition-colors">{c.nav.faq}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-4 text-sm">{c.footer.company}</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><span className="text-blue-600 font-medium">{c.nav.about}</span></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-slate-700 transition-colors">{c.nav.register}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-4 text-sm">{c.footer.contact}</h4>
            <a href="mailto:cptstaf2018@gmail.com"
              className="text-sm text-slate-400 hover:text-blue-600 transition-colors mb-3 flex items-center gap-2">
              <Mail size={14} className="text-blue-500" />
              cptstaf2018@gmail.com
            </a>
            <p className="text-xs text-slate-300 mt-3">
              {c.footer.dev}{' '}
              <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer"
                className="text-blue-500 hover:underline font-medium">
                Baghdad Future AI
              </a>
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
          <span>© {new Date().getFullYear()} CearCar</span>
          <span>{c.footer.rights}</span>
        </div>
      </footer>

    </div>
  )
}
