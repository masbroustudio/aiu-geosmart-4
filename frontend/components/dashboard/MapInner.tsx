'use client';
 
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
 
interface MapInnerProps {
  data: { kecamatan: string; kabupaten: string; lat: number; lng: number; score: number }[];
  visualizationMode?: 'pin' | 'heatmap';
}
 
function getColor(score: number): string {
  if (score < 40) return '#EF4444';
  if (score < 60) return '#F59E0B';
  if (score < 75) return '#FCD34D';
  return '#10B981';
}
 
export default function MapInner({ data, visualizationMode = 'pin' }: MapInnerProps) {
  const router = useRouter();
  const isHeatmap = visualizationMode === 'heatmap';

  return (
    <MapContainer
      center={[-6.9, 107.6]}
      zoom={9}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {data.map((item, index) => (
        <CircleMarker
          key={index}
          center={[item.lat, item.lng]}
          radius={isHeatmap ? 30 : 8}
          fillColor={getColor(item.score)}
          color={getColor(item.score)}
          weight={isHeatmap ? 0 : 2}
          opacity={isHeatmap ? 0.05 : 0.8}
          fillOpacity={isHeatmap ? 0.25 : 0.6}
          pathOptions={{ className: 'cursor-pointer' }}
          eventHandlers={{
            click: () => {
              router.push(`/kecamatan?name=${encodeURIComponent(item.kecamatan)}&kabupaten=${encodeURIComponent(item.kabupaten)}`);
            },
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{item.kecamatan}</p>
              <p className="text-gray-600">{item.kabupaten}</p>
              <p className="font-medium">Score: {item.score.toFixed(1)}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
