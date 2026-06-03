import { Droplets, Plus } from 'lucide-react'
import { useLogWater } from '@/hooks/useWater'

const QUICK_AMOUNTS = [
  { label: '+1 Glass', ml: 250, icon: '🥛' },
  { label: '+2 Glasses', ml: 500, icon: '💧' },
  { label: '+1 Bottle', ml: 1000, icon: '🍶' },
]

interface WaterTrackerProps {
  consumed: number
  goal: number
}

export function WaterTracker({ consumed, goal }: WaterTrackerProps) {
  const logWater = useLogWater()
  const percent = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0
  const litersConsumed = (consumed / 1000).toFixed(1)
  const litersGoal = (goal / 1000).toFixed(1)

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: 'rgba(78,205,196,0.15)' }}>
            <Droplets className="h-4 w-4" style={{ color: '#4ECDC4' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Water Intake</p>
            <p className="text-xs text-secondary">{litersConsumed}L / {litersGoal}L</p>
          </div>
        </div>
        <span className="text-sm font-bold" style={{ color: '#4ECDC4' }}>{Math.round(percent)}%</span>
      </div>

      {/* Wave progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full mb-4"
        style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #4ECDC4, #44B3AA)',
            boxShadow: '0 0 12px rgba(78,205,196,0.4)',
          }}
        />
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        {QUICK_AMOUNTS.map(({ label, ml, icon }) => (
          <button
            key={ml}
            id={`water-${ml}ml`}
            onClick={() => logWater.mutate(ml)}
            disabled={logWater.isPending}
            className="flex-1 flex flex-col items-center gap-1 rounded-2xl py-2.5 text-center transition-all duration-150"
            style={{
              background: 'rgba(78,205,196,0.1)',
              border: '1px solid rgba(78,205,196,0.2)',
            }}
          >
            <span className="text-base">{icon}</span>
            <span className="text-[10px] font-semibold" style={{ color: '#4ECDC4' }}>{label}</span>
            <span className="text-[9px] text-secondary">{ml >= 1000 ? `${ml/1000}L` : `${ml}ml`}</span>
          </button>
        ))}

        {/* Custom amount */}
        <button
          id="water-custom"
          onClick={() => {
            const amt = parseInt(prompt('Enter amount in ml:') ?? '0', 10)
            if (amt > 0) logWater.mutate(amt)
          }}
          className="flex-1 flex flex-col items-center gap-1 rounded-2xl py-2.5"
          style={{ background: 'var(--overlay-soft)', border: '1px solid var(--border)' }}
        >
          <Plus className="h-4 w-4 text-secondary" />
          <span className="text-[10px] font-semibold text-secondary">Custom</span>
          <span className="text-[9px] text-secondary">ml</span>
        </button>
      </div>
    </div>
  )
}
