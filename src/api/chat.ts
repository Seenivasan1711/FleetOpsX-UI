import client from './client'

export type ChatMessage = {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  created_at: string
}

export const sendChatMessage = (message: string, plan_date?: string): Promise<ChatMessage> =>
  client.post('/api/v1/chat/message', { message, plan_date }).then(r => r.data)

export const fetchChatHistory = (): Promise<ChatMessage[]> =>
  client.get('/api/v1/chat/history').then(r => r.data)
