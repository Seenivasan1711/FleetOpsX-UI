/// <reference types="vite/client" />
import axios from 'axios'
import { useAuthStore } from '../store'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

client.interceptors.request.use((config) => {
  const { accessToken, effectiveTenantId } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (effectiveTenantId) {
    config.headers['X-Acting-Tenant-Id'] = effectiveTenantId
  }
  return config
})

export default client
