import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-8">
          <Link to="/" className="text-sm font-bold text-cyan-600 hover:underline">→ العودة للرئيسية</Link>
        </div>

        <h1 className="mb-2 text-3xl font-black text-slate-900">سياسة الخصوصية</h1>
        <p className="mb-8 text-sm text-slate-500">آخر تحديث: يونيو 2026</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">1. من نحن</h2>
            <p className="leading-7">
              Care Car هي منصة SaaS متخصصة في إدارة مراكز خدمة السيارات. نوفر أدوات لإدارة الخدمات، الفواتير، المخزون، وتتبع السيارات لمراكز الخدمة في العراق والمنطقة.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">2. البيانات التي نجمعها</h2>
            <ul className="list-disc space-y-2 pr-5 leading-7">
              <li><strong>بيانات المركز:</strong> اسم المركز، رقم الهاتف، البريد الإلكتروني، الشعار.</li>
              <li><strong>بيانات العملاء:</strong> أسماء أصحاب السيارات، أرقام الهواتف، أرقام اللوحات، نوع السيارة.</li>
              <li><strong>بيانات الخدمات:</strong> سجل الخدمات، الفواتير، المدفوعات، المخزون.</li>
              <li><strong>صور الكاميرا:</strong> عند استخدام ميزة قراءة اللوحة أو الوصل، تُرسل الصورة لمعالجتها وقراءة النص منها فقط، ولا تُخزَّن الصور على سيرواتنا.</li>
              <li><strong>بيانات الاستخدام:</strong> سجلات الدخول، وقت الجلسات.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">3. كيف نستخدم بياناتك</h2>
            <ul className="list-disc space-y-2 pr-5 leading-7">
              <li>تشغيل خدمات المنصة وتوفير الميزات المشتركة في الاشتراك.</li>
              <li>إرسال تذكيرات الصيانة لعملاء المركز عبر واتساب (بموافقة المركز).</li>
              <li>تحسين أداء المنصة وإصلاح الأخطاء.</li>
              <li>لا نبيع بياناتك أو نشاركها مع أطراف ثالثة لأغراض تجارية.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">4. أذونات التطبيق</h2>
            <ul className="list-disc space-y-2 pr-5 leading-7">
              <li><strong>الكاميرا:</strong> نستخدم الكاميرا لقراءة أرقام لوحات السيارات وصور وصولات الشراء بالذكاء الاصطناعي. الإذن اختياري ولا تتأثر الوظائف الأساسية بدونه.</li>
              <li><strong>الإنترنت:</strong> مطلوب لمزامنة البيانات مع الخوادم.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">5. حفظ البيانات وأمانها</h2>
            <p className="leading-7">
              تُخزَّن بياناتك على خوادم مؤمّنة بتشفير HTTPS، وحماية من الاختراق (CSRF، XSS، Rate Limiting). لا يمكن لأي مركز آخر الاطلاع على بيانات مركزك.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">6. حقوقك</h2>
            <ul className="list-disc space-y-2 pr-5 leading-7">
              <li><strong>الاطلاع:</strong> يمكنك طلب نسخة من بياناتك في أي وقت.</li>
              <li><strong>التصحيح:</strong> يمكنك تعديل بيانات مركزك من إعدادات المركز.</li>
              <li><strong>الحذف:</strong> يمكنك حذف حسابك وجميع بياناتك نهائياً من إعدادات المركز ← منطقة الخطر، أو عبر صفحة <Link to="/account-deletion" className="font-bold text-cyan-700 hover:underline">حذف الحساب</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-black text-slate-900">7. التواصل معنا</h2>
            <p className="leading-7">
              لأي استفسار عن الخصوصية أو طلب حذف البيانات، تواصل معنا عبر البريد الإلكتروني
              <a href="mailto:support@carecar.online" className="mx-1 font-bold text-cyan-700 hover:underline">support@carecar.online</a>
              أو من خلال <Link to="/support" className="font-bold text-cyan-700 hover:underline">صفحة الدعم</Link>.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          <Link to="/terms" className="hover:underline">شروط الاستخدام</Link>
          <span className="mx-2">·</span>
          <Link to="/support" className="hover:underline">الدعم</Link>
          <span className="mx-2">·</span>
          <Link to="/about" className="hover:underline">عن المنصة</Link>
        </div>
      </div>
    </div>
  )
}
