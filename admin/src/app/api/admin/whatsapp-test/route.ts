/**
 * GET /api/admin/whatsapp-test
 * Diagnóstico rápido da conexão WhatsApp Business API.
 * Verifica token, phone ID, e tenta buscar o perfil do número.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIsAdmin } from "@/lib/server/adminAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await getIsAdmin())) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const token = process.env.WHATSAPP_TOKEN ?? "";
  const phoneId = process.env.WHATSAPP_PHONE_ID ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";

  const result: Record<string, unknown> = {
    token_configurado: !!token,
    token_primeiros_chars: token ? token.slice(0, 12) + "..." : "❌ VAZIO",
    phone_id_configurado: !!phoneId,
    phone_id: phoneId || "❌ VAZIO",
  };

  if (!token || !phoneId) {
    return NextResponse.json({ ...result, erro: "Token ou Phone ID não configurados." });
  }

  // 1. Verifica se o Phone ID existe e retorna informações do número
  try {
    const phoneRes = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}?fields=display_phone_number,verified_name,status,quality_rating`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const phoneData = await phoneRes.json();

    if (!phoneRes.ok) {
      result.phone_check = "❌ FALHOU";
      result.phone_error = phoneData?.error?.message ?? `HTTP ${phoneRes.status}`;
      result.phone_error_code = phoneData?.error?.code;
      result.diagnostico = interpretarErro(phoneData?.error?.code, phoneData?.error?.message);
    } else {
      result.phone_check = "✅ OK";
      result.numero = phoneData.display_phone_number;
      result.nome_verificado = phoneData.verified_name;
      result.status = phoneData.status;
      result.qualidade = phoneData.quality_rating;
    }
  } catch (e: any) {
    result.phone_check = "❌ ERRO DE REDE";
    result.phone_error = e.message;
  }

  // 2. Se fornecido número de teste, tenta enviar uma mensagem real
  if (to) {
    const numLimpo = to.replace(/\D/g, "");
    try {
      const sendRes = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: numLimpo,
            type: "text",
            text: { body: "✅ Teste de conexão Multi Trip — mensagem de diagnóstico." },
          }),
        }
      );
      const sendData = await sendRes.json();

      if (!sendRes.ok) {
        result.teste_envio = "❌ FALHOU";
        result.envio_error = sendData?.error?.message;
        result.envio_error_code = sendData?.error?.code;
        result.diagnostico_envio = interpretarErro(sendData?.error?.code, sendData?.error?.message);
      } else {
        result.teste_envio = "✅ MENSAGEM ENVIADA";
        result.message_id = sendData?.messages?.[0]?.id;
      }
    } catch (e: any) {
      result.teste_envio = "❌ ERRO DE REDE";
      result.envio_error = e.message;
    }
  }

  return NextResponse.json(result, { status: 200 });
}

function interpretarErro(code?: number, message?: string): string {
  if (!code && !message) return "Erro desconhecido";
  const msg = (message ?? "").toLowerCase();

  if (code === 190 || msg.includes("token")) return "🔑 TOKEN EXPIRADO — gere um novo token em developers.facebook.com";
  if (code === 100 || msg.includes("invalid parameter")) return "📋 PHONE_ID INVÁLIDO — verifique o WHATSAPP_PHONE_ID no Vercel";
  if (code === 10 || msg.includes("permission")) return "🔒 PERMISSÃO NEGADA — token sem permissão whatsapp_business_messaging";
  if (msg.includes("template")) return "📝 TEMPLATE NÃO ENCONTRADO — verifique se o template está aprovado no Meta Business Manager";
  if (msg.includes("opt")) return "🚫 NÚMERO NÃO OPT-IN — o contato precisa ter iniciado conversa antes";
  if (code === 131030) return "🚫 NÚMERO INVÁLIDO — o número não está registrado no WhatsApp";

  return `Código ${code}: ${message}`;
}
