import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/Home.jsx'
import { LoginPage } from './pages/Login.jsx'
import { LobbyPage } from './pages/Lobby.jsx'
import { GamePage } from './pages/Game.jsx'
import { HistoryPage } from './pages/History.jsx'
import { ProfilePage } from './pages/Profile.jsx'
import { MultiplayerGamePage } from './pages/MultiplayerGame.jsx'
import { LeaderboardPage } from './pages/Leaderboard.jsx'
import { Layout } from './components/Layout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      {/* Home standalone (no layout) */}
      <Route path="/" element={<HomePage />} />

      {/* All routes with Layout */}
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/multiplayer" element={<MultiplayerGamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
