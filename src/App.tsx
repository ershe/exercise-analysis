import { useMemo } from 'react'
import rawData from '@/data/ershe 2026-11-20 172553.json'
import type { ExerciseRecord } from '@/types/exercise'
import { ExerciseTable } from '@/components/ExerciseTable'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Calendar, Flame, Trophy, Table as TableIcon } from 'lucide-react'

export default function App() {
  const records = rawData as ExerciseRecord[]

  // Compute summary stats from actual JSON dataset
  const stats = useMemo(() => {
    const totalEntries = records.length
    const uniqueExercises = new Set(records.map((r) => r.Exercise).filter(Boolean)).size
    const uniqueDates = new Set(records.map((r) => r['Date Lifted']).filter(Boolean)).size

    let maxWeight = 0
    let heaviestExercise = ''
    records.forEach((r) => {
      const weight = Number(r['Weight (lb)'])
      if (!isNaN(weight) && weight > maxWeight) {
        maxWeight = weight
        heaviestExercise = r.Exercise
      }
    })

    return {
      totalEntries,
      uniqueExercises,
      uniqueDates,
      maxWeight,
      heaviestExercise,
    }
  }, [records])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 text-foreground font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-xs">
              <Dumbbell className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Exercise Analysis</h1>
              <p className="text-muted-foreground text-sm">
                Workout History & Performance Analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-xs">
              {stats.totalEntries.toLocaleString()} Total Records
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-xs">
              {stats.uniqueExercises} Unique Exercises
            </Badge>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium">Logged Sets</CardTitle>
              <TableIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Historical records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium">Workout Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueDates}</div>
              <p className="text-xs text-muted-foreground">Unique sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium">Exercise Types</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueExercises}</div>
              <p className="text-xs text-muted-foreground">Different movements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium">Max Lift</CardTitle>
              <Trophy className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.maxWeight} lbs</div>
              <p className="text-xs text-muted-foreground truncate" title={stats.heaviestExercise}>
                {stats.heaviestExercise || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table Section */}
        <Card>
          <CardHeader>
            <CardTitle>Exercise Records</CardTitle>
            <CardDescription>
              Browse, filter by exercise, sort columns, or search specific workout dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExerciseTable data={records} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
