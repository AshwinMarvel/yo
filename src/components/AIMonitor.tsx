const checkProhibitedZones = (data: BoatData) => {
    prohibitedZones.forEach(zone => {
      const distance = calculateDistance(
        data.location.lat,
        data.location.lng,
        zone.lat,
        zone.lng
      );

      if (distance <= zone.radius / 1000) { // Convert radius to km for comparison
        onAlert({
          type: 'danger',
          message: `PROHIBITED ZONE ENTRY: Vessel has entered ${zone.name}`,
          zone: zone.name
        });
        onStatusChange('danger');
      } else if (distance <= (zone.radius * 1.5) / 1000) { // Convert radius to km for comparison
        onAlert({
          type: 'warning',
          message: `ZONE WARNING: Approaching ${zone.name} - maintain safe distance`,
          zone: zone.name
        });
        if (data.status !== 'danger') {
          onStatusChange('warning');
        }
      }
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Return distance in kilometers
  };