-- =============================================
-- TIME FIGHTER - Supabase Database Schema
-- =============================================
-- Run this SQL in your Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)
-- =============================================

-- 1. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  fighter_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create day_plans table
CREATE TABLE IF NOT EXISTS public.day_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  priorities JSONB DEFAULT '[]'::jsonb,
  brain_dump TEXT DEFAULT '',
  schedule JSONB DEFAULT '[]'::jsonb,
  tracker JSONB DEFAULT '{}'::jsonb,
  manual_plans JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create weekly_plans table
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start TEXT NOT NULL,
  priorities JSONB DEFAULT '[]'::jsonb,
  brain_dump TEXT DEFAULT '',
  tracker JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_day_plans_user_id ON public.day_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_day_plans_date ON public.day_plans(date);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id ON public.weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_week_start ON public.weekly_plans(week_start);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Day Plans: Users can only access their own plans
CREATE POLICY "Users can view own day plans" 
  ON public.day_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own day plans" 
  ON public.day_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own day plans" 
  ON public.day_plans FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own day plans" 
  ON public.day_plans FOR DELETE 
  USING (auth.uid() = user_id);

-- Weekly Plans: Users can only access their own plans
CREATE POLICY "Users can view own weekly plans" 
  ON public.weekly_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly plans" 
  ON public.weekly_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly plans" 
  ON public.weekly_plans FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly plans" 
  ON public.weekly_plans FOR DELETE 
  USING (auth.uid() = user_id);

-- 7. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_day_plans
  BEFORE UPDATE ON public.day_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_weekly_plans
  BEFORE UPDATE ON public.weekly_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, fighter_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'fighter_name', 'Fighter'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for auto-creating profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- DONE! Your database is ready.
-- =============================================

