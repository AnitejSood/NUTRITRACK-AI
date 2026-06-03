import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const location = useLocation()

  if (loading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center app-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-transparent"
            style={{ borderTopColor: '#FF6B35', borderRightColor: '#E91E8C' }} />
          <p className="text-secondary text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const isOnboardingPath = location.pathname === '/onboarding'

  if (profile && !profile.onboarding_complete && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />
  }

  if (profile && profile.onboarding_complete && isOnboardingPath) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
