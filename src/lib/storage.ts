import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Project } from '../types/project'
import { normalizeProject } from './migrations'

/** Foto da biblioteca do usuário: asset + metadados p/ agrupar por dia/lugar. */
export interface LibraryPhoto {
  assetId: string
  /** Momento da captura (EXIF; fallback: lastModified do arquivo). */
  takenAt: number
  /** Coordenadas EXIF, quando presentes. */
  lat?: number
  lon?: number
  /** Nome do lugar (geocodificação opcional, feita a pedido do usuário). */
  place?: string
  addedAt: number
}

interface PostMakerDB extends DBSchema {
  projects: {
    key: string
    value: Project
    indexes: { updatedAt: number }
  }
  assets: {
    key: string
    // Guardamos ArrayBuffer + tipo (não Blob direto): o Safari/WebKit falha ao
    // armazenar Blob/File no IndexedDB ("Error preparing Blob/File data...").
    // Blob antigo (de versões anteriores) é tolerado na leitura.
    value: StoredAsset | Blob
  }
  library: {
    key: string
    value: LibraryPhoto
    indexes: { takenAt: number }
  }
}

interface StoredAsset {
  type: string
  buffer: ArrayBuffer
}

const DB_NAME = 'post-maker'
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<PostMakerDB>> | null = null

function getDB(): Promise<IDBPDatabase<PostMakerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PostMakerDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const projects = db.createObjectStore('projects', { keyPath: 'id' })
          projects.createIndex('updatedAt', 'updatedAt')
          db.createObjectStore('assets')
        }
        if (oldVersion < 2) {
          const library = db.createObjectStore('library', { keyPath: 'assetId' })
          library.createIndex('takenAt', 'takenAt')
        }
      },
    })
  }
  return dbPromise
}

/** Apenas para testes: reseta a conexão em cache. */
export function _resetDbForTests(): void {
  dbPromise = null
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB()
  await db.put('projects', project)
}

export async function loadProject(id: string): Promise<Project | undefined> {
  const db = await getDB()
  const raw = await db.get('projects', id)
  return raw ? normalizeProject(raw) : undefined
}

/** Lista projetos do mais recente para o mais antigo. */
export async function listProjects(): Promise<Project[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('projects', 'updatedAt')
  return all.reverse().map(normalizeProject)
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('projects', id)
}

export async function putAsset(id: string, blob: Blob): Promise<void> {
  const db = await getDB()
  // Converte para ArrayBuffer antes de gravar (compatível com Safari/WebKit).
  const buffer = await blob.arrayBuffer()
  const stored: StoredAsset = { type: blob.type, buffer }
  await db.put('assets', stored, id)
}

export async function getAsset(id: string): Promise<Blob | undefined> {
  const db = await getDB()
  const stored = await db.get('assets', id)
  if (!stored) return undefined
  if (stored instanceof Blob) return stored // dados de versões anteriores
  return new Blob([stored.buffer], { type: stored.type })
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('assets', id)
}

/** Adiciona/atualiza fotos na biblioteca (metadados por assetId). */
export async function putLibraryPhotos(photos: LibraryPhoto[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('library', 'readwrite')
  for (const photo of photos) await tx.store.put(photo)
  await tx.done
}

/** Lista a biblioteca da foto mais recente para a mais antiga. */
export async function listLibraryPhotos(): Promise<LibraryPhoto[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('library', 'takenAt')
  return all.reverse()
}

/** Grava o nome do lugar (geocodificação) de fotos da biblioteca. */
export async function setLibraryPlaces(places: Map<string, string>): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('library', 'readwrite')
  for (const [assetId, place] of places) {
    const photo = await tx.store.get(assetId)
    if (photo) await tx.store.put({ ...photo, place })
  }
  await tx.done
}

export async function removeLibraryPhoto(assetId: string): Promise<void> {
  const db = await getDB()
  await db.delete('library', assetId)
}

/** Esvazia a biblioteca (os assets órfãos são removidos pelo prune). */
export async function clearLibrary(): Promise<void> {
  const db = await getDB()
  await db.clear('library')
}

/**
 * Remove assets que não são referenciados por nenhum projeto NEM pela
 * biblioteca de fotos.
 */
export async function pruneOrphanAssets(): Promise<number> {
  const db = await getDB()
  const projects = await db.getAll('projects')
  const referenced = new Set<string>()
  for (const project of projects) {
    for (const id of project.assetPool ?? []) referenced.add(id)
    if (project.background.assetId) referenced.add(project.background.assetId)
    for (const page of project.pages) {
      for (const photo of page.collage) {
        if (photo.assetId) referenced.add(photo.assetId)
      }
    }
  }
  for (const key of await db.getAllKeys('library')) referenced.add(key)
  const keys = await db.getAllKeys('assets')
  let removed = 0
  for (const key of keys) {
    if (!referenced.has(key)) {
      await db.delete('assets', key)
      removed++
    }
  }
  return removed
}
