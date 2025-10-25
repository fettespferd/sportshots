-- Migration: Auto-register all new users as photographers (pending approval)
-- This changes the signup flow so every new user is a photographer by default

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function that sets all new users as photographers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, photographer_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'photographer'::user_role,
    'pending'::photographer_status
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create automatic photographer_request entry for new users
CREATE OR REPLACE FUNCTION public.handle_new_photographer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create request if it's a photographer role
  IF NEW.role = 'photographer' THEN
    INSERT INTO public.photographer_requests (
      user_id,
      full_name,
      email,
      portfolio_link,
      message,
      status
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.full_name, ''),
      NEW.email,
      NEW.portfolio_link,
      'Automatische Registrierung als Fotograf',
      'pending'::photographer_status
    )
    ON CONFLICT DO NOTHING; -- In case it already exists
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create photographer request
CREATE TRIGGER on_photographer_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'photographer')
  EXECUTE FUNCTION public.handle_new_photographer();

-- Comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a photographer profile (pending approval) for all new users';
COMMENT ON FUNCTION public.handle_new_photographer() IS 'Automatically creates a photographer_request entry for new photographer profiles';

