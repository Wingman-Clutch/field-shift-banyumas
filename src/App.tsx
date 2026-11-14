// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapView from './components/MapView.tsx'
import ClimatePanel from './components/ClimatePanel.tsx'
import PlaceholderCard from './components/PlaceholderCard.tsx'
import AttributionFooter from './components/AttributionFooter.tsx'
import { loadData } from './lib/data.ts'
import { useMediaQuery } from './lib/useMediaQuery.ts'
import type { KecamatanCollection, PowerIndex } from './lib/types.ts'

export default function App() {
  const [boundaries, setBoundaries] = useState<KecamatanCollection | null>(null)
  const [powerIndex, setPowerIndex] = useState<PowerIndex | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [offlineReady, setOfflineReady] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const panelRef = useRef<HTMLElement>(null)
  // On phones the panel is a bottom sheet over the map; the map keeps that strip clear.
  const getBottomPadding = useCallback(
    () => (isDesktop ? 0 : Math.round(panelRef.current?.getBoundingClientRect().height ?? 0)),
    [isDesktop],
  )

  useEffect(() => {
    Promise.all([
      loadData<KecamatanCollection>('banyumas-kecamatan.geojson'),
      loadData<PowerIndex>('power/index.json'),
    ])
      .then(([boundaryData, index]) => {
        setBoundaries(boundaryData)
        setPowerIndex(index)
      })
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : String(error)))
  }, [])

  useEffect(() => {
    const onReady = () => {
      setOfflineReady(true)
      window.setTimeout(() => setOfflineReady(false), 4000)
    }
    window.addEventListener('pwa:offline-ready', onReady)
    return () => window.removeEventListener('pwa:offline-ready', onReady)
  }, [])

  const selected = useMemo(
    () => powerIndex?.kecamatan.find((k) => k.shapeID === selectedId) ?? null,
    [powerIndex, selectedId],
  )

  const select = (shapeID: string) => {
    setSelectedId(shapeID)
    setSheetOpen(true)
  }

  const showPanelContent = isDesktop || sheetOpen

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-[1100] border-b border-stone-200 bg-white px-4 py-2.5 shadow-sm">
        <h1 className="text-sm leading-snug font-semibold text-stone-900 sm:text-base">
          <span className="text-brand-700">Working title</span> — Team Wingman Clutch · Field Shift: Adapting Farms with
          NASA Data
        </h1>
      </header>

      <main className="relative flex min-h-0 flex-1">
        <section aria-label="Map of the kecamatan in Kabupaten Banyumas" className="relative min-h-0 flex-1">
          {boundaries ? (
            <MapView
              data={boundaries}
              selectedId={selectedId}
              onSelect={select}
              getBottomPadding={getBottomPadding}
              layoutKey={isDesktop ? 'desktop' : 'phone'}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-stone-500">
              {loadError ? `Could not load map data: ${loadError}` : 'Loading map…'}
            </div>
          )}
        </section>

        <aside
          ref={panelRef}
          aria-label="Details panel"
          className="absolute inset-x-0 bottom-0 z-[1050] flex max-h-[60dvh] flex-col rounded-t-2xl border-t border-stone-200 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.12)] lg:static lg:z-auto lg:max-h-none lg:w-[400px] lg:shrink-0 lg:rounded-none lg:border-t-0 lg:border-l lg:shadow-none"
        >
          <button
            type="button"
            onClick={() => setSheetOpen((open) => !open)}
            aria-expanded={sheetOpen}
            className="flex w-full flex-col items-center gap-1.5 px-4 pt-2 pb-2.5 text-sm font-medium text-stone-700 lg:hidden"
          >
            <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-stone-300" />
            <span>
              {selected ? selected.name : 'Kecamatan'} · {sheetOpen ? 'Hide details' : 'Show details'}
            </span>
          </button>

          {showPanelContent && (
            <div className="min-h-0 space-y-4 overflow-y-auto px-4 pt-1 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pt-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-stone-700">Kecamatan</span>
                <select
                  value={selectedId ?? ''}
                  onChange={(event) => event.target.value && select(event.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {powerIndex?.kecamatan.map((k) => (
                    <option key={k.shapeID} value={k.shapeID}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </label>
              <ClimatePanel entry={selected} />
              <PlaceholderCard />
              <AttributionFooter boundary={boundaries?.metadata} power={powerIndex?.metadata} />
            </div>
          )}
        </aside>
      </main>

      {offlineReady && (
        <div
          role="status"
          className="fixed top-14 left-1/2 z-[1200] -translate-x-1/2 rounded-full bg-stone-900 px-4 py-1.5 text-xs text-white shadow-lg"
        >
          Ready to work offline
        </div>
      )}
    </div>
  )
}
