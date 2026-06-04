import dotenv from "dotenv";
dotenv.config();

import { criarEventoZoho } from "../src/lib/zoho-calendar";

async function main() {
  console.log("Testing Zoho Calendar...");
  const uid = await criarEventoZoho({
    bookingId: "test_" + Date.now(),
    clienteName: "Teste Antigravity",
    clientePhone: "51999999999",
    veiculo: "sedan",
    idaDate: new Date(Date.now() + 86400000), // tomorrow
    idaFlightTime: "14:30",
    idaFlightNumber: "G31234",
    partida: "Aeroporto Salgado Filho (POA)",
    destino: "Gramado",
    passengerCount: 2,
    totalCents: 50000,
    origem: "manual",
  });
  console.log("RESULT UID:", uid);
}

main().catch(console.error);
