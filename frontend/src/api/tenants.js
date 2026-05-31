import client from './client'
export const getTenants = () => client.get('/tenants/')
export const getTenantMonitoring = () => client.get('/tenants/monitoring')
export const createTenant = (data) => client.post('/tenants/', data)
export const updateTenant = (id, data) => client.patch(`/tenants/${id}`, data)
export const deleteTenant = (id) => client.delete(`/tenants/${id}`)
