import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';

// Ícones em traço (stroke), estilo consistente: linecap/linejoin arredondados, espessura de traço 1.8 — a mesma linguagem visual descrita para o site...
const PATHS = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z|M21 21l-4.3-4.3',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z',
  chat: 'M4 5h16v11H8l-4 4V5Z',
  wrench: 'M15.5 4.5a4.5 4.5 0 0 0-6 4.9L4 15v3h3l5.6-5.6a4.5 4.5 0 0 0 5-6.4l-3 3-2-2 3-3Z',
  calendar: 'M5 5h14v15H5V5Z|M5 9h14|M8 3v4|M16 3v4',
  // Usado nas abas "Pedidos" (trabalhador), "Orçamentos" (cliente) e no item "Meus pedidos" do menu lateral. Faltava esta entrada — sem ela, o Icon.js...
  clipboard: 'M6 4h12v17H6Z|M9 4V3h6v1|M9 10h6|M9 14h6|M9 18h6',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z',
  bolt: 'M13 3 5 14h6l-1 7 8-11h-6l1-7Z',
  broom: 'M19 4 9 14|M9 14l-5 5 1.5 1.5L10.5 15.5|M13.5 9.5 19 4l1 1-5.5 5.5|M6 21c1-3 3-4 5-4',
  paint: 'M4 21c1-3 2-5 4-7l8-8 3 3-8 8c-2 2-4 3-7 4Z|M14 5l5 5',
  pipe: 'M4 8h6v4H4z|M10 10h6|M14 6h6v8h-6z|M17 14v4h-4',
  leaf: 'M6 20C4 14 6 6 18 4c1 10-4 15-12 16Z|M8 18c3-4 6-7 10-12',
  box: 'M3 8l9-4 9 4-9 4-9-4Z|M3 8v9l9 4 9-4V8|M12 12v9',
  monitor: 'M4 5h16v11H4z|M9 20h6|M12 16v4',
  book: 'M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z|M17 4v16',
  hammer: 'M9 14 5 18l1 1 4-4|M14 5l5 5-2 2-5-5 2-2Z|M8 11l3-3 5 5-3 3-5-5Z',
  sparkle: 'M12 3v4|M12 17v4|M3 12h4|M17 12h4|M6 6l2.5 2.5|M15.5 15.5 18 18|M18 6l-2.5 2.5|M8.5 15.5 6 18',
  lock: 'M6 11h12v9H6v-9Z|M8 11V7a4 4 0 0 1 8 0v4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z|M12 7v5l4 2',
  arrowRight: 'M4 12h16|M13 5l7 7-7 7',
  arrowLeft: 'M20 12H4|M11 5l-7 7 7 7',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  x: 'M6 6l12 12|M18 6L6 18',
  check: 'M5 12.5 10 17 19 7',
  plus: 'M12 5v14|M5 12h14',
  minus: 'M5 12h14',
  mail: 'M4 6h16v12H4z|M4 7l8 6 8-6',
  alert: 'M12 3 2 20h20L12 3Z|M12 10v4|M12 17.5v.1',
  eye: 'M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff:
    'M3 3l18 18|M10.6 5.6A10.6 10.6 0 0 1 22 12s-1.1 2-3.2 3.7M6.6 6.6C4.3 8 2 12 2 12s3.5 6.5 10 6.5c1.4 0 2.6-.3 3.7-.8',
  edit: 'M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z',
  trash: 'M4 7h16|M9 7V4h6v3|M6 7l1 13h10l1-13',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4V8Z|M12 12a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  location: 'M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z|M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  filter: 'M4 5h16l-6 8v6l-4-2v-4L4 5Z',
  home: 'M4 11 12 4l8 7|M6 10v10h12V10',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z|M4 21c1.5-4.5 5-7 8-7s6.5 2.5 8 7',
  usuarios: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z|M2.5 20c1-3.5 3.8-5.5 6.5-5.5s5.5 2 6.5 5.5|M16.5 8.5a3 3 0 1 0 0-6|M17.5 14c2 .3 3.6 2 4.5 5',
  briefcase: 'M4 8h16v11H4z|M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
  creditCard: 'M3 6h18v12H3z|M3 10h18',
  gift: 'M4 9h16v11H4z|M4 6h16v3H4z|M12 6v14|M9 6a2.2 2.2 0 1 1 3-3c1 1 1 3 0 3M15 6a2.2 2.2 0 1 0-3-3c-1 1-1 3 0 3',
  share: 'M18 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z|M6 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z|M18 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z|M8.2 13 15.8 9|M8.2 12 15.8 16.5',
  heart: 'M12 20s-7-4.5-9.3-9C1.2 7.5 3 4 6.5 4c2 0 3.5 1.2 4.5 2.7C12 5.2 13.5 4 15.5 4 19 4 20.8 7.5 19.3 11 17 15.5 12 20 12 20Z',
  heartOutline:
    'M12 20s-7-4.5-9.3-9C1.2 7.5 3 4 6.5 4c2 0 3.5 1.2 4.5 2.7C12 5.2 13.5 4 15.5 4 19 4 20.8 7.5 19.3 11 17 15.5 12 20 12 20Z',
  send: 'M3 11l18-8-8 18-2-8-8-2Z',
  telefone: 'M6 3h4l1.5 5-2.5 2c1 2.5 2.5 4 5 5l2-2.5 5 1.5v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2Z',
  logout: 'M13 4h5v16h-5|M4 12h13|M14 8l4 4-4 4',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z|M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.2-1.3L14 3h-4l-.4 2.4a7 7 0 0 0-2.2 1.3l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-.9c.6.5 1.4 1 2.2 1.3L10 21h4l.4-2.4c.8-.3 1.6-.8 2.2-1.3l2.3.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.3Z',
  image: 'M4 5h16v14H4z|M8 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z|M20 16l-5-5-4 4-2-2-5 5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z|M12 11v6|M12 7.5v.1',
  wallet: 'M3 7h15a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2V7Z|M3 7a2 2 0 0 1 2-2h11v3|M15 13.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z',
  map: 'M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z|M9 4v14|M15 6v14',
  comment: 'M4 5h16v11H8l-4 4V5Z|M8 9h8|M8 12h5',
  bookmark: 'M6 3h12v18l-6-4-6 4V3Z',
  volumeOn: 'M4 9h4l5-4v14l-5-4H4V9Z|M16.5 8.5a5 5 0 0 1 0 7|M19 6a8.5 8.5 0 0 1 0 12',
  volumeOff: 'M4 9h4l5-4v14l-5-4H4V9Z|M17 9.5l4 5|M21 9.5l-4 5',
  video: 'M3 6h12v12H3z|M15 10l6-3v10l-6-3',
  upload: 'M12 19V6|M6 11l6-6 6 6|M4 20h16',
  crown: 'M4 18h16|M4 16 3 7l5 4 4-6 4 6 5-4-1 9H4Z',
  chart: 'M4 20V10|M10 20V4|M16 20v-7|M22 20H2',
  copy: 'M9 9h11v11H9z|M5 15V4h11',
  qrcode: 'M4 4h6v6H4z|M14 4h6v6h-6z|M4 14h6v6H4z|M14 14h2v2h-2z|M18 14h2v2h-2z|M14 18h2v2h-2z|M18 18h2v2h-2z',
  shield2: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z|M9 12l2 2 4-4',
  cake: 'M4 21h16v-7H4v7Z|M4 14c0-2 2-3 4-3h8c2 0 4 1 4 3|M8 8V5|M12 8V4|M16 8V5',
  idCard: 'M3 6h18v12H3z|M8.5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z|M5.5 16c.6-1.7 1.7-2.5 3-2.5s2.4.8 3 2.5|M14 10h5|M14 13h4',
  // Faltava — o toggle de "Tema escuro" no Perfil ficava com o mesmo problema do 'clipboard': espaço certo, toque certo, ícone invisível.
  moon: 'M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z',
  // Controles do player de vídeo interativo dos Shorts. Cada um é UM `d` só (sem '|'), de propósito: assim as duas formas de dentro (as duas barras da...
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  // Só o triângulo, sem bolinha de fundo — usado dentro dos controles do vídeo, que já desenham a própria bolinha ao redor. O ícone especial 'play' (ac...
  playTriangle: 'M8 5v14l11-7Z',
  rewind: 'M20 5L11 12L20 19ZM11 5L2 12L11 19Z',
  forward: 'M4 5L13 12L4 19ZM13 5L22 12L13 19Z',
};

export default function Icon({ nome, size = 22, color = '#17241A', strokeWidth = 1.8, filled = false, style }) {
  // Ícone de play tem visual próprio (círculo preenchido + triângulo em branco por cima) — precisa de duas cores, então foge do padrão de "um traço, um...
  if (nome === 'play') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <Path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" fill={color} />
        <Path d="M10 8.3l6.2 3.7-6.2 3.7v-7.4Z" fill="#FFFFFF" />
      </Svg>
    );
  }

  const spec = PATHS[nome];
  if (!spec) return <Svg width={size} height={size} viewBox="0 0 24 24" style={style} />;

  const subpaths = spec.split('|');
  const isFilled = filled;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {subpaths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={isFilled && i === 0 ? color : 'none'}
        />
      ))}
    </Svg>
  );
}

export { Svg, Circle, Line, Rect, Polyline };
