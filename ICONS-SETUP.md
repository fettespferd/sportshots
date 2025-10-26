# 🎨 Icons & Branding Setup

## Benötigte Icon-Dateien

Erstelle die folgenden Dateien in deinem Design-Tool (Figma, Photoshop, etc.):

### 1. **Favicon** (Browser-Tab)
**Speicherort:** `/src/app/favicon.ico`
- **Format:** .ico
- **Größen:** 16x16, 32x32, 48x48 px (Multi-Resolution)
- **Verwendung:** Browser-Tab-Icon

**Tipp:** Nutze ein Online-Tool wie [favicon.io](https://favicon.io/) um aus PNG ein .ico zu erstellen

---

### 2. **App Icon** (Allgemeines Icon)
**Speicherort:** `/src/app/icon.png`
- **Format:** PNG (transparenter Hintergrund empfohlen)
- **Größe:** 512x512 px
- **Verwendung:** PWA, Android, generische App-Icons

---

### 3. **Apple Touch Icon** (iOS)
**Speicherort:** `/src/app/apple-icon.png`
- **Format:** PNG
- **Größe:** 180x180 px
- **Verwendung:** iOS Home-Screen Icon
- **Besonderheit:** Abgerundete Ecken werden automatisch von iOS hinzugefügt

---

### 4. **Open Graph Image** (Social Media Share)
**Speicherort:** `/public/og-image.png`
- **Format:** PNG oder JPG
- **Größe:** 1200x630 px (exakt!)
- **Verwendung:** WhatsApp, Facebook, Twitter, LinkedIn Share-Vorschau
- **Design-Tipps:**
  - Füge dein Logo hinzu
  - Verwende einen ansprechenden Hintergrund (z.B. Sportfoto)
  - Füge den Text "SportShots" hinzu
  - Halte wichtige Inhalte in der sicheren Zone (nicht zu nah am Rand)

**Beispiel-Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│         [DEIN LOGO]                 │
│                                     │
│       SportShots                    │
│  Finde deine Sportfotos             │
│                                     │
│   [Hintergrund: Sportfoto]          │
│                                     │
└─────────────────────────────────────┘
     1200px × 630px
```

---

## 📋 Checkliste

- [ ] **favicon.ico** erstellt und in `/src/app/` platziert
- [ ] **icon.png** (512x512) erstellt und in `/src/app/` platziert
- [ ] **apple-icon.png** (180x180) erstellt und in `/src/app/` platziert
- [ ] **og-image.png** (1200x630) erstellt und in `/public/` platziert
- [ ] Icons in verschiedenen Browsern getestet
- [ ] Share-Vorschau getestet (z.B. auf WhatsApp)

---

## 🛠️ Testing

### Favicon testen:
1. Öffne deine Website in verschiedenen Browsern
2. Schaue auf das Tab-Icon
3. Erstelle ein Lesezeichen und prüfe das Icon

### Open Graph testen:
1. Gehe zu [OpenGraph.xyz](https://www.opengraph.xyz/)
2. Gib deine URL ein
3. Prüfe, wie die Vorschau aussieht

### Alternative Test-Tools:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

---

## 🎨 Design-Empfehlungen

### Farben:
- Verwende deine Markenfarben
- Achte auf guten Kontrast
- Dark Mode berücksichtigen

### Logo:
- Einfach und erkennbar
- Skalierbar (funktioniert auch in 16x16)
- Bei kleinen Größen: Vereinfachte Version verwenden

### OG-Image:
- Visuell ansprechend
- Repräsentiert deine App
- Lesbar auch in kleinen Vorschau-Größen
- Call-to-Action einbauen

---

## 🚀 Nach dem Upload

1. Build erstellen: `npm run build`
2. Deployment: `vercel --prod` oder dein Deployment-Tool
3. Cache leeren:
   - Browser: Hard-Reload (Cmd/Ctrl + Shift + R)
   - Facebook/LinkedIn: Sharing Debugger verwenden

---

## 📱 Zusätzliche Icons (Optional)

Falls du eine PWA (Progressive Web App) planst:

### manifest.json Icons
Erstelle weitere Größen in `/public/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-maskable-512.png` (512x512, mit Safe Area)

---

## 💡 Tipps

1. **Vektorgrafik verwenden:** Erstelle dein Logo als SVG und exportiere in verschiedenen Größen
2. **Konsistenz:** Alle Icons sollten zum gleichen Design-System gehören
3. **Komprimierung:** Nutze Tools wie [TinyPNG](https://tinypng.com/) um Dateigröße zu reduzieren
4. **Testing:** Prüfe Icons auf hellen und dunklen Hintergründen

---

## ❓ Fragen?

Bei Problemen:
1. Prüfe Dateipfade
2. Leere Browser-Cache
3. Prüfe Bildformate und -größen
4. Teste in verschiedenen Browsern

