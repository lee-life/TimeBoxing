import React, { useState, useRef, useEffect } from 'react';
import { generateSchedule } from './services/geminiService';
import { ScheduledBlock, DayPlan, CATEGORY_COLORS, TrackerCell, PASTEL_COLORS } from './types';
import { TimeSlot } from './components/TimeSlot';
import { Loader2, Zap, Download, Save, History, RotateCcw, X, Trophy, Target, Dumbbell, Quote, CheckSquare, Square, AlertTriangle, Clock, Palette, Pencil, LogOut, User, Lock, KeyRound, Mail } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { saveDayPlan, getDayPlans, saveWeeklyPlan, getWeeklyPlans, WeeklyPlan } from './services/dataService';

// Declaration for html2canvas
declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
  }
}

// 6 AM to 11 PM
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); 
const TIME_SLOTS = HOURS.flatMap(h => [`${h.toString().padStart(2, '0')}:00`, `${h.toString().padStart(2, '0')}:30`]);

const SAMPLE_BRAIN_DUMP = `07:00 Morning Jog & Stretch
09:00 Deep Work: Project Architecture
12:00 Healthy Lunch
14:00 Team Sync Meeting
16:00 Code Review & Emails
18:30 Boxing Training
21:00 Read Book & Relax`;

const App: React.FC = () => {
  // --- Auth / User State (Supabase or localStorage) ---
  const { user, fighterName, loading: authLoading, useSupabase, legacyLogin, signOut } = useAuth();
  
  const [tempName, setTempName] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- App State ---
  const [priorities, setPriorities] = useState<string[]>(['', '', '']);
  const [brainDump, setBrainDump] = useState<string>('');
  const [schedule, setSchedule] = useState<ScheduledBlock[]>([]);
  
  // New State for "Plan" text inputs and "Do" tracker cells
  const [manualPlans, setManualPlans] = useState<Record<string, string>>({});
  const [tracker, setTracker] = useState<Record<string, TrackerCell[]>>({}); // time -> [{color, text}, ...]
  
  // Modal State for Manual Block Creation / Editing
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [currentBlockStart, setCurrentBlockStart] = useState<string | null>(null);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockDuration, setNewBlockDuration] = useState(30);
  const [newBlockColor, setNewBlockColor] = useState('work');

  const [isGenerating, setIsGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedPlans, setSavedPlans] = useState<DayPlan[]>([]);
  // Editable Date State
  const [dateStr, setDateStr] = useState(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }));
  // Interactive Day Selector (0=Mon, 6=Sun)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday
    return (today + 6) % 7; // Convert to 0=Mon, 6=Sun
  });
  
  // Weekly Mode State
  const [isWeeklyMode, setIsWeeklyMode] = useState(false);
  const [weeklyPriorities, setWeeklyPriorities] = useState<string[]>(['', '', '', '', '']);
  const [weeklyBrainDump, setWeeklyBrainDump] = useState<string>('');
  const [weeklyTracker, setWeeklyTracker] = useState<Record<string, Record<string, TrackerCell[]>>>({});
  
  // Confirmation Modal State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Interactive Robot State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [punchState, setPunchState] = useState<'idle' | 'left' | 'right'>('idle');
  
  // Refs
  const plannerRef = useRef<HTMLDivElement>(null);
  const scheduleContainerRef = useRef<HTMLDivElement>(null);

  // --- Auth Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    if (!tempName.trim() || !tempPin.trim()) {
        setLoginError("Name and Code are required.");
        setIsLoggingIn(false);
        return;
    }
    
    const name = tempName.trim();
    const pin = tempPin.trim();
    
    const result = await legacyLogin(name, pin);
    
    if (result.error) {
      setLoginError(result.error.message || "Login failed.");
      setPunchState(Math.random() > 0.5 ? 'left' : 'right');
      setTimeout(() => setPunchState('idle'), 200);
    } else {
      setTempName('');
      setTempPin('');
    }
    
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    await signOut();
    setSavedPlans([]); 
    
    // Clear All Data
    setPriorities(['', '', '']);
    setBrainDump('');
    setSchedule([]);
    setTracker({});
    setManualPlans({});
    
    setShowLogoutConfirm(false);
  };

  // --- History Logic (User Specific) ---
  const getUserId = () => user?.id || fighterName || '';

  // Load History when user/fighterName changes
  useEffect(() => {
    if (!fighterName && !user) return;

    const loadPlans = async () => {
      const userId = getUserId();
      if (!userId) return;
      
      const { data } = await getDayPlans(userId);
      if (data) {
        setSavedPlans(data);
      }
    };
    
    loadPlans();
  }, [fighterName, user]);

  // Mouse Tracking for Parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    
    // Calculate normalized position (-1 to 1)
    const x = ((clientX - left) / width) * 2 - 1;
    const y = ((clientY - top) / height) * 2 - 1;
    
    setMousePos({ x, y });
  };

  // Touch Tracking for Mobile Parallax
  const handleTouchMove = (e: React.TouchEvent) => {
    const { clientX, clientY } = e.touches[0];
    const currentTarget = e.currentTarget;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    
    const x = ((clientX - left) / width) * 2 - 1;
    const y = ((clientY - top) / height) * 2 - 1;
    
    setMousePos({ x, y });
  };

  const triggerPunch = () => {
    // Randomize punch (Left or Right)
    const hand = Math.random() > 0.5 ? 'left' : 'right';
    setPunchState(hand);
    
    // Reset after animation
    setTimeout(() => setPunchState('idle'), 200);
  };

  // Actions
  const handleGenerate = async () => {
    let inputToUse = brainDump;

    // Demo Mode: If brain dump is empty, auto-fill
    if (!brainDump.trim()) {
       inputToUse = SAMPLE_BRAIN_DUMP;
       setBrainDump(SAMPLE_BRAIN_DUMP);
    }

    setIsGenerating(true);
    
    const result = await generateSchedule(inputToUse, schedule);
    setIsGenerating(false);

    if (result) {
      if (result.priorities && result.priorities.length > 0) {
        const newPriorities = [...result.priorities, '', '', ''].slice(0, 3);
        setPriorities(newPriorities);
      }
      
      if (result.schedule) {
        const newBlocks: ScheduledBlock[] = result.schedule.map((item, index) => ({
          id: `ai-${index}-${Date.now()}`,
          title: item.title,
          startTime: item.startTime,
          duration: item.duration,
          color: item.category
        }));
        setSchedule(newBlocks);
      }
    }
  };

  const saveToHistory = async () => {
    const userId = getUserId();
    if (!userId) return;

    const newPlan: DayPlan = {
      id: Date.now().toString(),
      date: dateStr, 
      priorities,
      brainDump,
      schedule,
      tracker,
      manualPlans
    };
    
    const { error } = await saveDayPlan(userId, newPlan);
    
    if (error) {
      alert("Failed to save: " + error.message);
      return;
    }
    
    const updatedHistory = [newPlan, ...savedPlans.filter(p => p.id !== newPlan.id)];
    setSavedPlans(updatedHistory);
    alert("Plan Saved to Locker Room!");
  };

  const loadPlan = (plan: DayPlan) => {
    setPriorities(plan.priorities);
    setBrainDump(plan.brainDump);
    setSchedule(plan.schedule);
    setManualPlans(plan.manualPlans || {});

    // Migration for legacy tracker data
    let newTracker: Record<string, TrackerCell[]> = {};
    if (plan.tracker) {
       Object.keys(plan.tracker).forEach(key => {
          const val = plan.tracker[key] as any;
          if (Array.isArray(val) && (val.length === 0 || typeof val[0] === 'string' || val[0] === null)) {
             newTracker[key] = (val as string[]).map((c: string) => ({ color: c || '', text: '' }));
          } else {
             newTracker[key] = val as TrackerCell[];
          }
       });
    }
    setTracker(newTracker);

    if(plan.date) {
        setDateStr(plan.date);
        const d = new Date(plan.date);
        if (!isNaN(d.getTime())) {
            setSelectedDayIndex((d.getDay() + 6) % 7);
        }
    }
    setHistoryOpen(false);
  };

  const confirmClearAll = () => {
    setPriorities(['', '', '']);
    setBrainDump('');
    setSchedule([]);
    setTracker({});
    setManualPlans({});
    setShowResetConfirm(false);
  };

  const downloadImage = async () => {
    if (!plannerRef.current || !window.html2canvas) return;

    try {
      setIsGenerating(true); 

      const originalWidth = plannerRef.current.style.width;
      const originalMinHeight = plannerRef.current.style.minHeight; 

      if (window.innerWidth < 768) {
         plannerRef.current.style.width = '800px'; 
      }
      plannerRef.current.style.minHeight = 'auto';

      const scrollContainer = scheduleContainerRef.current;
      const originalHeight = scrollContainer?.style.height;
      const originalOverflow = scrollContainer?.style.overflow;

      if (scrollContainer) {
        scrollContainer.style.height = 'auto';
        scrollContainer.style.overflow = 'visible';
      }

      const canvas = await window.html2canvas(plannerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: 1200,
        x: 0,
        y: 0
      });

      if (window.innerWidth < 768) {
        plannerRef.current.style.width = originalWidth;
      }
      plannerRef.current.style.minHeight = originalMinHeight || '';

      if (scrollContainer) {
        scrollContainer.style.height = originalHeight || '';
        scrollContainer.style.overflow = originalOverflow || '';
      }
      
      setIsGenerating(false);

      const link = document.createElement('a');
      link.download = `fight-card-${dateStr.replace(/[\/\s,]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      alert("Failed to save image");
    }
  };

  // Open the Modal for creating or editing a block
  const openBlockModal = (time: string, existingBlock?: ScheduledBlock) => {
    setCurrentBlockStart(time);
    
    if (existingBlock) {
        setEditingBlockId(existingBlock.id);
        setNewBlockTitle(existingBlock.title);
        setNewBlockDuration(existingBlock.duration);
        setNewBlockColor(existingBlock.color);
    } else {
        setEditingBlockId(null);
        // Use existing manual text as default title if available
        setNewBlockTitle(manualPlans[time] || '');
        setNewBlockDuration(60); // Default 1 hour
        setNewBlockColor('work');
    }
    
    setIsBlockModalOpen(true);
  };

  const handleSaveBlock = () => {
    if (!currentBlockStart || !newBlockTitle) return;

    const newBlock: ScheduledBlock = {
      id: editingBlockId || `manual-${Date.now()}`,
      title: newBlockTitle,
      startTime: currentBlockStart,
      duration: newBlockDuration,
      color: newBlockColor
    };
    
    setSchedule(prev => {
        // If editing, remove the old block by ID
        // If creating, remove any block that starts at exactly this time (overwrite)
        let filtered = prev;
        if (editingBlockId) {
            filtered = prev.filter(b => b.id !== editingBlockId);
        } else {
            filtered = prev.filter(b => b.startTime !== currentBlockStart);
        }
        return [...filtered, newBlock];
    });
    
    // Clear manual text for this slot to avoid visual duplication
    if (manualPlans[currentBlockStart]) {
        const newManual = { ...manualPlans };
        delete newManual[currentBlockStart];
        setManualPlans(newManual);
    }

    setIsBlockModalOpen(false);
    setEditingBlockId(null);
  };

  const removeBlock = (id: string) => {
    // Removed confirmation for smoother UI experience
    setSchedule(prev => prev.filter(b => b.id !== id));
  };

  const updateManualPlan = (time: string, text: string) => {
    setManualPlans(prev => ({...prev, [time]: text}));
  };

  const updateTrackerColor = (time: string, cellIndex: number) => {
    setTracker(prev => {
        const currentCells = prev[time] || Array(4).fill({ color: '', text: '' });
        const newCells = [...currentCells];
        const cell = newCells[cellIndex] || { color: '', text: '' };
        
        // Double click logic: Random Color <-> Clear
        if (cell.color) {
             newCells[cellIndex] = { ...cell, color: '' };
        } else {
             const randomColor = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
             newCells[cellIndex] = { ...cell, color: randomColor };
        }
        
        return { ...prev, [time]: newCells };
    });
  };

  const updateTrackerText = (time: string, cellIndex: number, text: string) => {
    setTracker(prev => {
        const currentCells = prev[time] || Array(4).fill({ color: '', text: '' });
        const newCells = [...currentCells];
        newCells[cellIndex] = { ...newCells[cellIndex], text };
        return { ...prev, [time]: newCells };
    });
  };

  const updatePriority = (index: number, value: string) => {
    const newP = [...priorities];
    newP[index] = value;
    setPriorities(newP);
  };

  const getBlockForSlot = (time: string) => schedule.find(b => b.startTime === time);
  
  // Get week date range for weekly mode
  const getWeekDateRange = () => {
    const currentDate = new Date(dateStr);
    if (isNaN(currentDate.getTime())) {
      const today = new Date();
      currentDate.setTime(today.getTime());
    }
    
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + mondayOffset);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    return `${formatDate(monday)}~${formatDate(sunday)}`;
  };
  
  // Weekly tracker update functions
  const updateWeeklyTrackerColor = (day: string, rowIndex: number, cellIndex: number) => {
    setWeeklyTracker(prev => {
      const dayData = prev[day] || {};
      const rowKey = `row-${rowIndex}`;
      const currentCells = dayData[rowKey] || Array(7).fill({ color: '', text: '' });
      const newCells = [...currentCells];
      const cell = newCells[cellIndex] || { color: '', text: '' };
      
      if (cell.color) {
        newCells[cellIndex] = { ...cell, color: '' };
      } else {
        const randomColor = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
        newCells[cellIndex] = { ...cell, color: randomColor };
      }
      
      return { ...prev, [day]: { ...dayData, [rowKey]: newCells } };
    });
  };
  
  const updateWeeklyTrackerText = (day: string, rowIndex: number, cellIndex: number, text: string) => {
    setWeeklyTracker(prev => {
      const dayData = prev[day] || {};
      const rowKey = `row-${rowIndex}`;
      const currentCells = dayData[rowKey] || Array(7).fill({ color: '', text: '' });
      const newCells = [...currentCells];
      newCells[cellIndex] = { ...newCells[cellIndex], text };
      
      return { ...prev, [day]: { ...dayData, [rowKey]: newCells } };
    });
  };
  
  const updateWeeklyPriority = (index: number, value: string) => {
    const newP = [...weeklyPriorities];
    newP[index] = value;
    setWeeklyPriorities(newP);
  };
  
  // Check if a slot is covered by a block starting earlier
  const isSlotCovered = (time: string) => {
    const timeToMin = (t: string) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);
    const currentMin = timeToMin(time);
    return schedule.some(b => {
      const startMin = timeToMin(b.startTime);
      const endMin = startMin + b.duration;
      // It is covered if current time is greater than start time but less than end time
      return currentMin > startMin && currentMin < endMin;
    });
  };

  // --- RENDER: LOADING SCREEN ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#111] text-gray-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="font-russo text-xl text-white">WARMING UP...</p>
        </div>
      </div>
    );
  }

  // --- RENDER: LOGIN SCREEN ---
  if (!fighterName) {
    return (
        <div className="min-h-screen bg-[#111] text-gray-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]"></div>

            <div className="relative z-10 w-full max-w-md bg-[#1a1a1a] border-2 border-red-600 p-8 shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center animate-[fadeIn_0.5s_ease-out]">
                <h1 className="text-5xl font-russo text-white italic tracking-tighter mb-2">TIME FIGHTER</h1>
                <p className="text-gray-400 font-mono text-sm mb-6 uppercase tracking-widest">
                    Identify Yourself & Unlock Locker
                </p>
                
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            type="text" 
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full bg-gray-800 border-b-2 border-gray-600 focus:border-red-600 outline-none py-3 pl-10 text-xl font-russo text-white placeholder-gray-600 transition-colors uppercase tracking-wider"
                            placeholder="FIGHTER NAME"
                            autoFocus
                        />
                    </div>
                    
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            type="password" 
                            value={tempPin}
                            onChange={(e) => setTempPin(e.target.value)}
                            className="w-full bg-gray-800 border-b-2 border-gray-600 focus:border-red-600 outline-none py-3 pl-10 text-xl font-russo text-white placeholder-gray-600 transition-colors uppercase tracking-wider tracking-[0.5em]"
                            placeholder="CODE (min 6 chars)"
                            minLength={6}
                        />
                    </div>
                    
                    {loginError && (
                         <div className="text-red-500 text-xs font-mono bg-red-900/20 p-2 border border-red-900 animate-pulse">
                             {loginError}
                         </div>
                    )}

                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                        * New fighter? Enter name & create a code to register.
                        <br/>
                        * Returning? Enter name & your code to login.
                    </p>

                    <button 
                        type="submit"
                        disabled={!tempName.trim() || !tempPin.trim() || tempPin.length < 6 || isLoggingIn}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-russo uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg mt-2 flex items-center justify-center gap-2"
                    >
                        {isLoggingIn ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Entering...</>
                        ) : (
                          <><Lock className="w-4 h-4" /> Enter The Ring</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="min-h-screen bg-[#111] text-gray-100 font-sans relative overflow-x-hidden selection:bg-red-500 selection:text-white">
      
      {/* --- Interactive Fight Header --- */}
      <div 
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onClick={triggerPunch}
        className="w-full h-[350px] md:h-[450px] bg-gradient-to-b from-gray-900 via-gray-900 to-black relative flex items-center justify-center overflow-hidden border-b-4 border-red-600 shadow-2xl cursor-crosshair group select-none touch-none"
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]"></div>

        <div className="relative w-full max-w-4xl h-full flex items-center justify-center pointer-events-none">
            <div 
                className="absolute w-[200px] h-[300px] md:w-[300px] md:h-[400px] bg-black rounded-full blur-xl opacity-60 transition-transform duration-100 ease-out z-10"
                style={{ transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)` }}
            >
                <div className="absolute top-10 left-10 right-10 bottom-0 bg-gradient-to-t from-gray-900 to-transparent rounded-[40%]"></div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-gray-900 rounded-full blur-sm"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-8">
                   <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red] animate-pulse"></div>
                   <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red] animate-pulse"></div>
                </div>
            </div>

            {/* Left Boxing Glove - 3D Style */}
            <div 
                className={`absolute left-[15%] md:left-[25%] top-[55%] z-20 transition-all duration-75 ease-out ${punchState === 'left' ? 'scale-150 translate-y-[-50px]' : ''}`}
                style={{ transform: punchState === 'left' ? 'scale(1.5) translateY(-50px) rotate(-15deg)' : `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px) rotate(-15deg)` }}
            >
                {/* Glove Main Body */}
                <div className="relative w-28 h-32 md:w-36 md:h-40">
                  {/* Wrist/Cuff Part */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-10 md:w-14 md:h-12 bg-gradient-to-b from-red-800 to-red-950 rounded-b-lg shadow-inner">
                    <div className="absolute inset-x-1 top-1 h-2 bg-gradient-to-r from-white/20 via-white/40 to-white/20 rounded-full"></div>
                    <div className="absolute inset-x-2 bottom-2 h-1 bg-black/30 rounded-full"></div>
                  </div>
                  
                  {/* Main Glove Body - Fist Part */}
                  <div className="absolute top-0 left-0 w-full h-[75%] bg-gradient-to-br from-red-500 via-red-600 to-red-800 rounded-[45%_55%_50%_50%/60%_60%_40%_40%] shadow-[inset_-8px_-8px_20px_rgba(0,0,0,0.4),inset_8px_8px_20px_rgba(255,255,255,0.1),0_15px_30px_rgba(0,0,0,0.5)]">
                    {/* Highlight */}
                    <div className="absolute top-3 left-3 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-sm"></div>
                    
                    {/* Knuckle Bumps */}
                    <div className="absolute top-[20%] left-[15%] right-[15%] flex justify-between">
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-red-400 to-red-700 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.2)]"></div>
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-red-400 to-red-700 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.2)]"></div>
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-red-400 to-red-700 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.2)]"></div>
                    </div>
                    
                    {/* Thumb Part */}
                    <div className="absolute top-[35%] -right-2 md:-right-3 w-8 h-12 md:w-10 md:h-14 bg-gradient-to-br from-red-500 to-red-800 rounded-[40%_60%_50%_50%] rotate-[25deg] shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.3),2px_4px_8px_rgba(0,0,0,0.3)]">
                      <div className="absolute top-1 left-1 w-3 h-3 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-[2px]"></div>
                    </div>
                    
                    {/* Leather Texture Lines */}
                    <div className="absolute top-[45%] left-[20%] w-[60%] h-[1px] bg-red-900/40"></div>
                    <div className="absolute top-[55%] left-[25%] w-[50%] h-[1px] bg-red-900/40"></div>
                    
                    {/* Bottom Shadow */}
                    <div className="absolute bottom-0 left-[10%] right-[10%] h-4 bg-gradient-to-t from-red-950/60 to-transparent rounded-b-full"></div>
                  </div>
                  
                  {/* Outer Glow */}
                  <div className="absolute inset-0 rounded-[45%_55%_50%_50%/60%_60%_40%_40%] shadow-[0_0_40px_rgba(220,38,38,0.5)]"></div>
                </div>
            </div>

            {/* Right Boxing Glove - 3D Style (Mirrored) */}
            <div 
                className={`absolute right-[15%] md:right-[25%] top-[55%] z-20 transition-all duration-75 ease-out ${punchState === 'right' ? 'scale-150 translate-y-[-50px]' : ''}`}
                style={{ transform: punchState === 'right' ? 'scale(1.5) translateY(-50px) rotate(15deg)' : `translate(${mousePos.x * -25}px, ${mousePos.y * -25}px) rotate(15deg)` }}
            >
                {/* Glove Main Body */}
                <div className="relative w-28 h-32 md:w-36 md:h-40">
                  {/* Wrist/Cuff Part */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-10 md:w-14 md:h-12 bg-gradient-to-b from-red-800 to-red-950 rounded-b-lg shadow-inner">
                    <div className="absolute inset-x-1 top-1 h-2 bg-gradient-to-r from-white/20 via-white/40 to-white/20 rounded-full"></div>
                    <div className="absolute inset-x-2 bottom-2 h-1 bg-black/30 rounded-full"></div>
                  </div>
                  
                  {/* Main Glove Body - Fist Part */}
                  <div className="absolute top-0 left-0 w-full h-[75%] bg-gradient-to-bl from-red-500 via-red-600 to-red-800 rounded-[55%_45%_50%_50%/60%_60%_40%_40%] shadow-[inset_8px_-8px_20px_rgba(0,0,0,0.4),inset_-8px_8px_20px_rgba(255,255,255,0.1),0_15px_30px_rgba(0,0,0,0.5)]">
                    {/* Highlight */}
                    <div className="absolute top-3 right-3 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-bl from-white/40 to-transparent rounded-full blur-sm"></div>
                    
                    {/* Knuckle Bumps */}
                    <div className="absolute top-[20%] left-[15%] right-[15%] flex justify-between">
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-bl from-red-400 to-red-700 rounded-full shadow-[inset_2px_-2px_4px_rgba(0,0,0,0.3),inset_-2px_2px_4px_rgba(255,255,255,0.2)]"></div>
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-bl from-red-400 to-red-700 rounded-full shadow-[inset_2px_-2px_4px_rgba(0,0,0,0.3),inset_-2px_2px_4px_rgba(255,255,255,0.2)]"></div>
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-bl from-red-400 to-red-700 rounded-full shadow-[inset_2px_-2px_4px_rgba(0,0,0,0.3),inset_-2px_2px_4px_rgba(255,255,255,0.2)]"></div>
                    </div>
                    
                    {/* Thumb Part */}
                    <div className="absolute top-[35%] -left-2 md:-left-3 w-8 h-12 md:w-10 md:h-14 bg-gradient-to-bl from-red-500 to-red-800 rounded-[60%_40%_50%_50%] rotate-[-25deg] shadow-[inset_3px_-3px_8px_rgba(0,0,0,0.3),-2px_4px_8px_rgba(0,0,0,0.3)]">
                      <div className="absolute top-1 right-1 w-3 h-3 bg-gradient-to-bl from-white/30 to-transparent rounded-full blur-[2px]"></div>
                    </div>
                    
                    {/* Leather Texture Lines */}
                    <div className="absolute top-[45%] left-[20%] w-[60%] h-[1px] bg-red-900/40"></div>
                    <div className="absolute top-[55%] left-[25%] w-[50%] h-[1px] bg-red-900/40"></div>
                    
                    {/* Bottom Shadow */}
                    <div className="absolute bottom-0 left-[10%] right-[10%] h-4 bg-gradient-to-t from-red-950/60 to-transparent rounded-b-full"></div>
                  </div>
                  
                  {/* Outer Glow */}
                  <div className="absolute inset-0 rounded-[55%_45%_50%_50%/60%_60%_40%_40%] shadow-[0_0_40px_rgba(220,38,38,0.5)]"></div>
                </div>
            </div>

            {punchState !== 'idle' && (
                <div className="absolute inset-0 bg-white/20 z-30 animate-ping pointer-events-none"></div>
            )}
        </div>

        <div 
            className="absolute z-40 text-center pointer-events-none transition-transform duration-100"
            style={{ transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)` }}
        >
            <h1 className="text-6xl md:text-9xl font-russo text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] transform -skew-x-6 pr-6 leading-none">
              TIME<br/>FIGHTER
            </h1>
            <div className="flex justify-center mt-6">
                <span className="bg-red-600 text-white font-bold px-6 py-2 uppercase tracking-[0.3em] text-xs md:text-sm skew-x-[-10deg] shadow-lg border border-red-400">
                    FIGHTER: {fighterName}
                </span>
            </div>
        </div>
      </div>

      {/* --- Coach's Corner (Controls) --- */}
      <div className="sticky top-0 z-50 bg-[#111]/95 backdrop-blur-md border-b border-gray-800 shadow-xl px-2 py-2 md:px-4 md:py-3">
        <div className="max-w-4xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            
            {/* Left Controls */}
            <div className="flex gap-1 md:gap-2 justify-start">
                 <button 
                    onClick={() => setHistoryOpen(true)}
                    className="p-1.5 md:p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Locker Room (History)"
                 >
                    <History className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
                 <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="p-1.5 md:p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Start Fresh (Reset)"
                 >
                    <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
            </div>

            {/* Center Button - Forced Center by Grid */}
            <div className="relative group flex justify-center">
                {/* Speech Bubble / Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 bg-white text-black text-[10px] p-2 rounded-lg shadow-xl font-bold text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 border-2 border-red-600 animate-bounce">
                   {brainDump.trim() ? "Generate from your notes!" : "Auto-Fill & Generate!"}
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-red-600 text-white px-4 py-1.5 md:px-8 md:py-2 rounded-sm text-xs md:text-sm font-russo uppercase tracking-wider flex items-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] active:scale-95 whitespace-nowrap"
                >
                    {isGenerating ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Zap className="w-3 h-3 md:w-4 md:h-4 fill-white" />}
                    {isGenerating ? "TRAINING..." : "START PLAN"}
                </button>
            </div>

            {/* Right Controls */}
            <div className="flex gap-1 md:gap-2 justify-end">
                 <button 
                    onClick={saveToHistory}
                    className="p-1.5 md:p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Save to History"
                 >
                    <Save className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
                 <button 
                    onClick={downloadImage}
                    className="p-1.5 md:p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Export Image"
                 >
                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
                 {/* Logout Button */}
                 <button 
                    onClick={handleLogout}
                    className="p-1.5 md:p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-500 transition-colors ml-1 md:ml-2 border-l border-gray-700"
                    title="Exit Gym (Logout)"
                 >
                    <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
            </div>
        </div>
      </div>

      {/* --- Fight Card (Paper Planner Style) --- */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div 
            ref={plannerRef}
            className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 border-stone-300 p-6 md:p-10 min-h-[1200px] flex flex-col relative text-gray-900"
            style={{ 
                // Subtle paper texture
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/notebook.png")' 
            }}
        >
            {/* Header / Date Section */}
            <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-black pb-6 mb-8 gap-6">
                <div>
                    <h2 className="text-4xl md:text-5xl font-russo tracking-tight text-black uppercase">
                      {isWeeklyMode ? 'WEEKLY PLAN' : 'TODAY PLAN'}
                    </h2>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1 font-mono">
                      TIME BOXING • FIGHTER: {fighterName}
                    </div>
                </div>
                
                {/* Editable Date Section */}
                <div className="flex flex-col items-end">
                     {isWeeklyMode ? (
                       <div className="font-pen text-2xl mb-2 font-bold tracking-widest text-right">
                         {getWeekDateRange()}
                       </div>
                     ) : (
                       <input 
                          type="text"
                          value={dateStr}
                          onChange={(e) => setDateStr(e.target.value)}
                          className="font-pen text-3xl mb-2 font-bold tracking-widest text-right bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-black outline-none w-40 transition-colors cursor-text"
                       />
                     )}
                     <div className="flex gap-2 items-center">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
                            const isSelected = !isWeeklyMode && selectedDayIndex === i;
                            
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => {
                                      if (!isWeeklyMode) setSelectedDayIndex(i);
                                    }}
                                    className={`relative flex items-center justify-center w-8 h-8 cursor-pointer group hover:bg-gray-100 rounded-full transition-colors ${isWeeklyMode ? 'opacity-40 cursor-default' : ''}`}
                                >
                                    <span className={`font-russo text-sm z-10 transition-colors ${isSelected ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`}>{d}</span>
                                    {isSelected && (
                                        <div className="absolute inset-0 border-[3px] border-black rounded-full transform -rotate-12 scale-110"></div>
                                    )}
                                </div>
                            );
                        })}
                        {/* Weekly Toggle */}
                        <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>
                        <div 
                            onClick={() => setIsWeeklyMode(!isWeeklyMode)}
                            className={`relative flex items-center justify-center w-10 h-8 cursor-pointer group rounded-full transition-all ${isWeeklyMode ? 'bg-black' : 'hover:bg-gray-100'}`}
                        >
                            <span className={`font-russo text-xs z-10 transition-colors ${isWeeklyMode ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>W</span>
                            {isWeeklyMode && (
                                <div className="absolute inset-0 border-[3px] border-black rounded-full transform -rotate-12 scale-110"></div>
                            )}
                        </div>
                     </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                
                {/* Left Column: Tasks & Brain Dump */}
                <div className="flex flex-col gap-8">
                    
                    {/* Top Priorities - 3 for Daily, 5 for Weekly */}
                    <div className="border-[3px] border-black p-5 bg-white relative">
                        {/* Section Label */}
                        <div className="absolute -top-3 left-4 bg-white px-2 font-russo text-lg uppercase tracking-wide">
                           {isWeeklyMode ? 'TOP 5 PRIORITIES' : 'TOP 3 PRIORITIES'}
                        </div>
                        
                        <div className="space-y-4 mt-2">
                            {isWeeklyMode ? (
                              weeklyPriorities.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                    <div className="relative w-6 h-6 border-2 border-black flex-shrink-0 cursor-pointer hover:bg-red-50 transition-colors">
                                        {p && <div className="absolute inset-0 m-0.5 bg-black clip-path-check hidden"></div>}
                                    </div>
                                    <input 
                                        type="text"
                                        value={p}
                                        onChange={(e) => updateWeeklyPriority(i, e.target.value)}
                                        placeholder={`Week goal ${i + 1}...`}
                                        className="w-full bg-transparent border-b border-gray-300 focus:border-red-600 outline-none py-1 font-pen text-xl text-gray-800 placeholder-gray-300 transition-colors"
                                    />
                                </div>
                              ))
                            ) : (
                              priorities.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                    <div className="relative w-6 h-6 border-2 border-black flex-shrink-0 cursor-pointer hover:bg-red-50 transition-colors">
                                        {p && <div className="absolute inset-0 m-0.5 bg-black clip-path-check hidden"></div>}
                                    </div>
                                    <input 
                                        type="text"
                                        value={p}
                                        onChange={(e) => updatePriority(i, e.target.value)}
                                        placeholder="Important task..."
                                        className="w-full bg-transparent border-b border-gray-300 focus:border-red-600 outline-none py-1 font-pen text-2xl text-gray-800 placeholder-gray-300 transition-colors"
                                    />
                                </div>
                              ))
                            )}
                        </div>
                    </div>

                    {/* Brain Dump */}
                    <div className="border-[3px] border-black p-5 flex-grow flex flex-col bg-white relative min-h-[400px]">
                        <div className="absolute -top-3 left-4 bg-white px-2 font-russo text-lg uppercase tracking-wide">
                           {isWeeklyMode ? 'WEEKLY BRAIN DUMP' : 'BRAIN DUMP'}
                        </div>
                        
                        {/* Lined Paper Background Effect */}
                        <textarea
                            value={isWeeklyMode ? weeklyBrainDump : brainDump}
                            onChange={(e) => isWeeklyMode ? setWeeklyBrainDump(e.target.value) : setBrainDump(e.target.value)}
                            className="w-full h-full resize-none outline-none bg-transparent text-xl font-pen leading-[2.5rem] text-gray-800 placeholder-gray-300 p-0"
                            style={{
                                backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 95%)',
                                backgroundSize: '100% 2.5rem',
                                lineHeight: '2.5rem'
                            }}
                            placeholder={isWeeklyMode ? "• Weekly goals & ideas..." : "• Jot down everything..."}
                        />
                    </div>

                </div>

                {/* Right Column: Time Box (Daily) or Week Box (Weekly) */}
                <div className="flex flex-col h-full min-h-[600px]">
                     {isWeeklyMode ? (
                       <>
                         <div className="flex flex-col mb-2">
                            <h3 className="font-russo text-xl uppercase tracking-wide mb-2">WEEK BOX</h3>
                            <div className="flex gap-0 w-full">
                                 <div className="w-8 text-center font-bold text-[10px] text-gray-500 uppercase border-b border-gray-300 py-1"></div>
                                 {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                                   <div key={day} className="flex-1 text-center font-bold text-[10px] text-gray-500 uppercase border-b border-gray-300 bg-gray-50/50 py-1">{day}</div>
                                 ))}
                            </div>
                         </div>
                         
                         <div 
                            ref={scheduleContainerRef}
                            className="flex-grow border-[3px] border-black bg-white overflow-y-auto"
                         >
                            {/* Weekly rows - 10 rows for tasks */}
                            {Array.from({ length: 10 }, (_, rowIndex) => (
                              <div key={rowIndex} className="flex min-h-[50px] border-b border-gray-300 relative group">
                                {/* Row number */}
                                <div className="w-8 flex-shrink-0 border-r border-gray-300 bg-gray-50 flex items-center justify-center font-russo text-gray-400 text-xs select-none">
                                  {rowIndex + 1}
                                </div>
                                {/* 7 Day Cells */}
                                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day, dayIndex) => {
                                  const dayData = weeklyTracker[day] || {};
                                  const rowKey = `row-${rowIndex}`;
                                  const cellData = dayData[rowKey]?.[0] || { color: '', text: '' };
                                  
                                  return (
                                    <div 
                                      key={day}
                                      className={`flex-1 border-r border-gray-200 last:border-r-0 relative transition-colors ${cellData.color} ${dayIndex >= 5 ? 'bg-gray-50/30' : ''}`}
                                    >
                                      <textarea 
                                        value={cellData.text}
                                        onChange={(e) => updateWeeklyTrackerText(day, rowIndex, 0, e.target.value)}
                                        onDoubleClick={() => updateWeeklyTrackerColor(day, rowIndex, 0)}
                                        className="w-full h-full bg-transparent text-center font-pen text-sm outline-none p-1 text-gray-800 placeholder-gray-400/50 resize-none leading-tight"
                                        placeholder=""
                                        style={{ minHeight: '100%' }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                         </div>
                       </>
                     ) : (
                       <>
                         <div className="flex flex-col mb-2">
                            <h3 className="font-russo text-xl uppercase tracking-wide mb-2">TIME BOX</h3>
                            <div className="flex gap-0 w-full">
                                 {/* Updated Widths: Plan 42%, Time 12w (fixed), Do (Rest) */}
                                 <div className="w-[42%] text-center font-bold text-xs text-gray-500 uppercase border-b border-gray-300 bg-gray-50/50 py-1">Plan</div>
                                 <div className="w-12 text-center font-bold text-xs text-gray-500 uppercase border-b border-gray-300 py-1">Time</div>
                                 <div className="flex-grow text-center font-bold text-xs text-gray-500 uppercase border-b border-gray-300 bg-gray-50/50 py-1">Do</div>
                            </div>
                         </div>
                         
                         <div 
                            ref={scheduleContainerRef}
                            className="flex-grow border-[3px] border-black bg-white overflow-y-auto"
                         >
                            {TIME_SLOTS.map((time, index) => {
                                 const block = getBlockForSlot(time);
                                 const covered = isSlotCovered(time);
                                 const isHour = time.endsWith(':00');
                                 
                                 return (
                                    <TimeSlot 
                                        key={time}
                                        time={time}
                                        block={block}
                                        isCovered={covered}
                                        isHour={isHour}
                                        onClick={() => openBlockModal(time)}
                                        onDelete={removeBlock}
                                        onEdit={(b) => openBlockModal(time, b)}
                                        manualPlanText={manualPlans[time] || ''}
                                        onChangeManualPlan={(text) => updateManualPlan(time, text)}
                                        trackerData={tracker[time]}
                                        onTrackerDoubleColor={(cellIndex) => updateTrackerColor(time, cellIndex)}
                                        onTrackerTextChange={(cellIndex, text) => updateTrackerText(time, cellIndex, text)}
                                    />
                                 );
                            })}
                         </div>
                       </>
                     )}
                </div>

            </div>
            
            {/* Footer Watermark - Included in Print/Download */}
            <div className="mt-8 pt-4 flex justify-center items-center gap-4 opacity-100 border-t-2 border-gray-800 text-center">
                 <p className="text-sm text-black font-russo tracking-[0.3em] uppercase">TRAIN HARD • FIGHT EASY</p>
            </div>
        </div>
        
        {/* Spacer for bottom of page scroll */}
        <div className="h-20"></div>
      </div>

      {/* --- Locker Room (History) --- */}
      {historyOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setHistoryOpen(false)} />
            <div className="relative w-full max-w-sm bg-[#111] h-full shadow-2xl p-6 overflow-y-auto border-l-4 border-red-600 text-gray-100">
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                    <h2 className="text-2xl font-russo uppercase text-white">Locker Room</h2>
                    <button onClick={() => setHistoryOpen(false)}><X className="w-6 h-6 hover:text-red-500 transition-colors" /></button>
                </div>
                
                {savedPlans.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10 font-mono">NO RECORDS FOUND for {fighterName}</div>
                ) : (
                    <div className="space-y-4">
                        {savedPlans.map(plan => (
                            <div 
                                key={plan.id} 
                                onClick={() => loadPlan(plan)}
                                className="bg-[#1a1a1a] border border-gray-800 p-4 hover:border-red-600 cursor-pointer shadow-lg transition-all group relative overflow-hidden rounded-sm"
                            >
                                <div className="absolute top-0 right-0 w-1 h-full bg-red-600 transform translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
                                <div className="font-bold text-lg mb-1 flex items-center justify-between font-mono text-gray-200">
                                  <span>{new Date(plan.date).toLocaleDateString()}</span>
                                  {plan.priorities[0] && <Trophy className="w-3 h-3 text-yellow-500" />}
                                </div>
                                <div className="text-xs text-gray-400 line-clamp-2 font-mono mb-3 pt-2">
                                    {plan.priorities.filter(Boolean).join(' / ') || "TRAINING DAY"}
                                </div>
                                <div className="text-[10px] font-bold bg-black text-white px-2 py-1 inline-block uppercase tracking-wider group-hover:text-red-500 transition-colors border border-gray-800 group-hover:border-red-900">
                                    LOAD CARD
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}
      
      {/* --- Block Creation/Edit Modal (New Round) --- */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBlockModalOpen(false)} />
             <div className="relative bg-[#1a1a1a] border-2 border-white p-6 max-w-sm w-full shadow-2xl animate-[fadeIn_0.2s_ease-out] rounded-sm text-white">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-russo uppercase tracking-wider flex items-center gap-2">
                         {editingBlockId ? <Pencil className="w-5 h-5 text-yellow-500" /> : <Target className="w-5 h-5 text-red-500" />}
                         {editingBlockId ? "EDIT ROUND" : "NEW ROUND"}
                     </h3>
                     <button onClick={() => setIsBlockModalOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                 </div>
                 
                 <div className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1 uppercase">Objective</label>
                        <input 
                            type="text" 
                            value={newBlockTitle}
                            onChange={(e) => setNewBlockTitle(e.target.value)}
                            className="w-full bg-gray-800 border-b-2 border-gray-600 focus:border-red-500 outline-none p-2 text-lg font-pen tracking-wide"
                            placeholder="e.g. Deep Work"
                            autoFocus
                        />
                    </div>

                    {/* Duration / Merging */}
                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-2 uppercase flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Duration (Merge Slots)
                        </label>
                        <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-sm">
                            <input 
                                type="range" 
                                min="30" 
                                max="240" 
                                step="30" 
                                value={newBlockDuration} 
                                onChange={(e) => setNewBlockDuration(parseInt(e.target.value))}
                                className="w-full accent-red-600 cursor-pointer"
                            />
                            <span className="font-mono text-red-400 w-16 text-right whitespace-nowrap">{newBlockDuration} min</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">
                            Start: {currentBlockStart} • Ends: {(() => {
                                if(!currentBlockStart) return '';
                                const [h, m] = currentBlockStart.split(':').map(Number);
                                const totalMins = h * 60 + m + newBlockDuration;
                                const endH = Math.floor(totalMins / 60);
                                const endM = totalMins % 60;
                                return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                            })()}
                        </p>
                    </div>

                    {/* Color / Category */}
                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-2 uppercase flex items-center gap-2">
                            <Palette className="w-3 h-3" /> Category Color
                        </label>
                        <div className="flex gap-2 justify-between">
                            {Object.entries(CATEGORY_COLORS).map(([key, twClass]) => {
                                const bgColorClass = twClass.split(' ')[0]; // Extract bg-color
                                return (
                                    <button 
                                        key={key}
                                        onClick={() => setNewBlockColor(key)}
                                        className={`w-10 h-10 rounded-full border-2 transition-transform ${newBlockColor === key ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                                    >
                                        <div className={`w-full h-full rounded-full ${bgColorClass}`}></div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="text-center text-xs font-mono mt-1 text-gray-500 uppercase tracking-widest">{newBlockColor}</div>
                    </div>

                    {/* Action */}
                    <button 
                        onClick={handleSaveBlock}
                        disabled={!newBlockTitle.trim()}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-russo uppercase tracking-wider transition-all active:scale-95 shadow-lg mt-2"
                    >
                        {editingBlockId ? "Update Round" : "Create Block"}
                    </button>
                 </div>
             </div>
        </div>
      )}

      {/* --- Reset Confirmation Modal --- */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
             <div className="relative bg-[#1a1a1a] border-2 border-red-600 p-6 max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center animate-[fadeIn_0.2s_ease-out]">
                 <div className="flex justify-center mb-4 text-red-500">
                     <AlertTriangle className="w-12 h-12" />
                 </div>
                 <h3 className="text-2xl font-russo text-white mb-2 tracking-wide">THROW IN THE TOWEL?</h3>
                 <p className="text-gray-400 mb-8 font-mono text-sm leading-relaxed">
                    This will clear your current fight card and erase all data on the screen.
                 </p>
                 <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-russo uppercase tracking-wider transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmClearAll}
                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-russo uppercase tracking-wider transition-colors shadow-lg"
                    >
                        Reset
                    </button>
                 </div>
             </div>
        </div>
      )}
      
      {/* --- Logout Confirmation Modal --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
             <div className="relative bg-[#1a1a1a] border-2 border-red-600 p-6 max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center animate-[fadeIn_0.2s_ease-out]">
                 <div className="flex justify-center mb-4 text-gray-400">
                     <LogOut className="w-12 h-12" />
                 </div>
                 <h3 className="text-2xl font-russo text-white mb-2 tracking-wide">LEAVING THE GYM?</h3>
                 <p className="text-gray-400 mb-8 font-mono text-sm leading-relaxed">
                    You are signing out. Make sure you saved your fight card to the Locker Room!
                 </p>
                 <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-russo uppercase tracking-wider transition-colors"
                    >
                        Stay
                    </button>
                    <button 
                        onClick={performLogout}
                        className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-russo uppercase tracking-wider transition-colors shadow-lg"
                    >
                        Leave
                    </button>
                 </div>
             </div>
        </div>
      )}

    </div>
  );
};

export default App;