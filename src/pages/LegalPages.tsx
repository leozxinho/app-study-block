import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCT } from '../config/product';

// Política de privacidade (/privacidade) e termos de uso (/termos).
// Textos em linguagem simples, escritos para a LGPD (Lei 13.709/2018) e o Código de Defesa do Consumidor.
// Os dados de quem responde pelo StudyBlock vêm de src/config/product.ts.

const updatedAt = new Date(`${PRODUCT.legalUpdatedAt}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const owner = PRODUCT.legalName || `os responsáveis pelo ${PRODUCT.name}`;
const ownerId = PRODUCT.legalName ? `${PRODUCT.legalName}${PRODUCT.legalDocument ? ` (${PRODUCT.legalDocument})` : ''}` : owner;

function Contact() {
  return PRODUCT.contactEmail ? (
    <a href={`mailto:${PRODUCT.contactEmail}`} className="underline text-sky-800">
      {PRODUCT.contactEmail}
    </a>
  ) : (
    <>o e-mail de contato informado na página inicial</>
  );
}

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="bg-gradient-to-b from-minecraft-sky to-sky-200 px-4 py-5">
        <nav className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="font-minecraft text-sm text-white drop-shadow">
            {PRODUCT.name}
          </Link>
          <Link to="/login" className="font-body font-bold text-sm text-gray-900 underline">
            Entrar
          </Link>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 font-body leading-relaxed">
        <h1 className="font-minecraft text-xl sm:text-2xl mb-2">{title}</h1>
        <p className="text-sm text-gray-600 mb-8">Última atualização: {updatedAt}</p>
        <div className="space-y-6 [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">{children}</div>
      </main>
      <LegalFooter />
    </div>
  );
}

/** Rodapé com os links legais (também usado na landing). */
export function LegalFooter() {
  return (
    <footer className="bg-minecraft-dark-green text-white/90 font-body text-sm text-center py-6 px-4">
      <p>{PRODUCT.name}: aprender jogando.</p>
      {PRODUCT.contactEmail && <p className="mt-1">Contato: {PRODUCT.contactEmail}</p>}
      <p className="mt-2 flex justify-center gap-4">
        <Link to="/privacidade" className="underline">
          Política de privacidade
        </Link>
        <Link to="/termos" className="underline">
          Termos de uso
        </Link>
      </p>
    </footer>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidade">
      <p>
        O {PRODUCT.name} é um jogo educativo para crianças de 0 a 10 anos, usado em casa com o acompanhamento de um adulto
        responsável. Esta política explica, em linguagem simples, quais dados usamos, para quê e quais são os seus direitos
        pela Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
      </p>

      <h2>1. Quem cuida dos dados</h2>
      <p>
        O controlador dos dados é {ownerId}. Para qualquer assunto de privacidade, inclusive pedidos sobre os dados da sua
        família, escreva para <Contact />. Esse contato também atende como encarregado de dados (LGPD, art. 41).
      </p>

      <h2>2. Quais dados usamos</h2>
      <p>
        <strong>Do adulto responsável:</strong> nome, e-mail e senha (guardada de forma criptografada pelo provedor de
        login). Se você entrar com o Google, recebemos do Google só o seu nome, e-mail e foto de perfil.
      </p>
      <p>
        <strong>Da criança</strong> (cadastrada pelo responsável): nome ou apelido, nome de usuário, faixa de idade e o
        progresso no jogo (fases, estrelas, XP, acertos e erros por atividade, tempo de jogo, figurinhas e roupas do
        personagem). A criança não informa e-mail, telefone, endereço, foto nem voz.
      </p>
      <p>
        <strong>Pagamento:</strong> a assinatura é paga pelo Stripe. Os dados do cartão são digitados e guardados pelo
        Stripe; nós recebemos só a situação da assinatura (ativa, em teste, cancelada), o plano e a data de renovação.
      </p>
      <p>
        <strong>No seu aparelho:</strong> o jogo guarda no navegador (armazenamento local) a sessão de login, o progresso e
        preferências como som, voz e animações, para funcionar rápido e até sem internet. Não usamos cookies de publicidade
        nem ferramentas de rastreamento ou análise de comportamento.
      </p>
      <p>
        <strong>Registros técnicos:</strong> como todo site, o servidor de hospedagem registra dados técnicos de acesso
        (como endereço IP, data e hora) para segurança e funcionamento.
      </p>

      <h2>3. Para que usamos e com que base legal</h2>
      <ul>
        <li>Criar e manter a conta do responsável e as contas das crianças, e mostrar o progresso na Área dos Pais (execução do contrato, art. 7º, V).</li>
        <li>Tratar os dados das crianças só com o consentimento do responsável, dado ao cadastrá-las, e só para o jogo funcionar (art. 14).</li>
        <li>Cobrar a assinatura e cumprir obrigações fiscais (execução do contrato e obrigação legal, art. 7º, II e V).</li>
        <li>Manter o serviço seguro e evitar abusos (legítimo interesse, art. 7º, IX).</li>
      </ul>
      <p>Não vendemos dados, não mostramos anúncios e não usamos os dados das crianças para publicidade ou perfil de consumo.</p>

      <h2>4. Crianças</h2>
      <ul>
        <li>Só o adulto responsável cria conta. É ele quem cadastra cada criança, escolhe o login e a senha dela e pode ver e apagar o progresso.</li>
        <li>Coletamos da criança só o necessário para o jogo (art. 14, § 4º).</li>
        <li>Não há chat, perfil público, ranking com nomes nem contato com outras pessoas dentro do jogo.</li>
        <li>Não há compras dentro do jogo: tudo é ganho jogando.</li>
      </ul>

      <h2>5. Com quem compartilhamos</h2>
      <p>Só com os fornecedores necessários para o serviço funcionar, que tratam os dados em nosso nome:</p>
      <ul>
        <li><strong>Supabase</strong>: login e banco de dados das contas e do progresso.</li>
        <li><strong>Stripe</strong>: pagamento da assinatura.</li>
        <li><strong>Vercel</strong>: hospedagem do site.</li>
        <li><strong>Google</strong>: login com Google (se você escolher) e as fontes de letra do site.</li>
      </ul>
      <p>
        Esses fornecedores podem guardar dados em servidores fora do Brasil. Nesses casos a transferência segue o art. 33
        da LGPD, com fornecedores que adotam padrões de proteção adequados. Também podemos informar dados a autoridades
        quando a lei exigir.
      </p>

      <h2>6. Por quanto tempo guardamos</h2>
      <p>
        Enquanto a conta existir. Quando você pedir a exclusão, apagamos a conta do responsável, as contas das crianças e o
        progresso em até 15 dias, menos o que a lei manda guardar (por exemplo, registros de pagamento para fins fiscais e
        registros de acesso pelo prazo do Marco Civil da Internet).
      </p>

      <h2>7. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode pedir, sobre os seus dados e os das crianças que cadastrou:</p>
      <ul>
        <li>confirmação de que tratamos os dados e acesso a eles;</li>
        <li>correção de dados incompletos ou errados;</li>
        <li>exclusão dos dados e da conta;</li>
        <li>portabilidade (uma cópia dos dados);</li>
        <li>informação sobre com quem compartilhamos;</li>
        <li>revogação do consentimento a qualquer momento.</li>
      </ul>
      <p>
        Na Área dos Pais você já vê e apaga o progresso das crianças. Para os outros pedidos, escreva para <Contact />;
        respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>

      <h2>8. Segurança</h2>
      <p>
        O site usa conexão criptografada (HTTPS). As senhas não ficam guardadas em texto. No banco de dados, cada responsável
        só consegue ver os próprios dados e os das crianças que cadastrou, e cada criança só vê os próprios dados.
      </p>

      <h2>9. Mudanças nesta política</h2>
      <p>
        Se mudarmos esta política, atualizamos a data no topo. Se a mudança for importante, avisamos na Área dos Pais ou por
        e-mail antes de ela valer.
      </p>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Termos de uso">
      <p>
        Estes termos são o acordo entre você e {ownerId} para usar o {PRODUCT.name}. Ao criar uma conta, você declara que
        leu e concorda com eles e com a <Link to="/privacidade" className="underline text-sky-800">política de privacidade</Link>.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O {PRODUCT.name} é um jogo educativo no navegador, com atividades de matemática, letras, cores e formas para
        crianças de 0 a 10 anos, e uma Área dos Pais para acompanhar o progresso.
      </p>

      <h2>2. Conta do responsável</h2>
      <ul>
        <li>A conta é criada por um adulto (maior de 18 anos), responsável legal pelas crianças que cadastrar.</li>
        <li>Você cuida das senhas da sua conta e das contas das crianças e responde pelo uso delas.</li>
        <li>Os dados informados devem ser verdadeiros.</li>
      </ul>

      <h2>3. Contas das crianças</h2>
      <p>
        Você pode cadastrar até {PRODUCT.maxChildren} crianças. Ao cadastrar, você autoriza o uso dos dados delas como
        descrito na política de privacidade e pode apagar o progresso ou pedir a exclusão a qualquer momento.
      </p>

      <h2>4. Assinatura e pagamento</h2>
      <ul>
        <li>O acesso ao jogo é por assinatura (mensal ou anual, quando disponível), paga pelo Stripe, com o preço mostrado antes de você confirmar.</li>
        {PRODUCT.trialDays > 0 && (
          <li>Contas novas têm {PRODUCT.trialDays} dias de teste grátis. Se você não cancelar durante o teste, a cobrança começa no fim dele.</li>
        )}
        <li>A assinatura renova sozinha no fim de cada período, até você cancelar.</li>
        <li>Você cancela quando quiser na Área dos Pais, em “Gerenciar assinatura”. O acesso continua até o fim do período já pago.</li>
        <li>Pelo Código de Defesa do Consumidor (art. 49), você pode desistir em até 7 dias da contratação e receber de volta o valor pago, escrevendo para <Contact />.</li>
        <li>Se o pagamento falhar, o jogo pode ficar bloqueado até a assinatura ser regularizada. O progresso não é apagado.</li>
      </ul>

      <h2>5. Uso permitido</h2>
      <p>
        O {PRODUCT.name} é para uso pessoal e familiar. Não é permitido copiar, revender ou distribuir o jogo ou o conteúdo,
        tentar acessar contas ou dados de outras pessoas, nem atrapalhar o funcionamento do serviço.
      </p>

      <h2>6. Conteúdo</h2>
      <p>
        Textos, atividades, desenhos, vozes e o código do {PRODUCT.name} pertencem a {owner} ou são usados com permissão.
        O {PRODUCT.name} não é um produto oficial do Minecraft e não é aprovado nem associado à Mojang ou à Microsoft.
      </p>

      <h2>7. Disponibilidade</h2>
      <p>
        Trabalhamos para o jogo ficar sempre no ar, mas podem acontecer pausas para manutenção ou falhas de fornecedores.
        Podemos mudar ou melhorar atividades e recursos com o tempo.
      </p>

      <h2>8. Responsabilidade</h2>
      <p>
        O {PRODUCT.name} apoia o aprendizado, mas não substitui a escola nem o acompanhamento de profissionais. Nada nestes
        termos limita os direitos garantidos a você pelo Código de Defesa do Consumidor.
      </p>

      <h2>9. Encerramento</h2>
      <p>
        Você pode cancelar a assinatura e pedir a exclusão da conta quando quiser. Podemos suspender contas que violem estes
        termos, avisando por e-mail sempre que possível.
      </p>

      <h2>10. Mudanças nos termos</h2>
      <p>
        Se mudarmos estes termos, atualizamos a data no topo e avisamos antes de mudanças importantes valerem. Se não
        concordar, você pode cancelar a assinatura.
      </p>

      <h2>11. Lei e foro</h2>
      <p>
        Estes termos seguem as leis do Brasil. Conflitos podem ser resolvidos no foro do seu domicílio, como garante o
        Código de Defesa do Consumidor{PRODUCT.legalCity ? `, ou no foro de ${PRODUCT.legalCity}` : ''}.
      </p>

      <h2>12. Contato</h2>
      <p>
        Dúvidas, pedidos ou reclamações: <Contact />.
      </p>
    </LegalLayout>
  );
}
