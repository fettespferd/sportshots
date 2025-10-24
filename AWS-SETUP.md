# AWS Setup für SportShots

## 🎯 Was wird gebraucht

AWS Rekognition für:
1. **OCR**: Automatische Startnummern-Erkennung beim Foto-Upload
2. **Gesichtserkennung**: Selfie-Upload → ähnliche Fotos finden

## 📝 Schritt-für-Schritt Anleitung

### 1. AWS Account erstellen

1. Gehe zu [aws.amazon.com/free](https://aws.amazon.com/free)
2. Klicke **"Create an AWS Account"**
3. Fülle aus:
   - E-Mail-Adresse
   - Passwort
   - AWS account name: `SportShots`
4. Kontaktinformationen:
   - Account type: **Personal**
   - Adresse, Telefon
5. Zahlungsinformationen (Kreditkarte für Verifizierung)
6. Identity Verification (SMS/Anruf)
7. Support Plan: **Basic (Free)**

### 2. IAM User für API-Zugriff erstellen

Nach Login in AWS Console:

1. Gehe zu [console.aws.amazon.com/iam](https://console.aws.amazon.com/iam)
2. Klicke **"Users"** (linke Sidebar) → **"Create user"**
3. Username: `sportshots-rekognition`
4. **"Next"**
5. Permissions:
   - Wähle **"Attach policies directly"**
   - Suche: `AmazonRekognitionFullAccess` → anhaken
   - Suche: `AmazonS3ReadOnlyAccess` → anhaken
6. **"Next"** → **"Create user"**

### 3. Access Keys erstellen

1. Klicke auf den User `sportshots-rekognition`
2. Tab **"Security credentials"**
3. Scrolle zu **"Access keys"** → **"Create access key"**
4. Use case: **"Application running outside AWS"**
5. **"Next"** → Optional: Tag hinzufügen
6. **"Create access key"**
7. ⚠️ **WICHTIG**: 
   - Kopiere **Access key ID**
   - Kopiere **Secret access key**
   - (Wird nur EINMAL angezeigt!)

### 4. Keys zur .env.local hinzufügen

```env
# AWS Rekognition
AWS_ACCESS_KEY_ID=dein_access_key_hier
AWS_SECRET_ACCESS_KEY=dein_secret_key_hier
AWS_REGION=eu-central-1
```

### 5. Server neu starten

```bash
npm run dev
```

## 💰 Kosten

### Free Tier (erste 12 Monate):
- **5.000 Bilder/Monat kostenlos**
- Text Detection (OCR): Inklusive
- Face Detection: Inklusive

### Nach Free Tier:
- ~$1 pro 1.000 Bilder
- Sehr günstig für kleine/mittlere Plattformen!

## ✅ Features nach Setup

1. **Automatische Startnummern-Erkennung**:
   - Fotografen laden Fotos hoch
   - System erkennt automatisch Startnummern
   - Vorschlag kann manuell korrigiert werden

2. **Selfie-Suche für Kunden**:
   - Kunde lädt Selfie auf Event-Seite hoch
   - System findet automatisch ähnliche Fotos
   - Sortiert nach Ähnlichkeit (80%+ Match)

## 🔒 Sicherheit

- IAM User hat nur Rekognition + S3 Read Zugriff
- Keys niemals in Git committen (.env.local ist in .gitignore)
- In Production: Environment Variables über Vercel setzen

## 🧪 Testing

Nach Setup kannst du testen:

1. **OCR testen**:
   - Als Fotograf Foto mit Startnummer hochladen
   - System schlägt Nummer vor (im Upload-Interface)

2. **Face-Search testen**:
   - Als Kunde auf Event-Seite
   - Selfie hochladen
   - System zeigt ähnliche Fotos

## ❓ Troubleshooting

### "Access Denied" Fehler:
- IAM User hat nicht genug Permissions
- Gehe zu IAM → Users → Permissions prüfen

### "Invalid Credentials":
- AWS Keys falsch in .env.local
- Keys nochmal kopieren (ohne Leerzeichen!)

### "Rate Limit Exceeded":
- Zu viele Requests
- Face-Search läuft in Batches (5 Bilder parallel)
- OCR läuft einzeln pro Foto

## 📚 Weitere Infos

- [AWS Rekognition Docs](https://docs.aws.amazon.com/rekognition/)
- [AWS Free Tier Details](https://aws.amazon.com/free/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

