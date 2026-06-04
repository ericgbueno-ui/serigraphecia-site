"use client";

import { useMemo, useState } from "react";
import {
  calcularTransfer,
  paxToTier,
  ADDONS,
  CHILD_SEAT_LABELS,
  CHILD_SEAT_TYPES,
  type CanonicalRoute,
  type AddonId,
  type ChildSeatId,
} from "@/lib/pricing";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ManualBookingForm({
  action,
  affiliates = [],
  initialLead,
}: {
  action: (formData: FormData) => void;
  affiliates?: { id: string; name: string; code: string }[];
  initialLead?: { name?: string; whatsapp?: string; email?: string };
}) {
  const [tripType, setTripType] = useState<"ida_volta" | "ida" | "volta" | "so_citytour">("ida_volta");
  const [passengerCount, setPassengerCount] = useState<number>(2);
  const [payMethod, setPayMethod] = useState<"pix_total" | "pix_50" | "link">("pix_total");
  const [addons, setAddons] = useState<Partial<Record<AddonId, number>>>({});
  const [childSeats, setChildSeats] = useState<Partial<Record<ChildSeatId, number>>>({});
  const [extrasValue, setExtrasValue] = useState("");
  const [cityTourEnabled, setCityTourEnabled] = useState(false);
  const [cityTourDate, setCityTourDate] = useState("");
  const [cityTourDest, setCityTourDest] = useState("Gramado e Canela");
  const [cityTourValue, setCityTourValue] = useState("");

  const [manualTotalOverride, setManualTotalOverride] = useState("");
  const [isManualTotal, setIsManualTotal] = useState(false);
  const [arrivalRouteId, setArrivalRouteId] = useState<CanonicalRoute>("poa_gramado");
  const [departureRouteId, setDepartureRouteId] = useState<CanonicalRoute>("poa_gramado");
  const [submitting, setSubmitting] = useState(false);

  const pax = useMemo(() => paxToTier(passengerCount), [passengerCount]);
  const basePayMethod = payMethod === "link" ? "cartao" : "pix";

  const calc = useMemo(() => {
    if (tripType === "so_citytour") {
      return { base: 0, addonsTotal: 0, total: 0 };
    }

    if (tripType === "ida_volta") {
      const ida = calcularTransfer({
        pax,
        tripType: "ida",
        payMethod: basePayMethod,
        routeId: arrivalRouteId,
        addons,
      });
      const volta = calcularTransfer({
        pax,
        tripType: "volta",
        payMethod: basePayMethod,
        routeId: departureRouteId,
        addons: {},
      });
      const baseCombined = ida.base + volta.base;
      return {
        ...ida,
        base: baseCombined,
        total: baseCombined + ida.addonsTotal,
      };
    }

    return calcularTransfer({
      pax,
      tripType,
      payMethod: basePayMethod,
      routeId: arrivalRouteId,
      addons,
    });
  }, [pax, tripType, basePayMethod, addons, arrivalRouteId, departureRouteId]);

  const isOnlyCityTour = tripType === "so_citytour";
  const extrasNum = parseFloat(extrasValue.replace(",", ".")) || 0;
  const cityTourNum = (isOnlyCityTour || cityTourEnabled) ? parseFloat(cityTourValue.replace(",", ".")) || 0 : 0;
  const calculatedTotal = (calc.total + extrasNum + cityTourNum).toFixed(2);
  const totalValue = isManualTotal ? manualTotalOverride : calculatedTotal;

  function handleArrivalRouteChange(routeId: CanonicalRoute) {
    setArrivalRouteId(routeId);
    if (routeId !== "poa_gramado") {
      setAddons((prev) => {
        const next = { ...prev };
        delete next.romantica;
        return next;
      });
    }
  }

  function toggleAddon(id: AddonId, checked: boolean) {
    setAddons((prev) => {
      const next = { ...prev };
      if (!checked) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  function setAddonQty(id: AddonId, qty: number) {
    setAddons((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, ADDONS[id].maxQty);
      return next;
    });
  }

  function setChildSeatQty(id: ChildSeatId, qty: number) {
    setChildSeats((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, 6);
      return next;
    });
  }

  const hasChildUnder10 = Object.values(childSeats).some((q) => (q ?? 0) > 0);
  const cityTour = (isOnlyCityTour || cityTourEnabled)
    ? { enabled: true, date: cityTourDate, dest: cityTourDest, valueCents: Math.round(cityTourNum * 100) }
    : null;
  const optionalsJson = JSON.stringify({ addons, childSeats, hasChildUnder10, cityTour });

  return (
    <form
      action={action}
      onSubmit={() => setSubmitting(true)}
      className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-2xl"
    >
      {/* Dados do Cliente */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/10 pb-2">Dados do Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider">Nome Completo</label>
            <input
              name="name"
              required
              defaultValue={initialLead?.name ?? ""}
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="João da Silva"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider">
              WhatsApp <span className="text-white/30 normal-case">(opcional)</span>
            </label>
            <input
              name="whatsapp"
              defaultValue={initialLead?.whatsapp ?? ""}
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="51999999999"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider">
              CPF do Contratante <span className="text-white/30 normal-case">(opcional)</span>
            </label>
            <input
              name="cpf"
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="000.000.000-00"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">
              E-mail (opcional)
            </label>
            <input
              name="email"
              type="email"
              defaultValue={initialLead?.email ?? ""}
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="cliente@email.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-amber-500/80 uppercase tracking-wider font-semibold">
              Parceiro Afiliado (Opcional)
            </label>
            <select
              name="affiliateCode"
              className="w-full mt-1 bg-black/60 border border-amber-500/20 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none appearance-none [color-scheme:dark]"
            >
              <option value="">Nenhum - Venda Direta</option>
              {affiliates.map((aff) => (
                <option key={aff.id} value={aff.code}>
                  {aff.name} ({aff.code})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-white/30 mt-1">
              Selecione para atribuir comissão automática a este parceiro.
            </p>
          </div>
        </div>
      </div>

      {/* Detalhes da Viagem */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/10 pb-2">Detalhes da Viagem</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider">Trajeto</label>
            <select
              name="tripType"
              value={tripType}
              onChange={(e) => {
                const val = e.target.value as any;
                setTripType(val);
                if (val === "so_citytour") {
                  setCityTourEnabled(true);
                }
              }}
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none appearance-none [color-scheme:dark]"
            >
              <option value="ida_volta">Chegada In + Retorno Out</option>
              <option value="ida">Somente Chegada In</option>
              <option value="volta">Somente Retorno Out</option>
              <option value="so_citytour">Só City Tour</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider">Passageiros</label>
            <input
              name="passengerCount"
              type="number"
              min="1"
              max="6"
              value={passengerCount}
              onChange={(e) => setPassengerCount(parseInt(e.target.value) || 2)}
              required
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider">
              Origem/Pagamento
            </label>
            <select
              name="payMethodInput"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none appearance-none [color-scheme:dark]"
            >
              <option value="pix_total">Pix Total</option>
              <option value="pix_50">Pix 50% (Sinal)</option>
              <option value="link">Cartão / Link</option>
            </select>
            <input type="hidden" name="payMethod" value={payMethod} />
          </div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {tripType !== "so_citytour" ? (
              <>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider">
                    {tripType === "ida_volta" ? "Aeroporto de Chegada In" : "Aeroporto / Trajeto"}
                  </label>
                  <select
                    name="arrivalRouteId"
                    value={arrivalRouteId}
                    onChange={(e) => handleArrivalRouteChange(e.target.value as CanonicalRoute)}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none appearance-none [color-scheme:dark]"
                  >
                    <option value="poa_gramado">✈️ POA ↔ Gramado/Canela</option>
                    <option value="caxias_gramado">✈️ Caxias do Sul ↔ Gramado/Canela</option>
                  </select>
                </div>

                {tripType === "ida_volta" && (
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">
                      Aeroporto de Partida (Retorno Out)
                    </label>
                    <select
                      name="departureRouteId"
                      value={departureRouteId}
                      onChange={(e) => setDepartureRouteId(e.target.value as any)}
                      className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none appearance-none [color-scheme:dark]"
                    >
                      <option value="poa_gramado">✈️ POA ↔ Gramado/Canela</option>
                      <option value="caxias_gramado">✈️ Caxias do Sul ↔ Gramado/Canela</option>
                    </select>
                  </div>
                )}
              </>
            ) : (
              <>
                <input type="hidden" name="arrivalRouteId" value="poa_gramado" />
                <input type="hidden" name="departureRouteId" value="poa_gramado" />
              </>
            )}
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider">
                Hotel / Local de Destino
              </label>
              <input
                name="hotel"
                required
                className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Nome do Hotel"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">
                Endereço Completo
              </label>
              <input
                name="hotelAddress"
                className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Rua..., Número..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold">
                Ponto de Embarque Alternativo{" "}
                <span className="text-white/30 normal-case font-normal">
                  (quando não é o aeroporto — ex: hotel em POA)
                </span>
              </label>
              <input
                name="pickupAddress"
                className="w-full mt-1 bg-black/40 border border-amber-500/20 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Ex: Hotel Ibis POA — Av. Farrapos, 45"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Nº de Veículos
                </label>
                <select
                  name="vehicleCount"
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none appearance-none [color-scheme:dark]"
                >
                  <option value="1">1 veículo</option>
                  <option value="2">2 veículos</option>
                  <option value="3">3 veículos</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  2º Veículo (se houver)
                </label>
                <select
                  name="secondVehicle"
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none appearance-none [color-scheme:dark]"
                >
                  <option value="">—</option>
                  <option value="sedan">Sedan Premium</option>
                  <option value="van">Spin (Van)</option>
                  <option value="suv">SUV</option>
                  <option value="executivo">Sedan Executivo</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/10 pb-2">
          Dados dos Passageiros
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: passengerCount }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row gap-4 bg-black/20 p-4 rounded-xl border border-white/5"
            >
              <div className="flex-1">
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Nome Completo (Pax {i + 1})
                </label>
                <input
                  name={`paxName_${i}`}
                  required
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Maria da Silva"
                />
              </div>
              <div className="flex-1 md:max-w-xs">
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Documento (CPF/RG)
                </label>
                <input
                  name={`paxDoc_${i}`}
                  required
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Apenas números"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {tripType !== "so_citytour" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/10 pb-2">Informações de Voo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-blue-400">Chegada In (Chegada em POA)</h3>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Data Chegada In
                </label>
                <input
                  name="idaDate"
                  type="date"
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none [color-scheme:dark]"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Horário</label>
                  <input
                    name="idaTime"
                    type="time"
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none [color-scheme:dark]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Nº do Voo</label>
                  <input
                    name="idaFlight"
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="Ex: G3 1234"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-purple-400">Retorno Out (Partida de POA)</h3>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Data Retorno Out
                </label>
                <input
                  name="voltaDate"
                  type="date"
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none [color-scheme:dark]"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Horário</label>
                  <input
                    name="voltaTime"
                    type="time"
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none [color-scheme:dark]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Nº do Voo</label>
                  <input
                    name="voltaFlight"
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="Ex: AD 4321"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opcionais e Extras */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/10 pb-2">Opcionais e Extras</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Rota Romântica — só para poa_gramado */}
          {arrivalRouteId === "poa_gramado" && (
            <label className="flex items-start gap-3 bg-black/20 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition">
              <input
                type="checkbox"
                checked={!!addons.romantica}
                onChange={(e) => toggleAddon("romantica", e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/10 bg-black/40 focus:ring-emerald-500 text-emerald-500"
              />
              <div>
                <p className="text-sm text-white/90 font-medium">{ADDONS.romantica.label}</p>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                  + {brl(ADDONS.romantica.price)}
                </p>
              </div>
            </label>
          )}

          {/* Recepção no aeroporto */}
          <label className="flex items-start gap-3 bg-black/20 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition">
            <input
              type="checkbox"
              checked={!!addons.recepcao}
              onChange={(e) => toggleAddon("recepcao", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/10 bg-black/40 focus:ring-emerald-500 text-emerald-500"
            />
            <div>
              <p className="text-sm text-white/90 font-medium">{ADDONS.recepcao.label}</p>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                + {brl(ADDONS.recepcao.price)}
              </p>
            </div>
          </label>

          {/* Hotel em Porto Alegre */}
          <label className="flex items-start gap-3 bg-black/20 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition">
            <input
              type="checkbox"
              checked={!!addons.hotel_porto_alegre}
              onChange={(e) => toggleAddon("hotel_porto_alegre", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/10 bg-black/40 focus:ring-emerald-500 text-emerald-500"
            />
            <div>
              <p className="text-sm text-white/90 font-medium">{ADDONS.hotel_porto_alegre.label}</p>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                + {brl(ADDONS.hotel_porto_alegre.price)}
              </p>
            </div>
          </label>

          {/* Retirada/entrega de chaves */}
          <label className="flex items-start gap-3 bg-black/20 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition">
            <input
              type="checkbox"
              checked={!!addons.chaves}
              onChange={(e) => toggleAddon("chaves", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/10 bg-black/40 focus:ring-emerald-500 text-emerald-500"
            />
            <div>
              <p className="text-sm text-white/90 font-medium">{ADDONS.chaves.label}</p>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                + {brl(ADDONS.chaves.price)}
              </p>
            </div>
          </label>

          {/* Duas hospedagens */}
          <label className="flex items-start gap-3 bg-black/20 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/10 transition">
            <input
              type="checkbox"
              checked={!!addons.duas_hospedagens}
              onChange={(e) => toggleAddon("duas_hospedagens", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/10 bg-black/40 focus:ring-emerald-500 text-emerald-500"
            />
            <div>
              <p className="text-sm text-white/90 font-medium">{ADDONS.duas_hospedagens.label}</p>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                + {brl(ADDONS.duas_hospedagens.price)}
              </p>
            </div>
          </label>

          {/* Equipamento infantil — por tipo (lei CONTRAN 819/2021) */}
          <div className="md:col-span-2 bg-black/20 border border-white/5 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm text-white/90 font-medium">
                👶 Equipamento de Segurança Infantil
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Obrigatório por lei para menores de 10 anos ou abaixo de 1,45m. Fornecido
                gratuitamente.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CHILD_SEAT_TYPES.map((seatId) => (
                <div key={seatId}>
                  <label className="text-xs text-white/50 uppercase tracking-wider">
                    {CHILD_SEAT_LABELS[seatId]}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={childSeats[seatId] ?? 0}
                    onChange={(e) => setChildSeatQty(seatId, parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-center outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* City Tour */}
        <div className="md:col-span-2 bg-black/20 border border-amber-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="cityTourCheck"
              checked={isOnlyCityTour || cityTourEnabled}
              disabled={isOnlyCityTour}
              onChange={(e) => setCityTourEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-black/40 focus:ring-amber-500 text-amber-500 disabled:opacity-50"
            />
            <label
              htmlFor="cityTourCheck"
              className="text-sm font-medium text-amber-400 cursor-pointer"
            >
              🗺️ City Tour
            </label>
            {(isOnlyCityTour || cityTourEnabled) && cityTourNum > 0 && (
              <span className="ml-auto text-xs font-semibold text-amber-400">
                + {brl(cityTourNum)}
              </span>
            )}
          </div>

          {(isOnlyCityTour || cityTourEnabled) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="md:col-span-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Destino do City Tour
                </label>
                <input
                  name="cityTourDest"
                  required={isOnlyCityTour}
                  value={cityTourDest}
                  onChange={(e) => setCityTourDest(e.target.value)}
                  className="w-full mt-1 bg-black/40 border border-amber-500/30 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Data do City Tour
                </label>
                <input
                  type="date"
                  name="cityTourDate"
                  required={isOnlyCityTour}
                  value={cityTourDate}
                  onChange={(e) => setCityTourDate(e.target.value)}
                  className="w-full mt-1 bg-black/40 border border-amber-500/30 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  Valor do City Tour (R$)
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                    R$
                  </span>
                  <input
                    name="cityTourValue"
                    required={isOnlyCityTour}
                    value={cityTourValue}
                    onChange={(e) => {
                      setCityTourValue(e.target.value);
                      setIsManualTotal(false);
                    }}
                    className="w-full pl-10 bg-black/40 border border-amber-500/30 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Extras avulsos */}
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider">
            Valor Extras Avulsos (R$)
          </label>
          <input
            name="extrasValue"
            value={extrasValue}
            onChange={(e) => setExtrasValue(e.target.value)}
            className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
            placeholder="0.00"
          />
        </div>

        {/* Hidden: optionals serialized no formato unificado */}
        <input type="hidden" name="addonsJson" value={optionalsJson} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-white/10 pb-2">Status e Valor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <div className="flex justify-between">
              <label className="text-xs text-white/50 uppercase tracking-wider">
                Valor Cobrado (Reais)
              </label>
              <div className="text-xs text-white/30">
                (Calculado automático: R$ {calculatedTotal})
              </div>
            </div>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                R$
              </span>
              <input
                name="total"
                required
                value={totalValue}
                onChange={(e) => {
                  setManualTotalOverride(e.target.value);
                  setIsManualTotal(true);
                }}
                className="w-full pl-10 bg-black/40 border border-[color:var(--mt-gold)] rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-bold text-[color:var(--mt-gold)]"
                placeholder="499.90"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider">
              Status Atual da Reserva
            </label>
            <select
              name="status"
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none appearance-none [color-scheme:dark]"
            >
              <option value="paid_pix">✅ Confirmada — PIX Total</option>
              <option value="paid_cartao">💳 Confirmada — Cartão Integral</option>
              <option value="paid_pix50">🔶 Confirmada — 50% PIX (Sinal)</option>
              <option value="pending">⏳ Aguardando Pagamento</option>
            </select>
          </div>
        </div>
      </div>

      {/* Observações Internas */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold border-b border-white/10 pb-2">
          Observações Internas
        </h2>
        <textarea
          name="internalNotes"
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none resize-none text-white/80 placeholder:text-white/20"
          placeholder="Notas visíveis apenas para a equipe: rota especial, observações da reserva, acordos específicos..."
        />
        <p className="text-[11px] text-white/25">Não aparece no contrato nem para o cliente.</p>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-500 text-white font-bold py-3 hover:bg-emerald-600 transition tracking-wide text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Registrando..." : "Registrar Reserva Manual"}
        </button>
      </div>
    </form>
  );
}
