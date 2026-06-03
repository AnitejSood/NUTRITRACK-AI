import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Auth pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'

// Onboarding
import ProfileSetup from '@/pages/onboarding/ProfileSetup'

// App pages
import Dashboard from '@/pages/Dashboard'
import LogMeal from '@/pages/LogMeal'
import Analytics from '@/pages/Analytics'
import Insights from '@/pages/Insights'
import AskAI from '@/pages/AskAI'
import Settings from '@/pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Onboarding */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <ProfileSetup />
                  </ProtectedRoute>
                }
              />

              {/* Protected app routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Dashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/log-meal"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <LogMeal />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Analytics />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/insights"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Insights />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ask-ai"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <AskAI />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Settings />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
