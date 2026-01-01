import { supabaseClient, isSupabaseConfigured } from './supabase';

// Alias for backward compatibility
const supabase = supabaseClient;
import { DayPlan, ScheduledBlock, TrackerCell } from '../types';

const useSupabase = isSupabaseConfigured();

// ============================================
// Day Plans
// ============================================

export const saveDayPlan = async (
  userId: string,
  plan: DayPlan
): Promise<{ error: Error | null }> => {
  if (!useSupabase) {
    // localStorage fallback
    const key = `timebox_history_${userId}`;
    const existing = localStorage.getItem(key);
    const plans: DayPlan[] = existing ? JSON.parse(existing) : [];
    
    // Check if plan for this date exists
    const existingIndex = plans.findIndex(p => p.date === plan.date);
    if (existingIndex >= 0) {
      plans[existingIndex] = plan;
    } else {
      plans.unshift(plan);
    }
    
    localStorage.setItem(key, JSON.stringify(plans));
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('day_plans')
      .upsert({
        id: plan.id,
        user_id: userId,
        date: plan.date,
        priorities: plan.priorities,
        brain_dump: plan.brainDump,
        schedule: plan.schedule,
        tracker: plan.tracker,
        manual_plans: plan.manualPlans,
      }, {
        onConflict: 'id'
      });

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};

export const getDayPlans = async (
  userId: string
): Promise<{ data: DayPlan[] | null; error: Error | null }> => {
  if (!useSupabase) {
    const key = `timebox_history_${userId}`;
    const existing = localStorage.getItem(key);
    return { data: existing ? JSON.parse(existing) : [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('day_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const plans: DayPlan[] = (data || []).map(row => ({
      id: row.id,
      date: row.date,
      priorities: row.priorities as string[],
      brainDump: row.brain_dump,
      schedule: row.schedule as ScheduledBlock[],
      tracker: row.tracker as Record<string, TrackerCell[]>,
      manualPlans: row.manual_plans as Record<string, string>,
    }));

    return { data: plans, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
};

export const deleteDayPlan = async (
  userId: string,
  planId: string
): Promise<{ error: Error | null }> => {
  if (!useSupabase) {
    const key = `timebox_history_${userId}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      const plans: DayPlan[] = JSON.parse(existing);
      const filtered = plans.filter(p => p.id !== planId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('day_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};

// ============================================
// Weekly Plans
// ============================================

export interface WeeklyPlan {
  id: string;
  weekStart: string;
  priorities: string[];
  brainDump: string;
  tracker: Record<string, Record<string, TrackerCell[]>>;
}

export const saveWeeklyPlan = async (
  userId: string,
  plan: WeeklyPlan
): Promise<{ error: Error | null }> => {
  if (!useSupabase) {
    const key = `timebox_weekly_${userId}`;
    const existing = localStorage.getItem(key);
    const plans: WeeklyPlan[] = existing ? JSON.parse(existing) : [];
    
    const existingIndex = plans.findIndex(p => p.weekStart === plan.weekStart);
    if (existingIndex >= 0) {
      plans[existingIndex] = plan;
    } else {
      plans.unshift(plan);
    }
    
    localStorage.setItem(key, JSON.stringify(plans));
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('weekly_plans')
      .upsert({
        id: plan.id,
        user_id: userId,
        week_start: plan.weekStart,
        priorities: plan.priorities,
        brain_dump: plan.brainDump,
        tracker: plan.tracker,
      }, {
        onConflict: 'id'
      });

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};

export const getWeeklyPlans = async (
  userId: string
): Promise<{ data: WeeklyPlan[] | null; error: Error | null }> => {
  if (!useSupabase) {
    const key = `timebox_weekly_${userId}`;
    const existing = localStorage.getItem(key);
    return { data: existing ? JSON.parse(existing) : [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const plans: WeeklyPlan[] = (data || []).map(row => ({
      id: row.id,
      weekStart: row.week_start,
      priorities: row.priorities as string[],
      brainDump: row.brain_dump,
      tracker: row.tracker as Record<string, Record<string, TrackerCell[]>>,
    }));

    return { data: plans, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
};

export const deleteWeeklyPlan = async (
  userId: string,
  planId: string
): Promise<{ error: Error | null }> => {
  if (!useSupabase) {
    const key = `timebox_weekly_${userId}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      const plans: WeeklyPlan[] = JSON.parse(existing);
      const filtered = plans.filter(p => p.id !== planId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('weekly_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};

