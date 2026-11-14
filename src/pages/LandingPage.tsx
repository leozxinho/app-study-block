import { MinecraftButton } from '../components/ui/MinecraftButton';
import { ItemArt } from '../components/activities/shared/ItemArt';
import { AGE_GROUPS } from '../lib/constants';
import { FAQ, PRODUCT, formatBRL } from '../config/product';
import { LegalFooter } from './LegalPages';

/** Blocos do topo (arte própria: letras e números, como no og-image). */
const HERO_BLOCKS = [
  { text: '1', color: 'bg-red-500' },
  { text: 'A', color: 'bg-blue-500' },
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
  { icon: '🔊', title: 'Tudo falado', text: 'As perguntas são lidas em voz alta — perfeito para quem ainda não lê.' },
  { icon: '➕', title: 'Contas animadas', text: 'Somar, tirar, multiplicar e dividir com bichinhos que se movem e são contados.' },
  { icon: '⚔️', title: 'Prova do chefe', text: 'No fim de cada mundo, uma prova divertida com tudo o que a criança aprendeu.' },
  { icon: '🏆', title: 'Troféus e figurinhas', text: 'XP, estrelas, conquistas, álbum de figurinhas e roupas para o personagem.' },
  { icon: '🔥', title: 'Hábito de estudo', text: 'Dias seguidos, meta do dia com baú e um treino do que a criança errou.' },
  { icon: '🎯', title: 'Se adapta à criança', text: 'Acertou tudo? As próximas ficam mais difíceis. Errou muito? Mais fáceis.' },
];

/** Página para os pais conhecerem o MineLearn (vendas). Fica em "/" e é pré-renderizada no build. */
export function LandingPage() {
  const price = PRODUCT.monthlyPrice;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Topo */}
      <header className="bg-gradient-to-b from-minecraft-sky to-sky-200 px-4 pt-6 pb-16 relative overflow-hidden">
        <nav className="max-w-5xl mx-auto flex items-center justify-between mb-10">
          <span className="font-minecraft text-sm text-white drop-shadow">⛏️ {PRODUCT.name}</span>
          <MinecraftButton variant="secondary" size="sm" href="/login">
            Entrar
          </MinecraftButton>
        </nav>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="font-minecraft text-2xl sm:text-3xl text-white drop-shadow-lg leading-snug">Seu filho aprende brincando num mundo de blocos</h1>
            <p className="font-body text-lg text-gray-900 mt-4">
              Matemática, letras, cores e formas em uma aventura com voz, personagens e recompensas — feita para crianças de 0 a 10 anos estudarem em casa.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <MinecraftButton variant="gold" size="lg" href="/login">
                {PRODUCT.trialDays > 0 ? `Testar ${PRODUCT.trialDays} dias grátis` : 'Começar'}
              </MinecraftButton>
              <MinecraftButton variant="secondary" size="lg" href="/login">
                Ver o jogo
              </MinecraftButton>
            </div>
          </div>
          <div className="flex justify-center items-end gap-2 sm:gap-3" aria-hidden="true">
            {HERO_BLOCKS.map((b, i) => (
              <span
                key={b.text}
                className={`${b.color} w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center font-minecraft text-xl sm:text-3xl text-white border-b-8 border-r-4 border-black/25 shadow-lg ${i % 2 ? 'mb-6' : ''}`}
              >
                {b.text}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-6 bg-minecraft-green" aria-hidden="true" />
      </header>

      <main>
        {/* Como funciona */}
        <section aria-labelledby="como" className="max-w-5xl mx-auto px-4 py-14">
          <h2 id="como" className="font-minecraft text-lg sm:text-xl text-center mb-8">Como funciona</h2>
          <ol className="grid md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border-2 border-gray-200 p-5 text-center">
                <div className="text-4xl mb-2" aria-hidden="true">{s.icon}</div>
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
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <li key={f.title} className="bg-white rounded-xl pixel-border p-4 flex gap-3">
                  <span className="text-3xl" aria-hidden="true">{f.icon}</span>
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
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AGE_GROUPS.map((g) => (
              <li key={g.id} className="rounded-xl border-2 border-gray-200 p-3 text-center">
                <div className="text-3xl" aria-hidden="true">{g.icon}</div>
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
            <ul className="grid sm:grid-cols-3 gap-4 font-body">
              <li className="bg-white rounded-xl p-4"><span className="text-3xl block" aria-hidden="true">🚫</span>Sem anúncios e sem compras no jogo</li>
              <li className="bg-white rounded-xl p-4"><span className="text-3xl block" aria-hidden="true">🔐</span>Conta da criança criada por você</li>
              <li className="bg-white rounded-xl p-4"><span className="text-3xl block" aria-hidden="true">⏱️</span>Tempo de tela que você escolhe</li>
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
            <MinecraftButton variant="gold" size="lg" fullWidth className="mt-5" href="/login">
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
                <details key={f.q} className="bg-white rounded-xl border-2 border-gray-200 p-4">
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
