import { useState, useEffect } from 'react';
import { Navigation, MapPin, AlertTriangle, Shield, Waves, Activity, Users } from 'lucide-react';
import RegistrationForm from './components/RegistrationForm';
import Dashboard from './components/Dashboard';
import CoastGuardDashboard from './components/CoastGuardDashboard';
import AlertSystem from './components/AlertSystem';
import LocationTracker from './components/LocationTracker';
import AIMonitor from './components/AIMonitor';
import WorldMap from './components/WorldMap';

export interface BoatData {
  aisId: string;
  boatId: string;
  location: {
    lat: number;
    lng: number;
    timestamp: number;
  };
  status: 'safe' | 'warning' | 'danger';
  speed: number;
  heading: number;
  lastUpdate: number;
  fishermanName?: string;
  contactInfo?: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  timestamp: number;
  zone?: string;
  targetBoat?: string;
  fromCoastGuard?: boolean;
}

export interface CoastGuardMessage {
  id: string;
  targetBoat: string;
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  status: 'sent' | 'delivered' | 'acknowledged';
}

function App() {
  const [userType, setUserType] = useState<'fisherman' | 'coastguard' | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [boatData, setBoatData] = useState<BoatData | null>(null);
  const [allBoats, setAllBoats] = useState<BoatData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [coastGuardMessages, setCoastGuardMessages] = useState<CoastGuardMessage[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [coastGuardLocation, setCoastGuardLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isCoastGuardTracking, setIsCoastGuardTracking] = useState(false);

  // Auto-enable location tracking for coast guard (no simulated vessels)
  useEffect(() => {
    if (userType === 'coastguard') {
      // Auto-enable location tracking for coast guard
      setIsCoastGuardTracking(true);
      // Note: allBoats will only contain vessels registered by actual fishermen
    } else {
      // Disable coast guard tracking when not in coast guard mode
      setIsCoastGuardTracking(false);
      setCoastGuardLocation(null);
    }
  }, [userType]);

  const handleFishermanRegistration = (aisId: string, boatId: string, fishermanName: string, contactInfo: string) => {
    const newBoat: BoatData = {
      aisId,
      boatId,
      location: { lat: 13.0827, lng: 80.2707, timestamp: Date.now() },
      status: 'safe',
      speed: 0,
      heading: 0,
      lastUpdate: Date.now(),
      fishermanName,
      contactInfo
    };
    
    setBoatData(newBoat);
    setIsRegistered(true);
    setIsTracking(true);
    
    // Add to all boats list for Coast Guard tracking
    setAllBoats(prev => [...prev, newBoat]);
  };



  const updateLocation = (lat: number, lng: number) => {
    if (boatData) {
      const updatedBoat = {
        ...boatData,
        location: { lat, lng, timestamp: Date.now() },
        lastUpdate: Date.now()
      };
      setBoatData(updatedBoat);

      // Update in all boats list
      setAllBoats(prev => prev.map(boat =>
        boat.aisId === boatData.aisId ? updatedBoat : boat
      ));
    }
  };

  const updateCoastGuardLocation = (lat: number, lng: number) => {
    setCoastGuardLocation({ lat, lng });
  };

  const addAlert = (alert: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
  };

  const updateBoatStatus = (status: BoatData['status']) => {
    if (boatData) {
      const updatedBoat = { ...boatData, status };
      setBoatData(updatedBoat);
      
      // Update in all boats list
      setAllBoats(prev => prev.map(boat => 
        boat.aisId === boatData.aisId ? updatedBoat : boat
      ));
    }
  };

  const sendCoastGuardMessage = (targetBoat: string, message: string, priority: 'low' | 'medium' | 'high') => {
    const newMessage: CoastGuardMessage = {
      id: Math.random().toString(36).substr(2, 9),
      targetBoat,
      message,
      timestamp: Date.now(),
      priority,
      status: 'sent'
    };
    
    setCoastGuardMessages(prev => [newMessage, ...prev]);
    
    // Add as alert for the target boat
    addAlert({
      type: priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'info',
      message: `Coast Guard Message: ${message}`,
      targetBoat,
      fromCoastGuard: true
    });

    // Simulate message delivery
    setTimeout(() => {
      setCoastGuardMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 2000);
  };

  const updateBoatStatusByCoastGuard = (aisId: string, status: BoatData['status']) => {
    setAllBoats(prev => prev.map(boat => 
      boat.aisId === aisId ? { ...boat, status } : boat
    ));
    
    if (boatData && boatData.aisId === aisId) {
      setBoatData(prev => prev ? { ...prev, status } : null);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12 relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Waves className="h-16 w-16 text-white mr-4 drop-shadow-lg animate-bounce" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full animate-ping"></div>
              </div>
              <h1 className="text-5xl font-bold text-white drop-shadow-2xl bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                BLUE SHIELD AI
              </h1>
            </div>
            <p className="text-2xl text-white/90 font-light drop-shadow-lg mb-4">
              AI-Powered Maritime Intelligence System
            </p>
            <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Advanced vessel tracking, behavior analysis, and zone monitoring for maritime safety and compliance
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Navigation className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  Fisherman Portal
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Register your vessel for real-time monitoring, compliance tracking, and safety alerts
                </p>
              </div>
              <button
                onClick={() => setUserType('fisherman')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="flex items-center justify-center">
                  Continue as Fisherman
                  <Navigation className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Shield className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors duration-300">
                  Coast Guard Portal
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Monitor all vessels, manage maritime safety, and coordinate emergency responses
                </p>
              </div>
              <button
                onClick={() => setUserType('coastguard')}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="flex items-center justify-center">
                  Continue as Coast Guard
                  <Shield className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="max-w-6xl mx-auto mt-16 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center text-white/80">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Real-time Tracking</h3>
                <p className="text-sm">Live GPS monitoring with high-precision location data</p>
              </div>
              <div className="text-center text-white/80">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">AI Behavior Analysis</h3>
                <p className="text-sm">Advanced pattern recognition for safety compliance</p>
              </div>
              <div className="text-center text-white/80">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Zone Monitoring</h3>
                <p className="text-sm">Automated alerts for restricted and protected areas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userType === 'coastguard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-red-900 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-8 w-8 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold">Coast Guard Command Center</h1>
                  <p className="text-red-200">Maritime Safety & Vessel Monitoring</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <Users className="h-4 w-4 mr-1" />
                  {allBoats.length} {allBoats.length === 1 ? 'Vessel' : 'Vessels'} {allBoats.length === 0 ? 'Registered' : 'Tracked'}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsCoastGuardTracking(!isCoastGuardTracking)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      isCoastGuardTracking
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {isCoastGuardTracking ? '📍 Location On' : '📍 Enable Location'}
                  </button>
                  <button
                    onClick={() => {
                      setUserType(null);
                      setIsRegistered(false);
                      // Keep registered vessels in allBoats when coast guard logs out
                      setIsCoastGuardTracking(false);
                      setCoastGuardLocation(null);
                    }}
                    className="text-red-200 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <WorldMap
                boats={allBoats}
                userType="coastguard"
                coastGuardLocation={coastGuardLocation}
                onBoatSelect={(boat) => console.log('Selected boat:', boat)}
              />
              <CoastGuardDashboard
                boats={allBoats}
                onSendMessage={sendCoastGuardMessage}
                onUpdateBoatStatus={updateBoatStatusByCoastGuard}
                messages={coastGuardMessages}
              />
            </div>
            <div className="space-y-6">
              <LocationTracker
                onLocationUpdate={updateCoastGuardLocation}
                isTracking={isCoastGuardTracking}
                userType="coastguard"
              />
              <AlertSystem alerts={alerts} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12 relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Waves className="h-16 w-16 text-white mr-4 drop-shadow-lg animate-bounce" />
              <h1 className="text-5xl font-bold text-white drop-shadow-2xl">BLUE SHIELD AI</h1>
            </div>
            <p className="text-2xl text-white/90 font-light drop-shadow-lg">AI-Powered Maritime Intelligence System</p>
            <button
              onClick={() => setUserType(null)}
              className="mt-6 text-white/80 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm"
            >
              ← Back to Portal Selection
            </button>
          </div>
          <div className="relative z-10">
            <RegistrationForm onRegister={handleFishermanRegistration} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-2xl relative overflow-hidden">
        {/* Header background animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400"></div>
        
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center">
              <div className="relative">
                <Navigation className="h-10 w-10 mr-4 drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                  BLUE SHIELD AI
                </h1>
                <p className="text-blue-200 font-medium">
                  Vessel: <span className="text-cyan-300">{boatData?.boatId}</span> | 
                  AIS: <span className="text-cyan-300">{boatData?.aisId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm ${
                boatData?.status === 'safe' ? 'bg-green-100 text-green-800' :
                boatData?.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                <Shield className="h-4 w-4 mr-2" />
                {boatData?.status?.toUpperCase()}
              </div>
              {isTracking && (
                <div className="flex items-center text-green-300 bg-green-900/20 px-3 py-2 rounded-full backdrop-blur-sm">
                  <Activity className="h-4 w-4 mr-2 animate-pulse" />
                  Tracking Active
                </div>
              )}
              <button
                onClick={() => {
                  setUserType(null);
                  setIsRegistered(false);
                  // Remove current fisherman's boat from tracking when they logout
                  if (boatData) {
                    setAllBoats(prev => prev.filter(boat => boat.aisId !== boatData.aisId));
                  }
                  setBoatData(null);
                  setIsTracking(false);
                }}
                className="text-blue-200 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <WorldMap 
              boats={boatData ? [boatData] : []} 
              userType="fisherman"
              currentBoat={boatData}
            />
            <Dashboard boatData={boatData} />
            <LocationTracker
              onLocationUpdate={updateLocation}
              isTracking={isTracking}
            />
          </div>
          <div className="space-y-6">
            <AIMonitor
              boatData={boatData}
              onAlert={addAlert}
              onStatusChange={updateBoatStatus}
            />
            <AlertSystem alerts={alerts.filter(alert => 
              !alert.targetBoat || alert.targetBoat === boatData?.boatId
            )} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
