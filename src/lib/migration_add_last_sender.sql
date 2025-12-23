ALTER TABLE public.conversations ADD COLUMN last_sender_id UUID REFERENCES public.profiles(id);
