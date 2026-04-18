/**
 * Lightweight Google Calendar client using fetch + Web Crypto API.
 * Works on Cloudflare Workers without googleapis.
 */

function b64url(obj: object): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function getGoogleAccessToken(
  email: string,
  privateKeyPem: string,
  scope: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${b64url(header)}.${b64url(payload)}`;

  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${arrayBufferToBase64Url(signatureBuffer)}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = (await resp.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`Google auth failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export interface CalendarEvent {
  summary: string;
  location?: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

export async function listCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<Array<{ start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string } }>> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    maxResults: "2500",
  });

  const resp = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Calendar list failed (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as { items?: Array<{ start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string } }> };
  return data.items ?? [];
}

export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEvent
): Promise<void> {
  const resp = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Calendar insert failed (${resp.status}): ${err}`);
  }
}
