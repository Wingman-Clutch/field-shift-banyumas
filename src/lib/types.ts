// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'

export interface KecamatanProperties {
  name: string
  shapeID: string
  /** [longitude, latitude] */
  centroid: [number, number]
}

export interface BoundaryMetadata {
  title: string
  source: string
  boundarySource: string
  boundaryYearRepresented: string | number
  license: string
  licenseSource: string
  citation: string
  retrieved: string
}

export type KecamatanCollection = FeatureCollection<Polygon | MultiPolygon, KecamatanProperties> & {
  metadata: BoundaryMetadata
}

export interface PowerIndexEntry {
  shapeID: string
  name: string
  centroid: [number, number]
  cell: string
  /** Path relative to /data, e.g. "power/merra2_-7.50_109.375.json" */
  file: string
}

export interface PowerIndex {
  metadata: {
    source: string
    sourceUrl: string
    period: { start: number; end: number }
    parameters: string[]
    acknowledgment: string
    note: string
  }
  cells: Record<string, { lat: number; lon: number; file: string }>
  kecamatan: PowerIndexEntry[]
}

export interface PowerCellFile {
  metadata: {
    source: string
    sourceUrl: string
    apiUrl: string
    period: { start: number; end: number }
    gridCell: { lat: number; lon: number; resolution: string }
    retrieved: string
    acknowledgment: string
  }
  fillValue: number
  parameters: Record<string, { units: string; longname: string }>
  /** parameter → { "YYYYMM": value } */
  monthly: Record<string, Record<string, number>>
}
