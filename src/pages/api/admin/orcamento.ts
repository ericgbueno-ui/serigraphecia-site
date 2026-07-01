import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { calculatePrintPrice, formatCents } from "../../../lib/pricing";
import { baixarEstoque } from "../../../lib/estoque";
import crypto from "crypto";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();
  const name         = formData.get("name")?.toString().trim() || "";
  const phone        = formData.get("phone")?.toString().replace(/\D/g, "") || "";
  const email        = formData.get("email")?.toString().trim() || "";
  const tripType     = formData.get("tripType")?.toString() || "alca_vazada";
  const vehicleType  = formData.get("vehicleType")?.toString().trim() || "";
  const passengerCount = parseInt(formData.get("passengerCount")?.toString() || "50", 10);
  const hotel        = formData.get("hotel")?.toString().trim() || null;
  
  const corSacola    = formData.get("corSacola")?.toString().trim() || "";
  const detailsRaw   = formData.get("idaFlightTime")?.toString().trim() || "";
  const detalhes     = corSacola ? `Cor da Sacola: ${corSacola}${detailsRaw ? ` | ${detailsRaw}` : ""}` : (detailsRaw || null);

  const cores        = formData.get("voltaDate")?.toString() || null;
  const affiliateCode = formData.get("affiliateCode")?.toString() || null;
  const totalRaw     = parseFloat(formData.get("totalCents")?.toString().replace(",", ".") || "0");
  const totalCents   = Math.round(totalRaw * 100);

  try {
    let customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name, phone, email: email || `sem_email_${phone}@placeholder.local`, marketingOptIn: false },
      });
    }

    // Support optional print pricing when provided in the quote form
    const printBaseRaw = formData.get("printBase")?.toString();
    const printSides = formData.get("printSides")?.toString() || "one";
    const colorsSideA = formData.get("colorsSideA")?.toString() || "0";
    const colorsSideB = formData.get("colorsSideB")?.toString() || "0";

    let computedTotalCents = totalCents;
    let optionalsObj: Record<string, unknown> = {};
    let optionalsCentsVal = 0;
    if (printBaseRaw) {
      const baseCents = Math.round(parseFloat(printBaseRaw.replace(",", ".")) * 100);
      const printResult = calculatePrintPrice(baseCents, {
        sides: printSides === "two" ? "two" : "one",
        colorsSideA: parseInt(colorsSideA || "0", 10) || 0,
        colorsSideB: parseInt(colorsSideB || "0", 10) || 0,
      });
      computedTotalCents += printResult.finalCents;
      optionalsObj.print = printResult;
      optionalsCentsVal = printResult.finalCents;
    }

    const notas = [hotel ? `Cidade/Estado: ${hotel}` : null, vehicleType ? `Tamanho: ${vehicleType}` : null, detalhes]
      .filter(Boolean)
      .join(" | ") || undefined;

    const novoPedido = await prisma.pedido.create({
      data: {
        publicToken:    crypto.randomBytes(16).toString("hex"),
        customerId:     customer.id,
        status:         "PENDING",
        tipoProduto:    tripType,
        corProduto:     corSacola || undefined,
        lados:          "um",
        coresLadoA:     parseInt(cores || "0", 10) || 0,
        quantidade:     passengerCount,
        internalNotes:  notas,
        payMethod:      "a_definir",
        totalCents:     computedTotalCents,
        depositCents:   0,
        remainderCents: computedTotalCents,
        optionalsJson:  Object.keys(optionalsObj).length ? JSON.stringify(optionalsObj) : undefined,
        optionalsCents: optionalsCentsVal,
        affiliateCode:  affiliateCode || undefined,
        // Fase 2 — auditoria 2026-07-01: data em que o orçamento foi de fato
        // solicitado. Sem um campo próprio no formulário ainda, usamos "agora"
        // (mesmo comportamento de antes, só que agora fica em campo estruturado).
        dataPedido:     new Date(),
      },
    });

    // Fase 2 — item do pedido (permite múltiplos produtos por pedido no futuro;
    // este é o primeiro item, criado a partir dos campos do orçamento).
    await prisma.itemPedido.create({
      data: {
        pedidoId: novoPedido.id,
        nome: tripType,
        cor: corSacola || undefined,
        quantidade: passengerCount || 1,
        valorUnitarioCents: passengerCount > 0 ? Math.round(computedTotalCents / passengerCount) : computedTotalCents,
        subtotalCents: computedTotalCents,
      },
    });

    // Baixa do estoque (não bloqueia o pedido caso não haja estoque suficiente)
    await baixarEstoque(prisma, tripType, corSacola, passengerCount);

    return redirect("/admin/leads", 302);
  } catch (err) {
    console.error("Erro ao criar orçamento:", err);
    return redirect("/admin/leads/novo?error=1", 302);
  }
};
