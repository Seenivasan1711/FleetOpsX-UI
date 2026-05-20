import { Icon } from '../ui/icons'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmActionModal({ open, title, description, confirmLabel = 'Yes, proceed', onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Icon.Alert size={16} className="text-red-400" />
            </div>
            <h2 className="text-sm font-semibold text-[#f0f0f0]">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-[#6b7280] hover:text-[#f0f0f0] transition-colors">
            <Icon.X size={16} />
          </button>
        </div>

        <p className="px-5 py-4 text-sm text-[#6b7280] leading-relaxed">{description}</p>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#f0f0f0] bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-500/30 rounded-xl transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
