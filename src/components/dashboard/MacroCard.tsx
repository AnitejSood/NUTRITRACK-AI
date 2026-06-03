interface MacroCardProps {
  label: string
  consumed: number
  goal: number
  unit?: string
  color: string
  emoji?: string
}

export function MacroCard({ label, consumed, goal, unit = 'g', color, emoji }: MacroCardProps) {
  const percent = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0
  const remaining = Math.max(goal - consumed, 0)

  return (
    <div className="card flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-base">{emoji}</span>}
          <span className="text-xs font-semibold text-secondary uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-xs font-medium text-secondary">{Math.round(percent)}%</span>
      </div>

      {/* Numbers */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-bold text-primary">{Math.round(consumed)}</span>
        <span className="text-xs text-secondary">/ {Math.round(goal)}{unit}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percent}%`,
            background: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>

      {/* Remaining */}
      <p className="mt-2 text-[11px] text-secondary">
        {remaining > 0 ? `${Math.round(remaining)}${unit} remaining` : '✓ Goal reached!'}
      </p>
    </div>
  )
}
