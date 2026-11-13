import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { HomePage } from './pages/HomePage';
import { SelectAgePage } from './pages/SelectAgePage';
import { WorldMapPage } from './pages/WorldMapPage';
import { ActivityListPage } from './pages/ActivityListPage';
import { ActivityPlayerPage } from './pages/ActivityPlayerPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { ParentAreaPage } from './pages/ParentAreaPage';
import { ProgressGate } from './components/ui/ProgressGate';
import { authService } from './services/authService';
import { MusicRouter } from './components/ui/MusicRouter';
import { loadAudioIndex } from './lib/audio/library';
import { AdventureMapPage } from './pages/AdventureMapPage';
import { AdventureLevelPage } from './pages/AdventureLevelPage';
import { ShopPage } from './pages/ShopPage';
import { StartPage } from './pages/StartPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AlbumPage } from './pages/AlbumPage';
import { HousePage } from './pages/HousePage';
import { LightningPage } from './pages/LightningPage';

// Página de conferência dos mobs: só existe em desenvolvimento (fica fora do build).
const MobsPage = import.meta.env.DEV
  ? lazy(() => import('./pages/MobsPage').then((m) => ({ default: m.MobsPage })))
  : null;

// Carrega a conta da sessão salva (e o progresso dela) e acompanha login/logout
authService.start();
// Índice dos áudios gravados (sem ele, usa os sons sintetizados e a voz do aparelho)
void loadAudioIndex();

function App() {
  return (
    <MotionConfig reducedMotion="never">
      <Router>
        <MusicRouter />
        <ProgressGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/select-age" element={<SelectAgePage />} />
          <Route path="/world" element={<WorldMapPage />} />
          <Route path="/activities" element={<ActivityListPage />} />
        <Route path="/activities/:category" element={<ActivityListPage />} />
          <Route path="/activity/:id" element={<ActivityPlayerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<StudentDashboardPage />} />
          <Route path="/responsavel" element={<ParentAreaPage />} />
          <Route path="/teacher" element={<Navigate to="/responsavel" replace />} />
          <Route path="/adventure" element={<AdventureMapPage />} />
          <Route path="/adventure/:levelNumber" element={<AdventureLevelPage />} />
          <Route path="/loja" element={<ShopPage />} />
          <Route path="/inicio" element={<StartPage />} />
          <Route path="/album" element={<AlbumPage />} />
          <Route path="/casa" element={<HousePage />} />
          <Route path="/relampago" element={<LightningPage />} />
          {MobsPage && (
            <Route
              path="/mobs"
              element={
                <Suspense fallback={null}>
                  <MobsPage />
                </Suspense>
              }
            />
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ProgressGate>
      </Router>
    </MotionConfig>
  );
}

export default App;
