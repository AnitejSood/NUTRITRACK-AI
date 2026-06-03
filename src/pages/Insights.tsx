import { useState } from 'react'
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react'
import { useTodayInsight, useSaveInsight } from '@/hooks/useInsights'
import { useTodayMeals } from '@/hooks/useMeals'
import { useTodayWater } from '@/hooks/useWater'
import { useGoals } from '@/hooks/useGoals'
import { generateDailyInsights } from '@/lib/gemini'
import { todayISO } from '@/lib/utils'

export default function Insights() {
  const { data: existingInsight } = useTodayInsight()
  const { data: meals = [] } = useTodayMeals()
  const { data: water } = useTodayWater()
  const { data: goals } = useGoals()
  const saveInsight = useSaveInsight()

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [localInsight, setLocalInsight] = useState<import('@/hooks/useInsights').DailyInsight | null>(null)

  const insight = localInsight ?? existingInsight

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const handleGenerate = async () => {
    if (!goals) return
    setError('')
    setGenerating(true)
    try {
      const result = await generateDailyInsights({
        calorieTarget: goals.calories,
        proteinTarget: goals.protein,
        carbsTarget: goals.carbs,
        fatTarget: goals.fat,
        waterTarget: goals.water_target,
        caloriesConsumed: totals.calories,
        proteinConsumed: totals.protein,
        carbsConsumed: totals.carbs,
        fatConsumed: totals.fat,
        waterConsumed: water?.total ?? 0,
      })

      const insightData = {
        insight_date: todayISO(),
        summary: result.summary,
        protein_analysis: result.protein_analysis,
        water_analysis: result.water_analysis,
        recommendations: result.recommendations,
      }

      await saveInsight.mutateAsync(insightData)
      setLocalInsight({
        id: crypto.randomUUID(),
        user_id: '',
        created_at: new Date().toISOString(),
        ...insightData,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="page-pad flex flex-col gap-5">
      <div className="mt-2">
        <h2 className="text-xl font-bold text-primary">Daily Insights</h2>
        <p className="text-xs text-secondary mt-0.5">AI-powered analysis of your nutrition</p>
      </div>

      {/* Today's stats quick view */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(233,30,140,0.1))',
        border: '1px solid rgba(255,107,53,0.2)',
      }}>
        <p className="section-label mb-3">Today at a Glance</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Calories', val: totals.calories, goal: goals?.calories, unit: 'kcal', color: '#FF6B35' },
            { label: 'Protein', val: Math.round(totals.protein), goal: goals?.protein, unit: 'g', color: '#E91E8C' },
            { label: 'Water', val: Math.round((water?.total ?? 0) / 100) / 10, goal: goals ? goals.water_target / 1000 : undefined, unit: 'L', color: '#4ECDC4' },
            { label: 'Meals', val: meals.length, unit: 'logged', color: '#FFE66D' },
          ].map(({ label, val, goal, unit, color }) => (
            <div key={label} className="rounded-2xl p-3" style={{ background: 'var(--overlay-soft)' }}>
              <p className="text-[10px] text-secondary">{label}</p>
              <p className="text-xl font-bold" style={{ color }}>{val}</p>
              <p className="text-[10px] text-secondary">{goal ? `/ ${goal} ${unit}` : unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        id="generate-insight-btn"
        onClick={handleGenerate}
        disabled={generating || !goals || meals.length === 0}
        className="btn-gradient flex items-center justify-center gap-2"
      >
        {generating ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generating insights...</>
        ) : insight ? (
          <><RefreshCw className="h-4 w-4" /> Regenerate Insights</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Generate Today's Insights</>
        )}
      </button>

      {!goals && (
        <p className="text-xs text-center text-secondary">Complete your profile setup to generate insights.</p>
      )}
      {meals.length === 0 && goals && (
        <p className="text-xs text-center text-secondary">Log some meals today first to get personalized insights.</p>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl p-4 text-xs" style={{ background: 'rgba(233,30,140,0.1)', color: '#E91E8C' }}>
          {error}
        </div>
      )}

      {/* Insight cards */}
      {insight && (
        <div className="flex flex-col gap-4 animate-slide-up">
          <InsightCard
            icon="📊"
            title="Summary"
            content={insight.summary}
            color="#FF6B35"
          />
          <InsightCard
            icon="🥩"
            title="Protein Analysis"
            content={insight.protein_analysis}
            color="#E91E8C"
          />
          <InsightCard
            icon="💧"
            title="Water Analysis"
            content={insight.water_analysis}
            color="#4ECDC4"
          />
          <InsightCard
            icon="💡"
            title="Recommendations"
            content={insight.recommendations}
            color="#FFE66D"
            isHighlight
          />
        </div>
      )}
    </div>
  )
}

function InsightCard({
  icon, title, content, color, isHighlight,
}: {
  icon: string; title: string; content: string | null | undefined; color: string; isHighlight?: boolean
}) {
  if (!content) return null

  return (
    <div className="card" style={isHighlight ? {
      background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(233,30,140,0.1))',
      border: '1px solid rgba(255,107,53,0.2)',
    } : {}}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{ background: `${color}20` }}>
          <span className="text-lg">{icon}</span>
        </div>
        <p className="text-sm font-semibold text-primary">{title}</p>
      </div>
      <p className="text-sm text-secondary leading-relaxed">{content}</p>
    </div>
  )
}
