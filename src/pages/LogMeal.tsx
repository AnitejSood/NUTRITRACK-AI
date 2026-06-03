import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Check, Loader2, AlertCircle } from 'lucide-react'
import { parseFoodEntry, type FoodLogResponse } from '@/lib/gemini'
import { useLogMeal } from '@/hooks/useMeals'
import { cn } from '@/lib/utils'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

const MEAL_TYPES: { value: MealType; label: string; emoji: string; time: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅', time: '7–10 AM' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️', time: '12–3 PM' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙', time: '7–10 PM' },
  { value: 'snacks', label: 'Snacks', emoji: '🍎', time: 'Anytime' },
]

const EXAMPLE_INPUTS = [
  '2 aloo parathas with butter',
  '3 rotis and paneer butter masala',
  'rajma chawal',
  'chicken curry with rice',
  'dal makhani and naan',
  'chole bhature',
  'poha with chai',
]

export default function LogMeal() {
  const navigate = useNavigate()
  const logMeal = useLogMeal()

  const [mealType, setMealType] = useState<MealType>('lunch')
  const [input, setInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<FoodLogResponse | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleParse = async () => {
    if (!input.trim()) return
    setError('')
    setParsed(null)
    setParsing(true)
    try {
      const result = await parseFoodEntry(input)
      setParsed(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    if (!parsed) return
    setSaving(true)
    try {
      await logMeal.mutateAsync({
        meal_type: mealType,
        raw_input: input,
        calories: parsed.totals.calories,
        protein: parsed.totals.protein,
        carbs: parsed.totals.carbs,
        fat: parsed.totals.fat,
        confidence: parsed.confidence,
        items: parsed.foods.map(f => ({
          food_name: f.name,
          quantity: f.quantity,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
        })),
      })
      setSaved(true)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-pad flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-2 border border-subtle">
          <ArrowLeft className="h-4 w-4 text-secondary" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-primary">Log a Meal</h1>
          <p className="text-xs text-secondary">Describe what you ate in natural language</p>
        </div>
      </div>

      {/* Meal type selector */}
      <div>
        <p className="section-label mb-3">Meal Type</p>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map(({ value, label, emoji, time }) => (
            <button
              key={value}
              id={`meal-type-${value}`}
              onClick={() => setMealType(value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl py-3 text-center transition-all border',
                mealType === value
                  ? 'border-transparent text-white'
                  : 'border-subtle bg-surface-2 text-secondary hover:border-brand-orange'
              )}
              style={mealType === value ? {
                background: 'linear-gradient(135deg, #FF6B35, #E91E8C)',
              } : {}}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[10px] font-semibold">{label}</span>
              <span className="text-[9px] opacity-70">{time}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Food input */}
      <div className="card">
        <p className="section-label mb-3">What did you eat?</p>
        <textarea
          id="food-input"
          className="input-field min-h-[100px] resize-none"
          placeholder={`e.g. "${EXAMPLE_INPUTS[Math.floor(Math.random() * EXAMPLE_INPUTS.length)]}"`}
          value={input}
          onChange={e => setInput(e.target.value)}
        />

        {/* Example chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLE_INPUTS.slice(0, 4).map(ex => (
            <button
              key={ex}
              onClick={() => setInput(ex)}
              className="rounded-xl px-3 py-1 text-[10px] font-medium transition-all"
              style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)' }}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Analyze button */}
        <button
          id="analyze-btn"
          onClick={handleParse}
          disabled={!input.trim() || parsing}
          className="btn-gradient w-full mt-4 flex items-center justify-center gap-2"
        >
          {parsing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with AI...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Analyze with Gemini</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-3 rounded-2xl p-4" style={{ background: 'rgba(233,30,140,0.1)', border: '1px solid rgba(233,30,140,0.2)' }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#E91E8C' }} />
          <p className="text-xs" style={{ color: '#E91E8C' }}>{error}</p>
        </div>
      )}

      {/* Parsed result */}
      {parsed && (
        <div className="card animate-slide-up flex flex-col gap-4">
          {/* Confidence */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">AI Analysis</p>
            <span className="text-xs font-medium px-2.5 py-1 rounded-xl"
              style={{ background: 'rgba(78,205,196,0.15)', color: '#4ECDC4' }}>
              {parsed.confidence}% confident
            </span>
          </div>

          {/* Food items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-secondary">
                  <th className="text-left pb-2 font-medium">Food</th>
                  <th className="text-right pb-2 font-medium">Cal</th>
                  <th className="text-right pb-2 font-medium">P</th>
                  <th className="text-right pb-2 font-medium">C</th>
                  <th className="text-right pb-2 font-medium">F</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {parsed.foods.map((food, i) => (
                  <tr key={i} className="text-primary">
                    <td className="py-2.5 pr-2">
                      <p className="font-medium">{food.name}</p>
                      <p className="text-secondary text-[10px]">×{food.quantity}</p>
                    </td>
                    <td className="py-2.5 text-right font-semibold" style={{ color: '#FF6B35' }}>{food.calories}</td>
                    <td className="py-2.5 text-right">{food.protein}g</td>
                    <td className="py-2.5 text-right">{food.carbs}g</td>
                    <td className="py-2.5 text-right">{food.fat}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="rounded-2xl p-4 flex justify-between items-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(233,30,140,0.15))', border: '1px solid rgba(255,107,53,0.2)' }}>
            <div>
              <p className="text-xs text-secondary">Total Calories</p>
              <p className="text-2xl font-bold gradient-text">{parsed.totals.calories}</p>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-[10px] text-secondary">Protein</p>
                <p className="text-sm font-bold" style={{ color: '#FF6B35' }}>{parsed.totals.protein}g</p>
              </div>
              <div>
                <p className="text-[10px] text-secondary">Carbs</p>
                <p className="text-sm font-bold" style={{ color: '#E91E8C' }}>{parsed.totals.carbs}g</p>
              </div>
              <div>
                <p className="text-[10px] text-secondary">Fat</p>
                <p className="text-sm font-bold" style={{ color: '#FFE66D' }}>{parsed.totals.fat}g</p>
              </div>
            </div>
          </div>

          {/* Save / Re-analyze */}
          <div className="flex gap-3">
            <button id="reanalyze-btn" onClick={() => setParsed(null)} className="btn-ghost flex-1 text-sm">
              Re-enter
            </button>
            <button
              id="save-meal-btn"
              onClick={handleSave}
              disabled={saving || saved}
              className="btn-gradient flex-1 flex items-center justify-center gap-2"
            >
              {saved ? (
                <><Check className="h-4 w-4" /> Saved!</>
              ) : saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                'Save Meal'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
