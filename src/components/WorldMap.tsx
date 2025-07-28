import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BoatData } from '../App';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
if (L.Icon.Default.prototype._getIconUrl) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface MapComponentProps {
  boats: BoatData[];
  selectedBoat: BoatData | null;
  onBoatSelect: (boat: BoatData) => void;
  userType: 'fisherman' | 'coastguard';
  liveTracking: boolean;
}

// Custom boat icon
const boatIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="24" height="24">
      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
      <path d="M12 16L22 20L12 18L2 20L12 16Z"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Component to handle map updates
function MapUpdater({ boats, selectedBoat }: { boats: BoatData[], selectedBoat: BoatData | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedBoat) {
      map.setView([selectedBoat.latitude, selectedBoat.longitude], 12);
    } else if (boats.length > 0) {
      const group = new L.FeatureGroup(
        boats.map(boat => L.marker([boat.latitude, boat.longitude]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [map, boats, selectedBoat]);

  return null;
}

export default function MapComponent({ boats, selectedBoat, onBoatSelect, userType, liveTracking }: MapComponentProps) {
  const mapRef = useRef<L.Map>(null);

  const getBoatColor = (boat: BoatData) => {
    if (boat.emergency) return '#ef4444'; // red
    if (boat.status === 'distress') return '#f97316'; // orange
    if (boat.status === 'safe') return '#22c55e'; // green
    return '#3b82f6'; // blue
  };

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[36.8065, 10.1815]} // Tunisia coordinates
        zoom={8}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater boats={boats} selectedBoat={selectedBoat} />
        
        {boats.map((boat) => (
          <React.Fragment key={boat.id}>
            <Marker
              position={[boat.latitude, boat.longitude]}
              icon={boatIcon}
              eventHandlers={{
                click: () => onBoatSelect(boat),
              }}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold text-lg mb-2">{boat.name}</div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Captain:</strong> {boat.captain}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                        boat.status === 'safe' ? 'bg-green-100 text-green-800' :
                        boat.status === 'distress' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {boat.status}
                      </span>
                    </div>
                    <div><strong>Speed:</strong> {boat.speed} knots</div>
                    <div><strong>Heading:</strong> {boat.heading}°</div>
                    <div><strong>Fuel:</strong> {boat.fuel}%</div>
                    <div><strong>Last Update:</strong> {new Date(boat.lastUpdate).toLocaleTimeString()}</div>
                    {liveTracking && userType === 'coastguard' && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800 font-medium">
                        🟢 Live GPS Tracking Active
                      </div>
                    )}
                  </div>
                  {boat.emergency && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800 font-bold">
                      🚨 EMERGENCY ALERT
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {/* Safety zone circle */}
            <Circle
              center={[boat.latitude, boat.longitude]}
              radius={1000} // 1km radius
              pathOptions={{
                color: getBoatColor(boat),
                fillColor: getBoatColor(boat),
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}