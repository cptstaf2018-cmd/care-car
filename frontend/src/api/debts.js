import client from './client'

export const getDebts = () => client.get('/debts/')
export const updateDebt = (id, data) => client.patch(`/debts/${id}`, data)
export const sendDebtReminder = (id) => client.post(`/debts/${id}/send-reminder`)
