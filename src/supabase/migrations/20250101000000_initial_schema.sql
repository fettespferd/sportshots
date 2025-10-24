-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('athlete', 'photographer', 'admin');
CREATE TYPE photographer_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE event_type AS ENUM ('running', 'cycling', 'skiing', 'surfing', 'triathlon', 'other');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'athlete',
  photographer_status photographer_status,
  stripe_connect_id TEXT,
  portfolio_link TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Photographer requests table
CREATE TABLE photographer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  portfolio_link TEXT,
  message TEXT,
  status photographer_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  event_type event_type NOT NULL,
  location TEXT NOT NULL,
  event_date DATE NOT NULL,
  price_per_photo DECIMAL(10, 2) NOT NULL,
  package_price DECIMAL(10, 2),
  package_photo_count INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  watermark_url TEXT NOT NULL,
  thumbnail_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  bib_number TEXT,
  face_embedding VECTOR(512), -- For future face recognition
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  photographer_amount DECIMAL(10, 2) NOT NULL,
  photo_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Purchase photos junction table (for individual photo tracking)
CREATE TABLE purchase_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(purchase_id, photo_id)
);

-- Create indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_photographer_status ON profiles(photographer_status);
CREATE INDEX idx_photographer_requests_status ON photographer_requests(status);
CREATE INDEX idx_events_photographer_id ON events(photographer_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_published ON events(is_published);
CREATE INDEX idx_photos_event_id ON photos(event_id);
CREATE INDEX idx_photos_photographer_id ON photos(photographer_id);
CREATE INDEX idx_photos_bib_number ON photos(bib_number);
CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_purchases_photographer_id ON purchases(photographer_id);
CREATE INDEX idx_purchase_photos_purchase_id ON purchase_photos(purchase_id);
CREATE INDEX idx_purchase_photos_photo_id ON purchase_photos(photo_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for photographer_requests
CREATE POLICY "Users can view own requests"
  ON photographer_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
  ON photographer_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON photographer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update requests"
  ON photographer_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for events
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (is_published = true OR photographer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Photographers can create events"
  ON events FOR INSERT
  WITH CHECK (
    auth.uid() = photographer_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'photographer'
      AND profiles.photographer_status = 'approved'
    )
  );

CREATE POLICY "Photographers can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = photographer_id);

CREATE POLICY "Photographers can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = photographer_id);

-- RLS Policies for photos
CREATE POLICY "Watermark photos are viewable by everyone"
  ON photos FOR SELECT
  USING (true);

CREATE POLICY "Photographers can insert photos"
  ON photos FOR INSERT
  WITH CHECK (
    auth.uid() = photographer_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'photographer'
      AND profiles.photographer_status = 'approved'
    )
  );

CREATE POLICY "Photographers can update own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = photographer_id);

CREATE POLICY "Photographers can delete own photos"
  ON photos FOR DELETE
  USING (auth.uid() = photographer_id);

-- RLS Policies for purchases
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Photographers can view their sales"
  ON purchases FOR SELECT
  USING (auth.uid() = photographer_id);

CREATE POLICY "Admins can view all purchases"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for purchase_photos
CREATE POLICY "Users can view own purchase photos"
  ON purchase_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_photos.purchase_id
      AND purchases.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Photographers can view their sold photos"
  ON purchase_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_photos.purchase_id
      AND purchases.photographer_id = auth.uid()
    )
  );

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


