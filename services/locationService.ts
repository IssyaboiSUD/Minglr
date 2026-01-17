/**
 * Get user's current geolocation
 * @returns Promise with coordinates {lat, lng} or null if unavailable
 */
export const getUserLocation = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Error getting location:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param distanceInKm Distance in kilometers
 * @returns Formatted string (e.g., "2.5 km" or "850 m")
 */
export const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    const meters = Math.round(distanceInKm * 1000);
    return `${meters} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
};

/**
 * Parse location string or object to get coordinates
 * @param location Location string or object with lat/lng
 * @returns Coordinates or null
 */
export const parseLocation = (location: any): { lat: number; lng: number } | null => {
  if (typeof location === 'string') {
    // Try to parse string like "48.1351, 11.5820" or "Munich, Germany"
    const coords = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coords) {
      return {
        lat: parseFloat(coords[1]),
        lng: parseFloat(coords[2])
      };
    }
    return null;
  }
  
  if (location && typeof location === 'object') {
    if (location.lat !== undefined && location.lng !== undefined) {
      return {
        lat: typeof location.lat === 'number' ? location.lat : parseFloat(location.lat),
        lng: typeof location.lng === 'number' ? location.lng : parseFloat(location.lng)
      };
    }
    if (location.latitude !== undefined && location.longitude !== undefined) {
      return {
        lat: typeof location.latitude === 'number' ? location.latitude : parseFloat(location.latitude),
        lng: typeof location.longitude === 'number' ? location.longitude : parseFloat(location.longitude)
      };
    }
  }
  
  return null;
};
