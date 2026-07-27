import client from './client'

export type ChatMessage = {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  created_at: string
}

export type ChatMessageResponse = {
  session_id: string
  reply:      string
  used_llm:   boolean
}

const SESSION_KEY = 'fleetopsx_chat_session_id'

/** Persistent per-browser session id — the backend keys chat history off this, not a conversation list. */
export function getChatSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

/** Rotates to a fresh session id — the FE's equivalent of "start a new chat". */
export function newChatSession(): string {
  const id = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, id)
  return id
}

export const sendChatMessage = (session_id: string, message: string): Promise<ChatMessageResponse> =>
  client.post('/api/v1/chat/message', { session_id, message }).then(r => r.data)

export const fetchChatHistory = (session_id: string): Promise<ChatMessage[]> =>
  client.get('/api/v1/chat/history', { params: { session_id } }).then(r => r.data.messages)
