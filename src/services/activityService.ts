import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Activity, ActivityQuestion, AgeGroup, ActivityCategory } from '../types';
import { MOCK_ACTIVITIES } from '../data/mockActivities';
import { ADVENTURE_ACTIVITIES } from '../data/adventureActivities';

// Flatten all adventure activities into a single lookup array
const ALL_ADVENTURE_ACTIVITIES: Activity[] = Object.values(ADVENTURE_ACTIVITIES).flat();

export const activityService = {
  async getActivities(ageGroup?: AgeGroup, category?: ActivityCategory): Promise<Activity[]> {
    if (!isSupabaseConfigured()) {
      // Combine mock activities + adventure activities for full coverage
      let activities: Activity[] = [...MOCK_ACTIVITIES, ...ALL_ADVENTURE_ACTIVITIES];
      if (ageGroup) activities = activities.filter(a => a.age_group === ageGroup);
      if (category) activities = activities.filter(a => a.category === category);

      // Fallback: if no results with both filters, try category only
      if (activities.length === 0 && ageGroup && category) {
        activities = [...MOCK_ACTIVITIES, ...ALL_ADVENTURE_ACTIVITIES].filter(a => a.category === category);
      }

      // Remove duplicates by id and sort by order_index
      const seen = new Set<string>();
      activities = activities.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      return activities.sort((a, b) => a.order_index - b.order_index);
    }

    let query = supabase.from('activities').select('*').eq('is_active', true);
    if (ageGroup) query = query.eq('age_group', ageGroup);
    if (category) query = query.eq('category', category);
    query = query.order('order_index');

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getActivityById(id: string): Promise<Activity | null> {
    if (!isSupabaseConfigured()) {
      // Search in both mock and adventure activities
      return MOCK_ACTIVITIES.find(a => a.id === id)
        || ALL_ADVENTURE_ACTIVITIES.find(a => a.id === id)
        || null;
    }

    const { data, error } = await supabase.from('activities').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async getActivityQuestions(activityId: string): Promise<ActivityQuestion[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('activity_questions')
      .select('*')
      .eq('activity_id', activityId);
    if (error) throw error;
    return data || [];
  },

  async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    if (!isSupabaseConfigured()) {
      const newActivity: Activity = {
        ...activity,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newActivity;
    }

    const { data, error } = await supabase.from('activities').insert(activity).select().single();
    if (error) throw error;
    return data;
  },

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
    if (!isSupabaseConfigured()) {
      const activity = MOCK_ACTIVITIES.find(a => a.id === id);
      if (!activity) throw new Error('Activity not found');
      return { ...activity, ...updates, updated_at: new Date().toISOString() };
    }

    const { data, error } = await supabase
      .from('activities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteActivity(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
  },
};
