import client from './client'

export const exportOrders = (plan_date?: string): Promise<Blob> =>
  client.get('/api/v1/export/orders', { params: { plan_date }, responseType: 'blob' }).then(r => r.data)

export const importOrders = (file: File): Promise<{ created: number; errors: number; message?: string }> => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/api/v1/import/orders', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export const exportPlan = (plan_date: string): Promise<Blob> =>
  client.get('/api/v1/export/plan', { params: { plan_date }, responseType: 'blob' }).then(r => r.data)

export const downloadTemplate = (): Promise<Blob> =>
  client.get('/api/v1/export/orders-template', { responseType: 'blob' }).then(r => r.data)

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
