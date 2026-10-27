'use client';

/**
 * Biblioteca central de ícones SVG do MoviPay.
 *
 * Todo ícone usado no site deve vir daqui — nada de emoji solto no meio do
 * código. Isso garante consistência visual (mesmo traço, mesma grade 24x24)
 * em qualquer sistema operacional, navegador ou fonte instalada.
 *
 * Uso:
 *   <Icon name="leaf" size={18} color="#22D31B" />
 */
export default function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style, className, title }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color,
    strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style, className,
    role: title ? 'img' : 'presentation', 'aria-hidden': title ? undefined : true,
  };
  const fp = { width: size, height: size, viewBox: '0 0 24 24', fill: color, stroke: 'none', style, className };

  switch (name) {
    /* ── Navegação / ações genéricas ─────────────────────────────── */
    case 'search':      return <svg {...p}>{title && <title>{title}</title>}<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case 'arrowRight':  return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case 'arrowLeft':   return <svg {...p}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
    case 'check':       return <svg {...p}>{title && <title>{title}</title>}<polyline points="20 6 9 17 4 12" /></svg>;
    case 'checkCircle':  return <svg {...p}>{title && <title>{title}</title>}<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
    case 'x':            return <svg {...p}>{title && <title>{title}</title>}<line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>;
    case 'xCircle':       return <svg {...p}>{title && <title>{title}</title>}<circle cx="12" cy="12" r="9.5" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>;
    case 'info':          return <svg {...p}><circle cx="12" cy="12" r="9.5" /><line x1="12" y1="11" x2="12" y2="16.5" /><circle cx="12" cy="7.8" r="0.9" fill={color} stroke="none" /></svg>;
    case 'alertTriangle': return <svg {...p}>{title && <title>{title}</title>}<path d="M12 3.5l10 17.5H2z" /><line x1="12" y1="10" x2="12" y2="14.5" /><circle cx="12" cy="17.3" r="0.9" fill={color} stroke="none" /></svg>;
    case 'refresh':      return <svg {...p}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><polyline points="21 3 21 9 15 9" /></svg>;
    case 'plus':         return <svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case 'eye':          return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'eyeOff':       return <svg {...p}><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.7 19.7 0 0 1 4.22-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a19.7 19.7 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;

    /* ── Pessoas / conta ──────────────────────────────────────────── */
    case 'user':    return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'users':   return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'client':  return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>;
    case 'worker':  return <svg {...p}><rect x="2.5" y="8.5" width="19" height="11" rx="1.5" /><path d="M8 8.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5" /><line x1="2.5" y1="13.5" x2="21.5" y2="13.5" /><line x1="10.5" y1="13.5" x2="13.5" y2="13.5" /></svg>;
    case 'wave':    return <svg {...p}><path d="M8 12.5V6a1.7 1.7 0 0 1 3.4 0v5" /><path d="M11.4 11V4.3a1.7 1.7 0 0 1 3.4 0V11" /><path d="M14.8 11V5.6a1.7 1.7 0 0 1 3.4 0V13" /><path d="M18.2 8.5a1.7 1.7 0 0 1 3.4 0V15c0 4-2.7 7-6.8 7h-2c-2.4 0-3.8-.7-5.2-2.4L3.3 14.6c-.6-.8-.5-1.8.3-2.4.8-.6 1.8-.5 2.4.2L8 15" /></svg>;
    case 'mail':    return <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
    case 'inbox':    return <svg {...p}><path d="M3.5 8.5h4.2l1.3 3h5.6l1.4-3h4" /><path d="M3.5 8.5L5 4h14l1.5 4.5v9a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z" /></svg>;
    case 'phone':   return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case 'lock':    return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'camera':  return <svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;

    /* ── Localização / mapa ───────────────────────────────────────── */
    case 'mapPin':  return <svg {...p}>{title && <title>{title}</title>}<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;

    /* ── Categorias de serviço ────────────────────────────────────── */
    case 'broom':    return <svg {...p}><line x1="13" y1="2" x2="7" y2="15" /><path d="M7 15l-3.5 6.5 9-2.5 3.5-6.5z" /></svg>;
    case 'sparkle':  return <svg {...p}><path d="M12 2l1.5 5h5L14 10.5l1.5 5L12 13l-3.5 2.5L10 10.5 5.5 7h5z" /></svg>;
    case 'bolt':     return <svg {...fp}><polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" /></svg>;
    case 'boltLine': return <svg {...p}><polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" /></svg>;
    case 'wrench':   return <svg {...p}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 18.7 5.3 21l7.3-6.3a4 4 0 0 0 5.1-5.4l-2.9 2.9-2-2z" /></svg>;
    case 'palette':  return <svg {...p}><path d="M12 2a10 10 0 1 0 3.6 19.3c1-.4 1.2-1.7.4-2.4l-.5-.4a1.5 1.5 0 0 1 1-2.6H18a3 3 0 0 0 3-3 10.9 10.9 0 0 0-9-10.9z" /><circle cx="7.3" cy="10.5" r="1.15" fill={color} stroke="none" /><circle cx="10.7" cy="6.8" r="1.15" fill={color} stroke="none" /><circle cx="15.4" cy="7.6" r="1.15" fill={color} stroke="none" /><circle cx="8" cy="15" r="1.15" fill={color} stroke="none" /></svg>;
    case 'paint':    return <svg {...p}><rect x="3" y="4" width="12" height="6" rx="1" /><line x1="9" y1="10" x2="9" y2="16" /><rect x="6" y="16" width="6" height="5" rx="1" /></svg>;
    case 'sprout':   return <svg {...p}><path d="M12 21v-8" /><path d="M12 13c0-4 -3-6-7-6 0 4 3 6 7 6z" /><path d="M12 11c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z" /></svg>;
    case 'leaf':     return <svg {...p}>{title && <title>{title}</title>}<path d="M5 21c0-9 6-15 15-15-1 9-7 15-15 15z" /><path d="M5 21c3-3 6-6 9-9" /></svg>;
    case 'laptop':   return <svg {...p}><rect x="3.5" y="4.5" width="17" height="11" rx="1.4" /><line x1="1.5" y1="19" x2="22.5" y2="19" /></svg>;
    case 'box':      return <svg {...p}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><line x1="12" y1="13" x2="12" y2="21" /></svg>;
    case 'hardHat':  return <svg {...p}><path d="M4 15a8 8 0 0 1 16 0z" /><line x1="2" y1="15" x2="22" y2="15" /><path d="M12 15V7" /><path d="M12 7c2.4 0 4.3 1.6 4.9 4" /></svg>;
    case 'spa':      return <svg {...p}><path d="M12 21c-4-1-6-4-6-8 3 0 5 1 6 3 1-2 3-3 6-3 0 4-2 7-6 8z" /><path d="M12 13V8" /><path d="M12 8c0-2.5-1.3-4.2-3.4-5.2C8.2 5.3 9.4 7.3 12 8z" /><path d="M12 8c0-2.5 1.3-4.2 3.4-5.2C15.8 5.3 14.6 7.3 12 8z" /></svg>;
    case 'book':     return <svg {...p}><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H12v18H5.5A1.5 1.5 0 0 1 4 19.5z" /><path d="M20 4.5A1.5 1.5 0 0 0 18.5 3H12v18h6.5a1.5 1.5 0 0 0 1.5-1.5z" /></svg>;
    case 'scissors': return <svg {...p}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>;
    case 'hammer':   return <svg {...p}><path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" /><path d="M17.64 15L22 10.64" /><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" /></svg>;
    case 'motorcycle': return <svg {...p}><circle cx="5" cy="16" r="3" /><circle cx="19" cy="16" r="3" /><path d="M3 16L8.5 6h4l4 4h4v2h-2.5l-3-3H12l-4 7" /></svg>;
    case 'droplet':  return <svg {...p}><path d="M12 2.5C9 7 5.5 11 5.5 15a6.5 6.5 0 0 0 13 0c0-4-3.5-8-6.5-12.5z" /></svg>;
    case 'toolbox':  return <svg {...p}><rect x="2.5" y="8.5" width="19" height="11" rx="1.5" /><path d="M8 8.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5" /><line x1="2.5" y1="13.5" x2="21.5" y2="13.5" /><line x1="10.5" y1="13.5" x2="13.5" y2="13.5" /></svg>;
    case 'tools':    return <svg {...p}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 18.7 5.3 21l7.3-6.3a4 4 0 0 0 5.1-5.4l-2.9 2.9-2-2z" /><path d="M3 3l3 3" /><path d="M6 3l-3 3" /></svg>;

    /* ── Status / feedback ────────────────────────────────────────── */
    case 'clock':    return <svg {...p}>{title && <title>{title}</title>}<circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></svg>;
    case 'flag':     return <svg {...p}>{title && <title>{title}</title>}<path d="M5 21V4" /><path d="M5 4.5c1.6-1.1 3-1.1 4.5 0s2.9 1.1 4.5 0 3-1.1 4.5 0v9c-1.5-1.1-3-1.1-4.5 0s-2.9 1.1-4.5 0-2.9-1.1-4.5 0z" /></svg>;
    case 'trophy':   return <svg {...p}><path d="M8 4h8v6a4 4 0 0 1-8 0z" /><path d="M8 5H4v2a4 4 0 0 0 4 4" /><path d="M16 5h4v2a4 4 0 0 1-4 4" /><line x1="12" y1="14" x2="12" y2="18" /><path d="M8 21h8" /><path d="M9 18h6l.6 3H8.4z" /></svg>;
    case 'shield':   return <svg {...p}><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /></svg>;
    case 'bell':     return <svg {...p}>{title && <title>{title}</title>}<path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>;
    case 'bellOff':  return <svg {...p}><path d="M6 9a6 6 0 0 1 9.3-5" /><path d="M18 9c0 4 1.5 5.5 2 6.5H8" /><path d="M4.5 15.5H6" /><path d="M10 19a2 2 0 0 0 4 0" /><line x1="3" y1="3" x2="21" y2="21" /></svg>;
    case 'accessibility': return <svg {...p}><circle cx="12" cy="4.5" r="1.8" /><path d="M5 9.5h14" /><path d="M12 9.5v4l-4.5 7" /><path d="M12 13.5l4.5 7" /><path d="M9 13.5c1 .6 2 .9 3 .9s2-.3 3-.9" /></svg>;

    /* ── Gamificação / níveis ─────────────────────────────────────── */
    case 'star':        return <svg {...fp}>{title && <title>{title}</title>}<polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" /></svg>;
    case 'starOutline': return <svg {...p}><polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" /></svg>;
    case 'medal':       return <svg {...p}><circle cx="12" cy="14.5" r="6" /><path d="M9.5 3h5l2 6.5-4.5 3-4.5-3z" /><circle cx="12" cy="14.5" r="2.6" fill={color} stroke="none" /></svg>;
    case 'diamond':      return <svg {...p}><path d="M4 9l4-6h8l4 6-10 12z" /><path d="M4 9h16" /><path d="M9.5 3L8 9l4 12 4-12-1.5-6" /></svg>;
    case 'crown':        return <svg {...fp}><path d="M3 8l4 3 5-6 5 6 4-3-1.6 10H4.6z" /><rect x="4.5" y="19" width="15" height="2" rx="0.6" /></svg>;
    case 'gift':         return <svg {...p}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
    case 'confetti':    return <svg {...p}><path d="M4 20l3-9" /><rect x="9.5" y="3" width="3" height="3" rx="0.6" transform="rotate(20 11 4.5)" /><circle cx="18" cy="7" r="1.4" fill={color} stroke="none" /><rect x="15" y="12" width="3" height="3" rx="0.6" transform="rotate(-15 16.5 13.5)" /><circle cx="8" cy="6" r="1.1" fill={color} stroke="none" /></svg>;
    case 'rocket':       return <svg {...p}><path d="M14.5 3.5c2.5.5 5 3 5.5 5.5-2 2-3.5 3-6 3.5l-3-3c.5-2.5 1-4 3.5-6z" /><path d="M11 12.5L5.5 14 4 19.5 9.5 18z" /><path d="M9.5 14.5L5.5 18.5" /><circle cx="15.2" cy="8.8" r="1.3" /></svg>;
    case 'ant':          return <svg {...p}><circle cx="12" cy="7.2" r="1.8" /><circle cx="12" cy="11.6" r="2.6" /><circle cx="12" cy="16.6" r="3.2" /><path d="M12 5.5V3" /><path d="M10.3 4L9 2.5" /><path d="M13.7 4L15 2.5" /><path d="M9.3 10.5l-4-1.5" /><path d="M14.7 10.5l4-1.5" /><path d="M9 15l-4.5 1" /><path d="M15 15l4.5 1" /><path d="M9.3 18.5l-3.8 3" /><path d="M14.7 18.5l3.8 3" /></svg>;

    /* ── Interface / diversos ─────────────────────────────────────── */
    case 'chat':        return <svg {...p}>{title && <title>{title}</title>}<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></svg>;
    case 'calendar':    return <svg {...p}>{title && <title>{title}</title>}<rect x="3" y="4.5" width="18" height="17" rx="2" /><line x1="16" y1="2.5" x2="16" y2="6.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'clipboard':   return <svg {...p}><rect x="6" y="4" width="12" height="17" rx="1.5" /><rect x="9" y="2.5" width="6" height="3" rx="1" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="15" y2="15" /></svg>;
    case 'folder':      return <svg {...p}><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h9A1.5 1.5 0 0 1 21 9v9.5A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5z" /></svg>;
    case 'store':       return <svg {...p}><path d="M3 9.5L4.5 4h15L21 9.5" /><path d="M3 9.5a2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.4 0" /><path d="M5 9.5V20h14V9.5" /><rect x="9.5" y="13" width="5" height="7" /></svg>;
    case 'cart':        return <svg {...p}><circle cx="9" cy="21" r="1.4" /><circle cx="18" cy="21" r="1.4" /><path d="M2.5 3h2.4l2.2 12h11.4l1.8-8H6" /></svg>;
    case 'trendingUp':  return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
    case 'calculator':  return <svg {...p}><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>;
    case 'shuffle':     return <svg {...p}><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>;
    case 'scroll':      return <svg {...p}><path d="M7 3h11a2.5 2.5 0 0 1 2.5 2.5v13" /><path d="M7 3a2.5 2.5 0 0 0-2.5 2.5V17a2.5 2.5 0 0 0 2.5 2.5h11.5a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 19.5" /><line x1="9" y1="8" x2="16" y2="8" /><line x1="9" y1="12" x2="16" y2="12" /></svg>;
    case 'play':        return <svg {...fp}><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.6" /><polygon points="10 8 16.5 12 10 16" /></svg>;
    case 'sun':  return <svg {...p}><circle cx="12" cy="12" r="4.5" /><line x1="12" y1="1.5" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22.5" /><line x1="4.2" y1="4.2" x2="6" y2="6" /><line x1="18" y1="18" x2="19.8" y2="19.8" /><line x1="1.5" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22.5" y2="12" /></svg>;
    case 'moon': return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    default: return null;
  }
}

/** Ícone da moeda "Folha" — a moeda de recompensa do MoviPay.
 *  Usa sempre a arte oficial (public/img), nunca emoji ou o ícone genérico
 *  de folha decorativa. `variant="light"` para fundos claros (padrão),
 *  `variant="dark"` para fundos escuros/coloridos (usa a versão com chip
 *  sólido, que mantém contraste em qualquer cor de fundo). */
export function FolhaCoin({ size = 20, variant = 'light', style, className, alt = 'Folhas' }) {
  const src = variant === 'dark' ? '/img/Iconfolha_para_fundoescuro.png' : '/img/Iconmoedafolha-fundobranco.png';
  const radius = variant === 'dark' ? '50%' : 0;
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'contain', flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
    />
  );
}

/** Avaliação em estrelas, desenhada em SVG (sem depender de fontes/emoji). */
export function StarRating({ rating = 0, size = 14, color = '#FBBF24', outlineColor, gap = 2, max = 5 }) {
  const n = Math.round(Number(rating) || 0);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {Array.from({ length: max }, (_, i) => (
        i < n
          ? <Icon key={i} name="star" size={size} color={color} />
          : <Icon key={i} name="starOutline" size={size} color={outlineColor || color} strokeWidth={1.6} style={{ opacity: 0.4 }} />
      ))}
    </span>
  );
}
