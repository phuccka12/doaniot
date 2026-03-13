/**
 * Geofence helper: Haversine formula to calculate distance between two coordinates
 */

export interface SafeZone {
  lat: number;
  lng: number;
  radiusKm: number;
  name?: string;
}

/**
 * Calculate distance between two lat/lng points (in kilometers)
 */
export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a coordinate is inside a safe zone
 */
export const isInsideSafeZone = (
  currentLat: number,
  currentLng: number,
  safeZone: SafeZone
): boolean => {
  const distance = haversineDistance(
    currentLat,
    currentLng,
    safeZone.lat,
    safeZone.lng
  );
  return distance <= safeZone.radiusKm;
};

/**
 * Check if user is outside safe zone and return warning message
 */
export const checkGeofenceAlert = (
  currentLat: number,
  currentLng: number,
  safeZone: SafeZone
): { isOutside: boolean; distance: number; message: string } => {
  const distance = haversineDistance(
    currentLat,
    currentLng,
    safeZone.lat,
    safeZone.lng
  );
  const isOutside = distance > safeZone.radiusKm;

  return {
    isOutside,
    distance: parseFloat(distance.toFixed(2)),
    message: isOutside
      ? `⚠️ NGƯỜI THÂN ĐANG ĐI NGOÀI VÙNG AN TOÀN (${distance.toFixed(1)}km)`
      : `✓ Trong vùng an toàn`,
  };
};
