
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  trust_score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_contribution NUMERIC NOT NULL,
  cycle_length INTEGER NOT NULL,
  payout_day INTEGER,
  payout_schedule_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trust_score INTEGER NOT NULL DEFAULT 100,
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Contributions table
CREATE TABLE public.contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_month INTEGER NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'missed')),
  paid_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Payout schedule table
CREATE TABLE public.payout_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_month INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'current', 'completed')),
  UNIQUE(group_id, payout_month)
);

ALTER TABLE public.payout_schedule ENABLE ROW LEVEL SECURITY;

-- Payout history table
CREATE TABLE public.payout_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_month INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_history ENABLE ROW LEVEL SECURITY;

-- Security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Security definer function to check group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND admin_id = _user_id
  )
$$;

-- RLS for groups: admins and members can view
CREATE POLICY "Users can view groups they belong to" ON public.groups FOR SELECT TO authenticated
  USING (admin_id = auth.uid() OR public.is_group_member(auth.uid(), id));
CREATE POLICY "Admins can insert groups" ON public.groups FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid());
CREATE POLICY "Admins can update their groups" ON public.groups FOR UPDATE TO authenticated
  USING (admin_id = auth.uid());
CREATE POLICY "Admins can delete their groups" ON public.groups FOR DELETE TO authenticated
  USING (admin_id = auth.uid());

-- RLS for group_members
CREATE POLICY "Members can view group members" ON public.group_members FOR SELECT TO authenticated
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Admins can add members" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Admins can remove members" ON public.group_members FOR DELETE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id));

-- RLS for contributions
CREATE POLICY "Members can view contributions" ON public.contributions FOR SELECT TO authenticated
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Admins can insert contributions" ON public.contributions FOR INSERT TO authenticated
  WITH CHECK (public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Admins can update contributions" ON public.contributions FOR UPDATE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id));

-- RLS for payout_schedule
CREATE POLICY "Members can view payout schedule" ON public.payout_schedule FOR SELECT TO authenticated
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Admins can insert payout schedule" ON public.payout_schedule FOR INSERT TO authenticated
  WITH CHECK (public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Admins can update payout schedule" ON public.payout_schedule FOR UPDATE TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id));

-- RLS for payout_history
CREATE POLICY "Members can view payout history" ON public.payout_history FOR SELECT TO authenticated
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));
CREATE POLICY "Admins can insert payout history" ON public.payout_history FOR INSERT TO authenticated
  WITH CHECK (public.is_group_admin(auth.uid(), group_id));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
