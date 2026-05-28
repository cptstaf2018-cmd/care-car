import client from './client'
export const getTenants = () => client.get('/tenants/')
export const createTenant = (data) => client.post('/tenants/', data)
export const updateTenant = (id, data) => client.patch(`/tenants/${id}`, data)
export const deleteTenant = (id) => client.delete(`/tenants/${id}`)
