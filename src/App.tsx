import { Routes, Route, Navigate } from 'react-router-dom'
import { Home } from './pages/Home'
import { NewProject } from './features/create/NewProject'
import { EditorPage } from './features/editor/EditorPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/new" element={<NewProject />} />
      <Route path="/editor/:id" element={<EditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
