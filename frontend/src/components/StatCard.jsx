import { motion } from 'framer-motion'

const colorMap = {
  blue: 'from-cyan-500 to-blue-600 text-cyan-700 bg-cyan-50',
  green: 'from-emerald-500 to-teal-600 text-emerald-700 bg-emerald-50',
  orange: 'from-amber-500 to-orange-600 text-amber-700 bg-amber-50',
  red: 'from-rose-500 to-red-600 text-rose-700 bg-rose-50',
  purple: 'from-violet-500 to-indigo-600 text-violet-700 bg-violet-50',
  slate: 'from-slate-700 to-slate-950 text-slate-700 bg-slate-50',
}

export default function StatCard({ label, value, icon: Icon, color = 'blue', trend, helper, loading }) {
  const colors = colorMap[color] || colorMap.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22 }}
      className="premium-card rounded-lg p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          {loading ? (
            <div className="skeleton mt-3 h-8 w-28 rounded-md" />
          ) : (
            <div className="mt-2 truncate text-2xl font-black text-slate-950">{value ?? '—'}</div>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${colors.split(' ')[0]} ${colors.split(' ')[1]} text-white shadow-lg`}>
          {typeof Icon === 'string' ? <span className="text-xs font-black">{Icon}</span> : <Icon size={20} strokeWidth={2.4} />}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors.split(' ').slice(2).join(' ')}`}>
          {trend || 'مستقر'}
        </span>
        {helper && <span className="truncate text-xs text-slate-500">{helper}</span>}
      </div>
    </motion.div>
  )
}
