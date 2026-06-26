import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Home } from './pages/Home'
import { NewProject } from './features/create/NewProject'
import { EditorPage } from './features/editor/EditorPage'

const variants = {
  enter: { x: '100%' },
  center: { x: 0 },
  exit: { x: '-22%', opacity: 0.4 },
}

export function App() {
  const location = useLocation()
  return (
    <div className="app-shell">
      <AnimatePresence initial={false}>
        <motion.div
          key={location.pathname}
          className="route"
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<NewProject />} />
            <Route path="/editor/:id" element={<EditorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
