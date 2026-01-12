import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { WindUnit } from '@/types/settings';

const LOCAL_STORAGE_KEY = 'wind_unit_preference';

export function useUserSettings() {
  const { user } = useAuth();
  const [windUnit, setWindUnit] = useState<WindUnit>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return (stored === 'knots' ? 'knots' : 'ms') as WindUnit;
  });
  const [loading, setLoading] = useState(true);

  // Fetch settings from database when user is logged in
  useEffect(() => {
    async function fetchSettings() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('wind_unit')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching settings:', error);
        } else if (data?.wind_unit) {
          const unit = data.wind_unit as WindUnit;
          setWindUnit(unit);
          localStorage.setItem(LOCAL_STORAGE_KEY, unit);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [user]);

  const updateWindUnit = useCallback(async (unit: WindUnit) => {
    // Update local state immediately
    setWindUnit(unit);
    localStorage.setItem(LOCAL_STORAGE_KEY, unit);

    // Update database if user is logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ wind_unit: unit })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating wind unit:', error);
        }
      } catch (err) {
        console.error('Error updating wind unit:', err);
      }
    }
  }, [user]);

  return { windUnit, updateWindUnit, loading };
}
