import { useMemo, useRef, useState } from 'react'
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { hasPlanFeature, nextPlan, PLAN_DETAILS, planShortName } from '../constants/plans'

const QUICK_QUESTIONS = [
  {
    label: 'كيف أضيف خدمة؟',
    answer: 'افتح خدمة جديدة، اختر السيارة أو أضفها، اختر نوع الخدمة، أضف السعر ثم اضغط اعتماد الفاتورة النهائية.',
  },
  {
    label: 'كيف أطالب بدين؟',
    answer: 'من قسم الديون اختر الدين المطلوب ثم اضغط إرسال تذكير واتساب. هذه ميزة أساسية لأنها مهمة لكل مركز.',
  },
  {
    label: 'كيف أخصم من المخزون؟',
    answer: 'أثناء إضافة الخدمة اختر المادة من المخزون والكمية. عند اعتماد الفاتورة ينقص المخزون تلقائياً.',
  },
]

function normalize(text) {
  return String(text || '').trim().toLowerCase()
}

function buildAssistantReply(question, center) {
  const q = normalize(question)
  const plan = center?.plan || 'basic'
  const planName = planShortName(plan)

  if (!q) return 'اكتب سؤالك وسأساعدك بخطوات واضحة داخل النظام.'

  if (q.includes('فاتور') || q.includes('خدمة') || q.includes('اعتماد')) {
    return 'لإنشاء فاتورة: افتح خدمة جديدة، اختر السيارة أو أضفها، اختر نوع الخدمة، أضف السعر والمواد من المخزون إن وجدت، ثم اضغط اعتماد الفاتورة النهائية. بعدها تفتح صفحة الفاتورة للطباعة أو الإرسال.'
  }

  if (q.includes('دين') || q.includes('ديون') || q.includes('مطالب') || q.includes('واتساب')) {
    return 'مطالبة الديون تعمل من قسم الديون. اختر الدين واضغط إرسال تذكير واتساب. هذه ميزة أساسية في كل الخطط لأنها ضرورية لتحصيل أموال المركز.'
  }

  if (q.includes('مخزون') || q.includes('خصم') || q.includes('مواد') || q.includes('كمية')) {
    return 'المخزون يعمل مع كل الخطط. أضف المواد من قسم المخزون، ثم عند إنشاء خدمة اختر المادة والكمية. عند اعتماد الفاتورة ينقص المخزون تلقائياً.'
  }

  if (q.includes('وصل') || q.includes('ocr') || q.includes('صورة')) {
    if (!hasPlanFeature(plan, 'inventory_receipt')) {
      return `قراءة وصل الشراء بالصورة تحتاج ترقية. خطتك الحالية ${planName}. يمكنك استخدام الإدخال اليدوي الآن، أو طلب ترقية من الإعدادات لتفعيل قراءة الوصل.`
    }
    return 'لقراءة وصل شراء: افتح المخزون، اختر وصل شراء، ارفع صورة واضحة، ثم راجع المواد قبل اعتماد الإضافة للمخزون.'
  }

  if (q.includes('كاميرا') || q.includes('لوحة') || q.includes('ctk') || q.includes('سيارة')) {
    if (!hasPlanFeature(plan, 'camera')) {
      return `قراءة اللوحة بالكاميرا ضمن الخطة المميزة. خطتك الحالية ${planName}. حالياً يمكنك إدخال رقم اللوحة يدوياً من خدمة جديدة.`
    }
    return 'الكاميرا تعمل من خدمة جديدة. افتح رابط كاميرا الموبايل/الباركود، ثم اضغط تشغيل الكاميرا داخل خدمة جديدة. عند قراءة اللوحة تظهر في يمين الشاشة وتستطيع اختيار السيارة أو إضافتها.'
  }

  if (q.includes('مستخدم') || q.includes('موظف') || q.includes('صلاحية')) {
    return `إدارة المستخدمين من الإعدادات. الحد يعتمد على الخطة: الأساسية مستخدم واحد، المتوسطة مستخدمان، والمميزة 3 مستخدمين. خطتك الحالية ${planName}.`
  }

  if (q.includes('ترقي') || q.includes('اشتراك') || q.includes('خطة') || q.includes('مميزات')) {
    const next = nextPlan(plan)
    if (!next) return 'أنت على أعلى خطة حالياً. كل الميزات المتقدمة مفعلة حسب إعدادات المركز.'
    return `خطتك الحالية ${planName}. للترقية افتح الإعدادات ثم قسم الاشتراك، اختر ${PLAN_DETAILS[next]?.shortName || 'الخطة الأعلى'}، أدخل رقم الإيشال، وسيظهر الطلب في لوحة السوبر أدمن للتفعيل.`
  }

  if (q.includes('تذكير') || q.includes('صيانة') || q.includes('زيوت')) {
    return 'تذكير الصيانة مفيد خصوصاً لمراكز الزيوت. أما باقي الاختصاصات فالتركيز الأساسي يكون على رسائل الديون واتساب. يمكن ضبط رسائل التذكير من الإعدادات حسب اختصاص المركز.'
  }

  if (q.includes('اكسل') || q.includes('نسخة') || q.includes('ارشيف') || q.includes('أرشيف')) {
    if (!hasPlanFeature(plan, 'monthly_archive')) {
      return `إرسال أرشيف Excel الشهري ضمن الخطة المميزة. خطتك الحالية ${planName}. البيانات تبقى داخل النظام، ويمكن ترقية الاشتراك لتفعيل الأرشفة الشهرية.`
    }
    return 'أرشيف Excel الشهري يعمل من لوحة السوبر أدمن تلقائياً أو يدوياً، ويرسل بيانات المركز حسب وسيلة التواصل المحفوظة.'
  }

  return 'أفهم سؤالك، لكن أحتاج صياغة أوضح قليلاً. اسألني مثلاً: كيف أضيف فاتورة؟ كيف أرسل دين واتساب؟ كيف أخصم من المخزون؟ كيف أشغل قراءة اللوحة؟'
}

export default function FloatingAssistant({ center }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'أهلاً، اسألني عن الفواتير، المخزون، الديون، الاشتراك، أو كاميرا قراءة اللوحة.' },
  ])
  const inputRef = useRef(null)
  const enabled = hasPlanFeature(center?.plan, 'assistant')
  const upgradePlan = nextPlan(center?.plan || 'basic')
  const upgradeName = PLAN_DETAILS[upgradePlan]?.shortName || 'خطة أعلى'

  const subtitle = useMemo(() => {
    if (enabled) return 'مساعدك السريع داخل النظام'
    return `فعّل المساعد بالترقية إلى ${upgradeName}`
  }, [enabled, upgradeName])

  if (!center) return null

  function askAssistant(text = message) {
    const question = text.trim()
    if (!question) return
    setMessages(prev => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: buildAssistantReply(question, center) },
    ])
    setMessage('')
    window.setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl shadow-slate-900/25 ring-4 ring-white transition hover:-translate-y-0.5 hover:bg-cyan-500"
        aria-label="مساعد المركز"
      >
        <MessageCircle size={25} />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-black text-slate-950">
          AI
        </span>
      </button>

      {open && (
        <div className="fixed bottom-24 left-5 z-50 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-xl border border-slate-200 bg-white text-right shadow-2xl" dir="rtl">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
                <Bot size={21} />
              </div>
              <div>
                <p className="font-black">مساعد المركز</p>
                <p className="text-xs font-bold text-slate-300">{subtitle}</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            {!enabled && (
              <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-cyan-800">
                  <Sparkles size={18} />
                  <p className="font-black">مساعد الترقية والتشغيل</p>
                </div>
                <p className="text-sm font-bold leading-7 text-slate-600">
                  يمكنك سؤاله الآن. وعند السؤال عن ميزة غير مفعلة سيشرح لك الخطة المناسبة.
                </p>
              </div>
            )}
            <div className={`${enabled ? '' : 'mt-3'} max-h-72 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3`}>
              {messages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`flex ${item.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[88%] rounded-lg px-3 py-2 text-sm font-bold leading-7 ${
                    item.role === 'user'
                      ? 'bg-slate-950 text-white'
                      : 'bg-cyan-50 text-slate-800 ring-1 ring-cyan-100'
                  }`}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2">
              {QUICK_QUESTIONS.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => askAssistant(item.label)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={event => {
                event.preventDefault()
                askAssistant()
              }}
            >
              <input
                ref={inputRef}
                value={message}
                onChange={event => setMessage(event.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                aria-label="إرسال السؤال"
              >
                <Send size={18} />
              </button>
            </form>
            {!enabled && (
              <a
                href="/center/settings?upgrade=1"
                className="mt-3 flex items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
              >
                فتح صفحة الترقية
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
