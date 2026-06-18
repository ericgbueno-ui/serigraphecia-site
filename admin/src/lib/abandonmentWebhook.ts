import type { AbandonData } from "@/app/components/AbandonTracker";

export async function sendAbandonmentWebhook(data: Partial<AbandonData>) {
  const webhookUrl = process.env.ABANDONMENT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("⚠️ ABANDONMENT_WEBHOOK_URL não está configurada no .env");
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "cart_abandonment",
        timestamp: new Date().toISOString(),
        data,
      }),
    });
  } catch (error) {
    console.error("Erro ao enviar webhook de abandono:", error);
  }
}
