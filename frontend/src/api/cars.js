import client from './client'
export const getCars = (search) => client.get('/cars/', { params: search ? { search } : {} })
export const createCar = (data) => client.post('/cars/', data)
export const updateCar = (id, data) => client.patch(`/cars/${id}`, data)
