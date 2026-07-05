import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { AppBar } from '../components/ui'
import { Plus, Sparkle } from '../components/icons'
import { listProjects, deleteProject, saveProject, listLibraryPhotos } from '../lib/storage'
import type { Project } from '../types/project'
import {
  clusterByDayAndPlace,
  clusterByPlaceAcrossDays,
  type SuggestionGroup,
} from '../lib/suggestions'
import { loadDismissed } from '../lib/dismissals'
import { MomentCard } from '../features/suggestions/MomentCard'
import { createProjectFromGroup, momentDateLabel } from '../features/suggestions/moment'
import { ProjectCard } from './ProjectCard'

/** Quantos momentos mostrar em destaque na home (o resto fica na tela dedicada). */
const HOME_MOMENTS = 3

export function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [moments, setMoments] = useState<SuggestionGroup[]>([])

  useEffect(() => {
    listProjects().then(setProjects)
    // Momentos recentes da biblioteca (mesma lógica da tela de sugestões).
    listLibraryPhotos().then((lib) => {
      const dismissed = loadDismissed()
      const groups = [...clusterByDayAndPlace(lib), ...clusterByPlaceAcrossDays(lib)]
        .filter((g) => !dismissed.has(g.key))
        .sort((a, b) => b.takenAt - a.takenAt)
      setMoments(groups.slice(0, HOME_MOMENTS))
    })
    // Pré-carrega o chunk do editor (Konva) em segundo plano, para abrir um
    // projeto sem esperar o download/parse na hora do clique.
    const prefetch = () => void import('../features/editor/canvas/EditorStage')
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback
    if (ric) ric(prefetch)
    else setTimeout(prefetch, 400)
  }, [])

  async function createFromMoment(group: SuggestionGroup) {
    const id = await createProjectFromGroup(group, t, i18n.language)
    navigate(`/editor/${id}`)
  }

  async function remove(id: string) {
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  async function rename(project: Project, name: string) {
    const updated = { ...project, name, updatedAt: Date.now() }
    await saveProject(updated)
    setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)))
  }

  return (
    <>
      <AppBar title={t('app.name')} right={<LanguageSwitcher />} />
      <div className="route__scroll">
        <button
          className="btn btn--block home-create"
          type="button"
          onClick={() => navigate('/new')}
        >
          <Plus /> {t('home.create')}
        </button>
        {moments.length === 0 && (
          <button
            className="btn btn--ghost btn--block home-suggest"
            type="button"
            onClick={() => navigate('/suggestions')}
          >
            <Sparkle /> {t('home.suggestions')}
          </button>
        )}

        {moments.length > 0 && (
          <>
            <div className="suggestions__bar home-moments__bar">
              <h2 className="section-title">{t('home.recentMoments')}</h2>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => navigate('/suggestions')}
              >
                {t('home.seeAllMoments')}
              </button>
            </div>
            <ul className="suggestion-list home-moments">
              {moments.map((group) => (
                <MomentCard
                  key={group.key}
                  group={group}
                  dateLabel={momentDateLabel(group, t, i18n.language)}
                  onCreate={() => createFromMoment(group)}
                />
              ))}
            </ul>
          </>
        )}

        {projects.length === 0 ? (
          <p className="empty">{t('home.noProjects')}</p>
        ) : (
          <>
            <h2 className="section-title">{t('home.yourProjects')}</h2>
            <ul className="project-list">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={() => navigate(`/editor/${p.id}`)}
                  onDelete={() => remove(p.id)}
                  onRename={(name) => rename(p, name)}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
