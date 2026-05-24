const colorMap = {
  blue: 'from-blue-600 to-blue-800 border-blue-500',
  green: 'from-green-600 to-green-800 border-green-500',
  orange: 'from-orange-500 to-orange-700 border-orange-400',
  red: 'from-red-600 to-red-800 border-red-500',
  purple: 'from-purple-600 to-purple-800 border-purple-500',
}

export default function StatCard({ label, value, icon, color = 'blue' }) {
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-6 shadow-lg`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
      <div className="text-sm opacity-80 text-white mt-1">{label}</div>
    </div>
  )
}
