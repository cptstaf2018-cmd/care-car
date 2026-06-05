import client from './client'

export const getCenterUsers = () => client.get('/users/')
export const createCenterUser = (data) => client.post('/users/', data)
export const updateCenterUser = (id, data) => client.patch(`/users/${id}`, data)
export const deleteCenterUser = (id) => client.delete(`/users/${id}`)
