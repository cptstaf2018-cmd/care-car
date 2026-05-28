import { useState } from 'react'
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
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['cars', search],
    queryFn: () => getCars(search).then(r => r.data),
  })

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
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cars'] }),
    onError: (err) => alert(err.response?.data?.detail || 'تعذر الحذف'),
  })

  const startEdit = (car) => {
    setEditingId(car.id)
    setEditForm({ plate_number: car.plate_number, owner_name: car.owner_name || '', phone: car.phone || '', car_type: car.car_type || '' })
  }

  const confirmDelete = (car) => {
    if (window.confirm(`حذف السيارة ${car.plate_number}؟`)) {
      deleteMutation.mutate(car.id)
    }
  }

  return (
    <Layout>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-cyan-700">سجل العملاء</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">سيارات العملاء</h2>
          <p className="mt-2 text-sm text-slate-500">سجل كل سيارة خدمتها، تاريخها، وبيانات صاحبها للمتابعة والتذكير.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
          <PlusCircle size={16} /> سيارة جديدة
        </button>
      </div>

      {showForm && (
        <div className="surface mb-5 rounded-lg p-5">
          <h3 className="mb-4 font-black text-slate-950">إضافة سيارة جديدة</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[['plate_number', 'رقم اللوحة *'], ['owner_name', 'اسم المالك'], ['phone', 'رقم الهاتف / واتساب'], ['car_type', 'نوع السيارة']].map(([k, label]) => (
              <input key={k} placeholder={label} value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
            ))}
          </div>
          {createMutation.isError && <p className="mt-2 text-xs font-bold text-rose-600">رقم اللوحة مسجل مسبقاً</p>}
          <div className="mt-4 flex gap-3">
            <button onClick={() => createMutation.mutate(form)} disabled={!form.plate_number || createMutation.isPending}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50 hover:bg-emerald-700">
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ السيارة'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="surface mb-4 flex items-center gap-3 rounded-lg px-4">
        <Search size={17} className="shrink-0 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث برقم اللوحة أو اسم المالك..."
          className="w-full bg-transparent py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400" />
      </div>

      <div className="surface overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {['رقم اللوحة', 'النوع', 'المالك', 'الهاتف', 'إجراءات'].map(h => (
                  <th key={h} className="border-b border-slate-200 px-4 py-3 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cars.map(c => (
                editingId === c.id ? (
                  <tr key={c.id} className="border-b border-cyan-100 bg-cyan-50/50">
                    <td className="px-3 py-3">
                      <input value={editForm.plate_number} onChange={e => setEditForm({ ...editForm, plate_number: e.target.value })}
                        className="w-full rounded-lg border border-cyan-300 bg-white px-3 py-2 font-mono font-black text-slate-950 outline-none focus:ring-2 focus:ring-cyan-200" />
                    </td>
                    <td className="px-3 py-3">
                      <input value={editForm.car_type} onChange={e => setEditForm({ ...editForm, car_type: e.target.value })}
                        placeholder="نوع السيارة"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:border-cyan-400" />
                    </td>
                    <td className="px-3 py-3">
                      <input value={editForm.owner_name} onChange={e => setEditForm({ ...editForm, owner_name: e.target.value })}
                        placeholder="اسم المالك"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:border-cyan-400" />
                    </td>
                    <td className="px-3 py-3">
                      <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="الهاتف"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:border-cyan-400" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editMutation.mutate({ id: c.id, data: editForm })}
                          disabled={!editForm.plate_number || editMutation.isPending}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50 hover:bg-emerald-700">
                          <Check size={13} /> حفظ
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <X size={13} /> إلغاء
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Car size={15} className="shrink-0 text-cyan-600" />
                        <span className="font-mono text-base font-black text-slate-950">{c.plate_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{c.car_type || <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-4 font-bold text-slate-950">{c.owner_name || <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-4 font-bold text-slate-700 tabular-nums">{c.phone || <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/center/services/new', { state: { car: c } })}
                          className="flex items-center gap-1.5 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800 transition hover:bg-cyan-100">
                          <Wrench size={13} /> خدمة
                        </button>
                        {c.phone && (
                          <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100">
                            <MessageCircle size={13} /> واتساب
                          </a>
                        )}
                        <button onClick={() => startEdit(c)}
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
                )
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && cars.length === 0 && (
          <div className="py-12 text-center">
            <Car size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-400">{search ? 'لا توجد نتائج للبحث' : 'لا توجد سيارات مسجلة بعد'}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
