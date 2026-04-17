import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { google } from "googleapis";
import { format } from "date-fns";
import { hr } from "date-fns/locale/hr";

export const runtime = "nodejs";

const SECRET = process.env.BOOKING_SECRET ?? "change-me-in-production";

interface BookingPayload {
  name: string;
  location: string;
  date: string;
  time: string;
  guestCount: number;
  phone: string;
  exp: number;
}

function verifyToken(token: string): BookingPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts as [string, string];
  const expectedSig = createHmac("sha256", SECRET).update(b64).digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString()) as BookingPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function html(title: string, message: string, color: string, baseUrl: string) {
  const isSuccess = color === "#16a34a";
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  ${isSuccess ? `<meta http-equiv="refresh" content="4;url=${baseUrl}" />` : ""}
  <style>
    body { margin: 0; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fafafa; }
    .box { background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 48px 40px; max-width: 480px; text-align: center; }
    .icon { font-size: 2.5rem; margin-bottom: 16px; }
    h1 { margin: 0 0 12px; font-size: 20px; color: #09090b; }
    p { margin: 0; font-size: 14px; color: #71717a; line-height: 1.6; }
    .note { margin-top: 16px; font-size: 12px; color: #a1a1aa; }
    .badge { display: inline-block; margin-top: 20px; padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: 600; background: ${color}22; color: ${color}; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">${isSuccess ? "✅" : "❌"}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="badge">${title}</div>
    ${isSuccess ? `<p class="note">Preusmjeravanje na stranicu za 4 sekunde…</p>` : ""}
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (!token) return html("Neispravan zahtjev", "Token nedostaje.", "#dc2626", baseUrl);

  const data = verifyToken(token);
  if (!data) {
    return html(
      "Link nije valjan",
      "Ovaj link za odobrenje je istekao ili nije ispravan.",
      "#dc2626",
      baseUrl
    );
  }

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";
  const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE ?? "Europe/Zagreb";

  if (!serviceAccountEmail || !privateKey) {
    return html("Greška", "Google Calendar nije konfiguriran.", "#dc2626", baseUrl);
  }

  try {
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const startDateTime = new Date(`${data.date}T${data.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 4 * 60 * 60 * 1000);
    const dateLabel = format(new Date(data.date), "EEEE, d. MMMM yyyy.", { locale: hr });

    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `DJ Booking: ${data.name} @ ${data.location}`,
        location: data.location,
        description: [
          `👤 Klijent: ${data.name}`,
          `📍 Lokacija: ${data.location}`,
          `👥 Gosti: ${data.guestCount}`,
          `📞 Telefon: ${data.phone}`,
          `⏰ Početak: ${startDateTime.toLocaleString("hr-HR")}`,
          `⏰ Kraj: ${endDateTime.toLocaleString("hr-HR")}`,
        ].join("\n"),
        start: { dateTime: startDateTime.toISOString(), timeZone },
        end: { dateTime: endDateTime.toISOString(), timeZone },
        colorId: "9",
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 60 },
          ],
        },
      },
    });

    return html(
      "Rezervacija potvrđena",
      `${data.name} — ${dateLabel} u ${data.time}h dodano je u Google Calendar.`,
      "#16a34a",
      baseUrl
    );
  } catch (err) {
    console.error("[/api/approve]", err);
    return html("Greška", "Događaj nije mogao biti dodan u kalendar. Pokušajte ponovo.", "#dc2626", baseUrl);
  }
}
