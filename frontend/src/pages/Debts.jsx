import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCircle2, CreditCard, Phone, Search, ToggleLeft, ToggleRight, WalletCards } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import IraqiPlate from '../components/car/IraqiPlate'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { getDebts, sendDebtReminder, updateDebt } from '../api/debts'

const money = value => `${Number(value || 0).toLocaleString()} IQD`

const DAY_MS = 86400000
const WARM_AFTER_DAYS = 7
const HOT_AFTER_DAYS = 30

function debtAgeDays(invoiceDate) {
  if (!invoiceDate) return null
  const days = Math.floor((Date.now() - new Date(`${invoiceDate}T00:00:00`).getTime()) / DAY_MS)
  return Math.max(0, days)
}

/** The longer a debt stays open the hotter its lamp: amber, orange, then red and pulsing. */
function lampFor(age) {
  if (age != null && age >= HOT_AFTER_DAYS) return { cls: 'bg-alert/10 text-alert', dot: 'animate-pulse bg-alert' }
  if (age != null && age >= WARM_AFTER_DAYS) return { cls: 'bg-oil-light text-oil-dark', dot: 'bg-oil-dark' }
  return { cls: 'bg-mint text-petrol', dot: 'bg-oil' }
}

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
      </div>

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <StatCard icon={WalletCards} label="إجمالي الديون" value={money(totals.amount)} color="red" />
        <StatCard icon={Bell} label="تذكير تلقائي مفعل" value={totals.auto} color="blue" />
        <StatCard icon={CreditCard} label="عدد الديون" value={filteredDebts.length} color="slate" />
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

      <section aria-label="الديون" className="grid gap-3 xl:grid-cols-2">
        {filteredDebts.map(debt => {
          const age = debtAgeDays(debt.invoice_date)
          const lamp = lampFor(age)
          return (
            <article key={debt.id} className="rounded-3xl border border-mint-dim bg-white p-4">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-petrol-deep">{debt.customer_name || 'زبون غير مسجل'}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-mint-ink" dir="ltr"><Phone size={12} /> {debt.phone || 'لا يوجد رقم'}</p>
                </div>
                <IraqiPlate plate={debt.plate_number || '—'} />
              </header>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-mint-ink">مبلغ الدين</p>
                  <p className="text-3xl font-bold tabular-nums text-alert">{money(debt.amount)}</p>
                </div>
                <div className="text-end">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${lamp.cls}`}>
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${lamp.dot}`} />
                    {age == null ? 'تاريخ غير معروف' : age === 0 ? 'دين اليوم' : `عمره ${age} يوم`}
                  </span>
                  <p className="mt-1 text-xs text-mint-ink">فاتورة #{debt.invoice_id} · {debt.invoice_date || '-'}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-mint px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-petrol">{debt.last_message_at ? `آخر تذكير ${new Date(debt.last_message_at).toLocaleDateString('ar-IQ')}` : 'لسا ما انرسل تذكير'}</p>
                  <p className={`font-bold ${debt.last_message_status === 'sent' ? 'text-emerald-700' : debt.last_message_status ? 'text-oil-dark' : 'text-gauge'}`}>
                    {debt.last_message_status || 'بانتظار أول تذكير'}
                  </p>
                </div>
                <button
                  onClick={() => updateMutation.mutate({ id: debt.id, data: { auto_reminder_enabled: !debt.auto_reminder_enabled } })}
                  aria-pressed={!!debt.auto_reminder_enabled}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-bold ${debt.auto_reminder_enabled ? 'bg-petrol text-mint' : 'bg-white text-gauge'}`}>
                  {debt.auto_reminder_enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  تذكير تلقائي
                </button>
              </div>

              <footer className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => sendMutation.mutate(debt.id)}
                  disabled={sendMutation.isPending || !debt.phone}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-[#063] hover:brightness-95 disabled:opacity-50">
                  <WhatsAppIcon size={14} className="text-[#063]" /> ذكّره الآن
                </button>
                <button onClick={() => partialPay(debt)}
                  className="inline-flex items-center gap-1 rounded-full bg-oil-light px-3.5 py-2 text-xs font-bold text-oil-dark hover:bg-oil/30">
                  <CreditCard size={13} /> دفع جزئي
                </button>
                <button onClick={() => markPaid(debt)}
                  className="inline-flex items-center gap-1 rounded-full bg-petrol px-3.5 py-2 text-xs font-bold text-mint hover:bg-petrol-deep">
                  <CheckCircle2 size={13} /> تسديد كامل
                </button>
              </footer>
            </article>
          )
        })}
        {!filteredDebts.length && (
          <div className="rounded-3xl border border-dashed border-mint-dim bg-white/60 py-10 text-center text-sm text-mint-ink xl:col-span-2">
            {isLoading ? 'جاري تحميل الديون...' : 'ما كو ديون مفتوحة. كل شي مقبوض.'}
          </div>
        )}
      </section>
    </Layout>
  )
}
