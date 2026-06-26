import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom não implementa object URLs; stubs simples para os componentes de preview.
if (typeof URL.createObjectURL !== 'function') {
  let n = 0
  URL.createObjectURL = () => `blob:mock/${n++}`
  URL.revokeObjectURL = () => {}
}

afterEach(() => {
  cleanup()
})
