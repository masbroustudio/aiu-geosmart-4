'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface KecamatanMiniMapProps {
  lat: number;
  lng: number;
  name: string;
}

export default function KecamatanMiniMap({ lat, lng, name }: KecamatanMiniMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={[lat, lng]}
        radius={10}
        fillColor="#10B981"
        color="#10B981"
        weight={3}
        opacity={1}
        fillOpacity={0.6}
      >
        <Popup>
          <div className="text-sm font-semibold">{name}</div>
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}
