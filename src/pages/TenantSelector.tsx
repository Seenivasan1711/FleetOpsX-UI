import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Building2, CheckCircle2, Eye, LogIn, Search, Users, XCircle, Zap } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import type { TenantBrief } from '../types'

type HealthStatus = { status: string; version?: string; db?: string; latency?: number } | null

export default function TenantSelector() {
  const { user, setEffectiveTenant, clearAuth, demoMode, setDemoMode } = useAuthStore()
  const navigate = useNavigate()
  const [search,         setSearch]         = useState('')
  const [view,           setView]           = useState<'tenants' | 'health'>('tenants')
  const [health,         setHealth]         = useState<HealthStatus>(null)
  const [healthLoading,  setHealthLoading]  = useState(false)
  const [healthError,    setHealthError]    = useState(false)

  const tenants: TenantBrief[] = user?.tenants ?? []

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (tenant: TenantBrief, readOnly: boolean) => {
    setEffectiveTenant(tenant.id, readOnly)
    navigate('/')
  }

  const fetchHealth = async () => {
    setHealthLoading(true)
    setHealthError(false)
    const t0 = Date.now()
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1/health')
      const data = await res.json()
      setHealth({ ...data, latency: Date.now() - t0 })
    } catch {
      setHealthError(true)
      setHealth(null)
    } finally {
      setHealthLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'health') fetchHealth()
  }, [view])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center font-bold text-sm">F</div>
          <span className="font-semibold text-lg">FleetOpsX</span>
          <span className="text-xs text-[#6b7280] bg-[#141414] border border-[#2a2a2a] px-2 py-0.5 rounded-full">Platform Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              demoMode
                ? 'border-[#7c3aed]/50 text-[#a78bfa] bg-[#7c3aed]/10'
                : 'border-[#2a2a2a] text-[#6b7280] hover:text-[#f0f0f0] bg-[#141414]'
            }`}
            title={demoMode ? 'Demo data active — click for live' : 'Click to enable demo data'}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8 8M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4"/>
            </svg>
            {demoMode ? 'Demo Data' : 'Live Data'}
          </button>
          <button
            onClick={() => { clearAuth(); navigate('/login') }}
            className="text-sm text-[#6b7280] hover:text-[#f0f0f0] transition-colors"
          >
            Sign out
          </button>
        </div>
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
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => navigate('/admin/ai-providers')}
              className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] hover:border-[#7c3aed]/40 text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Zap className="w-4 h-4 text-[#7c3aed]" />
              AI Providers
            </button>

            <button
              onClick={() => setView('health')}
              className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-colors border ${
                view === 'health'
                  ? 'bg-[#10b981]/10 border-[#10b981]/40 text-[#34d399]'
                  : 'bg-[#141414] border-[#2a2a2a] hover:border-[#10b981]/40 text-[#f0f0f0]'
              }`}
            >
              <Activity className="w-4 h-4" />
              System Health
            </button>
          </div>

          {/* System Health panel */}
          {view === 'health' && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[#f0f0f0] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#10b981]" />
                  API Health Status
                </p>
                <button
                  onClick={fetchHealth}
                  disabled={healthLoading}
                  className="text-xs text-[#6b7280] hover:text-[#f0f0f0] transition-colors px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2a2a2a] disabled:opacity-50"
                >
                  {healthLoading ? 'Checking…' : 'Refresh'}
                </button>
              </div>

              {healthLoading && (
                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                  <span className="w-2 h-2 rounded-full bg-[#6b7280] animate-pulse" />
                  Checking API connectivity…
                </div>
              )}

              {!healthLoading && healthError && (
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-400">API Unreachable</p>
                    <p className="text-xs text-[#6b7280] mt-1">
                      Could not connect to {import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/health
                    </p>
                  </div>
                </div>
              )}

              {!healthLoading && !healthError && health && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#f0f0f0]">
                        API Online
                        <span className="ml-2 text-xs font-normal text-[#6b7280]">{health.latency}ms</span>
                      </p>
                    </div>
                    <span className="text-xs bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      {health.status ?? 'ok'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {health.version && (
                      <div className="bg-[#1c1c1c] rounded-xl px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">Version</p>
                        <p className="text-sm font-mono text-[#f0f0f0]">{health.version}</p>
                      </div>
                    )}
                    {health.db && (
                      <div className="bg-[#1c1c1c] rounded-xl px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">Database</p>
                        <p className="text-sm font-mono text-[#10b981] capitalize">{health.db}</p>
                      </div>
                    )}
                    <div className="bg-[#1c1c1c] rounded-xl px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">Endpoint</p>
                      <p className="text-xs font-mono text-[#6b7280] truncate">
                        {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
                      </p>
                    </div>
                    <div className="bg-[#1c1c1c] rounded-xl px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1">Tenants</p>
                      <p className="text-sm font-mono text-[#f0f0f0]">{tenants.length} registered</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
