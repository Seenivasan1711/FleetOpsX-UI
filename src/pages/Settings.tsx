import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Palette, Bell, User, Moon, Sun, LogOut, RotateCcw, Check } from 'lucide-react'

import { AppShell }    from '../components/layout/AppShell'
import { Toggle }      from '../components/ui/Toggle'
import { Button }      from '../components/ui/Button'
import { useUiStore }  from '../store/ui.store'
import { useAuthStore } from '../store/auth.store'
import { initials }    from '../lib/utils/format'

// ─── Tab definition ────────────────────────────────────────────────────────────

type TabId = 'appearance' | 'notifications' | 'account'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'appearance',    label: 'Appearance',    icon: <Palette size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} />    },
  { id: 'account',       label: 'Account',       icon: <User size={15} />    },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-muted)] mb-3">
    {children}
  </p>
)

const SettingRow = ({
  label,
  description,
  children,
}: {
  label:        string
  description?: string
  children:     React.ReactNode
}) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-[var(--c-border)] last:border-0">
    <div>
      <p className="text-sm font-medium text-[var(--c-text)]">{label}</p>
      {description && (
        <p className="text-xs text-[var(--c-muted)] mt-0.5">{description}</p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
)

// ─── Appearance tab ────────────────────────────────────────────────────────────

const AppearanceTab = () => {
  const { theme, display, setTheme, setDisplay } = useUiStore()

  return (
    <div className="space-y-8">

      {/* Color mode */}
      <div>
        <SectionHeading>Color Mode</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          {(['dark', 'light'] as const).map((t) => {
            const active = theme === t
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="relative flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all duration-150"
                style={{
                  background:  active ? 'var(--c-accent-dim)' : 'var(--c-elevated)',
                  border:      active ? '1.5px solid var(--c-accent)' : '1.5px solid var(--c-border)',
                }}
              >
                {/* Mock preview */}
                <div
                  className="w-full h-16 rounded-xl overflow-hidden flex gap-1.5 p-2"
                  style={{ background: t === 'dark' ? '#0f1117' : '#f4f5f7' }}
                >
                  <div
                    className="w-6 h-full rounded-lg"
                    style={{ background: t === 'dark' ? '#1a1d27' : '#e2e4ea' }}
                  />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div
                      className="h-2 w-3/4 rounded-sm"
                      style={{ background: t === 'dark' ? '#2a2d3a' : '#d1d5db' }}
                    />
                    <div
                      className="h-2 w-1/2 rounded-sm"
                      style={{ background: t === 'dark' ? '#2a2d3a' : '#d1d5db' }}
                    />
                    <div
                      className="h-2 w-5/6 rounded-sm mt-auto"
                      style={{ background: t === 'dark' ? '#2a2d3a' : '#d1d5db' }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {t === 'dark' ? <Moon size={13} className="text-[var(--c-muted)]" /> : <Sun size={13} className="text-[var(--c-muted)]" />}
                    <span className="text-sm font-semibold text-[var(--c-text)] capitalize">{t}</span>
                  </div>
                  {active && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--c-accent)' }}
                    >
                      <Check size={11} className="text-white" />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Display preferences */}
      <div>
        <SectionHeading>Display</SectionHeading>
        <div
          className="rounded-2xl px-4"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <SettingRow
            label="Compact sidebar"
            description="Start with the sidebar collapsed by default."
          >
            <Toggle
              value={display.compactSidebar}
              onChange={(v) => setDisplay('compactSidebar', v)}
            />
          </SettingRow>
          <SettingRow
            label="Reduce motion"
            description="Disable transitions and animations across the UI."
          >
            <Toggle
              value={display.reduceMotion}
              onChange={(v) => setDisplay('reduceMotion', v)}
            />
          </SettingRow>
          <SettingRow
            label="Keyboard hints"
            description="Show shortcut hints in tooltips and the sidebar."
          >
            <Toggle
              value={display.keyboardHints}
              onChange={(v) => setDisplay('keyboardHints', v)}
            />
          </SettingRow>
        </div>
      </div>
    </div>
  )
}

// ─── Notifications tab ─────────────────────────────────────────────────────────

const NOTIFICATION_ITEMS: {
  key:   keyof ReturnType<typeof useUiStore.getState>['notifications']
  label: string
  desc:  string
}[] = [
  { key: 'atRiskAlerts',  label: 'At-risk delivery alerts',    desc: 'Notify when a stop is projected to miss its SLA window.'       },
  { key: 'aiSuggestions', label: 'AI route suggestions',       desc: 'Surface new AI-generated optimisation suggestions in real time.' },
  { key: 'planReady',     label: 'Plan generation complete',   desc: 'Alert when a new dispatch plan finishes generating.'            },
  { key: 'driverOffline', label: 'Driver goes offline',        desc: 'Flag when an active driver loses connectivity.'                 },
  { key: 'etlComplete',   label: 'Data sync complete',         desc: 'Confirm when the order ETL pipeline finishes successfully.'     },
]

const NotificationsTab = () => {
  const { notifications, setNotification } = useUiStore()

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading>Alert Preferences</SectionHeading>
        <div
          className="rounded-2xl px-4"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          {NOTIFICATION_ITEMS.map(({ key, label, desc }) => (
            <SettingRow key={key} label={label} description={desc}>
              <Toggle
                value={notifications[key]}
                onChange={(v) => setNotification(key, v)}
              />
            </SettingRow>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--c-muted)] leading-relaxed">
        Notifications appear as in-app toasts. Email and push delivery channels are on the roadmap.
      </p>
    </div>
  )
}

// ─── Account tab ───────────────────────────────────────────────────────────────

const AccountTab = () => {
  const { user, clearAuth } = useAuthStore()
  const { setTheme, setDisplay, setNotification } = useUiStore()
  const navigate = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)

  const handleSignOut = () => {
    clearAuth()
    navigate('/login')
  }

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    setTheme('dark')
    setDisplay('compactSidebar', false)
    setDisplay('reduceMotion', false)
    setDisplay('keyboardHints', true)
    setNotification('atRiskAlerts', true)
    setNotification('aiSuggestions', true)
    setNotification('planReady', true)
    setNotification('driverOffline', false)
    setNotification('etlComplete', false)
    setConfirmReset(false)
  }

  const name  = user?.full_name ?? 'Dispatcher'
  const email = user?.email     ?? '—'
  const role  = user?.role      ?? 'dispatcher'

  return (
    <div className="space-y-8">

      {/* Profile card */}
      <div>
        <SectionHeading>Profile</SectionHeading>
        <div
          className="rounded-2xl p-5 flex items-center gap-5"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--c-accent), var(--c-purple))' }}
          >
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-[var(--c-text)] truncate">{name}</p>
            <p className="text-sm text-[var(--c-muted)] truncate">{email}</p>
            <span
              className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ background: 'var(--c-accent-dim)', color: 'var(--c-accent)' }}
            >
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Session info */}
      <div>
        <SectionHeading>Session</SectionHeading>
        <div
          className="rounded-2xl px-4"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <SettingRow label="Tenant" description="Your organisation's workspace identifier.">
            <span className="text-xs font-mono text-[var(--c-muted)]">
              {user?.tenant_id ? user.tenant_id.slice(0, 8) + '…' : '—'}
            </span>
          </SettingRow>
          <SettingRow label="Access level" description="Role assigned to this account.">
            <span className="text-xs font-semibold capitalize text-[var(--c-text)]">{role}</span>
          </SettingRow>
        </div>
      </div>

      {/* Danger zone */}
      <div>
        <SectionHeading>Danger Zone</SectionHeading>
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--c-red-dim)', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--c-text)]">Reset preferences</p>
              <p className="text-xs text-[var(--c-muted)] mt-0.5">
                Restore all appearance and notification settings to their defaults.
              </p>
            </div>
            <Button
              variant={confirmReset ? 'danger' : 'secondary'}
              size="sm"
              onClick={handleReset}
              onBlur={() => setConfirmReset(false)}
            >
              <RotateCcw size={13} />
              {confirmReset ? 'Confirm reset' : 'Reset'}
            </Button>
          </div>

          <div className="border-t border-[rgba(248,113,113,0.15)]" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--c-text)]">Sign out</p>
              <p className="text-xs text-[var(--c-muted)] mt-0.5">
                End your current session and return to the login screen.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={handleSignOut}>
              <LogOut size={13} />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('appearance')

  return (
    <AppShell>
      <div className="p-6 md:p-8" style={{ animation: 'page-slide-in 0.22s ease' }}>
      <div className="mx-auto max-w-2xl">

        {/* Tab navigation */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-8 w-fit"
          style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}
        >
          {TABS.map(({ id, label, icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{
                  background: active ? 'var(--c-surface)'   : 'transparent',
                  color:      active ? 'var(--c-text)'      : 'var(--c-muted)',
                  boxShadow:  active ? 'var(--shadow-card)'  : 'none',
                }}
              >
                {icon}
                {label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'appearance'    && <AppearanceTab    />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'account'       && <AccountTab       />}
      </div>
      </div>
    </AppShell>
  )
}
