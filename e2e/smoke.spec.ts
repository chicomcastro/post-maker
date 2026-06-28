import { test, expect, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const IMG = resolve(here, '../public/pwa-512.png')
const SMALL = resolve(here, '../public/pwa-192.png')

const APP = '/post-maker/#/'

// Falha o teste se qualquer erro de página (tela branca) ocorrer.
function guardPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('home carrega sem erros', async ({ page }) => {
  const errors = guardPageErrors(page)
  await page.goto(APP)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/postou nada/i)
  await expect(page.getByRole('button', { name: /criar novo/i })).toBeVisible()
  expect(errors).toEqual([])
})

// Regressão: em telas largas (iPad/desktop, >=480px) o .app-shell colapsava
// para largura 0 (tela branca). Garante que a moldura tem largura e o conteúdo
// aparece em viewport de tablet.
test.describe('layout em tela larga (tablet)', () => {
  test.use({ viewport: { width: 834, height: 1180 } })
  test('renderiza a moldura e o conteúdo no iPad', async ({ page }) => {
    await page.goto(APP)
    await expect(page.getByRole('button', { name: /criar novo/i })).toBeVisible()
    const box = await page.locator('.app-shell').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(300)
    expect(box!.height).toBeGreaterThan(300)
  })
})

test('alterna idioma', async ({ page }) => {
  await page.goto(APP)
  await page.getByRole('button', { name: /idioma/i }).click()
  await expect(page.getByRole('button', { name: /create new/i })).toBeVisible()
})

test('fluxo completo: criar carrossel → editor → persiste → exporta', async ({ page }) => {
  const errors = guardPageErrors(page)
  await page.goto(APP)

  await page.getByRole('button', { name: /criar novo/i }).click()
  await page.getByRole('button', { name: /quadrado/i }).click()
  await page.getByRole('button', { name: 'carousel3-diagonal' }).click()

  await expect(page.getByRole('heading', { name: /selecione suas fotos/i })).toBeVisible()
  await page.setInputFiles('input[type=file]', [IMG, SMALL, SMALL, SMALL, SMALL, SMALL, SMALL])
  await expect(page.getByText(/7 fotos selecionadas/i)).toBeVisible()

  await page.getByRole('button', { name: /criar projeto/i }).click()

  // Editor montou: app bar, palco (canvas) e tira de páginas (3 páginas).
  await expect(page.getByRole('button', { name: /exportar/i })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByRole('button', { name: /página 1/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /página 3/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /fundo/i })).toBeVisible()

  // Exporta (carrossel => .zip via download).
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /exportar/i }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.zip$/)

  // Persistência: volta à home e o projeto aparece salvo.
  await page.getByRole('button', { name: /voltar para o início/i }).click()
  // Espera a Home montar (fim da transição) antes de checar a lista.
  await expect(page.getByRole('button', { name: /criar novo/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /seus projetos/i })).toBeVisible()
  await expect(page.locator('.project-card__name')).toContainText(/novo carrossel/i)

  expect(errors).toEqual([])
})

test('seleciona uma foto da colagem e abre o painel da foto', async ({ page }) => {
  await page.goto(APP)
  await page.getByRole('button', { name: /criar novo/i }).click()
  await page.getByRole('button', { name: /quadrado/i }).click()
  await page.getByRole('button', { name: 'post-trio-scatter' }).click()
  await page.setInputFiles('input[type=file]', [IMG, SMALL, SMALL, SMALL])
  await page.getByRole('button', { name: /criar projeto/i }).click()

  await expect(page.locator('canvas')).toBeVisible()
  // toca no centro do palco para selecionar uma foto de colagem
  const box = await page.locator('canvas').boundingBox()
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.getByRole('heading', { name: /^foto$/i })).toBeVisible()
})

test('resiliência: projeto em formato antigo não causa tela branca', async ({ page }) => {
  const errors = guardPageErrors(page)
  await page.goto(APP)

  // Injeta um projeto no formato pré-refactor (background por página).
  await page.evaluate(async () => {
    const req = indexedDB.open('post-maker', 1)
    await new Promise((res, rej) => {
      req.onsuccess = () => res(null)
      req.onerror = () => rej(req.error)
    })
    const db = req.result
    const legacy = {
      id: 'legacy1',
      name: 'Projeto antigo',
      createdAt: 1,
      updatedAt: 2,
      aspectRatio: '1:1',
      templateId: 'post-solo',
      pages: [
        {
          id: 'pg1',
          bgColor: '#111827',
          background: {
            assetId: null,
            transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
            adjustments: { brightness: 1, contrast: 1, saturation: 1 },
          },
          collage: [
            {
              id: 'c1',
              assetId: null,
              transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
              frame: { width: 0.5, height: 0.5, cornerRadius: 0.02 },
              style: { borderWidth: 0, borderColor: '#fff', shadow: true },
              adjustments: { brightness: 1, contrast: 1, saturation: 1 },
            },
          ],
        },
      ],
    }
    await new Promise((res, rej) => {
      const tx = db.transaction('projects', 'readwrite')
      tx.objectStore('projects').put(legacy)
      tx.oncomplete = () => res(null)
      tx.onerror = () => rej(tx.error)
    })
  })

  await page.goto('/post-maker/#/editor/legacy1')
  // Deve renderizar o editor (não tela branca nem fallback de erro).
  await expect(page.getByRole('button', { name: /exportar/i })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0)
  expect(errors).toEqual([])
})
