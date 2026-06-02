import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCircle2, CreditCard, MessageCircle, Phone, Receipt, Search, ToggleLeft, ToggleRight, WalletCards } from 'lucide-react'
import Layout from '../components/Layout'
import { getDebts, sendDebtReminder, updateDebt } from '../api/debts'

const money = value => `${Number(value || 0).toLocaleString()} IQD`

export default function Debts() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState(null)
  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => getDebts().then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDebt(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })

  const sendMutation = useMutation({
    mutationFn: sendDebtReminder,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['debts'] })
      setNotice(res.data.status === 'sent' ? 'تم إرسال تذكير الدين' : `لم يرسل: ${res.data.provider_response || res.data.status}`)
    },
    onError: (err) => setNotice(err.response?.data?.detail || 'تعذر إرسال التذكير'),
  })

  const filteredDebts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return debts.filter(debt => !q || [
      debt.customer_name,
      debt.phone,
      debt.plate_number,
      debt.car_type,
      debt.invoice_id,
    ].filter(Boolean).some(value => String(value).toLowerCase().includes(q)))
  }, [debts, search])

  const totals = useMemo(() => filteredDebts.reduce((acc, debt) => {
    acc.amount += Number(debt.amount || 0)
    if (debt.auto_reminder_enabled) acc.auto += 1
    return acc
  }, { amount: 0, auto: 0 }), [filteredDebts])

  const markPaid = (debt) => {
    if (!window.confirm(`تسديد كامل دين ${debt.customer_name || debt.plate_number || ''}؟`)) return
    updateMutation.mutate({ id: debt.id, data: { amount: 0, notes: 'تم تسديد الدين كاملا' } })
  }

  const partialPay = (debt) => {
    const raw = window.prompt('اكتب المبلغ المدفوع الآن', '')
    if (!raw) return
    const paid = Number(raw)
    if (!Number.isFinite(paid) || paid <= 0) return
    const remaining = Math.max(0, Number(debt.amount || 0) - paid)
    updateMutation.mutate({ id: debt.id, data: { amount: remaining, notes: `دفع جزئي: ${money(paid)}` } })
  }

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-black text-cyan-700">تحصيل ومتابعة</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">الديون</h2>
          <p className="mt-2 text-sm text-slate-500">كل الزبائن الذين لديهم مبالغ مفتوحة، مع تذكير تلقائي أو إرسال يدوي مباشر.</p>
        </div>
        <Link to="/center/services/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
          <Receipt size={17} /> خدمة جديدة
        </Link>
      </div>

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <SummaryCard icon={WalletCards} label="إجمالي الديون" value={money(totals.amount)} tone="rose" />
        <SummaryCard icon={Bell} label="تذكير تلقائي مفعل" value={totals.auto} tone="cyan" />
        <SummaryCard icon={CreditCard} label="عدد الديون" value={filteredDebts.length} tone="slate" />
      </section>

      <section className="surface mb-5 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم الزبون، الهاتف، رقم اللوحة أو رقم الفاتورة..."
            className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
        </div>
      </section>

      {notice && (
        <div className="mb-4 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
          {notice}
        </div>
      )}

      <section className="surface overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {['الزبون', 'السيارة', 'مبلغ الدين', 'الفاتورة', 'آخر تذكير', 'التلقائي', 'إجراء'].map(h => (
                  <th key={h} className="border-b border-slate-200 px-4 py-3 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDebts.map(debt => (
                <tr key={debt.id} className="border-b border-slate-100 bg-white last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-950">{debt.customer_name || 'زبون غير مسجل'}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-400"><Phone size={12} /> {debt.phone || 'لا يوجد رقم'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-mono font-black text-slate-950">{debt.plate_number || '-'}</p>
                    <p className="mt-1 text-xs text-slate-500">{debt.car_type || 'نوع غير محدد'}</p>
                  </td>
                  <td className="px-4 py-4 font-black text-rose-700">{money(debt.amount)}</td>
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-950">#{debt.invoice_id}</p>
                    <p className="mt-1 text-xs text-slate-400">{debt.invoice_date || '-'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-700">{debt.last_message_at ? new Date(debt.last_message_at).toLocaleDateString('ar-IQ') : 'لم يرسل بعد'}</p>
                    <p className={`mt-1 text-xs font-black ${debt.last_message_status === 'sent' ? 'text-emerald-700' : debt.last_message_status ? 'text-amber-700' : 'text-slate-400'}`}>
                      {debt.last_message_status || 'بانتظار أول تذكير'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => updateMutation.mutate({ id: debt.id, data: { auto_reminder_enabled: !debt.auto_reminder_enabled } })}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ${debt.auto_reminder_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {debt.auto_reminder_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {debt.auto_reminder_enabled ? 'مفعل' : 'متوقف'}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => sendMutation.mutate(debt.id)}
                        disabled={sendMutation.isPending || !debt.phone}
                        className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-black text-white hover:bg-cyan-700 disabled:opacity-50">
                        <MessageCircle size={13} /> إرسال الآن
                      </button>
                      <button onClick={() => partialPay(debt)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 hover:bg-amber-100">
                        <CreditCard size={13} /> دفع جزئي
                      </button>
                      <button onClick={() => markPaid(debt)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100">
                        <CheckCircle2 size={13} /> تسديد كامل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredDebts.length && (
          <div className="py-10 text-center text-sm font-bold text-slate-400">
            {isLoading ? 'جاري تحميل الديون...' : 'لا توجد ديون مفتوحة'}
          </div>
        )}
      </section>
    </Layout>
  )
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const colors = {
    rose: 'bg-rose-50 text-rose-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    slate: 'bg-slate-50 text-slate-700',
  }
  return (
    <div className="surface rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colors[tone] || colors.slate}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
