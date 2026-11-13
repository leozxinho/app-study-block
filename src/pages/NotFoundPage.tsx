import { Link } from 'react-router-dom';

/** Endereço que não existe: avisa e leva de volta ao início (antes ficava uma tela em branco). */
export function NotFoundPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-minecraft-sky via-blue-300 to-minecraft-green px-4 text-center">
      <h1 className="font-minecraft text-xl sm:text-2xl text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)]">
        Página não encontrada
      </h1>
      <p className="text-white text-lg max-w-md">Esse caminho não existe no nosso mundo.</p>
      <Link
        to="/"
        className="font-minecraft text-sm px-6 py-3 bg-minecraft-green hover:bg-minecraft-dark-green text-white border-b-4 border-minecraft-dark-green"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
