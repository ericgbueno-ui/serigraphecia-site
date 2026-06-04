import type { APIRoute } from "astro";
import { getIsAdmin, ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";
import { prisma } from "../../../lib/prisma";
import crypto from "crypto";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieVal = cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!getIsAdmin(cookieVal)) return redirect("/admin", 302);

  const formData = await request.formData();

  const name = formData.get("name")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().replace(/\D/g, "") || "";
  const email = formData.get("email")?.toString().trim() || "";
  const tripType = formData.get("tripType")?.toString() || "ida_volta";
  const vehicleType = formData.get("vehicleType")?.toString() || "sedan";
  const passengerCount = parseInt(formData.get("passengerCount")?.toString() || "2", 10);
  const hotel = formData.get("hotel")?.toString().trim() || null;
  const idaDateRaw = formData.get("idaDate")?.toString();
  const idaFlightTime = formData.get("idaFlightTime")?.toString().trim() || null;
  const voltaDateRaw = formData.get("voltaDate")?.toString();
  const voltaFlightTime = formData.get("voltaFlightTime")?.toString().trim() || null;
  const payMethod = formData.get("payMethod")?.toString() || "pix";
  const affiliateCode = formData.get("affiliateCode")?.toString() || null;

  const totalCentsRaw = parseFloat(formData.get("totalCents")?.toString().replace(",", ".") || "0");
  const totalCents = Math.round(totalCentsRaw * 100);
  const depositCentsRaw = parseFloat(formData.get("depositCents")?.toString().replace(",", ".") || "0");
  const depositCents = Math.round(depositCentsRaw * 100);
  const remainderCents = Math.max(0, totalCents - depositCents);

  const idaDate = idaDateRaw ? new Date(`${idaDateRaw}T12:00:00-03:00`) : null;
  const voltaDate = voltaDateRaw ? new Date(`${voltaDateRaw}T12:00:00-03:00`) : null;

  try {
    // Upsert customer by phone
    let customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name, phone, email: email || `sem_email_${phone}@placeholder.local`, marketingOptIn: false },
      });
    }

    const publicToken = crypto.randomBytes(16).toString("hex");

    const booking = await prisma.booking.create({
      data: {
        publicToken,
        customerId: customer.id,
        tripType,
        vehicleType,
        passengerCount,
        hotel: hotel || undefined,
        idaDate: idaDate || undefined,
        idaFlightTime: idaFlightTime || undefined,
        voltaDate: voltaDate || undefined,
        voltaFlightTime: voltaFlightTime || undefined,
        origin: "Aeroporto de Porto Alegre (POA)",
        dest: "Gramado / Canela",
        routeLabel: "Transfer POA → Gramado/Canela",
        payMethod,
        totalCents,
        depositCents,
        remainderCents,
        status: "CONFIRMED",
        affiliateCode: affiliateCode || undefined,
      },
    });

    return redirect(`/admin/reservas/${booking.id}`, 302);
  } catch (err) {
    console.error("Erro ao criar reserva:", err);
    return redirect("/admin/nova-reserva?error=1", 302);
  }
};
