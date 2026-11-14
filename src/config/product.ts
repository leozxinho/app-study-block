/**
 * Dados comerciais do MineLearn (landing em "/" e assinatura).
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
  maxChildren: 2,
  /** E-mail de contato exibido na página e usado para pedidos de privacidade (LGPD). Preencha antes de publicar. */
  contactEmail: '',
  /** Quem responde pelo MineLearn (nome da empresa ou da pessoa) e CNPJ/CPF: aparecem na política e nos termos. */
  legalName: '',
  legalDocument: '',
  /** Cidade/UF do responsável (foro dos termos) */
  legalCity: '',
  /** Data da última atualização da política de privacidade e dos termos (AAAA-MM-DD) */
  legalUpdatedAt: '2026-11-14',
};

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Perguntas frequentes da landing (também viram o JSON-LD FAQPage no pré-render). */
export const FAQ = [
  { q: 'Para qual idade é?', a: 'Do berçário ao 5º ano (0 a 10 anos). Cada criança joga as atividades da faixa dela.' },
  { q: 'Tem anúncios?', a: 'Não. Nenhum anúncio e nenhuma compra dentro do jogo: tudo é conquistado jogando.' },
  { q: 'Posso limitar o tempo de tela?', a: 'Sim. Na Área dos Pais você escolhe quantos minutos por dia cada criança pode jogar.' },
  { q: 'Funciona no tablet e no celular?', a: 'Sim, no navegador do tablet, celular ou computador. Dá até para instalar como app.' },
  { q: 'Quantas crianças posso cadastrar?', a: `Até ${PRODUCT.maxChildren} crianças por conta, cada uma com o próprio progresso.` },
];
