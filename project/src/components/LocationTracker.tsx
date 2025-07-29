import React, { useEffect, useState } from 'react';
import { MapPin, Satellite, AlertCircle, CheckCircle } from 'lucide-react';

interface LocationTrackerProps {
  onLocationUpdate: (lat: number, lng: number) => void;
  isTracking: boolean;
  userType?: 'fisherman' | 'coastguard';
}

const LocationTracker: React.FC<LocationTrackerProps> = ({ onLocationUpdate, isTracking, userType = 'fisherman' }) => {
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'unsupported'>('requesting');
  const [accuracy, setAccuracy] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const [useHighAccuracy, setUseHighAccuracy] = useState<boolean>(true);
  const [rejectedCount, setRejectedCount] = useState<number>(0);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');

  // Define acceptable accuracy thresholds
  const ACCURACY_THRESHOLD = {
    HIGH: 50,      // 50m for high accuracy mode
    MEDIUM: 500,   // 500m for medium accuracy
    LOW: 5000      // 5km as absolute maximum
  };

  useEffect(() => {
    console.log('LocationTracker useEffect triggered - isTracking:', isTracking, 'userType:', userType);

    if (!isTracking) {
      setLocationStatus('requesting');
      setErrorMessage('');
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation API not available');
      setLocationStatus('unsupported');
      setErrorMessage('Geolocation API not supported by this browser');
      return;
    }

    console.log('Starting geolocation watch...');

    // First, try to get immediate position for faster response
    const getImmediatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Immediate position success:', position);
          handlePositionSuccess(position);
        },
        (error) => {
          console.log('Immediate position failed:', error.message, 'Starting watch...');
          // Continue with watch even if immediate position fails
        },
        {
          enableHighAccuracy: false, // Start with low accuracy for speed
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    };

    getImmediatePosition();

    // Progressive timeout and accuracy settings based on retry attempts
    const getLocationOptions = () => {
      const baseTimeout = 20000; // Start with 20 seconds
      const maxAge = retryAttempt > 2 ? 60000 : 10000; // Accept older positions after multiple retries

      return {
        enableHighAccuracy: useHighAccuracy && retryAttempt < 3,
        timeout: Math.min(baseTimeout + (retryAttempt * 10000), 45000), // Progressive timeout up to 45s
        maximumAge: maxAge
      };
    };

    const options = getLocationOptions();
    console.log('Starting geolocation with options:', options, 'Retry attempt:', retryAttempt);

    // Function to handle successful position
    const handlePositionSuccess = (position: GeolocationPosition) => {
      const currentAccuracy = position.coords.accuracy;

      // More lenient accuracy thresholds
      let threshold = ACCURACY_THRESHOLD.LOW; // Start with most lenient
      if (useHighAccuracy && retryAttempt < 2) {
        threshold = ACCURACY_THRESHOLD.MEDIUM; // Medium accuracy first
      }
      if (useHighAccuracy && retryAttempt === 0 && currentAccuracy <= ACCURACY_THRESHOLD.HIGH) {
        threshold = ACCURACY_THRESHOLD.HIGH; // Only use high if very good signal
      }

      console.log('Geolocation result:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: currentAccuracy,
        threshold: threshold,
        accepted: currentAccuracy <= threshold,
        timestamp: position.timestamp,
        retryAttempt: retryAttempt,
        highAccuracy: useHighAccuracy
      });

      // Accept most positions unless they're extremely inaccurate
      if (currentAccuracy <= threshold) {
        setLocationStatus('granted');
        setAccuracy(currentAccuracy);
        setLastUpdate(Date.now());
        setErrorMessage('');
        setRetryAttempt(0);
        setRejectedCount(0);
        onLocationUpdate(position.coords.latitude, position.coords.longitude);
      } else {
        // Only reject if accuracy is really bad
        console.log(`Location rejected due to poor accuracy: ${currentAccuracy}m > ${threshold}m`);
        setRejectedCount(prev => prev + 1);
        setErrorMessage(`GPS accuracy: ${currentAccuracy.toFixed(0)}m. Trying to improve...`);

        // After a few rejections, accept any position
        if (rejectedCount > 2) {
          console.log('Accepting position despite poor accuracy after multiple rejections');
          setLocationStatus('granted');
          setAccuracy(currentAccuracy);
          setLastUpdate(Date.now());
          setErrorMessage('GPS signal weak but tracking active');
          setRejectedCount(0);
          onLocationUpdate(position.coords.latitude, position.coords.longitude);
        }
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      (error) => {
        console.error('Geolocation error details:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Retry attempt:', retryAttempt);
        console.error('High accuracy mode:', useHighAccuracy);
        console.error('Error constants - PERMISSION_DENIED:', error.PERMISSION_DENIED, 'POSITION_UNAVAILABLE:', error.POSITION_UNAVAILABLE, 'TIMEOUT:', error.TIMEOUT);

        // Also log a readable interpretation
        const errorType = error.code === error.PERMISSION_DENIED ? 'PERMISSION_DENIED' :
                         error.code === error.POSITION_UNAVAILABLE ? 'POSITION_UNAVAILABLE' :
                         error.code === error.TIMEOUT ? 'TIMEOUT' : 'UNKNOWN';
        console.error('Error type:', errorType);

        let status: typeof locationStatus = 'denied';
        let message = '';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            status = 'denied';
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            status = 'unavailable';
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            status = 'timeout';
            message = `Location request timed out (attempt ${retryAttempt + 1}). ${useHighAccuracy ? 'Try low accuracy mode.' : 'Consider manual location entry.'}`;
            break;
          default:
            status = 'denied';
            message = `Unknown error: ${error.message}`;
        }

        setLocationStatus(status);
        setErrorMessage(message);
      },
      {
        ...options,
        // More aggressive options for better success rate
        enableHighAccuracy: useHighAccuracy && retryAttempt < 2,
        timeout: Math.max(options.timeout, 15000), // Minimum 15s timeout
        maximumAge: retryAttempt > 1 ? 600000 : options.maximumAge // Accept 10min old position after retries
      }
    );

    return () => {
      console.log('Clearing geolocation watch');
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking, onLocationUpdate]);

  const getStatusIcon = () => {
    switch (locationStatus) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'denied':
      case 'unavailable':
      case 'timeout':
      case 'unsupported':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Satellite className="h-5 w-5 text-yellow-600 animate-pulse" />;
    }
  };

  const getStatusMessage = () => {
    switch (locationStatus) {
      case 'granted':
        if (accuracy <= 50) return 'GPS tracking active - High precision';
        if (accuracy <= 500) return 'GPS tracking active - Medium precision';
        return 'GPS tracking active - Low precision';
      case 'denied':
        return 'Location access denied';
      case 'unavailable':
        return 'GPS unavailable';
      case 'timeout':
        return 'Location request timed out';
      case 'unsupported':
        return 'GPS not supported';
      default:
        return rejectedCount > 0 ? 'Improving GPS signal...' : 'Requesting location access...';
    }
  };

  const retryLocation = () => {
    setLocationStatus('requesting');
    setErrorMessage('');
    setRetryAttempt(prev => prev + 1);
    setRejectedCount(0);
  };

  const tryLowAccuracyMode = () => {
    setUseHighAccuracy(false);
    setLocationStatus('requesting');
    setErrorMessage('');
    setRetryAttempt(prev => prev + 1);
    setRejectedCount(0);
  };

  const requestPermissionExplicitly = async () => {
    try {
      const permission = await navigator.permissions.query({name: 'geolocation'});
      console.log('Geolocation permission status:', permission.state);

      if (permission.state === 'prompt') {
        // Try to trigger permission dialog
        navigator.geolocation.getCurrentPosition(
          () => console.log('Permission granted'),
          (error) => console.log('Permission denied:', error),
          { timeout: 1000 }
        );
      }
    } catch (e) {
      console.log('Permission API not supported, using fallback');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className={`h-5 w-5 mr-2 ${userType === 'coastguard' ? 'text-red-600' : 'text-blue-600'}`} />
          {userType === 'coastguard' ? 'Coast Guard Position' : 'GPS Location Tracking'}
        </h3>
        {getStatusIcon()}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`text-sm font-medium ${
            locationStatus === 'granted' ? 'text-green-600' :
            ['denied', 'unavailable', 'timeout', 'unsupported'].includes(locationStatus) ? 'text-red-600' :
            'text-yellow-600'
          }`}>
            {getStatusMessage()}
          </span>
        </div>
        
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Error Details:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {locationStatus === 'granted' && (
          <>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Accuracy:</span>
              <span className={`text-sm font-medium ${
                accuracy <= 50 ? 'text-green-600' :
                accuracy <= 500 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                ±{accuracy.toFixed(0)}m
                {accuracy <= 50 && ' 🎯'}
                {accuracy > 50 && accuracy <= 500 && ' ⚠️'}
                {accuracy > 500 && ' ❌'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Last Update:</span>
              <span className="text-sm font-medium text-gray-900">
                {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
              </span>
            </div>

            {rejectedCount > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">📡 Improving GPS Signal</p>
                  <p className="text-xs mt-1">{rejectedCount} poor readings rejected. Waiting for better accuracy...</p>
                </div>
              </div>
            )}
          </>
        )}

        {locationStatus === 'denied' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Location access is required</p>
                <p>Please enable location permissions in your browser settings to track {userType === 'coastguard' ? 'your position' : 'vessel position'}.</p>
                <div className="mt-2 text-xs space-y-1">
                  <p><strong>Chrome/Edge:</strong> Click the 🔒 or location icon in the address bar</p>
                  <p><strong>Firefox:</strong> Click the shield icon and allow location</p>
                  <p><strong>Safari:</strong> Go to Safari Settings → Websites → Location</p>
                  <p><strong>Mobile:</strong> Check your browser app permissions in device settings</p>
                </div>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={retryLocation}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded transition-colors"
                  >
                    Retry Location Access
                  </button>
                  <button
                    onClick={requestPermissionExplicitly}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded transition-colors"
                  >
                    Request Permission
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {locationStatus === 'timeout' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Location request timed out</p>
                <p>GPS signal may be weak. Try moving to an area with better reception or try different accuracy modes.</p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={retryLocation}
                    className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs rounded transition-colors"
                  >
                    Retry (Attempt {retryAttempt + 1})
                  </button>
                  {useHighAccuracy && (
                    <button
                      onClick={tryLowAccuracyMode}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded transition-colors"
                    >
                      Try Low Accuracy Mode
                    </button>
                  )}
                </div>
                <div className="mt-2 text-xs">
                  <p><strong>Tips:</strong></p>
                  <p>• Move outdoors for better GPS signal</p>
                  <p>• Check if location services are enabled</p>
                  <p>• Try refreshing the page</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {locationStatus === 'unavailable' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">GPS unavailable</p>
                <p>Your device or browser doesn't support location tracking.</p>
                <button 
                  onClick={retryLocation}
                  className="mt-2 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs rounded transition-colors"
                >
                  Retry Location Access
                </button>
              </div>
            </div>
          </div>
        )}

        {locationStatus === 'unsupported' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Geolocation not supported</p>
                <p>Your browser doesn't support geolocation features.</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex items-center text-xs text-gray-500">
            <Satellite className="h-3 w-3 mr-1" />
            High-accuracy GPS tracking enabled for precise {userType === 'coastguard' ? 'command center' : 'vessel'} monitoring
          </div>
          {locationStatus === 'requesting' && (
            <div className="mt-2 text-xs text-blue-600">
              🔄 Attempting to access device location...
            </div>
          )}

          {/* Debug information */}
          <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
            <div className="font-medium text-gray-700 mb-1">Debug Info:</div>
            <div className="text-gray-600 space-y-1">
              <div>Tracking: {isTracking ? 'ON' : 'OFF'}</div>
              <div>User Type: {userType}</div>
              <div>Browser Support: {typeof navigator !== 'undefined' && navigator.geolocation ? 'YES' : 'NO'}</div>
              <div>HTTPS: {typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'YES' : 'NO'}</div>
              <div>Retry Count: {retryAttempt}</div>
              <div>High Accuracy: {useHighAccuracy ? 'ON' : 'OFF'}</div>
              <div>Rejected Readings: {rejectedCount}</div>
              <div>Accuracy Threshold: {useHighAccuracy ? '50m' : retryAttempt > 4 ? '5000m' : '500m'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationTracker;
