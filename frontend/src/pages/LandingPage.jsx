import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Camera, MessageCircle, Package, FileText, BarChart2, Headphones,
  CheckCircle, XCircle, ChevronDown, ChevronUp, Globe, ArrowLeft, ArrowRight
} from 'lucide-react'
import { PLAN_DETAILS, PLAN_ORDER } from '../constants/plans'

const T = {
  ar: {
    dir: 'rtl',
    nav: { register: 'سجل الآن', login: 'تسجيل دخول' },
    hero: {
      title: 'أدر مركز تغيير الزيت بذكاء',
      sub: 'نظام متكامل للمراكز العراقية — فواتير، مخزون، واتساب، كاميرا IP، وأكثر.',
      cta1: 'ابدأ الآن',
      cta2: 'تسجيل دخول',
    },
    featTitle: 'كل ما يحتاجه مركزك',
    featSub: 'من الفاتورة الأولى حتى تقرير الشهر — كل شيء في مكان واحد.',
    features: [
      { icon: Camera, title: 'كاميرا IP وقراءة اللوحة', desc: 'اكتشاف السيارة تلقائياً عند الدخول وقراءة رقم اللوحة بالذكاء الاصطناعي.' },
      { icon: MessageCircle, title: 'تذكيرات واتساب', desc: 'إشعارات تلقائية للزبائن عند اقتراب موعد تغيير الزيت.' },
      { icon: Package, title: 'إدارة المخزون', desc: 'تتبع المواد والزيوت مع خصم تلقائي عند كل خدمة.' },
      { icon: FileText, title: 'فواتير احترافية', desc: 'إنشاء وطباعة فواتير A4 ومشاركتها على واتساب بلمسة.' },
      { icon: BarChart2, title: 'تقارير وإحصائيات', desc: 'تقارير يومية وشهرية لأداء مركزك والإيرادات.' },
      { icon: Headphones, title: 'دعم متخصص', desc: 'فريق دعم متاح لمساعدتك في الإعداد والتشغيل.' },
    ],
    screensTitle: 'شاهد النظام من الداخل',
    screensSub: 'تصميم عربي سهل الاستخدام، يعمل على الجوال والكمبيوتر.',
    screenshots: [
      { img: '/ss-dashboard.png', title: 'لوحة التحكم الرئيسية', desc: 'نظرة شاملة على أداء مركزك: الإيرادات، الخدمات، والإحصائيات اليومية.' },
      { img: '/ss-cars.png', title: 'إدارة السيارات والزبائن', desc: 'سجل كامل لكل سيارة وتاريخ خدماتها، بحث سريع برقم اللوحة.' },
      { img: '/ss-invoice.png', title: 'الفواتير والطباعة', desc: 'فواتير احترافية بالأسعار التلقائية، طباعة A4 ومشاركة واتساب.' },
    ],
    pricingTitle: 'اختر الخطة المناسبة',
    pricingSub: 'أسعار واضحة بدون رسوم خفية. الدفع شهري.',
    currency: 'د.ع / شهر',
    popular: 'الأكثر طلباً',
    subscribe: 'اشترك الآن',
    faqTitle: 'أسئلة شائعة',
    faq: [
      { q: 'هل يمكنني تجربة النظام قبل الدفع؟', a: 'نعم، تواصل معنا وسنفعّل لك حساباً تجريبياً مجاناً لمدة أسبوع.' },
      { q: 'كيف يتم الدفع؟', a: 'الدفع شهري بالتحويل البنكي أو ZainCash. يمكنك إلغاء الاشتراك في أي وقت.' },
      { q: 'هل بياناتي محمية؟', a: 'نعم، كل مركز له قاعدة بيانات معزولة وكلمات مرور مشفرة.' },
      { q: 'هل يعمل على الجوال؟', a: 'نعم، النظام متجاوب ويعمل بشكل كامل على الهاتف والتابلت.' },
      { q: 'كيف أتواصل مع الدعم؟', a: 'عبر البريد الإلكتروني أو واتساب. فريقنا متاح من 9 صباحاً حتى 6 مساءً.' },
    ],
    ctaTitle: 'جاهز تبدأ؟',
    ctaSub: 'انضم لمئات مراكز تغيير الزيت في العراق',
    ctaBtn: 'سجل مجاناً',
    footer: {
      desc: 'نظام إدارة متكامل لمراكز تغيير الزيت في العراق.',
      links: 'روابط سريعة',
      contact: 'التواصل',
      dev: 'تطوير:',
      rights: 'جميع الحقوق محفوظة',
    },
  },
  en: {
    dir: 'ltr',
    nav: { register: 'Get Started', login: 'Login' },
    hero: {
      title: 'Manage Your Oil Center Smartly',
      sub: 'A complete system for Iraqi oil service centers — invoices, inventory, WhatsApp, IP camera, and more.',
      cta1: 'Get Started',
      cta2: 'Login',
    },
    featTitle: 'Everything Your Center Needs',
    featSub: 'From the first invoice to the monthly report — all in one place.',
    features: [
      { icon: Camera, title: 'IP Camera & Plate Recognition', desc: 'Auto-detect vehicles on entry and read license plates using AI.' },
      { icon: MessageCircle, title: 'WhatsApp Reminders', desc: 'Automatic notifications to customers when their oil change is due.' },
      { icon: Package, title: 'Inventory Management', desc: 'Track oils and materials with automatic deduction on each service.' },
      { icon: FileText, title: 'Professional Invoices', desc: 'Create and print A4 invoices, share them on WhatsApp instantly.' },
      { icon: BarChart2, title: 'Reports & Analytics', desc: 'Daily and monthly reports on center performance and revenue.' },
      { icon: Headphones, title: 'Dedicated Support', desc: 'Our support team is available to help you set up and operate the system.' },
    ],
    screensTitle: 'See the System From Inside',
    screensSub: 'Arabic-first design, easy to use, works on mobile and desktop.',
    screenshots: [
      { img: '/ss-dashboard.png', title: 'Main Dashboard', desc: 'Full overview of your center: revenue, services, and daily stats.' },
      { img: '/ss-cars.png', title: 'Cars & Customer Management', desc: 'Complete record for each vehicle and service history, quick search by plate number.' },
      { img: '/ss-invoice.png', title: 'Invoices & Printing', desc: 'Professional invoices with auto-pricing, A4 printing and WhatsApp sharing.' },
    ],
    pricingTitle: 'Choose Your Plan',
    pricingSub: 'Clear pricing, no hidden fees. Monthly billing.',
    currency: 'IQD / month',
    popular: 'Most Popular',
    subscribe: 'Subscribe Now',
    faqTitle: 'Frequently Asked Questions',
    faq: [
      { q: 'Can I try the system before paying?', a: 'Yes, contact us and we will activate a free trial account for one week.' },
      { q: 'How do I pay?', a: 'Monthly via bank transfer or ZainCash. You can cancel at any time.' },
      { q: 'Is my data protected?', a: 'Yes, each center has an isolated database and encrypted passwords.' },
      { q: 'Does it work on mobile?', a: 'Yes, the system is fully responsive and works on phones and tablets.' },
      { q: 'How do I contact support?', a: 'Via email or WhatsApp. Our team is available from 9am to 6pm.' },
    ],
    ctaTitle: 'Ready to Start?',
    ctaSub: 'Join hundreds of oil centers across Iraq',
    ctaBtn: 'Register Free',
    footer: {
      desc: 'A complete management system for oil service centers in Iraq.',
      links: 'Quick Links',
      contact: 'Contact',
      dev: 'Developed by:',
      rights: 'All rights reserved',
    },
  },
}

const planNames = {
  basic: { ar: 'الأساسية', en: 'Basic' },
  pro: { ar: 'الاحترافية', en: 'Pro' },
  enterprise: { ar: 'المؤسسية', en: 'Enterprise' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function Section({ children, className = '' }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.section>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-right bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm">{q}</span>
        {open ? <ChevronUp size={18} className="text-blue-600 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 bg-white text-gray-600 text-sm leading-relaxed border-t border-gray-100">
          {a}
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const [lang, setLang] = useState('ar')
  const t = T[lang]
  const navigate = useNavigate()
  const isRtl = lang === 'ar'
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <div dir={t.dir} className="min-h-screen bg-white font-sans text-gray-900">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-xl tracking-tight text-blue-700">CearCar</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
            >
              <Globe size={15} />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5"
            >
              {t.nav.login}
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t.nav.register}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pt-20 pb-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-5"
          >
            {t.hero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto mb-8"
          >
            {t.hero.sub}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-12"
          >
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              {t.hero.cta1}
              <ArrowIcon size={17} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-xl font-semibold border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 transition-all"
            >
              {t.hero.cta2}
            </button>
          </motion.div>

          {/* Hero screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative mx-auto max-w-4xl"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 ring-1 ring-gray-100">
              <img
                src="/ss-dashboard.png"
                alt="لوحة التحكم"
                className="w-full object-cover"
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-blue-200/30 blur-2xl rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <Section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">{t.featTitle}</h2>
          <p className="text-gray-500">{t.featSub}</p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <f.icon size={22} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Screenshots ── */}
      <Section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">{t.screensTitle}</h2>
          <p className="text-gray-500">{t.screensSub}</p>
        </div>
        <div className="max-w-5xl mx-auto space-y-20">
          {t.screenshots.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isRtl ? (i % 2 === 0 ? 40 : -40) : (i % 2 === 0 ? -40 : 40) }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55 }}
              className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10`}
            >
              <div className="flex-1">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                  <img src={s.img} alt={s.title} className="w-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-black text-gray-900">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Pricing ── */}
      <Section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">{t.pricingTitle}</h2>
          <p className="text-gray-500">{t.pricingSub}</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLAN_ORDER.map((key, i) => {
            const plan = PLAN_DETAILS[key]
            const isPro = key === 'pro'
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 border ${
                  isPro
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xl scale-105'
                    : 'bg-white text-gray-900 border-gray-200 shadow-sm'
                }`}
              >
                {isPro && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                    {t.popular}
                  </span>
                )}
                <h3 className={`font-bold text-lg mb-1 ${isPro ? 'text-white' : 'text-gray-900'}`}>
                  {planNames[key][lang]}
                </h3>
                <div className={`text-3xl font-black mb-1 ${isPro ? 'text-white' : 'text-blue-600'}`}>
                  {plan.price}
                </div>
                <div className={`text-xs mb-5 ${isPro ? 'text-blue-200' : 'text-gray-400'}`}>{t.currency}</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={15} className={`mt-0.5 shrink-0 ${isPro ? 'text-green-300' : 'text-green-500'}`} />
                      <span className={isPro ? 'text-blue-100' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                  {plan.noFeatures.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm opacity-50">
                      <XCircle size={15} className="mt-0.5 shrink-0 text-gray-400" />
                      <span className={isPro ? 'text-blue-200' : 'text-gray-500'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isPro
                      ? 'bg-white text-blue-700 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {t.subscribe}
                </button>
              </motion.div>
            )
          })}
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-3">{t.faqTitle}</h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {t.faq.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </Section>

      {/* ── CTA Banner ── */}
      <Section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-3">{t.ctaTitle}</h2>
        <p className="text-blue-200 mb-8 text-lg">{t.ctaSub}</p>
        <button
          onClick={() => navigate('/register')}
          className="bg-white text-blue-700 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg text-lg"
        >
          {t.ctaBtn}
        </button>
      </Section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <span className="font-black text-white text-xl block mb-2">CearCar</span>
            <p className="text-sm leading-relaxed">{t.footer.desc}</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">{t.footer.links}</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">{t.nav.register}</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">{t.nav.login}</button></li>
              <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">{lang === 'ar' ? 'عن النظام' : 'About'}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">{t.footer.contact}</h4>
            <p className="text-sm">cptstaf2018@gmail.com</p>
            <p className="text-sm mt-2">
              {t.footer.dev}{' '}
              <a
                href="https://baghdad-future-ai.my/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Baghdad Future AI
              </a>
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-xs">
          © {new Date().getFullYear()} CearCar. {t.footer.rights}.
        </div>
      </footer>

    </div>
  )
}
