import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Activity } from '../types';
import { ADVENTURE_ACTIVITIES } from '../data/adventureActivities';

const ALL_ADVENTURE_ACTIVITIES: Activity[] = Object.values(ADVENTURE_ACTIVITIES).flat();

export const activityService = {
  /** Atividade da aventura pelo id (com Supabase, da tabela activities). */
  async getActivityById(id: string): Promise<Activity | null> {
    if (!isSupabaseConfigured()) return ALL_ADVENTURE_ACTIVITIES.find((a) => a.id === id) || null;

    const { data, error } = await supabase.from('activities').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
};
