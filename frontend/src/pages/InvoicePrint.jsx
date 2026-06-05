import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { getInvoice } from '../api/invoices'

const STATUS = { paid: 'مدفوعة', unpaid: 'غير مدفوعة', partial: 'جزئية' }
const STATUS_COLOR = { paid: '#059669', unpaid: '#dc2626', partial: '#d97706' }

export default function InvoicePrint() {
  const { id } = useParams()
  const invoiceRef = useRef(null)
  const [imageStatus, setImageStatus] = useState('')
  const { data: inv, isLoading, isError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id).then(r => r.data),
  })

  if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-500">جاري تحميل الفاتورة...</div>
  if (isError || !inv) return <div className="flex h-screen items-center justify-center text-rose-600">تعذر تحميل الفاتورة</div>
  const invoiceLines = inv.invoice_lines?.length
    ? inv.invoice_lines
    : inv.service_lines.filter(Boolean).map(line => ({ name: line, amount: 0, notes: '', inventory_item_name: '', inventory_quantity: null }))
  const isSaleInvoice = inv.invoice_type === 'sale' || inv.car_type === 'بيع قطع'
  const showMileage = Boolean(inv.mileage && invoiceLines.some(line => line.name?.includes('تبديل زيت')))

  const shareInvoiceImage = async () => {
    if (!invoiceRef.current) return
    setImageStatus('جاري تجهيز صورة الفاتورة...')
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.98))
      if (!blob) throw new Error('image_failed')
      const file = new File([blob], `invoice-${String(inv.id).padStart(5, '0')}.png`, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `فاتورة #${inv.id}`,
          text: `${inv.center_name || 'فاتورة خدمة'} - فاتورة #${inv.id}`,
        })
        setImageStatus('تم فتح مشاركة صورة الفاتورة')
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
      setImageStatus('تم تنزيل صورة الفاتورة. أرسلها للزبون عبر واتساب.')
    } catch {
      setImageStatus('تعذر تجهيز صورة الفاتورة. جرّب الطباعة أو أعد تحميل الصفحة.')
    }
  }

  return (
    <>
      {/* Print action bar — hidden on print */}
      <div className="no-print invoice-actions">
        <div className="invoice-actions-title">
          <span>معاينة الفاتورة</span>
        </div>
        <div className="invoice-actions-buttons">
          <button onClick={() => window.print()}
            className="invoice-action-button invoice-action-primary">
            🖨️ طباعة
          </button>
          <button onClick={shareInvoiceImage}
            className="invoice-action-button invoice-action-whatsapp">
            📲 إرسال صورة واتساب
          </button>
          <button onClick={() => window.history.back()}
            className="invoice-action-button invoice-action-muted">
            رجوع
          </button>
        </div>
        {imageStatus && <p className="invoice-actions-status">{imageStatus}</p>}
      </div>

      {/* A4 Invoice */}
      <div ref={invoiceRef} className="invoice-page" dir="rtl">
        {/* Header */}
        <header className="invoice-header">
          <div className="invoice-title-box">
            <div>
              <p className="invoice-label">{isSaleInvoice ? 'فاتورة بيع' : 'فاتورة خدمة'}</p>
              <p className="invoice-number">#{String(inv.id).padStart(5, '0')}</p>
            </div>
            <span className="invoice-status-badge" style={{ background: STATUS_COLOR[inv.status] }}>
              {STATUS[inv.status] || inv.status}
            </span>
            <p className="invoice-date">{inv.invoice_date}</p>
          </div>
          <div className="invoice-logo-frame">
            {inv.center_logo ? (
              <img src={inv.center_logo} alt="logo" className="invoice-logo" />
            ) : (
              <span className="invoice-logo-placeholder">CC</span>
            )}
          </div>
          <div className="invoice-brand-text">
            <p className="invoice-brand-label">{isSaleInvoice ? 'متجر قطع سيارات' : 'مركز خدمة سيارات'}</p>
            <h1 className="invoice-center-name">{inv.center_name || 'مركز الخدمة'}</h1>
            <div className="invoice-contact-row">
              {(inv.center_phone || inv.center_whatsapp) && (
                <span>هاتف المركز: {inv.center_phone || inv.center_whatsapp}</span>
              )}
            </div>
          </div>
        </header>

        <div className="invoice-divider" />

        {/* Customer + invoice info */}
        <section className="invoice-info-grid">
          <div className="invoice-info-card">
            <p className="invoice-info-label">العميل</p>
            <p className="invoice-info-value">{inv.customer_name || 'عميل كريم'}</p>
          </div>
          {isSaleInvoice ? (
            <div className="invoice-info-card">
              <p className="invoice-info-label">نوع الفاتورة</p>
              <p className="invoice-info-value">بيع قطع سيارات</p>
            </div>
          ) : (
            <>
              <div className="invoice-info-card">
                <p className="invoice-info-label">رقم اللوحة</p>
                <p className="invoice-info-value invoice-plate">{inv.plate_number || '—'}</p>
              </div>
              <div className="invoice-info-card">
                <p className="invoice-info-label">نوع السيارة</p>
                <p className="invoice-info-value">{inv.car_type || '—'}</p>
              </div>
            </>
          )}
          {showMileage && (
            <div className="invoice-info-card">
              <p className="invoice-info-label">عداد المسافة</p>
              <p className="invoice-info-value">{Number(inv.mileage).toLocaleString()} كم</p>
            </div>
          )}
        </section>

        {/* Lines table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isSaleInvoice ? 'المادة' : 'الخدمة'}</th>
              <th>{isSaleInvoice ? 'الكود / التفاصيل' : 'المادة / التفاصيل'}</th>
              <th>الكمية</th>
              {isSaleInvoice && <th>سعر الوحدة</th>}
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoiceLines.map((line, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{line.name}</td>
                <td>
                  {line.sku || line.category || line.notes || '—'}
                  {(line.sku || line.category) && line.notes ? <span className="invoice-line-note"> · {line.notes}</span> : null}
                </td>
                <td>{line.quantity || line.inventory_quantity || '—'}</td>
                {isSaleInvoice && <td>{line.unit_price ? `${Number(line.unit_price).toLocaleString()} IQD` : '—'}</td>}
                <td>{line.amount ? `${Number(line.amount).toLocaleString()} IQD` : '—'}</td>
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
          <p className="invoice-footer-thanks">{isSaleInvoice ? 'شكراً لتسوقكم معنا' : 'شكراً لثقتكم بنا — نتطلع لخدمتكم دائماً'}</p>
          <p className="invoice-footer-brand">{inv.center_name} · care-car-saas</p>
        </footer>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white !important; }
          .invoice-page { margin-top: 0 !important; box-shadow: none !important; }
        }

        body { background: #f1f5f9; font-family: 'Segoe UI', Tahoma, sans-serif; }

        .invoice-actions {
          position: sticky;
          top: 0;
          z-index: 50;
          max-width: 794px;
          margin: 18px auto 0;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: rgba(255,255,255,0.96);
          box-shadow: 0 12px 28px rgba(15,23,42,0.10);
          backdrop-filter: blur(10px);
        }

        .invoice-actions {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px 16px;
        }

        .invoice-actions-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
        }

        .invoice-actions-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .invoice-actions-status {
          grid-column: 1 / -1;
          margin: 0;
          color: #0e7490;
          font-size: 12px;
          font-weight: 800;
          text-align: right;
        }

        .invoice-action-button {
          border: 0;
          border-radius: 8px;
          padding: 9px 13px;
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
          line-height: 1.2;
        }

        .invoice-action-primary {
          background: #0f172a;
          color: white;
        }

        .invoice-action-whatsapp {
          background: #10b981;
          color: white;
        }

        .invoice-action-muted {
          background: #f1f5f9;
          color: #475569;
        }

        .invoice-page {
          margin: 18px auto 40px;
          max-width: 794px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          box-shadow: 0 8px 28px rgba(15,23,42,0.08);
          padding: 48px 52px;
          min-height: 1000px;
          position: relative;
        }

        .invoice-header {
          display: grid;
          grid-template-columns: 1fr 108px 1fr;
          align-items: center;
          gap: 20px;
          direction: ltr;
        }

        .invoice-logo-frame {
          width: 92px;
          height: 92px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          justify-self: center;
        }

        .invoice-brand-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          direction: rtl;
          text-align: right;
          justify-self: end;
          max-width: 320px;
        }

        .invoice-logo {
          max-height: 78px;
          max-width: 78px;
          object-fit: contain;
        }

        .invoice-logo-placeholder {
          color: #0f172a;
          font-size: 20px;
          font-weight: 900;
        }

        .invoice-brand-label {
          margin: 0 0 6px;
          color: #0891b2;
          font-size: 12px;
          font-weight: 900;
        }

        .invoice-center-name {
          font-size: 24px;
          line-height: 1.25;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }

        .invoice-contact-row {
          display: flex;
          flex-wrap: wrap;
          gap: 7px 12px;
          margin-top: 10px;
          font-size: 13px;
          color: #64748b;
          font-weight: 700;
          justify-content: flex-start;
        }

        .invoice-title-box {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          width: 132px;
          min-height: 72px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          text-align: left;
          direction: rtl;
          justify-self: start;
        }

        .invoice-label {
          font-size: 10px;
          font-weight: 900;
          color: #64748b;
          margin: 0 0 5px;
        }

        .invoice-number {
          font-size: 18px;
          line-height: 1;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }

        .invoice-date {
          font-size: 10px;
          color: #64748b;
          margin: 6px 0 0;
          font-weight: 800;
        }

        .invoice-status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 900;
          color: white;
        }

        .invoice-divider {
          height: 2px;
          background: linear-gradient(90deg, #0f172a, #0891b2);
          border-radius: 99px;
          margin: 26px 0;
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

        .invoice-line-note {
          color: #64748b;
          font-size: 12px;
        }

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
