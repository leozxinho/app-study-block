/**
 * Dados comerciais do MineLearn (página /conheca e assinatura).
 * Preencha quando decidir os valores. Enquanto o preço for null, a página mostra "em breve".
 */
export const PRODUCT = {
  name: 'MineLearn',
  /** Preço mensal em reais (ex.: 19.9). null = ainda não definido */
  monthlyPrice: null as number | null,
  /** Preço anual em reais (ex.: 179). null = sem plano anual. Com valor, o servidor precisa do segredo STRIPE_PRICE_YEARLY */
  yearlyPrice: null as number | null,
  /** Dias de teste grátis */
  trialDays: 7,
  /** Máximo de crianças por conta de responsável */
  maxChildren: 10,
  /** E-mail de contato exibido na página (deixe vazio para não mostrar) */
  contactEmail: '',
};

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
