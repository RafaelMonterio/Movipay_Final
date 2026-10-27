'use client';
import { useEffect, useRef } from 'react';

// Centro de Ribeirão Pires/SP (cidade padrão de operação do MoviPay) —
// coordenada real da cidade, usada como fallback quando não há geolocalização
// disponível. Fonte: OpenStreetMap / IBGE.
export const CENTRO_CIDADE_PADRAO = [-23.7153, -46.4194];

/**
 * Resolve a posição de um trabalhador no mapa.
 *
 * Usa SOMENTE a localização real cadastrada no perfil do profissional
 * (worker.lat / worker.lng, definidos no cadastro a partir do bairro
 * selecionado). Se o profissional não tiver coordenadas cadastradas, o pino
 * simplesmente não é desenhado — nunca inventamos uma posição para ele.
 */
function resolveWorkerPosition(worker) {
  if (Number.isFinite(worker?.lat) && Number.isFinite(worker?.lng)) {
    return [Number(worker.lat), Number(worker.lng)];
  }
  return null;
}

// Ícones SVG (string crua) usados nos pinos do Leaflet — nunca emoji.
function professionSvg(path, color) {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
const PROFESSION_PATHS = {
  bolt:     '<polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2"/>',
  wrench:   '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 18.7 5.3 21l7.3-6.3a4 4 0 0 0 5.1-5.4l-2.9 2.9-2-2z"/>',
  broom:    '<line x1="13" y1="2" x2="7" y2="15"/><path d="M7 15l-3.5 6.5 9-2.5 3.5-6.5z"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
  hardHat:  '<path d="M4 15a8 8 0 0 1 16 0z"/><line x1="2" y1="15" x2="22" y2="15"/><path d="M12 15V7"/><path d="M12 7c2.4 0 4.3 1.6 4.9 4"/>',
  sprout:   '<path d="M12 21v-8"/><path d="M12 13c0-4 -3-6-7-6 0 4 3 6 7 6z"/><path d="M12 11c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z"/>',
  box:      '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><line x1="12" y1="13" x2="12" y2="21"/>',
  laptop:   '<rect x="3.5" y="4.5" width="17" height="11" rx="1.4"/><line x1="1.5" y1="19" x2="22.5" y2="19"/>',
  palette:  '<path d="M12 2a10 10 0 1 0 3.6 19.3c1-.4 1.2-1.7.4-2.4l-.5-.4a1.5 1.5 0 0 1 1-2.6H18a3 3 0 0 0 3-3 10.9 10.9 0 0 0-9-10.9z"/>',
  spa:      '<path d="M12 21c-4-1-6-4-6-8 3 0 5 1 6 3 1-2 3-3 6-3 0 4-2 7-6 8z"/>',
  book:     '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H12v18H5.5A1.5 1.5 0 0 1 4 19.5z"/><path d="M20 4.5A1.5 1.5 0 0 0 18.5 3H12v18h6.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
};
// Categoria -> ícone (para contas cadastradas de verdade, que só têm `category`)
const CATEGORY_TO_ICON = { eletrica: 'bolt', hidraulica: 'wrench', encanamento: 'wrench', limpeza: 'broom', cabelo: 'scissors', pedreiro: 'hardHat', reforma: 'hardHat', jardinagem: 'sprout', mudanca: 'box', informatica: 'laptop', pintura: 'palette', 'cuidado-pessoal': 'spa', aulas: 'book' };
const ICON_SVG = {
  pin: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:3px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
};
function professionIcon(worker, color) {
  const key = worker.icon || CATEGORY_TO_ICON[worker.category];
  return professionSvg(PROFESSION_PATHS[key] || PROFESSION_PATHS.box, color);
}

function avatarHtml(worker) {
  const photo = worker.photo || worker.avatar_url;
  if (photo) {
    return `<img src="${photo}" alt="${worker.name}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #FF7A00;" />`;
  }
  const initial = (worker.name || '?').trim().charAt(0).toUpperCase();
  return `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#FF7A00,#FFB066);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;border:2px solid #FF7A00;flex-shrink:0;">${initial}</div>`;
}

// Leaflet só funciona no browser (sem SSR)
export default function MapaProfissionais({ workers = [], center = CENTRO_CIDADE_PADRAO, onSelectWorker, height = 280, selectedWorkerId = null }) {
  const mapRef      = useRef(null);
  const instanceRef = useRef(null);

  // Keep the latest onSelectWorker in a ref instead of a effect dependency.
  // Callers pass an inline arrow function (a new reference on every render),
  // which — if used as a dependency — made this effect (and therefore the
  // whole Leaflet map) tear down and re-initialize on every parent
  // re-render, causing flicker and, under React 18 Strict Mode's
  // mount→unmount→remount dev cycle, the classic Leaflet
  // "Map container is already initialized" error.
  const onSelectWorkerRef = useRef(onSelectWorker);
  useEffect(() => { onSelectWorkerRef.current = onSelectWorker; }, [onSelectWorker]);

  // Same problem with `center`: callers usually pass an inline array
  // literal (e.g. center={[-23.7058, -46.3685]}), which is a new reference
  // every render even when the actual coordinates don't change. Depending
  // on a stable, primitive key instead avoids needless re-initialization.
  const centerKey = center.join(',');
  const workersKey = workers
    .map(w => `${w.id}:${w.lat ?? ''}:${w.lng ?? ''}:${w.is_available}`)
    .join('|');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Guards against the async import('leaflet') resolving after this
    // effect has already been cleaned up (component unmounted, or this
    // effect superseded by a newer run) — without this, a map instance
    // could be created on a DOM node that's already gone or already has
    // one, throwing "Map container is already initialized".
    let isActive = true;

    // Importa Leaflet dinamicamente (evita SSR errors)
    import('leaflet').then(L => {
      // Corrige os ícones do Leaflet no Next.js
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!isActive || !mapRef.current) return;

      // Evita duplicar o mapa se já foi inicializado
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }

      // Defensive cleanup: if a previous Leaflet instance on this same DOM
      // node was never properly torn down (e.g. a fast unmount/remount),
      // Leaflet leaves its internal `_leaflet_id` marker on the element and
      // refuses to initialize a new map on it, throwing "Map container is
      // already initialized". Clearing it here makes re-initialization safe.
      if (mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id;
      }

      const map = L.map(mapRef.current, {
        center,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });
      instanceRef.current = map;

      // Basemap claro e minimalista, 100% gratuito e sem exigir chave de
      // API (Esri "Light Gray Canvas"). O antigo provedor (CARTO) passou a
      // exigir uma API key para o tile raster e, sem ela, exibia a
      // marca d'água "API KEY REQUIRED" por cima do mapa.
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/servicos/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        minZoom: 3,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      }).addTo(map);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/servicos/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        minZoom: 3,
        pane: 'shadowPane', // fica acima do base, abaixo dos marcadores
      }).addTo(map);

      // Pin da localização atual (centro)
      const userIcon = L.divIcon({
        html: `<div style="
          width:18px;height:18px;border-radius:50%;
          background:#2563eb;border:3px solid white;
          box-shadow:0 2px 10px rgba(37,99,235,0.35)
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        className: '',
      });
      const userMarker = L.marker(center, { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Você está aqui</b>');

      // Pins dos trabalhadores — SEMPRE a partir da localização real
      // cadastrada no perfil (worker.lat/trabalhador.lng). Nenhuma coordenada é
      // inventada: se o profissional não tiver localização definida, ele
      // simplesmente não aparece no mapa.
      const markerLayers = [userMarker];
      workers.forEach(w => {
        const position = resolveWorkerPosition(w);
        if (!position) return;

        const [lat, lng] = position;
        const borderColor = w.is_available === false ? '#94A3B8' : '#FF7A00';
        const workerIcon = L.divIcon({
          html: `<div style="width:38px;height:38px;border-radius:50%;background:#fff;border:3px solid ${borderColor};box-shadow:0 8px 18px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;">${professionIcon(w, borderColor)}</div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          className: '',
        });

        const marker = L.marker([lat, lng], { icon: workerIcon, workerData: w }).addTo(map);
        markerLayers.push(marker);
        const profilePath = w.profileId ? `/cliente/profissionais/${w.profileId}` : `/cliente/profissionais/${w.id}`;
        const preview = `
          <div style="width:210px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
              ${avatarHtml(w)}
              <div>
                <a href="${profilePath}" style="display:block; font-weight:800; font-size:14px; line-height:1.2; color:#111827; text-decoration:none;">${w.name}</a>
                <div style="font-size:11px; color:#475569; margin-top:2px;">${w.role || w.specialty || w.service || 'Profissional'}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:11px; color:#475569; margin-top:4px;">
              <span>${ICON_SVG.pin}${w.neighborhood || w.city || 'Ribeirão Pires'}</span>
              <span>${w.distance_km ? `${w.distance_km} km` : 'Próximo'}</span>
            </div>
            <a href="${profilePath}" style="display:block; margin-top:10px; background:#FF7A00; color:#fff; text-align:center; border-radius:10px; padding:8px 10px; font-size:11px; font-weight:700; text-decoration:none;">Ver perfil completo</a>
          </div>
        `;

        marker.bindPopup(preview, {
          closeBotao: true,
          offset: [0, -12],
          className: 'leaflet-popup-custom',
          autoPan: true,
        });

        marker.on('click', () => {
          onSelectWorkerRef.current?.(w);
          marker.openPopup();
        });

        if (selectedWorkerId && String(w.id) === String(selectedWorkerId)) {
          marker.openPopup();
        }
      });

      // Enquadra automaticamente o pino do usuário + todos os trabalhadores
      // visíveis, para que nenhum marcador fique fora da área exibida —
      // independente de quantos profissionais existam ou de onde estejam.
      if (markerLayers.length > 1) {
        const bounds = L.featureGroup(markerLayers).getBounds().pad(0.35);
        map.fitBounds(bounds, { maxZoom: 15 });
      }

      // Leaflet CSS
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }
    });

    return () => {
      isActive = false;
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
    // Depend on stable, primitive keys (centerKey/profissionaisKey) instead of the
    // `center` array or `workers` array references, which are almost always
    // new on every parent render and previously caused the map to be torn
    // down and rebuilt constantly. `onSelectWorker` is read from a ref, not
    // a dependency, for the same reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workersKey, centerKey]);

  useEffect(() => {
    if (!instanceRef.current || !selectedWorkerId) return;

    const map = instanceRef.current;
    let selectedMarker = null;

    map.eachLayer(layer => {
      if (!(layer instanceof window.L.Marker)) return;

      const workerData = layer.options?.workerData;
      if (workerData && String(workerData.id) === String(selectedWorkerId)) {
        selectedMarker = layer;
      }
    });

    if (selectedMarker) {
      selectedMarker.openPopup();
    }
  }, [selectedWorkerId]);

  function zoomBy(d) {
    if (!instanceRef.current) return;
    if (d > 0) instanceRef.current.zoomIn(d); else instanceRef.current.zoomOut(-d);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapRef} className="w-full rounded-2xl overflow-hidden" style={{ height: '100%', width: '100%' }} />
      {/* Botões de zoom próprios: o controle padrão do Leaflet fica nos cantos,
          que a máscara circular da home corta. Estes ficam sempre visíveis. */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 40, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 999, boxShadow: '0 6px 20px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <button type="button" onClick={() => zoomBy(1)} aria-label="Aproximar" style={{ width: 34, height: 34, border: 'none', background: 'transparent', cursor: 'pointer', color: '#1f2937', fontSize: 18, fontWeight: 700 }}>+</button>
        <div style={{ width: 1, height: 18, background: '#e5e7eb' }} />
        <button type="button" onClick={() => zoomBy(-1)} aria-label="Afastar" style={{ width: 34, height: 34, border: 'none', background: 'transparent', cursor: 'pointer', color: '#1f2937', fontSize: 20, fontWeight: 700 }}>−</button>
      </div>
    </div>
  );
}
