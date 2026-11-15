import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Erro inesperado na tela: mostra um aviso com "Recomeçar" em vez da página em branco. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erro na interface:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-6 bg-brand-sky px-4 text-center">
        <h1 className="font-minecraft text-xl sm:text-2xl text-white drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)]">
          Ops! Algo deu errado.
        </h1>
        <p className="text-white text-lg max-w-md">Vamos voltar para o começo e tentar de novo.</p>
        <button
          type="button"
          onClick={() => window.location.assign(import.meta.env.BASE_URL)}
          className="font-minecraft text-sm px-6 py-3 bg-brand-green hover:bg-brand-dark-green text-white border-b-4 border-brand-dark-green"
        >
          Recomeçar
        </button>
      </div>
    );
  }
}
