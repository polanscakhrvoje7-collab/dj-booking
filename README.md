# DJ Hrchoy — Booking Site

Single-page booking website for DJ Hrchoy. Visitors pick an available date, fill in event details, and the booking is written directly to Google Calendar via a service account.

**Stack:** Next.js · React · Tailwind CSS v4 · shadcn/ui · Google Calendar API · Zod · react-hook-form

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Google credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values — see the comments inside for step-by-step setup instructions.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
  app/
    page.tsx              # Main page (Hero + Booking + Footer)
    layout.tsx            # Root layout (fonts, ThemeProvider, Toaster)
    globals.css           # Tailwind v4 theme tokens
    api/book/route.ts     # POST /api/book — validates & creates Google Calendar event
  components/
    HeroSection.tsx       # Full-screen hero with CTA
    BookingSection.tsx    # Calendar + form container
    BookingCalendar.tsx   # react-day-picker with availability rules
    BookingForm.tsx       # react-hook-form booking form
    Footer.tsx            # Contact links (email, phone, Instagram)
    ui/                   # shadcn/ui primitives
  lib/
    availability.ts       # Availability config (blackout days, advance notice, etc.)
    utils.ts              # cn() helper
```

---

## Availability Configuration

Edit `src/lib/availability.ts` to control which dates are bookable:

- `BLACKOUT_WEEKDAYS` — days of the week that are never available (default: Mon–Thu)
- `BLACKOUT_DATES` — specific dates to block (e.g. holidays)
- `MIN_ADVANCE_DAYS` — minimum days notice required (default: 3)
- `MAX_MONTHS_AHEAD` — how far ahead someone can book (default: 12 months)

These rules are enforced both in the calendar UI **and** on the server in `/api/book`.

---

## Deployment

The app runs on the Node.js runtime (`export const runtime = "nodejs"` in the API route, required for the `googleapis` package).

Set the same environment variables from `.env.local.example` in your hosting provider's dashboard before deploying.
