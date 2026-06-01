import client from './client'

export const readPlate = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/vision/read-plate', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const parseReceipt = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/vision/parse-receipt', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const analyzeCar = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/vision/analyze-car', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
