import { create } from 'zustand'
import { temporal } from 'zundo'
import type { AspectRatio, Page, Project } from '../types/project'
import { createPageFromArrangement } from '../lib/project-factory'
import { createId } from '../lib/id'

export interface EditorState {
  project: Project | null
  currentPageIndex: number

  setProject: (project: Project | null) => void
  rename: (name: string) => void
  setAspectRatio: (aspect: AspectRatio) => void
  setCurrentPage: (index: number) => void

  updatePage: (pageId: string, updater: (page: Page) => Page) => void
  addPage: (arrangementId?: string) => void
  duplicatePage: (pageId: string) => void
  removePage: (pageId: string) => void
  reorderPages: (from: number, to: number) => void
}

const MAX_PAGES = 4

function withTimestamp(project: Project): Project {
  return { ...project, updatedAt: Date.now() }
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set) => ({
      project: null,
      currentPageIndex: 0,

      setProject: (project) => set({ project, currentPageIndex: 0 }),

      rename: (name) =>
        set((s) => (s.project ? { project: withTimestamp({ ...s.project, name }) } : s)),

      setAspectRatio: (aspectRatio) =>
        set((s) => (s.project ? { project: withTimestamp({ ...s.project, aspectRatio }) } : s)),

      setCurrentPage: (index) =>
        set((s) => {
          if (!s.project) return s
          const clamped = Math.max(0, Math.min(index, s.project.pages.length - 1))
          return { currentPageIndex: clamped }
        }),

      updatePage: (pageId, updater) =>
        set((s) => {
          if (!s.project) return s
          const pages = s.project.pages.map((p) => (p.id === pageId ? updater(p) : p))
          return { project: withTimestamp({ ...s.project, pages }) }
        }),

      addPage: (arrangementId = 'A2') =>
        set((s) => {
          if (!s.project || s.project.pages.length >= MAX_PAGES) return s
          const pages = [...s.project.pages, createPageFromArrangement(arrangementId)]
          return {
            project: withTimestamp({ ...s.project, pages }),
            currentPageIndex: pages.length - 1,
          }
        }),

      duplicatePage: (pageId) =>
        set((s) => {
          if (!s.project || s.project.pages.length >= MAX_PAGES) return s
          const index = s.project.pages.findIndex((p) => p.id === pageId)
          if (index < 0) return s
          const clone = clonePage(s.project.pages[index])
          const pages = [...s.project.pages]
          pages.splice(index + 1, 0, clone)
          return { project: withTimestamp({ ...s.project, pages }), currentPageIndex: index + 1 }
        }),

      removePage: (pageId) =>
        set((s) => {
          if (!s.project || s.project.pages.length <= 1) return s
          const pages = s.project.pages.filter((p) => p.id !== pageId)
          const currentPageIndex = Math.min(s.currentPageIndex, pages.length - 1)
          return { project: withTimestamp({ ...s.project, pages }), currentPageIndex }
        }),

      reorderPages: (from, to) =>
        set((s) => {
          if (!s.project) return s
          const pages = [...s.project.pages]
          if (from < 0 || from >= pages.length || to < 0 || to >= pages.length) return s
          const [moved] = pages.splice(from, 1)
          pages.splice(to, 0, moved)
          return { project: withTimestamp({ ...s.project, pages }) }
        }),
    }),
    {
      // Histórico rastreia apenas o projeto (não o índice da página atual).
      partialize: (state) => ({ project: state.project }),
      limit: 50,
      equality: (a, b) => a.project === b.project,
    },
  ),
)

function clonePage(page: Page): Page {
  return {
    ...structuredClone(page),
    id: createId(),
    collage: page.collage.map((photo) => ({ ...structuredClone(photo), id: createId() })),
  }
}

/** Acesso ao histórico (undo/redo). */
export const editorTemporal = useEditorStore.temporal
