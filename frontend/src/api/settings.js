import client from './client'

export const getCenterSettings = () => client.get('/settings/center')
export const updateCenterSettings = (data) => client.patch('/settings/center', data)
export const requestSubscription = (plan, payment_ref) => client.post('/settings/subscription-request', { plan, payment_ref })
export const uploadLogo = (formData) => client.post('/settings/logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
