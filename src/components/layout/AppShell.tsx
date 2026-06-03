import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BarChart3, Sparkles, Brain, Settings, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useProfile } from '@/hooks/useProfile'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/insights', icon: Sparkles, label: 'Insights' },
  { to: '/ask-ai', icon: Brain, label: 'Ask AI' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { data: profile } = useProfile()

  return (
    <div className="relative min-h-screen app-bg">
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 app-header">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <p className="text-xs text-secondary">Good {getGreeting()}</p>
            <h1 className="text-base font-bold text-primary truncate max-w-[200px]">
              {profile?.name || profile?.username || 'Nutri Tracker'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #E91E8C)' }}>
              <span className="text-xs font-bold text-white">
                {(profile?.name || profile?.username || 'U').trim().charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-md mx-auto">
        {children}
      </main>

      {/* FAB — Log Meal */}
      <button
        id="fab-log-meal"
        onClick={() => navigate('/log-meal')}
        className="fab"
        aria-label="Log meal"
      >
        <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
      </button>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              id={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all duration-200',
                  isActive
                    ? 'text-brand-orange'
                    : 'text-secondary hover:text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-lg')}
                    style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(255,107,53,0.6))' } : {}}
                  />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
