import client from './client'
import type { User } from '../types'

export const loginApi = (email: string, password: string, tenant_id: string): Promise<User> =>
  client.post('/api/v1/auth/login', { email, password, tenant_id }).then(r => r.data)
