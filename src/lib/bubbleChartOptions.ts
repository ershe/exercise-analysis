import type { EChartsOption } from 'echarts'
import type { NormalizedSetRecord } from '@/types/exercise'

export interface AllExercisesBubbleMeta {
  exercise: string
  date: string
  totalVolume: number
  totalSets: number
  maxWeight: number
  totalReps: number
}

export interface SingleExerciseBubbleMeta {
  exercise: string
  date: string
  setNumber: number
  weightLb: number
  reps: number
  volumeLb: number
  type?: string
}

/**
 * Builds an ECharts scatter/bubble option for All-Exercises overview:
 * X-axis: Session Date
 * Y-axis: Top Exercises (by set count)
 * Bubble Size: Total Volume (lbs)
 * Color: Total Sets Completed
 */
export function buildAllExercisesBubbleOption(
  records: NormalizedSetRecord[],
  isDark: boolean = false,
  limitExercises: number = 15
): EChartsOption {
  const exerciseCounts = new Map<string, number>()
  const cellMap = new Map<string, AllExercisesBubbleMeta>()
  const dateSet = new Set<string>()

  for (const r of records) {
    exerciseCounts.set(r.exercise, (exerciseCounts.get(r.exercise) || 0) + 1)
    dateSet.add(r.date)

    const key = `${r.exercise}:::${r.date}`
    let cell = cellMap.get(key)
    if (!cell) {
      cell = {
        exercise: r.exercise,
        date: r.date,
        totalVolume: 0,
        totalSets: 0,
        maxWeight: 0,
        totalReps: 0,
      }
      cellMap.set(key, cell)
    }
    cell.totalVolume += r.volumeLb
    cell.totalSets += 1
    cell.totalReps += r.reps
    if (r.weightLb > cell.maxWeight) {
      cell.maxWeight = r.weightLb
    }
  }

  const exercises = Array.from(exerciseCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limitExercises)
    .map(([name]) => name)
    .reverse()

  const dates = Array.from(dateSet).sort((a, b) => a.localeCompare(b))
  const exerciseIndexMap = new Map(exercises.map((name, i) => [name, i]))
  const dateIndexMap = new Map(dates.map((d, i) => [d, i]))

  let maxVolume = 0
  let maxSets = 0

  const seriesData: { value: [number, number, number, number]; meta: AllExercisesBubbleMeta }[] = []

  cellMap.forEach((cell) => {
    const yIdx = exerciseIndexMap.get(cell.exercise)
    const xIdx = dateIndexMap.get(cell.date)
    if (xIdx !== undefined && yIdx !== undefined) {
      const vol = Math.round(cell.totalVolume)
      if (vol > maxVolume) maxVolume = vol
      if (cell.totalSets > maxSets) maxSets = cell.totalSets

      seriesData.push({
        value: [xIdx, yIdx, vol, cell.totalSets],
        meta: { ...cell, totalVolume: vol },
      })
    }
  })

  const textColor = isDark ? '#e2e8f0' : '#334155'
  const borderColor = isDark ? '#334155' : '#e2e8f0'
  const splitLineColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.7)'

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor,
      borderWidth: 1,
      textStyle: { color: textColor, fontSize: 12 },
      formatter: (params: unknown) => {
        const p = params as {
          data: { value: [number, number, number, number]; meta: AllExercisesBubbleMeta }
        }
        const cell = p.data?.meta
        if (!cell) return ''
        return `
          <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px; color: ${isDark ? '#38bdf8' : '#0284c7'};">
            ${cell.exercise}
          </div>
          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 6px;">
            Date: ${cell.date}
          </div>
          <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px;">
            <span>Volume: <b>${cell.totalVolume.toLocaleString()} lbs</b></span>
            <span>Sets: <b>${cell.totalSets}</b></span>
            <span>Max Weight: <b>${cell.maxWeight} lbs</b></span>
            <span>Total Reps: <b>${cell.totalReps}</b></span>
          </div>
        `
      },
    },
    grid: {
      top: 30,
      right: 50,
      bottom: 70,
      left: 170,
    },
    xAxis: {
      type: 'category',
      data: dates,
      splitLine: { show: true, lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: textColor, rotate: 45, fontSize: 11 },
      axisLine: { lineStyle: { color: borderColor } },
    },
    yAxis: {
      type: 'category',
      data: exercises,
      splitLine: { show: true, lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: (val: string) => (val.length > 20 ? `${val.slice(0, 19)}…` : val),
      },
      axisLine: { lineStyle: { color: borderColor } },
    },
    visualMap: [
      {
        show: true,
        dimension: 3, // totalSets
        min: 1,
        max: maxSets || 5,
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        text: ['More Sets', 'Fewer Sets'],
        textStyle: { color: textColor, fontSize: 11 },
        inRange: {
          color: isDark
            ? ['#38bdf8', '#818cf8', '#c084fc', '#f472b6']
            : ['#0ea5e9', '#6366f1', '#a855f7', '#ec4899'],
        },
      },
    ],
    series: [
      {
        name: 'Workout Volume',
        type: 'scatter',
        data: seriesData,
        symbolSize: (val: number[]) => {
          const vol = val[2] || 0
          if (maxVolume <= 0) return 10
          // Scale bubble radius between 8px and 34px
          return Math.max(8, Math.min(34, 8 + Math.sqrt(vol / maxVolume) * 26))
        },
        itemStyle: {
          opacity: 0.85,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.2)',
        },
        emphasis: {
          scale: 1.2,
          itemStyle: {
            opacity: 1,
            borderColor: isDark ? '#ffffff' : '#000000',
            borderWidth: 2,
          },
        },
      },
    ],
  }
}

/**
 * Builds an ECharts scatter/bubble option for a Single Exercise:
 * X-axis: Session Date
 * Y-axis: Weight (lbs)
 * Bubble Size: Reps Completed
 * Color: Set Volume (lbs)
 */
export function buildSingleExerciseBubbleOption(
  records: NormalizedSetRecord[],
  exerciseName: string,
  isDark: boolean = false
): EChartsOption {
  const filtered = records
    .filter((r) => r.exercise.trim().toLowerCase() === exerciseName.trim().toLowerCase())
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date)
      return dateCmp !== 0 ? dateCmp : a.setNumber - b.setNumber
    })

  const dates = Array.from(new Set(filtered.map((r) => r.date))).sort((a, b) => a.localeCompare(b))
  const dateIndexMap = new Map(dates.map((d, i) => [d, i]))

  let maxReps = 0
  let maxVolume = 0
  let minVolume = Infinity

  const seriesData: { value: [number, number, number, number]; meta: SingleExerciseBubbleMeta }[] = []

  for (const r of filtered) {
    const xIdx = dateIndexMap.get(r.date)
    if (xIdx === undefined) continue

    if (r.reps > maxReps) maxReps = r.reps
    if (r.volumeLb > maxVolume) maxVolume = r.volumeLb
    if (r.volumeLb < minVolume) minVolume = r.volumeLb

    seriesData.push({
      value: [xIdx, r.weightLb, r.reps, r.volumeLb],
      meta: {
        exercise: r.exercise,
        date: r.date,
        setNumber: r.setNumber,
        weightLb: r.weightLb,
        reps: r.reps,
        volumeLb: r.volumeLb,
        type: r.type,
      },
    })
  }

  if (minVolume === Infinity) minVolume = 0
  if (maxVolume === 0) maxVolume = 100

  const textColor = isDark ? '#e2e8f0' : '#334155'
  const borderColor = isDark ? '#334155' : '#e2e8f0'
  const splitLineColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.7)'

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor,
      borderWidth: 1,
      textStyle: { color: textColor, fontSize: 12 },
      formatter: (params: unknown) => {
        const p = params as {
          data: { value: [number, number, number, number]; meta: SingleExerciseBubbleMeta }
        }
        const cell = p.data?.meta
        if (!cell) return ''
        return `
          <div style="font-weight: 600; font-size: 13px; color: ${isDark ? '#34d399' : '#059669'}; margin-bottom: 2px;">
            ${cell.exercise}
          </div>
          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 6px;">
            ${cell.date} — Set ${cell.setNumber}
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px; font-size: 12px;">
            <span>Weight: <b>${cell.weightLb} lbs</b></span>
            <span>Reps: <b>${cell.reps}</b></span>
            <span>Set Volume: <b>${cell.volumeLb.toLocaleString()} lbs</b></span>
            ${cell.type === 'warmup' ? '<span style="color: #f59e0b; font-size: 11px;">⚠️ Warmup Set</span>' : ''}
          </div>
        `
      },
    },
    grid: {
      top: 30,
      right: 40,
      bottom: 70,
      left: 65,
    },
    xAxis: {
      type: 'category',
      data: dates,
      splitLine: { show: true, lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: textColor, rotate: 45, fontSize: 11 },
      axisLine: { lineStyle: { color: borderColor } },
    },
    yAxis: {
      type: 'value',
      name: 'Weight (lbs)',
      nameTextStyle: { color: textColor, fontSize: 11 },
      splitLine: { show: true, lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: textColor, fontSize: 11 },
      axisLine: { lineStyle: { color: borderColor } },
    },
    visualMap: [
      {
        show: true,
        dimension: 3, // volumeLb
        min: minVolume,
        max: maxVolume,
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        text: ['High Volume', 'Low Volume'],
        textStyle: { color: textColor, fontSize: 11 },
        inRange: {
          color: isDark
            ? ['#34d399', '#38bdf8', '#818cf8', '#f472b6']
            : ['#10b981', '#0ea5e9', '#6366f1', '#ec4899'],
        },
      },
    ],
    series: [
      {
        name: 'Set Progression',
        type: 'scatter',
        data: seriesData,
        symbolSize: (val: number[]) => {
          const reps = val[2] || 0
          if (maxReps <= 0) return 10
          // Scale bubble radius between 9px and 32px based on reps
          return Math.max(9, Math.min(32, 9 + (reps / maxReps) * 23))
        },
        itemStyle: {
          opacity: 0.8,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.2)',
        },
        emphasis: {
          scale: 1.2,
          itemStyle: {
            opacity: 1,
            borderColor: isDark ? '#ffffff' : '#000000',
            borderWidth: 2,
          },
        },
      },
    ],
  }
}
