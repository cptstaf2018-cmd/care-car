import client from './client'

export const getPlatformAds = () => client.get('/platform/ads')
export const getPlatformAdsAdmin = () => client.get('/platform/ads/manage')
export const uploadPlatformAd = (formData) => client.post('/platform/ads', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const updatePlatformAd = (id, data) => client.patch(`/platform/ads/${id}`, data)
export const deletePlatformAd = (id) => client.delete(`/platform/ads/${id}`)
export const getPaymentSettings = () => client.get('/platform/payment-settings')
export const updatePaymentSettings = (data) => client.patch('/platform/payment-settings', data)
export const uploadPaymentQr = (method, formData) => client.post(`/platform/payment-settings/${method}/qr`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
