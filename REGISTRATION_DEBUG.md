# 🔍 Registrierungs-Problem beheben

## Was ist bereits implementiert? ✅

### Athlet-Registrierung (`/signup`)
- User registriert sich mit Email + Passwort
- Profil wird automatisch erstellt (Trigger in Supabase)
- Role: `athlete` (Standard)
- **Kann sofort Fotos kaufen**

### Fotografen-Registrierung (`/signup/photographer`)
- User registriert sich mit Email + Passwort
- Zusätzlich: Portfolio-Link, Nachricht an Admin
- Erstellt `photographer_requests` Eintrag mit Status: `pending`
- **Fotograf muss von Admin genehmigt werden!** ⚠️
- Nach Genehmigung: Role wird auf `photographer` gesetzt, Status auf `approved`

## Warum funktioniert es in Production nicht?

### Mögliche Ursachen:

#### 1️⃣ **Supabase Email Confirmation ist aktiviert**

**Problem:** Supabase sendet eine Bestätigungs-Email, aber User können sich nicht einloggen bis sie bestätigt haben.

**Lösung:** Gehe zu Supabase Dashboard:
1. **Settings** → **Authentication** → **Email Auth**
2. Suche nach: **"Enable email confirmations"**
3. **Deaktiviere** diese Option (für schnelleres Testing)
4. Oder: Stelle sicher dass Email-Templates korrekt konfiguriert sind

#### 2️⃣ **Environment Variables fehlen**

**Problem:** `NEXT_PUBLIC_SUPABASE_URL` oder `NEXT_PUBLIC_SUPABASE_ANON_KEY` sind falsch in Vercel.

**Lösung:** Vercel Dashboard → Dein Projekt → Settings → Environment Variables
- Prüfe ob alle Supabase Keys korrekt sind
- **Production** Environment muss gesetzt sein!

#### 3️⃣ **Supabase RLS Policies blockieren Insert**

**Problem:** Row Level Security blockiert das Erstellen von Profilen oder `photographer_requests`.

**Lösung:** Supabase Dashboard → Table Editor → `photographer_requests`
- Prüfe ob es eine **INSERT Policy** gibt
- Sollte authenticated users erlauben, ihre eigenen Requests zu erstellen

## Debugging in Production 🔧

### 1. Öffne Browser Console (F12)
Gehe zu `https://sportshots.brainmotion.ai/signup` und versuche dich zu registrieren.

**Console Logs zeigen dir:**
```
Starting signup process... { email: "..." }
Signup response: { data: {...}, error: null }
User created successfully: abc-123-...
```

**Fehler werden auch angezeigt:**
```
Signup error: { message: "Email rate limit exceeded", ... }
```

### 2. Häufige Fehler-Meldungen

| Fehler | Bedeutung | Lösung |
|--------|-----------|--------|
| `Email rate limit exceeded` | Zu viele Registrierungen von gleicher IP | 1 Stunde warten, oder Supabase Rate Limit erhöhen |
| `User already registered` | Email existiert bereits | Anderen Email verwenden oder User in Supabase löschen |
| `Invalid email` | Email-Format falsch | Gültigen Email verwenden |
| `Password too short` | Passwort < 6 Zeichen | Längeres Passwort verwenden |
| `Email not confirmed` | Email-Bestätigung aktiviert | Email bestätigen oder in Supabase deaktivieren |

### 3. Supabase Logs checken

Gehe zu: **Supabase Dashboard** → **Logs** → **Auth Logs**
- Siehst du erfolgreiche `signup` Events?
- Gibt es `error` Events?

## Fotografen-Genehmigung Workflow 👨‍💼

### 1. Fotograf registriert sich
- Geht zu `/signup/photographer`
- Gibt Email, Passwort, Name, Portfolio-Link ein
- Klickt "Registrieren"

### 2. Status: Pending ⏳
- Eintrag in `photographer_requests` mit `status: pending`
- User kann sich einloggen, aber **keine Events erstellen**!
- Header zeigt: Nur "Suchen" und "Bestellungen"

### 3. Admin genehmigt 👍
- Admin geht zu `/admin/photographers`
- Sieht alle pending requests
- Klickt "Genehmigen"
- API Route: `/api/admin/approve-photographer`
  - Setzt `photographer_status: approved` in `profiles`
  - Setzt `role: photographer` in `profiles`
  - Aktualisiert `photographer_requests.status: approved`

### 4. Fotograf kann jetzt arbeiten ✅
- Header zeigt: "Meine Events", "Verkäufe", "Analytics"
- Kann Events erstellen, Fotos hochladen, Verkäufe sehen

## Testing Checklist ✅

- [ ] Athlet kann sich registrieren
- [ ] Athlet erhält Bestätigungs-Email (wenn aktiviert)
- [ ] Athlet kann sich einloggen
- [ ] Fotograf kann sich registrieren
- [ ] Fotografen-Request wird in DB erstellt
- [ ] Admin sieht pending requests in `/admin/photographers`
- [ ] Admin kann Fotografen genehmigen
- [ ] Genehmigter Fotograf sieht Fotograden-Navigation
- [ ] Genehmigter Fotograf kann Event erstellen

## Nächste Schritte 🚀

1. **Teste die Registrierung in Production mit Browser Console offen**
2. **Schau dir die Fehler-Meldungen an**
3. **Prüfe Supabase Email Confirmation Settings**
4. **Prüfe Vercel Environment Variables**
5. **Teile mir die Fehler-Meldungen mit, damit ich helfen kann!**

