import { useState } from 'react'
import { Bot, Wrench, Brain, ChevronDown, ChevronUp } from 'lucide-react'
import type { AgentLogEntry } from '../../types'

const ROLE_CONFIG = {
  tool:  { icon: Wrench, color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  llm:   { icon: Brain,  color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-900/20' },
  agent: { icon: Bot,    color: 'text-green-500',   bg: 'bg-green-50 dark:bg-green-900/20' },
} as const

const STEP_LABELS: Record<string, string> = {
  fetch_context:  'Fetch context',
  call_optimizer: 'Run OR-Tools',
  explain:        'LLM explanation',
}

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
  catch { return '' }
}

interface Props {
  logs: AgentLogEntry[]
  explanation?: string
  planner?: string
  isLoading?: boolean
}

export default function AgentFeed({ logs, explanation, planner, isLoading }: Props) {
  const [expanded, setExpanded] = useState(true)

  // Don't show for non-langgraph planners unless there are logs
  if (!isLoading && logs.length === 0 && planner !== 'langgraph') return null

  return (
    <div className="border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
          <Bot size={15} />
          Agent Reasoning
          {planner && (
            <span className="ml-1 font-mono text-xs bg-purple-100 dark:bg-purple-800 px-2 py-0.5 rounded">
              {planner}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={15} className="text-purple-500" /> : <ChevronDown size={15} className="text-purple-500" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          {isLoading && (
            <p className="text-xs text-gray-400 animate-pulse">Loading agent reasoning...</p>
          )}

          {/* LLM explanation shown prominently */}
          {explanation && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-300 mb-1 flex items-center gap-1">
                <Brain size={12} /> LLM Summary
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{explanation}</p>
            </div>
          )}

          {/* Step-by-step log — reversed so oldest first */}
          {[...logs].reverse().map(log => {
            const cfg = ROLE_CONFIG[log.role] ?? ROLE_CONFIG.agent
            const Icon = cfg.icon
            return (
              <div key={log.id} className={`flex gap-2 p-2 rounded text-xs ${cfg.bg}`}>
                <Icon size={13} className={`${cfg.color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-600 dark:text-gray-400">
                      {STEP_LABELS[log.step] ?? log.step}
                    </span>
                    {log.llm_provider && (
                      <span className="text-gray-400 font-mono">[{log.llm_provider}]</span>
                    )}
                    <span className="text-gray-400 ml-auto shrink-0">{formatTime(log.created_at)}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 break-words">{log.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
