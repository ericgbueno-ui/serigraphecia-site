/**
 * Utilitário para a Facebook Marketing API (Meta Ads).
 * Requer META_ADS_ACCESS_TOKEN e META_ADS_ACCOUNT_ID no .env
 *
 * Permissões necessárias no token: ads_read
 * Gera token de longa duração em:
 * https://developers.facebook.com/tools/explorer/
 */

export interface MetaAdInsight {
  date: string;       // "YYYY-MM-DD"
  spend: number;      // BRL
  impressions: number;
  clicks: number;
  reach: number;
}

const API_VERSION = "v22.0";
const BASE_URL = "https://graph.facebook.com";

/**
 * Busca os insights de gasto por dia para um período.
 * @param since  "YYYY-MM-DD" — data inicial (inclusive)
 * @param until  "YYYY-MM-DD" — data final (inclusive)
 */
export async function fetchMetaAdInsights(
  since: string,
  until: string
): Promise<MetaAdInsight[]> {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_ACCOUNT_ID; // ex: act_1234567890

  if (!token || !accountId) {
    throw new Error(
      "META_ADS_ACCESS_TOKEN ou META_ADS_ACCOUNT_ID não configurados."
    );
  }

  const params = new URLSearchParams({
    fields: "spend,impressions,clicks,reach",
    time_range: JSON.stringify({ since, until }),
    time_increment: "1",
    access_token: token,
  });

  const normalizedId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  const url = `${BASE_URL}/${API_VERSION}/${normalizedId}/insights?${params}`;

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(
      `Meta Ads API error: ${JSON.stringify(json.error ?? json)}`
    );
  }

  return (json.data ?? []).map((d: Record<string, string>) => ({
    date: d.date_start,
    spend: parseFloat(d.spend ?? "0"),
    impressions: parseInt(d.impressions ?? "0", 10),
    clicks: parseInt(d.clicks ?? "0", 10),
    reach: parseInt(d.reach ?? "0", 10),
  }));
}

/** Retorna "YYYY-MM-DD" de uma Date no fuso de Brasília. */
export function toBrtDateString(d: Date = new Date()): string {
  return d
    .toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/** Subtrai N dias de uma data BRT e retorna "YYYY-MM-DD". */
export function brtDateMinus(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return toBrtDateString(d);
}
