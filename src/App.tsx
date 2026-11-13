import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Account from './pages/Account'
import ExerciseDetail from './pages/ExerciseDetail'
import ExerciseWizard from './pages/ExerciseWizard'
import Home from './pages/Home'
import Library from './pages/Library'
import NewSession from './pages/NewSession'
import Review from './pages/Review'
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
        <Route path="exercises/new" element={<ExerciseWizard />} />
        <Route path="exercises/:id/edit" element={<ExerciseWizard />} />
        <Route path="login" element={<Account />} />
        <Route path="account" element={<Account />} />
        <Route path="review" element={<Review />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
