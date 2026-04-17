# DJ Booking — Bilješke projekta

## Kako pokrenuti

```bash
cd C:\Users\Hrvoje\dj-booking
npm run dev
```

Otvori browser na: **http://localhost:3000**

---

## Što je napravljeno

- **Hero sekcija** — tamna pozadina, veliki naslov "DJ NAME", statistike na dnu
- **Kalendar** — počinje s ponedjeljkom, hrvatski jezik, onemogućeni prošli datumi i pon–čet
- **Obrazac za rezervaciju** — otključava se nakon odabira datuma, validacija svih polja
- **Google Calendar API** — `/api/book` ruta koja kreira događaj u kalendaru
- **Footer** — kontakt, navigacija, copyright
- **Sav tekst na hrvatskom**

---

## Što još treba napraviti / ideje

- [ ] Zamijeniti "DJ NAME" s pravim imenom
- [ ] Zamijeniti kontakt podatke u `Footer.tsx` (email, telefon)
- [ ] Zamijeniti social media linkove u `Footer.tsx`
- [ ] Podesiti Google Calendar integraciju (vidi dolje)
- [ ] Dodati pravu fotografiju ili video u hero sekciju
- [ ] Dodati sekciju s paketima i cijenama
- [ ] Dodati galeriju / recenzije
- [ ] Dodati vlastitu domenu i deployati na Vercel

---

## Google Calendar — postavljanje

1. Kopiraj `.env.local.example` → `.env.local`
2. Idi na [Google Cloud Console](https://console.cloud.google.com/)
3. Kreiraj projekt → uključi **Google Calendar API**
4. **IAM & Admin** → **Service Accounts** → kreiraj servisni račun
5. Preuzmi JSON ključ → kopiraj `client_email` i `private_key` u `.env.local`
6. U Google Calendaru dijeli kalendar s emailom servisnog računa (dozvola: *Unosi događaje*)
7. Kopiraj Calendar ID u `.env.local`

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL="..."
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID="primary"
GOOGLE_CALENDAR_TIMEZONE="Europe/Zagreb"
```

---

## Dostupnost kalendara — konfiguracija

Uredi datoteku: `src/lib/availability.ts`

```ts
// Koji dani su NEDOSTUPNI (0=Ned, 1=Pon, ..., 6=Sub)
export const BLACKOUT_WEEKDAYS = [1, 2, 3, 4]; // blokira pon–čet

// Blokiranje specifičnih datuma (format: "YYYY-MM-DD")
export const BLACKOUT_DATES = [
  // "2026-12-25",
];

// Minimalno dana unaprijed za rezervaciju
export const MIN_ADVANCE_DAYS = 3;
```

---

## Struktura projekta

```
src/
├── app/
│   ├── api/book/route.ts      ← Google Calendar API endpoint
│   ├── globals.css            ← stilovi, animacije
│   ├── layout.tsx             ← font, metadata, Toaster
│   └── page.tsx               ← glavna stranica
├── components/
│   ├── HeroSection.tsx        ← hero s animacijom
│   ├── BookingCalendar.tsx    ← kalendar (hr lokalizacija)
│   ├── BookingForm.tsx        ← obrazac za rezervaciju
│   ├── BookingSection.tsx     ← dvije kolone: kalendar + obrazac
│   └── Footer.tsx             ← footer
└── lib/
    ├── availability.ts        ← konfiguracija dostupnosti
    └── utils.ts               ← shadcn utils
```

---

## Tech stack

| Alat | Verzija | Svrha |
|---|---|---|
| Next.js | 16 | App Router framework |
| Tailwind CSS | v4 | Stilizacija |
| shadcn/ui | latest | UI komponente |
| react-hook-form | v7 | Upravljanje obrascem |
| Zod | v4 | Validacija podataka |
| date-fns | v4 | Datumi i lokalizacija |
| googleapis | v171 | Google Calendar API |
| Sonner | latest | Toast obavijesti |

---

*Zadnje ažurirano: 11. travnja 2026.*
