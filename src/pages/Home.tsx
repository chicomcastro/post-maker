import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function Home() {
  const { t } = useTranslation()

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
          <button className="btn" type="button">
            {t('home.create')}
          </button>
        </div>
      </section>

      <section className="home__projects" aria-label={t('home.yourProjects')}>
        <h2>{t('home.yourProjects')}</h2>
        <p className="muted">{t('home.noProjects')}</p>
      </section>
    </main>
  )
}
