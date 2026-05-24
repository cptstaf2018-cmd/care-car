import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, Camera, CreditCard, MessageCircle, ShieldAlert, Sparkles } from 'lucide-react'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import { getTenants } from '../../api/tenants'

const planPrice = { basic: 50, pro: 100, enterprise: 200 }

export default function AdminOverview() {
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => getTenants().then(r => r.data),
  })
  const active = tenants.filter(t => t.is_active).length
  const suspended = tenants.length - active
  const connectedCameras = tenants.filter(t => t.ip_camera_url).length
  const connectedWhatsapp = tenants.filter(t => t.whatsapp_number).length
  const mrr = tenants.filter(t => t.is_active).reduce((sum, t) => sum + (planPrice[t.plan] || 0), 0)

  return (
    <Layout>
      <section className="mb-5 overflow-hidden rounded-lg border border-slate-900 bg-slate-950 text-white shadow-2xl">
        <div className="grid gap-5 p-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="text-xs font-black uppercase text-cyan-300">Super Admin SaaS Command</p>
            <h2 className="mt-2 text-3xl font-black">منصة إدارة اشتراكات مراكز الزيت</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              لوحة منفصلة تماماً عن تشغيل المركز، لمراقبة الإيراد الشهري، صحة الاشتراكات، والمراكز الموقوفة.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-slate-300">MRR</p>
              <p className="mt-1 text-3xl font-black">${mrr.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-slate-300">Active Centers</p>
              <p className="mt-1 text-3xl font-black">{active}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Building2} label="مراكز نشطة" value={active} color="blue" trend={`${tenants.length} إجمالي`} loading={isLoading} />
        <StatCard icon={CreditCard} label="الاشتراكات" value={`$${mrr}`} color="green" trend="MRR" loading={isLoading} />
        <StatCard icon={MessageCircle} label="واتساب مفعل" value={connectedWhatsapp} color="purple" trend={`من ${tenants.length}`} loading={isLoading} />
        <StatCard icon={Camera} label="كاميرا مفعلة" value={connectedCameras} color="orange" trend={`من ${tenants.length}`} loading={isLoading} />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="premium-card overflow-hidden rounded-lg">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-black text-slate-950">حالة الشركات المشتركة</h3>
            <p className="mt-1 text-xs text-slate-500">مراقبة إدارية منفصلة عن لوحة تشغيل المركز</p>
          </div>
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>{['المركز', 'الخطة', 'الاشتراك', 'WhatsApp', 'الكاميرا', 'الحالة'].map(h => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-t border-slate-100 text-sm hover:bg-slate-50">
                  <td className="px-5 py-4"><p className="font-black text-slate-950">{t.name}</p><p className="text-xs text-slate-500">{t.contact_phone || 'لا يوجد هاتف'}</p></td>
                  <td className="px-5 py-4"><Badge text={t.plan} tone="slate" /></td>
                  <td className="px-5 py-4">{t.subscription_ends_at || 'غير محدد'}</td>
                  <td className="px-5 py-4"><Badge text={t.whatsapp_number ? 'مفعل' : 'غير مفعل'} tone={t.whatsapp_number ? 'green' : 'slate'} /></td>
                  <td className="px-5 py-4"><Badge text={t.ip_camera_url ? 'مفعلة' : 'غير مفعلة'} tone={t.ip_camera_url ? 'green' : 'slate'} /></td>
                  <td className="px-5 py-4"><Badge text={t.is_active ? 'نشط' : 'موقوف'} tone={t.is_active ? 'green' : 'red'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tenants.length && <p className="py-10 text-center text-sm font-semibold text-slate-400">لا توجد مراكز بعد</p>}
        </div>

        <div className="grid gap-4">
          <AdminPanel title="ملخص المنصة" icon={Sparkles}>
            <Alert text={`${connectedWhatsapp}/${tenants.length} مراكز مربوطة بواتساب`} />
            <Alert text={`${connectedCameras}/${tenants.length} مراكز جهزت الكاميرا`} />
            <Alert text={suspended ? `${suspended} مراكز موقوفة بسبب الاشتراك` : 'لا توجد مراكز موقوفة'} />
          </AdminPanel>
          <div className="premium-card rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white"><ShieldAlert size={17} /></div>
              <h3 className="font-black text-slate-950">توزيع الخطط</h3>
            </div>
            <div className="space-y-2">
              {['basic', 'pro', 'enterprise'].map(plan => {
                const count = tenants.filter(t => t.plan === plan).length
                return (
                  <div key={plan} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm font-bold text-slate-700 capitalize">{plan}</span>
                    <span className="text-sm font-black text-slate-950">{count} مركز</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

function Badge({ text, tone }) {
  const tones = {
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>{text}</span>
}

function AdminPanel({ title, icon: Icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="premium-card rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white"><Icon size={17} /></div>
        <h3 className="font-black text-slate-950">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </motion.div>
  )
}

function Alert({ text }) {
  return <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-800">{text}</div>
}
