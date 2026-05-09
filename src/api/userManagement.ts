import client from './client'

export interface UserOut {
  id:        string
  email:     string
  full_name: string | null
  role:      string
  is_active: boolean
}

export interface InviteIn {
  email:     string
  full_name: string
  role:      string
}

export interface InviteOut {
  user:          UserOut
  temp_password: string
}

export interface UserUpdate {
  full_name?: string
  role?:      string
  is_active?: boolean
}

export const listUsers   = (): Promise<UserOut[]>       => client.get('/api/v1/users').then(r => r.data)
export const inviteUser  = (body: InviteIn): Promise<InviteOut> => client.post('/api/v1/users/invite', body).then(r => r.data)
export const updateUser  = (id: string, body: UserUpdate): Promise<UserOut> => client.put(`/api/v1/users/${id}`, body).then(r => r.data)
export const deactivateUser = (id: string): Promise<void> => client.delete(`/api/v1/users/${id}`).then(() => undefined)
