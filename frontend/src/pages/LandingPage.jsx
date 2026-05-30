import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Camera, MessageCircle, Package, FileText, BarChart3, Headphones,
  Check, ChevronDown, Globe, ArrowLeft, ArrowRight, Sparkles,
  Zap, ShieldCheck, Clock, Star
} from 'lucide-react'
import { PLAN_DETAILS, PLAN_ORDER } from '../constants/plans'

/* ───────────────────────── Copy (AR / EN) ───────────────────────── */
const T = {
  ar: {
    dir: 'rtl',
    nav: { features: 'المميزات', how: 'كيف يعمل', pricing: 'الأسعار', faq: 'الأسئلة', login: 'دخول', register: 'ابدأ مجاناً' },
    hero: {
      badge: 'منصة سحابية متكاملة لإدارة المراكز',
      title1: 'أدر مركزك',
      titleAccent: 'بمستوى عالمي',
      sub: 'نظام واحد يدير كل شيء — السيارات، الخدمات، الفواتير، المخزون، والتذكيرات. مصمّم خصيصاً لمراكز تغيير الزيت في العراق.',
      cta1: 'ابدأ الآن مجاناً',
      cta2: 'شاهد المنصة',
      trust: 'يثق بنا أكثر من ٢٠٠ مركز في العراق',
    },
    stats: [
      { val: '+٢٠٠', label: 'مركز نشط' },
      { val: '٩٩٪', label: 'رضا العملاء' },
      { val: '٢٤/٧', label: 'دعم متواصل' },
      { val: '٣ دقائق', label: 'للإعداد والبدء' },
    ],
    marquee: ['فواتير فورية', 'قراءة اللوحة', 'تذكيرات واتساب', 'مخزون ذكي', 'تقارير لحظية', 'كاميرا IP', 'طباعة A4', 'متعدد الفروع'],
    feat: {
      eyebrow: 'كل ما تحتاجه',
      title: 'منصة كاملة، لا أدوات متفرقة',
      sub: 'من لحظة دخول السيارة حتى الفاتورة — كل شيء متصل ويعمل تلقائياً.',
      items: [
        { icon: Camera, title: 'كاميرا وقراءة اللوحة', desc: 'تُسجّل السيارة تلقائياً بمجرد دخولها بالذكاء الاصطناعي.' },
        { icon: MessageCircle, title: 'تذكيرات واتساب', desc: 'الزبون يصله تذكير تلقائي قبل انتهاء موعد الزيت.' },
        { icon: Package, title: 'مخزون ذكي', desc: 'المواد والزيوت تنخفض تلقائياً مع كل خدمة.' },
        { icon: FileText, title: 'فاتورة في ثانية', desc: 'فاتورة احترافية بشعارك جاهزة للطباعة والإرسال.' },
        { icon: BarChart3, title: 'تقارير لحظية', desc: 'اعرف أرباحك اليوم والشهر بضغطة واحدة.' },
        { icon: Headphones, title: 'دعم فني حقيقي', desc: 'فريق عراقي جاهز لمساعدتك في أي وقت.' },
      ],
    },
    how: {
      eyebrow: 'البداية سهلة',
      title: 'ثلاث خطوات وأنت جاهز',
      steps: [
        { icon: Zap, title: 'سجّل مركزك', desc: 'أدخل اسم المركز والبيانات الأساسية خلال دقيقة.' },
        { icon: ShieldCheck, title: 'اضبط الخدمات', desc: 'أضف خدماتك وأسعارك ومخزونك بسهولة.' },
        { icon: Clock, title: 'ابدأ الشغل', desc: 'أدخل أول سيارة وأصدر أول فاتورة فوراً.' },
      ],
    },
    show: {
      eyebrow: 'شاهد المنصة',
      title: 'بساطة في الواجهة، قوة في الأداء',
      sub: 'واجهة عربية بالكامل، يتقنها أي موظف من أول يوم.',
      items: [
        { img: '/ss-cars.png', tag: 'إدارة السيارات', title: 'كل تاريخ الزبون في ثانية', desc: 'أدخل رقم اللوحة لتظهر كل خدمات السيارة السابقة، نوع الزيت، والموعد القادم — دون أوراق ودون بحث.' },
        { img: '/ss-services.png', tag: 'الخدمات', title: 'أضف الخدمات والسعر يحتسب وحده', desc: 'اختر الزيت والفلتر والإضافات من قائمة جاهزة، والنظام يحسب الإجمالي تلقائياً بدقة.' },
        { img: '/ss-invoice.png', tag: 'الفواتير', title: 'فاتورة احترافية جاهزة للإرسال', desc: 'فاتورة بشعار مركزك، اطبعها A4 أو أرسلها على واتساب للزبون مباشرة بنقرة.' },
      ],
    },
    pricing: {
      eyebrow: 'أسعار واضحة',
      title: 'اختر الخطة التي تناسب مركزك',
      sub: 'بالدينار العراقي. بدون رسوم خفية. ألغِ في أي وقت.',
      currency: 'د.ع / شهرياً',
      popular: 'الأكثر طلباً',
      cta: 'ابدأ بهذه الخطة',
    },
    faq: {
      eyebrow: 'أسئلة شائعة',
      title: 'كل ما تريد معرفته',
      items: [
        { q: 'هل أستطيع تجربة المنصة قبل الدفع؟', a: 'نعم، تواصل معنا ونفعّل لك حساباً تجريبياً مجاناً لتجرب كل المميزات.' },
        { q: 'كيف تتم عملية الدفع؟', a: 'الدفع شهري عبر التحويل البنكي أو ZainCash، ويمكنك إلغاء الاشتراك في أي وقت دون التزام.' },
        { q: 'هل تعمل المنصة على الجوال؟', a: 'نعم، تعمل بشكل كامل على الهاتف والتابلت والكمبيوتر بنفس الجودة.' },
        { q: 'هل بياناتي آمنة؟', a: 'بالتأكيد. لكل مركز قاعدة بيانات معزولة، وكلمات المرور مشفّرة، والنسخ الاحتياطي تلقائي.' },
        { q: 'كيف أحصل على الدعم؟', a: 'عبر واتساب أو البريد الإلكتروني، وفريقنا العراقي متاح من ٩ صباحاً حتى ٦ مساءً.' },
      ],
    },
    cta: { title: 'جاهز ترفع مستوى مركزك؟', sub: 'انضم لمئات المراكز التي تدير عملها باحتراف.', btn: 'ابدأ مجاناً الآن' },
    footer: { desc: 'منصة الإدارة الأذكى لمراكز تغيير الزيت في العراق.', product: 'المنتج', company: 'الشركة', contact: 'تواصل معنا', dev: 'تطوير وتشغيل', rights: 'جميع الحقوق محفوظة' },
  },
  en: {
    dir: 'ltr',
    nav: { features: 'Features', how: 'How it works', pricing: 'Pricing', faq: 'FAQ', login: 'Login', register: 'Start Free' },
    hero: {
      badge: 'All-in-one cloud platform for service centers',
      title1: 'Run Your Center',
      titleAccent: 'at a World-Class Level',
      sub: 'One system that runs everything — cars, services, invoices, inventory, and reminders. Built specifically for oil-change centers in Iraq.',
      cta1: 'Start Free Now',
      cta2: 'See the Platform',
      trust: 'Trusted by 200+ centers across Iraq',
    },
    stats: [
      { val: '200+', label: 'Active centers' },
      { val: '99%', label: 'Customer satisfaction' },
      { val: '24/7', label: 'Support' },
      { val: '3 min', label: 'To set up & start' },
    ],
    marquee: ['Instant invoices', 'Plate reading', 'WhatsApp reminders', 'Smart inventory', 'Live reports', 'IP camera', 'A4 print', 'Multi-branch'],
    feat: {
      eyebrow: 'Everything you need',
      title: 'A full platform, not scattered tools',
      sub: 'From the moment a car arrives to the invoice — everything is connected and automatic.',
      items: [
        { icon: Camera, title: 'Camera & Plate Reading', desc: 'Registers the car automatically on entry using AI.' },
        { icon: MessageCircle, title: 'WhatsApp Reminders', desc: 'Customers get an automatic reminder before their oil is due.' },
        { icon: Package, title: 'Smart Inventory', desc: 'Materials and oils deduct automatically with each service.' },
        { icon: FileText, title: 'Invoice in Seconds', desc: 'Professional invoice with your logo, ready to print and send.' },
        { icon: BarChart3, title: 'Live Reports', desc: 'Know your daily and monthly profit with one tap.' },
        { icon: Headphones, title: 'Real Human Support', desc: 'An Iraqi team ready to help you anytime.' },
      ],
    },
    how: {
      eyebrow: 'Easy to start',
      title: 'Three steps and you are ready',
      steps: [
        { icon: Zap, title: 'Register your center', desc: 'Enter your center name and basics in a minute.' },
        { icon: ShieldCheck, title: 'Set up services', desc: 'Add your services, prices, and inventory easily.' },
        { icon: Clock, title: 'Start working', desc: 'Enter the first car and issue the first invoice instantly.' },
      ],
    },
    show: {
      eyebrow: 'See the platform',
      title: 'Simple to use, powerful underneath',
      sub: 'A fully Arabic interface any employee masters on day one.',
      items: [
        { img: '/ss-cars.png', tag: 'Cars', title: 'Full customer history in a second', desc: 'Enter the plate number to instantly see all past services, oil type, and the next appointment — no paper, no searching.' },
        { img: '/ss-services.png', tag: 'Services', title: 'Add services, price calculates itself', desc: 'Pick oil, filter, and extras from a ready list; the system totals everything automatically and precisely.' },
        { img: '/ss-invoice.png', tag: 'Invoices', title: 'A professional invoice ready to send', desc: 'An invoice with your center logo — print A4 or send it to the customer on WhatsApp with one tap.' },
      ],
    },
    pricing: {
      eyebrow: 'Clear pricing',
      title: 'Pick the plan that fits your center',
      sub: 'In Iraqi Dinar. No hidden fees. Cancel anytime.',
      currency: 'IQD / month',
      popular: 'Most Popular',
      cta: 'Start with this plan',
    },
    faq: {
      eyebrow: 'FAQ',
      title: 'Everything you want to know',
      items: [
        { q: 'Can I try the platform before paying?', a: 'Yes, contact us and we will activate a free trial so you can test every feature.' },
        { q: 'How does payment work?', a: 'Monthly via bank transfer or ZainCash, and you can cancel anytime with no commitment.' },
        { q: 'Does it work on mobile?', a: 'Yes, it works fully on phone, tablet, and computer with the same quality.' },
        { q: 'Is my data safe?', a: 'Absolutely. Each center has an isolated database, encrypted passwords, and automatic backups.' },
        { q: 'How do I get support?', a: 'Via WhatsApp or email, and our Iraqi team is available from 9am to 6pm.' },
      ],
    },
    cta: { title: 'Ready to level up your center?', sub: 'Join hundreds of centers running their work professionally.', btn: 'Start Free Now' },
    footer: { desc: 'The smartest management platform for oil-change centers in Iraq.', product: 'Product', company: 'Company', contact: 'Contact', dev: 'Built & operated by', rights: 'All rights reserved' },
  },
}

const planNames = {
  basic: { ar: 'الأساسية', en: 'Basic' },
  pro: { ar: 'الاحترافية', en: 'Pro' },
  enterprise: { ar: 'المؤسسية', en: 'Enterprise' },
}

/* ───────────────────────── Helpers ───────────────────────── */
const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] } }),
}

function Reveal({ children, className = '', i = 0, as = 'div' }) {
  const Comp = motion[as] || motion.div
  return (
    <Comp
      variants={reveal}
      custom={i}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className={className}
    >
      {children}
    </Comp>
  )
}

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300/90 mb-4">
      <span className="w-6 h-px bg-blue-400/50" />
      {children}
    </span>
  )
}

function BrowserFrame({ src, alt }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d1018] shadow-2xl">
      <div className="flex items-center gap-1.5 px-4 h-9 border-b border-white/[0.07] bg-white/[0.02]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div dir="ltr" className="mx-auto text-[11px] text-white/30 px-3 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.05]">
          carecar.online/center
        </div>
      </div>
      <img src={src} alt={alt} className="w-full block" onError={e => { e.target.style.display = 'none' }} />
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden transition-colors hover:border-white/[0.14]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-start">
        <span className="font-semibold text-white/90">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-blue-300 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-5 text-white/55 leading-relaxed text-[15px]">{a}</p>
      </motion.div>
    </div>
  )
}

/* ───────────────────────── Page ───────────────────────── */
export default function LandingPage() {
  const [lang, setLang] = useState('ar')
  const t = T[lang]
  const navigate = useNavigate()
  const isRtl = lang === 'ar'
  const Arrow = isRtl ? ArrowLeft : ArrowRight

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const marqueeItems = [...t.marquee, ...t.marquee]

  return (
    <div dir={t.dir} className="min-h-screen bg-[#070810] text-white antialiased selection:bg-blue-500/30"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif" }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#070810]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo('top')} className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles size={16} className="text-white" />
            </span>
            <span className="font-black text-lg tracking-tight">CearCar</span>
          </button>

          <div className="hidden md:flex items-center gap-7 text-sm text-white/60">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">{t.nav.features}</button>
            <button onClick={() => scrollTo('how')} className="hover:text-white transition-colors">{t.nav.how}</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">{t.nav.pricing}</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors">{t.nav.faq}</button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setLang(isRtl ? 'en' : 'ar')}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <Globe size={15} />{isRtl ? 'EN' : 'عربي'}
            </button>
            <button onClick={() => navigate('/login')} className="hidden sm:block text-sm text-white/70 hover:text-white px-3 py-1.5 transition-colors">
              {t.nav.login}
            </button>
            <button onClick={() => navigate('/register')}
              className="text-sm font-semibold bg-white text-[#070810] px-4 py-2 rounded-lg hover:bg-white/90 transition-colors">
              {t.nav.register}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header id="top" className="relative overflow-hidden pt-36 pb-24 px-5">
        {/* gradient mesh + grid */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 lp-grid opacity-60" />
          <div className="lp-blob-a absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.32), transparent 65%)' }} />
          <div className="lp-blob-b absolute top-20 -right-40 w-[520px] h-[520px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%)' }} />
          <div className="lp-blob-a absolute top-40 -left-40 w-[480px] h-[480px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.18), transparent 65%)' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.button
            onClick={() => scrollTo('features')}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-sm text-white/70 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-7 hover:bg-white/[0.08] transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {t.hero.badge}
          </motion.button>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
            className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            {t.hero.title1}<br />
            <span className="lp-gradient-text">{t.hero.titleAccent}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}
            className="text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed mb-9">
            {t.hero.sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <button onClick={() => navigate('/register')}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-7 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all">
              {t.hero.cta1}
              <Arrow size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button onClick={() => scrollTo('showcase')}
              className="px-7 py-3.5 rounded-xl font-semibold text-base border border-white/15 text-white/90 hover:bg-white/5 transition-all">
              {t.hero.cta2}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-2 text-sm text-white/45">
            <span className="flex">{[0, 1, 2, 3, 4].map(i => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}</span>
            {t.hero.trust}
          </motion.div>
        </div>

        {/* Hero product shot */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.35 }}
          className="relative max-w-5xl mx-auto mt-16">
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 blur-3xl -z-10 rounded-[40px]" />
          <BrowserFrame src="/ss-cars.png" alt="منصة CearCar" />
        </motion.div>
      </header>

      {/* ── Stats ── */}
      <section className="relative px-5 -mt-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04]">
          {t.stats.map((s, i) => (
            <Reveal key={i} i={i} className="bg-[#0a0c16] p-6 text-center">
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{s.val}</div>
              <div className="text-sm text-white/45 mt-1">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="relative overflow-hidden py-10 mt-16 border-y border-white/[0.06]">
        <div className="flex gap-4 w-max lp-marquee-track">
          {marqueeItems.map((m, i) => (
            <span key={i} className="flex items-center gap-2 text-white/40 text-sm whitespace-nowrap px-5 py-2 rounded-full border border-white/[0.06] bg-white/[0.02]">
              <Check size={14} className="text-blue-400" />{m}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#070810] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#070810] to-transparent" />
      </div>

      {/* ── Features ── */}
      <section id="features" className="relative px-5 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow>{t.feat.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{t.feat.title}</h2>
            <p className="text-white/50 text-lg">{t.feat.sub}</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.feat.items.map((f, i) => (
              <Reveal key={i} i={i}>
                <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.25 }}
                  className="group h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 hover:border-blue-400/30 hover:bg-white/[0.04] transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-shadow">
                    <f.icon size={22} className="text-blue-300" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-white/50 leading-relaxed text-[15px]">{f.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative px-5 py-28 border-y border-white/[0.06] bg-white/[0.015]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <Eyebrow>{t.how.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t.how.title}</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 inset-x-[16%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            {t.how.steps.map((s, i) => (
              <Reveal key={i} i={i} className="relative text-center">
                <div className="relative z-10 w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <s.icon size={26} className="text-white" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#070810] border border-white/15 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-white/50 leading-relaxed">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase ── */}
      <section id="showcase" className="relative px-5 py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-20">
            <Eyebrow>{t.show.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{t.show.title}</h2>
            <p className="text-white/50 text-lg">{t.show.sub}</p>
          </Reveal>

          <div className="space-y-24">
            {t.show.items.map((s, i) => (
              <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
                <Reveal className="flex-1 w-full">
                  <div className="relative">
                    <div className="absolute -inset-3 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 blur-2xl -z-10 rounded-3xl" />
                    <BrowserFrame src={s.img} alt={s.title} />
                  </div>
                </Reveal>
                <Reveal className="flex-1 space-y-4">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-full">{s.tag}</span>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">{s.title}</h3>
                  <p className="text-white/55 leading-relaxed text-lg">{s.desc}</p>
                  <button onClick={() => navigate('/register')} className="inline-flex items-center gap-2 text-blue-300 font-semibold hover:gap-3 transition-all">
                    {lang === 'ar' ? 'جربه الآن' : 'Try it now'}<Arrow size={16} />
                  </button>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative px-5 py-28 border-t border-white/[0.06]">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)' }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <Eyebrow>{t.pricing.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{t.pricing.title}</h2>
            <p className="text-white/50 text-lg">{t.pricing.sub}</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {PLAN_ORDER.map((key, i) => {
              const plan = PLAN_DETAILS[key]
              const isPro = key === 'pro'
              return (
                <Reveal key={key} i={i} className="relative">
                  {isPro && <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-blue-500 to-indigo-600 blur-sm opacity-60" />}
                  <div className={`relative h-full rounded-3xl p-7 flex flex-col ${isPro
                    ? 'bg-gradient-to-b from-[#0e1326] to-[#0a0c16] border border-blue-400/40'
                    : 'bg-white/[0.02] border border-white/[0.08]'}`}>
                    {isPro && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-blue-500/30">
                        {t.pricing.popular}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white/90 mb-3">{planNames[key][lang]}</h3>
                    <div className="flex items-end gap-1.5 mb-1">
                      <span className={`text-4xl font-black ${isPro ? 'lp-gradient-text' : 'text-white'}`}>{plan.price}</span>
                    </div>
                    <div className="text-sm text-white/40 mb-7">{t.pricing.currency}</div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-white/75">
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Check size={11} className="text-blue-300" />
                          </span>{f}
                        </li>
                      ))}
                      {plan.noFeatures.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-white/30 line-through decoration-white/20">
                          <span className="mt-0.5 w-4 h-4 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>

                    <button onClick={() => navigate('/register')}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isPro
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:scale-[1.02]'
                        : 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/10'}`}>
                      {t.pricing.cta}
                    </button>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative px-5 py-28 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto">
          <Reveal className="text-center mb-14">
            <Eyebrow>{t.faq.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t.faq.title}</h2>
          </Reveal>
          <div className="space-y-3">
            {t.faq.items.map((item, i) => <Reveal key={i} i={i}><FAQItem q={item.q} a={item.a} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-5 py-12">
        <Reveal className="relative max-w-5xl mx-auto rounded-[32px] overflow-hidden border border-white/10">
          <img src="/car-garage.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#070810]/90 via-blue-950/80 to-indigo-950/85" />
          <div className="relative z-10 text-center px-6 py-20">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">{t.cta.title}</h2>
            <p className="text-white/65 text-lg mb-9 max-w-xl mx-auto">{t.cta.sub}</p>
            <button onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 bg-white text-[#070810] px-9 py-4 rounded-xl font-black text-lg hover:scale-[1.03] transition-transform shadow-2xl">
              {t.cta.btn}<Arrow size={20} />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="relative px-5 pt-20 pb-10 border-t border-white/[0.06] mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </span>
              <span className="font-black text-lg">CearCar</span>
            </div>
            <p className="text-white/45 text-sm leading-relaxed max-w-xs">{t.footer.desc}</p>
          </div>

          <div>
            <h4 className="font-semibold text-white/90 mb-4 text-sm">{t.footer.product}</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">{t.nav.features}</button></li>
              <li><button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">{t.nav.pricing}</button></li>
              <li><button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors">{t.nav.faq}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white/90 mb-4 text-sm">{t.footer.company}</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">{t.nav.register}</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">{t.nav.login}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white/90 mb-4 text-sm">{t.footer.contact}</h4>
            <p className="text-sm text-white/50 mb-3">cptstaf2018@gmail.com</p>
            <p className="text-xs text-white/40">
              {t.footer.dev}{' '}
              <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 transition-colors font-medium">Baghdad Future AI</a>
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-white/[0.06] pt-6 text-center text-xs text-white/35">
          © {new Date().getFullYear()} CearCar — {t.footer.rights}.
        </div>
      </footer>
    </div>
  )
}
