import { MinecraftButton } from '../components/ui/MinecraftButton';
import { ItemArt } from '../components/activities/shared/ItemArt';
import { PixelArt } from '../components/activities/shared/PixelArt';
import { landingSprite } from '../components/landing/landingIcons';
import { GroundStrip } from '../components/layout/GroundStrip';
import { Mob } from '../components/mobs/Mob';
import { AGE_GROUPS } from '../lib/constants';
import { FAQ, PRODUCT, formatBRL } from '../config/product';
import { LegalFooter } from './LegalPages';

/** Blocos do topo (arte própria: letras e números, como no og-image). */
const HERO_BLOCKS = [
  { text: '1', color: 'bg-brand-redstone' },
  { text: 'A', color: 'bg-brand-lapis' },
  { text: '+', color: 'bg-amber-500' },
  { text: 'B', color: 'bg-purple-500' },
  { text: '3', color: 'bg-emerald-600' },
];

const STEPS = [
  { icon: '👨‍👧', title: 'Crie sua conta', text: 'Você cria o login e a senha de cada criança na Área dos Pais.' },
  { icon: '🗺️', title: 'A criança joga', text: '100 fases em 10 mundos, com perguntas para a idade dela, voz e personagem próprio.' },
  { icon: '📊', title: 'Você acompanha', text: 'Veja o que ela fez na semana, onde vai bem e o que pode treinar.' },
];

const FEATURES = [
  { icon: '🔊', title: 'Tudo falado', text: 'Perguntas lidas em voz alta para quem ainda não lê.' },
  { icon: '➕', title: 'Contas animadas', text: 'Bichinhos que se juntam, saem e se dividem na tela.' },
  { icon: '⚔️', title: 'Prova do chefe', text: 'No fim de cada mundo, uma prova com tudo o que aprendeu.' },
  { icon: '🏆', title: 'Troféus e figurinhas', text: 'XP, estrelas, conquistas, álbum e roupas.' },
  { icon: '🔥', title: 'Hábito de estudo', text: 'Dias seguidos, meta do dia e treino do que errou.' },
  { icon: '🎯', title: 'Se adapta', text: 'Acertou tudo? Fica mais difícil. Errou? Mais fácil.' },
];

const SAFETY = [
  { icon: '🚫', text: 'Sem anúncios e sem compras no jogo' },
  { icon: '🔐', text: 'Conta da criança criada por você' },
  { icon: '⏱️', text: 'Tempo de tela que você escolhe' },
];

/** Um só estilo de cartão na página. */
const CARD = 'bg-white rounded-xl border-2 border-gray-200 shadow-sm';
/** No celular: faixa que rola para o lado; a partir do tablet: grade. */
const SCROLL_ROW = 'flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid';

/** Ícone em pixel art (igual em qualquer aparelho); sem desenho, o emoji. */
function Icon({ emoji, size = 40 }: { emoji: string; size?: number }) {
  const sprite = landingSprite(emoji);
  if (sprite) return <PixelArt sprite={sprite} size={size} />;
  return (
    <span style={{ fontSize: size * 0.85, lineHeight: 1 }} aria-hidden="true">
      {emoji}
    </span>
  );
}

/** Celular com uma tela do jogo (desenhada aqui, sem JavaScript: a landing é só HTML + CSS). */
function PhoneMock() {
  const options = [4, 5, 6, 3];
  return (
    <div className="relative w-[230px] sm:w-[250px] rounded-[2rem] bg-gray-900 p-2.5 shadow-2xl ring-1 ring-black/20" aria-hidden="true">
      <div className="mx-auto mb-1.5 h-1.5 w-16 rounded-full bg-gray-700" />
      <div className="overflow-hidden rounded-[1.4rem] bg-gradient-to-b from-sky-300 via-sky-200 to-lime-100">
        {/* Topo da fase */}
        <div className="bg-green-800/95 px-3 py-2">
          <p className="font-minecraft text-[8px] text-white/90">🏡 Fase 3 · Vila</p>
          <div className="mt-1 h-2 rounded-full bg-black/30">
            <div className="h-2 w-2/5 rounded-full bg-brand-gold" />
          </div>
        </div>
        {/* Personagem perguntando */}
        <div className="flex items-end gap-2 px-3 pt-3">
          <Mob type="steve" size={66} animation="idle" />
          <div className="relative mb-6 rounded-lg bg-white px-2.5 py-1.5 font-body text-sm font-extrabold text-gray-900 shadow">
            Quanto é 2 + 3?
          </div>
        </div>
        {/* Alternativas (o 5 já acertado) */}
        <div className="grid grid-cols-2 gap-2 px-3 pb-3 pt-1">
          {options.map((n) => (
            <div
              key={n}
              className={`flex h-12 items-center justify-center rounded-md pixel-border font-minecraft text-lg text-gray-900 ${
                n === 5 ? 'bg-brand-emerald ring-4 ring-emerald-300' : 'block-pattern bg-stone-300'
              }`}
            >
              {n}
            </div>
          ))}
        </div>
        <div className="h-2 bg-brand-green" />
        <div className="h-5 bg-brand-dirt block-pattern" />
      </div>
    </div>
  );
}

/** Página para os pais conhecerem o StudyBlock (vendas). Fica em "/" e é pré-renderizada no build. */
export function LandingPage() {
  const price = PRODUCT.monthlyPrice;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Topo */}
      <header className="bg-gradient-to-b from-brand-sky to-sky-100 px-4 pt-6 pb-20 relative overflow-hidden">
        <nav className="max-w-5xl mx-auto flex items-center justify-between mb-8 sm:mb-10">
          <span className="font-minecraft text-sm text-brand-ink">⛏️ {PRODUCT.name}</span>
          <MinecraftButton variant="info" size="sm" plain href="/login">
            Entrar
          </MinecraftButton>
        </nav>
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <h1 className="font-body font-black text-4xl sm:text-5xl leading-tight text-brand-ink">
              Seu filho aprende brincando num mundo de blocos
            </h1>
            <p className="font-body text-lg text-gray-800 mt-4">
              Matemática, letras, cores e formas em uma aventura com voz, personagens e recompensas, feita para crianças de 0 a 10 anos estudarem em casa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <MinecraftButton variant="gold" size="lg" plain href="/login">
                {PRODUCT.trialDays > 0 ? `Testar ${PRODUCT.trialDays} dias grátis` : 'Começar'}
              </MinecraftButton>
              <MinecraftButton variant="info" size="lg" plain href="/login">
                Ver o jogo
              </MinecraftButton>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6">
            <PhoneMock />
            <div className="flex justify-center items-end gap-2" aria-hidden="true">
              {HERO_BLOCKS.map((b, i) => (
                <span key={b.text} className={i % 2 ? 'mb-4' : ''}>
                  {/* Cada bloco pula na sua vez (onda da esquerda para a direita) */}
                  <span
                    className={`hero-hop ${b.color} w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center font-minecraft text-lg sm:text-2xl text-white border-b-[6px] border-r-4 border-black/25 shadow-lg`}
                    style={{ animationDelay: `${i * 0.18}s` }}
                  >
                    {b.text}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <GroundStrip />
      </header>

      <main>
        {/* Como funciona */}
        <section aria-labelledby="como" className="max-w-5xl mx-auto px-4 py-14">
          <h2 id="como" className="font-minecraft text-lg sm:text-xl text-center mb-8">Como funciona</h2>
          <ol className="grid md:grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`${CARD} p-5 text-center`}>
                <div className="flex justify-center mb-3">
                  <Icon emoji={s.icon} size={44} />
                </div>
                <p className="font-body font-bold text-lg">{i + 1}. {s.title}</p>
                <p className="font-body text-gray-700 mt-1">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Recursos */}
        <section aria-labelledby="recursos" className="bg-amber-50 py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 id="recursos" className="font-minecraft text-lg sm:text-xl text-center mb-8">O que tem no jogo</h2>
            <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {FEATURES.map((f) => (
                <li key={f.title} className={`${CARD} p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3`}>
                  <span className="shrink-0">
                    <Icon emoji={f.icon} size={36} />
                  </span>
                  <div>
                    <p className="font-body font-bold">{f.title}</p>
                    <p className="font-body text-sm text-gray-700">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Idades */}
        <section aria-labelledby="idades" className="max-w-5xl mx-auto px-4 py-14">
          <h2 id="idades" className="font-minecraft text-lg sm:text-xl text-center mb-8">Para cada idade</h2>
          <ul className={`${SCROLL_ROW} sm:grid-cols-3 lg:grid-cols-6`}>
            {AGE_GROUPS.map((g) => (
              <li key={g.id} className={`${CARD} p-3 text-center shrink-0 w-32 snap-start sm:w-auto`}>
                <div className="flex justify-center mb-1">
                  <Icon emoji={g.icon} size={36} />
                </div>
                <p className="font-body font-bold">{g.name}</p>
                <p className="font-body text-xs text-gray-600">{g.ageRange}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Segurança */}
        <section aria-labelledby="seguro" className="bg-sky-50 py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="seguro" className="font-minecraft text-lg sm:text-xl mb-6">Seguro para a criança</h2>
            <ul className={`${SCROLL_ROW} sm:grid-cols-3 font-body`}>
              {SAFETY.map((s) => (
                <li key={s.text} className={`${CARD} p-4 shrink-0 w-52 snap-start sm:w-auto`}>
                  <div className="flex justify-center mb-2">
                    <Icon emoji={s.icon} size={36} />
                  </div>
                  {s.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Preço */}
        <section aria-labelledby="preco" className="max-w-md mx-auto px-4 py-14 text-center">
          <h2 id="preco" className="font-minecraft text-lg sm:text-xl mb-6">Preço</h2>
          <div className="rounded-2xl pixel-border bg-gradient-to-b from-yellow-100 to-amber-200 p-6">
            <div className="flex justify-center mb-2" aria-hidden="true">
              <ItemArt emoji="💰" size={48} />
            </div>
            {price ? (
              <>
                <p className="font-minecraft text-2xl">{formatBRL(price)}<span className="font-body text-base">/mês</span></p>
                {PRODUCT.yearlyPrice && <p className="font-body text-sm mt-1">ou {formatBRL(PRODUCT.yearlyPrice)} por ano</p>}
              </>
            ) : (
              <p className="font-body text-lg font-bold">Preço em breve</p>
            )}
            <p className="font-body text-sm text-gray-800 mt-2">
              Até {PRODUCT.maxChildren} crianças na mesma conta{PRODUCT.trialDays > 0 ? ` · ${PRODUCT.trialDays} dias grátis para testar` : ''}.
            </p>
            <MinecraftButton variant="gold" size="lg" plain fullWidth className="mt-5" href="/login">
              Criar minha conta
            </MinecraftButton>
          </div>
        </section>

        {/* Perguntas */}
        <section aria-labelledby="faq" className="bg-gray-50 py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 id="faq" className="font-minecraft text-lg sm:text-xl text-center mb-6">Perguntas frequentes</h2>
            <div className="space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className={`${CARD} p-4`}>
                  <summary className="font-body font-bold cursor-pointer">{f.q}</summary>
                  <p className="font-body text-gray-700 mt-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
