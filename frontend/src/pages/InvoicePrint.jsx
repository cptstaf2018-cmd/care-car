import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getInvoice } from '../api/invoices'

const STATUS = { paid: 'مدفوعة', unpaid: 'غير مدفوعة', partial: 'جزئية' }
const STATUS_COLOR = { paid: '#059669', unpaid: '#dc2626', partial: '#d97706' }

export default function InvoicePrint() {
  const { id } = useParams()
  const { data: inv, isLoading, isError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id).then(r => r.data),
  })

  if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-500">جاري تحميل الفاتورة...</div>
  if (isError || !inv) return <div className="flex h-screen items-center justify-center text-rose-600">تعذر تحميل الفاتورة</div>

  const whatsappMsg = encodeURIComponent(
    `السلام عليكم ${inv.customer_name || 'عزيزنا العميل'}،\n\nشكراً لزيارتكم ${inv.center_name}.\n\n` +
    `فاتورة رقم #${inv.id}\n` +
    `السيارة: ${inv.plate_number || ''} ${inv.car_type || ''}\n` +
    `الخدمات:\n${inv.service_lines.map(l => `• ${l}`).join('\n')}\n\n` +
    `المبلغ الإجمالي: ${inv.net?.toLocaleString()} IQD\n` +
    `الحالة: ${STATUS[inv.status] || inv.status}\n\n` +
    `نتطلع لخدمتكم دائماً 🚗`
  )
  const whatsappUrl = inv.center_whatsapp
    ? `https://wa.me/${inv.center_whatsapp.replace(/\D/g, '')}?text=${whatsappMsg}`
    : `https://wa.me/?text=${whatsappMsg}`

  return (
    <>
      {/* Print action bar — hidden on print */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-slate-950 px-6 py-3">
        <p className="text-sm font-bold text-white">فاتورة #{inv.id} — {inv.plate_number}</p>
        <div className="flex gap-3">
          <button onClick={() => window.print()}
            className="rounded-lg bg-white px-5 py-2 text-sm font-black text-slate-950 hover:bg-slate-100">
            🖨️ طباعة
          </button>
          <a href={whatsappUrl} target="_blank" rel="noreferrer"
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-black text-white hover:bg-emerald-600">
            📲 إرسال واتساب
          </a>
          <button onClick={() => window.history.back()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/70 hover:text-white">
            رجوع
          </button>
        </div>
      </div>

      {/* A4 Invoice */}
      <div className="invoice-page" dir="rtl">
        {/* Header */}
        <header className="invoice-header">
          <div className="invoice-brand">
            {inv.center_logo && (
              <img src={inv.center_logo} alt="logo" className="invoice-logo" />
            )}
            <div>
              <h1 className="invoice-center-name">{inv.center_name || 'مركز الخدمة'}</h1>
              {inv.center_phone && <p className="invoice-meta-text">📞 {inv.center_phone}</p>}
              {inv.center_whatsapp && <p className="invoice-meta-text">💬 واتساب: {inv.center_whatsapp}</p>}
            </div>
          </div>
          <div className="invoice-title-box">
            <p className="invoice-label">فاتورة خدمة</p>
            <p className="invoice-number">#{String(inv.id).padStart(5, '0')}</p>
            <p className="invoice-date">{inv.invoice_date}</p>
            <span className="invoice-status-badge" style={{ background: STATUS_COLOR[inv.status] }}>
              {STATUS[inv.status] || inv.status}
            </span>
          </div>
        </header>

        <div className="invoice-divider" />

        {/* Customer + Car info */}
        <section className="invoice-info-grid">
          <div className="invoice-info-card">
            <p className="invoice-info-label">العميل</p>
            <p className="invoice-info-value">{inv.customer_name || 'عميل كريم'}</p>
          </div>
          <div className="invoice-info-card">
            <p className="invoice-info-label">رقم اللوحة</p>
            <p className="invoice-info-value invoice-plate">{inv.plate_number || '—'}</p>
          </div>
          <div className="invoice-info-card">
            <p className="invoice-info-label">نوع السيارة</p>
            <p className="invoice-info-value">{inv.car_type || '—'}</p>
          </div>
          {inv.mileage && (
            <div className="invoice-info-card">
              <p className="invoice-info-label">عداد المسافة</p>
              <p className="invoice-info-value">{Number(inv.mileage).toLocaleString()} كم</p>
            </div>
          )}
        </section>

        {/* Services table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الخدمة</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {inv.service_lines.filter(Boolean).map((line, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{line}</td>
                <td>
                  {i === inv.service_lines.length - 1 && inv.service_lines.length === 1
                    ? `${inv.amount?.toLocaleString()} IQD`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="invoice-totals">
          <div className="invoice-total-row">
            <span>المبلغ الإجمالي</span>
            <span>{inv.amount?.toLocaleString()} IQD</span>
          </div>
          {inv.discount > 0 && (
            <div className="invoice-total-row">
              <span>الخصم</span>
              <span>- {inv.discount?.toLocaleString()} IQD</span>
            </div>
          )}
          <div className="invoice-total-row invoice-net">
            <span>الصافي المستحق</span>
            <span>{inv.net?.toLocaleString()} IQD</span>
          </div>
        </div>

        {/* Notes */}
        {inv.notes && (
          <div className="invoice-notes">
            <p className="invoice-info-label">ملاحظات</p>
            <p className="invoice-notes-text">{inv.notes}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="invoice-footer">
          <div className="invoice-footer-line" />
          <p className="invoice-footer-thanks">شكراً لثقتكم بنا — نتطلع لخدمتكم دائماً</p>
          <p className="invoice-footer-brand">{inv.center_name} · care-car-saas</p>
        </footer>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .invoice-page { margin-top: 0 !important; box-shadow: none !important; }
        }

        body { background: #f1f5f9; font-family: 'Segoe UI', Tahoma, sans-serif; }

        .invoice-page {
          margin: 70px auto 40px;
          max-width: 794px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
          padding: 48px 52px;
          min-height: 1000px;
          position: relative;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }

        .invoice-brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .invoice-logo {
          height: 64px;
          width: auto;
          object-fit: contain;
        }

        .invoice-center-name {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 4px;
        }

        .invoice-meta-text {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0;
        }

        .invoice-title-box {
          text-align: left;
          min-width: 160px;
        }

        .invoice-label {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 4px;
        }

        .invoice-number {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }

        .invoice-date {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 8px;
        }

        .invoice-status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 900;
          color: white;
        }

        .invoice-divider {
          height: 3px;
          background: linear-gradient(90deg, #0891b2, #06b6d4, #67e8f9);
          border-radius: 99px;
          margin: 28px 0;
        }

        .invoice-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .invoice-info-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
        }

        .invoice-info-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 4px;
        }

        .invoice-info-value {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .invoice-plate {
          font-family: monospace;
          font-size: 18px;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }

        .invoice-table thead tr {
          background: #0f172a;
          color: white;
        }

        .invoice-table th {
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 800;
          text-align: right;
        }

        .invoice-table th:last-child { text-align: left; }

        .invoice-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          text-align: right;
        }

        .invoice-table td:last-child { text-align: left; }

        .invoice-table tbody tr:nth-child(even) { background: #f8fafc; }
        .invoice-table tbody tr:hover { background: #f0f9ff; }

        .invoice-totals {
          margin-right: auto;
          margin-left: 0;
          width: 280px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .invoice-total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 16px;
          font-size: 14px;
          color: #475569;
          border-bottom: 1px solid #f1f5f9;
        }

        .invoice-net {
          background: #0f172a;
          color: white;
          font-size: 16px;
          font-weight: 900;
          border-bottom: none;
        }

        .invoice-notes {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 32px;
        }

        .invoice-notes-text {
          font-size: 13px;
          color: #78350f;
          margin: 4px 0 0;
          line-height: 1.6;
        }

        .invoice-footer {
          text-align: center;
          margin-top: 32px;
        }

        .invoice-footer-line {
          height: 1px;
          background: #e2e8f0;
          margin-bottom: 16px;
        }

        .invoice-footer-thanks {
          font-size: 14px;
          font-weight: 700;
          color: #475569;
          margin: 0 0 4px;
        }

        .invoice-footer-brand {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }
      `}</style>
    </>
  )
}
