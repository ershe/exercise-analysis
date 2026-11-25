import { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { NormalizedSetRecord } from '@/types/exercise'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, Dumbbell, Repeat, Flame } from 'lucide-react'
import {
  buildSingleExerciseHeatmapOption,
  type SingleExerciseMetric,
} from '@/lib/singleExerciseHeatmapOptions'

interface SingleExerciseHeatmapProps {
  records: NormalizedSetRecord[]
}

export function SingleExerciseHeatmap({ records }: SingleExerciseHeatmapProps) {
  // Rank exercises by set counts
  const exerciseList = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of records) {
      counts.set(r.exercise, (counts.get(r.exercise) || 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
  }, [records])

  const [selectedExercise, setSelectedExercise] = useState<string>(
    exerciseList[0]?.name || 'Incline Bench Press'
  )
  const [metric, setMetric] = useState<SingleExerciseMetric>('weight')

  const isDark = useMemo(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  }, [])

  const currentExercise = selectedExercise || exerciseList[0]?.name || ''

  const option = useMemo(() => {
    return buildSingleExerciseHeatmapOption(records, currentExercise, metric, isDark)
  }, [records, currentExercise, metric, isDark])

  // Summary statistics for the chosen exercise
  const exerciseStats = useMemo(() => {
    const matching = records.filter(
      (r) => r.exercise.trim().toLowerCase() === currentExercise.trim().toLowerCase()
    )
    const dates = new Set(matching.map((r) => r.date))
    let maxWeight = 0
    let totalVolume = 0

    matching.forEach((r) => {
      if (r.weightLb > maxWeight) maxWeight = r.weightLb
      totalVolume += r.volumeLb
    })

    return {
      sessionCount: dates.size,
      totalSets: matching.length,
      maxWeight,
      totalVolume: Math.round(totalVolume),
    }
  }, [records, currentExercise])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-md">
                <Activity className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Single-Exercise Progressive Overload Heatmap</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Track set-by-set weight and rep progression session-by-session for a specific movement.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {exerciseStats.sessionCount} Sessions
            </Badge>
            <Badge variant="outline" className="text-xs">
              {exerciseStats.totalSets} Sets
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Max {exerciseStats.maxWeight} lbs
            </Badge>
          </div>
        </div>

        {/* Exercise Selector & Metric Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-border mt-2">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Exercise:</span>
            <select
              value={currentExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              {exerciseList.map((ex) => (
                <option key={ex.name} value={ex.name}>
                  {ex.name} ({ex.count} sets)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Color Metric:</span>
            <Button
              size="sm"
              variant={metric === 'weight' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setMetric('weight')}
            >
              <Dumbbell className="h-3 w-3" />
              Weight (lbs)
            </Button>
            <Button
              size="sm"
              variant={metric === 'reps' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setMetric('reps')}
            >
              <Repeat className="h-3 w-3" />
              Reps
            </Button>
            <Button
              size="sm"
              variant={metric === 'volume' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setMetric('volume')}
            >
              <Flame className="h-3 w-3" />
              Set Volume
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] h-[380px]">
            <ReactECharts
              option={option}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
