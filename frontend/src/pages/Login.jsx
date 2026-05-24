import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await login(email, password)
      setAuth(res.data.access_token, { email, role: res.data.role, tenant_id: res.data.tenant_id })
      navigate(res.data.role === 'superadmin' ? '/admin' : '/')
    } catch (err) {
      if (err.response?.status === 401) {
        setError('بيانات الدخول غير صحيحة')
      } else {
        setError('خطأ في الاتصال، حاول مجددًا')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🛢️</div>
          <h1 className="text-2xl font-bold text-white">نظام تبديل الزيت</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="البريد الإلكتروني" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" placeholder="كلمة المرور" value={password}
            onChange={e => setPassword(e.target.value)} required
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">
            دخول
          </button>
        </form>
      </div>
    </div>
  )
}
