// Geocodificação reversa OPCIONAL (acionada pelo usuário): coordenadas → nome
// do lugar. Envia APENAS lat/lon (nunca fotos) ao BigDataCloud, um serviço
// gratuito próprio para uso client-side, sem chave.

const ENDPOINT = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

interface GeoResponse {
  city?: string
  locality?: string
  principalSubdivision?: string
  countryName?: string
}

/** Nome curto do lugar ("Cidade, UF" quando possível). null se indisponível. */
export async function reverseGeocode(
  lat: number,
  lon: number,
  language = 'pt',
): Promise<string | null> {
  try {
    const url = `${ENDPOINT}?latitude=${lat}&longitude=${lon}&localityLanguage=${language}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as GeoResponse
    const main = data.city || data.locality
    const region = data.principalSubdivision || data.countryName
    if (main && region && main !== region) return `${main}, ${region}`
    return main || region || null
  } catch {
    return null
  }
}
