import client from './client'

export const getCenterSettings = () => client.get('/settings/center')
export const updateCenterSettings = (data) => client.patch('/settings/center', data)
export const requestSubscription = (plan, payment_ref, payment_method = 'superkey') => client.post('/settings/subscription-request', { plan, payment_ref, payment_method })
export const uploadLogo = (formData) => client.post('/settings/logo', formData)
export const getMobileCameraLink = () => client.get('/mobile-camera/link')
export const readLatestMobilePlate = () => client.post('/mobile-camera/latest-plate')
