-- Add phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for phone column (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles USING btree (phone);

-- Update RLS policies to include phone column (if needed)
-- The existing policies should automatically cover the new column

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone IS 'Optional phone number for user profile';
