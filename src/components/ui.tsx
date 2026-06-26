import type { ReactNode } from 'react'

export function IconButton({
  label,
  onClick,
  disabled,
  dark: _dark,
  children,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  dark?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

/** Barra de topo no estilo de app nativo (esquerda / título / direita). */
export function AppBar({
  title,
  left,
  right,
  dark,
}: {
  title?: ReactNode
  left?: ReactNode
  right?: ReactNode
  dark?: boolean
}) {
  return (
    <header className={'appbar' + (dark ? ' appbar--dark' : '')}>
      <div className="appbar__left">{left}</div>
      <div className="appbar__title">{title}</div>
      <div className="appbar__right">{right}</div>
    </header>
  )
}
