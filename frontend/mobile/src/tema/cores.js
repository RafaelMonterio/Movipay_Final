// Tokens extraídos ao pé da letra de frontend/src/app/globals.css do site original — a "fonte de verdade" pedida. Nada aqui foi inventado; onde o mob...

export const LIGHT = {
  bg: '#FFFFFF',
  bgAlt: '#F7F7F5',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(23,36,26,0.09)',
  line: 'rgba(23,36,26,0.13)',
  text: '#17241A',
  textMuted: '#5B6B57',
  mono: '#8A4A00',
  headerBg: 'rgba(255,255,255,0.92)',
};

export const DARK = {
  bg: '#121A0F',
  bgAlt: '#0D130B',
  cardBg: '#1A2417',
  cardBorder: 'rgba(243,239,226,0.09)',
  line: 'rgba(243,239,226,0.13)',
  text: '#F3EFE2',
  textMuted: '#8AA085',
  mono: '#FFB627',
  headerBg: 'rgba(18,26,15,0.94)',
};

export const HIGH_CONTRAST_LIGHT = {
  ...LIGHT,
  bg: '#F8FAFC',
  bgAlt: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardBorder: '#0F172A',
  line: '#0F172A',
  text: '#0F172A',
  textMuted: '#334155',
};

export const HIGH_CONTRAST_DARK = {
  ...DARK,
  bg: '#09090B',
  bgAlt: '#0F172A',
  cardBg: '#0F172A',
  cardBorder: '#F2F7FF',
  line: '#F2F7FF',
  text: '#F8FAFC',
  textMuted: '#CBD5E1',
};

// Cores de marca — idênticas em claro/escuro/alto contraste (o site nunca as muda)
export const BRAND = {
  orange: '#FF7A00',
  orangeLight: '#FF9A33',
  green: '#22D31B',
  greenLight: '#6BE567',
  danger: '#B83A08',
  blue: '#3B82F6',
  white: '#FFFFFF',
};

// Mapeamento direto de .badge-green/.badge-yellow/.badge-blue/.badge-red/.badge-slate
export function getBadgeColors(kind, theme) {
  switch (kind) {
    case 'green':
      return { bg: 'rgba(34,211,27,0.12)', fg: BRAND.green, border: 'rgba(34,211,27,0.35)' };
    case 'orange':
      return { bg: 'rgba(255,122,0,0.12)', fg: BRAND.orange, border: 'rgba(255,122,0,0.35)' };
    case 'blue':
      return { bg: 'rgba(59,130,246,0.12)', fg: BRAND.blue, border: 'rgba(59,130,246,0.35)' };
    case 'red':
      return { bg: 'rgba(184,58,8,0.10)', fg: BRAND.danger, border: 'rgba(184,58,8,0.30)' };
    default:
      return { bg: theme.line, fg: theme.textMuted, border: theme.line };
  }
}

// Cores por estado de pedido/orçamento — usadas em badges e na timeline
export const STATUS_BADGE = {
  pending: 'orange',
  open: 'orange',
  in_review: 'orange',
  accepted: 'blue',
  in_progress: 'blue',
  completed: 'green',
  closed: 'green',
  cancelled: 'red',
  rejected: 'red',
};

export const STATUS_LABEL = {
  pending: 'Aguardando resposta',
  accepted: 'Aceito',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  open: 'Aberto',
  in_review: 'Em análise',
  closed: 'Fechado',
};

// Cores por nível de gamificação — usadas para colorir a moeda de Folhas
export const LEVEL_COLORS = {
  iniciante: { base: '#8AA085', shine: '#C7D6C2', ring: '#5B6B57' },
  bronze: { base: '#B08D57', shine: '#E4C69A', ring: '#8A6A3A' },
  prata: { base: '#B8C0C8', shine: '#F1F5F8', ring: '#8A94A0' },
  ouro: { base: BRAND.orange, shine: BRAND.orangeLight, ring: '#C75F00' },
  platina: { base: '#7EC8D8', shine: '#E3F6FA', ring: '#4A97A8' },
  diamante: { base: '#6BE0E5', shine: '#E0FBFC', ring: '#22B8C4' },
};
