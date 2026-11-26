import { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { NormalizedSetRecord } from '@/types/exercise'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CircleDot, LayoutGrid, Activity } from 'lucide-react'
import {
  buildAllExercisesBubbleOption,
  buildSingleExerciseBubbleOption,
} from '@/lib/bubbleChartOptions'

interface WorkoutBubbleChartProps {
  records: NormalizedSetRecord[]
}

type BubbleMode = 'all' | 'single'

export function WorkoutBubbleChart({ records }: WorkoutBubbleChartProps) {
  const [mode, setMode] = useState<BubbleMode>('all')
  const [exerciseCount, setExerciseCount] = useState<number>(15)

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

  const currentExercise = selectedExercise || exerciseList[0]?.name || ''

  const isDark = useMemo(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  }, [])

  const option = useMemo(() => {
    if (mode === 'all') {
      return buildAllExercisesBubbleOption(records, isDark, exerciseCount)
    }
    return buildSingleExerciseBubbleOption(records, currentExercise, isDark)
  }, [mode, records, isDark, exerciseCount, currentExercise])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-sky-500/10 text-sky-500 rounded-md">
                <CircleDot className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Workout Volume & Intensity Bubble Chart</CardTitle>
            </div>
            <CardDescription className="mt-1">
              {mode === 'all'
                ? 'Bubble size represents total session volume (lbs); color encodes sets completed.'
                : 'Y-axis shows weight lifted (lbs), bubble size encodes reps, and color represents set volume.'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {mode === 'all' ? 'Size = Volume' : 'Size = Reps'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {mode === 'all' ? 'Color = Sets' : 'Color = Volume'}
            </Badge>
          </div>
        </div>

        {/* Mode Switcher & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-border mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">View:</span>
            <Button
              size="sm"
              variant={mode === 'all' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setMode('all')}
            >
              <LayoutGrid className="h-3 w-3" />
              All Exercises
            </Button>
            <Button
              size="sm"
              variant={mode === 'single' ? 'default' : 'outline'}
              className="h-7 text-xs gap-1"
              onClick={() => setMode('single')}
            >
              <Activity className="h-3 w-3" />
              Single Exercise
            </Button>
          </div>

          {mode === 'all' ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Show top:</span>
              {[10, 15, 25].map((num) => (
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
          ) : (
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
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[650px] h-[440px]">
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
