import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { HomePage } from './pages/HomePage';
import { ProgressGate } from './components/ui/ProgressGate';
import { BlockLoader } from './components/ui/BlockLoader';
import { authService } from './services/authService';
import { MusicRouter } from './components/ui/MusicRouter';
import { ScreenTimeGuard } from './components/ui/ScreenTimeGuard';
import { loadAudioIndex } from './lib/audio/library';

// Telas carregadas só quando abertas (o celular não baixa o jogo inteiro de uma vez).
// A tela inicial vem junto, para abrir na hora.
const SelectAgePage = lazy(() => import('./pages/SelectAgePage').then((m) => ({ default: m.SelectAgePage })));
const WorldMapPage = lazy(() => import('./pages/WorldMapPage').then((m) => ({ default: m.WorldMapPage })));
const ActivityListPage = lazy(() => import('./pages/ActivityListPage').then((m) => ({ default: m.ActivityListPage })));
const ActivityPlayerPage = lazy(() => import('./pages/ActivityPlayerPage').then((m) => ({ default: m.ActivityPlayerPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage })));
const ParentAreaPage = lazy(() => import('./pages/ParentAreaPage').then((m) => ({ default: m.ParentAreaPage })));
const AdventureMapPage = lazy(() => import('./pages/AdventureMapPage').then((m) => ({ default: m.AdventureMapPage })));
const AdventureLevelPage = lazy(() => import('./pages/AdventureLevelPage').then((m) => ({ default: m.AdventureLevelPage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const StartPage = lazy(() => import('./pages/StartPage').then((m) => ({ default: m.StartPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const AlbumPage = lazy(() => import('./pages/AlbumPage').then((m) => ({ default: m.AlbumPage })));
const HousePage = lazy(() => import('./pages/HousePage').then((m) => ({ default: m.HousePage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const TrainingPage = lazy(() => import('./pages/TrainingPage').then((m) => ({ default: m.TrainingPage })));
const LightningPage = lazy(() => import('./pages/LightningPage').then((m) => ({ default: m.LightningPage })));

// Página de conferência dos mobs: só existe em desenvolvimento (fica fora do build).
const MobsPage = import.meta.env.DEV
  ? lazy(() => import('./pages/MobsPage').then((m) => ({ default: m.MobsPage })))
  : null;

// Carrega a conta da sessão salva (e o progresso dela) e acompanha login/logout
authService.start();
// Índice dos áudios gravados (sem ele, usa os sons sintetizados e a voz do aparelho)
void loadAudioIndex();

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-minecraft-sky">
      <BlockLoader dark />
    </div>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="never">
      <Router>
        <MusicRouter />
        <ScreenTimeGuard />
        <ProgressGate>
        <Suspense fallback={<RouteLoading />}>
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
          <Route path="/treino" element={<TrainingPage />} />
          <Route path="/conheca" element={<LandingPage />} />
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
        </Suspense>
        </ProgressGate>
      </Router>
    </MotionConfig>
  );
}

export default App;
