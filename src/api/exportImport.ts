import client from './client'

export const exportOrders = (date_from?: string, date_to?: string): Promise<Blob> => {
  const params: Record<string, string> = {}
  if (date_from) params.date_from = date_from
  if (date_to)   params.date_to   = date_to
  return client.get('/api/v1/export/orders', { params, responseType: 'blob' }).then(r => r.data)
}

export const importOrders = (file: File): Promise<{ created: number; errors: number; error_details: string[] }> => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/api/v1/import/orders', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export const exportPlan = (plan_date: string): Promise<Blob> =>
  client.get('/api/v1/export/plan', { params: { plan_date }, responseType: 'blob' }).then(r => r.data)

export const downloadTemplate = (): Promise<Blob> =>
  client.get('/api/v1/export/template', { responseType: 'blob' }).then(r => r.data)

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
