import client from './client'
export const getInvoices = (status) => client.get('/invoices/', { params: status ? { status } : {} })
export const getInvoice = (id) => client.get(`/invoices/${id}/detail`)
export const createSaleInvoice = (data) => client.post('/invoices/sale', data)
export const updateInvoice = (id, data) => client.patch(`/invoices/${id}`, data)
export const deleteInvoice = (id) => client.delete(`/invoices/${id}`)
