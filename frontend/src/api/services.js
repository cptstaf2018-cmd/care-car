import client from './client'
export const createService = (data) => client.post('/services/', data)
