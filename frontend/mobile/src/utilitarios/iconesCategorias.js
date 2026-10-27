// Mapa slug -> nome do ícone customizado (ver componentes/Gravacao.js). Os emojis (categorias.icone, vindos da API) continuam disponíveis para uso pontual...
export const CATEGORY_ICON = {
  limpeza: 'broom',
  eletrica: 'bolt',
  pintura: 'paint',
  encanamento: 'pipe',
  jardinagem: 'leaf',
  mudanca: 'box',
  informatica: 'monitor',
  reforma: 'hammer',
  'cuidado-pessoal': 'sparkle',
  aulas: 'book',
};

export function iconForCategory(slug) {
  return CATEGORY_ICON[slug] || 'wrench';
}
