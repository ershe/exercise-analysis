import type { EChartsOption } from 'echarts'
import type { NormalizedSetRecord } from '@/types/exercise'

export type HeatmapMetric = 'volume' | 'weight' | 'reps' | 'sets'

export interface OverviewHeatmapCellData {
  exercise: string
  date: string
  totalVolume: number
  totalSets: number
  avgWeight: number
  maxWeight: number
  totalReps: number
  repsBreakdown: number[]
  weightsBreakdown: number[]
}

/**
 * Transforms normalized set records into a matrix for the All-Exercises Overview Heatmap.
 */
export function buildOverviewHeatmapData(
  records: NormalizedSetRecord[],
  selectedMetric: HeatmapMetric = 'volume',
  limitExercises: number = 25
) {
  // Aggregate by [exercise, date]
  const exerciseCounts = new Map<string, number>()
  const matrixMap = new Map<string, OverviewHeatmapCellData>()
  const dateSet = new Set<string>()

  for (const r of records) {
    exerciseCounts.set(r.exercise, (exerciseCounts.get(r.exercise) || 0) + 1)
    dateSet.add(r.date)

    const key = `${r.exercise}:::${r.date}`
    let cell = matrixMap.get(key)
    if (!cell) {
      cell = {
        exercise: r.exercise,
        date: r.date,
        totalVolume: 0,
        totalSets: 0,
        avgWeight: 0,
        maxWeight: 0,
        totalReps: 0,
        repsBreakdown: [],
        weightsBreakdown: [],
      }
      matrixMap.set(key, cell)
    }

    cell.totalVolume += r.volumeLb
    cell.totalSets += 1
    cell.totalReps += r.reps
    cell.repsBreakdown.push(r.reps)
    cell.weightsBreakdown.push(r.weightLb)
    if (r.weightLb > cell.maxWeight) {
      cell.maxWeight = r.weightLb
    }
  }

  // Finalize average weights
  matrixMap.forEach((cell) => {
    if (cell.totalSets > 0) {
      const sumWeight = cell.weightsBreakdown.reduce((a, b) => a + b, 0)
      cell.avgWeight = Math.round((sumWeight / cell.totalSets) * 10) / 10
    }
    cell.totalVolume = Math.round(cell.totalVolume)
  })

  // Get top exercises sorted by total logged sets, limited to limitExercises
  const exercises = Array.from(exerciseCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limitExercises)
    .map(([name]) => name)
    // Reverse for ECharts Y-axis so top exercise displays at the top
    .reverse()

  const dates = Array.from(dateSet).sort((a, b) => a.localeCompare(b))

  const exerciseIndexMap = new Map(exercises.map((name, i) => [name, i]))
  const dateIndexMap = new Map(dates.map((d, i) => [d, i]))

  const seriesData: { value: [number, number, number]; meta: OverviewHeatmapCellData }[] = []
  let maxMetricValue = 0

  matrixMap.forEach((cell) => {
    const yIdx = exerciseIndexMap.get(cell.exercise)
    const xIdx = dateIndexMap.get(cell.date)

    if (xIdx !== undefined && yIdx !== undefined) {
      let metricValue = 0
      switch (selectedMetric) {
        case 'volume':
          metricValue = cell.totalVolume
          break
        case 'weight':
          metricValue = cell.maxWeight
          break
        case 'reps':
          metricValue = cell.totalReps
          break
        case 'sets':
          metricValue = cell.totalSets
          break
      }

      if (metricValue > maxMetricValue) {
        maxMetricValue = metricValue
      }

      seriesData.push({
        value: [xIdx, yIdx, metricValue],
        meta: cell,
      })
    }
  })

  return {
    dates,
    exercises,
    seriesData,
    maxMetricValue: maxMetricValue || 100,
  }
}

/**
 * Builds ECharts option for the All-Exercises Overview Heatmap.
 */
export function buildOverviewHeatmapOption(
  records: NormalizedSetRecord[],
  selectedMetric: HeatmapMetric = 'volume',
  isDark: boolean = false,
  limitExercises: number = 20
): EChartsOption {
  const { dates, exercises, seriesData, maxMetricValue } = buildOverviewHeatmapData(
    records,
    selectedMetric,
    limitExercises
  )

  const metricLabels: Record<HeatmapMetric, string> = {
    volume: 'Total Volume (lbs)',
    weight: 'Max Weight (lbs)',
    reps: 'Total Reps',
    sets: 'Sets Completed',
  }

  const textColor = isDark ? '#e2e8f0' : '#334155'
  const borderColor = isDark ? '#334155' : '#e2e8f0'
  const cellBorderColor = isDark ? '#0f172a' : '#f8fafc'

  // Dynamic color ramp based on metric
  const colorGradients: Record<HeatmapMetric, string[]> = {
    volume: isDark
      ? ['#1e1b4b', '#4338ca', '#6366f1', '#a855f7', '#ec4899']
      : ['#eef2ff', '#c7d2fe', '#818cf8', '#6366f1', '#4338ca'],
    weight: isDark
      ? ['#1e293b', '#0369a1', '#0ea5e9', '#38bdf8', '#fbbf24']
      : ['#f0f9ff', '#bae6fd', '#38bdf8', '#0284c7', '#0369a1'],
    reps: isDark
      ? ['#064e3b', '#047857', '#10b981', '#34d399', '#a7f3d0']
      : ['#ecfdf5', '#a7f3d0', '#34d399', '#059669', '#047857'],
    sets: isDark
      ? ['#451a03', '#b45309', '#f59e0b', '#fbbf24', '#fef08a']
      : ['#fffbeb', '#fde68a', '#f59e0b', '#d97706', '#b45309'],
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
          data: { value: [number, number, number]; meta: OverviewHeatmapCellData }
        }
        const cell = p.data?.meta
        if (!cell) return ''

        const setBreakdownList = cell.weightsBreakdown
          .map((w, idx) => `Set ${idx + 1}: ${w} lbs × ${cell.repsBreakdown[idx] ?? 0} reps`)
          .join('<br/>')

        return `
          <div style="font-weight: 600; margin-bottom: 4px; font-size: 13px; color: ${isDark ? '#60a5fa' : '#2563eb'};">
            ${cell.exercise}
          </div>
          <div style="font-size: 11px; opacity: 0.8; margin-bottom: 6px;">
            Date: ${cell.date}
          </div>
          <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; margin-bottom: 8px; font-size: 12px;">
            <span>Sets: <b>${cell.totalSets}</b></span>
            <span>Total Reps: <b>${cell.totalReps}</b></span>
            <span>Max Weight: <b>${cell.maxWeight} lbs</b></span>
            <span>Avg Weight: <b>${cell.avgWeight} lbs</b></span>
            <span style="grid-column: span 2;">Total Volume: <b>${cell.totalVolume.toLocaleString()} lbs</b></span>
          </div>
          <div style="border-top: 1px dashed ${borderColor}; padding-top: 4px; font-size: 11px; line-height: 1.4;">
            ${setBreakdownList}
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
      data: exercises,
      splitArea: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: (val: string) => {
          return val.length > 20 ? `${val.slice(0, 19)}…` : val
        },
      },
      axisLine: { lineStyle: { color: borderColor } },
    },
    visualMap: {
      min: 0,
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
        name: metricLabels[selectedMetric],
        type: 'heatmap',
        data: seriesData,
        label: {
          show: false,
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: cellBorderColor,
          borderRadius: 3,
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
