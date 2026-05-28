import client from './client'
export const login = (email, password) => client.post('/auth/login', { email, password })
export const getMe = () => client.get('/auth/me')
export const activate = (email, code, new_password) => client.post('/auth/activate', { email, code, new_password })
export const register = (data) => client.post('/auth/register', data)
