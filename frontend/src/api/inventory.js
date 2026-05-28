import client from './client'
export const getInventory = () => client.get('/inventory/')
export const createInventoryItem = (data) => client.post('/inventory/', data)
export const updateInventoryItem = (id, data) => client.patch(`/inventory/${id}`, data)
export const deleteInventoryItem = (id) => client.delete(`/inventory/${id}`)
export const addInventoryReceipt = (data) => client.post('/inventory/receipt', data)
