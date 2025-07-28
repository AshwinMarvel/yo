@@ .. @@
   // Simulate other boats for Coast Guard view
   useEffect(() => {
     if (userType === 'coastguard') {
       const simulatedBoats: BoatData[] = [
         {
           aisId: '987654321',
           boatId: 'FISHER-002',
           location: { lat: 37.7849, lng: -122.4194, timestamp: Date.now() },
           status: 'safe',
           speed: 8.5,
           heading: 180,
           lastUpdate: Date.now(),
           fishermanName: 'Captain Rodriguez',
           contactInfo: '+1-555-0102'
         },
         {
           aisId: '456789123',
           boatId: 'VESSEL-003',
           location: { lat: 37.7649, lng: -122.4294, timestamp: Date.now() },
           status: 'warning',
           speed: 12.3,
           heading: 90,
           lastUpdate: Date.now(),
           fishermanName: 'Captain Chen',
           contactInfo: '+1-555-0103'
         },
         {
           aisId: '789123456',
           boatId: 'BOAT-004',
           location: { lat: 37.7949, lng: -122.4094, timestamp: Date.now() },
           status: 'safe',
           speed: 6.7,
           heading: 270,
           lastUpdate: Date.now(),
           fishermanName: 'Captain Johnson',
           contactInfo: '+1-555-0104'
         }
       ];
 
       setAllBoats(simulatedBoats);
 
       // Simulate boat movement
       const moveInterval = setInterval(() => {
         setAllBoats(prev => prev.map(boat => ({
           ...boat,
           location: {
             ...boat.location,
             lat: boat.location.lat + (Math.random() - 0.5) * 0.001,
             lng: boat.location.lng + (Math.random() - 0.5) * 0.001,
             timestamp: Date.now()
           },
-          speed: Math.max(0, boat.speed + (Math.random() - 0.5) * 2),
-          heading: (boat.heading + (Math.random() - 0.5) * 20) % 360,
+          speed: Math.max(0, Math.min(25, boat.speed + (Math.random() - 0.5) * 2)), // Limit speed between 0-25 knots
+          heading: (boat.heading + (Math.random() - 0.5) * 20 + 360) % 360, // Ensure positive heading
           lastUpdate: Date.now()
         })));
       }, 5000);
 
       return () => clearInterval(moveInterval);
     }
   }, [userType]);