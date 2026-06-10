import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowDownUp, Check, PackagePlus, Pencil, ReceiptText, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import Layout from '../components/Layout'
import UpgradePrompt from '../components/UpgradePrompt'
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, addInventoryReceipt } from '../api/inventory'
import { getCenterSettings } from '../api/settings'
import { parseReceipt } from '../api/vision'
import { hasPlanFeature } from '../constants/plans'
import { DEFAULT_CENTER_SPECIALTY } from '../constants/centerSpecialties'
import { getStoreCategories } from '../constants/inventoryCategories'

const emptyLine = {
  oil_type: '',
  category: '',
  product_category: '',
  sku: '',
  barcode: '',
  quantity: '',
  unit_cost: '',
  sale_price: '',
  min_threshold: '10',
}

const initialManual = {
  oil_type: '',
  category: '',
  product_category: '',
  sku: '',
  barcode: '',
  supplier_name: '',
  quantity: '',
  min_threshold: '10',
  unit_cost: '',
  sale_price: '',
}

const money = value => Number(value || 0).toLocaleString()

// Downscales large receipt photos so they upload reliably and OCR stays fast,
// regardless of how big the original camera photo is.
const RECEIPT_MAX_DIMENSION = 1800
const resizeReceiptImage = (file) => new Promise((resolve) => {
  const img = new Image()
  img.onload = () => {
    const scale = Math.min(1, RECEIPT_MAX_DIMENSION / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(img.src)
      resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file)
    }, 'image/jpeg', 0.85)
  }
  img.onerror = () => resolve(file)
  img.src = URL.createObjectURL(file)
})
const PRESET_MATERIALS_BY_SPECIALTY = {
  ac: {
    gas_freon: ['غاز R134a', 'غاز R1234yf', 'زيت كومبروسر PAG', 'صبغة كشف تسريب'],
    compressors: ['كومبروسر دينسو', 'كومبروسر سانون', 'طقم بكرة كومبروسر'],
    ac_filters: ['فلتر مكيف عادي', 'فلتر مكيف كاربون'],
    hoses_pipes: ['خرطوم ضغط عالي', 'خرطوم ضغط واطي', 'أورنك (O-ring)'],
    fans: ['مروحة مكثف', 'مروحة رديتر', 'مقاومة مروحة'],
    accessories: ['شريط عازل', 'كوبلنج تعبئة', 'صمام تمدد'],
  },
  tires: {
    tires: ['إطار 175/65R14', 'إطار 185/65R15', 'إطار 195/65R15', 'إطار 205/55R16'],
    valves: ['بلف إطار عادي', 'بلف إطار TPMS'],
    balance_weights: ['وزن ترصيص لاصق', 'وزن ترصيص حلقي'],
    nitrogen: ['أسطوانة نيتروجين'],
    accessories: ['صامولة عجلة', 'غطاء فالف', 'مفتاح عجلة'],
  },
  wash: {
    wash_supplies: ['شامبو غسيل سيارات', 'منظف تابلوه', 'منظف مقاعد جلد'],
    wax_polish: ['شمع كارنوبا', 'بولش خشن', 'بولش نهائي'],
    nano_ceramic: ['طلاء نانو سيراميك', 'رشاش نانو سريع'],
    fresheners: ['معطر سيارات', 'معقم مقصورة', 'بخاخ مضاد بكتيريا'],
    accessories: ['مناشف مايكروفايبر', 'فرشاة تنظيف جنوط'],
  },
  electrical: {
    batteries: ['بطارية 60 أمبير', 'بطارية 70 أمبير', 'بطارية 100 أمبير'],
    sensors: ['حساس أوكسجين', 'حساس ABS', 'حساس حرارة'],
    fuses_wires: ['طقم فيوزات', 'سلك بطارية', 'كبل وصلة'],
    lighting: ['لمبة هالوجين H4', 'لمبة LED', 'بروجكتر أمامي'],
    alternators_starters: ['دينمو شحن', 'سلف تشغيل', 'طقم فرش دينمو'],
    accessories: ['ريموت قفل مركزي', 'مفتاح تماس'],
  },
  mechanic: {
    brakes: ['تيل فرامل أمامي', 'تيل فرامل خلفي', 'ديسك فرامل'],
    suspension: ['جمب أمامي', 'جمب خلفي', 'مقص تعليق'],
    belts_pumps: ['سير دينمو', 'سير كاتينة', 'مضخة ماء'],
    cooling_radiators: ['رديتر مياه', 'مروحة رديتر', 'ماء رديتر'],
    oils_filters: ['زيت محرك 5W30', 'فلتر زيت', 'فلتر هواء'],
    accessories: ['شمعات احتراق', 'سير كمبروسر'],
  },
  body_paint: {
    paint_materials: ['صبغ بيكو', 'كلير لامع', 'مادة تصلب'],
    putty_bodywork: ['معجون بولي', 'ورق سنفرة', 'صاج تقويم'],
    polishing: ['بولش خشن', 'بولش نهائي', 'قطعة بافر'],
    paint_protection: ['حماية PPF', 'شمع حماية', 'سيراميك طلاء'],
    accessories: ['شريط ماسكينج', 'بنطر بلاستيك'],
  },
}

export default function Inventory() {
  const qc = useQueryClient()
  const { data: center } = useQuery({
    queryKey: ['center-settings', 'inventory-gate'],
    queryFn: () => getCenterSettings().then(r => r.data),
  })
  const receiptEnabled = hasPlanFeature(center?.plan, 'inventory_receipt')
  const centerSpecialty = center?.specialty || DEFAULT_CENTER_SPECIALTY
  const storeCategories = getStoreCategories(centerSpecialty)
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory().then(r => r.data),
    enabled: hasPlanFeature(center?.plan, 'inventory'),
  })

  const [mode, setMode] = useState('manual')
  const [qtyInputs, setQtyInputs] = useState({})
  const [costInputs, setCostInputs] = useState({})
  const [saleInputs, setSaleInputs] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [manual, setManual] = useState(initialManual)
  const presetMaterials = PRESET_MATERIALS_BY_SPECIALTY[centerSpecialty]?.[manual.product_category] || []
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptImage, setReceiptImage] = useState(null)
  const [receiptMessage, setReceiptMessage] = useState('')
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
      setReceiptFile(null)
      setReceiptImage(null)
      setReceiptMessage('')
    },
  })
  const readReceipt = useMutation({
    mutationFn: parseReceipt,
    onMutate: () => setReceiptMessage('جاري قراءة الوصل...'),
    onSuccess: (res) => {
      const items = res.data?.items || []
      if (!items.length) {
        setReceiptMessage('لم نتمكن من قراءة مواد من الصورة. يمكنك تعبئة الجدول يدوياً.')
        return
      }
      setLines(items.map(item => ({
        oil_type: item.oil_type || item.name || '',
        category: item.category || '',
        quantity: item.quantity ? String(item.quantity) : '1',
        unit_cost: item.unit_cost ?? item.price ?? '',
        sale_price: item.sale_price ?? '',
        min_threshold: '10',
      })))
      setReceiptMessage(`تمت قراءة ${items.length} مادة من الوصل. راجع الأرقام ثم اعتمد الإضافة.`)
    },
    onError: () => setReceiptMessage('تعذرت قراءة الوصل. يمكنك تعبئة الجدول يدوياً.'),
  })
  const deleteItem = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
    onError: () => alert('تعذر حذف المادة'),
  })
  const editItem = useMutation({
    mutationFn: ({ id, data }) => updateInventoryItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      setEditingId(null)
    },
  })

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({ oil_type: item.oil_type, category: item.category || '', product_category: item.product_category || '', sku: item.sku || '', barcode: item.barcode || '', supplier_name: item.supplier_name || '' })
  }

  const confirmDelete = (item) => {
    if (window.confirm(`حذف "${item.oil_type}" من المخزون؟`)) deleteItem.mutate(item.id)
  }

  const categories = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))], [items])
  const suppliers = useMemo(() => [...new Set(items.map(i => i.supplier_name).filter(Boolean))], [items])

  const filteredItems = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    const data = items.filter(item => {
      const matchesSearch = !q || [item.oil_type, item.category, item.product_category, item.sku, item.barcode, item.supplier_name].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
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

  if (center && !hasPlanFeature(center.plan, 'inventory')) {
    return (
      <Layout>
        <UpgradePrompt
          center={center}
          feature="إدارة المخزون وقراءة وصولات الشراء"
          requiredPlan="pro"
          benefits={['إضافة مواد للمخزون', 'خصم تلقائي عند الفاتورة', 'تنبيهات نقص المواد']}
        />
      </Layout>
    )
  }

  const setLine = (index, key, value) => {
    setLines(prev => prev.map((line, i) => i === index ? { ...line, [key]: value } : line))
  }

  const approveReceipt = () => {
    const cleanLines = lines
      .filter(line => line.oil_type && line.quantity)
      .map(line => ({
        oil_type: line.oil_type,
        category: line.category || null,
        product_category: line.product_category || null,
        sku: line.sku || null,
        barcode: line.barcode || null,
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
      product_category: manual.product_category || null,
      sku: manual.sku || null,
      barcode: manual.barcode || null,
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
          <p className="text-sm font-black text-cyan-700">إدارة المخزون</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">المخزون</h2>
          <p className="mt-2 text-sm text-slate-500">مواد الخدمة، الزيوت، الفلاتر، وقطع الغيار — تحكم بالكميات والأسعار وتنبيهات النقص.</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <button onClick={() => setMode('manual')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black ${mode === 'manual' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>
            <PackagePlus size={16} /> إضافة يدوي
          </button>
          <button onClick={() => setMode('receipt')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black ${mode === 'receipt' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>
            <ReceiptText size={16} /> وصل شراء {!receiptEnabled && <span className="text-[10px] opacity-70">متوسطة</span>}
          </button>
        </div>
      </div>

      <section className="surface mb-5 rounded-lg p-5">
        {mode === 'manual' ? (
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            <InventoryInput value={manual.oil_type} onChange={v => setManual({ ...manual, oil_type: v })} placeholder="المنتج *" />
            <select value={manual.product_category} onChange={e => setManual({ ...manual, product_category: e.target.value })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400">
              <option value="">قسم المتجر</option>
              {storeCategories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <InventoryInput value={manual.sku} onChange={v => setManual({ ...manual, sku: v })} placeholder="SKU" />
            <InventoryInput value={manual.barcode} onChange={v => setManual({ ...manual, barcode: v })} placeholder="باركود" />
            <InventoryInput value={manual.category} onChange={v => setManual({ ...manual, category: v })} placeholder="تصنيف نصي" />
            <InventoryInput value={manual.supplier_name} onChange={v => setManual({ ...manual, supplier_name: v })} placeholder="المورد" />
            <InventoryInput value={manual.quantity} onChange={v => setManual({ ...manual, quantity: v })} placeholder="الكمية *" type="number" />
            <InventoryInput value={manual.unit_cost} onChange={v => setManual({ ...manual, unit_cost: v })} placeholder="شراء" type="number" />
            <InventoryInput value={manual.sale_price} onChange={v => setManual({ ...manual, sale_price: v })} placeholder="بيع" type="number" />
            <InventoryInput value={manual.min_threshold} onChange={v => setManual({ ...manual, min_threshold: v })} placeholder="التنبيه" type="number" />
            {presetMaterials.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 md:col-span-4 xl:col-span-8">
                <span className="text-xs font-bold text-slate-500">مواد جاهزة:</span>
                {presetMaterials.map(name => (
                  <button key={name} type="button" onClick={() => setManual({ ...manual, oil_type: name })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${manual.oil_type === name ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300'}`}>
                    {name}
                  </button>
                ))}
                <button type="button" onClick={() => setManual({ ...manual, oil_type: '' })}
                  className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 hover:border-cyan-300">
                  مادة أخرى ✏️
                </button>
              </div>
            )}
            <button onClick={saveManual} disabled={!manual.oil_type || !manual.quantity || create.isPending}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50 md:col-span-4 xl:col-span-8">
              حفظ المنتج في المخزون
            </button>
          </div>
        ) : !receiptEnabled ? (
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-cyan-300">
              <ReceiptText size={22} />
            </div>
            <h3 className="text-xl font-black text-slate-950">قراءة وصل الشراء ضمن الخطة المتوسطة</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
              المخزون اليدوي متاح في الأساسية. قراءة الوصل بالصورة، تعبئة المواد تلقائياً، وتنبيهات المخزون الذكية تحتاج ترقية.
            </p>
            <a href="/center/settings?upgrade=1" className="mt-4 inline-flex rounded-lg bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300">
              طلب ترقية الاشتراك
            </a>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="font-black text-slate-950">صورة الوصل</p>
              <input type="file" accept="image/*" capture="environment"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setReceiptMessage('جاري تجهيز الصورة...')
                    const resized = await resizeReceiptImage(file)
                    setReceiptFile(resized)
                    setReceiptImage(URL.createObjectURL(resized))
                    setReceiptMessage('تم اختيار الصورة. اضغط قراءة الوصل لتعبئة الجدول.')
                  }
                }}
                className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm" />
              <button
                onClick={() => receiptFile && readReceipt.mutate(receiptFile)}
                disabled={!receiptFile || readReceipt.isPending}
                className="mt-3 w-full rounded-lg bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800 disabled:opacity-50"
              >
                {readReceipt.isPending ? 'جاري قراءة الوصل...' : 'قراءة الوصل'}
              </button>
              <div className="mt-4 aspect-[4/3] overflow-hidden rounded-lg bg-white">
                {receiptImage ? <img src={receiptImage} alt="وصل المواد" className="h-full w-full object-contain" /> : (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">التقط أو ارفع صورة الوصل</div>
                )}
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                {receiptMessage || 'ارفع صورة واضحة للوصل وسيتم تعبئة الجدول تلقائياً للمراجعة قبل الإضافة.'}
              </p>
            </div>

            <div>
              <InventoryInput value={supplierName} onChange={setSupplierName} placeholder="اسم المورد للوصل" className="mb-3" />
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-[900px] w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>{['المنتج', 'قسم المتجر', 'SKU', 'باركود', 'التصنيف', 'الكمية', 'شراء', 'بيع', 'التنبيه', ''].map(h => <th key={h} className="px-3 py-3 font-black">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        {[
                          ['oil_type', 'text'],
                          ['product_category', 'select'],
                          ['sku', 'text'],
                          ['barcode', 'text'],
                          ['category', 'text'],
                          ['quantity', 'number'],
                          ['unit_cost', 'number'],
                          ['sale_price', 'number'],
                          ['min_threshold', 'number'],
                        ].map(([key, type]) => (
                          <td key={key} className="px-2 py-2">
                            {type === 'select' ? (
                              <select value={line[key]} onChange={e => setLine(index, key, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                                <option value="">قسم</option>
                                {storeCategories.map(([catKey, label]) => <option key={catKey} value={catKey}>{label}</option>)}
                              </select>
                            ) : <InventoryInput type={type} value={line[key]} onChange={v => setLine(index, key, v)} />}
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
          <table className="min-w-[1100px] w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {['المنتج', 'SKU/باركود', 'الكمية', 'شراء', 'بيع', 'الربح', 'التنبيه', 'المورد', ''].map(h => (
                  <th key={h} className="border-b border-slate-200 px-4 py-3 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const profit = Number(item.sale_price || 0) - Number(item.unit_cost || 0)
                const isEditing = editingId === item.id
                return (
                  <tr key={item.id} className={`border-b border-slate-100 last:border-0 ${isEditing ? 'bg-amber-50/60' : item.low_stock ? 'bg-rose-50/55' : 'bg-white'}`}>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input value={editForm.oil_type} onChange={e => setEditForm({ ...editForm, oil_type: e.target.value })}
                            placeholder="اسم المنتج"
                            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 font-black text-slate-950 outline-none focus:ring-2 focus:ring-amber-200" />
                          <input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                            placeholder="التصنيف"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-300" />
                          <select value={editForm.product_category} onChange={e => setEditForm({ ...editForm, product_category: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-300">
                            <option value="">قسم المتجر</option>
                            {storeCategories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                          </select>
                        </div>
                      ) : (
                        <>
                          <p className="font-black text-slate-950">{item.oil_type}</p>
                          <p className="mt-1 text-xs text-slate-500">{storeCategories.find(([key]) => key === item.product_category)?.[1] || item.category || 'بدون تصنيف'}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })}
                            placeholder="SKU"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-300" />
                          <input value={editForm.barcode} onChange={e => setEditForm({ ...editForm, barcode: e.target.value })}
                            placeholder="باركود"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-300" />
                        </div>
                      ) : (
                        <div>
                          <p className="font-mono text-xs font-black text-slate-700">{item.sku || '-'}</p>
                          <p className="mt-1 font-mono text-xs text-slate-400">{item.barcode || ''}</p>
                        </div>
                      )}
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
                        className="w-24 rounded-lg border border-slate-200 px-3 py-2 font-black outline-none focus:border-cyan-400" />
                    </td>
                    <td className="px-4 py-4">
                      <input type="number" placeholder={item.unit_cost ? money(item.unit_cost) : '—'}
                        value={costInputs[item.id] ?? ''}
                        onChange={e => setCostInputs({ ...costInputs, [item.id]: e.target.value })}
                        onBlur={() => {
                          const val = costInputs[item.id]
                          if (val !== undefined && val !== '') update.mutate({ id: item.id, data: { unit_cost: Number(val) } }, {
                            onSuccess: () => setCostInputs(prev => { const next = { ...prev }; delete next[item.id]; return next }),
                          })
                        }}
                        className="w-24 rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-700 outline-none focus:border-cyan-400" />
                    </td>
                    <td className="px-4 py-4">
                      <input type="number" placeholder={item.sale_price ? money(item.sale_price) : '—'}
                        value={saleInputs[item.id] ?? ''}
                        onChange={e => setSaleInputs({ ...saleInputs, [item.id]: e.target.value })}
                        onBlur={() => {
                          const val = saleInputs[item.id]
                          if (val !== undefined && val !== '') update.mutate({ id: item.id, data: { sale_price: Number(val) } }, {
                            onSuccess: () => setSaleInputs(prev => { const next = { ...prev }; delete next[item.id]; return next }),
                          })
                        }}
                        className="w-24 rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-950 outline-none focus:border-cyan-400" />
                    </td>
                    <td className={`px-4 py-4 font-black ${profit > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{profit > 0 ? `${money(profit)} IQD` : '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${item.low_stock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.low_stock ? `ناقص <= ${money(item.min_threshold)}` : `مستقر > ${money(item.min_threshold)}`}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <input value={editForm.supplier_name} onChange={e => setEditForm({ ...editForm, supplier_name: e.target.value })}
                          placeholder="المورد"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-300" />
                      ) : (
                        <span className="font-bold text-slate-600">{item.supplier_name || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button onClick={() => editItem.mutate({ id: item.id, data: editForm })}
                            disabled={!editForm.oil_type || editItem.isPending}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50 hover:bg-emerald-700">
                            <Check size={12} /> حفظ
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            <X size={12} /> إلغاء
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(item)}
                            className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100">
                            <Pencil size={12} /> تعديل
                          </button>
                          <button onClick={() => confirmDelete(item)} disabled={deleteItem.isPending}
                            className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                            <Trash2 size={12} /> حذف
                          </button>
                        </div>
                      )}
                    </td>
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
