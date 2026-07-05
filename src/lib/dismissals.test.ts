import { describe, it, expect, beforeEach } from 'vitest'
import { loadDismissed, dismiss, restoreAll } from './dismissals'

beforeEach(() => localStorage.clear())

describe('dismissals', () => {
  it('persiste e recarrega dispensas', () => {
    dismiss('2026-06-27@-3.10,-60.02')
    dismiss('place@-3.10,-60.02')
    expect(loadDismissed()).toEqual(new Set(['2026-06-27@-3.10,-60.02', 'place@-3.10,-60.02']))
  })

  it('restaura tudo', () => {
    dismiss('x')
    expect(restoreAll().size).toBe(0)
    expect(loadDismissed().size).toBe(0)
  })

  it('tolera storage corrompido', () => {
    localStorage.setItem('post-maker.dismissed-suggestions', '{nope')
    expect(loadDismissed().size).toBe(0)
  })
})
