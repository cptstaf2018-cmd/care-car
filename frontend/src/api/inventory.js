import client from './client'
export const getInventory = () => client.get('/inventory/')
export const createInventoryItem = (data) => client.post('/inventory/', data)
export const updateInventoryItem = (id, data) => client.patch(`/inventory/${id}`, data)
