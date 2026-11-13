import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ExerciseDetail from './pages/ExerciseDetail'
import Home from './pages/Home'
import Library from './pages/Library'
import NewSession from './pages/NewSession'
import SessionView from './pages/SessionView'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="plan" element={<NewSession />} />
        <Route path="session/:id" element={<SessionView />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<ExerciseDetail />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
