import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ScrumPoker from './pages/ScrumPoker'
import StandupWheel from './pages/StandupWheel'
import FoodPicker from './pages/FoodPicker'
import PagerDuty from './pages/PagerDuty'
import SentryViewer from './pages/SentryViewer'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="scrum-poker" element={<ScrumPoker />} />
          <Route path="standup-wheel" element={<StandupWheel />} />
          <Route path="food-picker" element={<FoodPicker />} />
          <Route path="pagerduty" element={<PagerDuty />} />
          <Route path="sentry" element={<SentryViewer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
