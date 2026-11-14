// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
const cache = new Map<string, Promise<unknown>>()

/** Loads a JSON/GeoJSON file from public/data (respects the Vite base path). Cached per URL. */
export function loadData<T>(relativePath: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}data/${relativePath}`
  let pending = cache.get(url)
  if (!pending) {
    pending = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} while loading ${url}`)
        return res.json()
      })
      .catch((error: unknown) => {
        cache.delete(url)
        throw error
      })
    cache.set(url, pending)
  }
  return pending as Promise<T>
}
