import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Filter, PlusCircle, Printer, Receipt, Search, Zap } from 'lucide-react'
import Layout from '../components/Layout'
import { getInvoices, updateInvoice } from '../api/invoices'

const statusLabel = { paid: 'مدفوعة', unpaid: 'غير مدفوعة', partial: 'جزئية' }
const statusStyle = {
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-rose-100 text-rose-700',
  partial: 'bg-amber-100 text-amber-700',
}

const money = value => `${Number(value || 0).toLocaleString()} IQD`

export default function Invoices() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ search: '', status: 'all' })
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getInvoices().then(r => r.data),
  })

  const markPaid = useMutation({
    mutationFn: (id) => updateInvoice(id, { status: 'paid' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const filteredInvoices = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return invoices.filter(inv => {
      const matchesStatus = filters.status === 'all' || inv.status === filters.status
      const matchesSearch = !q || [
        inv.id,
        inv.customer_name,
        inv.plate_number,
        inv.car_type,
        inv.service_name,
      ].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
      return matchesStatus && matchesSearch
    })
  }, [invoices, filters])

  const totals = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => {
      const total = Number(inv.amount || 0) - Number(inv.discount || 0)
      acc.total += total
      acc.paid += Number(inv.paid_amount || 0)
      acc.remaining += Number(inv.remaining_amount || 0)
      return acc
    }, { total: 0, paid: 0, remaining: 0 })
  }, [filteredInvoices])

  const exportCsv = () => {
    const headers = ['رقم', 'العميل', 'السيارة', 'الخدمات', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة']
    const rows = filteredInvoices.map(inv => [
      inv.id,
      inv.customer_name || '',
      inv.plate_number || '',
      inv.service_name || '',
      Number(inv.amount || 0) - Number(inv.discount || 0),
      inv.paid_amount || 0,
      inv.remaining_amount || 0,
      statusLabel[inv.status] || inv.status,
    ])
    const csv = '\ufeff' + [headers, ...rows].map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-black text-cyan-700">إدارة الفواتير</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">فواتير الخدمة</h2>
          <p className="mt-2 text-sm text-slate-500">كل فاتورة خدمة مع السيارة، المبلغ، المدفوع، المتبقي والحالة.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction to="/center/services/new" icon={PlusCircle} label="فاتورة جديدة" primary />
          <QuickAction to="/center/services/new" icon={Zap} label="خدمة جديدة" />
          <QuickButton onClick={() => window.print()} icon={Printer} label="طباعة" />
          <QuickButton onClick={exportCsv} icon={Download} label="تصدير Excel" />
        </div>
      </div>

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <SummaryCard title="الإجمالي" value={money(totals.total)} tone="slate" />
        <SummaryCard title="المدفوع" value={money(totals.paid)} tone="emerald" />
        <SummaryCard title="المتبقي" value={money(totals.remaining)} tone="rose" />
      </section>

      <section className="surface mb-5 rounded-lg p-4">
        <div className="mb-3 flex items-center gap-2 text-slate-950">
          <Filter size={18} />
          <h3 className="font-black">تصفية الفواتير</h3>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="بحث سريع برقم الفاتورة، العميل، السيارة أو الخدمة..."
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
          </div>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400">
            <option value="all">كل الحالات</option>
            <option value="paid">مدفوعة</option>
            <option value="unpaid">غير مدفوعة</option>
            <option value="partial">جزئية</option>
          </select>
        </div>
      </section>

      <section className="surface overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {['رقم', 'العميل', 'السيارة', 'الخدمات', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة', 'إجراء'].map(h => (
                  <th key={h} className="border-b border-slate-200 px-4 py-3 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => {
                const total = Number(inv.amount || 0) - Number(inv.discount || 0)
                return (
                  <tr key={inv.id} className="border-b border-slate-100 bg-white last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-4 font-mono font-black text-slate-950">#{inv.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">{inv.customer_name || 'عميل غير مسجل'}</p>
                      <p className="mt-1 text-xs text-slate-400">{inv.invoice_date}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-mono font-black text-slate-950">{inv.plate_number || '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">{inv.car_type || 'نوع غير محدد'}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{inv.service_name || '-'}</td>
                    <td className="px-4 py-4 font-black text-slate-950">{money(total)}</td>
                    <td className="px-4 py-4 font-black text-emerald-700">{money(inv.paid_amount)}</td>
                    <td className="px-4 py-4 font-black text-rose-700">{money(inv.remaining_amount)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusStyle[inv.status] || 'bg-slate-100 text-slate-700'}`}>
                        {statusLabel[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {inv.status !== 'paid' ? (
                        <button
                          onClick={() => markPaid.mutate(inv.id)}
                          disabled={markPaid.isPending}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50">
                          تأكيد الدفع
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">مكتملة</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!filteredInvoices.length && (
          <div className="py-10 text-center text-sm font-bold text-slate-400">
            {isLoading ? 'جاري تحميل الفواتير...' : 'لا توجد فواتير مطابقة'}
          </div>
        )}
      </section>
    </Layout>
  )
}

function QuickAction({ to, icon: Icon, label, primary }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-black transition ${
        primary ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-200 hover:bg-cyan-300' : 'border border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
      }`}
    >
      <Icon size={17} />
      {label}
    </Link>
  )
}

function QuickButton({ onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
      <Icon size={17} />
      {label}
    </button>
  )
}

function SummaryCard({ title, value, tone }) {
  const colors = {
    slate: 'bg-slate-950 text-white',
    emerald: 'bg-emerald-600 text-white',
    rose: 'bg-rose-600 text-white',
  }
  return (
    <div className={`rounded-lg p-5 shadow-xl ${colors[tone]}`}>
      <div className="mb-3 flex items-center gap-2 text-white/75">
        <Receipt size={18} />
        <p className="text-sm font-bold">{title}</p>
      </div>
      <p className="text-2xl font-black">{value}</p>
    </div>
  )
}
