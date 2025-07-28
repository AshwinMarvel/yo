import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BoatData } from '../App';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WorldMapProps {
  boats: BoatData[];
  userType: 'fisherman' | 'coastguard';
  currentBoat?: BoatData | null;
  coastGuardLocation?: {lat: number, lng: number} | null;
  onBoatSelect?: (boat: BoatData) => void;
}

// Custom boat icons
const createBoatIcon = (status: BoatData['status'], isCurrentUser: boolean = false) => {
  const color = status === 'safe' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444';
  const size = isCurrentUser ? 30 : 20;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.6}px;
        color: white;
        font-weight: bold;
      ">
        🚢
      </div>
    `,
    className: 'custom-boat-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Coast Guard icon
const createCoastGuardIcon = () => {
  const size = 25;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: #DC2626;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.7}px;
        color: white;
        font-weight: bold;
      ">
        🛡️
      </div>
    `,
    className: 'custom-coastguard-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Static prohibited zones
const staticProhibitedZones = [
  {
    name: 'Marine Protected Area',
    center: [37.7749, -122.4194] as [number, number],
    radius: 1000,
    color: '#EF4444'
  },
  {
    name: 'Spawning Ground',
    center: [37.7849, -122.4094] as [number, number],
    radius: 800,
    color: '#F59E0B'
  }
];

// Function to create dynamic prohibited zones based on vessel locations
const createDynamicProhibitedZones = (boats: BoatData[]) => {
  const dynamicZones = [];

  // Create a dynamic restricted zone around the first fisherman (FISHER-002)
  const trackedBoat = boats.find(boat => boat.boatId === 'FISHER-002');
  if (trackedBoat) {
    dynamicZones.push({
      name: 'Dynamic Restricted Fishing Zone',
      center: [trackedBoat.location.lat, trackedBoat.location.lng] as [number, number],
      radius: 1200,
      color: '#EF4444',
      isDynamic: true,
      trackedVessel: trackedBoat.boatId
    });
  }

  return [...staticProhibitedZones, ...dynamicZones];
};

// Component to update map view when boats change
const MapUpdater: React.FC<{ boats: BoatData[]; userType: string; coastGuardLocation?: {lat: number, lng: number} | null }> = ({ boats, userType, coastGuardLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (boats.length > 0) {
      if (userType === 'fisherman' && boats.length === 1) {
        // Center on the single boat for fisherman view
        const boat = boats[0];
        map.setView([boat.location.lat, boat.location.lng], 13);
      } else if (userType === 'coastguard') {
        // For coast guard, include their location in bounds if available
        const allPoints = boats.map(boat => [boat.location.lat, boat.location.lng]);
        if (coastGuardLocation) {
          allPoints.push([coastGuardLocation.lat, coastGuardLocation.lng]);
        }
        if (allPoints.length > 0) {
          const bounds = L.latLngBounds(allPoints);
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      }
    }
  }, [boats, userType, coastGuardLocation, map]);

  return null;
};

const WorldMap: React.FC<WorldMapProps> = ({ boats, userType, currentBoat, coastGuardLocation, onBoatSelect }) => {
  const mapRef = useRef<L.Map>(null);

  // Default center (San Francisco Bay area)
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const defaultZoom = 12;

  // Create dynamic prohibited zones that follow vessel locations
  const prohibitedZones = createDynamicProhibitedZones(boats);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className={`bg-gradient-to-r p-4 text-white ${
        userType === 'coastguard' ? 'from-red-600 to-red-700' : 'from-blue-600 to-blue-700'
      }`}>
        <h3 className="text-lg font-semibold">
          {userType === 'coastguard' ? 'Fleet Tracking Map' : 'Live Position Map'}
        </h3>
        <p className="text-sm opacity-90">
          {userType === 'coastguard' 
            ? `Monitoring ${boats.length} active vessels` 
            : 'Real-time GPS tracking with prohibited zones'
          }
        </p>
      </div>
      
      <div className="h-96 relative">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater boats={boats} userType={userType} coastGuardLocation={coastGuardLocation} />
          
          {/* Prohibited Zones */}
          {prohibitedZones.map((zone, index) => (
            <Circle
              key={index}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 5'
              }}
            >
              <Popup>
                <div className="text-center">
                  <h4 className="font-semibold text-red-800">{zone.name}</h4>
                  <p className="text-sm text-red-600">
                    {(zone as any).isDynamic ? 'Dynamic Prohibited Zone' : 'Prohibited Fishing Zone'}
                  </p>
                  {(zone as any).isDynamic && (
                    <p className="text-xs text-blue-600 font-medium">
                      Following: {(zone as any).trackedVessel}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">Radius: {zone.radius}m</p>
                  {(zone as any).isDynamic && (
                    <p className="text-xs text-orange-600 italic">
                      ⚠️ Zone moves with vessel
                    </p>
                  )}
                </div>
              </Popup>
            </Circle>
          ))}
          
          {/* Coast Guard Location Marker */}
          {coastGuardLocation && userType === 'coastguard' && (
            <Marker
              position={[coastGuardLocation.lat, coastGuardLocation.lng]}
              icon={createCoastGuardIcon()}
            >
              <Popup>
                <div className="min-w-48">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Coast Guard Station</h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      COMMAND
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div><strong>Status:</strong> Active</div>
                    <div><strong>Position:</strong></div>
                    <div className="font-mono text-xs">
                      {coastGuardLocation.lat.toFixed(6)}, {coastGuardLocation.lng.toFixed(6)}
                    </div>
                    <div><strong>Last Update:</strong> {new Date().toLocaleTimeString()}</div>
                  </div>

                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800 font-medium">
                    🛡️ Your Command Center Position
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Boat Markers */}
          {boats.map((boat) => {
            const isCurrentUser = currentBoat?.aisId === boat.aisId;
            return (
              <Marker
                key={boat.aisId}
                position={[boat.location.lat, boat.location.lng]}
                icon={createBoatIcon(boat.status, isCurrentUser)}
                eventHandlers={{
                  click: () => onBoatSelect?.(boat)
                }}
              >
                <Popup>
                  <div className="min-w-48">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{boat.boatId}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        boat.status === 'safe' ? 'bg-green-100 text-green-800' :
                        boat.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {boat.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div><strong>AIS ID:</strong> {boat.aisId}</div>
                      {boat.fishermanName && (
                        <div><strong>Captain:</strong> {boat.fishermanName}</div>
                      )}
                      {boat.contactInfo && userType === 'coastguard' && (
                        <div><strong>Contact:</strong> {boat.contactInfo}</div>
                      )}
                      <div><strong>Speed:</strong> {boat.speed.toFixed(1)} kts</div>
                      <div><strong>Heading:</strong> {boat.heading}°</div>
                      <div><strong>Position:</strong></div>
                      <div className="font-mono text-xs">
                        {boat.location.lat.toFixed(6)}, {boat.location.lng.toFixed(6)}
                      </div>
                      <div><strong>Last Update:</strong> {new Date(boat.lastUpdate).toLocaleTimeString()}</div>
                    </div>

                    {isCurrentUser && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800 font-medium">
                        📍 Your Current Position
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Safe</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Danger</span>
            </div>
          </div>
          <div className="text-gray-500">
            🚢 = Vessel {userType === 'coastguard' ? '| 🛡️ = Coast Guard' : ''} | 🔴 = Prohibited Zone
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
