/**
 * google-ads.ts — Integração com Google Ads API v17 (REST)
 *
 * Requer variáveis de ambiente:
 *   GOOGLE_ADS_DEVELOPER_TOKEN   — token de desenvolvedor da conta MCC
 *   GOOGLE_ADS_CLIENT_ID         — OAuth Client ID
 *   GOOGLE_ADS_CLIENT_SECRET     — OAuth Client Secret
 *   GOOGLE_ADS_REFRESH_TOKEN     — Refresh Token (gerado via OAuth playground)
 *   GOOGLE_ADS_CUSTOMER_ID       — ID da conta (sem hífens, ex: 1234567890)
 *
 * Como gerar as credenciais:
 *   1. Acesse: https://ads.google.com/home/tools/manager-accounts/
 *   2. Solicite acesso de desenvolvedor à API do Google Ads
 *   3. Crie credenciais OAuth em console.cloud.google.com
 *   4. Gere o refresh token via OAuth 2.0 Playground
 */

const BASE_URL = "https://googleads.googleapis.com/v17";

interface GoogleAdsConfig {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
}

function getConfig(): GoogleAdsConfig | null {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, "");

  if (!developerToken || !clientId || !clientSecret || !refreshToken || !customerId) {
    return null;
  }

  return { developerToken, clientId, clientSecret, refreshToken, customerId };
}

async function getAccessToken(cfg: GoogleAdsConfig): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`[google-ads] Falha ao obter access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export interface GoogleAdsCampaignRow {
  campaignId: string;
  campaignName: string;
  status: string;
  impressions: number;
  clicks: number;
  cost: number;       // em reais
  conversions: number;
  ctr: number;        // %
  cpc: number;        // R$
  cpa: number;        // R$ por conversão
  roas: number;       // estimado
}

export interface GoogleAdsInsights {
  dateRange: { start: string; end: string };
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  campaigns: GoogleAdsCampaignRow[];
}

/**
 * Busca insights de campanhas para um intervalo de datas.
 * Retorna null se as credenciais não estiverem configuradas.
 */
export async function fetchGoogleAdsInsights(
  startDate: string,
  endDate: string
): Promise<GoogleAdsInsights | null> {
  const cfg = getConfig();
  if (!cfg) {
    console.warn("[google-ads] Credenciais não configuradas. Configure GOOGLE_ADS_* no .env.");
    return null;
  }

  const accessToken = await getAccessToken(cfg);

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `;

  const res = await fetch(
    `${BASE_URL}/customers/${cfg.customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": cfg.developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[google-ads] Erro na API: ${res.status} ${err}`);
  }

  const data = await res.json();
  const rows: GoogleAdsCampaignRow[] = (data.results ?? []).map((r: any) => {
    const costMicros = Number(r.metrics?.costMicros ?? 0);
    const costBRL = costMicros / 1_000_000;
    const conversions = Number(r.metrics?.conversions ?? 0);
    const clicks = Number(r.metrics?.clicks ?? 0);

    return {
      campaignId: String(r.campaign?.id ?? ""),
      campaignName: r.campaign?.name ?? "—",
      status: r.campaign?.status ?? "UNKNOWN",
      impressions: Number(r.metrics?.impressions ?? 0),
      clicks,
      cost: costBRL,
      conversions,
      ctr: Number(r.metrics?.ctr ?? 0) * 100,
      cpc: Number(r.metrics?.averageCpc ?? 0) / 1_000_000,
      cpa: conversions > 0 ? costBRL / conversions : 0,
      roas: conversions > 0 ? (conversions * 499) / costBRL : 0, // estimativa com ticket ~R$499
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      spend: acc.spend + r.cost,
      clicks: acc.clicks + r.clicks,
      impressions: acc.impressions + r.impressions,
      conversions: acc.conversions + r.conversions,
    }),
    { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
  );

  return {
    dateRange: { start: startDate, end: endDate },
    totalSpend: totals.spend,
    totalClicks: totals.clicks,
    totalImpressions: totals.impressions,
    totalConversions: totals.conversions,
    campaigns: rows,
  };
}

export function isGoogleAdsConfigured(): boolean {
  return getConfig() !== null;
}
