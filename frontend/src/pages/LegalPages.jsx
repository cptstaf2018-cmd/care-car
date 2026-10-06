import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { SUPPORT_WHATSAPP_URL } from '../constants/contact'

const UPDATED = '6 تشرين الأول 2026'

const PRIVACY = {
  title: 'سياسة الخصوصية',
  intro: 'كير كار نظام لإدارة مراكز الصيانة وقطع الغيار، تطوير وتشغيل Baghdad Future AI. هذي الصفحة تشرح شنو نجمع من بيانات ولماذا.',
  sections: [
    ['البيانات اللي نجمعها', [
      'بيانات حسابك: اسمك وإيميلك من حساب Google، أو رقم واتساب مركزك.',
      'بيانات مركزك اللي تدخلها: الخدمات والفواتير والمخزون والديون.',
      'بيانات زبائن مركزك اللي تسجّلها: الأسماء وأرقام الهواتف وأرقام اللوحات.',
      'سجلات تقنية بسيطة للخادم حتى نكتشف الأعطال ونحمي النظام.',
    ]],
    ['ليش نستخدمها', [
      'تشغيل النظام وعرض بياناتك لك.',
      'إرسال تذكيرات واتساب لزبائن مركزك بطلب منك.',
      'الدعم الفني، وتحسين الخدمة.',
    ]],
    ['المشاركة', [
      'ما نبيع بياناتك ولا بيانات زبائنك لأي جهة.',
      'نستعمل مزودين لتشغيل الخدمة فقط: Google لتسجيل الدخول، ومزود رسائل واتساب، والاستضافة.',
      'بيانات كل مركز معزولة عن باقي المراكز.',
    ]],
    ['مسؤوليتك عن بيانات زبائنك', [
      'أنت صاحب بيانات زبائن مركزك، وأنت المسؤول عن إخبارهم بأنك تراسلهم بتذكيرات الصيانة.',
    ]],
    ['الحذف', [
      'تقدر تطلب حذف حسابك وكل بياناته بأي وقت، بمراسلتنا على واتساب. نعالج الطلب بأسرع وقت.',
    ]],
    ['الأمان', [
      'الاتصال بالموقع مشفّر (HTTPS)، وكلمات المرور تُخزَّن مشفّرة ولا نقدر نقرأها.',
    ]],
  ],
}

const TERMS = {
  title: 'شروط الاستخدام',
  intro: 'باستخدامك كير كار توافق على هذي الشروط. اقراها قبل ما تبدأ.',
  sections: [
    ['التجربة والاشتراك', [
      'تبدأ بتجربة مجانية 14 يوم بكل الميزات، بدون بطاقة.',
      'بعد التجربة تختار خطة مدفوعة لتكمل. إذا ما اشتركت يتوقف الدخول لحسابك، وبياناتك تبقى محفوظة لحين تقرر.',
      'تقدر تغير خطتك أو تلغي بأي وقت.',
    ]],
    ['الاستخدام المقبول', [
      'استعمل النظام لإدارة مركزك فقط.',
      'ممنوع إرسال رسائل مزعجة أو غير مرغوبة للزبائن عبر النظام.',
      'أنت مسؤول عن صحة البيانات اللي تدخلها وعن الحفاظ على كلمة مرورك.',
    ]],
    ['الخدمة', [
      'نشتغل على أن تكون الخدمة متوفرة ومستقرة، لكن ما نضمن عدم انقطاعها. نخبرك قبل أي صيانة كبيرة قدر الإمكان.',
      'تذكيرات واتساب تعتمد على خدمة طرف ثالث، وقد تتأخر أو تفشل لأسباب خارج سيطرتنا.',
    ]],
    ['بياناتك', [
      'بياناتك ملكك. تفاصيل ما نجمعه وكيف نحميه بسياسة الخصوصية.',
    ]],
    ['التعديلات', [
      'ممكن نحدّث هذي الشروط، ونظهر لك التاريخ الأحدث أسفل الصفحة.',
    ]],
  ],
}

function LegalPage({ doc, other }) {
  useEffect(() => {
    const previous = document.title
    document.title = `${doc.title} | كير كار`
    return () => { document.title = previous }
  }, [doc.title])

  return (
    <div dir="rtl" className="min-h-screen bg-[#EEF4F2] text-petrol-deep">
      <header className="bg-petrol px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <BrandMark />
          <Link to="/about" className="text-sm font-bold text-gauge-light hover:text-mint">الرئيسية</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{doc.title}</h1>
        <p className="mt-3 leading-8 text-mint-ink">{doc.intro}</p>
        {doc.sections.map(([heading, items]) => (
          <section key={heading} className="mt-8">
            <h2 className="text-xl font-bold">{heading}</h2>
            <ul className="mt-3 grid gap-2 leading-8 text-mint-ink">
              {items.map((item) => <li key={item} className="border-s-2 border-oil ps-4">{item}</li>)}
            </ul>
          </section>
        ))}
        <p className="mt-10 text-sm text-mint-ink">
          أسئلة؟ كلّمنا على <a className="font-bold underline underline-offset-4" href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">واتساب</a>.
          {' '}آخر تحديث: {UPDATED}. <Link className="font-bold underline underline-offset-4" to={other.to}>{other.label}</Link>
        </p>
      </main>
    </div>
  )
}

export function PrivacyPage() {
  return <LegalPage doc={PRIVACY} other={{ to: '/terms', label: 'شروط الاستخدام' }} />
}

export function TermsPage() {
  return <LegalPage doc={TERMS} other={{ to: '/privacy', label: 'سياسة الخصوصية' }} />
}
