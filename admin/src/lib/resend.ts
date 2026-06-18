import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    // Remove BOM (﻿) e espaços — env vars da Vercel podem ter caracteres invisíveis
    const key = (process.env.RESEND_API_KEY ?? "").replace(/^﻿/, "").trim();
    if (!key) throw new Error("RESEND_API_KEY não configurado.");
    _resend = new Resend(key);
  }
  return _resend;
}

// ── From padrão ────────────────────────────────────────────────────────────
// Domínio verificado no Resend — configurar em RESEND_FROM_EMAIL
export function getFromEmail(): string {
  return (process.env.RESEND_FROM_EMAIL ?? "Jolie | Multi Trip <atendimento@multitrip.com.br>")
    .replace(/^﻿/, "").trim();
}

// ── Template HTML Multi Trip ───────────────────────────────────────────────

export function buildEmailHtml({
  title,
  body,
  ctaText,
  ctaUrl,
  firstName,
  footerNote,
  unsubscribeHref,
  hideSignature,
}: {
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  firstName?: string;
  footerNote?: string;
  unsubscribeHref?: string;
  hideSignature?: boolean;
}): string {
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";
  const bodyHtml = body.replace(/\n/g, "<br>");

  const ctaBlock =
    ctaText && ctaUrl
      ? `<div style="text-align:center;margin:32px 0;">
          <a href="${ctaUrl}"
             style="display:inline-block;background:#b48c3c;color:#0e0b05;text-decoration:none;
                    font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;
                    letter-spacing:0.03em;">
            ${ctaText}
          </a>
        </div>`
      : "";

  const signatureBlock = hideSignature ? "" : `
          <!-- Signature -->
          <tr>
            <td style="padding:0 36px 20px;">
              <p style="font-size:13px;color:#6b5a30;margin:0;">
                Com carinho,<br>
                <strong style="color:#b48c3c;">Jolie</strong> — Concierge Multi Trip
              </p>
            </td>
          </tr>`;

  const baseUrl = (process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || "https://multitrip.com.br")
    .replace(/^\uFEFF/, '').trim().replace(/\/+$/, '');

  const LOGO_URL = "https://multitrip.com.br/brand/logo-horizontal.webp";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0e0b05;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b05;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#141008;border-radius:16px;
                      border:1px solid #2a2214;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#1a1507;border-bottom:1px solid #2a2214;padding:20px 36px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <img
                      src="${LOGO_URL}"
                      alt="Multi Trip - Receptivo e Viagens"
                      width="160"
                      height="46"
                      style="display:block;height:auto;max-width:160px;"
                    />
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <span style="font-size:10px;font-weight:600;color:#6b5a30;
                                 text-transform:uppercase;letter-spacing:0.18em;
                                 white-space:nowrap;">
                      Receptivo &amp; Viagens
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 8px;">
              <h1 style="font-size:22px;font-weight:700;color:#f0e8d6;margin:0 0 20px;">
                ${title}
              </h1>
              <p style="font-size:15px;font-weight:600;color:#b48c3c;margin:0 0 16px;">
                ${greeting} 🤎
              </p>
              <p style="font-size:14px;color:#c8b89a;line-height:1.7;margin:0;">
                ${bodyHtml}
              </p>
              ${ctaBlock}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px;background:#2a2214;margin:20px 0;"></div>
            </td>
          </tr>
${signatureBlock}
          <!-- Footer -->
          <tr>
            <td style="background:#0e0b05;border-top:1px solid #2a2214;
                       padding:28px 36px 20px;text-align:center;">

              <!-- Logo no footer -->
              <div style="margin-bottom:16px;">
                <img
                  src="${LOGO_URL}"
                  alt="Multi Trip"
                  width="120"
                  style="display:inline-block;height:auto;max-width:120px;opacity:0.7;"
                />
              </div>

              <!-- Instagram -->
              <div style="margin-bottom:16px;">
                <a href="https://www.instagram.com/multitrip.receptivo"
                   style="display:inline-block;text-decoration:none;">
                  <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                    <tr>
                      <td style="background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);
                                 border-radius:8px;padding:7px 16px;vertical-align:middle;">
                        <span style="font-size:14px;vertical-align:middle;">📸</span>
                        <span style="font-size:12px;font-weight:700;color:#ffffff;
                                     letter-spacing:0.02em;margin-left:6px;vertical-align:middle;">
                          @multitrip.receptivo
                        </span>
                      </td>
                    </tr>
                  </table>
                </a>
              </div>

              <p style="font-size:11px;color:#3d3020;margin:0 0 6px;">
                Multi Trip Receptivo e Viagens · Gramado e Canela, RS
              </p>
              <p style="font-size:11px;color:#3d3020;margin:0;">
                ${footerNote ?? "Você está recebendo este e-mail porque demonstrou interesse em nossos serviços."}
              </p>
              ${unsubscribeHref ? `
              <p style="font-size:11px;color:#3d3020;margin:8px 0 0;">
                <a href="${unsubscribeHref}"
                   style="color:#4a3820;text-decoration:underline;">
                  Cancelar inscrição
                </a>
              </p>` : ""}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Envio individual ───────────────────────────────────────────────────────
// Usa SMTP Zoho (nodemailer) quando configurado → e-mail aparece no Zoho Mail enviados.
// Fallback para Resend caso SMTP não esteja disponível.

export async function sendMarketingEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ error?: { message: string } }> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;

  // ── Via SMTP Zoho ────────────────────────────────────────────────────────
  // Timeout curto: Vercel bloqueia SMTP outbound — falha rápido e usa Resend como fallback
  if (smtpHost && smtpUser && smtpPass) {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort ?? 587),
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    try {
      await transporter.sendMail({
        from: `"Jolie | Multi Trip" <${smtpUser}>`,
        to,
        subject,
        html,
      });
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[sendMarketingEmail] SMTP error, fazendo fallback para Resend:", message);
      // Não retorna erro — faz fallback para Resend abaixo
    }
  }

  // ── Fallback: Resend ─────────────────────────────────────────────────────
  const r = getResend();
  const result = await r.emails.send({ from: getFromEmail(), to, subject, html });
  if (result.error) return { error: { message: result.error.message } };
  return {};
}
