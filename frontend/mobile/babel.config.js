module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // O plugin do Reanimated/Worklets já é adicionado automaticamente
    // pelo babel-preset-expo a partir do SDK 50 — não precisa listar aqui.
  };
};
