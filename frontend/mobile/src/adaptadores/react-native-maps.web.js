import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Only runs on Web (ver metro.config.js) — por isso pode importar 'react-leaflet'/'leaflet' (bibliotecas de DOM) sem medo, elas nunca entram no bundl...

let cssInjected = false;
function ensureLeafletCss() {
  if (cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

// Os ícones padrão do Leaflet referenciam caminhos de imagem que o Metro não resolve — trocando por URLs absolutas (CDN oficial do Leaflet) resolve d...
function fixDefaultIcon() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icone-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icone.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function coloredIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color || '#FF7A00'};border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      map.setView([lat, lng]);
    }
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Substitui o <MapView> da react-native-maps — mesma ideia de "regiao" (lat/lng + deltas), convertida para o "zoom" que o Leaflet usa.
export default function MapView({ style, initialRegion, regiao, pointerEvents, children }) {
  useEffect(() => {
    ensureLeafletCss();
    fixDefaultIcon();
  }, []);

  const r = regiao || initialRegion || { latitude: -23.71528, longitude: -46.41944, latitudeDelta: 0.05 };
  const zoom = r.latitudeDelta ? Math.round(14 - Math.log2(r.latitudeDelta / 0.01)) : 14;
  const isStatic = pointerEvents === 'none';

  return (
    <div style={{ ...(Array.isArray(style) ? Object.assign({}, ...style) : style), overflow: 'hidden' }}>
      <MapContainer
        center={[r.latitude, r.longitude]}
        zoom={Math.min(18, Math.max(3, zoom))}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={!isStatic}
        dragging={!isStatic}
        doubleClickZoom={!isStatic}
        touchZoom={!isStatic}
        zoomControl={!isStatic}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <Recenter lat={r.latitude} lng={r.longitude} />
        {children}
      </MapContainer>
    </div>
  );
}

// Substitui o <Marker> — mesma API (coordinate/titulo/descricao/pinColor/onPress)
export function Marker({ coordinate, titulo, descricao, pinColor, onPress, onCalloutPress }) {
  if (!coordinate) return null;
  return (
    <LeafletMarker
      position={[coordinate.latitude, coordinate.longitude]}
      icone={coloredIcon(pinColor)}
      eventHandlers={{ click: () => onPress?.() }}
    >
      {(titulo || descricao) && (
        <Popup>
          <div onClick={onCalloutPress} style={{ cursor: onCalloutPress ? 'pointer' : 'default' }}>
            {!!titulo && <strong>{titulo}</strong>}
            {!!descricao && <div style={{ fontSize: 12 }}>{descricao}</div>}
          </div>
        </Popup>
      )}
    </LeafletMarker>
  );
}
