import { Link } from 'react-router-dom'
import { ArrowUpRight, LockKeyhole } from 'lucide-react'
import { PLAN_DETAILS, nextPlan } from '../constants/plans'

export default function UpgradePrompt({ center, feature, requiredPlan = 'pro', benefits = [] }) {
  const targetPlan = nextPlan(center?.plan) || requiredPlan
  const plan = PLAN_DETAILS[targetPlan] || PLAN_DETAILS[requiredPlan]

  return (
    <LayoutShell>
      <div className="mx-auto max-w-3xl rounded-lg border border-cyan-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-cyan-300">
              <LockKeyhole size={22} />
            </div>
            <div>
              <p className="text-sm font-black text-cyan-700">ميزة ضمن خطة أعلى</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{feature}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                مركزك على الخطة الحالية، ويمكنك تفعيل هذه الميزة بالترقية إلى {plan?.name}.
              </p>
            </div>
          </div>
          <Link
            to="/center/settings?upgrade=1"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
          >
            ترقية الاشتراك
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(benefits.length ? benefits : plan?.features || []).slice(0, 3).map(item => (
            <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </LayoutShell>
  )
}

function LayoutShell({ children }) {
  return (
    <div className="py-8">
      {children}
    </div>
  )
}
