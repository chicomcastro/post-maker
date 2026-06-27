import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * Captura erros de render para nunca exibir uma tela branca. Mostra um fallback
 * com a opção de voltar ao início (limpando a rota) e recarregar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Erro de render capturado:', error)
  }

  handleReset = async () => {
    // Limpa um possível service worker / cache antigo antes de recarregar.
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } catch {
      // ignora: o reload abaixo ainda ajuda
    }
    window.location.hash = '#/'
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-shell">
          <div className="route">
            <div className="route__scroll">
              <div className="error-screen">
                <h1>Algo deu errado</h1>
                <p className="muted">
                  Tivemos um problema ao abrir esta tela. Você pode voltar ao início e tentar de
                  novo — seus projetos continuam salvos.
                </p>
                <button className="btn btn--block" type="button" onClick={this.handleReset}>
                  Voltar ao início
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
