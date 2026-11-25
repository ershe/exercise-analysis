export interface ExerciseRecord {
  "Date Lifted": string
  "Exercise": string
  "Weight (kg)": number | string
  "Weight (lb)": number | string
  "Reps": number | string
  "Bodyweight (kg)": number | string
  "Bodyweight (lb)": number | string
  "Percentile (%)": number | string
  "Warmup": number | string
  "Time (seconds)"?: number | string
  "Distance (meters)"?: number | string
}

export interface NormalizedSetRecord {
  date: string       // YYYY-MM-DD
  exercise: string   // e.g., "Incline Bench Press"
  setNumber: number  // 1-based sequential set index per exercise per date
  weightLb: number
  weightKg?: number
  reps: number
  volumeLb: number   // weightLb * reps
  type?: string
}

