/**
 * /api/whatsapp — Webhook oficial Meta WhatsApp
 *
 * GET  → verificação do webhook (Meta challenge)
 * POST → mensagem recebida → Jolie (Gemini → GPT-4o-mini → Claude sonnet-4-6) → resposta
 *
 * Lógica completa migrada do projeto webhook-jolie:
 * - Histórico de conversa por cliente (via Interaction no Prisma)
 * - Memória de cliente (Lead no Prisma)
 * - Detecção de intenção + alerta para equipe
 * - Geração de link Mercado Pago quando Jolie emite GERAR_LINK_PAGAMENTO
 * - Criação de Booking no banco ao fechar reserva
 * - Lead scoring automático a cada interação
 */

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { JOLIE_SYSTEM } from "@/lib/jolie";
import { upsertLead, saveInteraction, trackLeadEvent, markLeadConverted } from "@/lib/lead";
import { notifyTeam } from "@/lib/notify";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAvailableGeminiModels } from "@/lib/gemini-models";
import { buildJolieFallbackReply } from "@/lib/jolie-fallback";
import { SITE } from "@/lib/site";
import { loadJoliePromptFromDB } from "@/lib/jolie/loader";
import { searchKnowledge, getClientMemory, buildDynamicPrompt } from "@/lib/jolie/rag";
import { learnFromConversion } from "@/lib/jolie/learning";
// Note: pricing/transfer removed for consolidated app. Keep minimal types for compatibility.
import type { PaxTier, PayMethod } from "@/lib/pricing";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─────────────────────────────────────────────
// ENV
// ─────────────────────────────────────────────

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN ?? "";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID ?? "";
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? "";

function getGeminiApiKey() {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "";
}

// ─────────────────────────────────────────────
// MAPEAMENTO: nome de veículo (Jolie/WhatsApp) → PaxTier (pricing.ts)
// ─────────────────────────────────────────────

const VEHICLE_NAME_TO_TIER: Record<string, PaxTier> = {
  "Sedan Premium": "sedan",
  "Spin 6 lugares": "van",
  "Sedan Executivo": "executivo",
  SUV: "suv",
  "SUV Elétrico": "suv_eletrico",
};

// ─────────────────────────────────────────────
// GET — Verificação do webhook Meta
// ─────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[whatsapp] Webhook verificado ✅");
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─────────────────────────────────────────────
// POST — Mensagem recebida
// ─────────────────────────────────────────────

/** Verifica assinatura HMAC-SHA256 enviada pela Meta no header x-hub-signature-256 */
async function verifyWebhookSignature(req: Request, rawBody: string): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // fail-closed: sem o secret, rejeita tudo para evitar spoofing.
    // AÇÃO NECESSÁRIA: adicione WHATSAPP_APP_SECRET nas env vars da Vercel.
    // Onde encontrar: Meta for Developers → App → Configurações básicas → App Secret
    console.error(
      "[JOLIE] ❌ CRÍTICO — WHATSAPP_APP_SECRET ausente ou vazio. " +
        "TODAS as mensagens WhatsApp estão sendo bloqueadas (fail-closed). " +
        "Corrija em: Vercel Dashboard → Settings → Environment Variables → WHATSAPP_APP_SECRET"
    );
    return false;
  }

  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    console.error("[whatsapp] ❌ Header x-hub-signature-256 ausente.");
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected =
    "sha256=" +
    Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return signature === expected;
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // Verificação de assinatura Meta (segurança anti-spoofing)
  const signatureValid = await verifyWebhookSignature(req, rawBody);
  if (!signatureValid) {
    console.error("[whatsapp] ❌ Assinatura inválida — request rejeitado.");
    return new Response("Forbidden", { status: 403 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = {};
  }

  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const messages = value?.messages;

  // Ignorar eventos que não são mensagens
  if (!messages?.length) {
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const message = messages[0];
  const from = message.from as string;
  const profileName = value.contacts?.[0]?.profile?.name ?? "Cliente";

  // Captura referral de Click-to-WhatsApp Ads (Meta)
  const referral = message.referral as {
    source_url?: string;
    source_type?: string;
    source_id?: string;
    headline?: string;
    ctwa_clid?: string;
  } | undefined;

  // ── Mensagens de mídia: áudio e imagem são processadas pela IA ──────────────
  if (message.type !== "text") {
    let textContent: string | null = null;

    if (message.type === "audio") {
      const mediaId = message.audio?.id;
      if (mediaId) {
        const media = await downloadWhatsAppMedia(mediaId).catch(() => null);
        if (media) {
          textContent = await transcribeAudio(media.data, media.mimeType).catch(() => null);
          if (textContent) textContent = `[Áudio do cliente transcrito]: ${textContent}`;
        }
      }
      if (!textContent) {
        const firstName = profileName.split(" ")[0];
        await sendWhatsApp(
          from,
          `${firstName}, recebi seu áudio 🤎 Tive um probleminha pra ouvir agora — pode escrever a mensagem? Assim consigo te responder na hora.`
        ).catch(() => {});
        return new Response("EVENT_RECEIVED", { status: 200 });
      }
    } else if (message.type === "image") {
      const mediaId = message.image?.id;
      const caption = message.image?.caption as string | undefined;
      if (mediaId) {
        const media = await downloadWhatsAppMedia(mediaId).catch(() => null);
        if (media) {
          textContent = await describeImage(media.data, media.mimeType, caption).catch(() => null);
          if (textContent) {
            textContent = caption
              ? `[Imagem com legenda "${caption}" — conteúdo identificado]: ${textContent}`
              : `[Imagem enviada pelo cliente — conteúdo identificado]: ${textContent}`;
          }
        }
      }
      if (!textContent) {
        const firstName = profileName.split(" ")[0];
        await sendWhatsApp(
          from,
          `${firstName}, recebi sua imagem 🤎 ${caption ? `Vi sua mensagem: "${caption}". ` : ""}Para anexos e documentos, pode enviar para nosso time: ${SITE.support.phone}`
        ).catch(() => {});
        return new Response("EVENT_RECEIVED", { status: 200 });
      }
    } else {
      // sticker, documento, localização, contato, etc.
      const firstName = profileName.split(" ")[0];
      await sendWhatsApp(
        from,
        `${firstName}, recebi sua mensagem 🤎 Pra documentos ou arquivos, nosso time pode ajudar direto: ${SITE.support.phone}`
      ).catch(() => {});
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    // Processa o conteúdo transcrito/descrito como se fosse texto
    await processMessage(from, textContent!, profileName);
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const userText = message.text.body as string;

  // Diagnóstico rápido de variáveis de ambiente
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error(
      "[whatsapp] ❌ Variáveis do WhatsApp ausentes na Vercel (WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID)."
    );
  }
  if (!getGeminiApiKey() && !process.env.OPENAI_API_KEY) {
    console.error("[whatsapp] ❌ Chaves de IA ausentes na Vercel (Gemini e OpenAI).");
  }

  console.log(`[whatsapp] 📩 ${profileName} (${from}): ${userText.slice(0, 80)}`);

  // Na Vercel, retornar a resposta imediatamente congela a execução de promises pendentes.
  // Precisamos usar await para garantir que a IA processe e envie a mensagem antes de encerrar.
  try {
    await processMessage(from, userText, profileName, referral);
  } catch (err: any) {
    console.error("[whatsapp] Erro fatal no processamento:", err);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}

// ─────────────────────────────────────────────
// Processamento principal (assíncrono)
// ─────────────────────────────────────────────

async function processMessage(
  from: string,
  userText: string,
  profileName: string,
  referral?: { source_url?: string; source_type?: string; source_id?: string; headline?: string; ctwa_clid?: string }
) {
  let historicoOrdenado: any[] = [];
  let leadId = "";
  let leadName = profileName;

  // 1. Extrai UTM e Ref do texto se houver, depois limpa o texto
  let parsedUtm: { utmSource?: string; utmMedium?: string; utmCampaign?: string } | null = null;
  const utmMatch = userText.match(/\(utm:\s*([^|)]+)\|([^|)]+)\|([^|)]+)\)/i);
  if (utmMatch) {
    parsedUtm = {
      utmSource: utmMatch[1].trim(),
      utmMedium: utmMatch[2].trim(),
      utmCampaign: utmMatch[3].trim(),
    };
  }

  // Limpa marcadores técnicos para não poluir o histórico nem confundir a IA
  const cleanedUserText = userText
    .replace(/\(utm:\s*([^|)]+)\|([^|)]+)\|([^|)]+)\)/gi, "")
    .replace(/\(Ref:\s*([^)]+)\)/gi, "")
    .trim();

  try {
    // 2. Upsert do lead no CRM
    // Se veio de anúncio Click-to-WhatsApp direto OU via UTM anexada no WhatsApp do site
    const isAdReferral = referral?.source_type === "ad" || !!referral?.ctwa_clid || !!parsedUtm;
    const lead = await upsertLead({
      whatsapp: from,
      name: profileName,
      source: isAdReferral ? "whatsapp_ad" : "whatsapp",
      ...(isAdReferral ? {
        utmSource:   parsedUtm?.utmSource ?? "whatsapp",
        utmMedium:   parsedUtm?.utmMedium ?? "cpc",
        utmCampaign: parsedUtm?.utmCampaign ?? referral?.headline ?? referral?.source_id ?? "meta_ad",
      } : {}),
    });
    leadId = lead.id;
    leadName = lead.name ?? profileName;

    // 3. Scoring: evento de resposta (usa o texto limpo)
    await trackLeadEvent(from, "response", { preview: cleanedUserText.slice(0, 100) });

    // 4. Busca histórico das últimas 40 interações
    const historico = await prisma.interaction.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    historicoOrdenado = historico.reverse();

    // 5. Salva mensagem do cliente (usa o texto limpo)
    await saveInteraction({ whatsapp: from, role: "lead", content: cleanedUserText });
  } catch (err: any) {
    console.error("[whatsapp] ⚠️ Erro no Banco (Prisma). Continuando sem histórico.", err.message);
  }

  // 6. Extrai estado da conversa (data, pax, trajeto) para controle de fase (usa o texto limpo)
  const estado = await extrairEstadoConversa(cleanedUserText, historicoOrdenado);
  console.log(
    `[whatsapp] 📊 Estado: data=${estado.data} pax=${estado.pax} trajeto=${estado.trajeto} tipoTrip=${estado.tipoTrip}`
  );

  // 7. Chama Jolie com RAG + memória do cliente (usa o texto limpo)
  const { text: reply, engine: replyEngine } = await callJolie(
    cleanedUserText,
    historicoOrdenado,
    leadName,
    estado,
    leadId
  );

  // 7. Verifica se Jolie quer gerar link de pagamento
  // For consolidated app: we no longer auto-create bookings or generate payment links.
  // Always send the AI reply but strip any internal GERAR_LINK_PAGAMENTO tokens and
  // redirect users to human support for purchase/booking flows.
  const sanitizedReply = reply.replace(/GERAR_LINK_PAGAMENTO/g, "").trim();
  const finalReply = `${sanitizedReply}\n\nPara concluir reservas ou pagamentos, por favor converse com nossa equipe: ${SITE.support.phone}`;

  await sendWhatsApp(from, finalReply);

  if (leadId) {
    try {
      await saveInteraction({
        whatsapp: from,
        role: "jolie",
        content: sanitizedReply || finalReply,
        aiEngine: replyEngine,
      });
    } catch {}
    // Track that the user was redirected to human support
    await trackLeadEvent(from, "redirected_to_support", { method: "whatsapp" }).catch(() => {});
  }

  try {
    const { querHumano } = detectarIntencao(userText, reply);
    if (querHumano) await alertarEquipe("quer_humano", from, profileName, userText);
  } catch {}
}

// ─────────────────────────────────────────────
// Jolie — Gemini com histórico estruturado
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Estado da conversa (dados coletados)
// ─────────────────────────────────────────────

interface EstadoConversa {
  data: string | null;
  pax: number | null;
  trajeto: string | null;
  /** "ida" = só aeroporto→Serra | "volta" = só Serra→aeroporto | "ida_volta" = ambos | null = não informado */
  tipoTrip: "ida" | "volta" | "ida_volta" | null;
}

/**
 * Extrai data, pax, trajeto e tipo de trip do histórico via Gemini Flash.
 * Reconhece "só a chegada", "só a volta", "ida e volta" como trajetos válidos e completos.
 */
async function extrairEstadoConversa(
  userText: string,
  historico: Array<{ role: string; content: string }>
): Promise<EstadoConversa> {
  const vazio: EstadoConversa = { data: null, pax: null, trajeto: null, tipoTrip: null };

  const geminiKey = getGeminiApiKey();
  if (!geminiKey) return vazio;

  const textoHistorico = [
    ...historico.slice(-10).map((m) => `${m.role === "jolie" ? "Jolie" : "Cliente"}: ${m.content}`),
    `Cliente: ${userText}`,
  ].join("\n");

  const prompt = `Analise esta conversa de WhatsApp de uma empresa de transfer turístico (Porto Alegre ↔ Gramado/Canela).
Extraia as informações que o CLIENTE forneceu. Responda APENAS com JSON puro, sem markdown.

Campos:
- "data": data da viagem mencionada (ex: "25/06", "15 de julho") ou null
- "pax": número inteiro de pessoas ou null
- "trajeto": descrição do trajeto mencionado (ex: "POA→Gramado", "Gramado→POA", "ida e volta") ou null
- "tipoTrip": classifique o tipo de serviço:
    "ida" = só chegada / só ida / aeroporto para hotel / "só a chegada" / "só o in" / "só o transfer de ida"
    "volta" = só retorno / só volta / hotel para aeroporto / "só a volta" / "só o out" / "só o transfer de volta"
    "ida_volta" = ida E volta / transfer completo / "ida e volta"
    null = cliente não deixou claro se é ida, volta ou os dois

CONVERSA:
${textoHistorico}

Responda SOMENTE: {"data": "...", "pax": N, "trajeto": "...", "tipoTrip": "..."}`;

  try {
    const availableModels = await getAvailableGeminiModels();
    const genAI = new GoogleGenerativeAI(geminiKey);
    for (const modelName of availableModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0, maxOutputTokens: 150 },
        });
        const result = await model.generateContent(prompt);
        const text = result.response
          .text()
          .replace(/```json|```/gi, "")
          .trim();
        const parsed = JSON.parse(text);
        return {
          data: parsed.data ?? null,
          pax: parsed.pax ? parseInt(String(parsed.pax)) : null,
          trajeto: parsed.trajeto ?? null,
          tipoTrip: (["ida", "volta", "ida_volta"].includes(parsed.tipoTrip)
            ? parsed.tipoTrip
            : null) as EstadoConversa["tipoTrip"],
        };
      } catch {
        continue;
      }
    }
  } catch {
    return vazio;
  }
  return vazio;
}

/**
 * Gera instrução de fase baseada no que já foi coletado.
 * Esta instrução é injetada no systemPrompt da Jolie antes de cada resposta.
 */
/**
 * Trajeto é considerado suficiente quando:
 * - tipoTrip está definido ("ida", "volta" ou "ida_volta") — cliente deixou claro o serviço
 * - OU trajeto textual foi mencionado
 * Não exige os dois lados do percurso — só ida ou só volta é serviço completo.
 */
function trajetoSuficiente(estado: EstadoConversa): boolean {
  return !!(estado.tipoTrip || estado.trajeto);
}

function gerarInstrucaoFase(estado: EstadoConversa, clienteName: string): string {
  const temTrajeto = trajetoSuficiente(estado);

  const faltam: string[] = [];
  if (!estado.data) faltam.push("DATA da viagem");
  if (!estado.pax) faltam.push("QUANTIDADE DE PESSOAS");
  if (!temTrajeto) faltam.push("TIPO DE SERVIÇO (só chegada, só volta ou ida e volta?)");

  const tipoLabel: Record<NonNullable<EstadoConversa["tipoTrip"]>, string> = {
    ida: "Só chegada (aeroporto → hotel)",
    volta: "Só retorno (hotel → aeroporto)",
    ida_volta: "Ida e volta",
  };

  const coletados: string[] = [];
  if (estado.data) coletados.push(`Data: ${estado.data}`);
  if (estado.pax) coletados.push(`Pessoas: ${estado.pax}`);
  if (estado.tipoTrip) coletados.push(`Serviço: ${tipoLabel[estado.tipoTrip]}`);
  else if (estado.trajeto) coletados.push(`Trajeto: ${estado.trajeto}`);

  const bloqueioAbsoluto = `
[IDENTIDADE E AUTORIDADE — INEGOCIÁVEL]
Você é JOLIE. Concierge oficial e autoridade máxima da Multi Trip.
JAMAIS diga: "vou acionar a equipe", "aguarde a equipe", "vou gerar seu link agora", "nossa equipe entrará em contato".
JAMAIS presuma dados que o cliente não forneceu explicitamente.
Você mesmo conduz. Você mesmo resolve. Do início ao fim.
Nome do cliente: ${clienteName}.`;

  if (faltam.length === 0) {
    return `${bloqueioAbsoluto}

[FASE ATUAL: FECHAMENTO]
Dados completos: ${coletados.join(" | ")}
Agora sim: apresente 3 benefícios do transfer privativo (ancoragem de valor) e então apresente o preço com PIX e parcelamento.
Conduza para o fechamento com elegância. Pergunte a forma de pagamento preferida.`;
  }

  if (faltam.length >= 3) {
    return `${bloqueioAbsoluto}

[FASE ATUAL: DIAGNÓSTICO INICIAL]
Nenhum dado coletado ainda.
Faça UMA pergunta natural que colete data, pessoas e se é só a chegada, só a volta ou ida e volta.
Exemplo: "Me conta: quantas pessoas vão, qual a data e é só o transfer de chegada ou ida e volta?"`;
  }

  // Dados parciais
  const proxDado = faltam[0];
  const validacao = estado.data
    ? `Perfeito, ${estado.data} anotado!`
    : estado.pax
      ? `Perfeito, ${estado.pax} ${estado.pax === 1 ? "pessoa" : "pessoas"} anotado!`
      : "Perfeito!";

  return `${bloqueioAbsoluto}

[FASE ATUAL: COLETA COMPLEMENTAR]
Já coletado: ${coletados.join(" | ")}
Falta apenas: ${proxDado}
${validacao} Faça UMA pergunta elegante para coletar somente isso.
NÃO apresente preços. NÃO gere links. Só colete o que falta.`;
}

async function callJolie(
  userText: string,
  historico: Array<{ role: string; content: string }>,
  clienteName: string,
  estado: EstadoConversa,
  leadId?: string
): Promise<{ text: string; engine: string }> {
  const instrucaoFase = gerarInstrucaoFase(estado, clienteName);

  // Monta prompt dinamicamente via RAG
  let systemPrompt: string;
  try {
    const [corePrompt, knowledgeChunks, clientMemory] = await Promise.all([
      loadJoliePromptFromDB().then((p) => p ?? JOLIE_SYSTEM),
      searchKnowledge(userText, 5, leadId || undefined),
      leadId ? getClientMemory(leadId) : Promise.resolve(null),
    ]);
    systemPrompt = buildDynamicPrompt(corePrompt, knowledgeChunks, clientMemory, instrucaoFase);
  } catch {
    // Fallback seguro: usa o prompt estático
    systemPrompt = `${JOLIE_SYSTEM}\n\n${instrucaoFase}`;
  }

  // Agrupa mensagens consecutivas do mesmo role (evita erro 400 do Gemini)
  const rawContents = [
    ...historico.map((m) => ({
      role: m.role === "jolie" ? "model" : "user",
      text: m.content,
    })),
    { role: "user", text: userText },
  ];

  const contents: Array<{ role: string; parts: [{ text: string }] }> = [];
  for (const msg of rawContents) {
    const last = contents[contents.length - 1];
    if (last && last.role === msg.role) {
      last.parts[0].text += `\n${msg.text}`;
    } else {
      contents.push({ role: msg.role, parts: [{ text: msg.text }] });
    }
  }

  // Gemini exige que a primeira mensagem seja do "user"
  if (contents.length > 0 && contents[0].role === "model") {
    contents.shift();
  }

  const debugErrors: string[] = [];

  // ── 1º — Gemini (primário) ───────────────────────────────────────────────
  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    const availableModels = await getAvailableGeminiModels();
    const genAI = new GoogleGenerativeAI(geminiKey);

    for (const modelName of availableModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent({ contents });
        const text = result.response.text();

        if (text) {
          console.log(`[whatsapp] 🤖 Gemini [${modelName}] OK`);
          return { text, engine: `gemini/${modelName}` };
        }
      } catch (err: any) {
        console.warn(`[whatsapp] Gemini [${modelName}] falhou: ${err.message}`);
        debugErrors.push(`Gemini ${modelName}: ${err.message}`);
      }
    }
  } else {
    debugErrors.push("Gemini: chave ausente");
  }

  // ── 2º — Claude sonnet-4-6 (fallback 1) ────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (anthropicKey) {
    try {
      console.log(`[whatsapp] 🤖 Acionando Claude sonnet-4-6...`);
      const claudeMessages = contents.map((msg) => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.parts[0].text,
      }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          temperature: 0.75,
          system: systemPrompt,
          messages: claudeMessages,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = (data as any).content?.[0]?.text;
        if (text) {
          console.log("[whatsapp] 🤖 Claude sonnet-4-6 OK");
          return { text, engine: "claude-sonnet-4-6" };
        }
      } else {
        const err = await res.json().catch(() => ({}));
        debugErrors.push(`Claude: ${(err as any)?.error?.message ?? res.status}`);
        console.warn("[whatsapp] Claude falhou:", (err as any)?.error?.message ?? res.status);
      }
    } catch (err: any) {
      debugErrors.push(`Claude fetch: ${err.message}`);
      console.warn("[whatsapp] Claude falhou:", err.message);
    }
  } else {
    debugErrors.push("Claude: chave ausente");
  }

  // ── 3º — ChatGPT (fallback 2) ───────────────────────────────────────────
  const openaiKey = process.env.OPENAI_API_KEY ?? "";
  if (openaiKey) {
    try {
      console.log(`[whatsapp] 🤖 Acionando GPT-4o-mini...`);
      const openaiMessages = [
        { role: "system", content: systemPrompt },
        ...contents.map((msg) => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.parts[0].text,
        })),
      ];

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: openaiMessages,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          console.log(`[whatsapp] 🤖 GPT-4o-mini OK`);
          return { text, engine: "gpt-4o-mini" };
        }
      } else {
        const err = await res.json();
        debugErrors.push(`GPT: ${err.error?.message || res.status}`);
        console.warn(`[whatsapp] GPT falhou: ${err.error?.message || res.status}`);
      }
    } catch (err: any) {
      debugErrors.push(`GPT fetch: ${err.message}`);
      console.warn(`[whatsapp] GPT falhou: ${err.message}`);
    }
  } else {
    debugErrors.push("GPT: chave ausente");
  }

  // ── Fallback estático ────────────────────────────────────────────────────
  console.error(`[whatsapp] Todas as IAs falharam: ${debugErrors.join(" | ")}`);
  const fallbackInput = [
    ...historico.map((m) => `${m.role === "jolie" ? "Jolie" : "Cliente"}: ${m.content}`),
    `Cliente: ${userText}`,
  ].join("\n");
  return { text: buildJolieFallbackReply(fallbackInput), engine: "fallback" };
}

// ─────────────────────────────────────────────
// Envio de mensagem WhatsApp (Meta API)
// ─────────────────────────────────────────────

async function sendWhatsApp(to: string, text: string) {
  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
      signal: AbortSignal.timeout(8_000),
    });

    const data = await res.json();
    if (!res.ok) {
      const code: number | null = (data as any)?.error?.code ?? null;
      const subcode: number | null = (data as any)?.error?.error_subcode ?? null;
      const msg: string = (data as any)?.error?.message ?? res.status;
      const codeStr = code !== null ? `#${code}${subcode !== null ? `.${subcode}` : ""}` : "";
      let hint = "";
      if (code === 100) hint = " — Verifique WHATSAPP_PHONE_ID (pode estar errado para esta conta)";
      if (code === 190) hint = " — Token expirado, regenere em Meta for Developers";
      console.error(`[whatsapp] ❌ Meta Erro ${codeStr}: ${msg}${hint}`);
      return null;
    }

    console.log(`[whatsapp] 📤 Enviado para ${to} — OK`);
    return data;
  } catch (err: any) {
    console.error(`[whatsapp] Erro ao enviar mensagem: ${err.message}`);
  }
}

// ─────────────────────────────────────────────
// Mídia: download, transcrição e visão
// ─────────────────────────────────────────────

/** Baixa um arquivo de mídia da Meta API e retorna o buffer + mimeType */
async function downloadWhatsAppMedia(
  mediaId: string
): Promise<{ data: Buffer; mimeType: string } | null> {
  // Passo 1: resolve a URL do arquivo
  const infoRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!infoRes.ok) return null;
  const info = await infoRes.json();
  const mediaUrl: string = info.url;
  const mimeType: string = info.mime_type ?? "application/octet-stream";

  // Passo 2: baixa o arquivo
  const fileRes = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (!fileRes.ok) return null;

  const arrayBuffer = await fileRes.arrayBuffer();
  return { data: Buffer.from(arrayBuffer), mimeType };
}

/** Transcreve áudio (OGG, MP4, WebM) usando OpenAI Whisper */
async function transcribeAudio(data: Buffer, mimeType: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;

  // Mapeia mimeType → extensão aceita pelo Whisper
  const ext = mimeType.includes("ogg")
    ? "ogg"
    : mimeType.includes("mp4") || mimeType.includes("m4a")
      ? "mp4"
      : mimeType.includes("webm")
        ? "webm"
        : mimeType.includes("mpeg") || mimeType.includes("mp3")
          ? "mp3"
          : "ogg"; // WhatsApp voz padrão é OGG/Opus

  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(data)], { type: mimeType }), `audio.${ext}`);
  formData.append("model", "whisper-1");
  formData.append("language", "pt");
  formData.append("response_format", "text");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: formData,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    console.warn("[whatsapp] Whisper falhou:", res.status);
    return null;
  }

  const text = (await res.text()).trim();
  console.log(`[whatsapp] 🎙️ Áudio transcrito: "${text.slice(0, 80)}..."`);
  return text || null;
}

/** Descreve o conteúdo de uma imagem usando Gemini Vision */
async function describeImage(
  data: Buffer,
  mimeType: string,
  caption?: string
): Promise<string | null> {
  const geminiKey = getGeminiApiKey();
  if (!geminiKey) return null;

  const availableModels = await getAvailableGeminiModels();
  const genAI = new GoogleGenerativeAI(geminiKey);

  const base64 = data.toString("base64");
  const promptText = caption
    ? `O cliente de uma empresa de transfer turístico enviou esta imagem com a legenda: "${caption}". Descreva o conteúdo relevante em 2-3 frases (documentos, passagens, vouchers, recibos, mapas, etc.).`
    : `O cliente de uma empresa de transfer turístico enviou esta imagem. Descreva o conteúdo relevante em 2-3 frases (documentos, passagens, vouchers, recibos, comprovantes de pagamento, etc.).`;

  for (const modelName of availableModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { inlineData: { mimeType: mimeType.split(";")[0], data: base64 } },
        promptText,
      ]);

      const text = result.response.text().trim();
      if (text) {
        console.log(`[whatsapp] 📷 Imagem descrita: "${text.slice(0, 80)}..."`);
        return text;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// Detecção de intenção
// ─────────────────────────────────────────────

function detectarIntencao(userText: string, reply: string) {
  const texto = (userText + " " + reply).toLowerCase();

  const sinaisQuaseFechando = [
    "confirmar",
    "confirmo",
    "fechar",
    "reservar",
    "quero reservar",
    "vamos lá",
    "pode fazer",
    "pode agendar",
    "topo",
    "fechado",
    "como pago",
    "link de pagamento",
    "pix",
  ];
  const sinaisHumano = [
    "falar com",
    "atendente",
    "humano",
    "pessoa",
    "eric",
    "rita",
    "responsável",
    "gerente",
    "dono",
  ];

  return {
    quaseFechando: sinaisQuaseFechando.some((s) => texto.includes(s)),
    querHumano: sinaisHumano.some((s) => texto.includes(s)),
  };
}

// ─────────────────────────────────────────────
// Alertas para a equipe (Rita e Eric)
// ─────────────────────────────────────────────

async function alertarEquipe(
  tipo: "quase_fechando" | "quer_humano",
  telefone: string,
  nome: string,
  userText: string,
  replyJolie?: string
) {
  let msg = "";
  if (tipo === "quase_fechando") {
    msg =
      `🔥 *CLIENTE QUASE FECHANDO*\n\n` +
      `👤 ${nome}\n📱 +${telefone}\n` +
      `💬 "${userText}"\n` +
      (replyJolie ? `🤖 Jolie: "${replyJolie.slice(0, 120)}..."\n` : "") +
      `\n_Entre agora para garantir o fechamento!_`;
  } else {
    msg =
      `🙋 *CLIENTE QUER FALAR COM HUMANO*\n\n` +
      `👤 ${nome}\n📱 +${telefone}\n` +
      `💬 "${userText}"`;
  }
  await notifyTeam(msg).catch(() => {});
}

// ─────────────────────────────────────────────
// Extrai dados estruturados da reserva via Gemini
// ─────────────────────────────────────────────

async function extrairDadosReserva(
  historico: Array<{ role: string; content: string }>,
  telefone: string
) {
  const historicoTexto = historico
    .map((m) => `${m.role === "jolie" ? "Jolie" : "Cliente"}: ${m.content}`)
    .join("\n");

  const prompt = `Com base nessa conversa, extraia os dados da reserva em JSON puro (sem markdown).
Se não encontrar a informação, use null.
Veículos possíveis: "Sedan Premium" | "Spin 6 lugares" | "Sedan Executivo" | "SUV" | "SUV Elétrico".
Pagamentos: "pix" ou "cartao". pixModelo: "pix_50" (entrada 50%) ou "pix_100" (PIX total).
rota: "poa_gramado" (origem Aeroporto POA/Salgado Filho) ou "caxias_gramado" (origem Aeroporto CXJ/Caxias).
Valores em centavos (R$499,80 = 49980). Sedan Premium ida e volta = 49980. Spin = 89980. Executivo/SUV = 69980.

CONVERSA:
${historicoTexto}

Retorne APENAS JSON:
{"data":"DD/MM","partida":"texto","destino":"texto","pessoas":2,"veiculo":"texto","pagamento":"pix","pixModelo":"pix_50","valorTotal":49980,"rota":"poa_gramado","retorno":"DD/MM ou null","horario_voo":"10h30 ou null","addons":{"recepcao":0,"romantica":0},"childSeats":{"bebe_conforto":0,"cadeirinha":0,"assento_elevacao":0},"hasChildUnder10":false}`;

  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    const availableModels = await getAvailableGeminiModels();
    const genAI = new GoogleGenerativeAI(geminiKey);
    for (const modelName of availableModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0 },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) {
          const cleaned = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
          return JSON.parse(cleaned);
        }
      } catch {
        continue;
      }
    }
  }

  // Fallback GPT para extrair os dados também
  const openaiKey = process.env.OPENAI_API_KEY ?? "";
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          const cleaned = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
          return JSON.parse(cleaned);
        }
      }
    } catch {}
  }

  return {};
}

// ─────────────────────────────────────────────
// Gera link Mercado Pago individual
// ─────────────────────────────────────────────

async function gerarLinkMP() {
  // Mercado Pago integration disabled for consolidated admin.
  console.warn("[whatsapp] gerarLinkMP chamado, mas integração está desativada.");
  return null;
}

// ─────────────────────────────────────────────
// Cria Booking no banco do site (via Prisma)
// ─────────────────────────────────────────────

async function criarBookingWhats() {
  // Booking creation disabled in consolidated admin. Log and return null.
  console.warn("[whatsapp] criarBookingWhats chamado, mas criação de bookings está desativada.");
  return null;
}

// ─────────────────────────────────────────────
// Fluxo completo de geração de link
// ─────────────────────────────────────────────

async function handleGerarLink(telefone: string) {
  // Simplified flow: inform user to contact support and notify team.
  await sendWhatsApp(
    telefone,
    `Para concluir sua reserva ou pagamento, entre em contato com nossa equipe: ${SITE.support.phone} 🤎`
  ).catch(() => {});
  await notifyTeam(`Lead via WhatsApp precisa de atendimento manual: +${telefone}`).catch(() => {});
}
