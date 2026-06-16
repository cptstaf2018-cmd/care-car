import { Link } from 'react-router-dom'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-8">
          <Link to="/" className="text-sm font-bold text-cyan-600 hover:underline">→ العودة للرئيسية</Link>
        </div>

        <h1 className="mb-2 text-3xl font-black text-slate-900">شروط الاستخدام</h1>
        <p className="mb-8 text-sm text-slate-500">آخر تحديث: يونيو 2025</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">1. القبول بالشروط</h2>
            <p className="leading-7">
              باستخدامك لمنصة Care Car، فأنت توافق على هذه الشروط. إذا كنت لا توافق، يُرجى عدم استخدام المنصة.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">2. وصف الخدمة</h2>
            <p className="leading-7">
              Care Car منصة SaaS لإدارة مراكز خدمة السيارات. توفر أدوات لإدارة الخدمات، الفواتير، المخزون، تتبع السيارات، وإرسال التذكيرات عبر واتساب.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">3. الاشتراك والدفع</h2>
            <ul className="list-disc space-y-2 pr-5 leading-7">
              <li>الاشتراكات تُجدَّد شهرياً بناءً على الخطة المختارة.</li>
              <li>الأسعار بالدينار العراقي (IQD) أو الدولار الأمريكي حسب الخطة.</li>
              <li>لا يوجد استرداد للمبالغ بعد تفعيل الاشتراك إلا في حالات استثنائية يقررها الفريق.</li>
              <li>يحق لنا تعديل الأسعار مع إشعار مسبق بـ 30 يوم.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">4. مسؤوليات المستخدم</h2>
            <ul className="list-disc space-y-2 pr-5 leading-7">
              <li>أنت مسؤول عن دقة البيانات التي تُدخلها في النظام.</li>
              <li>يُحظر استخدام المنصة لأي غرض غير مشروع.</li>
              <li>يُحظر مشاركة بيانات دخولك مع أطراف غير مصرح لها.</li>
              <li>أنت مسؤول عن الحصول على موافقة عملائك قبل إرسال تذكيرات واتساب.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">5. الملكية الفكرية</h2>
            <p className="leading-7">
              منصة Care Car وكل مكوناتها (كود، تصميم، واجهات) ملك حصري لفريق Care Car. يُمنح المستخدم حق استخدام غير حصري طوال فترة الاشتراك.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">6. حدود المسؤولية</h2>
            <p className="leading-7">
              نبذل أقصى جهد لضمان استمرارية الخدمة، لكننا لسنا مسؤولين عن الخسائر الناتجة عن انقطاع الخدمة أو أخطاء البيانات. المنصة تُقدَّم "كما هي" (as-is).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">7. إنهاء الحساب</h2>
            <p className="leading-7">
              يمكنك إنهاء اشتراكك وحذف حسابك في أي وقت من إعدادات المركز. عند الحذف تُمسح جميع بياناتك نهائياً ولا يمكن استرجاعها. نحتفظ بالحق في إيقاف حسابات تنتهك هذه الشروط.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">8. تعديل الشروط</h2>
            <p className="leading-7">
              نحتفظ بالحق في تعديل هذه الشروط مع إشعار مسبق عبر البريد الإلكتروني أو داخل التطبيق. استمرارك في الاستخدام بعد التعديل يعني موافقتك.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">9. القانون المعمول به</h2>
            <p className="leading-7">
              تخضع هذه الشروط لأحكام القوانين العراقية النافذة.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          <Link to="/privacy" className="hover:underline">سياسة الخصوصية</Link>
          <span className="mx-2">·</span>
          <Link to="/about" className="hover:underline">عن المنصة</Link>
        </div>
      </div>
    </div>
  )
}
