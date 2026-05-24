import client from './client'
export const getInvoices = (status) => client.get('/invoices/', { params: status ? { status } : {} })
export const updateInvoice = (id, data) => client.patch(`/invoices/${id}`, data)
