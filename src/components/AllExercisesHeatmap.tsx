import { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { NormalizedSetRecord } from '@/types/exercise'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LayoutGrid, Flame, Dumbbell, Repeat, Layers } from 'lucide-react'
import {
  buildOverviewHeatmapOption,
  type HeatmapMetric,
} from '@/lib/overviewHeatmapOptions'

interface AllExercisesHeatmapProps {
  records: NormalizedSetRecord[]
}

export function AllExercisesHeatmap({ records }: AllExercisesHeatmapProps) {
  const [metric, setMetric] = useState<HeatmapMetric>('volume')
  const [exerciseCount, setExerciseCount] = useState<number>(20)

  // Detect dark mode if html has class 'dark'
  const isDark = useMemo(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  }, [])

  const option = useMemo(() => {
    return buildOverviewHeatmapOption(records, metric, isDark, exerciseCount)
  }, [records, metric, isDark, exerciseCount])

  // Count total workouts & exercise representations
  const summary = useMemo(() => {
    const dates = new Set(records.map((r) => r.date))
    const exercises = new Set(records.map((r) => r.exercise))
    const totalVolume = records.reduce((sum, r) => sum + r.volumeLb, 0)
    return {
      sessionCount: dates.size,
      exerciseCount: exercises.size,
      totalVolume: Math.round(totalVolume),
    }
  }, [records])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-md">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">All-Exercises Training Heatmap</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Cross-workout overview of training volume, load intensity, and set density across sessions.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {summary.sessionCount} Sessions
            </Badge>
            <Badge variant="outline" className="text-xs">
              {summary.exerciseCount} Exercises
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {summary.totalVolume.toLocaleString()} lbs Volume
            </Badge>
          </div>
        </div>

        {/* Metric and density controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border mt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Metric:</span>
            <Button
              size="sm"
              variant={metric === 'volume' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setMetric('volume')}
            >
              <Flame className="h-3 w-3" />
              Volume
            </Button>
            <Button
              size="sm"
              variant={metric === 'weight' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setMetric('weight')}
            >
              <Dumbbell className="h-3 w-3" />
              Max Weight
            </Button>
            <Button
              size="sm"
              variant={metric === 'reps' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setMetric('reps')}
            >
              <Repeat className="h-3 w-3" />
              Total Reps
            </Button>
            <Button
              size="sm"
              variant={metric === 'sets' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setMetric('sets')}
            >
              <Layers className="h-3 w-3" />
              Sets Logged
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Show top:</span>
            {[15, 25, 40].map((num) => (
              <Button
                key={num}
                size="sm"
                variant={exerciseCount === num ? 'secondary' : 'ghost'}
                className="h-6 px-2 text-xs"
                onClick={() => setExerciseCount(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[650px] h-[480px]">
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
