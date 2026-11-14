// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
// Downloads geoBoundaries IDN ADM2 + ADM3 (gbHumanitarian release; gbOpen has no IDN ADM3),
// keeps the kecamatan (ADM3) that lie inside Kabupaten Banyumas (ADM2), simplifies them and
// writes public/data/banyumas-kecamatan.geojson with source/licence metadata.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as turf from '@turf/turf'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'data', 'banyumas-kecamatan.geojson')
const API = 'https://www.geoboundaries.org/api/current'
const RELEASE = 'gbHumanitarian'
const EXPECTED_COUNT = 27

async function getJson(url) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

const first = (d) => (Array.isArray(d) ? d[0] : d)

const meta2 = first(await getJson(`${API}/${RELEASE}/IDN/ADM2/`))
const meta3 = first(await getJson(`${API}/${RELEASE}/IDN/ADM3/`))

console.log(`ADM2 ${meta2.boundaryID}: downloading ${meta2.simplifiedGeometryGeoJSON}`)
const adm2 = await getJson(meta2.simplifiedGeometryGeoJSON)
const matches = adm2.features.filter((f) =>
  /^(kabupaten\s+|kab\.?\s+)?banyumas$/i.test(String(f.properties?.shapeName ?? '').trim()),
)
if (matches.length !== 1) {
  throw new Error(`Expected one ADM2 feature named Banyumas, found ${matches.length}`)
}
const regency = matches[0]
const [minX, minY, maxX, maxY] = turf.bbox(regency)

console.log(`ADM3 ${meta3.boundaryID}: downloading ${meta3.simplifiedGeometryGeoJSON}`)
const adm3 = await getJson(meta3.simplifiedGeometryGeoJSON)

const inside = adm3.features.filter((f) => {
  const [fx0, fy0, fx1, fy1] = turf.bbox(f)
  if (fx1 < minX || fx0 > maxX || fy1 < minY || fy0 > maxY) return false
  return turf.booleanPointInPolygon(turf.pointOnFeature(f), regency)
})

const round = (n) => Math.round(n * 1e5) / 1e5

const features = inside
  .map((f) => {
    const simplified = turf.simplify(f, { tolerance: 0.0002, highQuality: true, mutate: false })
    const truncated = turf.truncate(simplified, { precision: 5, coordinates: 2, mutate: true })
    const [lon, lat] = turf.centroid(f).geometry.coordinates
    return {
      type: 'Feature',
      properties: {
        name: String(f.properties.shapeName).trim(),
        shapeID: f.properties.shapeID,
        centroid: [round(lon), round(lat)],
      },
      geometry: truncated.geometry,
    }
  })
  .sort((a, b) => a.properties.name.localeCompare(b.properties.name))

if (features.length !== EXPECTED_COUNT) {
  console.warn(`WARNING: expected ${EXPECTED_COUNT} kecamatan, got ${features.length}`)
}
console.log(features.map((f) => f.properties.name).join(', '))

const collection = {
  type: 'FeatureCollection',
  metadata: {
    title: 'Kecamatan boundaries, Kabupaten Banyumas (Central Java, Indonesia)',
    source: `geoBoundaries ${RELEASE} IDN ADM3 (kecamatan), filtered with IDN ADM2 (Banyumas)`,
    boundaryID: meta3.boundaryID,
    adm2BoundaryID: meta2.boundaryID,
    boundarySource: meta3.boundarySource,
    boundaryYearRepresented: meta3.boundaryYearRepresented,
    license: meta3.boundaryLicense,
    licenseSource: meta3.licenseSource,
    api: `${API}/${RELEASE}/IDN/ADM3/`,
    downloadUrl: meta3.simplifiedGeometryGeoJSON,
    citation:
      'Runfola, D. et al. (2020) geoBoundaries: A global database of political administrative boundaries. PLoS ONE 15(4): e0231866. https://doi.org/10.1371/journal.pone.0231866',
    retrieved: new Date().toISOString(),
    processing:
      'Kept ADM3 units whose point-on-feature lies inside the Banyumas ADM2 polygon, simplified (tolerance 0.0002°) and rounded coordinates to 5 decimals. Script written with AI assistance (Claude, Anthropic).',
    featureCount: features.length,
  },
  features,
}

await mkdir(path.dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(collection))
console.log(`Wrote ${path.relative(ROOT, OUT)} (${features.length} features)`)
