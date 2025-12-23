ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_sender_id UUID REFERENCES public.profiles(id);
