import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Título do projeto editável na barra do editor: toque para renomear.
 * Confirma com Enter/blur, cancela com Esc. Mantém o nome anterior se vazio.
 */
export function ProjectTitle({
  name,
  onRename,
}: {
  name: string
  onRename: (name: string) => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    const next = value.trim()
    if (next && next !== name) onRename(next)
    else setValue(name)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="title-edit"
        value={value}
        aria-label={t('editor.renameProject')}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setValue(name)
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className="title-btn"
      aria-label={t('editor.renameProject')}
      onClick={() => {
        setValue(name)
        setEditing(true)
      }}
    >
      {name}
    </button>
  )
}
