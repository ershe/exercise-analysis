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
