import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const email = `${username.toLowerCase().trim()}@nutritrack.app`
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center app-bg px-5">
      {/* Logo */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #E91E8C)' }}>
          <img src="/pwa-192x192.png" alt="NutriTrack AI Logo" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold gradient-text">NUTRITRACK AI</h1>
        <p className="mt-1 text-sm text-secondary">INDIAN DIET · AI POWERED</p>
      </div>

      {/* Card */}
      <div className="glass w-full max-w-sm p-6 animate-slide-up">
        <h2 className="mb-6 text-xl font-bold text-primary">WELCOME BACK</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="login-username">USERNAME</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              className="input-field"
              placeholder="YOUR USERNAME"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="login-password">PASSWORD</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field pr-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl p-3 text-xs" style={{ background: 'rgba(233,30,140,0.1)', color: '#E91E8C' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button id="login-submit" type="submit" className="btn-gradient mt-1" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> SIGNING IN...
              </span>
            ) : 'SIGN IN'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-5 flex flex-col gap-3 text-center">
          <Link to="/forgot-password" className="text-xs text-secondary hover:text-brand-orange font-medium tracking-wide transition-colors">
            FORGOT PASSWORD?
          </Link>
          <p className="text-xs text-secondary font-medium tracking-wide">
            NO ACCOUNT?{' '}
            <Link to="/register" className="font-bold text-brand-orange hover:underline">
              REGISTER HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
