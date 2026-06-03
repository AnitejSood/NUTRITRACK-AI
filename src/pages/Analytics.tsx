import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useMealsRange } from '@/hooks/useMeals'
import { useWaterRange } from '@/hooks/useWater'
import { useGoals } from '@/hooks/useGoals'
import { getLast7Days } from '@/lib/utils'

const DAYS = getLast7Days()
const START = DAYS[0]
const END = DAYS[DAYS.length - 1]

const DAY_LABELS = DAYS.map(d => {
  const date = new Date(d)
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
})

const CHARTS = [
  { key: 'calories' as const, label: 'Calories', color: '#FF6B35', unit: 'kcal' },
  { key: 'protein' as const, label: 'Protein', color: '#E91E8C', unit: 'g' },
  { key: 'carbs' as const, label: 'Carbs', color: '#FFE66D', unit: 'g' },
  { key: 'fat' as const, label: 'Fat', color: '#4ECDC4', unit: 'g' },
]

export default function Analytics() {
  const { data: meals = [] } = useMealsRange(START, END)
  const { data: waterLogs = [] } = useWaterRange(START, END)
  const { data: goals } = useGoals()

  // Aggregate per day
  const dailyData = useMemo(() => {
    return DAYS.map((day, idx) => {
      const dayMeals = meals.filter(m => m.timestamp.startsWith(day))
      const dayWater = waterLogs.filter(w => w.timestamp.startsWith(day))

      const calories = dayMeals.reduce((s, m) => s + (m.calories ?? 0), 0)
      const protein = dayMeals.reduce((s, m) => s + (m.protein ?? 0), 0)
      const carbs = dayMeals.reduce((s, m) => s + (m.carbs ?? 0), 0)
      const fat = dayMeals.reduce((s, m) => s + (m.fat ?? 0), 0)
      const water = dayWater.reduce((s, w) => s + (w.amount_ml ?? 0), 0)

      return { day: DAY_LABELS[idx], calories, protein, carbs, fat, water }
    })
  }, [meals, waterLogs])

  // Goal adherence
  const adherence = useMemo(() => {
    const total = dailyData.length
    if (!goals || total === 0) return { calories: 0, protein: 0, water: 0 }
    const calDays = dailyData.filter(d => d.calories >= goals.calories * 0.85).length
    const protDays = dailyData.filter(d => d.protein >= goals.protein * 0.85).length
    const watDays = dailyData.filter(d => d.water >= goals.water_target * 0.85).length
    return {
      calories: Math.round((calDays / total) * 100),
      protein: Math.round((protDays / total) * 100),
      water: Math.round((watDays / total) * 100),
    }
  }, [dailyData, goals])

  return (
    <div className="page-pad flex flex-col gap-5">
      <div className="mt-2">
        <h2 className="text-xl font-bold text-primary">Analytics</h2>
        <p className="text-xs text-secondary mt-0.5">Last 7 days overview</p>
      </div>

      {/* Today summary */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(233,30,140,0.1))',
        border: '1px solid rgba(255,107,53,0.2)',
      }}>
        <p className="section-label mb-3">Today's Summary</p>
        {(() => {
          const today = dailyData[dailyData.length - 1]
          return (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories', value: today?.calories ?? 0, unit: 'kcal', color: '#FF6B35' },
                { label: 'Protein', value: Math.round(today?.protein ?? 0), unit: 'g', color: '#E91E8C' },
                { label: 'Carbs', value: Math.round(today?.carbs ?? 0), unit: 'g', color: '#FFE66D' },
                { label: 'Water', value: Math.round((today?.water ?? 0) / 1000 * 10) / 10, unit: 'L', color: '#4ECDC4' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="rounded-2xl p-3" style={{ background: 'var(--overlay-soft)' }}>
                  <p className="text-[10px] text-secondary">{label}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color }}>{value}</p>
                  <p className="text-[10px] text-secondary">{unit}</p>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Goal Adherence */}
      <div className="card">
        <p className="section-label mb-4">7-Day Goal Adherence</p>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Calorie Goal', percent: adherence.calories, color: '#FF6B35' },
            { label: 'Protein Goal', percent: adherence.protein, color: '#E91E8C' },
            { label: 'Water Goal', percent: adherence.water, color: '#4ECDC4' },
          ].map(({ label, percent, color }) => (
            <div key={label}>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-medium text-primary">{label}</span>
                <span className="text-xs font-bold" style={{ color }}>{percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full" style={{ background: 'var(--overlay-medium)' }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${percent}%`, background: color, boxShadow: `0 0 8px ${color}66` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Charts */}
      {[...CHARTS, { key: 'water' as const, label: 'Water', color: '#4ECDC4', unit: 'ml' }].map(({ key, label, color, unit }) => (
        <div key={key} className="card">
          <p className="section-label mb-1">{label} Trend</p>
          <p className="text-xs text-secondary mb-4">Last 7 days ({unit})</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--overlay-soft)" />
              <XAxis dataKey="day" tick={{ fill: '#8A8A9A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A8A9A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text-primary)',
                  fontSize: 12,
                }}
              />
              {goals && (
                <Line
                  type="monotone"
                  dataKey={() => key === 'calories' ? goals.calories : key === 'protein' ? goals.protein : key === 'carbs' ? goals.carbs : key === 'fat' ? goals.fat : goals.water_target}
                  stroke="var(--overlay-medium)"
                  strokeDasharray="4 4"
                  dot={false}
                  name="Goal"
                />
              )}
              <Line
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2.5}
                dot={{ fill: color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: color }}
                name={label}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
