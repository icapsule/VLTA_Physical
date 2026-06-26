-- Add share_token to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS share_token UUID NOT NULL DEFAULT gen_random_uuid();

-- Add UNIQUE constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_share_token_key UNIQUE (share_token);

-- We do not add explicit RLS policies for anonymous access here.
-- Instead, we will use the Service Role key in the Next.js server component to fetch by share_token,
-- preserving tight security on the DB level.
