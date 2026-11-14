import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { RouteMeta } from './components/ui/RouteMeta';
import { ProgressGate } from './components/ui/ProgressGate';
import { BlockLoader } from './components/ui/BlockLoader';
import { authService } from './services/authService';
import { MusicRouter } from './components/ui/MusicRouter';
import { ScreenTimeGuard } from './components/ui/ScreenTimeGuard';
import { SubscriptionGuard } from './components/ui/SubscriptionGuard';
import { loadAudioIndex } from './lib/audio/library';

// Telas carregadas só quando abertas (o celular não baixa o jogo inteiro de uma vez).
// A landing ("/") chega pronta em HTML estático (pré-render); aqui só serve para a navegação dentro do app.
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const PrivacyPage = lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.TermsPage })));
const SelectAgePage = lazy(() => import('./pages/SelectAgePage').then((m) => ({ default: m.SelectAgePage })));
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
const TrainingPage = lazy(() => import('./pages/TrainingPage').then((m) => ({ default: m.TrainingPage })));
const LightningPage = lazy(() => import('./pages/LightningPage').then((m) => ({ default: m.LightningPage })));

// Carrega a conta da sessão salva (e o progresso dela) e acompanha login/logout
authService.start();
// Índice dos áudios gravados (sem ele, usa os sons sintetizados e fica sem voz)
void loadAudioIndex();

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-sky">
      <BlockLoader dark />
    </div>
  );
}

/** "/": a landing para quem não entrou; quem já entrou vai para o jogo (o index.html já tenta antes do React). */
function HomeRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    void authService.getCurrentUser().then((u) => {
      if (u) navigate('/inicio', { replace: true });
    });
  }, [navigate]);
  return <LandingPage />;
}

function App() {
  return (
    <MotionConfig reducedMotion="never">
      <Router>
        <RouteMeta />
        <MusicRouter />
        <ScreenTimeGuard />
        <SubscriptionGuard />
        <ProgressGate>
        <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/select-age" element={<SelectAgePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/dashboard" element={<StudentDashboardPage />} />
          <Route path="/responsavel" element={<ParentAreaPage />} />
          <Route path="/adventure" element={<AdventureMapPage />} />
          <Route path="/adventure/:levelNumber" element={<AdventureLevelPage />} />
          <Route path="/loja" element={<ShopPage />} />
          <Route path="/inicio" element={<StartPage />} />
          <Route path="/album" element={<AlbumPage />} />
          <Route path="/casa" element={<HousePage />} />
          <Route path="/relampago" element={<LightningPage />} />
          <Route path="/treino" element={<TrainingPage />} />
          <Route path="/treino/:activityId" element={<AdventureLevelPage />} />
          {/* Endereço antigo da landing (no servidor é um 301; aqui cobre a navegação dentro do app) */}
          <Route path="/conheca" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </ProgressGate>
      </Router>
    </MotionConfig>
  );
}

export default App;
