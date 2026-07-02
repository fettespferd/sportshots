-- Tabellen, die bisher nur manuell im Supabase-Dashboard des alten Cloud-Projekts
-- existierten und in keiner Migration erfasst waren (rekonstruiert aus der Code-Nutzung).
-- Siehe SELF-HOSTING-PLAN.md Abschnitt 2.

-- ============================================
-- Portfolio-Galerie für Fotografen-Profile
-- ============================================
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gallery images are viewable by everyone"
  ON gallery_images FOR SELECT USING (true);

CREATE POLICY "Photographers manage own gallery images"
  ON gallery_images FOR ALL
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

CREATE INDEX IF NOT EXISTS idx_gallery_images_photographer
  ON gallery_images(photographer_id, display_order);

-- ============================================
-- Team-Einladungen
-- ============================================
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners manage own invitations"
  ON team_invitations FOR ALL
  USING (auth.uid() = team_id)
  WITH CHECK (auth.uid() = team_id);

CREATE POLICY "Invited users see and answer their invitations"
  ON team_invitations FOR SELECT
  USING (invited_email = (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Invited users update their invitations"
  ON team_invitations FOR UPDATE
  USING (invited_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- ============================================
-- Leads (Admin-Outreach) + Notizen + E-Mail-Log + Templates
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  instagram TEXT,
  website TEXT,
  location TEXT,
  business_type TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  template_name TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_by UUID REFERENCES profiles(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Nur Admins (Lead-Verwaltung ist ein reines Admin-Feature)
CREATE POLICY "Admins manage leads" ON leads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage lead notes" ON lead_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage lead emails" ON lead_emails FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage email templates" ON email_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- Rechtliche Zustimmung (AGB & Datenschutz), siehe LEGAL-CONSENT-GUIDE.md
-- ============================================
CREATE TABLE IF NOT EXISTS legal_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('agb', 'datenschutz')),
  version TEXT NOT NULL,
  content_hash TEXT,
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_type, version)
);

CREATE TABLE IF NOT EXISTS user_legal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('agb', 'datenschutz')),
  version TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE legal_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_legal_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal versions are viewable by everyone"
  ON legal_document_versions FOR SELECT USING (true);

CREATE POLICY "Users insert own consents"
  ON user_legal_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own consents"
  ON user_legal_consents FOR SELECT
  USING (auth.uid() = user_id);

-- Hilfsfunktionen aus dem LEGAL-CONSENT-GUIDE
CREATE OR REPLACE FUNCTION get_latest_legal_version(doc_type TEXT)
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT version FROM legal_document_versions
  WHERE document_type = doc_type
  ORDER BY effective_date DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION user_has_latest_consent(check_user_id UUID, doc_type TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_legal_consents
    WHERE user_id = check_user_id
      AND document_type = doc_type
      AND version = get_latest_legal_version(doc_type)
  );
$$;

-- Aktuelle Versionen (müssen mit AGB_VERSION / DATENSCHUTZ_VERSION im Frontend übereinstimmen)
INSERT INTO legal_document_versions (document_type, version, effective_date)
VALUES
  ('agb', '1.0', '2025-01-26 00:00:00+00'),
  ('datenschutz', '1.0', '2025-01-26 00:00:00+00')
ON CONFLICT (document_type, version) DO NOTHING;
