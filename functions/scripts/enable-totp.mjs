// Liga a verificação em duas etapas por app autenticador (TOTP) no projeto Firebase.
// Pré-requisito: Authentication > Settings > "Fazer upgrade" para Identity Platform.
//
// Uso (uma vez):
//   1. Console > Configurações do projeto > Contas de serviço > "Gerar nova chave privada" (baixa um .json)
//   2. GOOGLE_APPLICATION_CREDENTIALS=/caminho/da/chave.json node functions/scripts/enable-totp.mjs
//   3. APAGUE a chave .json depois (ela dá acesso total ao projeto) e, no console, exclua a chave gerada.
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp({ credential: applicationDefault() });

await getAuth().projectConfigManager().updateProjectConfig({
  multiFactorConfig: {
    providerConfigs: [{ state: 'ENABLED', totpProviderConfig: { adjacentIntervals: 5 } }],
  },
});
const config = await getAuth().projectConfigManager().getProjectConfig();
console.log('TOTP ligado:', JSON.stringify(config.multiFactorConfig ?? config.toJSON().multiFactorConfig));
