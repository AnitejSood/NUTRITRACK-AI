import { useMemo } from 'react'
import { formatDate } from '@/lib/utils'
import { useGoals } from '@/hooks/useGoals'
import { useTodayMeals } from '@/hooks/useMeals'
import { useTodayWater } from '@/hooks/useWater'
import { ProgressRing } from '@/components/dashboard/ProgressRing'
import { MacroCard } from '@/components/dashboard/MacroCard'
import { MealTimeline } from '@/components/dashboard/MealTimeline'
import { WaterTracker } from '@/components/dashboard/WaterTracker'

export default function Dashboard() {
  const { data: goals } = useGoals()
  const { data: meals = [] } = useTodayMeals()
  const { data: water } = useTodayWater()

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.calories ?? 0),
        protein: acc.protein + (m.protein ?? 0),
        carbs: acc.carbs + (m.carbs ?? 0),
        fat: acc.fat + (m.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [meals])

  const waterConsumed = water?.total ?? 0

  return (
    <div className="page-pad flex flex-col gap-5">
      {/* Date */}
      <div className="mt-2">
        <p className="text-xs text-secondary">{formatDate(new Date())}</p>
        <h2 className="text-xl font-bold text-primary mt-0.5">Today's Progress</h2>
      </div>

      {/* ── Calorie Hero Card ─────────────────────────────── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(233,30,140,0.15))',
        border: '1px solid rgba(255,107,53,0.25)',
      }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-secondary mb-1">Calories Today</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold gradient-text">{Math.round(totals.calories)}</span>
              <span className="text-sm text-secondary">/ {goals?.calories ?? '—'} kcal</span>
            </div>
            <p className="text-xs text-secondary mt-1.5">
              {goals?.calories
                ? `${Math.max(goals.calories - Math.round(totals.calories), 0)} kcal remaining`
                : 'Set up your goals'}
            </p>
          </div>

          {/* Main calorie ring */}
          <ProgressRing
            value={totals.calories}
            max={goals?.calories ?? 2000}
            size={120}
            strokeWidth={10}
            color="#FF6B35"
            label="Calories"
            unit=" kcal"
            showCenter={false}
          />
        </div>
      </div>

      {/* ── Progress Rings Row ────────────────────────────── */}
      <div className="card">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-4">Macros & Water</p>
        <div className="flex items-start justify-around gap-2">
          <ProgressRing
            value={totals.protein}
            max={goals?.protein ?? 150}
            size={90}
            strokeWidth={8}
            color="#FF6B35"
            label="Protein"
            unit="g"
          />
          <ProgressRing
            value={totals.carbs}
            max={goals?.carbs ?? 250}
            size={90}
            strokeWidth={8}
            color="#E91E8C"
            label="Carbs"
            unit="g"
          />
          <ProgressRing
            value={totals.fat}
            max={goals?.fat ?? 65}
            size={90}
            strokeWidth={8}
            color="#FFE66D"
            label="Fat"
            unit="g"
          />
          <ProgressRing
            value={waterConsumed / 1000}
            max={(goals?.water_target ?? 2500) / 1000}
            size={90}
            strokeWidth={8}
            color="#4ECDC4"
            label="Water"
            unit="L"
          />
        </div>
      </div>

      {/* ── Macro Cards ───────────────────────────────────── */}
      <div className="flex gap-3">
        <MacroCard
          label="Protein"
          consumed={totals.protein}
          goal={goals?.protein ?? 150}
          unit="g"
          color="#FF6B35"
          emoji="🥩"
        />
        <MacroCard
          label="Carbs"
          consumed={totals.carbs}
          goal={goals?.carbs ?? 250}
          unit="g"
          color="#E91E8C"
          emoji="🍚"
        />
      </div>
      <div className="flex gap-3">
        <MacroCard
          label="Fat"
          consumed={totals.fat}
          goal={goals?.fat ?? 65}
          unit="g"
          color="#FFE66D"
          emoji="🧈"
        />
        <MacroCard
          label="Water"
          consumed={waterConsumed}
          goal={goals?.water_target ?? 2500}
          unit="ml"
          color="#4ECDC4"
          emoji="💧"
        />
      </div>

      {/* ── Water Tracker ─────────────────────────────────── */}
      <WaterTracker
        consumed={waterConsumed}
        goal={goals?.water_target ?? 2500}
      />

      {/* ── Meal Timeline ─────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-3">Today's Meals</p>
        <MealTimeline meals={meals} />
      </div>
    </div>
  )
}
