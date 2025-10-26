# Rechtliche Zustimmung (AGB & Datenschutz) - Dokumentation

## Übersicht

Dieses System stellt sicher, dass alle Fotografen und Teams bei der Registrierung den AGB und der Datenschutzerklärung aktiv zustimmen müssen. Die exakte Version zum Zeitpunkt der Zustimmung wird gespeichert, um rechtlich auf der sicheren Seite zu sein.

## Architektur

### 1. Datenbank-Schema

#### Tabelle: `legal_document_versions`
Speichert alle Versionen der rechtlichen Dokumente:
- `id`: UUID (Primary Key)
- `document_type`: TEXT ('agb' oder 'datenschutz')
- `version`: TEXT (z.B. "1.0", "1.1")
- `content_hash`: TEXT (optional, für Verifikation)
- `effective_date`: TIMESTAMPTZ (Datum des Inkrafttretens)
- `created_at`: TIMESTAMPTZ

#### Tabelle: `user_legal_consents`
Speichert die Zustimmungen der Benutzer:
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key zu auth.users)
- `document_type`: TEXT ('agb' oder 'datenschutz')
- `version`: TEXT (Die Version, der zugestimmt wurde)
- `consented_at`: TIMESTAMPTZ (Zeitstempel der Zustimmung)
- `ip_address`: TEXT (optional, für zusätzlichen rechtlichen Nachweis)
- `user_agent`: TEXT (optional, für zusätzlichen rechtlichen Nachweis)

### 2. Versionierung

Die Versionen werden in den folgenden Dateien definiert:
- `/src/app/(public)/agb/page.tsx`: Exportiert `AGB_VERSION` und `AGB_EFFECTIVE_DATE`
- `/src/app/(public)/datenschutz/page.tsx`: Exportiert `DATENSCHUTZ_VERSION` und `DATENSCHUTZ_EFFECTIVE_DATE`

**Wichtig**: Diese Versionen müssen mit den Einträgen in der Datenbank übereinstimmen!

### 3. Registrierungsprozess

1. Benutzer füllt das Registrierungsformular aus
2. **Pflicht**: Beide Checkboxen (AGB + Datenschutz) müssen aktiviert werden
3. Bei Formular-Submit wird validiert, ob beide Checkboxen aktiviert sind
4. Nach erfolgreicher User-Erstellung werden zwei Einträge in `user_legal_consents` gespeichert:
   - Einer für die AGB mit der aktuellen Version
   - Einer für die Datenschutzerklärung mit der aktuellen Version

## Neue Version erstellen (z.B. AGB v1.1)

### Schritt 1: Datenbank aktualisieren

Erstelle eine neue Migration:

```bash
touch src/supabase/migrations/YYYYMMDD_update_agb_version.sql
```

Füge die neue Version hinzu:

```sql
-- Neue Version der AGB hinzufügen
INSERT INTO legal_document_versions (document_type, version, effective_date) 
VALUES ('agb', '1.1', '2025-02-01 00:00:00+00');
```

### Schritt 2: Frontend-Versionsnummer aktualisieren

In `/src/app/(public)/agb/page.tsx`:

```typescript
export const AGB_VERSION = "1.1";
export const AGB_EFFECTIVE_DATE = "2025-02-01";
```

### Schritt 3: Inhalt aktualisieren

Aktualisiere den Inhalt der AGB-Seite nach Bedarf.

### Schritt 4: Migration ausführen

```bash
supabase db push
```

### Schritt 5: Bestehende Nutzer informieren (optional)

Für bestehende Nutzer könntest du:
- Eine E-Mail über die Änderungen versenden
- Ein Banner auf der Website anzeigen
- Eine erneute Zustimmung verlangen (je nach rechtlichen Anforderungen)

## Hilfs-Funktionen

### SQL: Neueste Version abrufen

```sql
SELECT get_latest_legal_version('agb');
SELECT get_latest_legal_version('datenschutz');
```

### SQL: Prüfen, ob ein Benutzer der neuesten Version zugestimmt hat

```sql
SELECT user_has_latest_consent('USER_UUID_HERE', 'agb');
SELECT user_has_latest_consent('USER_UUID_HERE', 'datenschutz');
```

### SQL: Alle Benutzer finden, die NICHT der neuesten Version zugestimmt haben

```sql
-- Benutzer ohne aktuelle AGB-Zustimmung
SELECT p.id, p.email, p.username
FROM profiles p
WHERE NOT user_has_latest_consent(p.id, 'agb');

-- Benutzer ohne aktuelle Datenschutz-Zustimmung
SELECT p.id, p.email, p.username
FROM profiles p
WHERE NOT user_has_latest_consent(p.id, 'datenschutz');
```

## Audit & Compliance

### Alle Zustimmungen eines Benutzers anzeigen

```sql
SELECT 
  ulc.document_type,
  ulc.version,
  ulc.consented_at,
  ldv.effective_date
FROM user_legal_consents ulc
JOIN legal_document_versions ldv 
  ON ulc.document_type = ldv.document_type 
  AND ulc.version = ldv.version
WHERE ulc.user_id = 'USER_UUID_HERE'
ORDER BY ulc.consented_at DESC;
```

### Export für DSGVO-Anfrage

```sql
-- Vollständiger Export aller gespeicherten Zustimmungen eines Benutzers
SELECT 
  document_type AS "Dokumenttyp",
  version AS "Version",
  consented_at AS "Zugestimmt am",
  ip_address AS "IP-Adresse",
  user_agent AS "Browser"
FROM user_legal_consents
WHERE user_id = 'USER_UUID_HERE'
ORDER BY consented_at DESC;
```

## Sicherheitshinweise

1. **Row Level Security (RLS)**: Aktiviert - Benutzer können nur ihre eigenen Zustimmungen sehen
2. **Unveränderlichkeit**: Zustimmungen sollten NIEMALS gelöscht oder geändert werden (nur INSERT)
3. **Backup**: Regelmäßige Backups der `user_legal_consents` Tabelle
4. **Audit Log**: Optional: Trigger hinzufügen für Änderungen an `legal_document_versions`

## Testing

### Lokales Testing

1. Migration ausführen: `supabase db push`
2. Dev-Server starten: `npm run dev`
3. Registrierungsseite öffnen: http://localhost:3000/signup
4. Ohne Checkbox-Aktivierung versuchen zu registrieren → sollte fehlschlagen
5. Mit beiden Checkboxen registrieren → sollte erfolgreich sein
6. In Supabase Dashboard prüfen: `user_legal_consents` Tabelle

### SQL-Test

```sql
-- Prüfe, ob die Versionen korrekt angelegt wurden
SELECT * FROM legal_document_versions ORDER BY effective_date DESC;

-- Prüfe, ob die Zustimmungen gespeichert wurden
SELECT * FROM user_legal_consents WHERE user_id = 'DEIN_TEST_USER_UUID';
```

## Troubleshooting

### Problem: "Tabelle existiert nicht"
**Lösung**: Migration ausführen mit `supabase db push`

### Problem: Checkbox-Änderung wird nicht gespeichert
**Lösung**: 
1. Browser-Konsole auf Fehler prüfen
2. Supabase RLS-Policies prüfen
3. User-ID in der Console ausgeben lassen

### Problem: Falsches Datum wird angezeigt
**Lösung**: `AGB_EFFECTIVE_DATE` und `DATENSCHUTZ_EFFECTIVE_DATE` im ISO-Format (YYYY-MM-DD) angeben

## Rechtliche Empfehlungen

1. **Double Opt-in**: Aktuell wird die Zustimmung bei der Registrierung gespeichert (Single Opt-in). Für zusätzliche Sicherheit könnte eine E-Mail-Bestätigung hinzugefügt werden.

2. **IP-Adresse & User-Agent**: Aktuell nicht implementiert, aber vorbereitet. Könnte hinzugefügt werden für zusätzlichen rechtlichen Nachweis.

3. **Widerruf**: Nutzer sollten die Möglichkeit haben, ihre Zustimmung zu widerrufen (bedeutet in der Regel Account-Löschung).

4. **Archivierung**: Bei Änderungen sollten alte Versionen der AGB/Datenschutz archiviert werden.

## Support

Bei Fragen oder Problemen:
- Dokumentation: Diese Datei
- Migrations-Datei: `src/supabase/migrations/20250126000008_add_legal_consent.sql`
- Frontend-Komponente: `src/app/(auth)/signup/page.tsx`

