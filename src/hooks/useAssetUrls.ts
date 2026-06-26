import { useEffect, useState } from 'react'
import { getAsset } from '../lib/storage'

/**
 * Resolve assetIds em object URLs exibíveis, carregando os Blobs do IndexedDB.
 * Revoga as URLs ao desmontar / quando a lista muda.
 */
export function useAssetUrls(assetIds: Array<string | null>): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const key = assetIds.filter(Boolean).join(',')

  useEffect(() => {
    let cancelled = false
    const created: string[] = []
    const ids = [...new Set(key ? key.split(',') : [])]

    Promise.all(
      ids.map(async (id) => {
        const blob = await getAsset(id)
        if (!blob) return null
        const url = URL.createObjectURL(blob)
        created.push(url)
        return [id, url] as const
      }),
    ).then((pairs) => {
      if (cancelled) {
        created.forEach((u) => URL.revokeObjectURL(u))
        return
      }
      setUrls(Object.fromEntries(pairs.filter(Boolean) as Array<readonly [string, string]>))
    })

    return () => {
      cancelled = true
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [key])

  return urls
}
