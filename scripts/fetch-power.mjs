// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
// Fetches NASA POWER monthly point data (community AG) for the MERRA-2 grid cells that contain
// the Banyumas kecamatan centroids. One request per grid cell, throttled to ~1 request/second.
// Values are stored as returned by the API (no modification); fill value is -999.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BOUNDARIES = path.join(ROOT, 'public', 'data', 'banyumas-kecamatan.geojson')
const OUT_DIR = path.join(ROOT, 'public', 'data', 'power')

const WANTED = ['PRECTOTCORR', 'T2M', 'T2M_MAX', 'T2M_MIN', 'RH2M', 'ALLSKY_SFC_SW_DWN', 'GWETROOT']
const START = 2001
const END = 2025
// MERRA-2 meteorology grid used by POWER: 0.5° latitude × 0.625° longitude.
const LAT_STEP = 0.5
const LON_STEP = 0.625
const API_BASE = 'https://power.larc.nasa.gov/api/temporal/monthly/point'
const ACKNOWLEDGMENT =
  'These data were obtained from the NASA Langley Research Center (LaRC) POWER Project funded through the NASA Earth Science/Applied Science Program.'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let lastRequest = 0
async function throttledFetch(url) {
  const wait = Math.max(0, lastRequest + 1100 - Date.now())
  if (wait) await sleep(wait)
  lastRequest = Date.now()
  return fetch(url)
}

function apiUrl(params, lat, lon, end) {
  return `${API_BASE}?parameters=${params.join(',')}&community=AG&longitude=${lon}&latitude=${lat}&start=${START}&end=${end}&format=JSON`
}

function cellFor([lon, lat]) {
  const cLat = Math.round(lat / LAT_STEP) * LAT_STEP
  const cLon = Math.round(lon / LON_STEP) * LON_STEP
  return { id: `merra2_${cLat.toFixed(2)}_${cLon.toFixed(3)}`, lat: Number(cLat.toFixed(3)), lon: Number(cLon.toFixed(3)) }
}

async function tryRequest(params, lat, lon, end) {
  const url = apiUrl(params, lat, lon, end)
  const res = await throttledFetch(url)
  const text = await res.text()
  if (!res.ok) return { ok: false, status: res.status, url, text }
  return { ok: true, url, json: JSON.parse(text) }
}

// Work out which parameters and which end year the API accepts (probe once, on the first cell).
async function negotiate(lat, lon) {
  for (const end of [END, END - 1]) {
    const all = await tryRequest(WANTED, lat, lon, end)
    if (all.ok) return { params: WANTED, end, first: all }
    console.warn(`Full request rejected (end=${end}, HTTP ${all.status}): ${all.text.slice(0, 300)}`)
    const accepted = []
    for (const p of WANTED) {
      const one = await tryRequest([p], lat, lon, end)
      if (one.ok) accepted.push(p)
      else console.warn(`  ${p} rejected (HTTP ${one.status})`)
    }
    if (accepted.length) {
      const again = await tryRequest(accepted, lat, lon, end)
      if (again.ok) return { params: accepted, end, first: again }
    }
  }
  throw new Error('NASA POWER rejected every parameter combination')
}

function reshape(json, cell, url, params, end) {
  const monthly = {}
  for (const p of params) {
    const series = json.properties?.parameter?.[p] ?? {}
    monthly[p] = Object.fromEntries(Object.entries(series).filter(([key]) => !key.endsWith('13')))
  }
  const parameters = Object.fromEntries(
    params.map((p) => [p, { units: json.parameters?.[p]?.units ?? '', longname: json.parameters?.[p]?.longname ?? p }]),
  )
  return {
    metadata: {
      source: 'NASA POWER',
      sourceUrl: 'https://power.larc.nasa.gov/',
      apiUrl: url,
      apiVersion: json.header?.api?.version ?? null,
      sources: json.header?.sources ?? null,
      community: 'AG',
      temporal: 'monthly',
      period: { start: START, end },
      gridCell: {
        lat: cell.lat,
        lon: cell.lon,
        resolution: '0.5° × 0.625° (MERRA-2 meteorology grid)',
      },
      retrieved: new Date().toISOString(),
      acknowledgment: ACKNOWLEDGMENT,
      processing:
        'Retrieved and reformatted (annual "13" entries dropped) by a script written with AI assistance (Claude, Anthropic). Values unchanged.',
    },
    fillValue: json.header?.fill_value ?? -999,
    parameters,
    monthly,
  }
}

const boundaries = JSON.parse(await readFile(BOUNDARIES, 'utf8'))
const kecamatan = boundaries.features.map((f) => ({
  shapeID: f.properties.shapeID,
  name: f.properties.name,
  centroid: f.properties.centroid,
  cell: cellFor(f.properties.centroid),
}))
const cells = new Map(kecamatan.map((k) => [k.cell.id, k.cell]))
console.log(`${kecamatan.length} kecamatan → ${cells.size} POWER grid cell(s): ${[...cells.keys()].join(', ')}`)

await mkdir(OUT_DIR, { recursive: true })
const [firstCell, ...otherCells] = [...cells.values()]
const { params, end, first } = await negotiate(firstCell.lat, firstCell.lon)
const dropped = WANTED.filter((p) => !params.includes(p))

const written = {}
for (const cell of [firstCell, ...otherCells]) {
  const result = cell === firstCell ? first : await tryRequest(params, cell.lat, cell.lon, end)
  if (!result.ok) throw new Error(`POWER request failed for ${cell.id}: HTTP ${result.status} ${result.text.slice(0, 200)}`)
  const file = `${cell.id}.json`
  await writeFile(path.join(OUT_DIR, file), JSON.stringify(reshape(result.json, cell, result.url, params, end)))
  written[cell.id] = { lat: cell.lat, lon: cell.lon, file: `power/${file}` }
  console.log(`Wrote power/${file}`)
}

const index = {
  metadata: {
    source: 'NASA POWER',
    sourceUrl: 'https://power.larc.nasa.gov/',
    community: 'AG',
    temporal: 'monthly',
    period: { start: START, end },
    parameters: params,
    droppedParameters: dropped,
    retrieved: new Date().toISOString(),
    acknowledgment: ACKNOWLEDGMENT,
    note: 'Each kecamatan centroid is assigned to the nearest MERRA-2 grid point (0.5° × 0.625°, roughly 50 km). Several kecamatan share one cell.',
    processing: 'Index built by a script written with AI assistance (Claude, Anthropic).',
  },
  cells: written,
  kecamatan: kecamatan.map((k) => ({
    shapeID: k.shapeID,
    name: k.name,
    centroid: k.centroid,
    cell: k.cell.id,
    file: written[k.cell.id].file,
  })),
}
await writeFile(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 1))
console.log(`Parameters kept: ${params.join(', ')}${dropped.length ? ` · dropped: ${dropped.join(', ')}` : ''} · period ${START}–${end}`)
