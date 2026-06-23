"use client";

import { useState } from "react";
import Link from "next/link";
import { updateCommissions, createPayment } from "./actions";

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type ParsedAffiliate = {
  id: string;
  name: string;
  code: string;
  whatsapp: string;
  commIda: number;
  commIdaVolta: number;
  totalComm: number;
  paidComm: number;
  pendingComm: number;
  type: string;
};

export function RepresentanteManager({ data }: { data: ParsedAffiliate[] }) {
  const [filterType, setFilterType] = useState<"all" | "agency" | "influencer">("all");
  const [selectedAff, setSelectedAff] = useState<ParsedAffiliate | null>(null);
  const [modalType, setModalType] = useState<"pay" | "config" | null>(null);

  const [commIdaStr, setCommIdaStr] = useState("");
  const [commIdaVoltaStr, setCommIdaVoltaStr] = useState("");

  const [paymentAmountStr, setPaymentAmountStr] = useState("");
  const [paymentNoteStr, setPaymentNoteStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function openConfig(aff: ParsedAffiliate) {
    setSelectedAff(aff);
    setCommIdaStr((aff.commIda / 100).toFixed(2).replace(".", ","));
    setCommIdaVoltaStr((aff.commIdaVolta / 100).toFixed(2).replace(".", ","));
    setModalType("config");
  }

  function openPay(aff: ParsedAffiliate) {
    if (aff.pendingComm <= 0) {
      alert("Este representante não tem saldo pendente para receber.");
      return;
    }
    setSelectedAff(aff);
    setPaymentAmountStr((aff.pendingComm / 100).toFixed(2).replace(".", ","));
    setPaymentNoteStr("");
    setModalType("pay");
  }

  function closeModal() {
    setSelectedAff(null);
    setModalType(null);
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAff) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("id", selectedAff.id);
    fd.append("commIda", commIdaStr);
    fd.append("commIdaVolta", commIdaVoltaStr);

    await updateCommissions(fd);
    setLoading(false);
    closeModal();
  }

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAff) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("id", selectedAff.id);
    fd.append("amount", paymentAmountStr);
    fd.append("note", paymentNoteStr);

    const { ok, error } = await createPayment(fd);
    if (!ok) alert(error);
    setLoading(false);
    closeModal();
  }

  function affiliateUrl(code: string) {
    return `seudominio.com.br/${code.toLowerCase()}`;
  }

  async function copyAffiliateLink(code: string) {
    const url = `https://${affiliateUrl(code)}`;
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 1800);
  }

  const filteredAffiliates = data.filter((aff) => {
    if (filterType === "all") return true;
    return aff.type === filterType;
  });

  return (
    <>
      {/* Filtros por Tipo de Representante */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {[
          { id: "all", label: "Todos" },
          { id: "agency", label: "Agências de Viagens" },
          { id: "influencer", label: "Influencers" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id as any)}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              background: filterType === tab.id ? "var(--gold-dim)" : "rgba(255,255,255,0.03)",
              border: filterType === tab.id ? "1px solid var(--gold-line)" : "1px solid var(--border)",
              color: filterType === tab.id ? "var(--gold)" : "var(--muted)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 text-white/40 bg-black/40">
                <th className="px-6 py-4 font-semibold tracking-wide">Representante</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Link do representante</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Comissões Padrão</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Total Geral</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Saldo A Receber</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAffiliates.map((aff) => (
                <tr key={aff.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="px-6 py-4">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "space-between" }}>
                      <div>
                        {(() => {
                          const isAgency = aff.type === "agency";
                          const hasHyphen = aff.name.includes(" - ");
                          
                          if (isAgency && hasHyphen) {
                            const parts = aff.name.split(" - ");
                            const agencyName = parts[0]?.trim();
                            const agentName = parts[1]?.trim();
                            return (
                              <>
                                <Link
                                  href={`/admin/representantes/${aff.id}`}
                                  className="font-semibold text-white/90 hover:text-[color:var(--gold)] transition-colors"
                                >
                                  {agentName}
                                </Link>
                                <div className="text-xs text-blue-400 mt-0.5 font-medium">
                                  Agência: <span className="text-white/70">{agencyName}</span>
                                </div>
                              </>
                            );
                          } else if (aff.type === "influencer") {
                            return (
                              <>
                                <Link
                                  href={`/admin/representantes/${aff.id}`}
                                  className="font-semibold text-white/90 hover:text-[color:var(--gold)] transition-colors"
                                >
                                  {aff.name}
                                </Link>
                                <div className="text-xs text-purple-400 mt-0.5 font-mono">
                                  @{aff.code.toLowerCase()}
                                </div>
                              </>
                            );
                          } else {
                            return (
                              <Link
                                href={`/admin/representantes/${aff.id}`}
                                className="font-semibold text-white/90 hover:text-[color:var(--gold)] transition-colors"
                              >
                                {aff.name}
                              </Link>
                            );
                          }
                        })()}
                      </div>
                      <span
                        style={{
                          fontSize: "9px",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background: aff.type === "influencer" ? "rgba(167,139,250,0.12)" : "rgba(96,165,250,0.12)",
                          color: aff.type === "influencer" ? "#a78bfa" : "#60a5fa",
                          border: aff.type === "influencer" ? "1px solid rgba(167,139,250,0.25)" : "1px solid rgba(96,165,250,0.25)",
                        }}
                      >
                        {aff.type === "influencer" ? "Influencer" : "Agência"}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-500 mt-1">{aff.whatsapp}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-white/5 text-white/70 text-xs font-mono border border-white/10">
                      {aff.code}
                    </span>
                    <div className="mt-1 text-xs font-mono text-[color:var(--gold)]">
                      {affiliateUrl(aff.code)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-white/60">
                      Chegada In: <strong className="text-white/80">{brl(aff.commIda)}</strong>
                    </div>
                    <div className="text-xs text-white/60">
                      I/V: <strong className="text-white/80">{brl(aff.commIdaVolta)}</strong>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white/80">{brl(aff.totalComm)}</div>
                    <div className="text-xs text-white/40 mt-1">Já pagos: {brl(aff.paidComm)}</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold">
                    {aff.pendingComm > 0 ? (
                      <span className="text-yellow-400">{brl(aff.pendingComm)}</span>
                    ) : (
                      <span className="text-emerald-400">Quitado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/representantes/${aff.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[color:var(--gold-dim)] hover:bg-[color:var(--gold-dim)] border border-[color:var(--gold-line)] text-[color:var(--gold)] text-xs font-bold transition"
                      >
                        Abrir Painel
                      </Link>
                      <button
                        type="button"
                        onClick={() => copyAffiliateLink(aff.code)}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition"
                      >
                        {copiedCode === aff.code ? "Copiado" : "Copiar link"}
                      </button>
                      <button
                        onClick={() => openConfig(aff)}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition"
                      >
                        Configurar
                      </button>
                      <button
                        onClick={() => openPay(aff)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${
                          aff.pendingComm > 0
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
                        }`}
                      >
                        Pagar Repasse
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAffiliates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-white/40">
                    <div className="text-lg">Nenhum representante encontrado nesta categoria.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalType === "config" && selectedAff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold">Configurar Comissão</h3>
            <p className="text-sm text-white/50 mb-5 mt-1">
              Personalize o percentual de: {selectedAff.name}
            </p>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase">
                  Valor p/ Chegada In ou Retorno Out (R$)
                </label>
                <input
                  value={commIdaStr}
                  onChange={(e) => setCommIdaStr(e.target.value)}
                  required
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase">
                  Valor p/ Chegada In e Retorno Out (R$)
                </label>
                <input
                  value={commIdaVoltaStr}
                  onChange={(e) => setCommIdaVoltaStr(e.target.value)}
                  required
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-bold bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-50 transition"
                >
                  {loading ? "Salvando..." : "Salvar Configuração"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === "pay" && selectedAff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold">Pagar Repasse Pendente</h3>
            <p className="text-sm text-white/50 mb-5 mt-1">
              Gerar recibo de pagamento para {selectedAff.name}
            </p>
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm text-yellow-300">
                O representante possui <strong>{brl(selectedAff.pendingComm)}</strong> aguardando
                pagamento.
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase">Valor Pago (R$)</label>
                <input
                  value={paymentAmountStr}
                  onChange={(e) => setPaymentAmountStr(e.target.value)}
                  required
                  className="w-full mt-1 bg-black/40 border border-yellow-500/50 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-yellow-500 outline-none font-bold text-yellow-500"
                />
                <p className="text-xs text-white/40 mt-1">
                  Você pode fazer pagamento parcial reduzindo o valor.
                </p>
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase">
                  Nota / Comprovante (opcional)
                </label>
                <input
                  value={paymentNoteStr}
                  onChange={(e) => setPaymentNoteStr(e.target.value)}
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Pix feito dia 20/03..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition"
                >
                  {loading ? "Processando..." : "Confirmar Pagamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
