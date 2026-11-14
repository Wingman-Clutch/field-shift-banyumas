// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
import type { PowerCellFile } from './types.ts'

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface ClimatologyRow {
  month: string
  /** Mean monthly rainfall total (mm/month), from PRECTOTCORR mm/day × days in that month. */
  rainMm: number | null
  /** Mean 2 m air temperature (°C). */
  t2m: number | null
}

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()
const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
const round1 = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10)

/** Calendar-month averages across all years in the file (fill values skipped). */
export function monthlyClimatology(file: PowerCellFile): ClimatologyRow[] {
  const fill = file.fillValue
  const rain = file.monthly.PRECTOTCORR ?? {}
  const temp = file.monthly.T2M ?? {}

  return MONTH_LABELS.map((label, index) => {
    const month = index + 1
    const suffix = String(month).padStart(2, '0')
    const rainTotals: number[] = []
    const temps: number[] = []
    for (const [key, value] of Object.entries(rain)) {
      if (key.slice(4) === suffix && value !== fill) rainTotals.push(value * daysInMonth(Number(key.slice(0, 4)), month))
    }
    for (const [key, value] of Object.entries(temp)) {
      if (key.slice(4) === suffix && value !== fill) temps.push(value)
    }
    return { month: label, rainMm: round1(mean(rainTotals)), t2m: round1(mean(temps)) }
  })
}
