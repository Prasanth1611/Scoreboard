/*
# Fix handle_new_user trigger function

## Problem
The `handle_new_user()` SECURITY DEFINER function was failing with
"Database error saving new user" because it lacked an explicit `search_path`.
Without it, the function can't reliably resolve the `profiles` table reference,
causing the trigger to fail during signup.

## Fix
- Recreate the function with `SET search_path = public` and schema-qualified table reference
- This ensures the INSERT into `public.profiles` succeeds regardless of the caller's search_path
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$;