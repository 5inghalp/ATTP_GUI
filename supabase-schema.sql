-- Supabase Database Schema for Restore My Health
-- Run this in your Supabase SQL Editor to set up the database

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  sex TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health data tables
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  question_count INTEGER DEFAULT 0,
  is_summary_mode BOOLEAN DEFAULT FALSE,
  has_red_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  reasoning JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  why TEXT,
  urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent')),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.health_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('sleep', 'energy', 'digestion', 'pain', 'mood', 'other')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own medications" ON public.medications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own conditions" ON public.conditions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own allergies" ON public.allergies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own messages" ON public.messages FOR ALL USING (
  session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own action items" ON public.action_items FOR ALL USING (
  session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own insights" ON public.health_insights FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
