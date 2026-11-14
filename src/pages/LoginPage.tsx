import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MinecraftCard } from '../components/ui/MinecraftCard';
import { AuthPanel } from '../components/auth/AuthPanel';
import { IntroSplash } from '../components/intro/IntroSplash';
import { GroundStrip } from '../components/layout/GroundStrip';
import { useState } from 'react';

// A abertura (Estourinho explodindo) toca ao chegar no login a cada vez que o site é aberto/atualizado;
// zera ao recarregar a página, mas não ao voltar para /login dentro do site.
let introPlayed = false;

/** Página de acesso (mesmo conteúdo do modal da tela inicial). */
export function LoginPage() {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(() => !introPlayed);
  const endIntro = () => {
    introPlayed = true;
    setShowIntro(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-8">
      {showIntro && <IntroSplash onDone={endIntro} />}
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-sky via-blue-300 to-green-500" />

      {/* Chão (o mesmo da landing) */}
      <GroundStrip dirt="h-28" />

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <MinecraftCard>
          <AuthPanel onSuccess={() => navigate('/inicio')} />
          <p className="px-6 pb-2 text-center font-body text-xs text-gray-600">
            Ao entrar ou criar conta, você concorda com os{' '}
            <Link to="/termos" className="underline">termos de uso</Link> e a{' '}
            <Link to="/privacidade" className="underline">política de privacidade</Link>.
          </p>
          <div className="pb-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1 font-body text-sm text-gray-700 hover:text-brand-green min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Voltar ao início
            </Link>
          </div>
        </MinecraftCard>
      </motion.div>
    </div>
  );
}
