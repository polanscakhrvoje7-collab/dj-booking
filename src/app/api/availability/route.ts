import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function GET() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";
  const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE ?? "Europe/Zagreb";

  if (!serviceAccountEmail || !privateKey) {
    return NextResponse.json({ busyDates: [] }, { status: 200 });
  }

  try {
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setMonth(now.getMonth() + 12);

    const res = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: maxDate.toISOString(),
      singleEvents: true,
      maxResults: 2500,
    });

    const events = res.data.items ?? [];

    // Convert every event to the set of "YYYY-MM-DD" dates it covers
    const busyDates = new Set<string>();
    for (const event of events) {
      // All-day event: start.date / end.date (YYYY-MM-DD strings)
      if (event.start?.date) {
        // All-day: strings are already "YYYY-MM-DD", parse as local midnight
        const start = new Date(`${event.start.date}T00:00:00`);
        const end = new Date(`${(event.end?.date ?? event.start.date)}T00:00:00`);
        const cursor = new Date(start);
        while (cursor < end) {
          const y = cursor.getFullYear();
          const m = String(cursor.getMonth() + 1).padStart(2, "0");
          const d = String(cursor.getDate()).padStart(2, "0");
          busyDates.add(`${y}-${m}-${d}`);
          cursor.setDate(cursor.getDate() + 1);
        }
        continue;
      }
      // Timed event: start.dateTime / end.dateTime
      if (event.start?.dateTime) {
        const toLocalStr = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const start = new Date(event.start.dateTime);
        const end = new Date(event.end?.dateTime ?? event.start.dateTime);
        const durationMs = end.getTime() - start.getTime();

        const cursor = new Date(start);
        cursor.setHours(0, 0, 0, 0);

        if (durationMs <= 24 * 60 * 60 * 1000) {
          // Event under 24h (e.g. DJ booking 4h) — block only the start date
          busyDates.add(toLocalStr(cursor));
        } else {
          // Multi-day block — block every day from start to end
          const endCursor = new Date(end);
          endCursor.setHours(0, 0, 0, 0);
          while (cursor <= endCursor) {
            busyDates.add(toLocalStr(cursor));
            cursor.setDate(cursor.getDate() + 1);
          }
        }
      }
    }

    return NextResponse.json(
      { busyDates: Array.from(busyDates) },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err) {
    console.error("[/api/availability]", err);
    return NextResponse.json({ busyDates: [] }, { status: 200 });
  }
}
