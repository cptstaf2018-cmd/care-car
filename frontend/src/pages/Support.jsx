import { Link } from 'react-router-dom'
import { Mail, MessageCircle, ShieldCheck } from 'lucide-react'

export default function Support() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <Link to="/" className="text-sm font-bold text-cyan-600 hover:underline">→ العودة للرئيسية</Link>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <ShieldCheck size={24} />
          </div>
          <h1 className="mb-3 text-3xl font-black text-slate-950">الدعم والمساعدة</h1>
          <p className="max-w-2xl leading-8 text-slate-600">
            هذه الصفحة مخصصة لدعم مستخدمي Care Car وطلبات الخصوصية وحذف الحساب ومساعدة مراكز الخدمة.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href="mailto:support@carecar.online"
              className="rounded-xl border border-slate-200 p-5 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              <Mail className="mb-3 text-cyan-700" size={24} />
              <p className="font-black text-slate-950">البريد الإلكتروني</p>
              <p className="mt-1 text-sm font-bold text-slate-500">support@carecar.online</p>
            </a>
            <a
              href="https://wa.me/9647806688044"
              className="rounded-xl border border-slate-200 p-5 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <MessageCircle className="mb-3 text-emerald-700" size={24} />
              <p className="font-black text-slate-950">واتساب الدعم</p>
              <p className="mt-1 text-sm font-bold text-slate-500">+964 780 668 8044</p>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
            <Link to="/privacy" className="rounded-lg bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200">سياسة الخصوصية</Link>
            <Link to="/terms" className="rounded-lg bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200">شروط الاستخدام</Link>
            <Link to="/account-deletion" className="rounded-lg bg-rose-50 px-4 py-2 text-rose-700 hover:bg-rose-100">حذف الحساب</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
