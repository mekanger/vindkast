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

    // Check if already saved to prevent duplicates
    if (savedLocations.some(loc => loc.id === location.id)) {
      return { error: null }; // Already saved, no need to insert again
    }

    try {
      const { error } = await supabase.from('saved_locations').upsert({
        user_id: user.id,
        location_id: location.id,
        name: location.name,
        region: location.region || null,
        country: location.country || null,
        latitude: location.coordinates.lat,
        longitude: location.coordinates.lon,
      }, { onConflict: 'user_id,location_id', ignoreDuplicates: true });

      if (error) throw error;

      // Only add to local state if not already there
      setSavedLocations(prev => {
        if (prev.some(loc => loc.id === location.id)) return prev;
        return [...prev, location];
      });
      return { error: null };
    } catch (error) {
      console.error('Error saving location:', error);
      return { error: error as Error };
    }
  }, [user, savedLocations]);

  const removeLocation = useCallback(async (locationId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // First delete all activity rules for this location
      const { error: rulesError } = await supabase
        .from('activity_rules')
        .delete()
        .eq('location_id', locationId);

      if (rulesError) {
        console.error('Error deleting activity rules:', rulesError);
        // Continue with location deletion even if rules deletion fails
      }

      // Then delete the location
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
