import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowDownUp, PackagePlus, ReceiptText, Search, SlidersHorizontal } from 'lucide-react'
import Layout from '../components/Layout'
import { getInventory, createInventoryItem, updateInventoryItem, addInventoryReceipt } from '../api/inventory'

const emptyLine = {
  oil_type: '',
  category: '',
  quantity: '',
  unit_cost: '',
  sale_price: '',
  min_threshold: '10',
}

const initialManual = {
  oil_type: '',
  category: '',
  supplier_name: '',
  quantity: '',
  min_threshold: '10',
  unit_cost: '',
  sale_price: '',
}

const money = value => Number(value || 0).toLocaleString()

export default function Inventory() {
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data),
  })

  const [mode, setMode] = useState('manual')
  const [qtyInputs, setQtyInputs] = useState({})
  const [manual, setManual] = useState(initialManual)
  const [receiptImage, setReceiptImage] = useState(null)
  const [supplierName, setSupplierName] = useState('')
  const [lines, setLines] = useState([{ ...emptyLine }])
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    supplier: 'all',
    lowStock: false,
    topSelling: false,
  })

  const create = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setManual(initialManual)
    },
  })
  const update = useMutation({
    mutationFn: ({ id, data }) => updateInventoryItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
  const receipt = useMutation({
    mutationFn: addInventoryReceipt,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setLines([{ ...emptyLine }])
      setSupplierName('')
      setReceiptImage(null)
    },
  })

  const categories = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))], [items])
  const suppliers = useMemo(() => [...new Set(items.map(i => i.supplier_name).filter(Boolean))], [items])

  const filteredItems = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    const data = items.filter(item => {
      const matchesSearch = !q || [item.oil_type, item.category, item.supplier_name].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
      const matchesCategory = filters.category === 'all' || item.category === filters.category
      const matchesSupplier = filters.supplier === 'all' || item.supplier_name === filters.supplier
      const matchesStock = !filters.lowStock || item.low_stock
      return matchesSearch && matchesCategory && matchesSupplier && matchesStock
    })
    if (filters.topSelling) {
      return [...data].sort((a, b) => Number(b.total_sold || 0) - Number(a.total_sold || 0))
    }
    return data
  }, [items, filters])

  const setLine = (index, key, value) => {
    setLines(prev => prev.map((line, i) => i === index ? { ...line, [key]: value } : line))
  }

  const approveReceipt = () => {
    const cleanLines = lines
      .filter(line => line.oil_type && line.quantity)
      .map(line => ({
        oil_type: line.oil_type,
        category: line.category || null,
        quantity: Number(line.quantity),
        unit_cost: line.unit_cost ? Number(line.unit_cost) : null,
        sale_price: line.sale_price ? Number(line.sale_price) : null,
        min_threshold: Number(line.min_threshold) || 10,
      }))
    receipt.mutate({ supplier_name: supplierName || null, receipt_photo_url: null, lines: cleanLines })
  }

  const saveManual = () => {
    create.mutate({
      ...manual,
      category: manual.category || null,
      supplier_name: manual.supplier_name || null,
      quantity: Number(manual.quantity),
      min_threshold: Number(manual.min_threshold) || 10,
      unit_cost: manual.unit_cost ? Number(manual.unit_cost) : null,
      sale_price: manual.sale_price ? Number(manual.sale_price) : null,
    })
  }

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black text-cyan-700">Inventory Control</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">المخزون</h2>
          <p className="mt-2 text-sm text-slate-500">إدارة الزيوت والفلاتر والمواد: شراء، بيع، ربح، مورد وتنبيه الكمية.</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <button onClick={() => setMode('manual')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black ${mode === 'manual' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>
            <PackagePlus size={16} /> إضافة يدوي
          </button>
          <button onClick={() => setMode('receipt')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black ${mode === 'receipt' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>
            <ReceiptText size={16} /> إضافة وصل
          </button>
        </div>
      </div>

      <section className="surface mb-5 rounded-lg p-5">
        {mode === 'manual' ? (
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            <InventoryInput value={manual.oil_type} onChange={v => setManual({ ...manual, oil_type: v })} placeholder="المنتج *" />
            <InventoryInput value={manual.category} onChange={v => setManual({ ...manual, category: v })} placeholder="التصنيف" />
            <InventoryInput value={manual.supplier_name} onChange={v => setManual({ ...manual, supplier_name: v })} placeholder="المورد" />
            <InventoryInput value={manual.quantity} onChange={v => setManual({ ...manual, quantity: v })} placeholder="الكمية *" type="number" />
            <InventoryInput value={manual.unit_cost} onChange={v => setManual({ ...manual, unit_cost: v })} placeholder="شراء" type="number" />
            <InventoryInput value={manual.sale_price} onChange={v => setManual({ ...manual, sale_price: v })} placeholder="بيع" type="number" />
            <InventoryInput value={manual.min_threshold} onChange={v => setManual({ ...manual, min_threshold: v })} placeholder="التنبيه" type="number" />
            <button onClick={saveManual} disabled={!manual.oil_type || !manual.quantity || create.isPending}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50 md:col-span-4 xl:col-span-7">
              حفظ المنتج في المخزون
            </button>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="font-black text-slate-950">صورة الوصل</p>
              <input type="file" accept="image/*" capture="environment"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) setReceiptImage(URL.createObjectURL(file))
                }}
                className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm" />
              <div className="mt-4 aspect-[4/3] overflow-hidden rounded-lg bg-white">
                {receiptImage ? <img src={receiptImage} alt="وصل المواد" className="h-full w-full object-contain" /> : (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">التقط أو ارفع صورة الوصل</div>
                )}
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-500">إضافة الوصل هنا هي نفس المخزون، وبعد OCR لاحقاً سيمتلئ الجدول تلقائياً من الصورة.</p>
            </div>

            <div>
              <InventoryInput value={supplierName} onChange={setSupplierName} placeholder="اسم المورد للوصل" className="mb-3" />
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-[900px] w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>{['المنتج', 'التصنيف', 'الكمية', 'شراء', 'بيع', 'التنبيه', ''].map(h => <th key={h} className="px-3 py-3 font-black">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        {[
                          ['oil_type', 'text'],
                          ['category', 'text'],
                          ['quantity', 'number'],
                          ['unit_cost', 'number'],
                          ['sale_price', 'number'],
                          ['min_threshold', 'number'],
                        ].map(([key, type]) => (
                          <td key={key} className="px-2 py-2">
                            <InventoryInput type={type} value={line[key]} onChange={v => setLine(index, key, v)} />
                          </td>
                        ))}
                        <td className="px-2 py-2">
                          <button onClick={() => setLines(prev => prev.filter((_, i) => i !== index))}
                            className="rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setLines(prev => [...prev, { ...emptyLine }])}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700">
                  إضافة سطر
                </button>
                <button onClick={approveReceipt}
                  disabled={!lines.some(line => line.oil_type && line.quantity) || receipt.isPending}
                  className="rounded-lg bg-slate-950 px-6 py-3 text-sm font-black text-white disabled:opacity-50">
                  {receipt.isPending ? 'جاري الاعتماد...' : 'اعتماد الوصل وإضافة للمخزون'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="surface mb-5 rounded-lg p-4">
        <div className="mb-3 flex items-center gap-2 text-slate-950">
          <SlidersHorizontal size={18} />
          <h3 className="font-black">فلاتر المخزون</h3>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
              placeholder="بحث سريع عن المنتج أو المورد..."
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
          </div>
          <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400">
            <option value="all">كل التصنيفات</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.supplier} onChange={e => setFilters({ ...filters, supplier: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400">
            <option value="all">كل الموردين</option>
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <FilterToggle active={filters.lowStock} onClick={() => setFilters({ ...filters, lowStock: !filters.lowStock })} icon={AlertTriangle} label="ناقص مخزون" />
          <FilterToggle active={filters.topSelling} onClick={() => setFilters({ ...filters, topSelling: !filters.topSelling })} icon={ArrowDownUp} label="الأكثر مبيعاً" />
        </div>
      </section>

      <section className="surface overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {['المنتج', 'الكمية', 'شراء', 'بيع', 'الربح', 'التنبيه', 'المورد'].map(h => (
                  <th key={h} className="border-b border-slate-200 px-4 py-3 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const profit = Number(item.sale_price || 0) - Number(item.unit_cost || 0)
                return (
                  <tr key={item.id} className={`border-b border-slate-100 last:border-0 ${item.low_stock ? 'bg-rose-50/55' : 'bg-white'}`}>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">{item.oil_type}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.category || 'بدون تصنيف'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <input type="number" placeholder={money(item.quantity)}
                        value={qtyInputs[item.id] ?? ''}
                        onChange={e => setQtyInputs({ ...qtyInputs, [item.id]: e.target.value })}
                        onBlur={() => {
                          const val = qtyInputs[item.id]
                          if (val) update.mutate({ id: item.id, data: { quantity: Number(val) } }, {
                            onSuccess: () => setQtyInputs(prev => { const next = { ...prev }; delete next[item.id]; return next }),
                          })
                        }}
                        className="w-28 rounded-lg border border-slate-200 px-3 py-2 font-black outline-none focus:border-cyan-400" />
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{item.unit_cost ? `${money(item.unit_cost)} IQD` : '-'}</td>
                    <td className="px-4 py-4 font-bold text-slate-950">{item.sale_price ? `${money(item.sale_price)} IQD` : '-'}</td>
                    <td className={`px-4 py-4 font-black ${profit > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{profit > 0 ? `${money(profit)} IQD` : '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${item.low_stock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.low_stock ? `ناقص <= ${money(item.min_threshold)}` : `مستقر > ${money(item.min_threshold)}`}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-600">{item.supplier_name || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!filteredItems.length && (
          <div className="py-10 text-center text-sm font-bold text-slate-400">
            {isLoading ? 'جاري تحميل المخزون...' : 'لا توجد مواد مطابقة للفلاتر'}
          </div>
        )}
      </section>
    </Layout>
  )
}

function InventoryInput({ value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <input
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${className}`}
    />
  )
}

function FilterToggle({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-black transition ${
        active ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}
