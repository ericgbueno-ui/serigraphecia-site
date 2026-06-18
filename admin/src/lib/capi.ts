import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1297864089124981";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = "v22.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface CapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
}

export interface CapiEvent {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: Record<string, unknown>;
}

export async function sendCapiEvent(event: CapiEvent): Promise<void> {
  if (!ACCESS_TOKEN) return;

  const ud: Record<string, string> = {};
  if (event.userData.email) ud.em = sha256(event.userData.email);
  if (event.userData.phone) ud.ph = sha256(event.userData.phone.replace(/\D/g, ""));
  if (event.userData.firstName) ud.fn = sha256(event.userData.firstName);
  if (event.userData.lastName) ud.ln = sha256(event.userData.lastName);
  if (event.userData.externalId) ud.external_id = sha256(event.userData.externalId);
  if (event.userData.clientIpAddress) ud.client_ip_address = event.userData.clientIpAddress;
  if (event.userData.clientUserAgent) ud.client_user_agent = event.userData.clientUserAgent;
  if (event.userData.fbp) ud.fbp = event.userData.fbp;
  if (event.userData.fbc) ud.fbc = event.userData.fbc;

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl ?? `https://multitrip.com.br`,
        action_source: "website",
        user_data: ud,
        ...(event.customData ? { custom_data: event.customData } : {}),
      },
    ],
  };

  try {
    await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
  } catch {
    // silently fail — never block the request
  }
}
