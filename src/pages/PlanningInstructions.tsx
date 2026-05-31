import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ToggleLeft, ToggleRight, Brain, GripVertical, Pencil, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import {
  listInstructions, createInstruction, updateInstruction, toggleInstruction, deleteInstruction,
} from '../api/planningInstructions'
import { QUERY_KEYS } from '../lib/utils/constants'
import type { PlanningInstruction } from '../types'

function InstructionRow({ inst, onToggle, onDelete, onUpdate }: {
  inst: PlanningInstruction
  onToggle: () => void
  onDelete: () => void
  onUpdate: (text: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(inst.rule_text)

  const handleSave = () => {
    if (draft.trim() && draft !== inst.rule_text) onUpdate(draft.trim())
    setEditing(false)
  }

  return (
    <tr
      style={{ borderBottom: '1px solid var(--c-border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      <td className="px-3 py-3 w-8">
        <GripVertical size={14} className="text-[var(--c-muted)] opacity-40" />
      </td>
      <td className="px-3 py-3 w-12">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold font-mono"
          style={{ background: 'var(--c-elevated)', color: 'var(--c-muted)' }}
        >
          {inst.priority}
        </span>
      </td>
      <td className="px-3 py-3 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setDraft(inst.rule_text); setEditing(false) } }}
              className="flex-1 px-2 py-1 text-sm rounded-lg"
              style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-purple)', color: 'var(--c-text)', outline: 'none' }}
            />
            <button onClick={handleSave} className="p-1 rounded" style={{ color: 'var(--c-green)' }}><Check size={14} /></button>
            <button onClick={() => { setDraft(inst.rule_text); setEditing(false) }} className="p-1 rounded" style={{ color: 'var(--c-muted)' }}><X size={14} /></button>
          </div>
        ) : (
          <p
            className="text-sm cursor-text"
            style={{ color: inst.is_active ? 'var(--c-text)' : 'var(--c-muted)', textDecoration: inst.is_active ? 'none' : 'line-through' }}
            onDoubleClick={() => setEditing(true)}
          >
            {inst.rule_text}
          </p>
        )}
      </td>
      <td className="px-3 py-3 w-20 text-center">
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: inst.is_active ? 'rgba(52,211,153,0.12)' : 'var(--c-elevated)',
            color: inst.is_active ? 'var(--c-green)' : 'var(--c-muted)',
          }}
        >
          {inst.is_active ? 'Active' : 'Off'}
        </span>
      </td>
      <td className="px-3 py-3 w-28">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => setEditing(true)}
            title="Edit"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--c-elevated)]"
            style={{ color: 'var(--c-muted)' }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onToggle}
            title={inst.is_active ? 'Disable' : 'Enable'}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--c-elevated)]"
            style={{ color: inst.is_active ? 'var(--c-green)' : 'var(--c-muted)' }}
          >
            {inst.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--c-elevated)]"
            style={{ color: 'var(--c-muted)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function PlanningInstructions() {
  const qc = useQueryClient()
  const [newRule, setNewRule] = useState('')
  const [adding, setAdding] = useState(false)

  const { data: instructions = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.instructions,
    queryFn: listInstructions,
  })

  const createMut = useMutation({
    mutationFn: (text: string) => createInstruction({ rule_text: text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.instructions })
      setNewRule('')
      setAdding(false)
      toast.success('Instruction added')
    },
    onError: () => toast.error('Failed to add instruction'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => updateInstruction(id, { rule_text: text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.instructions })
      toast.success('Instruction updated')
    },
    onError: () => toast.error('Failed to update'),
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => toggleInstruction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.instructions }),
    onError: () => toast.error('Failed to toggle'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteInstruction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.instructions })
      toast.success('Instruction deleted')
    },
    onError: () => toast.error('Failed to delete'),
  })

  const active = (instructions as PlanningInstruction[]).filter((i) => i.is_active).length

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
            >
              <Brain size={17} color="#fff" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--c-text)]">Planning Instructions</h1>
              <p className="text-xs text-[var(--c-muted)] mt-0.5">
                {active} active rule{active !== 1 ? 's' : ''} injected into every AI planning run
              </p>
            </div>
          </div>
          <Button onClick={() => setAdding(true)} disabled={adding}>
            <Plus size={14} />
            Add Instruction
          </Button>
        </div>

        {/* Add row */}
        {adding && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            <p className="text-sm font-semibold text-[var(--c-text)]">New planning rule</p>
            <textarea
              autoFocus
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder='e.g. "Always assign refrigerated vehicles to cold-chain orders" or "Prefer drivers within 5 km of Zone B for morning runs"'
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{
                background: 'var(--c-elevated)',
                border: '1px solid var(--c-border)',
                color: 'var(--c-text)',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-purple)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--c-border)')}
              onKeyDown={(e) => { if (e.key === 'Escape') setAdding(false) }}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => newRule.trim() && createMut.mutate(newRule.trim())}
                loading={createMut.isPending}
                disabled={!newRule.trim()}
              >
                Save
              </Button>
              <Button variant="secondary" onClick={() => { setAdding(false); setNewRule('') }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          {isLoading ? (
            <div className="p-10 text-center text-sm text-[var(--c-muted)]">Loading…</div>
          ) : (instructions as PlanningInstruction[]).length === 0 ? (
            <EmptyState
              title="No planning instructions yet"
              subtitle="Add rules to guide the AI planner on every run — e.g. driver preferences, zone priorities, time constraints."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <th className="px-3 py-3 w-8" />
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)] w-12">Pri</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Rule</th>
                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)] w-20">Status</th>
                  <th className="px-3 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {(instructions as PlanningInstruction[])
                  .sort((a, b) => a.priority - b.priority)
                  .map((inst) => (
                    <InstructionRow
                      key={inst.id}
                      inst={inst}
                      onToggle={() => toggleMut.mutate(inst.id)}
                      onDelete={() => deleteMut.mutate(inst.id)}
                      onUpdate={(text) => updateMut.mutate({ id: inst.id, text })}
                    />
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-[var(--c-muted)]">
          Double-click any rule to edit inline. Active rules are injected verbatim into the AI planner's constraint validator.
        </p>
      </div>
    </AppShell>
  )
}
