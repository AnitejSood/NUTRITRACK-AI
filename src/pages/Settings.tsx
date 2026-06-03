import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Target, Moon, Sun, Loader2, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useGoals, useUpsertGoals } from '@/hooks/useGoals'
import { calculateBMI, getBMICategory } from '@/lib/nutrition'
import { cn, titleCase } from '@/lib/utils'

export default function Settings() {
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const { data: goals } = useGoals()
  const upsertGoals = useUpsertGoals()
  const navigate = useNavigate()

  const [darkMode, setDarkMode] = useState(true)
  const [editGoals, setEditGoals] = useState(false)
  const [goalForm, setGoalForm] = useState({
    calories: goals?.calories?.toString() ?? '',
    protein: goals?.protein?.toString() ?? '',
    carbs: goals?.carbs?.toString() ?? '',
    fat: goals?.fat?.toString() ?? '',
    water_target: goals?.water_target?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('light')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleSaveGoals = async () => {
    setSaving(true)
    try {
      await upsertGoals.mutateAsync({
        calories: parseInt(goalForm.calories),
        protein: parseInt(goalForm.protein),
        carbs: parseInt(goalForm.carbs),
        fat: parseInt(goalForm.fat),
        water_target: parseInt(goalForm.water_target),
      })
      setSaved(true)
      setEditGoals(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const bmi = profile?.height && profile?.weight
    ? calculateBMI(profile.weight, profile.height)
    : null

  return (
    <div className="page-pad flex flex-col gap-5">
      <div className="mt-2">
        <h2 className="text-xl font-bold text-primary">Settings</h2>
        <p className="text-xs text-secondary mt-0.5">Manage your profile & preferences</p>
      </div>

      {/* Profile card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-3xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #E91E8C)' }}>
            {(profile?.name || profile?.username || 'U').trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-primary">{profile?.name}</p>
            <p className="text-xs text-secondary">@{profile?.username}</p>
            <p className="text-xs text-secondary mt-0.5">{profile?.phone}</p>
          </div>
        </div>

        {/* Physical stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Height', val: profile?.height ? `${profile.height}cm` : '—' },
            { label: 'Weight', val: profile?.weight ? `${profile.weight}kg` : '—' },
            { label: 'BMI', val: bmi ? `${bmi.toFixed(1)} ${getBMICategory(bmi)}` : '—' },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-2xl p-3 text-center" style={{ background: 'var(--overlay-soft)' }}>
              <p className="text-[10px] text-secondary">{label}</p>
              <p className="text-sm font-semibold text-primary mt-0.5">{val}</p>
            </div>
          ))}
        </div>

        {/* Goal & Activity */}
        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)' }}>
            <p className="text-[10px] text-secondary">Goal</p>
            <p className="text-xs font-semibold" style={{ color: '#FF6B35' }}>
              {profile?.goal ? titleCase(profile.goal) : '—'}
            </p>
          </div>
          <div className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(233,30,140,0.1)', border: '1px solid rgba(233,30,140,0.2)' }}>
            <p className="text-[10px] text-secondary">Activity</p>
            <p className="text-xs font-semibold" style={{ color: '#E91E8C' }}>
              {profile?.activity_level ? titleCase(profile.activity_level) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Nutrition Goals */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" style={{ color: '#FF6B35' }} />
            <p className="text-sm font-semibold text-primary">Nutrition Goals</p>
          </div>
          <button
            id="edit-goals-btn"
            onClick={() => {
              setEditGoals(!editGoals)
              if (!editGoals && goals) {
                setGoalForm({
                  calories: goals.calories.toString(),
                  protein: goals.protein.toString(),
                  carbs: goals.carbs.toString(),
                  fat: goals.fat.toString(),
                  water_target: goals.water_target.toString(),
                })
              }
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{ background: 'rgba(255,107,53,0.15)', color: '#FF6B35' }}
          >
            {editGoals ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editGoals ? (
          <div className="flex flex-col gap-3">
            {[
              { label: 'Daily Calories (kcal)', key: 'calories' },
              { label: 'Protein (g)', key: 'protein' },
              { label: 'Carbs (g)', key: 'carbs' },
              { label: 'Fat (g)', key: 'fat' },
              { label: 'Water Target (ml)', key: 'water_target' },
            ].map(({ label, key }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs text-secondary">{label}</label>
                <input
                  id={`goal-${key}`}
                  type="number"
                  className="input-field"
                  value={goalForm[key as keyof typeof goalForm]}
                  onChange={e => setGoalForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <button
              id="save-goals-btn"
              onClick={handleSaveGoals}
              disabled={saving}
              className="btn-gradient flex items-center justify-center gap-2 mt-1"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save Goals</>
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Calories', val: goals?.calories, unit: 'kcal', color: '#FF6B35' },
              { label: 'Protein', val: goals?.protein, unit: 'g', color: '#E91E8C' },
              { label: 'Carbs', val: goals?.carbs, unit: 'g', color: '#FFE66D' },
              { label: 'Fat', val: goals?.fat, unit: 'g', color: '#4ECDC4' },
              { label: 'Water', val: goals?.water_target, unit: 'ml', color: '#4ECDC4' },
            ].map(({ label, val, unit, color }) => (
              <div key={label} className="rounded-2xl p-3" style={{ background: 'var(--overlay-soft)' }}>
                <p className="text-[10px] text-secondary">{label}</p>
                <p className="text-base font-bold" style={{ color }}>{val ?? '—'}</p>
                <p className="text-[10px] text-secondary">{unit}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="card flex flex-col gap-3">
        <p className="text-sm font-semibold text-primary">Preferences</p>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="h-4 w-4" style={{ color: '#FF6B35' }} /> : <Sun className="h-4 w-4" style={{ color: '#FFE66D' }} />}
            <span className="text-sm text-primary">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <button
            id="theme-toggle"
            onClick={toggleDarkMode}
            className={cn(
              'relative h-6 w-11 rounded-full transition-all duration-300',
              darkMode ? '' : ''
            )}
            style={{ background: darkMode ? '#FF6B35' : 'var(--surface-3)' }}
          >
            <div className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300',
              darkMode ? 'left-5' : 'left-0.5'
            )} />
          </button>
        </div>
      </div>

      {/* Sign out */}
      <button
        id="signout-btn"
        onClick={handleSignOut}
        className="flex items-center justify-center gap-3 rounded-2xl p-4 transition-all"
        style={{ background: 'rgba(233,30,140,0.1)', border: '1px solid rgba(233,30,140,0.2)', color: '#E91E8C' }}
      >
        <LogOut className="h-4 w-4" />
        <span className="text-sm font-semibold">Sign Out</span>
      </button>

      <p className="text-center text-[10px] text-secondary pb-2">
        NutriTrack AI v1.0 · Indian Diet Tracker
      </p>
    </div>
  )
}
