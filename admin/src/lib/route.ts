import { NextResponse } from "next/server";
import { syncToZoho, getZohoToken } from "@/lib/zoho-calendar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // TODO: Implementar a validação do HMAC Shignature para segurança (x-webhook-signature)

    const reservation = body.reservation;
    if (!reservation || !reservation.id) {
      return NextResponse.json({ error: "Payload de reserva inválido" }, { status: 400 });
    }

    const accessToken = await getZohoToken();
    const calendarId = process.env.ZOHO_CALENDAR_ID; // O ID do calendário destino

    if (!calendarId || !accessToken) {
      throw new Error("Configurações do Zoho Calendar ausentes no ambiente.");
    }

    // Faz a sincronização real (POST ou PATCH automático pelo ext_id)
    const result = await syncToZoho(calendarId, accessToken, reservation);

    // TODO: Atualizar status de sucesso no banco de dados da Multi Trip
    // await db.updateReservationSyncStatus(reservation.id, 'synced', result.event_uid);

    return NextResponse.json({
      success: true,
      event_uid: result.event_uid,
    });

  } catch (error: any) {
    console.error("Erro na sincronização Zoho:", error);

    // TODO: No caso de erro, devemos salvar no banco de dados o erro.
    // A partir desse status 'failed', o botão isolado na página da reserva
    // aparecerá para permitir o retry manual pelo usuário/admin.
    /*
    if (body.reservation?.id) {
       await db.updateReservationSyncStatus(body.reservation.id, 'failed', null, error.message);
    }
    */

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
