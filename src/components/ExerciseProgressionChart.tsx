import { useState, useMemo } from 'react'
import type { ExerciseRecord } from '@/types/exercise'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar, Layers, Eye, EyeOff } from 'lucide-react'

export type MetricType = 'weightLb' | 'reps' | 'volume'

export interface SessionSetMeta {
  weightLb: number
  reps: number
  volume: number
  weightKg?: number
  isWarmup: boolean
}

export interface ChartSetPoint {
  setLabel: string
  setNumber: number
  meta: Record<string, SessionSetMeta>
  [date: string]: number | string | Record<string, SessionSetMeta>
}

// Vibrant high-contrast palette for recent sessions
const RECENT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
]

const MUTED_COLOR = '#94a3b8' // slate-400

interface ExerciseProgressionChartProps {
  records: ExerciseRecord[]
}

export function ExerciseProgressionChart({ records }: ExerciseProgressionChartProps) {
  // 1. Calculate exercise list sorted by frequency
  const exerciseOptions = useMemo(() => {
    const counts = new Map<string, number>()
    records.forEach((r) => {
      if (r.Exercise) {
        counts.set(r.Exercise, (counts.get(r.Exercise) || 0) + 1)
      }
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]) // most frequent first
      .map(([name, count]) => ({ name, count }))
  }, [records])

  const defaultExercise = exerciseOptions[0]?.name || ''
  const [selectedExercise, setSelectedExercise] = useState<string>(defaultExercise)
  const [activeMetric, setActiveMetric] = useState<MetricType>('weightLb')
  const [sessionRange, setSessionRange] = useState<'last5' | 'all'>('last5')
  const [hiddenSessions, setHiddenSessions] = useState<Set<string>>(new Set())

  // Ensure selectedExercise stays valid if records change
  const currentExercise = selectedExercise || defaultExercise

  // 2. Filter records for selected exercise & group by date
  const { chartData, sessionDates, maxSets } = useMemo(() => {
    const matching = records.filter(
      (r) => r.Exercise?.trim().toLowerCase() === currentExercise.trim().toLowerCase()
    )

    // Group sets by date
    const dateGroups = new Map<string, ExerciseRecord[]>()
    matching.forEach((r) => {
      const date = r['Date Lifted']
      if (!date) return
      if (!dateGroups.has(date)) {
        dateGroups.set(date, [])
      }
      dateGroups.get(date)!.push(r)
    })

    // Sort dates chronologically ascending
    const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => a.localeCompare(b))

    // Filter by sessionRange (last 5 vs all)
    const activeDates =
      sessionRange === 'last5' ? sortedDates.slice(-5) : sortedDates

    // Determine max set count among active sessions
    let maxS = 0
    activeDates.forEach((date) => {
      const setsCount = dateGroups.get(date)?.length || 0
      if (setsCount > maxS) maxS = setsCount
    })

    // Pivot data ordered by setIndex (Set 1..Set N)
    const points: ChartSetPoint[] = []
    for (let setIdx = 1; setIdx <= maxS; setIdx++) {
      const point: ChartSetPoint = {
        setLabel: `Set ${setIdx}`,
        setNumber: setIdx,
        meta: {},
      }

      activeDates.forEach((date) => {
        const sessionSets = dateGroups.get(date) || []
        const currentSet = sessionSets[setIdx - 1]

        if (currentSet) {
          const weightLb = Number(currentSet['Weight (lb)']) || 0
          const weightKg = Number(currentSet['Weight (kg)']) || 0
          const reps = Number(currentSet.Reps) || 0
          const volume = Math.round(weightLb * reps)
          const isWarmup = Number(currentSet.Warmup) === 1

          point.meta[date] = {
            weightLb,
            weightKg,
            reps,
            volume,
            isWarmup,
          }

          let metricVal = 0
          if (activeMetric === 'weightLb') metricVal = weightLb
          else if (activeMetric === 'reps') metricVal = reps
          else if (activeMetric === 'volume') metricVal = volume

          point[date] = metricVal
        }
      })

      points.push(point)
    }

    return {
      chartData: points,
      sessionDates: activeDates,
      maxSets: maxS,
    }
  }, [records, currentExercise, sessionRange, activeMetric])

  // Reset hidden sessions when switching exercise or session range
  const handleExerciseChange = (exercise: string) => {
    setSelectedExercise(exercise)
    setHiddenSessions(new Set())
  }

  const handleRangeChange = (range: 'last5' | 'all') => {
    setSessionRange(range)
    setHiddenSessions(new Set())
  }

  const toggleSessionVisibility = (date: string) => {
    setHiddenSessions((prev) => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        // Prevent hiding every session
        if (next.size < sessionDates.length - 1) {
          next.add(date)
        }
      }
      return next
    })
  }

  // Color generator based on recency
  const getSessionColor = (_date: string, index: number, total: number) => {
    // If last5 mode, assign colors sequentially from palette
    if (sessionRange === 'last5') {
      return RECENT_COLORS[index % RECENT_COLORS.length]
    }
    // In "all" mode, give high contrast to latest 5 sessions, muted to earlier
    const fromEnd = total - 1 - index
    if (fromEnd < 5) {
      return RECENT_COLORS[fromEnd % RECENT_COLORS.length]
    }
    return MUTED_COLOR
  }

  const metricLabel =
    activeMetric === 'weightLb'
      ? 'Weight (lbs)'
      : activeMetric === 'reps'
      ? 'Reps'
      : 'Volume (lbs)'

  return (
    <Card className="shadow-xs">
      <CardHeader className="space-y-4 pb-4 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg md:text-xl font-bold">
                Multi-Session Set Progression
              </CardTitle>
            </div>
            <CardDescription className="mt-1">
              Overlay workout sessions by set number to track weight, reps, and volume progression over time.
            </CardDescription>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border self-start lg:self-center">
            <button
              type="button"
              onClick={() => setActiveMetric('weightLb')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeMetric === 'weightLb'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Weight (lbs)
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('reps')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeMetric === 'reps'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Reps
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('volume')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeMetric === 'volume'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Volume (lbs × reps)
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Exercise Dropdown */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Exercise:
            </span>
            <select
              aria-label="Select Exercise"
              value={currentExercise}
              onChange={(e) => handleExerciseChange(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {exerciseOptions.map(({ name, count }) => (
                <option key={name} value={name}>
                  {name} ({count} sets)
                </option>
              ))}
            </select>
          </div>

          {/* Session Range Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Sessions:
            </span>
            <div className="flex items-center bg-muted/60 p-0.5 rounded-md border border-border">
              <Button
                variant={sessionRange === 'last5' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => handleRangeChange('last5')}
              >
                Last 5 Sessions
              </Button>
              <Button
                variant={sessionRange === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => handleRangeChange('all')}
              >
                All Sessions
              </Button>
            </div>
          </div>
        </div>

        {/* Session Badges / Legend with Quick Toggling */}
        {sessionDates.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground font-medium mr-1 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Toggle lines:
            </span>
            {sessionDates.map((date, idx) => {
              const isHidden = hiddenSessions.has(date)
              const color = getSessionColor(date, idx, sessionDates.length)

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => toggleSessionVisibility(date)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] border transition-all ${
                    isHidden
                      ? 'opacity-40 line-through border-muted bg-muted/30 text-muted-foreground'
                      : 'border-border bg-card hover:bg-muted/50 text-foreground shadow-xs'
                  }`}
                  title={isHidden ? `Show ${date}` : `Hide ${date}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: color }}
                  />
                  <span>{date}</span>
                  {isHidden ? (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Eye className="h-3 w-3 opacity-60" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-6">
        {chartData.length === 0 || sessionDates.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No recorded workout sets found for {currentExercise}.</p>
          </div>
        ) : (
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 25, left: 0, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted/60"
                  vertical={false}
                />
                <XAxis
                  dataKey="setLabel"
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  domain={['auto', 'auto']}
                  dx={-5}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null

                    // Extract point meta for rich inspection
                    const point = payload[0]?.payload as ChartSetPoint | undefined
                    const metaMap = point?.meta || {}

                    return (
                      <div className="rounded-lg border border-border bg-popover/95 p-3 shadow-md backdrop-blur-xs text-popover-foreground text-xs space-y-2 min-w-52">
                        <div className="font-semibold text-sm border-b border-border pb-1 flex items-center justify-between">
                          <span>{label}</span>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {metricLabel}
                          </Badge>
                        </div>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                          {payload.map((entry) => {
                            const date = String(entry.dataKey)
                            const meta = metaMap[date]
                            if (!meta) return null

                            return (
                              <div
                                key={date}
                                className="flex items-center justify-between gap-3 py-0.5"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="font-medium text-muted-foreground">{date}:</span>
                                </div>
                                <div className="text-right font-mono font-medium whitespace-nowrap">
                                  <span className="text-foreground">
                                    {meta.weightLb} lbs × {meta.reps}
                                  </span>
                                  <span className="text-muted-foreground ml-1">
                                    ({meta.volume} vol)
                                  </span>
                                  {meta.isWarmup && (
                                    <span className="ml-1 text-[10px] text-amber-500 font-sans">
                                      [W]
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  content={() => null} // Handled by custom interactive badge pills above
                />

                {sessionDates.map((date, idx) => {
                  if (hiddenSessions.has(date)) return null
                  const color = getSessionColor(date, idx, sessionDates.length)

                  return (
                    <Line
                      key={date}
                      type="monotone"
                      dataKey={date}
                      name={date}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 4.5, strokeWidth: 1.5, fill: color }}
                      activeDot={{ r: 7, strokeWidth: 2 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-2 gap-2">
          <span>
            Showing <strong className="text-foreground">{sessionDates.length}</strong> workout sessions across{' '}
            <strong className="text-foreground">{maxSets}</strong> sets.
          </span>
          <span className="italic">
            Tip: Click session chips above to isolate and compare specific workout dates.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
