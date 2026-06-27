import { Link } from 'react-router-dom'

export default function AccountDeletion() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <Link to="/" className="text-sm font-bold text-cyan-600 hover:underline">→ العودة للرئيسية</Link>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="mb-3 text-3xl font-black text-slate-950">حذف حساب Care Car</h1>
          <p className="leading-8 text-slate-600">
            يمكنك حذف حساب المركز وجميع بياناته نهائياً من داخل التطبيق أو بطلب رسمي من الدعم.
          </p>

          <section className="mt-8">
            <h2 className="mb-3 text-xl font-black text-slate-900">الحذف من داخل التطبيق</h2>
            <ol className="list-decimal space-y-2 pr-5 leading-8 text-slate-700">
              <li>سجّل الدخول بحساب مدير المركز.</li>
              <li>افتح إعدادات المركز.</li>
              <li>اذهب إلى منطقة الخطر.</li>
              <li>اختر حذف الحساب واكتب كلمة التأكيد.</li>
            </ol>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-xl font-black text-slate-900">طلب الحذف من خارج التطبيق</h2>
            <p className="leading-8 text-slate-700">
              أرسل طلب حذف الحساب من بريدك المسجل إلى
              <a href="mailto:support@carecar.online" className="mx-1 font-black text-cyan-700 hover:underline">support@carecar.online</a>
              أو عبر واتساب الدعم. سنطلب إثبات ملكية المركز قبل تنفيذ الحذف.
            </p>
          </section>

          <section className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-5">
            <h2 className="mb-3 text-lg font-black text-rose-800">ما الذي يُحذف؟</h2>
            <p className="leading-8 text-rose-700">
              يتم حذف بيانات المركز، المستخدمين، السيارات، الخدمات، الفواتير، الديون، المخزون، وسجل رسائل واتساب المرتبط بالمركز.
              لا يمكن استرجاع البيانات بعد الحذف.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
