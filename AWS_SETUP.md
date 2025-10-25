# AWS Rekognition Setup für SportShots

## 🎯 Warum AWS Rekognition?

AWS Rekognition wird für zwei wichtige Features benötigt:
1. **Startnummererkennung (OCR)** - Automatisches Erkennen von Startnummern auf Sportfotos
2. **Gesichtserkennung** - Finde Fotos über Selfie-Upload

---

## 🔧 Setup-Schritte

### Schritt 1: AWS Account erstellen

1. Gehe zu [https://aws.amazon.com](https://aws.amazon.com)
2. Klicke auf **"Create an AWS Account"**
3. Folge dem Registrierungsprozess (Kreditkarte wird benötigt, aber wir bleiben im Free Tier)

---

### Schritt 2: IAM User erstellen

1. **Gehe zur IAM Console:**
   - Nach dem Login: Suche nach "IAM" in der AWS Console
   - Oder direkt: [https://console.aws.amazon.com/iam/](https://console.aws.amazon.com/iam/)

2. **Neuen User erstellen:**
   - Links im Menü: **"Users"** → **"Create user"**
   - Username: `sportshots-rekognition`
   - Access type: **Programmatic access** (API Key)
   - Klick auf **"Next"**

3. **Berechtigungen zuweisen:**
   - Wähle: **"Attach policies directly"**
   - Suche und wähle: **"AmazonRekognitionFullAccess"**
   - Klick auf **"Next"** → **"Create user"**

4. **Access Keys generieren:**
   - Klicke auf den neu erstellten User
   - Tab: **"Security credentials"**
   - Klicke auf **"Create access key"**
   - Wähle: **"Application running on AWS compute service"** oder **"Other"**
   - **WICHTIG:** Speichere diese Keys sicher!
     - `Access Key ID` (z.B. AKIAIOSFODNN7EXAMPLE)
     - `Secret Access Key` (nur einmal sichtbar!)

---

### Schritt 3: Umgebungsvariablen setzen

1. **Öffne deine `.env.local` Datei**

2. **Füge die AWS Credentials ein:**
```env
# AWS REKOGNITION (FÜR OCR & GESICHTSERKENNUNG)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-central-1
```

3. **Region anpassen (optional):**
   - `eu-central-1` = Frankfurt (empfohlen für Europa)
   - `us-east-1` = Virginia (empfohlen für USA)
   - Weitere Regionen: [AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande.html)

4. **Speichern und Server neustarten:**
```bash
# Development Server neu starten
npm run dev
```

---

### Schritt 4: AWS Rekognition in deiner Region aktivieren

1. **Gehe zur Rekognition Console:**
   - [https://console.aws.amazon.com/rekognition/](https://console.aws.amazon.com/rekognition/)

2. **Wähle deine Region:**
   - Oben rechts in der AWS Console (z.B. "Frankfurt")
   - Stelle sicher, dass es die gleiche Region wie in `.env.local` ist!

3. **Teste Rekognition:**
   - Im Dashboard: Klicke auf **"Try Amazon Rekognition"**
   - Teste **"Detect text"** mit einem Beispielbild
   - Wenn es funktioniert, ist dein Account bereit!

---

## 💰 Kosten & Free Tier

### Free Tier (12 Monate kostenlos):
- **Text Detection (OCR):** 1.000 Bilder/Monat kostenlos
- **Face Comparison:** 1.000 Bilder/Monat kostenlos

### Danach:
- **Text Detection:** $1.50 pro 1.000 Bilder
- **Face Comparison:** $1.00 pro 1.000 Bilder

### Beispielrechnung:
- 100 Events/Monat mit je 50 Fotos = 5.000 OCR Requests
- Kosten: ~$7.50/Monat
- Bei geringer Nutzung: < $1/Monat

---

## ✅ Test: Funktioniert es?

### 1. Server neustarten
```bash
npm run dev
```

### 2. Als Fotograf anmelden

### 3. Event erstellen und Fotos hochladen

### 4. Klick auf "🔍 Startnummern erkennen"

### 5. Schaue in die Browser Console (F12 → Console)

**Erwartete Logs:**
```
🔍 OCR: Downloading image from: https://...
📸 OCR: Image downloaded, size: 1234567 bytes
☁️ OCR: Calling AWS Rekognition...
✅ OCR: AWS responded with 5 text detections
📝 OCR: All detected text: [...]
🔢 OCR: Filtered numbers (pure digits): ["457", "12"]
```

**Bei Fehler:**
```
❌ AWS Credentials not configured!
Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local
```
→ Überprüfe deine `.env.local` Datei!

---

## 🔍 Troubleshooting

### Problem: "AWS Credentials not configured"
**Lösung:**
1. Überprüfe `.env.local` Datei
2. Stelle sicher, dass die Keys korrekt sind (keine Leerzeichen!)
3. Server neustarten: `npm run dev`

### Problem: "Access Denied" oder "InvalidAccessKeyId"
**Lösung:**
1. Überprüfe, ob der IAM User die richtige Policy hat (`AmazonRekognitionFullAccess`)
2. Stelle sicher, dass die Access Keys korrekt kopiert wurden
3. Erstelle ggf. neue Access Keys

### Problem: "Region does not support Rekognition"
**Lösung:**
1. Ändere `AWS_REGION` in `.env.local` zu einer unterstützten Region
2. Empfohlen: `eu-central-1`, `us-east-1`, `us-west-2`

### Problem: Keine Startnummern erkannt
**Mögliche Gründe:**
1. **Bildqualität zu niedrig** → Verwende hochauflösende Bilder
2. **Startnummer zu klein** → Rekognition erkennt nur gut lesbare Zahlen
3. **Schlechte Beleuchtung** → Achte auf gute Kontraste
4. **Verdeckte Startnummer** → Startnummer muss sichtbar sein

**Debug-Tipps:**
- Schaue in die Console Logs: Welchen Text erkennt AWS?
- Teste mit einem Bild, das eine große, gut lesbare Startnummer hat
- Prüfe die `allDetectedText` im Log - was wird alles erkannt?

---

## 🚀 Fertig!

Wenn alles korrekt konfiguriert ist:
- ✅ OCR erkennt Startnummern automatisch
- ✅ Gesichtssuche über Selfies funktioniert
- ✅ Du siehst Debug-Logs in der Console

Bei weiteren Fragen: Schaue in die AWS Rekognition Dokumentation oder prüfe die Console Logs!

---

## 📚 Weitere Ressourcen

- [AWS Rekognition Dokumentation](https://docs.aws.amazon.com/rekognition/)
- [AWS Free Tier Details](https://aws.amazon.com/free/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

