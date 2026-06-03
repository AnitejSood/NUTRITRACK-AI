import { useState, useMemo } from 'react'
import { Brain, RefreshCw, Loader2, Utensils } from 'lucide-react'
import { getMealRecommendation, type MealRecommendation } from '@/lib/gemini'
import { useTodayMeals } from '@/hooks/useMeals'
import { useGoals } from '@/hooks/useGoals'

export default function AskAI() {
  const { data: meals = [] } = useTodayMeals()
  const { data: goals } = useGoals()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recommendation, setRecommendation] = useState<MealRecommendation | null>(null)

  const totals = useMemo(() => meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ), [meals])

  const remaining = useMemo(() => ({
    calories: Math.max((goals?.calories ?? 2000) - totals.calories, 0),
    protein: Math.max((goals?.protein ?? 150) - totals.protein, 0),
    carbs: Math.max((goals?.carbs ?? 250) - totals.carbs, 0),
    fat: Math.max((goals?.fat ?? 65) - totals.fat, 0),
  }), [totals, goals])

  const handleGetRecommendation = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await getMealRecommendation(remaining)
      setRecommendation(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-pad flex flex-col gap-5">
      {/* Header */}
      <div className="mt-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #E91E8C)' }}>
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Ask AI What To Eat</h2>
            <p className="text-xs text-secondary">Get personalised Indian meal suggestions</p>
          </div>
        </div>
      </div>

      {/* Remaining macros */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(233,30,140,0.1))',
        border: '1px solid rgba(255,107,53,0.2)',
      }}>
        <p className="section-label mb-3">Remaining Today</p>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
          {[
            { label: 'Calories', val: Math.round(remaining.calories), unit: 'kcal', color: '#FF6B35' },
            { label: 'Protein', val: Math.round(remaining.protein), unit: 'g', color: '#E91E8C' },
            { label: 'Carbs', val: Math.round(remaining.carbs), unit: 'g', color: '#FFE66D' },
            { label: 'Fat', val: Math.round(remaining.fat), unit: 'g', color: '#4ECDC4' },
          ].map(({ label, val, unit, color }) => (
            <div key={label} className="rounded-2xl py-2.5 px-1 sm:p-3" style={{ background: 'var(--overlay-soft)' }}>
              <p className="text-[10px] text-secondary">{label}</p>
              <p className="text-base sm:text-lg font-bold" style={{ color }}>{val}</p>
              <p className="text-[9px] text-secondary">{unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Context message */}
      <div className="glass p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">🤖</span>
          <div>
            <p className="text-sm font-medium text-primary mb-1">Your AI Nutrition Coach</p>
            <p className="text-xs text-secondary leading-relaxed">
              Based on your remaining macros, I'll recommend a realistic North Indian meal to help you hit your daily goals. Meals are chosen from common, affordable options like roti, dal, paneer, and rajma.
            </p>
          </div>
        </div>
      </div>

      {/* Get recommendation button */}
      <button
        id="get-recommendation-btn"
        onClick={handleGetRecommendation}
        disabled={loading || !goals}
        className="btn-gradient flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Finding the perfect meal...</>
        ) : recommendation ? (
          <><RefreshCw className="h-4 w-4" /> Get Different Suggestion</>
        ) : (
          <><Utensils className="h-4 w-4" /> Suggest a Meal</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-2xl p-4 text-xs" style={{ background: 'rgba(233,30,140,0.1)', color: '#E91E8C' }}>
          {error}
        </div>
      )}

      {/* Recommendation card */}
      {recommendation && (
        <div className="animate-slide-up flex flex-col gap-4">
          {/* Main recommendation */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(233,30,140,0.12))',
            border: '1px solid rgba(255,107,53,0.3)',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🍛</span>
              <div>
                <p className="text-xs text-secondary">AI Recommends</p>
                <h3 className="text-base font-bold text-primary">{recommendation.meal}</h3>
              </div>
            </div>

            {/* Macros grid */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4 text-center">
              {[
                { label: 'Calories', val: recommendation.calories, unit: 'kcal', color: '#FF6B35' },
                { label: 'Protein', val: recommendation.protein, unit: 'g', color: '#E91E8C' },
                { label: 'Carbs', val: recommendation.carbs, unit: 'g', color: '#FFE66D' },
                { label: 'Fat', val: recommendation.fat, unit: 'g', color: '#4ECDC4' },
              ].map(({ label, val, unit, color }) => (
                <div key={label} className="rounded-2xl py-2.5 px-1 sm:p-2.5" style={{ background: 'var(--overlay-medium)' }}>
                  <p className="text-[9px] text-secondary">{label}</p>
                  <p className="text-sm sm:text-base font-bold" style={{ color }}>{val}</p>
                  <p className="text-[9px] text-secondary">{unit}</p>
                </div>
              ))}
            </div>

            {/* Reason */}
            <div className="rounded-2xl p-3" style={{ background: 'var(--overlay-soft)' }}>
              <p className="text-[10px] font-semibold text-secondary uppercase tracking-wide mb-1">Why this meal?</p>
              <p className="text-xs text-secondary leading-relaxed">{recommendation.reason}</p>
            </div>
          </div>

          {/* How close will you get? */}
          <div className="card">
            <p className="section-label mb-3">After This Meal</p>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Calories', current: totals.calories, add: recommendation.calories, goal: goals?.calories ?? 2000, color: '#FF6B35' },
                { label: 'Protein', current: totals.protein, add: recommendation.protein, goal: goals?.protein ?? 150, color: '#E91E8C' },
              ].map(({ label, current, add, goal, color }) => {
                const after = current + add
                const pct = Math.min((after / goal) * 100, 100)
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-primary">{label}</span>
                      <span className="text-xs font-semibold" style={{ color }}>{Math.round(after)} / {goal}</span>
                    </div>
                    <div className="h-2 w-full rounded-full" style={{ background: 'var(--overlay-medium)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}66` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
