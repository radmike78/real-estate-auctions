import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Property } from '../types';
import { STATUS, fmtMoney } from '../lib/status';

interface Props {
  properties: Property[];
  onSearchArea: (bounds: [number, number, number, number]) => void;
}

const TONE_COLOR = { go: '#1f8a4c', wait: '#b7791f', stop: '#9b2c2c', info: '#2b6cb0' } as const;

export default function MapView({ properties, onSearchArea }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current).setView([36.15, -115.15], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    // Records without a verified location (e.g. live tax-sale parcels) aren't placed on the map.
    const placed = properties.filter((p): p is typeof p & { lat: number; lng: number } => p.lat !== null && p.lng !== null);
    for (const p of placed) {
      const color = TONE_COLOR[STATUS[p.status].tone];
      const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
      L.circleMarker([p.lat, p.lng], { radius: 7, color: '#fff', weight: 1.5, fillColor: color, fillOpacity: 0.9 })
        .bindPopup(
          `<strong>${esc(p.address)}</strong><br>${esc(p.city)} ${p.zip}<br>${esc(STATUS[p.status].label)}` +
            (p.sale?.minimumBid ? `<br>Min. bid ${fmtMoney(p.sale.minimumBid)}` : '') +
            `<br><a href="#/property/${p.id}">View details →</a>`,
        )
        .addTo(layer.current);
    }
    if (placed.length) {
      const b = L.latLngBounds(placed.map((p) => [p.lat, p.lng]));
      if (!map.current.getBounds().contains(b)) map.current.fitBounds(b.pad(0.1));
    }
  }, [properties]);

  return (
    <div className="map-wrap">
      <div ref={el} className="map" role="application" aria-label="Map of properties" />
      <button
        className="map-search"
        onClick={() => {
          const b = map.current?.getBounds();
          if (b) onSearchArea([b.getSouth(), b.getWest(), b.getNorth(), b.getEast()]);
        }}
      >
        Search this area
      </button>
      <div className="legend">
        {(['go', 'wait', 'stop', 'info'] as const).map((t) => (
          <span key={t}>
            <i style={{ background: TONE_COLOR[t] }} />
            {t === 'go' ? 'Buyable now' : t === 'wait' ? 'Not yet / conditional' : t === 'stop' ? 'Not for sale / off' : 'Needs confirmation'}
          </span>
        ))}
      </div>
    </div>
  );
}
