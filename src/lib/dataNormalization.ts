import type { ExerciseRecord, NormalizedSetRecord } from '@/types/exercise'

/**
 * Normalizes raw exercise records into a consistent structured array of NormalizedSetRecord.
 * Automatically computes 1-based sequential set numbers per exercise per date,
 * and calculates total volume in lbs (weightLb * reps).
 */
export function normalizeExerciseRecords(records: ExerciseRecord[]): NormalizedSetRecord[] {
  // Key: `${date}___${exercise}` -> counter
  const setCounters = new Map<string, number>()
  const normalized: NormalizedSetRecord[] = []

  for (const record of records) {
    const rawDate = record['Date Lifted']
    const exercise = record['Exercise']?.trim()

    if (!rawDate || !exercise) continue

    const date = rawDate.trim()
    const key = `${date}___${exercise.toLowerCase()}`
    const currentCount = (setCounters.get(key) || 0) + 1
    setCounters.set(key, currentCount)

    const rawWeightLb = record['Weight (lb)']
    const weightLb = typeof rawWeightLb === 'number' ? rawWeightLb : parseFloat(String(rawWeightLb)) || 0

    const rawWeightKg = record['Weight (kg)']
    const weightKg = typeof rawWeightKg === 'number'
      ? rawWeightKg
      : rawWeightKg ? parseFloat(String(rawWeightKg)) : undefined

    const rawReps = record['Reps']
    const reps = typeof rawReps === 'number' ? rawReps : parseInt(String(rawReps), 10) || 0

    const volumeLb = Math.round(weightLb * reps * 10) / 10
    const isWarmup = String(record['Warmup']).trim() === '1'

    normalized.push({
      date,
      exercise,
      setNumber: currentCount,
      weightLb,
      weightKg: isNaN(weightKg ?? 0) ? undefined : weightKg,
      reps,
      volumeLb,
      type: isWarmup ? 'warmup' : 'normal',
    })
  }

  return normalized
}
