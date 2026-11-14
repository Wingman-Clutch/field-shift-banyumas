// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
import { lazy, Suspense, useEffect, useState } from 'react'
import { loadData } from '../lib/data.ts'
import { monthlyClimatology, type ClimatologyRow } from '../lib/climatology.ts'
import type { PowerCellFile, PowerIndexEntry } from '../lib/types.ts'

const ClimateChart = lazy(() => import('./ClimateChart.tsx'))

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rows: ClimatologyRow[]; file: PowerCellFile }

const formatLat = (lat: number) => `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'}`
const formatLon = (lon: number) => `${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'W' : 'E'}`

export default function ClimatePanel({ entry }: { entry: PowerIndexEntry | null }) {
  const [state, setState] = useState<State>({ status: 'idle' })

  useEffect(() => {
    if (!entry) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    loadData<PowerCellFile>(entry.file)
      .then((file) => {
        if (!cancelled) setState({ status: 'ready', rows: monthlyClimatology(file), file })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: error instanceof Error ? error.message : String(error) })
      })
    return () => {
      cancelled = true
    }
  }, [entry])

  return (
    <section aria-labelledby="climate-title" className="rounded-xl border border-stone-200 bg-white p-4">
      <h2 id="climate-title" className="text-sm font-semibold text-stone-800">
        Monthly climate{entry ? ` · ${entry.name}` : ''}
      </h2>

      {state.status === 'idle' && (
        <p className="mt-2 text-sm text-stone-600">
          Select a kecamatan on the map or in the list to load NASA POWER monthly means.
        </p>
      )}
      {state.status === 'loading' && <p className="mt-2 text-sm text-stone-500">Loading…</p>}
      {state.status === 'error' && (
        <p className="mt-2 text-sm text-red-700">Could not load data: {state.message}</p>
      )}

      {state.status === 'ready' && (
        <>
          <div className="mt-3 h-60 w-full">
            <Suspense fallback={<p className="text-sm text-stone-500">Loading chart…</p>}>
              <ClimateChart rows={state.rows} />
            </Suspense>
          </div>
          <p className="mt-2 text-xs leading-snug text-stone-500">
            Data: NASA POWER · monthly means {state.file.metadata.period.start}–{state.file.metadata.period.end} · grid
            cell {formatLat(state.file.metadata.gridCell.lat)}, {formatLon(state.file.metadata.gridCell.lon)} (about 50
            km, shared by several kecamatan) · retrieved {state.file.metadata.retrieved.slice(0, 10)}
          </p>
        </>
      )}
    </section>
  )
}
