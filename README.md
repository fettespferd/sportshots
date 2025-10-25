# SportShots - Plattform für Sportfotografen & Athleten

Eine Multi-Rollen-Plattform, auf der Fotografen Sportevents erstellen, Fotos hochladen und verkaufen können. Athleten können ihre Fotos über Startnummer-Suche oder Event-Filter finden und kaufen.

## 🎯 Features

### Für Athleten
- **Event-Suche**: Finde Events nach Datum, Ort oder Name
- **Startnummer-Filterung**: Filtere Fotos nach deiner Startnummer
- **Gesichtserkennung**: Lade ein Selfie hoch und finde automatisch deine Fotos
- **Wasserzeichen-Vorschau**: Sieh dir Fotos mit Wasserzeichen an, bevor du kaufst
- **Foto-Kauf**: Kaufe einzelne Fotos via Stripe Checkout
- **Bestellverwaltung**: Überblick über alle gekauften Fotos mit Download-Links

### Für Fotografen
- **Event-Management**: Erstelle und verwalte deine Events
- **Foto-Upload**: Lade Fotos hoch mit automatischer Wasserzeichen-Generierung
- **Automatische OCR**: Startnummern werden automatisch erkannt
- **Verkaufsstatistiken**: Dashboard mit Umsatz und Verkaufszahlen
- **Analytics Dashboard**: Detaillierte Charts und Verkaufs-Insights
- **Stripe Connect**: Verknüpfe dein Bankkonto für automatische Auszahlungen
- **E-Mail-Benachrichtigungen**: Erhalte Benachrichtigungen bei Verkäufen
- **Flexible Preisgestaltung**: Einzelpreise und Paketangebote

### Für Admins
- **Fotografen-Freischaltung**: Review und Genehmigung von Fotografen-Anfragen
- **Plattform-Analytics**: Umfassende Übersicht über alle Aktivitäten
- **Umsatz-Übersicht**: Plattform-Einnahmen und Fotografen-Auszahlungen
- **Fotografen-Verwaltung**: Aktivieren/Sperren von Accounts
- **E-Mail-Benachrichtigungen**: Automatische E-Mails bei Freischaltungen

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (Auth, Database, Storage)
- **Payments**: Stripe Connect (vollständig integriert)
- **AI/ML**: AWS Rekognition (OCR & Gesichtserkennung)
- **Bildverarbeitung**: Sharp (Wasserzeichen-Generierung)
- **E-Mail**: Resend (E-Mail-Benachrichtigungen)
- **Analytics**: Recharts (Verkaufs-Charts)
- **i18n**: next-intl (Deutsch & Englisch)
- **TypeScript**: Vollständig typsicher

## 📋 Voraussetzungen

- Node.js 20+ und npm
- Supabase Account (kostenlos)
- Stripe Account (für Zahlungen & Fotografen-Auszahlungen)
- AWS Account (für OCR & Gesichtserkennung)
- Resend Account (für E-Mail-Benachrichtigungen)

## 🚀 Installation & Setup

### 1. Repository klonen

```bash
git clone <repository-url>
cd sportshots
npm install
```

### 2. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Warte, bis das Projekt fertig eingerichtet ist (ca. 2 Minuten)
3. Gehe zu **Settings** → **API**
4. Kopiere die `Project URL` und den `anon public` Key

### 3. Umgebungsvariablen einrichten

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_FEE_PERCENTAGE=15

# Stripe (Required)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS Rekognition (Required for OCR & Face Recognition)
# ⚠️ WICHTIG: Siehe AWS_SETUP.md für detaillierte Einrichtungsanleitung!
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1

# Resend (Required for email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 4. Datenbank-Migrationen ausführen

1. Öffne dein Supabase Projekt
2. Gehe zu **SQL Editor**
3. Erstelle ein neues Query
4. Kopiere den Inhalt von `src/supabase/migrations/20250101000000_initial_schema.sql`
5. Führe die Migration aus
6. Wiederhole für `src/supabase/migrations/20250101000001_storage_setup.sql`

### 5. Ersten Admin-User erstellen

Nach dem ersten Signup kannst du einen User zum Admin machen:

1. Gehe zu **Supabase Dashboard** → **Table Editor** → **profiles**
2. Finde deinen User und ändere:
   - `role` → `admin`
3. Speichern

### 6. Development Server starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## 📁 Projektstruktur

```
src/
├── app/
│   ├── (auth)/           # Auth-Seiten (Login, Signup)
│   ├── (dashboard)/      # Geschützte Dashboard-Seiten
│   │   ├── photographer/ # Fotografen-Dashboard
│   │   ├── admin/        # Admin-Dashboard
│   │   └── orders/       # User-Bestellungen
│   ├── (public)/         # Öffentliche Seiten
│   │   ├── event/        # Event-Galerie-Seiten
│   │   └── search/       # Event-Suche
│   └── api/              # API Routes
├── components/
│   ├── layout/           # Layout-Komponenten (Header, etc.)
│   ├── ui/               # Basis UI-Komponenten
│   └── ...               # Feature-spezifische Komponenten
├── lib/
│   ├── supabase/         # Supabase Client & Middleware
│   ├── stripe/           # Stripe Integration
│   └── utils/            # Helper-Funktionen
└── supabase/
    └── migrations/       # Datenbank-Migrationen
```

## 🔐 Benutzer-Rollen

### Athlete (Standard)
- Kann Events suchen und Fotos kaufen
- Zugriff auf Bestellverwaltung

### Photographer
- Muss sich als Fotograf registrieren und von Admin freischalten lassen
- Kann Events erstellen und Fotos hochladen
- Sieht Verkaufsstatistiken

### Admin
- Muss manuell in der Datenbank gesetzt werden
- Kann Fotografen freischalten/sperren
- Sieht Plattform-Umsätze

## 🗂️ Datenbank-Schema

### Haupttabellen
- `profiles` - Erweiterte User-Profile mit Rollen
- `photographer_requests` - Fotografen-Registrierungsanfragen
- `events` - Sportevents
- `photos` - Hochgeladene Fotos
- `purchases` - Käufe/Transaktionen
- `purchase_photos` - Verknüpfung Käufe ↔ Fotos

## 🚧 Roadmap / Status

### Phase 1: ✅ Foundation
- [x] Datenbank-Schema & Migrations
- [x] Auth-System (Signup, Login, Callback)
- [x] Role-based Route Protection

### Phase 2: ✅ Fotografen-Dashboard
- [x] Event-Management (CRUD)
- [x] Foto-Upload mit Supabase Storage
- [x] Event-Details & Statistiken

### Phase 3: ✅ Öffentliche Seiten
- [x] Landing Page
- [x] Event-Suche
- [x] Event-Galerie mit Startnummer-Filter
- [x] Foto-Auswahl (Warenkorb)

### Phase 4: ✅ Admin-Dashboard
- [x] Fotografen-Freischaltung
- [x] Umsatz-Übersicht

### Phase 5: ✅ Stripe Integration
- [x] Stripe Connect Onboarding für Fotografen
- [x] Checkout-Flow
- [x] Webhook-Handler
- [x] Plattform-Provision (15%)

### Phase 6: ✅ AWS Rekognition
- [x] OCR für automatische Startnummer-Erkennung
- [x] Gesichtserkennung mit Selfie-Upload

### Phase 7: ✅ Erweiterte Features
- [x] Wasserzeichen-Generierung (Sharp)
- [x] E-Mail-Benachrichtigungen (Resend)
- [x] Analytics Dashboard (Recharts)
- [x] Mehrsprachigkeit (next-intl: Deutsch & Englisch)

### Phase 8: 🔜 Zukünftige Features
- [ ] Event-Branding & Custom Domains
- [ ] Mobile App (React Native)
- [ ] Social Sharing
- [ ] Event-Kalender-Integration
- [ ] Automatische Foto-Tagging mit AI

## 🤝 Entwicklung

```bash
# Development Server
npm run dev

# Build für Production
npm run build

# Production Server starten
npm start

# Linting
npm run lint
```

## 📝 Lizenz

Dieses Projekt ist privat und nicht für die Öffentlichkeit bestimmt.
