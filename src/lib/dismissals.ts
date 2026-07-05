// Sugestões dispensadas pelo usuário (chaves estáveis por conteúdo).
// localStorage basta: é uma preferência leve, tolerante a perda.

const KEY = 'post-maker.dismissed-suggestions'

export function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(list) ? list.filter((k) => typeof k === 'string') : [])
  } catch {
    return new Set()
  }
}

export function saveDismissed(keys: Set<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...keys]))
  } catch {
    // Sem storage (modo privado antigo, quota): a dispensa vale só na sessão.
  }
}

export function dismiss(key: string): Set<string> {
  const keys = loadDismissed()
  keys.add(key)
  saveDismissed(keys)
  return keys
}

export function restoreAll(): Set<string> {
  const keys = new Set<string>()
  saveDismissed(keys)
  return keys
}
