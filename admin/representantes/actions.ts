"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/affiliateAuth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/server/adminAuth";

function parseBrlToCents(value: FormDataEntryValue | null) {
  const raw = value?.toString().trim() || "0";
  return Math.round(parseFloat(raw.replace(".", "").replace(",", ".")) * 100);
}

function normalizeAffiliateCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toUpperCase();
}

async function requireAdmin() {
  if (!(await getIsAdmin())) redirect("/admin");
}

function redirectWithError(message: string) {
  redirect(`/admin/representantes/novo?error=${encodeURIComponent(message)}`);
}

export async function createAffiliate(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const whatsapp = formData.get("whatsapp")?.toString().replace(/\D/g, "") || "";
  const code = normalizeAffiliateCode(formData.get("code")?.toString().trim() || "");
  const password = formData.get("password")?.toString() || "";
  const commIda = parseBrlToCents(formData.get("commIda"));
  const commIdaVolta = parseBrlToCents(formData.get("commIdaVolta"));
  const type = formData.get("type")?.toString().trim() || "agency";

  if (!name || !email || !whatsapp || !code || !password) {
    redirectWithError("Preencha todos os campos obrigatórios.");
  }

  if (password.length < 6) {
    redirectWithError("A senha precisa ter pelo menos 6 caracteres.");
  }

  if (Number.isNaN(commIda) || Number.isNaN(commIdaVolta)) {
    redirectWithError("Informe valores de comissão válidos.");
  }

  const existing = await prisma.affiliate.findUnique({ where: { code } });
  if (existing) {
    redirectWithError("Já existe um representante com esse código.");
  }

  const affiliate = await prisma.affiliate.create({
    data: {
      name,
      email,
      whatsapp,
      code,
      password: await hashPassword(password),
      commIda,
      commIdaVolta,
      active: true,
      type,
    },
  });

  revalidatePath("/admin/representantes");
  redirect(`/admin/representantes/${affiliate.id}`);
}

export async function updateCommissions(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const id = formData.get("id") as string;
    const commIdaString = (formData.get("commIda") as string) || "0";
    const commIdaVoltaString = (formData.get("commIdaVolta") as string) || "0";

    // Converte o valor em BRL (ex: "25,00") para centavos
    const commIda = Math.round(parseFloat(commIdaString.replace(".", "").replace(",", ".")) * 100);
    const commIdaVolta = Math.round(
      parseFloat(commIdaVoltaString.replace(".", "").replace(",", ".")) * 100
    );

    if (!id || isNaN(commIda) || isNaN(commIdaVolta)) {
      return { ok: false, error: "Dados inválidos para atualizar comissões." };
    }

    await prisma.affiliate.update({
      where: { id },
      data: { commIda, commIdaVolta },
    });

    revalidatePath("/admin/representantes");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function createPayment(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const affiliateId = (formData.get("affiliateId") || formData.get("id")) as string;
    const amountCents = parseBrlToCents(formData.get("amount"));
    const note = formData.get("note") as string | undefined;

    if (!affiliateId || isNaN(amountCents) || amountCents <= 0) {
      return { ok: false, error: "Dados inválidos para criar pagamento." };
    }

    await prisma.affiliatePayment.create({
      data: { affiliateId, amountCents, note },
    });

    revalidatePath("/admin/representantes");
    revalidatePath(`/admin/representantes/${affiliateId}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
