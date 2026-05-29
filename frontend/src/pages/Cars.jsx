import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Car, Check, MessageCircle, Pencil, PlusCircle, Search, Trash2, Wrench, X } from 'lucide-react'
import Layout from '../components/Layout'
import { getCars, createCar, updateCar, deleteCar } from '../api/cars'

const emptyForm = { plate_number: '', owner_name: '', phone: '', car_type: '' }

export default function Cars() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editCar, setEditCar] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['cars', search],
    queryFn: () => getCars(search).then(r => r.data),
  })

  const allCars = useQuery({
    queryKey: ['cars', ''],
    queryFn: () => getCars('').then(r => r.data),
  })
  const total = allCars.data?.length ?? cars.length
  const withPhone = allCars.data?.filter(c => c.phone)?.length ?? 0

  const createMutation = useMutation({
    mutationFn: createCar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      setShowForm(false)
      setForm(emptyForm)
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateCar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cars'] })
      setEditCar(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
    onError: (err) => alert(err.response?.data?.detail || 'تعذر الحذف'),
  })

  const openEdit = (car) => {
    setEditCar(car)
    setEditForm({ plate_number: car.plate_number, owner_name: car.owner_name || '', phone: car.phone || '', car_type: car.car_type || '' })
  }

  const confirmDelete = (car) => {
    if (window.confirm(`حذف السيارة ${car.plate_number}؟`)) deleteMutation.mutate(car.id)
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black text-cyan-700">سجل العملاء</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">سيارات العملاء</h2>
          <p className="mt-2 text-sm text-slate-500">سجّل كل سيارة خدمتها، وتابع بيانات صاحبها وتاريخها.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 shadow-lg">
          <PlusCircle size={16} /> سيارة جديدة
        </button>
      </div>

      {/* Stats */}
      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي السيارات" value={total} color="slate" icon={Car} />
        <StatCard label="عملاء واتساب" value={withPhone} color="emerald" icon={MessageCircle} />
        <StatCard label="نتائج البحث" value={search ? cars.length : total} color="cyan" icon={Search} />
      </section>

      {/* Add car form */}
      {showForm && (
        <div className="surface mb-5 rounded-xl p-5 border border-cyan-100 shadow-md">
          <h3 className="mb-4 font-black text-slate-950">إضافة سيارة جديدة</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['plate_number', 'رقم اللوحة *', 'text'],
              ['owner_name', 'اسم المالك', 'text'],
              ['phone', 'رقم الهاتف / واتساب', 'tel'],
              ['car_type', 'نوع السيارة', 'text'],
            ].map(([k, label, type]) => (
              <input key={k} type={type} placeholder={label} value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            ))}
          </div>
          {createMutation.isError && <p className="mt-2 text-xs font-bold text-rose-600">رقم اللوحة مسجل مسبقاً</p>}
          <div className="mt-4 flex gap-3">
            <button onClick={() => createMutation.mutate(form)} disabled={!form.plate_number || createMutation.isPending}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50 hover:bg-emerald-700 transition">
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ السيارة'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm) }}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <section className="surface mb-5 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث سريع برقم اللوحة أو اسم المالك أو رقم الهاتف..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
        </div>
      </section>

      {/* Table */}
      <section className="surface overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {['رقم اللوحة', 'نوع السيارة', 'المالك', 'الهاتف / واتساب', 'إجراءات'].map(h => (
                  <th key={h} className="border-b border-slate-200 px-4 py-3 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cars.map(c => (
                <tr key={c.id} className="border-b border-slate-100 bg-white last:border-0 hover:bg-slate-50 transition">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                        <Car size={16} />
                      </div>
                      <span className="font-mono text-base font-black text-slate-950">{c.plate_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`font-bold ${c.car_type ? 'text-slate-800' : 'text-slate-400'}`}>
                      {c.car_type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`font-bold ${c.owner_name ? 'text-slate-950' : 'text-slate-400'}`}>
                      {c.owner_name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {c.phone ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 tabular-nums">{c.phone}</span>
                        <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition">
                          <MessageCircle size={12} className="inline mr-0.5" /> WA
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate('/center/services/new')}
                        className="flex items-center gap-1.5 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800 transition hover:bg-cyan-100">
                        <Wrench size={13} /> خدمة
                      </button>
                      <button onClick={() => openEdit(c)}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 transition hover:bg-amber-100">
                        <Pencil size={13} /> تعديل
                      </button>
                      <button onClick={() => confirmDelete(c)} disabled={deleteMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">
                        <Trash2 size={13} /> حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && cars.length === 0 && (
          <div className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Car size={28} className="text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-500">{search ? 'لا توجد نتائج للبحث' : 'لا توجد سيارات مسجلة بعد'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)}
                className="mt-3 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800 transition">
                سجّل أول سيارة
              </button>
            )}
          </div>
        )}
        {isLoading && (
          <div className="py-10 text-center text-sm font-bold text-slate-400">جاري تحميل السيارات...</div>
        )}
      </section>

      {/* Edit modal */}
      {editCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <Car size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-950">تعديل السيارة</h3>
                  <p className="text-xs text-slate-500 font-mono">{editCar.plate_number}</p>
                </div>
              </div>
              <button onClick={() => setEditCar(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                ['plate_number', 'رقم اللوحة *', 'text'],
                ['car_type', 'نوع السيارة', 'text'],
                ['owner_name', 'اسم المالك', 'text'],
                ['phone', 'رقم الهاتف / واتساب', 'tel'],
              ].map(([k, label, type]) => (
                <div key={k}>
                  <label className="mb-1 block text-xs font-black text-slate-500">{label}</label>
                  <input type={type} value={editForm[k]}
                    onChange={e => setEditForm({ ...editForm, [k]: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => editMutation.mutate({ id: editCar.id, data: editForm })}
                disabled={!editForm.plate_number || editMutation.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50 transition">
                <Check size={15} /> {editMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button onClick={() => setEditCar(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function StatCard({ label, value, color, icon: Icon }) {
  const colors = {
    slate: 'bg-slate-950 text-white',
    emerald: 'bg-emerald-600 text-white',
    cyan: 'bg-cyan-500 text-white',
  }
  return (
    <div className={`rounded-xl p-4 shadow-md ${colors[color]}`}>
      <div className="mb-2 flex items-center gap-2 opacity-80">
        <Icon size={16} />
        <p className="text-xs font-bold">{label}</p>
      </div>
      <p className="text-2xl font-black">{value ?? '—'}</p>
    </div>
  )
}
