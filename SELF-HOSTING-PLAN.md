# Hosting: SportShots auf Hetzner via Coolify (Modell ImmoKompass)

**Stand:** 3. Juli 2026 — größtenteils umgesetzt, Rest-Schritte siehe Runbook (Abschnitt 3).

SportShots läuft wie ImmoKompass: **App + self-hosted Supabase als Coolify-Resources** auf dem Hetzner-Server (CPX42, `deploy.brainmotion.ai`). Referenzen: `ImmoKompass/docs/INFRASTRUKTUR-SELFSUPABASE.md`, `ImmoKompass/docs/dsgvo-stack-setup-guide.md`, `Brainmotion-Website/docs/COOLIFY_DEPLOYMENT.md`.

## 1. Was eingerichtet ist (As-Built)

| Komponente | Wert |
|---|---|
| Coolify-Projekt | **SportShots** → Environment `production` |
| App | `sportshots:main` — GitHub `fettespferd/sportshots@main`, Buildpack **Dockerfile**, Port 3000 |
| App-Domain | **https://sportshots.brainmotion.ai** (läuft, `/api/health` → 200) |
| Healthcheck | HTTP GET `localhost:3000/api/health` (aktiviert) |
| Memory-Limit | **3 GB** für den App-Container (Schutz vor ZIP-Download-Spitzen, siehe Abschnitt 4) |
| Auto-Deploy | Push auf `main` → GitHub-Webhook → Coolify-Build (funktioniert, ~1,5 min) |
| Supabase-Stack | Coolify-Service **sportshots-supabase** (Kong, GoTrue, PostgREST, Storage+MinIO, Studio, Realtime, Postgres 15.8) — Running (healthy) |
| Supabase-API-Domain | **https://sportshots-db.brainmotion.ai** (Kong, TLS aktiv) |
| App-Env-Variablen | 14 Variablen angelegt; URLs/Config gesetzt, **7 Secrets als `TODO_…`-Platzhalter** (siehe Runbook) |
| Build-Variablen | Alle `NEXT_PUBLIC_*` haben „Available at Buildtime" (Coolify-Default) ✅ |
| Code | `output: 'standalone'`, Dockerfile, `/api/health`, Supabase-Host aus Env ([next.config.ts](next.config.ts)) |
| Migrationen | 18 bestehende + **`20260703000000_add_missing_tables.sql`** (rekonstruiert die 8 Tabellen, die nur im alten Cloud-Dashboard angelegt waren: `leads`, `lead_notes`, `lead_emails`, `email_templates`, `gallery_images`, `team_invitations`, `legal_document_versions`, `user_legal_consents`) |

**DNS:** nutzt den vorhandenen Wildcard `*.brainmotion.ai` → Coolify-IP. Eine eigene Domain später: A-Record auf `46.224.186.246`, Domain in Coolify bei App + Kong eintragen, `NEXT_PUBLIC_APP_URL` + Auth-URLs anpassen, redeployen.

## 2. Altes Supabase-Cloud-Projekt

Das alte Projekt `rypvcqzzcmgevdgeqtbr` (Region eu-west-1) ist **pausiert** (Free-Plan). Reaktivieren geht erst, wenn ein anderes aktives Projekt (PulseOS, Sysclima) pausiert oder die Org upgegradet wird — Free erlaubt max. 2 aktive. **Falls dort Produktionsdaten liegen** (User, Fotos, Käufe): Projekt temporär reaktivieren → `supabase db dump` + Storage-Download → in die neue Instanz einspielen. Die neue DB startet sonst leer (Schema komplett, Daten leer).

## 3. Runbook: verbleibende Schritte (nur du, ~10 Minuten)

Diese Schritte erfordern Umgang mit Live-Secrets bzw. eine DB-Shell und wurden bewusst nicht automatisiert.

### 3.1 App-Secrets eintragen

Coolify → SportShots → App `sportshots:main` → **Environment Variables**. Die 7 `TODO_…`-Werte ersetzen:

| Variable | Quelle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Service `sportshots-supabase` → Environment Variables → `SERVICE_SUPABASEANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | ebd. → `SERVICE_SUPABASESERVICE_KEY` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `RESEND_API_KEY` | lokale `.env.local` im Repo |

Hinweis Stripe: aktuell Test-Keys; der Webhook-Endpoint muss bei Stripe auf `https://sportshots.brainmotion.ai/api/stripe/webhook` zeigen (neues Signing-Secret übernehmen).

### 3.2 DB-Schema einspielen

Coolify → Service `sportshots-supabase` → **Terminal** → Container `supabase-db-…` wählen → Connect, dann:

```bash
curl -sL https://github.com/fettespferd/sportshots/archive/refs/heads/main.tar.gz | tar xz -C /tmp && \
for f in /tmp/sportshots-main/src/supabase/migrations/*.sql; do \
  echo "== $(basename $f)"; \
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d postgres -f "$f" 2>&1 | grep -E "ERROR" ; \
done; echo FERTIG
```

Erwartung: pro Datei ggf. einzelne harmlose Fehler (z. B. „already exists" bei Re-Runs), aber keine Serie von ERRORs. Verifikation:

```bash
PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d postgres -c "\dt public.*" \
  -c "select id, public from storage.buckets;"
```

Erwartet: 14 Tabellen in `public`, Buckets `photos` und `selfies`.

### 3.3 Redeploy & Smoke-Test

App → **Redeploy** (nötig, damit die `NEXT_PUBLIC_*`-Werte ins Client-Bundle gebaut werden). Danach auf `https://sportshots.brainmotion.ai`: Signup → Login → Event anlegen → Foto-Upload (Wasserzeichen!) → Galerie.

### 3.4 Auth-Feinschliff (danach, für E-Mail-Flows)

- **GoTrue Site-URL/Redirects:** Service-Env `GOTRUE_SITE_URL=https://sportshots.brainmotion.ai` und `GOTRUE_URI_ALLOW_LIST=https://sportshots.brainmotion.ai/**` setzen (Service → Environment Variables), Service neu starten. Ohne SMTP funktioniert Login trotzdem (Autoconfirm ist im Template aktiv).
- **SMTP für Auth-Mails (Passwort-Reset!):** `GOTRUE_SMTP_HOST=smtp.resend.com`, `GOTRUE_SMTP_PORT=465`, `GOTRUE_SMTP_USER=resend`, `GOTRUE_SMTP_PASS=<RESEND_API_KEY>`, `GOTRUE_SMTP_ADMIN_EMAIL=noreply@sportshots.brainmotion.ai`. Deutsche Vorlagen: siehe `ImmoKompass/docs/supabase-auth-email-vorlagen-de.md`.
- **Resend:** Subdomain `sportshots.brainmotion.ai` als Absender-Domain verifizieren (DKIM/SPF), vgl. `Brainmotion-Website/docs/RESEND_SUBDOMAIN_SETUP.md`.

## 4. Betrieb & bekannte Lastprofile

Die drei Lastspitzen im Betrieb (alle event-korreliert, siehe Analyse vom 3.7.2026):

1. **Sharp-Wasserzeichen bei Upload-Batches** — CPU-gebunden; CPX42 (8 vCPU) verkraftet das, Uploads laufen ggf. langsamer, wenn parallel viel los ist.
2. **ZIP-Downloads** ([zip/route.ts](src/app/api/downloads/[token]/zip/route.ts)) — lädt alle Originale einer Bestellung **komplett in den RAM** (~1 GB bei 50 Fotos). Kurzfristig durch das 3-GB-Container-Limit eingedämmt (OOM trifft nur SportShots, nicht den Server). **TODO mittelfristig:** Route auf Streaming umbauen (z. B. `archiver` statt JSZip-Vollpuffer).
3. **next/image-Optimierung** — CPU beim ersten Galerie-Aufruf, danach Disk-Cache.

Backups: Coolify-Backup für `supabase-db` einrichten (Service → Supabase Db → Backups), Ziel z. B. Hetzner Storage Box / S3. Disk im Blick behalten (Docker-Images + Foto-Volume auf MinIO).

## 5. Offene Punkte

- [ ] Runbook 3.1–3.4 ausführen (du)
- [ ] Entscheidung: Daten aus altem Cloud-Projekt migrieren oder frisch starten (Abschnitt 2)
- [ ] ZIP-Route auf Streaming umbauen
- [ ] Stripe-Webhook auf neue Domain umhängen (bei Go-Live mit Live-Keys)
- [ ] Optional: PR-Preview-Deployments wie Brainmotion (`pr-{{pr_id}}`-Template + `auto-pr.yml`)
- [ ] Optional: eigene Domain statt `*.brainmotion.ai`
