import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Plus, Trash2, Eye, EyeOff, Upload, X } from 'lucide-react'
import { getPlatformAds, uploadPlatformAd, updatePlatformAd, deletePlatformAd } from '../../api/platform'
import Layout from '../../components/Layout'

export default function PlatformAds() {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['platform-ads'],
    queryFn: () => getPlatformAds().then(r => r.data),
  })

  const removeMutation = useMutation({
    mutationFn: (id) => deletePlatformAd(id),
    onSuccess: () => qc.invalidateQueries(['platform-ads']),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => updatePlatformAd(id, { is_active }),
    onSuccess: () => qc.invalidateQueries(['platform-ads']),
  })

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await uploadPlatformAd(fd)
      qc.invalidateQueries(['platform-ads'])
      setPreview(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل رفع الصورة')
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">إعلانات لوحة التحكم</h1>
            <p className="mt-1 text-sm text-slate-400">الصور تظهر في كاروسيل لوحة التحكم لجميع المراكز</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-500/25 disabled:opacity-60"
          >
            {uploading ? <><Upload size={16} className="animate-bounce" /> جاري الرفع...</> : <><Plus size={16} /> رفع صورة جديدة</>}
          </motion.button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-200">{error}</p>
        )}

        {/* Upload preview */}
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-800/60">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <Upload size={16} className="animate-spin text-cyan-300" />
                <span className="text-sm font-bold text-slate-200">جاري رفع الصورة...</span>
              </div>
              <img src={preview} alt="preview" className="h-48 w-full object-cover opacity-60" />
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-44 animate-pulse rounded-xl bg-slate-800" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 py-20 text-center">
            <Image size={48} className="mb-4 text-slate-600" />
            <p className="text-lg font-bold text-slate-400">لا توجد إعلانات بعد</p>
            <p className="mt-1 text-sm text-slate-500">ارفع صورة لتظهر في لوحة تحكم المراكز</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <AnimatePresence>
              {ads.map((ad) => (
                <motion.div key={ad.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative overflow-hidden rounded-xl border bg-slate-900 ${ad.is_active ? 'border-white/10' : 'border-white/5 opacity-50'}`}
                >
                  <img src={ad.url} alt={ad.title} className="h-44 w-full object-cover" />
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleMutation.mutate({ id: ad.id, is_active: !ad.is_active })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/90 text-slate-200 hover:bg-slate-700"
                        title={ad.is_active ? 'إخفاء' : 'إظهار'}
                      >
                        {ad.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => { if (confirm('حذف هذا الإعلان؟')) removeMutation.mutate(ad.id) }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/90 text-white hover:bg-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {ad.title && (
                      <p className="text-xs font-bold text-white">{ad.title}</p>
                    )}
                  </div>
                  {!ad.is_active && (
                    <div className="absolute left-2 top-2 rounded-md bg-slate-700/90 px-2 py-0.5 text-xs font-bold text-slate-300">مخفي</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  )
}
