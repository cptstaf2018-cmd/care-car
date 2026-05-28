import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { getTenants, updateTenant } from '../../api/tenants'
import { PLAN_DETAILS, PLAN_ORDER, planName } from '../../constants/plans'

const planPrice = {
  basic: `${PLAN_DETAILS.basic.adminPrice}$ / شهر`,
  pro: `${PLAN_DETAILS.pro.adminPrice}$ / شهر`,
  enterprise: `${PLAN_DETAILS.enterprise.adminPrice}$ / شهر`,
}

function remainingDays(date) {
  if (!date) return null
  const end = new Date(date)
  const today = new Date()
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

export default function Subscriptions() {
  const qc = useQueryClient()
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => getTenants().then(r => r.data),
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => updateTenant(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  return (
    <Layout>
      <div className="mb-6">
        <p className="text-sm font-semibold text-cyan-700">care-car-saas</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">اشتراكات المراكز</h2>
        <p className="mt-2 text-sm text-slate-500">هذه الصفحة للسوبر أدمن فقط. هنا تظهر كل المراكز المشتركة، ويمكن تفعيل أو قفل حساب المركز عند عدم الدفع.</p>
      </div>

      <div className="grid gap-4">
        {[...tenants].sort((a, b) => Number(a.is_active) - Number(b.is_active) || a.name.localeCompare(b.name, 'ar')).map(t => {
          const days = remainingDays(t.subscription_ends_at)
          const expired = days !== null && days < 0
          return (
            <article key={t.id} className="surface rounded-lg p-5">
              <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-center">
                <div>
                  <p className="text-lg font-black text-slate-950">{t.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{t.contact_phone || 'لا يوجد هاتف'} · {planPrice[t.plan] || t.plan}</p>
                </div>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-500">الخطة</span>
                  <select value={t.plan} onChange={e => update.mutate({ id: t.id, data: { plan: e.target.value } })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-cyan-400">
                    {PLAN_ORDER.map(plan => <option key={plan} value={plan}>{planName(plan)}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-500">ينتهي في</span>
                  <input type="date" value={t.subscription_ends_at || ''}
                    onChange={e => update.mutate({ id: t.id, data: { subscription_ends_at: e.target.value || null } })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-cyan-400" />
                </label>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${!t.is_active ? 'bg-rose-100 text-rose-700' : expired ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {!t.is_active ? 'مقفول' : expired ? 'منتهي' : days === null ? 'بدون تاريخ' : `باقي ${days} يوم`}
                  </span>
                  <button onClick={() => update.mutate({ id: t.id, data: { is_active: !t.is_active } })}
                    className={`rounded-lg px-4 py-2 text-sm font-bold ${t.is_active ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {t.is_active ? 'قفل الحساب' : 'تفعيل الحساب'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
        {tenants.length === 0 && <p className="surface rounded-lg py-10 text-center text-sm text-slate-500">لا توجد مراكز مشتركة</p>}
      </div>
    </Layout>
  )
}
