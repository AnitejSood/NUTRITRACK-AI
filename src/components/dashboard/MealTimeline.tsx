import { Trash2 } from 'lucide-react'
import type { Meal } from '@/hooks/useMeals'
import { useDeleteMeal } from '@/hooks/useMeals'
import { formatTime, getMealEmoji, getMealLabel } from '@/lib/utils'

export function MealTimeline({ meals }: { meals: Meal[] }) {
  const deleteMeal = useDeleteMeal()

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-4xl">🍽️</span>
        <p className="text-sm font-medium text-primary">No meals logged yet</p>
        <p className="text-xs text-secondary">Tap the + button to log your first meal</p>
      </div>
    )
  }

  // Group by meal type
  const grouped = meals.reduce<Record<string, Meal[]>>((acc, meal) => {
    if (!acc[meal.meal_type]) acc[meal.meal_type] = []
    acc[meal.meal_type].push(meal)
    return acc
  }, {})

  const order = ['breakfast', 'lunch', 'snacks', 'dinner']
  const types = order.filter(t => grouped[t])

  return (
    <div className="flex flex-col gap-4">
      {types.map(type => (
        <div key={type}>
          {/* Meal type header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getMealEmoji(type)}</span>
            <span className="text-sm font-semibold text-primary">{getMealLabel(type)}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Meals in this category */}
          <div className="flex flex-col gap-2">
            {grouped[type].map(meal => (
              <div key={meal.id} className="card group relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-secondary mb-1">{formatTime(meal.timestamp)}</p>
                    <p className="text-sm font-medium text-primary truncate pr-4">
                      {meal.raw_input}
                    </p>
                    {/* Food items */}
                    {meal.meal_items && meal.meal_items.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {meal.meal_items.map((item, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-lg"
                            style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35' }}
                          >
                            {item.food_name} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Macro summary */}
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    <span className="text-base font-bold text-primary">{meal.calories}</span>
                    <span className="text-[10px] text-secondary">kcal</span>
                  </div>
                </div>

                {/* Macros row */}
                <div className="mt-3 flex gap-3">
                  <MacroPill label="P" value={meal.protein} color="#FF6B35" />
                  <MacroPill label="C" value={meal.carbs} color="#E91E8C" />
                  <MacroPill label="F" value={meal.fat} color="#4ECDC4" />
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteMeal.mutate(meal.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-xl"
                  style={{ background: 'var(--overlay-medium)' }}
                  aria-label="Delete meal"
                >
                  <Trash2 className="h-3.5 w-3.5 text-secondary" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
      <span className="text-[10px] text-secondary">{Math.round(value)}g</span>
    </div>
  )
}
