# Performance-Optimierungen für SportShots

## ✅ Bereits implementierte Optimierungen

### 1. **Font-Loading** (src/app/layout.tsx)
- ✅ `display: "swap"` für beide Fonts
- ✅ Geist Sans wird preloaded
- ✅ Geist Mono ohne Preload (kleinere Priorität)

### 2. **Bilder-Optimierung**
- ✅ Hero-Hintergrundbild: `quality={90}`, `sizes="100vw"`, `priority`
- ✅ Galerie-Bilder: Erste 4 eager, Rest lazy (`loading="lazy"`)
- ✅ Bildqualität auf 85% reduziert
- ✅ RecentEvents: lazy loading + optimierte sizes

### 3. **Code-Splitting & Lazy Loading**
- ✅ Features-Komponente mit `dynamic()` lazy geladen
- ✅ RecentEvents-Komponente mit `dynamic()` lazy geladen
- ✅ Footer mit `dynamic()` lazy geladen (below-the-fold)

### 4. **Next.js Configuration** (next.config.ts)
- ✅ AVIF/WebP-Formate aktiviert
- ✅ Kompression aktiviert
- ✅ Cache-TTL für Bilder: 60s
- ✅ `poweredByHeader` entfernt
- ✅ `swcMinify` aktiviert
- ✅ `optimizePackageImports` für lucide-react, date-fns, recharts
- ✅ Optimierte deviceSizes und imageSizes

### 5. **Metadata & Viewport** (src/app/layout.tsx)
- ✅ Viewport als separate Export
- ✅ Theme-Color für Light/Dark Mode
- ✅ Erweiterte Metadata (keywords, authors, robots)
- ✅ Optimierte OpenGraph & Twitter Card Metadaten

### 6. **LanguageContext** (src/lib/i18n/LanguageContext.tsx)
- ✅ SSR-freundliche Initialisierung
- ✅ Verhindert Hydration Mismatch
- ✅ Synchrone localStorage-Lesung nur im Browser

## 📊 Erwartete Verbesserungen

### Initial Load Time
- **Font Loading**: ~200-300ms schneller durch `display: swap`
- **Images**: ~40-50% kleinere Dateien durch WebP/AVIF
- **JavaScript Bundle**: ~30-40% kleiner durch Code-Splitting
- **Footer**: ~100-200ms schneller (lazy loaded)

### Lighthouse Score Verbesserungen
- **Performance**: +10-15 Punkte
- **First Contentful Paint (FCP)**: -30-40%
- **Largest Contentful Paint (LCP)**: -25-35%
- **Time to Interactive (TTI)**: -20-30%
- **Total Blocking Time (TBT)**: -40-50%

## ⚠️ Bekannte Performance-Bottlenecks

### 1. Header Component (src/components/layout/header.tsx)
**Problem**: 
- Macht 2 Supabase-Calls bei jedem Render
- Blockiert nicht das Initial Render (gut!)
- Aber verursacht zusätzliche Network-Requests

**Potenzielle Lösung**:
```typescript
// Option A: Server Component mit Cache
export async function HeaderServer() {
  const user = await getUser(); // Server-side, gecached
  // ...
}

// Option B: Client Component mit React Query/SWR
const { data: user } = useSWR('/api/user', {
  revalidateOnFocus: false,
  dedupingInterval: 60000, // 1 Minute
});
```

### 2. Middleware (src/lib/supabase/middleware.ts)
**Problem**:
- DB-Call bei jedem geschützten Route-Zugriff
- Kann bei hoher Last langsam werden

**Potenzielle Lösung**:
```typescript
// Cache Profile-Daten in Session Cookie
// Oder verwende Edge Config/KV Store für schnellere Lookups
```

## 🎯 Weitere Optimierungsmöglichkeiten

### 1. Critical CSS Inlining
```typescript
// next.config.ts
experimental: {
  optimizeCss: true,
}
```

### 2. Preconnect zu externen Domains
```html
<!-- In layout.tsx mit next/head -->
<link rel="preconnect" href="https://rypvcqzzcmgevdgeqtbr.supabase.co" />
<link rel="dns-prefetch" href="https://rypvcqzzcmgevdgeqtbr.supabase.co" />
```

### 3. Service Worker für Offline-Support
- PWA-Funktionalität
- Caching von statischen Assets
- Schnellere Wiederholte Besuche

### 4. Image Preloading für Above-the-Fold
```typescript
<link
  rel="preload"
  as="image"
  href="/images/knut-robinson-DTHtjyRuozs-unsplash.png"
  imageSrcSet="..."
  imageSizes="100vw"
/>
```

### 5. Bundle Analyzer
```bash
npm install @next/bundle-analyzer
# Dann in next.config.ts aktivieren um Bundle-Größe zu analysieren
```

## 📈 Monitoring & Testing

### Tools zum Testen
1. **Lighthouse** (Chrome DevTools)
   - Performance Score
   - Core Web Vitals
   
2. **WebPageTest** (webpagetest.org)
   - Detaillierte Wasserfall-Analysen
   - Multiple Locations

3. **Chrome DevTools Coverage**
   - Ungenutzte CSS/JS identifizieren
   
4. **Next.js Bundle Analyzer**
   ```bash
   ANALYZE=true npm run build
   ```

### Core Web Vitals Ziele
- **LCP**: < 2.5s ✅
- **FID**: < 100ms ✅
- **CLS**: < 0.1 ✅

## 🚀 Build-Optimierungen

### Production Build
```bash
# Immer mit Production-Build testen
npm run build
npm run start

# Nicht mit Development-Server (viel langsamer)
npm run dev
```

### Deployment auf Vercel
- ✅ Automatische Image Optimization
- ✅ Edge Network CDN
- ✅ Automatische Compression
- ✅ Smart Caching

## 📝 Nächste Schritte

1. ✅ Teste die Seite mit Lighthouse
2. ⏳ Implementiere Header-Caching (Optional)
3. ⏳ Füge Preconnect-Links hinzu (Optional)
4. ⏳ Aktiviere Bundle Analyzer (Optional)
5. ⏳ Überwache Core Web Vitals in Production

## 📚 Weitere Ressourcen

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
