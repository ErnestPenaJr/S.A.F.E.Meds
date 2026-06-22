import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

const makeIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

const userIcon = makeIcon('blue');
const pharmIcon = makeIcon('green');
const selectedIcon = makeIcon('red');

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng]);
  }, [center, map]);
  return null;
}

export default function PharmacyMap({ center, pharmacies = [], selectedId, onSelect }) {
  if (!center) return null;
  // `isolate` contains Leaflet's internal z-indexes so they don't fight the
  // sticky header / bottom nav.
  return (
    <div className="isolate relative z-0 overflow-hidden rounded-xl border border-border">
      <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '320px', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        <Marker position={[center.lat, center.lng]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
        {pharmacies.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={p.id === selectedId ? selectedIcon : pharmIcon}
            eventHandlers={{ click: () => onSelect?.(p.id) }}
          >
            <Popup>
              <b>{p.name}</b>
              {p.address ? <><br />{p.address}</> : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
