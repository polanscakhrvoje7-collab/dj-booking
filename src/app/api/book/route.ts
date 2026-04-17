import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import nodemailer from "nodemailer";
import { z } from "zod";
import { isDateAvailable } from "@/lib/availability";
import { format } from "date-fns";
import { hr } from "date-fns/locale/hr";

export const runtime = "nodejs";

// ── Rate limiter ───────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ipHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => t > now - RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

// ── Validation schema ──────────────────────────────────────────────────────────
const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().min(5, "Please provide a full address"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  guestCount: z.coerce.number().int().min(1).max(500),
  phone: z.string().min(7, "Phone number too short"),
});

type BookingData = z.infer<typeof bookingSchema>;

// ── Token helpers ──────────────────────────────────────────────────────────────
const SECRET = process.env.BOOKING_SECRET ?? "change-me-in-production";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function createToken(data: BookingData): string {
  const payload = { ...data, exp: Date.now() + TOKEN_TTL_MS };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

// ── Email ──────────────────────────────────────────────────────────────────────
async function sendApprovalEmail(data: BookingData, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const approveUrl = `${baseUrl}/api/approve?token=${token}`;

  const dateLabel = format(new Date(data.date), "EEEE, d. MMMM yyyy.", { locale: hr });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"DJ Hrchoy Booking" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `📅 Nova rezervacija: ${data.name} — ${dateLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;border:1px solid #e4e4e7;border-radius:8px">
        <h2 style="margin:0 0 24px;font-size:20px;color:#09090b">Nova rezervacija čeka potvrdu</h2>

        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#3f3f46">
          <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a;width:140px">Ime</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-weight:600;color:#09090b">${data.name}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">Datum</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-weight:600;color:#09090b">${dateLabel}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">Vrijeme</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-weight:600;color:#09090b">${data.time}h</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">Lokacija</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-weight:600;color:#09090b">${data.location}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#71717a">Broj gostiju</td><td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-weight:600;color:#09090b">${data.guestCount}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a">Telefon</td><td style="padding:8px 0;font-weight:600;color:#09090b">${data.phone}</td></tr>
        </table>

        <div style="margin-top:32px">
          <a href="${approveUrl}" style="display:inline-block;background:#09090b;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none">
            ✅ Odobri i dodaj u kalendar
          </a>
        </div>

        <p style="margin-top:24px;font-size:12px;color:#a1a1aa">
          Link vrijedi 7 dana. Ako ne odobriš, rezervacija neće biti dodana u kalendar.
        </p>
      </div>
    `,
  });
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Previše zahtjeva. Pokušajte ponovo za nekoliko minuta." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? "Validation failed.", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const requestedDate = new Date(`${data.date}T${data.time}:00`);
  if (requestedDate < new Date()) {
    return NextResponse.json({ error: "The requested date and time is in the past." }, { status: 422 });
  }

  if (!isDateAvailable(new Date(data.date))) {
    return NextResponse.json({ error: "The selected date is not available for booking." }, { status: 422 });
  }

  // Check Google Calendar for existing events
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const availRes = await fetch(`${baseUrl}/api/availability`);
    const availData = await availRes.json() as { busyDates: string[] };
    if (availData.busyDates?.includes(data.date)) {
      return NextResponse.json({ error: "The selected date is already booked." }, { status: 422 });
    }
  } catch {
    // If check fails, proceed anyway
  }

  try {
    const token = createToken(data);
    await sendApprovalEmail(data, token);

    return NextResponse.json(
      { success: true, message: "Zahtjev za rezervaciju je poslan. Čekajte potvrdu." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/book] Email error:", err);
    return NextResponse.json({ error: "Slanje zahtjeva nije uspjelo. Pokušajte ponovo." }, { status: 500 });
  }
}
