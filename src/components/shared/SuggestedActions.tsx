import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Bot } from 'lucide-react'
import { Icon } from '../ui/icons'
import { fetchSuggestions, respondToSuggestion } from '../../api/agentSuggestions'
import type { AgentSuggestion } from '../../types'

interface Props {
  planDate: string
}

const TYPE_LABELS: Record<string, string> = {
  REPLAN_DRIVER:     'Replan Driver',
  EARLY_SLA_WARNING: 'SLA Warning',
  DEMAND_WARNING:    'Demand Warning',
  RESCHEDULE_STOP:   'Reschedule Stop',
}

export default function SuggestedActions({ planDate }: Props) {
  const [expanded, setExpanded] = useState(true)
  const queryClient = useQueryClient()

  const { data: suggestions = [] } = useQuery({
    queryKey: ['agent-suggestions', planDate],
    queryFn: () => fetchSuggestions(planDate, 'PENDING'),
    refetchInterval: 60_000,
  })

  // Filter out expired suggestions client-side
  const now = new Date()
  const active = suggestions.filter(s =>
    !s.expires_at || new Date(s.expires_at) > now
  )

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'DISMISSED' }) =>
      respondToSuggestion(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['agent-suggestions', planDate] })
      if (updated.status === 'ACCEPTED') {
        const label = TYPE_LABELS[updated.suggestion_type] ?? updated.suggestion_type
        toast.success(`${label} accepted`)
      } else {
        toast('Suggestion dismissed')
      }
    },
    onError: () => toast.error('Failed to respond to suggestion'),
  })

  const hasSuggestions = active.length > 0

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-colors ${
      hasSuggestions ? 'border-purple-300 dark:border-purple-700' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
          hasSuggestions
            ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Bot size={15} className={hasSuggestions ? 'text-purple-500' : 'text-gray-400'} />
          <span className={hasSuggestions ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}>
            AI Suggestions
          </span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            hasSuggestions
              ? 'bg-purple-500 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
          }`}>
            {active.length}
          </span>
        </span>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          polls every 60s
          {expanded ? <Icon.ChevU size={14} /> : <Icon.ChevD size={14} />}
        </span>
      </button>

      {expanded && (
        <div className="p-4">
          {active.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              No pending suggestions — system is running smoothly.
            </p>
          ) : (
            <div className="space-y-3">
              {active.map(s => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  isPending={respondMutation.isPending}
                  onAccept={() => respondMutation.mutate({ id: s.id, status: 'ACCEPTED' })}
                  onDismiss={() => respondMutation.mutate({ id: s.id, status: 'DISMISSED' })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SuggestionCard({
  suggestion,
  isPending,
  onAccept,
  onDismiss,
}: {
  suggestion: AgentSuggestion
  isPending: boolean
  onAccept: () => void
  onDismiss: () => void
}) {
  const isHigh = suggestion.priority === 'HIGH'
  const actionLabel = suggestion.suggestion_type === 'REPLAN_DRIVER'
    ? 'Accept — Replan Driver'
    : suggestion.suggestion_type === 'EARLY_SLA_WARNING'
    ? 'Accept — Noted'
    : 'Accept'

  return (
    <div className={`p-3 rounded-lg border ${
      isHigh
        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
        : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className="flex items-start gap-2 mb-2">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
          isHigh ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'
        }`}>
          {isHigh ? 'HIGH' : 'NORM'}
        </span>
        <p className="text-sm font-medium dark:text-white leading-snug">{suggestion.title}</p>
      </div>

      {suggestion.detail && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 ml-8 leading-relaxed">
          {suggestion.detail}
        </p>
      )}

      <div className="flex gap-2 ml-8">
        <button
          onClick={onAccept}
          disabled={isPending}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Icon.Check size={12} />
          {actionLabel}
        </button>
        <button
          onClick={onDismiss}
          disabled={isPending}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          <Icon.X size={12} />
          Dismiss
        </button>
      </div>
    </div>
  )
}
