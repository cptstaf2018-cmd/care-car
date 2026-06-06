import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-amber-500 py-1.5 text-center text-sm font-bold text-white shadow-md" dir="rtl">
      ⚠️ أنت غير متصل بالإنترنت — تُعرض آخر البيانات المحفوظة
    </div>
  )
}
