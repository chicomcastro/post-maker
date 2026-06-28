import { useEffect, useState } from 'react'
import { getAsset } from '../../../lib/storage'

// Cache de imagens já decodificadas, compartilhado por todos os nós. Evita
// decodificar a mesma foto duas vezes (ex.: a mesma imagem como fundo e na
// colagem) e torna reabrir um projeto instantâneo dentro da sessão. Os assetIds
// são imutáveis, então cachear por id é seguro.
const imageCache = new Map<string, HTMLImageElement>()
const inflight = new Map<string, Promise<HTMLImageElement | null>>()

async function loadAssetImage(assetId: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(assetId)
  if (cached) return cached

  let promise = inflight.get(assetId)
  if (!promise) {
    promise = (async () => {
      const blob = await getAsset(assetId)
      if (!blob) return null
      const url = URL.createObjectURL(blob)
      const image = new Image()
      image.src = url
      try {
        // decode() decodifica fora do caminho de render (menos travada que onload).
        await image.decode()
      } catch {
        // Alguns ambientes/imagens não suportam decode(); o onload já bastou.
      }
      URL.revokeObjectURL(url)
      imageCache.set(assetId, image)
      return image
    })()
    inflight.set(assetId, promise)
    void promise.finally(() => inflight.delete(assetId))
  }
  return promise
}

/** Carrega um assetId como HTMLImageElement (para o Konva), com cache. */
export function useAssetImage(assetId: string | null): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement | undefined>(() =>
    assetId ? (imageCache.get(assetId) ?? undefined) : undefined,
  )

  useEffect(() => {
    let active = true
    if (!assetId) {
      setImg(undefined)
      return
    }
    const cached = imageCache.get(assetId)
    if (cached) {
      setImg(cached)
      return
    }
    setImg(undefined)
    loadAssetImage(assetId).then((image) => {
      if (active && image) setImg(image)
    })
    return () => {
      active = false
    }
  }, [assetId])

  return img
}
