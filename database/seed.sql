-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Links to auth.users.id
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'resident' CHECK (role IN ('resident', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    priority TEXT DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High')),
    is_overdue BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- 3. Create Complaint History Table
CREATE TABLE IF NOT EXISTS public.complaint_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    old_status TEXT CHECK (old_status IN ('Open', 'In Progress', 'Resolved', NULL)),
    new_status TEXT NOT NULL CHECK (new_status IN ('Open', 'In Progress', 'Resolved')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on complaint_history
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;

-- 4. Create Notices Table
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 5. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overdue_threshold_days INTEGER DEFAULT 7 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 6. Trigger to automatically create profiles for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'resident',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Insert default system settings
INSERT INTO public.system_settings (id, overdue_threshold_days, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000001', 7, now())
ON CONFLICT (id) DO NOTHING;

-- Define basic RLS Policies for Supabase (if database accessed directly from frontend client)
-- Since our backend validates JWTs and handles its own auth database sessions, we can allow postgres role to bypass,
-- and set policy for Authenticated users.
DROP POLICY IF EXISTS "Enable read access for all profiles" ON public.profiles;
CREATE POLICY "Enable read access for all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable update for users on their own profiles" ON public.profiles;
CREATE POLICY "Enable update for users on their own profiles" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable select for residents on their own complaints" ON public.complaints;
CREATE POLICY "Enable select for residents on their own complaints" ON public.complaints
    FOR SELECT TO authenticated USING (
        auth.uid() = resident_id OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Enable select for notices" ON public.notices;
CREATE POLICY "Enable select for notices" ON public.notices
    FOR SELECT TO authenticated USING (true);
