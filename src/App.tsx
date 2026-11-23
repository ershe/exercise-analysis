import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Activity, Dumbbell, Flame, CheckCircle } from 'lucide-react'

export default function App() {
  const [exercise, setExercise] = useState('')
  const [exercises, setExercises] = useState<string[]>([
    'Bench Press - 3 sets x 10 reps (185 lbs)',
    'Barbell Squat - 4 sets x 8 reps (225 lbs)',
    'Deadlift - 3 sets x 5 reps (315 lbs)',
  ])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!exercise.trim()) return
    setExercises((prev) => [...prev, exercise.trim()])
    setExercise('')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 text-foreground font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-sm">
              <Dumbbell className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Exercise Analysis</h1>
              <p className="text-muted-foreground text-sm">
                Powered by React 19, Vite, Tailwind CSS & shadcn/ui
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              Tailwind v4
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              shadcn/ui
            </Badge>
          </div>
        </header>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Logged Sets</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exercises.length}</div>
              <p className="text-xs text-muted-foreground">Active in session</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Calories Burned</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,840</div>
              <p className="text-xs text-muted-foreground">Est. this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Exercise & List */}
        <Card>
          <CardHeader>
            <CardTitle>Session Routine</CardTitle>
            <CardDescription>Track today's lifts, sets, and performance benchmarks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                placeholder="e.g. Overhead Press - 3 sets x 8 reps (135 lbs)"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Add Exercise</Button>
            </form>

            <ul className="space-y-2 pt-2">
              {exercises.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/60 hover:bg-card transition"
                >
                  <span className="text-sm font-medium">{item}</span>
                  <Badge variant="secondary">Logged</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4 text-xs text-muted-foreground">
            <span>Ready for Vercel deployment</span>
            <span>GitHub Actions CI ready</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
