import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, LogOut, Zap } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { ConfirmActionModal } from '../shared/ConfirmActionModal'

export function SuperadminBanner() {
  const { user, effectiveTenantId, isReadOnly, clearEffectiveTenant, setReadOnly } = useAuthStore()
  const navigate = useNavigate()
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false)

  if (!effectiveTenantId) return null

  const tenantName = user?.tenants?.find((t) => t.id === effectiveTenantId)?.name ?? 'Unknown Tenant'

  const handleExit = () => {
    clearEffectiveTenant()
    navigate('/select-tenant')
  }

  const handleToggleMode = () => {
    if (isReadOnly) {
      // Switching to full access — show confirmation
      setShowSwitchConfirm(true)
    } else {
      setReadOnly(true)
    }
  }

  return (
    <>
      <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-3 text-sm">
        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-amber-300 font-semibold text-xs uppercase tracking-wider">Superadmin Mode</span>
        <span className="text-[#6b7280] text-xs">|</span>
        <span className="text-[#f0f0f0] text-xs">
          Acting as: <span className="font-semibold text-amber-300">{tenantName}</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Mode badge + toggle */}
          <button
            onClick={handleToggleMode}
            className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-colors ${
              isReadOnly
                ? 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
                : 'border-orange-500/40 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20'
            }`}
          >
            {isReadOnly ? (
              <><Eye className="w-3 h-3" /> Read-only</>
            ) : (
              <><AlertTriangle className="w-3 h-3" /> Full Access</>
            )}
          </button>

          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#f0f0f0] transition-colors px-2 py-1"
          >
            <LogOut className="w-3 h-3" />
            Exit Tenant
          </button>
        </div>
      </div>

      <ConfirmActionModal
        open={showSwitchConfirm}
        title="Switch to Full Access"
        description={`You are about to enable full-access mode for tenant ${tenantName}. Any changes you make will modify live data.`}
        confirmLabel="Enable Full Access"
        onConfirm={() => { setReadOnly(false); setShowSwitchConfirm(false) }}
        onCancel={() => setShowSwitchConfirm(false)}
      />
    </>
  )
}
