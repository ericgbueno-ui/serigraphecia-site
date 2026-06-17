import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import { calculatePrintPrice, formatCents } from "../../../lib/pricing";
import crypto from "crypto";

export const prerender = false;

async function gerarNumeroPedido(): Promise<string> {
  const count = await prisma.booking.count();
  const num = String(count + 1).padStart(4, "0");
  return `SG-${num}`;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();

  const name        = formData.get("name")?.toString().trim() || "";
  const phone       = formData.get("phone")?.toString().replace(/\D/g, "") || "";
  const email       = formData.get("email")?.toString().trim() || "";
  const tripType    = formData.get("tripType")?.toString() || "alca_vazada";
  const vehicleType = formData.get("vehicleType")?.toString().trim() || "";
  const passengerCount = parseInt(formData.get("passengerCount")?.toString() || "50", 10);
  const hotel       = formData.get("hotel")?.toString().trim() || null;
  const idaDateRaw  = formData.get("idaDate")?.toString();

  const corSacola   = formData.get("corSacola")?.toString().trim() || "";
  const detailsRaw  = formData.get("idaFlightTime")?.toString().trim() || "";
  const idaFlightTime = corSacola ? `Cor da Sacola: ${corSacola}${detailsRaw ? ` | ${detailsRaw}` : ""}` : (detailsRaw || null);

  const voltaDate_raw = formData.get("voltaDate")?.toString();
  const payMethod   = formData.get("payMethod")?.toString() || "pix";
  const affiliateCode = formData.get("affiliateCode")?.toString() || null;

  const totalCentsRaw   = parseFloat(formData.get("totalCents")?.toString().replace(",", ".") || "0");
  const totalCents      = Math.round(totalCentsRaw * 100);
  const depositCentsRaw = parseFloat(formData.get("depositCents")?.toString().replace(",", ".") || "0");
  const depositCents    = Math.round(depositCentsRaw * 100);
  const remainderCents  = Math.max(0, totalCents - depositCents);

  const idaDate   = idaDateRaw   ? new Date(`${idaDateRaw}T12:00:00-03:00`)   : null;
  const voltaDate = voltaDate_raw ? new Date(`${voltaDate_raw}T12:00:00-03:00`) : null;

  try {
    let customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name, phone, email: email || `sem_email_${phone}@placeholder.local`, marketingOptIn: false },
      });
    }

    const publicToken   = crypto.randomBytes(16).toString("hex");
    const numeroPedido  = await gerarNumeroPedido();

    // --- Impressão (opcional) ---
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

    const finalRemainderCents = Math.max(0, computedTotalCents - depositCents);

    const booking = await prisma.booking.create({
      data: {
        publicToken,
        numeroPedido,
        customerId: customer.id,
        tripType,
        vehicleType: vehicleType || "n/a",
        passengerCount,
        hotel:          hotel          || undefined,
        idaDate:        idaDate        || undefined,
        idaFlightTime:  idaFlightTime  || undefined,
        voltaDate:      voltaDate      || undefined,
        origin: "Serigraph e Cia",
        dest:   "Cliente",
        payMethod,
        // Totais (incluindo possíveis opcionais de impressão)
        totalCents: computedTotalCents,
        depositCents,
        remainderCents: finalRemainderCents,
        optionalsJson: Object.keys(optionalsObj).length ? JSON.stringify(optionalsObj) : undefined,
        optionalsCents: optionalsCentsVal,
        status: "CONFIRMED",
        affiliateCode:  affiliateCode  || undefined,
      },
    });

    return redirect(`/admin/reservas/${booking.id}`, 302);
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    return redirect("/admin/nova-reserva?error=1", 302);
  }
};
