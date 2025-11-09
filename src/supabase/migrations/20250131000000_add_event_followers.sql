-- Create event_followers table
CREATE TABLE IF NOT EXISTS event_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- Create index on event_id for fast queries
CREATE INDEX IF NOT EXISTS idx_event_followers_event_id ON event_followers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_followers_email ON event_followers(email);

-- RLS Policies
ALTER TABLE event_followers ENABLE ROW LEVEL SECURITY;

-- Anyone can follow an event (public insert)
CREATE POLICY "Anyone can follow events"
ON event_followers
FOR INSERT
TO public
WITH CHECK (true);

-- Users can see their own follows
CREATE POLICY "Users can view their own follows"
ON event_followers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- Public can view follows (for checking if already following)
CREATE POLICY "Public can check if following"
ON event_followers
FOR SELECT
TO public
USING (true);

-- Users can delete their own follows
CREATE POLICY "Users can unfollow events"
ON event_followers
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- Allow unfollowing via email token (handled by API with service role)
-- No additional policy needed as API will use service role

