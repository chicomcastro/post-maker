import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { AppBar } from '../components/ui'
import { Plus } from '../components/icons'
import { listProjects, deleteProject, saveProject } from '../lib/storage'
import type { Project } from '../types/project'
import { ProjectCard } from './ProjectCard'

export function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    listProjects().then(setProjects)
  }, [])

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
