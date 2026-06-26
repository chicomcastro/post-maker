import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Project } from '../types/project'

interface PostMakerDB extends DBSchema {
  projects: {
    key: string
    value: Project
    indexes: { updatedAt: number }
  }
  assets: {
    key: string
    value: Blob
  }
}

const DB_NAME = 'post-maker'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<PostMakerDB>> | null = null

function getDB(): Promise<IDBPDatabase<PostMakerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PostMakerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const projects = db.createObjectStore('projects', { keyPath: 'id' })
        projects.createIndex('updatedAt', 'updatedAt')
        db.createObjectStore('assets')
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
  return db.get('projects', id)
}

/** Lista projetos do mais recente para o mais antigo. */
export async function listProjects(): Promise<Project[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('projects', 'updatedAt')
  return all.reverse()
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('projects', id)
}

export async function putAsset(id: string, blob: Blob): Promise<void> {
  const db = await getDB()
  await db.put('assets', blob, id)
}

export async function getAsset(id: string): Promise<Blob | undefined> {
  const db = await getDB()
  return db.get('assets', id)
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('assets', id)
}

/** Remove assets que não são mais referenciados por nenhum projeto. */
export async function pruneOrphanAssets(): Promise<number> {
  const db = await getDB()
  const projects = await db.getAll('projects')
  const referenced = new Set<string>()
  for (const project of projects) {
    for (const page of project.pages) {
      if (page.background.assetId) referenced.add(page.background.assetId)
      for (const photo of page.collage) {
        if (photo.assetId) referenced.add(photo.assetId)
      }
    }
  }
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
