import type { EChartsOption } from 'echarts'
import type { NormalizedSetRecord } from '@/types/exercise'

export type SingleExerciseMetric = 'weight' | 'reps' | 'volume'

export interface SingleExerciseCellData {
  exercise: string
  date: string
  setNumber: number
  weightLb: number
  weightKg?: number
  reps: number
  volumeLb: number
  type?: string
}

/**
 * Transforms normalized set records for a single exercise into a set-by-set progression matrix:
 * X-axis: Session Date (chronological)
 * Y-axis: Set Number (1, 2, 3...)
 * Value / Visual Encoding: Weight, Reps, or Volume
 */
export function buildSingleExerciseHeatmapData(
  records: NormalizedSetRecord[],
  exerciseName: string,
  selectedMetric: SingleExerciseMetric = 'weight'
) {
  const filtered = records
    .filter((r) => r.exercise.trim().toLowerCase() === exerciseName.trim().toLowerCase())
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      return a.setNumber - b.setNumber
    })

  const dates = Array.from(new Set(filtered.map((r) => r.date))).sort((a, b) => a.localeCompare(b))
  const maxSets = filtered.reduce((max, r) => (r.setNumber > max ? r.setNumber : max), 0)

  // Y-axis: Set 1, Set 2, ... Set N (ordered from Set 1 at top to Set N at bottom, or 1 to N ascending)
  // In ECharts category axis, index 0 is at bottom by default.
  // We can build set labels from 1 to maxSets, and let Set 1 be either top or bottom.
  // Usually Set 1 at the top feels more intuitive, or Set 1 at bottom.
  // To have Set 1 at top, we list setLabels in reverse [Set N ... Set 1] or use inverse: true.
  const setNumbers = Array.from({ length: maxSets }, (_, i) => i + 1)
  const setLabels = setNumbers.map((s) => `Set ${s}`)

  const dateIndexMap = new Map(dates.map((d, i) => [d, i]))
  const setIndexMap = new Map(setNumbers.map((s, i) => [s, i]))

  const seriesData: { value: [number, number, number]; meta: SingleExerciseCellData }[] = []
  let minMetricValue = Infinity
  let maxMetricValue = -Infinity

  for (const r of filtered) {
    const xIdx = dateIndexMap.get(r.date)
    const yIdx = setIndexMap.get(r.setNumber)

    if (xIdx !== undefined && yIdx !== undefined) {
      let metricValue = 0
      switch (selectedMetric) {
        case 'weight':
          metricValue = r.weightLb
          break
        case 'reps':
          metricValue = r.reps
          break
        case 'volume':
          metricValue = r.volumeLb
          break
      }

      if (metricValue < minMetricValue) minMetricValue = metricValue
      if (metricValue > maxMetricValue) maxMetricValue = metricValue

      const cell: SingleExerciseCellData = {
        exercise: r.exercise,
        date: r.date,
        setNumber: r.setNumber,
        weightLb: r.weightLb,
        weightKg: r.weightKg,
        reps: r.reps,
        volumeLb: r.volumeLb,
        type: r.type,
      }

      seriesData.push({
        value: [xIdx, yIdx, metricValue],
        meta: cell,
      })
    }
  }

  if (minMetricValue === Infinity) minMetricValue = 0
  if (maxMetricValue === -Infinity) maxMetricValue = 100

  return {
    dates,
    setLabels,
    setNumbers,
    seriesData,
    minMetricValue,
    maxMetricValue,
  }
}

/**
 * Builds ECharts option for the Single-Exercise Progression Heatmap.
 */
export function buildSingleExerciseHeatmapOption(
  records: NormalizedSetRecord[],
  exerciseName: string,
  selectedMetric: SingleExerciseMetric = 'weight',
  isDark: boolean = false
): EChartsOption {
  const { dates, setLabels, seriesData, minMetricValue, maxMetricValue } =
    buildSingleExerciseHeatmapData(records, exerciseName, selectedMetric)

  const textColor = isDark ? '#e2e8f0' : '#334155'
  const borderColor = isDark ? '#334155' : '#e2e8f0'
  const cellBorderColor = isDark ? '#0f172a' : '#f8fafc'

  const metricTitles: Record<SingleExerciseMetric, string> = {
    weight: 'Weight (lbs)',
    reps: 'Reps Completed',
    volume: 'Set Volume (lbs)',
  }

  // Palettes tailored to single-exercise progressive overload
  const colorGradients: Record<SingleExerciseMetric, string[]> = {
    weight: isDark
      ? ['#1e1b4b', '#3730a3', '#6366f1', '#ec4899', '#f43f5e']
      : ['#eef2ff', '#a5b4fc', '#6366f1', '#e11d48', '#9f1239'],
    reps: isDark
      ? ['#064e3b', '#059669', '#10b981', '#34d399', '#6ee7b7']
      : ['#ecfdf5', '#a7f3d0', '#34d399', '#059669', '#065f46'],
    volume: isDark
      ? ['#1c1917', '#78350f', '#d97706', '#fbbf24', '#fef08a']
      : ['#fffbeb', '#fde68a', '#f59e0b', '#d97706', '#78350f'],
  }

  return {
    tooltip: {
      position: 'top',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: borderColor,
      borderWidth: 1,
      textStyle: { color: textColor, fontSize: 12 },
      formatter: (params: unknown) => {
        const p = params as {
          data: { value: [number, number, number]; meta: SingleExerciseCellData }
        }
        const cell = p.data?.meta
        if (!cell) return ''

        return `
          <div style="font-weight: 600; font-size: 13px; color: ${isDark ? '#60a5fa' : '#2563eb'}; margin-bottom: 2px;">
            ${cell.exercise}
          </div>
          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 6px;">
            ${cell.date} — Set ${cell.setNumber}
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px; font-size: 12px;">
            <span>🏋️ Weight: <b>${cell.weightLb} lbs</b> ${cell.weightKg ? `(${cell.weightKg} kg)` : ''}</span>
            <span>🔁 Reps: <b>${cell.reps}</b></span>
            <span>📦 Volume: <b>${cell.volumeLb.toLocaleString()} lbs</b></span>
            ${cell.type === 'warmup' ? '<span style="color: #f59e0b; font-size: 11px;">⚠️ Warmup Set</span>' : ''}
          </div>
        `
      },
    },
    grid: {
      top: 30,
      right: 40,
      bottom: 70,
      left: 70,
    },
    xAxis: {
      type: 'category',
      data: dates,
      splitArea: { show: false },
      axisLabel: {
        color: textColor,
        rotate: 45,
        fontSize: 11,
      },
      axisLine: { lineStyle: { color: borderColor } },
    },
    yAxis: {
      type: 'category',
      data: setLabels,
      inverse: true, // Set 1 at top for natural reading order
      splitArea: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 11,
      },
      axisLine: { lineStyle: { color: borderColor } },
    },
    visualMap: {
      min: minMetricValue,
      max: maxMetricValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      text: ['High', 'Low'],
      textStyle: { color: textColor, fontSize: 11 },
      inRange: {
        color: colorGradients[selectedMetric],
      },
    },
    series: [
      {
        name: metricTitles[selectedMetric],
        type: 'heatmap',
        data: seriesData,
        label: {
          show: true,
          color: isDark ? '#ffffff' : '#1e293b',
          fontSize: 10,
          fontWeight: 'bold',
          formatter: (params: unknown) => {
            const p = params as {
              data: { value: [number, number, number]; meta: SingleExerciseCellData }
            }
            const cell = p.data?.meta
            if (!cell) return ''
            // Rich in-cell display: weight or reps
            if (selectedMetric === 'weight') {
              return `${cell.weightLb}\n(${cell.reps}r)`
            } else if (selectedMetric === 'reps') {
              return `${cell.reps}`
            } else {
              return `${Math.round(cell.volumeLb)}`
            }
          },
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: cellBorderColor,
          borderRadius: 4,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderColor: isDark ? '#ffffff' : '#000000',
            borderWidth: 2,
          },
        },
      },
    ],
  }
}
