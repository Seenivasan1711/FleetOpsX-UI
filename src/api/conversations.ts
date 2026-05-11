import client from './client'

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await client.get('/chat/conversations/')
  return data
}

export async function createConversation(title?: string): Promise<Conversation> {
  const { data } = await client.post('/chat/conversations/', { title: title ?? 'New Conversation' })
  return data
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data } = await client.get(`/chat/conversations/${conversationId}/messages`)
  return data
}

export async function sendMessage(conversationId: string, content: string): Promise<ChatMessage[]> {
  const { data } = await client.post(`/chat/conversations/${conversationId}/messages`, { content })
  return data
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await client.delete(`/chat/conversations/${conversationId}`)
}
