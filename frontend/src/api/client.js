import axios from 'axios'
import { useAuthStore } from '../store/auth'

const client = axios.create({ baseURL: '' })

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (r) => r,
  (err) => {
    const suspended = err.response?.status === 403 && err.response?.data?.detail === 'Account suspended'
    const wrongAdminSession = err.response?.status === 403 && err.response?.data?.detail === 'Superadmin only'
    if (err.response?.status === 401 || suspended || wrongAdminSession) useAuthStore.getState().logout()
    return Promise.reject(err)
  }
)

export default client
