import { X } from 'lucide-react'
import { KEYBOARD_SHORTCUTS } from '../../lib/utils/constants'

type Props = {
  onClose: () => void
}

export const KeyboardShortcutsModal = ({ onClose }: Props) => (
  <div
    className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    style={{ animation: 'fade-in 0.15s ease' }}
    onClick={onClose}
  >
    <div
      className="w-full max-w-[480px] max-h-[80vh] overflow-y-auto rounded-[20px] p-7"
      style={{
        background: 'var(--c-surface)',
        border:     '1px solid var(--c-border)',
        boxShadow:  '0 32px 80px rgba(0,0,0,0.6)',
        animation:  'scale-in 0.18s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-extrabold text-[var(--c-text)]">Keyboard Shortcuts</h2>
          <p className="text-xs text-[var(--c-muted)] mt-0.5">Navigate FleetOpsX faster</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-elevated)] border border-[var(--c-border)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {KEYBOARD_SHORTCUTS.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{ background: i % 2 === 0 ? 'var(--c-elevated)' : 'transparent' }}
          >
            <span className="text-[13px] text-[var(--c-text)]">{s.desc}</span>
            <kbd
              className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono"
              style={{
                background:  'var(--c-bg)',
                border:      '1px solid var(--c-border)',
                color:       'var(--c-accent)',
                boxShadow:   '0 2px 0 var(--c-border)',
              }}
            >
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  </div>
)
