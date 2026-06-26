import JSZip from 'jszip'
import type { Project } from '../types/project'

const MANIFEST = 'project.json'
const ASSET_DIR = 'assets'
const FORMAT_VERSION = 1

interface Manifest {
  formatVersion: number
  app: 'post-maker'
  project: Project
  /** assetId -> caminho do arquivo dentro do zip. */
  assetFiles: Record<string, string>
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(EXT_BY_MIME).map(([mime, ext]) => [ext, mime]),
)

function extForBlob(blob: Blob): string {
  return EXT_BY_MIME[blob.type] ?? 'bin'
}

function mimeForPath(path: string): string {
  const ext = path.split('.').pop() ?? ''
  return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}

/** Coleta todos os assetIds referenciados por um projeto. */
export function collectAssetIds(project: Project): string[] {
  const ids = new Set<string>()
  for (const page of project.pages) {
    if (page.background.assetId) ids.add(page.background.assetId)
    for (const photo of page.collage) {
      if (photo.assetId) ids.add(photo.assetId)
    }
  }
  return [...ids]
}

/** Empacota o projeto e seus assets num arquivo .zip (Blob). */
export async function exportProjectZip(project: Project, assets: Map<string, Blob>): Promise<Blob> {
  const zip = new JSZip()
  const assetFiles: Record<string, string> = {}
  const folder = zip.folder(ASSET_DIR)!

  for (const id of collectAssetIds(project)) {
    const blob = assets.get(id)
    if (!blob) continue
    const ext = extForBlob(blob)
    assetFiles[id] = `${ASSET_DIR}/${id}.${ext}`
    // Converte para ArrayBuffer: tipo universalmente aceito pelo JSZip em
    // qualquer ambiente (browser e Node).
    folder.file(`${id}.${ext}`, await blob.arrayBuffer())
  }

  const manifest: Manifest = {
    formatVersion: FORMAT_VERSION,
    app: 'post-maker',
    project,
    assetFiles,
  }
  zip.file(MANIFEST, JSON.stringify(manifest, null, 2))

  const buffer = await zip.generateAsync({ type: 'arraybuffer' })
  return new Blob([buffer], { type: 'application/zip' })
}

export interface ImportedProject {
  project: Project
  assets: Map<string, Blob>
}

/** Lê um .zip exportado e reconstrói projeto + assets. */
export async function importProjectZip(input: Blob | ArrayBuffer): Promise<ImportedProject> {
  const data = input instanceof Blob ? await input.arrayBuffer() : input
  const zip = await JSZip.loadAsync(data)

  const manifestFile = zip.file(MANIFEST)
  if (!manifestFile) {
    throw new Error('Arquivo de projeto inválido: project.json ausente.')
  }
  const manifest = JSON.parse(await manifestFile.async('string')) as Manifest
  if (manifest.app !== 'post-maker') {
    throw new Error('Arquivo de projeto inválido: não é um projeto do Post Maker.')
  }

  const assets = new Map<string, Blob>()
  for (const [assetId, path] of Object.entries(manifest.assetFiles)) {
    const file = zip.file(path)
    if (!file) continue
    const buffer = await file.async('arraybuffer')
    assets.set(assetId, new Blob([buffer], { type: mimeForPath(path) }))
  }

  return { project: manifest.project, assets }
}
