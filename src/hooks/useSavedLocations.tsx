import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Location } from '@/types/weather';

interface SavedLocation {
  id: string;
  location_id: string;
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export const useSavedLocations = () => {
  const { user } = useAuth();
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedLocations = useCallback(async () => {
    if (!user) {
      setSavedLocations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const locations: Location[] = (data || []).map((loc: SavedLocation) => ({
        id: loc.location_id,
        name: loc.name,
        region: loc.region || undefined,
        country: loc.country || undefined,
        coordinates: {
          lat: loc.latitude,
          lon: loc.longitude,
        },
      }));

      setSavedLocations(locations);
    } catch (error) {
      console.error('Error fetching saved locations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedLocations();
  }, [fetchSavedLocations]);

  const saveLocation = useCallback(async (location: Location) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase.from('saved_locations').insert({
        user_id: user.id,
        location_id: location.id,
        name: location.name,
        region: location.region || null,
        country: location.country || null,
        latitude: location.coordinates.lat,
        longitude: location.coordinates.lon,
      });

      if (error) throw error;

      setSavedLocations(prev => [...prev, location]);
      return { error: null };
    } catch (error) {
      console.error('Error saving location:', error);
      return { error: error as Error };
    }
  }, [user]);

  const removeLocation = useCallback(async (locationId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('location_id', locationId);

      if (error) throw error;

      setSavedLocations(prev => prev.filter(loc => loc.id !== locationId));
      return { error: null };
    } catch (error) {
      console.error('Error removing location:', error);
      return { error: error as Error };
    }
  }, [user]);

  return {
    savedLocations,
    loading,
    saveLocation,
    removeLocation,
    refetch: fetchSavedLocations,
  };
};
