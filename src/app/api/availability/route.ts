import { NextResponse } from "next/server";
import { getGoogleAccessToken, listCalendarEvents } from "@/lib/google-calendar";

export const runtime = "nodejs";

export async function GET() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";

  if (!serviceAccountEmail || !privateKey) {
    return NextResponse.json(
      { busyDates: [], debug: "missing_env", has_email: !!serviceAccountEmail, has_key: !!privateKey },
      { status: 200 }
    );
  }

  try {
    const accessToken = await getGoogleAccessToken(
      serviceAccountEmail,
      privateKey,
      "https://www.googleapis.com/auth/calendar.readonly"
    );

    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setMonth(now.getMonth() + 12);

    const events = await listCalendarEvents(
      accessToken,
      calendarId,
      now.toISOString(),
      maxDate.toISOString()
    );


    const busyDates = new Set<string>();

    for (const event of events) {
      if (event.start?.date) {
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
      if (event.start?.dateTime) {
        const toLocalStr = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const start = new Date(event.start.dateTime);
        const end = new Date(event.end?.dateTime ?? event.start.dateTime);
        const durationMs = end.getTime() - start.getTime();
        const cursor = new Date(start);
        cursor.setHours(0, 0, 0, 0);

        if (durationMs <= 24 * 60 * 60 * 1000) {
          busyDates.add(toLocalStr(cursor));
        } else {
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
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/availability]", err);
    return NextResponse.json({ busyDates: [], debug: "error", error: msg }, { status: 200 });
  }
}
