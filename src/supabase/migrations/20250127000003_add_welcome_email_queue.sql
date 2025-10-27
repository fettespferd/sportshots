-- Migration: Add email queue for welcome emails

-- Create email queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies (only admins can view/manage)
CREATE POLICY "Admins can view email queue"
  ON public.email_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Update the handle_new_user trigger to add welcome email to queue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path = public;

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    account_type,
    role,
    photographer_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual'),
    'photographer'::public.user_role,
    'approved'::public.photographer_status
  );

  -- Add welcome email to queue
  INSERT INTO public.email_queue (
    user_id,
    email_type,
    recipient_email,
    subject,
    template_data
  )
  VALUES (
    NEW.id,
    'welcome',
    NEW.email,
    '🎉 Willkommen bei SportShots!',
    jsonb_build_object(
      'userName', COALESCE(NEW.raw_user_meta_data->>'full_name', 'Fotograf'),
      'username', COALESCE(NEW.raw_user_meta_data->>'username', ''),
      'accountType', COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual')
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.email_queue IS 'Queue for emails to be sent asynchronously';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile and queues welcome email for new users';

