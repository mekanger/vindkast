import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ActivityRule, ActivityType, WindDirection } from '@/types/activity';

export const useActivityRules = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<ActivityRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    if (!user) {
      setRules([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('activity_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;

      setRules((data || []) as ActivityRule[]);
    } catch (error) {
      console.error('Error fetching activity rules:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const addRule = useCallback(async (rule: {
    location_id: string;
    location_name: string;
    activity: ActivityType;
    min_gust: number;
    max_gust: number;
    wind_directions?: WindDirection[] | null;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Get current minimum priority to place new rule at top
      const minPriority = rules.length > 0 
        ? Math.min(...rules.map(r => r.priority)) - 1 
        : 0;

      const { data, error } = await supabase
        .from('activity_rules')
        .insert({
          user_id: user.id,
          location_id: rule.location_id,
          location_name: rule.location_name,
          activity: rule.activity,
          min_gust: rule.min_gust,
          max_gust: rule.max_gust,
          priority: minPriority,
          wind_directions: rule.wind_directions || null,
        })
        .select()
        .single();

      if (error) throw error;

      setRules(prev => [data as ActivityRule, ...prev]);
      return { error: null };
    } catch (error) {
      console.error('Error adding rule:', error);
      return { error: error as Error };
    }
  }, [user, rules]);

  const updateRule = useCallback(async (ruleId: string, updates: {
    location_id?: string;
    location_name?: string;
    activity?: ActivityType;
    min_gust?: number;
    max_gust?: number;
    wind_directions?: WindDirection[] | null;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('activity_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;

      setRules(prev => prev.map(r => r.id === ruleId ? (data as ActivityRule) : r));
      return { error: null };
    } catch (error) {
      console.error('Error updating rule:', error);
      return { error: error as Error };
    }
  }, [user]);

  const deleteRule = useCallback(async (ruleId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('activity_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setRules(prev => prev.filter(r => r.id !== ruleId));
      return { error: null };
    } catch (error) {
      console.error('Error deleting rule:', error);
      return { error: error as Error };
    }
  }, [user]);

  const updatePriorities = useCallback(async (orderedIds: string[]) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Update local state immediately for responsive UI
      setRules(prev => {
        const ruleMap = new Map(prev.map(r => [r.id, r]));
        return orderedIds
          .map((id, index) => {
            const rule = ruleMap.get(id);
            if (rule) {
              return { ...rule, priority: index };
            }
            return null;
          })
          .filter((r): r is ActivityRule => r !== null);
      });

      // Update in database
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('activity_rules')
          .update({ priority: index })
          .eq('id', id)
      );

      await Promise.all(updates);
      return { error: null };
    } catch (error) {
      console.error('Error updating priorities:', error);
      // Refetch to restore correct state
      await fetchRules();
      return { error: error as Error };
    }
  }, [user, fetchRules]);

  return {
    rules,
    loading,
    addRule,
    updateRule,
    deleteRule,
    updatePriorities,
    refetch: fetchRules,
  };
};
