import client from './client'
export const getTenants = () => client.get('/tenants/')
export const createTenant = (data) => client.post('/tenants/', data)
export const toggleTenant = (id, data) => client.patch(`/tenants/${id}`, data)
