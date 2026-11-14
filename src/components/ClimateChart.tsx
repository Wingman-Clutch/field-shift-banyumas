// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
// Loaded lazily so the charting library is not part of the first bundle.
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ClimatologyRow } from '../lib/climatology.ts'

export default function ClimateChart({ rows }: { rows: ClimatologyRow[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={{ top: 8, right: 0, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={0} tickLine={false} />
        <YAxis yAxisId="rain" tick={{ fontSize: 10 }} width={40} />
        <YAxis
          yAxisId="temp"
          orientation="right"
          tick={{ fontSize: 10 }}
          width={30}
          domain={['dataMin - 1', 'dataMax + 1']}
          tickFormatter={(value: number) => value.toFixed(0)}
        />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar yAxisId="rain" dataKey="rainMm" name="Rainfall (mm/month)" fill="#3f8f5a" radius={[3, 3, 0, 0]} />
        <Line
          yAxisId="temp"
          type="monotone"
          dataKey="t2m"
          name="Air temperature at 2 m (°C)"
          stroke="#b45309"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
