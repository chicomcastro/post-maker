import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
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
    <main className="container home">
      <header className="home__topbar">
        <strong>{t('app.name')}</strong>
        <LanguageSwitcher />
      </header>

      <section className="home__hero">
        <h1>{t('app.tagline')}</h1>
        <p>{t('home.subtitle')}</p>
        <div className="home__actions">
          <button className="btn" type="button" onClick={() => navigate('/new')}>
            {t('home.create')}
          </button>
        </div>
      </section>

      <section className="home__projects" aria-label={t('home.yourProjects')}>
        <h2>{t('home.yourProjects')}</h2>
        {projects.length === 0 ? (
          <p className="muted">{t('home.noProjects')}</p>
        ) : (
          <ul className="project-list">
            {projects.map((p) => (
              <li key={p.id} className="project-list__item">
                <Link to={`/editor/${p.id}`} className="project-list__link">
                  <span className="project-list__name">{p.name}</span>
                  <span className="muted">{t('home.pageCount', { count: p.pages.length })}</span>
                </Link>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => remove(p.id)}
                  aria-label={t('home.deleteProject')}
                >
                  {t('home.deleteProject')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
