import client from './client'
export const getDailyReport = (date) => client.get('/reports/daily', { params: { target_date: date } })
export const getMonthlyReport = (year, month) => client.get('/reports/monthly', { params: { year, month } })
export const getMaintenanceDue = (limit = 8) => client.get('/reports/maintenance-due', { params: { limit } })
export const getSalesSeries = (period, year, month) => client.get('/reports/series', { params: { period, year, month } })
