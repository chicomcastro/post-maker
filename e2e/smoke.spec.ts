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

// Importa fotos para a biblioteca pela home (aba Biblioteca é a inicial).
async function importLibrary(page: Page, files: string[]) {
  await page.locator('.suggestions__drop input[type=file]').setInputFiles(files)
  await expect(page.locator('.library-grid__item--btn').first()).toBeVisible({ timeout: 15000 })
}

// Fluxo de criação atual: importa, seleciona todas as fotos da grade, cria o
// projeto (menu de criação sem etapa de fotos) escolhendo formato e template.
async function createFromLibrary(
  page: Page,
  { template, files, aspect = /quadrado/i }: { template: string; files: string[]; aspect?: RegExp },
) {
  await page.goto(APP)
  await importLibrary(page, files)
  await page.getByRole('button', { name: /^selecionar$/i }).click()
  const cells = page.locator('.library-grid__item--btn')
  const n = await cells.count()
  for (let i = 0; i < n; i++) await cells.nth(i).click()
  await page.getByRole('button', { name: /criar projeto \(/i }).click()
  await page.getByRole('button', { name: aspect }).click()
  await page.getByRole('button', { name: template }).click()
  await expect(page.locator('canvas')).toBeVisible()
}

async function selectCenterPhoto(page: Page) {
  const box = await page.locator('canvas').boundingBox()
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}

// Cria um projeto post-trio-scatter (3 slots) com 4 fotos e entra no editor.
async function createTrioProject(page: Page) {
  await createFromLibrary(page, {
    template: 'post-trio-scatter',
    files: [IMG, SMALL, SMALL, SMALL],
  })
}

test('home carrega sem erros (biblioteca como tela inicial)', async ({ page }) => {
  const errors = guardPageErrors(page)
  await page.goto(APP)
  await expect(page.getByText(/importar fotos/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /biblioteca/i })).toBeVisible()
  expect(errors).toEqual([])
})

// Regressão: em telas largas (iPad/desktop, >=480px) o .app-shell colapsava
// para largura 0 (tela branca). Garante que o app ocupa a tela toda.
test.describe('layout em tela larga (tablet)', () => {
  test.use({ viewport: { width: 834, height: 1180 } })
  test('ocupa a tela inteira e mostra o conteúdo no iPad', async ({ page }) => {
    await page.goto(APP)
    await expect(page.getByText(/importar fotos/i)).toBeVisible()
    const box = await page.locator('.app-shell').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(800)
    expect(box!.height).toBeGreaterThan(1100)
  })

  test('editor usa duas colunas (canvas à esquerda, painel à direita)', async ({ page }) => {
    await createFromLibrary(page, {
      template: 'carousel3-diagonal',
      files: [IMG, SMALL, SMALL, SMALL, SMALL, SMALL, SMALL],
    })
    const stage = await page.locator('.editor__stage').boundingBox()
    const panel = await page.locator('.sheet').boundingBox()
    expect(stage).not.toBeNull()
    expect(panel).not.toBeNull()
    // painel à direita do palco (duas colunas, não empilhado)
    expect(panel!.x).toBeGreaterThan(stage!.x + stage!.width - 5)
  })
})

test('alterna idioma', async ({ page }) => {
  await page.goto(APP)
  await page.getByRole('button', { name: /idioma/i }).click()
  await expect(page.getByText(/import photos/i)).toBeVisible()
})

test('fluxo completo: criar carrossel → editor → persiste → exporta', async ({ page }) => {
  const errors = guardPageErrors(page)
  await createFromLibrary(page, {
    template: 'carousel3-diagonal',
    files: [IMG, SMALL, SMALL, SMALL, SMALL, SMALL, SMALL],
  })

  // Editor montou: app bar, palco (canvas) e tira de páginas (3 páginas).
  await expect(page.getByRole('button', { name: /exportar/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /página 1/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /página 3/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /fundo/i })).toBeVisible()

  // Exporta como imagens diretas (sem zip). Exportar é a ação principal.
  await page.getByRole('button', { name: /^exportar$/i }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /gerar imagens/i }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.png$/)

  // Persistência: volta à home, abre a aba Projetos e o projeto aparece salvo.
  await page.getByRole('button', { name: /voltar para o início/i }).click()
  await expect(page.getByText(/importar fotos/i)).toBeVisible()
  await page.getByRole('button', { name: /projetos/i }).click()
  await expect(page.locator('.project-card__name')).toContainText(/novo carrossel/i)

  expect(errors).toEqual([])
})

test('template automático: escolhe o layout pela quantidade de fotos', async ({ page }) => {
  const errors = guardPageErrors(page)
  await page.goto(APP)
  await importLibrary(page, [IMG, SMALL, SMALL, SMALL])
  await page.getByRole('button', { name: /^selecionar$/i }).click()
  const cells = page.locator('.library-grid__item--btn')
  const n = await cells.count()
  for (let i = 0; i < n; i++) await cells.nth(i).click()
  await page.getByRole('button', { name: /criar projeto \(/i }).click()

  // menu de criação sem etapa de fotos: escolhe formato e "Automático"
  await page.getByRole('button', { name: /quadrado/i }).click()
  await expect(page.getByText(/fotos da biblioteca/i)).toBeVisible()
  await page.getByRole('button', { name: /automático/i }).click()

  // Editor montou com um layout escolhido automaticamente para as fotos.
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByRole('button', { name: /^exportar$/i })).toBeVisible()

  expect(errors).toEqual([])
})

test('seleciona uma foto da colagem e abre o painel da foto', async ({ page }) => {
  await createTrioProject(page)
  const box = await page.locator('canvas').boundingBox()
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.getByRole('heading', { name: /^foto$/i })).toBeVisible()
})

test('adiciona mais fotos ao projeto durante a edição', async ({ page }) => {
  const errors = guardPageErrors(page)
  await createTrioProject(page)

  await expect(page.getByText(/imagem de fundo/i)).toBeVisible()
  const photos = page.locator('.thumbs .thumb:not(.thumb--none):not(.thumb--add)')
  const before = await photos.count()

  // Adiciona 2 fotos pelo tile "+" e o pool cresce.
  await page.locator('.thumb--add input[type=file]').setInputFiles([IMG, SMALL])
  await expect(photos).toHaveCount(before + 2)

  expect(errors).toEqual([])
})

test('background começa vazio e pode ser escolhido entre as fotos', async ({ page }) => {
  const errors = guardPageErrors(page)
  await createTrioProject(page)

  await expect(page.getByRole('heading', { name: /fundo/i })).toBeVisible()
  await expect(page.getByText(/imagem de fundo/i)).toBeVisible()

  // Escolhe a 1ª miniatura como imagem de fundo => aparecem zoom e "remover fundo".
  await page.locator('.thumbs .thumb').nth(1).click()
  await expect(page.getByText(/^zoom$/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /remover fundo/i })).toBeVisible()

  // Remove o fundo => volta para a paleta de cores.
  await page.getByRole('button', { name: /remover fundo/i }).click()
  await expect(page.getByRole('button', { name: /remover fundo/i })).toHaveCount(0)

  expect(errors).toEqual([])
})

test('seleciona uma foto da colagem e consegue excluí-la', async ({ page }) => {
  const errors = guardPageErrors(page)
  await createTrioProject(page)

  await selectCenterPhoto(page)
  await expect(page.getByRole('heading', { name: /^foto$/i })).toBeVisible()

  await page.getByRole('button', { name: /excluir foto/i }).click()
  await expect(page.getByRole('heading', { name: /fundo/i })).toBeVisible()

  expect(errors).toEqual([])
})

test('muda orientação do slot e enquadra a foto', async ({ page }) => {
  const errors = guardPageErrors(page)
  await createTrioProject(page)

  await selectCenterPhoto(page)
  await expect(page.getByRole('heading', { name: /^foto$/i })).toBeVisible()

  await expect(page.getByText(/orientação/i)).toBeVisible()
  await page.getByRole('button', { name: /paisagem/i }).click()
  await expect(page.getByText(/enquadrar a foto/i)).toBeVisible()
  await expect(page.getByText('Posição X')).toBeVisible()

  await expect(page.getByText(/ao arrastar a foto/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /^enquadrar$/i })).toBeVisible()
  const cbox = await page.locator('canvas').boundingBox()
  if (cbox) {
    await page.mouse.move(cbox.x + cbox.width / 2, cbox.y + cbox.height / 2)
    await page.mouse.down()
    await page.mouse.move(cbox.x + cbox.width / 2 + 40, cbox.y + cbox.height / 2 + 20, { steps: 5 })
    await page.mouse.up()
  }
  await page.getByRole('button', { name: /mover slot/i }).click()

  expect(errors).toEqual([])
})

test('clicar no fundo deseleciona a foto (volta ao painel de fundo)', async ({ page }) => {
  const errors = guardPageErrors(page)
  await createTrioProject(page)

  await selectCenterPhoto(page)
  await expect(page.getByRole('heading', { name: /^foto$/i })).toBeVisible()

  const box = await page.locator('canvas').boundingBox()
  if (box) await page.mouse.click(box.x + 6, box.y + 6)
  await expect(page.getByRole('heading', { name: /fundo/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^foto$/i })).toHaveCount(0)

  expect(errors).toEqual([])
})

test('pré-visualização do carrossel abre, desliza e oferece exportar imagens', async ({ page }) => {
  const errors = guardPageErrors(page)
  await createFromLibrary(page, {
    template: 'carousel3-diagonal',
    files: [IMG, SMALL, SMALL, SMALL, SMALL, SMALL, SMALL],
  })

  await page.getByRole('button', { name: /pré-visualizar/i }).click()
  const slides = page.locator('.preview-slide img')
  await expect(slides).toHaveCount(3)
  await expect(slides.first()).toBeVisible()
  await expect(page.getByRole('button', { name: /salvar \/ compartilhar imagens/i })).toBeVisible()

  await page.getByRole('dialog').getByRole('button').first().click()
  await expect(page.locator('.preview-overlay')).toHaveCount(0)

  expect(errors).toEqual([])
})

test('renomeia o projeto e vê data, template e nº de fotos na listagem', async ({ page }) => {
  const errors = guardPageErrors(page)
  await createFromLibrary(page, { template: 'post-trio-scatter', files: [IMG, SMALL, SMALL] })

  // renomeia pelo título da barra
  await page.getByRole('button', { name: /renomear projeto/i }).click()
  const input = page.getByRole('textbox', { name: /renomear projeto/i })
  await input.fill('Minha Viagem')
  await input.press('Enter')
  await expect(page.getByRole('button', { name: /renomear projeto/i })).toHaveText('Minha Viagem')

  // volta à home, abre a aba Projetos: card mostra nome, template e nº de fotos
  await page.getByRole('button', { name: /voltar para o início/i }).click()
  await expect(page.getByText(/importar fotos/i)).toBeVisible()
  await page.getByRole('button', { name: /projetos/i }).click()
  await expect(page.locator('.project-card__name')).toContainText('Minha Viagem')
  await expect(page.locator('.project-card__tags')).toContainText('post-trio-scatter')
  await expect(page.locator('.project-card__meta')).toContainText(/3 fotos/i)

  // renomeia direto na listagem (lápis no card)
  const card = page.locator('.project-card').first()
  await card.getByRole('button', { name: /renomear projeto/i }).click()
  const cardInput = card.getByRole('textbox', { name: /renomear projeto/i })
  await cardInput.fill('Renomeado na lista')
  await cardInput.press('Enter')
  await expect(page.locator('.project-card__name')).toContainText('Renomeado na lista')

  expect(errors).toEqual([])
})

test('exportar é a ação principal e oferece imagens ou arquivo do projeto', async ({ page }) => {
  const errors = guardPageErrors(page)
  await createFromLibrary(page, { template: 'post-trio-scatter', files: [IMG, SMALL, SMALL] })

  // a ação principal "Exportar" abre o seletor com as duas opções
  await page.getByRole('button', { name: /^exportar$/i }).click()
  await expect(page.getByRole('button', { name: /gerar imagens/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /exportar arquivo do projeto/i })).toBeVisible()

  // exporta o arquivo do projeto (.postmaker.zip via download)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /exportar arquivo do projeto/i }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.postmaker\.zip$/)

  expect(errors).toEqual([])
})

test('biblioteca: importa em massa, sugere posts prontos e cria carrossel', async ({ page }) => {
  const errors = guardPageErrors(page)
  await page.goto(APP)

  // importa 3 fotos (sem EXIF => caem no mesmo dia via lastModified do arquivo)
  await importLibrary(page, [IMG, SMALL, SMALL])
  await expect(page.getByText(/prontos para postar/i)).toBeVisible()
  await expect(page.locator('.suggestion-card')).toHaveCount(1)
  await expect(page.locator('.suggestion-card__meta')).toContainText(/3 fotos/i)

  // cria o carrossel a partir do grupo => abre o editor com as fotos no pool
  await page.getByRole('button', { name: /criar carrossel/i }).click()
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByRole('heading', { name: /fundo/i })).toBeVisible()
  await expect(page.locator('.thumbs .thumb:not(.thumb--none):not(.thumb--add)')).toHaveCount(3)

  // a biblioteca persiste: ao voltar, a sugestão continua lá
  await page.getByRole('button', { name: /voltar para o início/i }).click()
  await expect(page.getByText(/prontos para postar/i)).toBeVisible()
  await expect(page.locator('.suggestion-card')).toHaveCount(1)

  expect(errors).toEqual([])
})

test('biblioteca: alterna dia/lugar, dispensa/restaura sugestão e remove por seleção', async ({
  page,
}) => {
  const errors = guardPageErrors(page)
  await page.goto(APP)
  await importLibrary(page, [IMG, SMALL])
  await expect(page.locator('.suggestion-card')).toHaveCount(1)

  // alterna o agrupamento da grade entre Dia e Lugar
  await page.getByRole('button', { name: /^lugar$/i }).click()
  await page.getByRole('button', { name: /^dia$/i }).click()

  // dispensa a sugestão => some; restaurar => volta
  await page.getByRole('button', { name: /dispensar sugestão/i }).click()
  await expect(page.locator('.suggestion-card')).toHaveCount(0)
  await page.getByRole('button', { name: /restaurar 1 sugestão/i }).click()
  await expect(page.locator('.suggestion-card')).toHaveCount(1)

  // seleção múltipla: seleciona tudo e remove => biblioteca vazia
  await page.getByRole('button', { name: /^selecionar$/i }).click()
  const cells = page.locator('.library-grid__item--btn')
  const n = await cells.count()
  for (let i = 0; i < n; i++) await cells.nth(i).click()
  await page.getByRole('button', { name: /remover \d/i }).click()
  await expect(page.getByText(/importe suas fotos e o app agrupa/i)).toBeVisible()

  expect(errors).toEqual([])
})

test('resiliência: projeto em formato antigo não causa tela branca', async ({ page }) => {
  const errors = guardPageErrors(page)
  await page.goto(APP)

  // Injeta um projeto no formato pré-refactor (background por página).
  await page.evaluate(async () => {
    const req = indexedDB.open('post-maker')
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
  await expect(page.getByRole('button', { name: /exportar/i })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0)
  expect(errors).toEqual([])
})
