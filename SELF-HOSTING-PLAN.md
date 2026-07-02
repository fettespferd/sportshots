# Hosting-Plan: SportShots auf Hetzner via Coolify (nach dem Brainmotion-Modell)

**Stand:** Juli 2026
**Ziel:** SportShots genauso hosten wie Brainmotion: App als Docker-Container über **Coolify** auf dem bestehenden Hetzner-Server (`deploy.brainmotion.ai`), Datenbank als **neues Supabase-Cloud-Projekt**, eigene Domain mit Wildcard-DNS.

**Referenz:** `Brainmotion-Website/docs/COOLIFY_DEPLOYMENT.md` + `Brainmotion-Website/Dockerfile`. Brainmotion läuft auf demselben Coolify-Server wie ImmoKompass; SportShots wird die dritte Application.

> **Klarstellung:** Die Brainmotion-Datenbank ist **nicht** self-hosted — sie liegt bei Supabase Cloud (Projekt-Ref `yglfyezoumxlowuqdwbj`). „Genau so" heißt also: nur die App zieht auf den Hetzner-Server, die Datenbank bleibt bei Supabase (neues Projekt). Das erspart den kompletten Betrieb eines eigenen Supabase-Stacks (Auth/Storage/Backups) und ist bewährt.

---

## 1. Architektur (Soll-Zustand)

| Komponente | Brainmotion (Vorbild) | SportShots (Ziel) |
|---|---|---|
| App-Hosting | Coolify-App, Dockerfile-Buildpack, Port 4173 (`vite preview`) | Coolify-App, Dockerfile-Buildpack, Port 3000 (Next.js standalone) |
| Datenbank/Auth/Storage | Supabase Cloud (`yglfyezoumxlowuqdwbj`) | **Neues** Supabase-Cloud-Projekt (Daten aus `rypvcqzzcmgevdgeqtbr` migriert) |
| Domain | `brainmotion.ai` + Wildcard `*.brainmotion.ai` → Coolify-IP | eigene Domain + Wildcard analog |
| TLS | Let's Encrypt via Coolify (HTTP-01, pro Subdomain) | identisch |
| PR-Previews | `pr-{{pr_id}}.brainmotion.ai` via `auto-pr.yml` | optional identisch |
| Healthcheck | `/api/health` (im Vite-Plugin) | `/api/health` **muss neu angelegt werden** |
| Webhooks | Stripe + Resend auf Production-Domain | Stripe auf `https://<domain>/api/stripe/webhook` |
| Extern | Stripe, Resend, OpenAI/Anthropic | Stripe, Resend, AWS Rekognition (alle unverändert) |

**Wichtigster technischer Unterschied:** Brainmotion ist eine Vite-SPA mit Vercel-API-Emulation über `vite-plugin-local-api.ts` — dieser ganze Mechanismus ist für SportShots **irrelevant**. SportShots ist eine Next.js-App und bringt ihren eigenen Server mit (`next start` bzw. standalone `server.js`). Das Dockerfile ist dadurch sogar einfacher.

---

## 2. ⚠️ Kritischer Befund: Migrations-Ordner ist unvollständig

Der Code verwendet Tabellen, die in **keiner** Datei unter `src/supabase/migrations/` angelegt werden:

- `leads`, `gallery_images`, `team_invitations`, `legal_document_versions`, `user_legal_consents`

Diese wurden direkt im Supabase-Dashboard des Alt-Projekts angelegt. **Konsequenz:** Das neue Supabase-Projekt darf nicht aus den Migrations aufgebaut werden, sondern per Dump aus der Live-Datenbank (`supabase db dump` / `pg_dump`). Der Umzug ist die Gelegenheit, den Dump als Baseline-Migration einzuchecken — Brainmotion pflegt Migrationen ohnehin „manuell im Supabase-SQL-Editor", dieses Muster übernehmen wir.

---

## 3. Code-Anpassungen im SportShots-Repo (Phase 1)

1. **`next.config.ts`:** `output: 'standalone'` ergänzen; hartkodiertes `rypvcqzzcmgevdgeqtbr.supabase.co` in `images.remotePatterns` durch den Hostname aus `NEXT_PUBLIC_SUPABASE_URL` ersetzen (`new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname`) — sonst zeigt die App nach dem DB-Wechsel keine Bilder.
2. **`/api/health`-Route anlegen** (`src/app/api/health/route.ts`, gibt `200 {status:"ok"}`) — Coolify-Healthcheck, analog Brainmotion.
3. **`Dockerfile`** (Multi-Stage, siehe Abschnitt 4) + **`.dockerignore`** (`node_modules`, `.next`, `.git`, `.env*`).
4. **Build-Zeit-Env beachten (Brainmotion-Learning!):** Next.js backt `NEXT_PUBLIC_*` zur **Build-Zeit** ins Client-Bundle — exakt dasselbe Problem wie `VITE_*` bei Brainmotion. In der Coolify-UI muss bei allen `NEXT_PUBLIC_*`-Variablen **„Build Variable / Available at Buildtime" aktiviert** sein, sonst baut das Frontend mit leeren Werten (weiße Seite / „Supabase not configured"). Wie bei Brainmotion: **keine `ARG`-Defaults** für diese Variablen im Dockerfile deklarieren — Coolify stellt sie beim Build als `process.env` bereit, ein leeres ARG würde sie überschreiben.
5. Datenschutz-Seite: Hosting-Angaben aktualisieren (App auf Hetzner/DE, DB weiterhin Supabase).
6. Aufräumen: `/api/migrations/run` entfernen (läuft bereits als separater Task), `next-intl` aus den Dependencies werfen (ungenutzt).

## 4. Dockerfile (Entwurf)

Anders als Brainmotions Single-Stage-Dockerfile (Vite) nutzt Next.js sinnvollerweise Multi-Stage mit standalone-Output:

```dockerfile
FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
# --include=dev wie bei Brainmotion: Coolify setzt NODE_ENV=production,
# ohne den Flag fehlen typescript/@types beim Build
RUN npm ci --include=dev

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* kommen von Coolify als process.env (Build Variable AN,
# keine ARG-Defaults deklarieren — siehe COOLIFY_DEPLOYMENT.md Brainmotion)
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
# curl für den Coolify-Healthcheck (slim-Image bringt keins mit)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Hinweis `sharp`: wird zur Laufzeit für Wasserzeichen gebraucht. Im standalone-Output wird es automatisch mitkopiert (native Binaries für linux-x64 zieht `npm ci` im Container korrekt). Nach dem ersten Deploy einen Test-Upload machen.

---

## 5. Migrationsplan (Phasen)

### Phase 0 — Vorbereitung
- [ ] Neues Supabase-Cloud-Projekt anlegen (Region `eu-central-1`, Frankfurt).
- [ ] Schema-Dump vom Alt-Projekt: `supabase db dump --db-url <alt>` (inkl. `auth`- und `storage`-Schema) → als Baseline einchecken.
- [ ] Storage-Inventar: Größe/Objektzahl der Buckets `photos` und `selfies`.
- [ ] DNS-Zugriff prüfen; TTL des A-Records vorab auf 300 s senken.

### Phase 1 — Code (siehe Abschnitt 3)

### Phase 2 — Coolify-Application anlegen (analog Brainmotion-Doku, Abschnitt „Erstkonfiguration")
- [ ] DNS: `A`-Record für die Domain (+ optional Wildcard `*.<domain>` für Previews) auf die Coolify-Server-IP (in Coolify unter Server → IP, dieselbe wie Brainmotion/ImmoKompass).
- [ ] Neue Application im Coolify-Projekt: Source = GitHub-App → `fettespferd/sportshots`, Branch `main`, Build Pack **Dockerfile**.
- [ ] Port `3000` exposen; Healthcheck-Pfad `/api/health`.
- [ ] Env-Variablen eintragen (Tabelle unten); bei allen `NEXT_PUBLIC_*` **„Build Variable" aktivieren**.
- [ ] **RAM prüfen:** Der Server trägt schon ImmoKompass + Brainmotion. Next.js-Build ist speicherhungrig (~2 GB Peak). Falls Builds fehlschlagen/den Server ausbremsen: Server aufstocken oder Coolify-Build-Server-Feature nutzen.
- [ ] Optional (später): Preview-Deployments mit URL-Template `pr-{{pr_id}}.<domain>` + `auto-pr.yml` wie bei Brainmotion.

### Phase 3 — Datenmigration (erst Generalprobe, dann Ernstfall)
- [ ] DB: Dump vom Alt-Projekt → Restore ins neue Projekt (`psql`/`supabase db push` mit der Connection-URL des neuen Projekts). `auth.users` (Passwort-Hashes!) und `storage`-Metadaten mitnehmen.
- [ ] Storage-Objekte `photos` + `selfies` kopieren: Skript über die Storage-API (list/download/upload mit den Service-Role-Keys beider Projekte) oder `rclone` (beide S3-kompatibel).
- [ ] **URL-Check in den Daten:** prüfen, ob `photos.watermark_url`/`original_url` etc. absolute URLs mit dem alten Host `rypvcqzzcmgevdgeqtbr.supabase.co` enthalten — falls ja, einmaliges SQL-Update auf den neuen Host.
- [ ] Supabase-Auth im neuen Projekt konfigurieren: Site URL `https://<domain>`, Redirect URLs `/auth/callback` + `/reset-password` (+ `https://*.<domain>/**` falls Previews, wie Brainmotion).
- [ ] Verifikation: Zeilenzahlen vergleichen, Login mit Bestands-User, Foto-Anzeige, Download-Token.

### Phase 4 — Deploy & Test
- [ ] Coolify-Deploy auslösen, Healthcheck grün.
- [ ] Smoke-Test über die Domain: Signup, Login, Galerie, Upload inkl. Wasserzeichen (sharp!), OCR, Selfie-Suche, Test-Checkout (Stripe-Testmode).

### Phase 5 — Cutover (Wartungsfenster ~1 h, Reihenfolge wie Brainmotion)
1. Uploads pausieren, finales DB- & Storage-Delta nachziehen.
2. DNS auf die Coolify-IP umstellen.
3. **Stripe:** Webhook-Endpoint auf `https://<domain>/api/stripe/webhook`, neues Signing-Secret als `STRIPE_WEBHOOK_SECRET` in Coolify, Test-Kauf als Abnahme.
4. Testing-Checkliste aus `SETUP-GUIDE.md` (Fotografen-/Kunden-/Admin-Flow).
5. Altes Supabase-Projekt + Vercel **pausieren, nicht löschen** (Rollback-Fenster 2–4 Wochen).

### Phase 6 — Betrieb
- [ ] Supabase-Backups: Cloud macht tägliche Backups (Pro-Plan); zusätzlich wöchentlicher `pg_dump` lokal/Storage Box schadet nicht.
- [ ] Uptime-Monitoring auf `https://<domain>/api/health` (Coolify-Notifications oder Uptime Kuma).
- [ ] Disk-Monitoring auf dem Coolify-Server (Docker-Images/Logs wachsen; `docker system prune` als Cron gibt es in Coolify eingebaut).

---

## 6. Environment-Variablen (Coolify-UI)

### Build-Zeit + Runtime (`NEXT_PUBLIC_*` → „Build Variable" AN!)

| Variable | Wert | Geheim |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL des **neuen** Supabase-Projekts | nein |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon-Key des neuen Projekts | nein |
| `NEXT_PUBLIC_APP_URL` | `https://<domain>` | nein |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Public Key (Live) | nein |

### Nur Runtime

| Variable | Zweck | Geheim |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | RLS-Bypass (Server) | ⚠️⚠️ |
| `STRIPE_SECRET_KEY` | Stripe Secret (Live) | ⚠️ |
| `STRIPE_WEBHOOK_SECRET` | neues Signing-Secret nach Webhook-Umzug | ⚠️ |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Rekognition | ⚠️ |
| `AWS_REGION` | `eu-central-1` | nein |
| `RESEND_API_KEY` | E-Mail-Versand | ⚠️ |
| `RESEND_FROM_EMAIL` | verifizierte Absender-Adresse | nein |
| `PLATFORM_FEE_PERCENTAGE` | `15` | nein |
| `NODE_ENV` | `production` | nein |

## 7. Aufwandsschätzung

| Phase | Aufwand |
|---|---|
| 0 Vorbereitung + neues Supabase-Projekt | 1–2 h |
| 1 Code (Dockerfile, standalone, health, remotePatterns) | 2–4 h |
| 2 Coolify-App + DNS | 1–2 h (Muster von Brainmotion existiert) |
| 3 Datenmigration + Generalprobe | 3–6 h (abhängig vom Foto-Volumen) |
| 4 Deploy & Test | 1–2 h |
| 5 Cutover | ~1 h |
| **Gesamt** | **~1,5–2 Arbeitstage** |

Deutlich weniger als die frühere Self-hosted-Supabase-Variante (2–4 Tage + laufende Wartung), weil Auth/Storage/Backups bei Supabase Cloud bleiben.

## 8. Offene Entscheidungen

1. **Welche Domain** für SportShots (+ soll es Wildcard-Previews wie bei Brainmotion geben)?
2. **Supabase-Plan** fürs neue Projekt: Free reicht zum Start nur bis 1 GB Storage — bei Event-Fotos vermutlich schnell überschritten → Pro (25 $/Monat) einplanen.
3. **Alternativ:** Altes Supabase-Projekt einfach behalten statt neuem Projekt? Dann entfällt Phase 3 komplett — „neue Datenbank" war aber deine Vorgabe; falls der Grund nur Aufräumen ist, wäre auch ein Reset im Bestandsprojekt denkbar.
4. Reicht der RAM des bestehenden Coolify-Servers für eine dritte App inkl. Next.js-Builds?
