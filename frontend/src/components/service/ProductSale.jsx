import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, PackagePlus, Plus, Search } from 'lucide-react'
import FuelLevel from '../cluster/FuelLevel'

const money = (n) => Math.round(Number(n) || 0).toLocaleString('en-US')
const inputClass = 'w-full rounded-xl border border-mint-dim bg-white px-3 py-2.5 text-petrol-deep outline-none focus:border-oil focus:ring-2 focus:ring-oil/30'

/**
 * Over-the-counter selling for a parts store: pick products from stock, set the quantity, and the invoice line
 * (with its stock deduction) is built for you. Anything not in stock can still be sold as a manual item.
 */
export default function ProductSale({ items, loading, onAdd }) {
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState(null)
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState('')
  const [manual, setManual] = useState({ name: '', price: '', qty: '1' })

  const query = search.trim().toLowerCase()
  const visible = items.filter((item) => !query || `${item.oil_type} ${item.category || ''}`.toLowerCase().includes(query))
  const available = picked ? Number(picked.quantity) : 0
  const lineTotal = (Number(price) || 0) * (Number(qty) || 0)

  const pick = (item) => {
    setPicked(item)
    setQty(1)
    setPrice(item.sale_price ? String(Math.round(item.sale_price)) : '')
  }
  const clamp = (value) => Math.min(Math.max(Number(value) || 0, 0), available)

  const addPicked = () => {
    if (!picked || !(qty > 0) || !(Number(price) > 0)) return
    onAdd({ name: picked.oil_type, amount: lineTotal, notes: `${qty} × ${money(price)} د.ع`, inventoryItemId: picked.id, inventoryItemName: picked.oil_type, inventoryQty: Number(qty) })
    setPicked(null)
    setSearch('')
  }

  const addManual = () => {
    const quantity = Number(manual.qty) || 1
    const unit = Number(manual.price)
    if (!manual.name.trim() || !(unit > 0)) return
    onAdd({ name: manual.name.trim(), amount: unit * quantity, notes: `${quantity} × ${money(unit)} د.ع`, inventoryItemId: null, inventoryItemName: null, inventoryQty: null })
    setManual({ name: '', price: '', qty: '1' })
  }

  return (
    <div className="space-y-4 rounded-3xl border border-mint-dim bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-petrol text-oil"><PackagePlus size={24} aria-hidden="true" /></span>
        <div>
          <h3 className="font-bold text-petrol-deep">اختر الأصناف من المخزون</h3>
          <p className="text-xs text-mint-ink">السعر يجي من سعر البيع المسجّل، وتنقص الكمية تلقائياً.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gauge" size={18} aria-hidden="true" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن صنف أو تصنيف..." className={`${inputClass} pe-10`} />
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-mint-ink">جاري تحميل المخزون...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mint-dim p-6 text-center">
          <p className="font-bold text-petrol-deep">المخزون فاضي</p>
          <p className="mt-1 text-sm text-mint-ink">ضيف قطعك وأسعارها أول، وبعدها تبيعها من هنا.</p>
          <Link to="/center/inventory" className="mt-3 inline-block rounded-full bg-petrol px-5 py-2 text-sm font-bold text-mint">روح للمخزون</Link>
        </div>
      ) : (
        <ul className="grid max-h-[340px] gap-2 overflow-y-auto sm:grid-cols-2">
          {visible.map((item) => {
            const out = Number(item.quantity) <= 0
            const active = picked?.id === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={out}
                  onClick={() => pick(item)}
                  aria-pressed={active}
                  className={`w-full rounded-2xl border-2 p-3 text-start transition disabled:opacity-50 ${active ? 'border-oil bg-oil-light/50' : 'border-mint-dim bg-white hover:border-gauge'}`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <b className="block truncate text-petrol-deep">{item.oil_type}</b>
                      <span className="text-xs text-mint-ink">{item.category || 'بدون تصنيف'}</span>
                    </span>
                    <b className="shrink-0 text-sm tabular-nums text-petrol">{item.sale_price ? `${money(item.sale_price)} د.ع` : 'بدون سعر'}</b>
                  </span>
                  <span className="mt-2 block"><FuelLevel quantity={item.quantity} threshold={item.min_threshold} /></span>
                  <span className={`mt-1 block text-xs font-bold ${out ? 'text-alert' : 'text-mint-ink'}`}>{out ? 'نفد من المخزون' : `متوفر ${money(item.quantity)}`}</span>
                </button>
              </li>
            )
          })}
          {visible.length === 0 && <li className="rounded-2xl border border-dashed border-mint-dim p-4 text-center text-sm text-mint-ink sm:col-span-2">ما كو صنف بهذا الاسم.</li>}
        </ul>
      )}

      {picked && (
        <div className="grid gap-3 rounded-2xl bg-petrol p-4 text-mint">
          <div className="flex items-center justify-between gap-2">
            <b>{picked.oil_type}</b>
            <button type="button" onClick={() => setPicked(null)} className="text-xs text-gauge-light underline underline-offset-4">إلغاء</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1 block text-xs text-gauge-light">الكمية (الأقصى {money(available)})</span>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="أنقص" onClick={() => setQty(clamp(Number(qty) - 1))} className="grid h-10 w-10 place-items-center rounded-xl bg-petrol-deep"><Minus size={16} /></button>
                <input type="number" min="1" max={available} value={qty} onChange={(e) => setQty(clamp(e.target.value))} aria-label="الكمية" className="h-10 w-full rounded-xl bg-petrol-deep text-center font-bold tabular-nums outline-none focus:ring-2 focus:ring-oil" />
                <button type="button" aria-label="زِد" onClick={() => setQty(clamp(Number(qty) + 1))} className="grid h-10 w-10 place-items-center rounded-xl bg-petrol-deep"><Plus size={16} /></button>
              </div>
            </div>
            <label>
              <span className="mb-1 block text-xs text-gauge-light">سعر القطعة (د.ع)</span>
              <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="h-10 w-full rounded-xl bg-petrol-deep px-3 font-bold tabular-nums outline-none focus:ring-2 focus:ring-oil" />
            </label>
          </div>
          <button
            type="button"
            onClick={addPicked}
            disabled={!(qty > 0) || !(Number(price) > 0)}
            className="rounded-full bg-oil py-3 font-bold text-petrol-deep transition hover:bg-oil-dark disabled:opacity-50"
          >
            إضافة للفاتورة · {money(lineTotal)} د.ع
          </button>
        </div>
      )}

      <details className="rounded-2xl border border-mint-dim px-4 py-3">
        <summary className="cursor-pointer text-sm font-bold text-petrol marker:hidden">صنف غير مسجّل بالمخزون</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_110px_80px_auto]">
          <input value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} placeholder="اسم الصنف" className={inputClass} />
          <input type="number" min="0" value={manual.price} onChange={(e) => setManual({ ...manual, price: e.target.value })} placeholder="السعر" className={inputClass} />
          <input type="number" min="1" value={manual.qty} onChange={(e) => setManual({ ...manual, qty: e.target.value })} aria-label="الكمية" className={inputClass} />
          <button type="button" onClick={addManual} disabled={!manual.name.trim() || !(Number(manual.price) > 0)} className="rounded-xl bg-petrol px-4 py-2.5 text-sm font-bold text-mint disabled:opacity-50">أضف</button>
        </div>
      </details>
    </div>
  )
}
