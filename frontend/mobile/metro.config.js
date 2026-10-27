// Metro (o bundler do Expo) tenta compilar `react-native-maps` para QUALQUER
// tela que o importe, mesmo em telas que nunca chegam a renderizar no Web —
// e essa lib é nativa (Android/iOS), não tem build para Web, o que quebra o
// bundle inteiro com "codegenNativeComponent is not a function". A correção
// certa não é tentar evitar o import tela por tela (isso quebra de novo assim
// que qualquer outra tela também importar o mapa) — é redirecionar esse
// import para uma versão Web de verdade só quando platform === 'web', aqui,
// num único lugar central. No iOS/Android nada muda: continua sendo a
// react-native-maps real.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: path.resolve(__dirname, 'src/adaptadores/react-native-maps.web.js'),
      type: 'sourceFile',
    };
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
