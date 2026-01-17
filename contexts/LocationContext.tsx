import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserLocation } from '../services/locationService';

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLocation = async () => {
    setLoading(true);
    setError(null);
    const location = await getUserLocation();
    if (location) {
      setUserLocation(location);
    } else {
      setError('Location unavailable');
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  const value: LocationContextType = {
    userLocation,
    loading,
    error,
    refreshLocation
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
