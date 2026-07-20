/// <reference types="vite/client" />
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

const READ_ONLY_METHODS = new Set(['post', 'put', 'patch', 'delete'])

client.interceptors.request.use((config) => {
  const { accessToken, effectiveTenantId, isReadOnly } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  // Admin routes are platform-scoped — never send a tenant override header
  const isAdminRoute = (config.url ?? '').startsWith('/api/v1/admin/')
  if (effectiveTenantId && !isAdminRoute) {
    config.headers['X-Acting-Tenant-Id'] = effectiveTenantId
  }
  if (isReadOnly && READ_ONLY_METHODS.has((config.method ?? '').toLowerCase())) {
    toast.error('Read-only mode: changes are not allowed in this view.', { id: 'readonly-block' })
    return Promise.reject(new axios.Cancel('read-only'))
  }
  return config
})

export default client
