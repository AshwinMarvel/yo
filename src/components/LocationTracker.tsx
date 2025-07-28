@@ .. @@
   useEffect(() => {
     if (!isTracking) return;
 
     if (!navigator.geolocation) {
       setLocationStatus('unavailable');
       return;
     }
 
+    // Request permission first
+    setLocationStatus('requesting');
+
     const watchId = navigator.geolocation.watchPosition(
       (position) => {
         setLocationStatus('granted');
         setAccuracy(position.coords.accuracy);
         setLastUpdate(Date.now());
         onLocationUpdate(position.coords.latitude, position.coords.longitude);
       },
       (error) => {
         console.error('Geolocation error:', error);
-        setLocationStatus('denied');
+        if (error.code === error.PERMISSION_DENIED) {
+          setLocationStatus('denied');
+        } else {
+          setLocationStatus('unavailable');
+        }
       },
       {
         enableHighAccuracy: true,
-        timeout: 10000,
+        timeout: 15000,
         maximumAge: 5000
       }
     );
 
     return () => {
       navigator.geolocation.clearWatch(watchId);
     };
   }, [isTracking, onLocationUpdate]);