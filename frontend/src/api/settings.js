import client from './client'

export const getCenterSettings = () => client.get('/settings/center')
export const updateCenterSettings = (data) => client.patch('/settings/center', data)
