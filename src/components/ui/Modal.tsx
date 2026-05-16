import { type ReactNode } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Icon } from './icons'
import { cn } from '../../lib/utils/cn'

type ModalProps = {
  open:     boolean
  onClose:  () => void
  title:    string
  children: ReactNode
  size?:    'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export const Modal = ({ open, onClose, title, children, size = 'md' }: ModalProps) => (
  <Dialog open={open} onClose={onClose} className="relative z-50">
    {/* Backdrop */}
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

    <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        className={cn(
          'w-full bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl',
          'shadow-[0_32px_80px_rgba(0,0,0,0.6)]',
          sizes[size]
        )}
        style={{ animation: 'scale-in 0.18s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-border)]">
          <DialogTitle className="text-base font-bold text-[var(--c-text)]">{title}</DialogTitle>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-elevated)] transition-colors"
          >
            <Icon.X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </DialogPanel>
    </div>
  </Dialog>
)
