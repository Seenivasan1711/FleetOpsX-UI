import client from './client'
import type { User } from '../types'

export const loginApi = (email: string, password: string): Promise<User> =>
  client.post('/api/v1/auth/login', { email, password }).then(r => r.data)

export const changePasswordApi = (current_password: string, new_password: string): Promise<void> =>
  client.post('/api/v1/auth/change-password', { current_password, new_password })
