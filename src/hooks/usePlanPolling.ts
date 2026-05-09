import { useState, useEffect, useRef } from 'react'
import { getTaskStatus, type TaskStatusResponse } from '../api/aiPlanning'

interface UsePlanPollingResult {
  status:   TaskStatusResponse['status'] | null
  result:   TaskStatusResponse['result'] | null
  error:    string | null
  isPolling: boolean
  startPolling: (taskId: string) => void
  reset:    () => void
}

export function usePlanPolling(): UsePlanPollingResult {
  const [taskId,    setTaskId]    = useState<string | null>(null)
  const [status,    setStatus]    = useState<TaskStatusResponse['status'] | null>(null)
  const [result,    setResult]    = useState<TaskStatusResponse['result'] | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!taskId) return

    const poll = async () => {
      try {
        const res = await getTaskStatus(taskId)
        setStatus(res.status)
        if (res.status === 'done') {
          setResult(res.result ?? null)
          stop()
        } else if (res.status === 'failed') {
          setError(res.error ?? 'Planning failed')
          stop()
        }
      } catch {
        setError('Failed to poll task status')
        stop()
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 3000)

    return stop
  }, [taskId])

  const startPolling = (id: string) => {
    stop()
    setTaskId(id)
    setStatus('pending')
    setResult(null)
    setError(null)
  }

  const reset = () => {
    stop()
    setTaskId(null)
    setStatus(null)
    setResult(null)
    setError(null)
  }

  return {
    status,
    result,
    error,
    isPolling: !!taskId && (status === 'pending' || status === 'running'),
    startPolling,
    reset,
  }
}
