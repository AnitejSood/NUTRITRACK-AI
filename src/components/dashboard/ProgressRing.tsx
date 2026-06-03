import { useEffect, useRef, useState } from 'react'

interface ProgressRingProps {
  value: number           // consumed amount
  max: number             // goal amount
  size?: number           // px
  strokeWidth?: number
  color: string           // hex or css color
  label: string
  unit?: string
  showCenter?: boolean
}

export function ProgressRing({
  value,
  max,
  size = 110,
  strokeWidth = 9,
  color,
  label,
  unit = '',
  showCenter = true,
}: ProgressRingProps) {
  const [animated, setAnimated] = useState(false)
  const ref = useRef<SVGCircleElement>(null)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percent = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - (animated ? percent : 0))
  const isOver = value > max

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col items-center gap-1.5 w-full min-w-0">
      <div className="relative w-full aspect-square" style={{ maxWidth: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            ref={ref}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isOver ? '#4ECDC4' : color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 6px ${isOver ? '#4ECDC4' : color}66)`,
            }}
          />
        </svg>

        {/* Center label */}
        {showCenter && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
            <span className="text-sm sm:text-base md:text-lg font-bold leading-none text-primary truncate max-w-full">
              {Math.round(value)}
            </span>
            {unit && (
              <span className="text-[8px] sm:text-[10px] text-secondary mt-0.5 truncate max-w-full">{unit}</span>
            )}
          </div>
        )}
      </div>

      {/* Ring label */}
      <div className="text-center w-full min-w-0">
        <p className="text-xs font-semibold text-primary truncate">{label}</p>
        <p className="text-[10px] text-secondary truncate">of {Math.round(max)}{unit}</p>
      </div>
    </div>
  )
}
