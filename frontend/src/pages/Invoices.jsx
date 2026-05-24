import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { getInvoices, updateInvoice } from '../api/invoices'

const statusLabel = { paid: 'مدفوع', unpaid: 'غير مدفوع', partial: 'جزئي' }
const statusColor = { paid: 'text-green-400', unpaid: 'text-red-400', partial: 'text-yellow-400' }

export default function Invoices() {
  const qc = useQueryClient()
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getInvoices().then(r => r.data),
  })
  const markPaid = useMutation({
    mutationFn: (id) => updateInvoice(id, { status: 'paid' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-6">الفواتير</h1>
      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-700 text-slate-300 text-sm">
            <tr>{['#', 'التاريخ', 'المبلغ', 'الخصم', 'الحالة', 'إجراء'].map(h => (
              <th key={h} className="px-4 py-3">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-t border-slate-700 text-white hover:bg-slate-700/50 transition">
                <td className="px-4 py-3 font-mono text-slate-400">#{inv.id}</td>
                <td className="px-4 py-3 text-sm">{inv.invoice_date}</td>
                <td className="px-4 py-3 font-bold">{parseFloat(inv.amount).toLocaleString()} IQD</td>
                <td className="px-4 py-3 text-slate-400">{parseFloat(inv.discount || 0).toLocaleString()}</td>
                <td className={`px-4 py-3 font-bold ${statusColor[inv.status]}`}>{statusLabel[inv.status]}</td>
                <td className="px-4 py-3">
                  {inv.status !== 'paid' && (
                    <button onClick={() => markPaid.mutate(inv.id)}
                      className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition">
                      تأكيد الدفع
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="text-slate-400 text-center py-8">لا توجد فواتير</p>}
      </div>
    </Layout>
  )
}
