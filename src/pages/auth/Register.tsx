import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const email = `${form.username.toLowerCase().trim()}@nutritrack.app`

      // Pass username/name/phone as metadata — the DB trigger handle_new_user()
      // will auto-create the profiles row (SECURITY DEFINER bypasses RLS)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            username: form.username.toLowerCase().trim(),
            name: form.fullName.trim(),
            phone: form.phone.trim(),
          },
        },
      })
      if (signUpError) throw signUpError

      if (!data.user?.id) throw new Error('User creation failed. Try again.')

      navigate('/onboarding')
    } catch (err: any) {
      if (err.message?.includes('profiles_username_key') || err.message?.includes('unique')) {
        setError('Username already taken. Please choose another.')
      } else if (err.message?.includes('already registered')) {
        setError('This username is already registered.')
      } else {
        setError(err.message ?? 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center app-bg px-5 py-10">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #E91E8C)' }}>
          <span className="text-2xl">🥗</span>
        </div>
        <h1 className="text-xl font-bold gradient-text">CREATE ACCOUNT</h1>
        <p className="mt-1 text-xs text-secondary">START YOUR NUTRITION JOURNEY</p>
      </div>

      {/* Card */}
      <div className="glass w-full max-w-sm p-6 animate-slide-up">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Full Name */}
          <Field label="FULL NAME" id="reg-name">
            <input id="reg-name" type="text" className="input-field" placeholder="PRIYA SHARMA"
              value={form.fullName} onChange={update('fullName')} required />
          </Field>

          {/* Username */}
          <Field label="USERNAME" id="reg-username">
            <input id="reg-username" type="text" className="input-field" placeholder="YOUR USERNAME"
              value={form.username} onChange={update('username')} required
              pattern="[a-zA-Z0-9_]+" title="Only letters, numbers, and underscores" />
          </Field>

          {/* Phone */}
          <Field label="PHONE NUMBER" id="reg-phone">
            <input id="reg-phone" type="tel" className="input-field" placeholder="+91 98765 43210"
              value={form.phone} onChange={update('phone')} required />
          </Field>

          {/* Password */}
          <Field label="PASSWORD" id="reg-password">
            <div className="relative">
              <input id="reg-password" type={showPass ? 'text' : 'password'}
                className="input-field pr-10" placeholder="MIN 6 CHARACTERS"
                value={form.password} onChange={update('password')} required minLength={6} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {/* Confirm Password */}
          <Field label="CONFIRM PASSWORD" id="reg-confirm">
            <input id="reg-confirm" type="password" className="input-field" placeholder="REPEAT PASSWORD"
              value={form.confirmPassword} onChange={update('confirmPassword')} required />
          </Field>

          {/* Error */}
          {error && (
            <div className="rounded-2xl p-3 text-xs" style={{ background: 'rgba(233,30,140,0.1)', color: '#E91E8C' }}>
              {error}
            </div>
          )}

          <button id="reg-submit" type="submit" className="btn-gradient mt-1" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> CREATING ACCOUNT...
              </span>
            ) : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-secondary font-medium tracking-wide">
          ALREADY HAVE AN ACCOUNT?{' '}
          <Link to="/login" className="font-bold text-brand-orange hover:underline">SIGN IN</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-secondary uppercase tracking-wider" htmlFor={id}>{label}</label>
      {children}
    </div>
  )
}
