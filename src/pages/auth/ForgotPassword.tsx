import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Step = 'username' | 'phone' | 'password' | 'done'

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Verify username exists
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await supabase.rpc('get_phone_by_username', {
        p_username: username.toLowerCase().trim(),
      })
      if (!data) throw new Error('No account found with this username.')
      setStep('phone')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify phone number
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: storedPhone } = await supabase.rpc('get_phone_by_username', {
        p_username: username.toLowerCase().trim(),
      })
      // Normalize and compare (strip spaces and dashes)
      const normalize = (p: string) => p.replace(/[\s\-+]/g, '')
      if (!storedPhone || normalize(storedPhone) !== normalize(phone)) {
        throw new Error('Phone number does not match our records.')
      }
      setStep('password')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset password
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const { data, error: resetError } = await supabase.rpc('reset_password_by_username_and_phone', {
        p_username: username.toLowerCase().trim(),
        p_phone: phone.trim(),
        p_new_password: newPassword,
      })

      if (resetError) throw resetError
      if (!data) throw new Error('Password reset failed. Please verify your details.')

      setStep('done')
    } catch (err: any) {
      setError(err.message || 'An error occurred during password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center app-bg px-5">
      <div className="w-full max-w-sm">
        {/* Back */}
        <Link to="/login" className="mb-6 flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary uppercase tracking-wide transition-colors">
          <ArrowLeft className="h-4 w-4" /> BACK TO LOGIN
        </Link>

        <div className="glass p-6 animate-slide-up">
          {step === 'done' ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'rgba(78,205,196,0.15)' }}>
                <Check className="h-7 w-7" style={{ color: '#4ECDC4' }} />
              </div>
              <h2 className="text-lg font-bold text-primary">PASSWORD UPDATED!</h2>
              <p className="text-sm text-secondary font-medium tracking-wide">YOUR PASSWORD HAS BEEN CHANGED SUCCESSFULLY.</p>
              <Link to="/login" className="btn-gradient w-full text-center block mt-2">
                SIGN IN NOW
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-primary">RESET PASSWORD</h2>
                <p className="mt-1 text-xs text-secondary font-medium tracking-wide">
                  {step === 'username' && 'ENTER YOUR USERNAME TO CONTINUE'}
                  {step === 'phone' && 'VERIFY WITH YOUR REGISTERED PHONE NUMBER'}
                  {step === 'password' && 'SET YOUR NEW PASSWORD'}
                </p>
              </div>

              {/* Step indicators */}
              <div className="mb-5 flex gap-2">
                {(['username', 'phone', 'password'] as Step[]).map((s, i) => (
                  <div key={s} className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      background: ['username', 'phone', 'password'].indexOf(step) >= i
                        ? 'linear-gradient(90deg, #FF6B35, #E91E8C)'
                        : 'var(--overlay-medium)',
                    }} />
                ))}
              </div>

              {/* Step 1: Username */}
              {step === 'username' && (
                <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="fp-username">USERNAME</label>
                    <input id="fp-username" type="text" className="input-field"
                      placeholder="YOUR_USERNAME"
                      value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  {error && <ErrorBox msg={error} />}
                  <button id="fp-username-submit" type="submit" className="btn-gradient" disabled={loading}>
                    {loading ? <LoadingText text="CHECKING..." /> : 'CONTINUE'}
                  </button>
                </form>
              )}

              {/* Step 2: Phone */}
              {step === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="fp-phone">REGISTERED PHONE NUMBER</label>
                    <input id="fp-phone" type="tel" className="input-field"
                      placeholder="+91 98765 43210"
                      value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                  {error && <ErrorBox msg={error} />}
                  <button id="fp-phone-submit" type="submit" className="btn-gradient" disabled={loading}>
                    {loading ? <LoadingText text="VERIFYING..." /> : 'VERIFY'}
                  </button>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 'password' && (
                <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="fp-newpass">NEW PASSWORD</label>
                    <input id="fp-newpass" type="password" className="input-field"
                      placeholder="MIN 6 CHARACTERS"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="fp-confirm">CONFIRM PASSWORD</label>
                    <input id="fp-confirm" type="password" className="input-field"
                      placeholder="REPEAT PASSWORD"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                  {error && <ErrorBox msg={error} />}
                  <button id="fp-reset-submit" type="submit" className="btn-gradient" disabled={loading}>
                    {loading ? <LoadingText text="UPDATING..." /> : 'UPDATE PASSWORD'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl p-3 text-xs" style={{ background: 'rgba(233,30,140,0.1)', color: '#E91E8C' }}>
      {msg}
    </div>
  )
}

function LoadingText({ text }: { text: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> {text}
    </span>
  )
}
