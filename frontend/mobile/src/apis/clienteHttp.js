import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHAVE_TOKEN = '@movipay:token';
export const CHAVE_USUARIO = '@movipay:user';

// Em desenvolvimento (Expo Go ou dev client conectado ao Metro), o celular físico não enxerga "localhost" do computador — por isso descobrimos o IP d...
function isIpv4Host(host) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

const TUNNEL_WITHOUT_API_URL = 'TUNNEL_WITHOUT_API_URL';

function resolveBaseURL() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const devHost = hostUri ? hostUri.split(':')[0] : null;
  const envLooksLikeLeftoverLocalhost = !envUrl || /localhost|127\.0\.0\.1/.test(envUrl);
  const hasRealEnvUrl = envUrl && !envLooksLikeLeftoverLocalhost;

  // Um valor explícito e "de verdade" (não localhost esquecido) sempre vence — é a intenção clara do desenvolvedor/CI, LAN ou túnel.
  if (hasRealEnvUrl) return envUrl;

  if (devHost && isIpv4Host(devHost)) {
    // LAN: o backend está no mesmo IP, porta 3000.
    return `http://${devHost}:3000/apis/v1`;
  }

  if (devHost && !isIpv4Host(devHost)) {
    // Túnel sem EXPO_PUBLIC_API_URL configurada: não adianta tentar adivinhar — sinalizamos isso explicitamente para falhar rápido e com mensagem clara,...
    console.warn(
      '[MoviPay] Rodando via Expo Tunnel sem EXPO_PUBLIC_API_URL configurada. ' +
        'O túnel do Expo só encaminha o Metro — o backend precisa do seu ' +
        'próprio túnel. Rode "npm run dev:tunnel" no backend (veja o README) ' +
        'e reinicie o Expo depois que o mobile/.env for atualizado.'
    );
    return TUNNEL_WITHOUT_API_URL;
  }

  // Chegou aqui: build standalone (sem Metro) e sem EXPO_PUBLIC_API_URL. Isso vai fazer toda chamada falhar por conexão recusada — deixamos um aviso be...
  console.warn(
    '[MoviPay] EXPO_PUBLIC_API_URL não foi definida para este build. ' +
      'Configure-a em eas.json (build.<profile>.env) antes de gerar o APK/IPA, ' +
      'ou nenhuma chamada ao backend vai funcionar neste aparelho.'
  );
  return 'http://localhost:3000/apis/v1';
}

export const BASE_URL = resolveBaseURL();
const MISCONFIGURED_FALLBACK = BASE_URL === 'http://localhost:3000/apis/v1' && !Constants.expoConfig?.hostUri;
const TUNNEL_MISCONFIGURED = BASE_URL === TUNNEL_WITHOUT_API_URL;

const api = axios.create({ baseURL: TUNNEL_MISCONFIGURED ? undefined : BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  // Falha na hora, sem esperar timeout de rede: sabemos de antemão que não existe endereço nenhum que funcione aqui, então não faz sentido deixar a pes...
  if (TUNNEL_MISCONFIGURED) {
    const err = new Error('Backend não configurado para o modo Tunnel.');
    err.isTunnelMisconfigured = true;
    throw err;
  }
  const token = await AsyncStorage.getItem(CHAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Toda rota do backend responde erro como { error: { mensagem } } — aqui isso vira uma mensagem simples e amigável, pronta para exibir na tela. `err.r...
api.interceptors.response.use(
  (res) => res,
  (err) => {
    let mensagem = err.response?.data?.error?.mensagem;
    if (!mensagem) {
      if (err.isTunnelMisconfigured) {
        mensagem = 'O app está rodando via Expo Tunnel, mas o backend não tem uma URL pública configurada. Rode "npm run dev:tunnel" no backend e reinicie o Expo.';
      } else if (MISCONFIGURED_FALLBACK) {
        mensagem = 'Não foi possível conectar ao servidor (o app está configurado para localhost, que não existe fora do computador de desenvolvimento).';
      } else if (err.code === 'ECONNABORTED') {
        mensagem = 'O servidor demorou demais para responder. Verifique sua conexão e tente novamente.';
      } else {
        mensagem = 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
      }
    }
    return Promise.reject({ ...err, friendlyMessage: mensagem, estado: err.response?.status });
  }
);

export default api;
