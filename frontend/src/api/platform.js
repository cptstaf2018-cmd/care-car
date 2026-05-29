import client from './client'

export const getPlatformAds = () => client.get('/platform/ads')
export const uploadPlatformAd = (formData) => client.post('/platform/ads', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const updatePlatformAd = (id, data) => client.patch(`/platform/ads/${id}`, data)
export const deletePlatformAd = (id) => client.delete(`/platform/ads/${id}`)
