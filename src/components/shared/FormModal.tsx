import { Icon } from '../ui/icons'

interface FormModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function FormModal({ title, isOpen, onClose, children }: FormModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <Icon.X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
