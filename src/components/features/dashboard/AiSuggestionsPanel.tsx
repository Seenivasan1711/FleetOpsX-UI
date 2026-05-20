import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Cpu } from 'lucide-react'
import { Icon } from '../../ui/icons'
import toast from 'react-hot-toast'
import { Collapsible } from '../../ui/Collapsible'
import { EmptyState } from '../../ui/EmptyState'
import { Button } from '../../ui/Button'
import { fetchSuggestions, respondToSuggestion } from '../../../api/agentSuggestions'
import { QUERY_KEYS } from '../../../lib/utils/constants'

type Props = { planDate: string }

export const AiSuggestionsPanel = ({ planDate }: Props) => {
  const queryClient = useQueryClient()

  const { data: suggestions = [] } = useQuery({
    queryKey:        QUERY_KEYS.suggestions(planDate),
    queryFn:         () => fetchSuggestions(planDate, 'PENDING'),
    refetchInterval: 60_000,
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'ACCEPTED' | 'DISMISSED' }) =>
      respondToSuggestion(id, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suggestions(planDate) })
      toast.success(action === 'ACCEPTED' ? 'Suggestion accepted — replanning…' : 'Suggestion dismissed')
    },
  })

  return (
    <Collapsible
      title="AI Suggestions"
      icon={<Cpu size={16} />}
      badge={suggestions.length}
      badgeVariant={suggestions.length > 0 ? 'accent' : undefined}
      refreshLabel="refreshes every 60s"
    >
      {suggestions.length === 0 ? (
        <EmptyState
          title="No pending suggestions"
          subtitle="Generate a plan to unlock AI-powered route insights."
        />
      ) : (
        <div className="p-4 flex flex-col gap-2">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-3 p-3 rounded-xl"
              style={{ background: 'var(--c-accent-dim)', border: '1px solid var(--c-border)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--c-text)]">{s.title}</p>
                {s.detail && <p className="text-xs text-[var(--c-muted)] mt-0.5">{s.detail}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => respondMutation.mutate({ id: s.id, action: 'ACCEPTED' })}
                  loading={respondMutation.isPending}
                >
                  <Icon.Check size={13} /> Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => respondMutation.mutate({ id: s.id, action: 'DISMISSED' })}
                >
                  <Icon.X size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Collapsible>
  )
}
