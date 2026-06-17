import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
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

    await prisma.booking.create({
      data: {
        publicToken:    crypto.randomBytes(16).toString("hex"),
        customerId:     customer.id,
        status:         "PENDING",
        tripType,
        vehicleType:    vehicleType || "n/a",
        passengerCount,
        hotel:          hotel         || undefined,
        idaFlightTime:  detalhes      || undefined,
        voltaFlightNumber: cores      || undefined,
        origin:         "Serigraph e Cia",
        dest:           "Cliente",
        payMethod:      "a_definir",
        totalCents,
        depositCents:   0,
        remainderCents: totalCents,
        affiliateCode:  affiliateCode || undefined,
      },
    });

    return redirect("/admin/leads", 302);
  } catch (err) {
    console.error("Erro ao criar orçamento:", err);
    return redirect("/admin/leads/novo?error=1", 302);
  }
};
