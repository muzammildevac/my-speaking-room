-- ==============================================================================
-- My Speaking Room – Supabase PostgreSQL Schema & Security Rules
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  native_language TEXT NOT NULL DEFAULT 'English',
  learning_language TEXT NOT NULL DEFAULT 'Spanish',
  proficiency_level TEXT NOT NULL DEFAULT 'B1 - Intermediate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create ROOMS table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  proficiency_level TEXT NOT NULL DEFAULT 'Any Level',
  topic TEXT NOT NULL DEFAULT 'General Conversation',
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_participants INT NOT NULL DEFAULT 6 CHECK (max_participants >= 2 AND max_participants <= 12),
  participant_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closing', 'closed')),
  closing_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create ROOM_PARTICIPANTS table
CREATE TABLE IF NOT EXISTS public.room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT unique_room_user UNIQUE(room_id, user_id)
);

-- 5. Indexes for fast query and real-time lookup
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_language ON public.rooms(language);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON public.rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_room_active ON public.room_participants(room_id, is_active);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.room_participants(user_id);

-- 6. Trigger to automatically create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, native_language, learning_language, proficiency_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'English',
    'Spanish',
    'B1 - Intermediate'
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RPC: Join Room (Atomic participant count and validation)
CREATE OR REPLACE FUNCTION public.join_room(p_room_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_room RECORD;
  v_active_count INT;
  v_is_host BOOLEAN;
BEGIN
  -- Check if room exists and is not closed
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Room does not exist');
  END IF;

  IF v_room.status = 'closed' THEN
    RETURN json_build_object('success', false, 'error', 'This room is closed');
  END IF;

  -- Count current active participants
  SELECT COUNT(*) INTO v_active_count 
  FROM public.room_participants 
  WHERE room_id = p_room_id AND is_active = true;

  -- Check capacity
  IF v_active_count >= v_room.max_participants THEN
    -- Check if this user is already one of the active participants
    IF NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = p_room_id AND user_id = p_user_id AND is_active = true) THEN
      RETURN json_build_object('success', false, 'error', 'Room is already full');
    END IF;
  END IF;

  v_is_host := (v_room.host_id = p_user_id);

  -- Upsert participant record
  INSERT INTO public.room_participants (room_id, user_id, is_host, is_active, joined_at, last_seen_at, left_at)
  VALUES (p_room_id, p_user_id, v_is_host, true, now(), now(), NULL)
  ON CONFLICT (room_id, user_id) 
  DO UPDATE SET
    is_active = true,
    last_seen_at = now(),
    left_at = NULL;

  -- Recount and update room status back to active (cancels grace period if closing)
  SELECT COUNT(*) INTO v_active_count 
  FROM public.room_participants 
  WHERE room_id = p_room_id AND is_active = true;

  UPDATE public.rooms
  SET participant_count = v_active_count,
      status = 'active',
      closing_at = NULL,
      updated_at = now()
  WHERE id = p_room_id;

  RETURN json_build_object('success', true, 'room_id', p_room_id, 'is_host', v_is_host);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Leave Room (Handles 60-second grace period when empty)
CREATE OR REPLACE FUNCTION public.leave_room(p_room_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_active_count INT;
BEGIN
  -- Mark participant as inactive
  UPDATE public.room_participants
  SET is_active = false,
      left_at = now()
  WHERE room_id = p_room_id AND user_id = p_user_id;

  -- Count remaining active participants
  SELECT COUNT(*) INTO v_active_count 
  FROM public.room_participants 
  WHERE room_id = p_room_id AND is_active = true;

  IF v_active_count <= 0 THEN
    -- Room is now empty -> Enter 'closing' state with 60-second grace period
    UPDATE public.rooms
    SET participant_count = 0,
        status = 'closing',
        closing_at = now() + INTERVAL '60 seconds',
        updated_at = now()
    WHERE id = p_room_id;
  ELSE
    UPDATE public.rooms
    SET participant_count = v_active_count,
        updated_at = now()
    WHERE id = p_room_id;
  END IF;

  RETURN json_build_object('success', true, 'remaining_count', v_active_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: Kick Participant (Host only)
CREATE OR REPLACE FUNCTION public.kick_participant(p_room_id UUID, p_host_id UUID, p_target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_room RECORD;
  v_active_count INT;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF v_room.host_id != p_host_id THEN
    RETURN json_build_object('success', false, 'error', 'Only the room host can remove participants');
  END IF;

  -- Remove target participant
  UPDATE public.room_participants
  SET is_active = false,
      left_at = now()
  WHERE room_id = p_room_id AND user_id = p_target_user_id;

  -- Recalculate participant count
  SELECT COUNT(*) INTO v_active_count 
  FROM public.room_participants 
  WHERE room_id = p_room_id AND is_active = true;

  UPDATE public.rooms
  SET participant_count = v_active_count,
      updated_at = now()
  WHERE id = p_room_id;

  RETURN json_build_object('success', true, 'remaining_count', v_active_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RPC: Close Room (Host only)
CREATE OR REPLACE FUNCTION public.close_room(p_room_id UUID, p_host_id UUID)
RETURNS JSON AS $$
DECLARE
  v_room RECORD;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF v_room.host_id != p_host_id THEN
    RETURN json_build_object('success', false, 'error', 'Only the room host can close the room');
  END IF;

  UPDATE public.rooms
  SET status = 'closed',
      closing_at = now(),
      participant_count = 0,
      updated_at = now()
  WHERE id = p_room_id;

  UPDATE public.room_participants
  SET is_active = false,
      left_at = now()
  WHERE room_id = p_room_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RPC: Purge Expired Closing Rooms (Grace Period Cleanup)
CREATE OR REPLACE FUNCTION public.purge_expired_rooms()
RETURNS INT AS $$
DECLARE
  v_deleted INT := 0;
BEGIN
  -- Permanently delete or mark closed rooms whose closing_at grace period has expired
  DELETE FROM public.rooms
  WHERE status = 'closing' AND closing_at <= now();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Rooms Policies
CREATE POLICY "Active rooms are viewable by everyone" 
  ON public.rooms FOR SELECT USING (status != 'closed');

CREATE POLICY "Authenticated users can create rooms" 
  ON public.rooms FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own rooms" 
  ON public.rooms FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own rooms" 
  ON public.rooms FOR DELETE USING (auth.uid() = host_id);

-- Room Participants Policies
CREATE POLICY "Room participants are viewable by everyone" 
  ON public.room_participants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join rooms" 
  ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation status" 
  ON public.room_participants FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (SELECT host_id FROM public.rooms WHERE id = room_id));

-- 13. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
