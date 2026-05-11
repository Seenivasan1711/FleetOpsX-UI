import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Eye, LogIn, Search, Settings, Users, Zap } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import type { TenantBrief } from '../types'

export default function TenantSelector() {
  const { user, setEffectiveTenant, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const tenants: TenantBrief[] = user?.tenants ?? []

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (tenant: TenantBrief, readOnly: boolean) => {
    setEffectiveTenant(tenant.id, readOnly)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center font-bold text-sm">F</div>
          <span className="font-semibold text-lg">FleetOpsX</span>
          <span className="text-xs text-[#6b7280] bg-[#141414] border border-[#2a2a2a] px-2 py-0.5 rounded-full">Platform Admin</span>
        </div>
        <button
          onClick={() => { clearAuth(); navigate('/login') }}
          className="text-sm text-[#6b7280] hover:text-[#f0f0f0] transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-12">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Select a tenant workspace</h1>
          <p className="text-[#6b7280] text-sm">
            You are logged in as platform admin. Choose a tenant to work within, or manage the platform below.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f0f0f0] placeholder-[#6b7280] focus:outline-none focus:border-[#7c3aed] transition-colors"
          />
        </div>

        {/* Tenant cards */}
        {filtered.length === 0 ? (
          <p className="text-[#6b7280] text-sm text-center py-12">No tenants found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#7c3aed]/40 transition-colors"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-[#6b7280] truncate">{t.slug}</p>
                  </div>
                  {!t.is_active && (
                    <span className="ml-auto text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full shrink-0">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex gap-4 text-xs text-[#6b7280] mb-5">
                  <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    {t.order_count_today} orders today
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    {t.driver_count} drivers
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelect(t, false)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Act as tenant
                  </button>
                  <button
                    onClick={() => handleSelect(t, true)}
                    className="flex items-center justify-center gap-1.5 bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Read-only
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Platform management */}
        <div className="border-t border-[#2a2a2a] pt-8">
          <p className="text-xs text-[#6b7280] uppercase tracking-wider mb-4">Platform Management</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/ai-providers')}
              className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] hover:border-[#7c3aed]/40 text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Zap className="w-4 h-4 text-[#7c3aed]" />
              AI Providers
            </button>
            <button
              onClick={() => navigate('/select-tenant')}
              className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] hover:border-[#7c3aed]/40 text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Users className="w-4 h-4 text-[#6b7280]" />
              All Tenants
            </button>
            <button
              onClick={() => window.open((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1/health', '_blank')}
              className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] hover:border-[#7c3aed]/40 text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4 text-[#6b7280]" />
              System Health
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
