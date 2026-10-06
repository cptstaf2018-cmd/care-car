import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Edit2, Filter, Printer, Receipt, Search, Trash2, X } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import IraqiPlate from '../components/car/IraqiPlate'
import { getInvoices, updateInvoice, deleteInvoice } from '../api/invoices'

const STAMP = {
  paid: { cls: 'border-emerald-600 text-emerald-700' },
  unpaid: { cls: 'border-alert text-alert' },
  partial: { cls: 'border-oil-dark text-oil-dark' },
}
const statusLabel = { paid: 'مدفوعة', unpaid: 'غير مدفوعة', partial: 'جزئية' }

const money = value => `${Number(value || 0).toLocaleString()} IQD`

const nextStatus = { unpaid: 'partial', partial: 'paid', paid: 'unpaid' }
const nextStatusLabel = { unpaid: 'جزئي', partial: 'مدفوعة', paid: 'غير مدفوعة' }

export default function Invoices() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ search: '', status: 'all' })
  const [editInvoice, setEditInvoice] = useState(null)
  const [editForm, setEditForm] = useState({ amount: '', discount: '', status: '' })
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getInvoices().then(r => r.data),
  })

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateInvoice(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateInvoice(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setEditInvoice(null) },
  })

  const openEdit = (inv) => {
    setEditInvoice(inv)
    setEditForm({ amount: String(inv.amount), discount: String(inv.discount), status: inv.status })
  }

  const saveEdit = () => {
    editMutation.mutate({
      id: editInvoice.id,
      data: {
        amount: parseFloat(editForm.amount) || editInvoice.amount,
        discount: parseFloat(editForm.discount) || 0,
        status: editForm.status,
      },
    })
  }

  const removeMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const confirmDelete = (inv) => {
    if (window.confirm(`حذف الفاتورة #${inv.id}؟`)) removeMutation.mutate(inv.id)
  }

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
          <QuickButton onClick={() => window.print()} icon={Printer} label="طباعة" />
          <QuickButton onClick={exportCsv} icon={Download} label="تصدير Excel" />
        </div>
      </div>

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <StatCard icon={Receipt} label="الإجمالي" value={money(totals.total)} color="slate" />
        <StatCard icon={Receipt} label="المدفوع" value={money(totals.paid)} color="green" fraction={totals.total ? totals.paid / totals.total : 0} />
        <StatCard icon={Receipt} label="المتبقي" value={money(totals.remaining)} color="red" fraction={totals.total ? totals.remaining / totals.total : 0} />
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

      <section aria-label="الفواتير" className="grid gap-3 xl:grid-cols-2">
        {filteredInvoices.map(inv => {
          const total = Number(inv.amount || 0) - Number(inv.discount || 0)
          const stamp = STAMP[inv.status] || STAMP.unpaid
          return (
            <article key={inv.id} className="grid grid-cols-[88px_1fr] overflow-hidden rounded-3xl border border-mint-dim bg-white">
              <div className="relative flex flex-col items-center justify-center gap-1 border-e-2 border-dashed border-mint-dim bg-mint px-2 py-4 text-center">
                <span aria-hidden="true" className="absolute -end-[9px] -top-[9px] h-4 w-4 rounded-full bg-[#EEF4F2]" />
                <span aria-hidden="true" className="absolute -bottom-[9px] -end-[9px] h-4 w-4 rounded-full bg-[#EEF4F2]" />
                <span className="text-[11px] text-mint-ink">تذكرة</span>
                <span className="text-lg font-bold tabular-nums text-petrol-deep">#{inv.id}</span>
                <span className="text-[11px] text-mint-ink">{inv.invoice_date}</span>
              </div>

              <div className="min-w-0 p-4">
                <header className="flex items-start justify-between gap-3">
                  <IraqiPlate plate={inv.plate_number || '—'} />
                  <span className={`-rotate-6 rounded-lg border-2 px-2.5 py-0.5 text-sm font-bold ${stamp.cls}`}>{statusLabel[inv.status] || inv.status}</span>
                </header>
                <p className="mt-3 truncate font-bold text-petrol-deep">{inv.customer_name || 'عميل غير مسجل'}</p>
                <p className="truncate text-xs text-mint-ink">{inv.car_type || 'نوع غير محدد'} · {inv.service_name || '-'}</p>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-mint py-1.5"><dt className="text-[11px] text-mint-ink">الإجمالي</dt><dd className="text-sm font-bold tabular-nums text-petrol-deep">{money(total)}</dd></div>
                  <div className="rounded-xl bg-mint py-1.5"><dt className="text-[11px] text-mint-ink">المدفوع</dt><dd className="text-sm font-bold tabular-nums text-emerald-700">{money(inv.paid_amount)}</dd></div>
                  <div className="rounded-xl bg-mint py-1.5"><dt className="text-[11px] text-mint-ink">المتبقي</dt><dd className={`text-sm font-bold tabular-nums ${Number(inv.remaining_amount) > 0 ? 'text-alert' : 'text-petrol'}`}>{money(inv.remaining_amount)}</dd></div>
                </dl>

                <footer className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => navigate(`/center/invoices/${inv.id}/print`)}
                    className="flex items-center gap-1 rounded-full bg-petrol px-3 py-1.5 text-xs font-bold text-mint hover:bg-petrol-deep">
                    <Printer size={12} /> التذكرة
                  </button>
                  <button
                    onClick={() => changeStatus.mutate({ id: inv.id, status: nextStatus[inv.status] || 'paid' })}
                    disabled={changeStatus.isPending}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                      inv.status === 'paid' ? 'bg-mint text-petrol hover:bg-mint-dim' : 'bg-oil text-petrol-deep hover:bg-oil-dark'
                    }`}>
                    {nextStatusLabel[inv.status] || 'مدفوعة'}
                  </button>
                  <div className="ms-auto flex gap-1.5">
                    <button onClick={() => openEdit(inv)} aria-label="تعديل"
                      className="grid h-8 w-8 place-items-center rounded-full bg-oil-light text-oil-dark hover:bg-oil/30">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => confirmDelete(inv)} disabled={removeMutation.isPending} aria-label="حذف"
                      className="grid h-8 w-8 place-items-center rounded-full bg-alert/10 text-alert hover:bg-alert/20 disabled:opacity-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </footer>
              </div>
            </article>
          )
        })}
        {!filteredInvoices.length && (
          <div className="rounded-3xl border border-dashed border-mint-dim bg-white/60 py-10 text-center text-sm text-mint-ink xl:col-span-2">
            {isLoading ? 'جاري تحميل الفواتير...' : 'ما كو فواتير تطابق التصفية.'}
          </div>
        )}
      </section>

      {editInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">تعديل الفاتورة #{editInvoice.id}</h3>
              <button onClick={() => setEditInvoice(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-black text-slate-500">المبلغ الإجمالي (IQD)</label>
                <input type="number" value={editForm.amount}
                  onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black text-slate-500">الخصم (IQD)</label>
                <input type="number" value={editForm.discount}
                  onChange={e => setEditForm({ ...editForm, discount: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black text-slate-500">حالة الفاتورة</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400">
                  <option value="paid">مدفوعة</option>
                  <option value="unpaid">غير مدفوعة</option>
                  <option value="partial">جزئية</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={saveEdit} disabled={editMutation.isPending}
                className="flex-1 rounded-lg bg-slate-950 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">
                {editMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button onClick={() => setEditInvoice(null)}
                className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
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
