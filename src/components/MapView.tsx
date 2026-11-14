// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { AttributionControl, GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Feature, Geometry } from 'geojson'
import type { KecamatanCollection, KecamatanProperties } from '../lib/types.ts'

const BASE_STYLE: L.PathOptions = { color: '#1f5134', weight: 1.2, fillColor: '#3f8f5a', fillOpacity: 0.12 }
const SELECTED_STYLE: L.PathOptions = { color: '#b45309', weight: 3, fillColor: '#f59e0b', fillOpacity: 0.35 }

type PaddingGetter = () => number

/**
 * Fits the map to the data, keeping the area under the mobile sheet free. Runs once per dataset and
 * again when the layout switches between phone and desktop (`layoutKey`).
 */
function FitToData({
  data,
  layoutKey,
  bottomPadding,
}: {
  data: KecamatanCollection
  layoutKey: string
  bottomPadding: { current: PaddingGetter }
}) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    const bounds = L.geoJSON(data).getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { paddingTopLeft: [16, 16], paddingBottomRight: [16, 16 + bottomPadding.current()] })
    }
  }, [data, map, layoutKey, bottomPadding])
  return null
}

/** Pans (only if needed) so the selected kecamatan is not hidden behind the mobile sheet. */
function KeepSelectionVisible({
  layer,
  selectedId,
  bottomPadding,
}: {
  layer: { current: L.GeoJSON | null }
  selectedId: string | null
  bottomPadding: { current: PaddingGetter }
}) {
  const map = useMap()
  useEffect(() => {
    if (!selectedId) return
    layer.current?.eachLayer((child) => {
      const feature = (child as L.Polygon).feature as Feature<Geometry, KecamatanProperties> | undefined
      if (feature?.properties.shapeID !== selectedId) return
      map.panInside((child as L.Polygon).getBounds().getCenter(), {
        paddingTopLeft: [16, 16],
        paddingBottomRight: [16, 16 + bottomPadding.current()],
      })
    })
  }, [selectedId, map, layer, bottomPadding])
  return null
}

interface MapViewProps {
  data: KecamatanCollection
  selectedId: string | null
  onSelect: (shapeID: string) => void
  /** Returns the height (px) covered at the bottom of the map, e.g. by the mobile bottom sheet. */
  getBottomPadding?: PaddingGetter
  /** Changing this value refits the map (e.g. "phone" / "desktop"). */
  layoutKey?: string
}

const noPadding: PaddingGetter = () => 0

export default function MapView({
  data,
  selectedId,
  onSelect,
  getBottomPadding = noPadding,
  layoutKey = 'default',
}: MapViewProps) {
  const layerRef = useRef<L.GeoJSON | null>(null)
  const onSelectRef = useRef(onSelect)
  const bottomPaddingRef = useRef(getBottomPadding)
  // Layout effect: must update before the children's effects (FitToData) read the refs.
  useLayoutEffect(() => {
    onSelectRef.current = onSelect
    bottomPaddingRef.current = getBottomPadding
  }, [onSelect, getBottomPadding])

  // A new style function makes react-leaflet call setStyle on every polygon.
  const style = useCallback(
    (feature?: Feature<Geometry, KecamatanProperties>) =>
      feature?.properties.shapeID === selectedId ? SELECTED_STYLE : BASE_STYLE,
    [selectedId],
  )

  useEffect(() => {
    layerRef.current?.eachLayer((layer) => {
      const feature = (layer as L.Polygon).feature as Feature<Geometry, KecamatanProperties> | undefined
      if (feature?.properties.shapeID === selectedId) (layer as L.Path).bringToFront()
    })
  }, [selectedId])

  return (
    <MapContainer
      center={[-7.45, 109.15]}
      zoom={10}
      zoomSnap={0.5}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <AttributionControl position="topright" />
      <GeoJSON
        ref={layerRef}
        data={data}
        style={style}
        onEachFeature={(feature, layer) => {
          const props = feature.properties as KecamatanProperties
          layer.bindTooltip(props.name, { sticky: true, direction: 'top' })
          layer.on('click', () => onSelectRef.current(props.shapeID))
        }}
      />
      <FitToData data={data} layoutKey={layoutKey} bottomPadding={bottomPaddingRef} />
      <KeepSelectionVisible layer={layerRef} selectedId={selectedId} bottomPadding={bottomPaddingRef} />
    </MapContainer>
  )
}
