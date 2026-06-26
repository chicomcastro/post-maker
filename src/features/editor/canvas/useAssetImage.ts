import { useEffect, useState } from 'react'
import { getAsset } from '../../../lib/storage'

/** Carrega um assetId do IndexedDB como HTMLImageElement (para o Konva). */
export function useAssetImage(assetId: string | null): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement>()

  useEffect(() => {
    let active = true
    let url: string | null = null
    if (!assetId) {
      setImg(undefined)
      return
    }
    getAsset(assetId).then((blob) => {
      if (!blob || !active) return
      url = URL.createObjectURL(blob)
      const image = new Image()
      image.onload = () => {
        if (active) setImg(image)
      }
      image.src = url
    })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [assetId])

  return img
}
