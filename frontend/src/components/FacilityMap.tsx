import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import type { RankedFacility } from '../types';

export default function FacilityMap({ lat, lon, results }: { lat: number; lon: number; results: RankedFacility[] }) {
  return (
    <MapContainer center={[lat, lon]} zoom={10} className="h-72 w-full rounded-2xl z-0" aria-label="Map of nearby healthcare facilities">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={[lat, lon]} radius={9} pathOptions={{ color: '#1d4ed8', fillOpacity: 0.9 }}><Popup>Your location</Popup></CircleMarker>
      {results.map((r) => (
        <CircleMarker key={r.facility.id} center={[r.facility.latitude, r.facility.longitude]} radius={8} pathOptions={{ color: r.warnings.length ? '#b45309' : '#15803d', fillOpacity: 0.8 }}>
          <Popup><strong>{r.facility.name}</strong><br />{r.distanceKm} km (straight line)<br />{r.facility.phone}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
