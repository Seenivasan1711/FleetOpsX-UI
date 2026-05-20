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

type ImportResult = { created: number; errors: number; error_details: string[] }

const importFile = (url: string, file: File): Promise<ImportResult> => {
  const form = new FormData()
  form.append('file', file)
  return client.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}

export const exportDrivers  = (): Promise<Blob> =>
  client.get('/api/v1/drivers/export',  { responseType: 'blob' }).then(r => r.data)
export const importDrivers  = (file: File): Promise<ImportResult> => importFile('/api/v1/drivers/import',  file)

export const exportVehicles = (): Promise<Blob> =>
  client.get('/api/v1/vehicles/export', { responseType: 'blob' }).then(r => r.data)
export const importVehicles = (file: File): Promise<ImportResult> => importFile('/api/v1/vehicles/import', file)

export const exportDepots   = (): Promise<Blob> =>
  client.get('/api/v1/depots/export',   { responseType: 'blob' }).then(r => r.data)
export const importDepots   = (file: File): Promise<ImportResult> => importFile('/api/v1/depots/import',   file)

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
