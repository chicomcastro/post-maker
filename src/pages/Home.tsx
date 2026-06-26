import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { AppBar, IconButton } from '../components/ui'
import { Plus, Trash } from '../components/icons'
import { listProjects, deleteProject } from '../lib/storage'
import type { Project } from '../types/project'

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

  return (
    <>
      <AppBar title={t('app.name')} right={<LanguageSwitcher />} />
      <div className="route__scroll">
        <section className="hero">
          <h1>{t('app.tagline')}</h1>
          <p>{t('home.subtitle')}</p>
          <button className="btn btn--block" type="button" onClick={() => navigate('/new')}>
            <Plus /> {t('home.create')}
          </button>
        </section>

        <h2 className="section-title">{t('home.yourProjects')}</h2>
        {projects.length === 0 ? (
          <p className="empty">{t('home.noProjects')}</p>
        ) : (
          <ul className="project-list">
            {projects.map((p) => (
              <li key={p.id} className="project-card">
                <button
                  className="project-card__thumb"
                  onClick={() => navigate(`/editor/${p.id}`)}
                  aria-label={t('home.openProject')}
                />
                <div style={{ flex: 1 }} onClick={() => navigate(`/editor/${p.id}`)}>
                  <div className="project-card__name">{p.name}</div>
                  <div className="project-card__meta muted">
                    {t('home.pageCount', { count: p.pages.length })}
                  </div>
                </div>
                <IconButton label={t('home.deleteProject')} onClick={() => remove(p.id)}>
                  <Trash />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
