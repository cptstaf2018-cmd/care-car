import client from './client'

const phoneLike = (value) => /^[+\d][\d\s-]{6,}$/.test(value.trim())
const loginIdentifier = (value) => {
  const trimmed = value.trim()
  if (!trimmed.includes('@') && phoneLike(trimmed)) {
    return `${trimmed.replace(/[\s-]/g, '')}@carecar.app`
  }
  return trimmed
}

export const login = (email, password) => client.post('/auth/login', { email: loginIdentifier(email), password })
export const getMe = () => client.get('/auth/me')
export const activate = (email, code, new_password) => client.post('/auth/activate', { email, code, new_password })
export const register = (data) => client.post('/auth/register', data)
