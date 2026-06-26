/** Gera um id único. Usa crypto.randomUUID quando disponível. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback simples (ambientes sem WebCrypto).
  return 'id-' + Math.abs(hashString(String(performance.now()) + ':' + counter++)).toString(36)
}

let counter = 0

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return h
}
