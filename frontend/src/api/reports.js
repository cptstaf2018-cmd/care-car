import client from './client'
export const getDailyReport = (date) => client.get('/reports/daily', { params: { target_date: date } })
export const getMonthlyReport = (year, month) => client.get('/reports/monthly', { params: { year, month } })
