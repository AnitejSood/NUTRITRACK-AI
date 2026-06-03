import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { calculateGoals } from '@/lib/nutrition'
import type { Gender, ActivityLevel, Goal } from '@/lib/nutrition'
import { cn } from '@/lib/utils'

type Step = 0 | 1 | 2 | 3 // personal | physical | goal | activity

interface FormData {
  age: string
  gender: Gender | ''
  height: string
  weight: string
  goal: Goal | ''
  activityLevel: ActivityLevel | ''
}

const GOALS = [
  { value: 'weight_loss', label: 'WEIGHT LOSS', emoji: '🔥', desc: 'BURN FAT, FEEL LIGHTER' },
  { value: 'maintenance', label: 'MAINTENANCE', emoji: '⚖️', desc: 'STAY AT CURRENT WEIGHT' },
  { value: 'muscle_gain', label: 'MUSCLE GAIN', emoji: '💪', desc: 'BUILD STRENGTH & SIZE' },
]

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'SEDENTARY', emoji: '🪑', desc: 'DESK JOB, LITTLE EXERCISE' },
  { value: 'lightly_active', label: 'LIGHTLY ACTIVE', emoji: '🚶', desc: '1–3 DAYS/WEEK EXERCISE' },
  { value: 'moderately_active', label: 'MODERATELY ACTIVE', emoji: '🏃', desc: '3–5 DAYS/WEEK EXERCISE' },
  { value: 'very_active', label: 'VERY ACTIVE', emoji: '🏋️', desc: 'HARD TRAINING DAILY' },
]

export default function ProfileSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    age: '',
    gender: '',
    height: '',
    weight: '',
    goal: '',
    activityLevel: '',
  })

  const update = (field: keyof FormData) => (val: string) =>
    setForm(f => ({ ...f, [field]: val }))

  const canNext = () => {
    if (step === 0) return form.age && form.gender
    if (step === 1) return form.height && form.weight
    if (step === 2) return form.goal
    if (step === 3) return form.activityLevel
    return false
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const goals = calculateGoals({
        weight: parseFloat(form.weight),
        height: parseFloat(form.height),
        age: parseInt(form.age),
        gender: form.gender as Gender,
        activityLevel: form.activityLevel as ActivityLevel,
        goal: form.goal as Goal,
      })

      // Update/insert profile (upsert) to handle cases where the signup trigger was delayed or failed
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
        name: user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
        age: parseInt(form.age),
        gender: form.gender,
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        goal: form.goal,
        activity_level: form.activityLevel,
        onboarding_complete: true,
      }, { onConflict: 'id' })

      if (profileError) throw profileError

      // Upsert nutrition goals
      const { error: goalsError } = await supabase.from('nutrition_goals').upsert(
        { ...goals, user_id: user.id },
        { onConflict: 'user_id' }
      )
      if (goalsError) throw goalsError

      // Invalidate React Query cache to reflect the onboarding completion immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['goals', user.id] })
      ])

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col app-bg px-5 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold gradient-text">SET UP PROFILE</h1>
        <p className="mt-1 text-sm text-secondary">HELP US PERSONALISE YOUR NUTRITION PLAN</p>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{
              background: step >= i
                ? 'linear-gradient(90deg, #FF6B35, #E91E8C)'
                : 'var(--overlay-medium)',
            }} />
        ))}
      </div>

      {/* Step 0: Personal */}
      {step === 0 && (
        <div className="animate-slide-up flex flex-col gap-4">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-primary">PERSONAL DETAILS</h2>
            <p className="text-xs text-secondary mt-0.5">USED TO CALCULATE YOUR BMR</p>
          </div>

          {/* Age */}
          <Field label="AGE" id="ob-age">
            <input id="ob-age" type="number" className="input-field" placeholder="25"
              min="10" max="100" value={form.age} onChange={e => update('age')(e.target.value)} />
          </Field>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">GENDER</label>
            <div className="flex gap-2">
              {(['male', 'female', 'other'] as Gender[]).map(g => (
                <button key={g} id={`ob-gender-${g}`}
                  onClick={() => update('gender')(g)}
                  className={cn(
                    'flex-1 rounded-2xl py-3 text-sm font-semibold uppercase transition-all border',
                    form.gender === g
                      ? 'text-white border-transparent'
                      : 'text-secondary border-subtle bg-surface-2 hover:border-brand-orange'
                  )}
                  style={form.gender === g ? { background: 'linear-gradient(135deg, #FF6B35, #E91E8C)' } : {}}>
                  {g === 'male' ? '♂ MALE' : g === 'female' ? '♀ FEMALE' : '⚧ OTHER'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Physical */}
      {step === 1 && (
        <div className="animate-slide-up flex flex-col gap-4">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-primary">PHYSICAL DETAILS</h2>
            <p className="text-xs text-secondary mt-0.5">USED TO CALCULATE YOUR BMI & TDEE</p>
          </div>

          <Field label="HEIGHT (CM)" id="ob-height">
            <input id="ob-height" type="number" className="input-field" placeholder="170"
              min="100" max="250" value={form.height} onChange={e => update('height')(e.target.value)} />
          </Field>

          <Field label="WEIGHT (KG)" id="ob-weight">
            <input id="ob-weight" type="number" className="input-field" placeholder="65"
              min="30" max="300" value={form.weight} onChange={e => update('weight')(e.target.value)} />
          </Field>

          {/* Preview BMI */}
          {form.height && form.weight && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)' }}>
              <p className="text-xs text-secondary">YOUR ESTIMATED BMI</p>
              <p className="text-2xl font-bold gradient-text mt-0.5">
                {(parseFloat(form.weight) / ((parseFloat(form.height) / 100) ** 2)).toFixed(1)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Goal */}
      {step === 2 && (
        <div className="animate-slide-up flex flex-col gap-4">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-primary">YOUR GOAL</h2>
            <p className="text-xs text-secondary mt-0.5">WE'LL ADJUST YOUR CALORIE TARGETS ACCORDINGLY</p>
          </div>
          <div className="flex flex-col gap-3">
            {GOALS.map(({ value, label, emoji, desc }) => (
              <button key={value} id={`ob-goal-${value}`}
                onClick={() => update('goal')(value)}
                className={cn(
                  'flex items-center gap-4 rounded-2xl p-4 text-left transition-all border',
                  form.goal === value
                    ? 'border-transparent'
                    : 'border-subtle bg-surface-2 hover:border-brand-orange'
                )}
                style={form.goal === value ? {
                  background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(233,30,140,0.2))',
                  border: '1px solid rgba(255,107,53,0.4)',
                } : {}}>
                <span className="text-3xl">{emoji}</span>
                <div>
                  <p className="font-semibold text-primary">{label}</p>
                  <p className="text-xs text-secondary">{desc}</p>
                </div>
                {form.goal === value && (
                  <div className="ml-auto h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ background: '#FF6B35' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Activity */}
      {step === 3 && (
        <div className="animate-slide-up flex flex-col gap-4">
          <div className="mb-2">
            <h2 className="text-lg font-bold text-primary">ACTIVITY LEVEL</h2>
            <p className="text-xs text-secondary mt-0.5">DETERMINES YOUR DAILY CALORIE BURN</p>
          </div>
          <div className="flex flex-col gap-3">
            {ACTIVITY_LEVELS.map(({ value, label, emoji, desc }) => (
              <button key={value} id={`ob-activity-${value}`}
                onClick={() => update('activityLevel')(value)}
                className={cn(
                  'flex items-center gap-4 rounded-2xl p-4 text-left transition-all border',
                  form.activityLevel === value
                    ? 'border-transparent'
                    : 'border-subtle bg-surface-2 hover:border-brand-orange'
                )}
                style={form.activityLevel === value ? {
                  background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(233,30,140,0.2))',
                  border: '1px solid rgba(255,107,53,0.4)',
                } : {}}>
                <span className="text-3xl">{emoji}</span>
                <div>
                  <p className="font-semibold text-primary">{label}</p>
                  <p className="text-xs text-secondary">{desc}</p>
                </div>
                {form.activityLevel === value && (
                  <div className="ml-auto h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ background: '#FF6B35' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-2xl p-3 text-xs" style={{ background: 'rgba(233,30,140,0.1)', color: '#E91E8C' }}>
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button id="ob-back" onClick={() => setStep(s => (s - 1) as Step)}
            className="btn-ghost flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> BACK
          </button>
        )}
        {step < 3 ? (
          <button id="ob-next" onClick={() => setStep(s => (s + 1) as Step)}
            disabled={!canNext()}
            className="btn-gradient flex-1 flex items-center justify-center gap-2">
            CONTINUE <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button id="ob-finish" onClick={handleFinish}
            disabled={!canNext() || saving}
            className="btn-gradient flex-1 flex items-center justify-center gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> SETTING UP...</>
            ) : (
              <>🚀 START TRACKING</>
            )}
          </button>
        )}
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
