export interface ScheduledBlock {
  id: string;
  title: string;
  startTime: string; // "HH:MM" 24h format
  duration: number; // minutes
  color: string;
  notes?: string;
}

export interface TrackerCell {
  color: string;
  text: string;
}

export interface DayPlan {
  id: string;
  date: string; // ISO Date string
  priorities: string[];
  brainDump: string;
  schedule: ScheduledBlock[];
  tracker: Record<string, TrackerCell[]>; 
  manualPlans: Record<string, string>; // time -> text
}

export const CATEGORY_COLORS: Record<string, string> = {
  work: 'bg-red-100 text-red-800 border-red-200', // Aggressive/Action
  personal: 'bg-stone-100 text-stone-800 border-stone-200',
  health: 'bg-emerald-100 text-emerald-800 border-emerald-200', // Recovery
  learn: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Pastel colors for random selection
export const PASTEL_COLORS = [
  'bg-red-200', 'bg-orange-200', 'bg-amber-200', 
  'bg-yellow-200', 'bg-lime-200', 'bg-green-200', 
  'bg-emerald-200', 'bg-teal-200', 'bg-cyan-200', 
  'bg-sky-200', 'bg-blue-200', 'bg-indigo-200', 
  'bg-violet-200', 'bg-purple-200', 'bg-fuchsia-200', 
  'bg-pink-200', 'bg-rose-200'
];

export interface SuggestionResponse {
  priorities: string[];
  schedule: {
    startTime: string;
    title: string;
    duration: number;
    category: 'work' | 'personal' | 'health' | 'learn' | 'other';
    reasoning: string;
  }[];
}