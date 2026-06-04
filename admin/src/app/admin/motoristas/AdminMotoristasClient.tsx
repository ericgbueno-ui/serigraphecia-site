"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Search, ChevronLeft, Link as LinkIcon, Plus } from "lucide-react";

type Driver = {
  id: string;
  createdAt: string;
  status: string;
  name: string;
  phone: string;
  carModel: string;
  carColor: string;
  carYear: string;
  carPlate: string;
  pixKey: string;
  cadastur: string | null;
  companyType: string;
  acceptedTerms: boolean;
};

export default function AdminMotoristasClient() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/admin/motoristas");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/motoristas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
      }
    } catch (err) {
      console.error("Erro ao atualizar status", err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + "/motorista");
    alert("Link de cadastro copiado para a área de transferência!");
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.carPlate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = drivers.filter((d) => d.status === "PENDING").length;
  const approvedCount = drivers.filter((d) => d.status === "APPROVED").length;

  return (
    <div className="p-6 md:p-10 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap gap-4 items-start justify-between mb-8">
          <div>
            <Link href="/admin/painel" className="text-white/50 hover:text-white mb-2 flex items-center gap-1 transition-colors text-sm">
              <ChevronLeft size={16} /> Voltar ao Painel
            </Link>
            <h1 className="text-2xl font-bold text-white mb-1">Gestão de Motoristas</h1>
            <p className="text-sm text-white/50 mb-4">Gerencie a frota parceira, avalie cadastros pendentes e visualize chaves PIX para repasses.</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/motoristas/novo"
                className="flex items-center gap-2 bg-[#mt-gold] bg-[var(--gold)] text-black font-bold text-xs px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={14} /> Cadastrar Manualmente
              </Link>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 bg-[#111] border border-white/10 text-white/80 font-bold text-xs px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <LinkIcon size={14} /> Copiar Link p/ Enviar
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-[#111] border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#fb923c] animate-pulse" />
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Pendentes</p>
                <p className="text-lg font-bold text-[#fb923c] leading-tight">{pendingCount}</p>
              </div>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider font-bold">Ativos</p>
                <p className="text-lg font-bold text-[#3ecf8e] leading-tight">{approvedCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div className="flex bg-[#111] border border-white/10 rounded-xl p-1">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  filterStatus === status
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {status === "ALL" ? "TODOS" : status === "PENDING" ? "PENDENTES" : status === "APPROVED" ? "APROVADOS" : "REJEITADOS"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-white/40 text-sm">Carregando motoristas...</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="p-12 text-center text-white/40 text-sm">
              Nenhum motorista encontrado nesta categoria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">Motorista</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider hidden md:table-cell">Veículo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider hidden lg:table-cell">Financeiro</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-5 align-top">
                      {driver.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fb923c]/10 text-[#fb923c] border border-[#fb923c]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#fb923c] animate-pulse" /> PENDENTE
                        </span>
                      )}
                      {driver.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" /> APROVADO
                        </span>
                      )}
                      {driver.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" /> REJEITADO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="font-semibold text-white mb-1">{driver.name}</div>
                      <div className="text-xs text-white/50 mb-1">{driver.companyType}</div>
                      <a href={`https://wa.me/55${driver.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xs text-[#3ecf8e] hover:underline inline-flex items-center gap-1">
                        📱 {driver.phone}
                      </a>
                    </td>
                    <td className="px-6 py-5 align-top hidden md:table-cell">
                      <div className="text-sm font-medium text-white mb-1">{driver.carModel} <span className="text-white/40 font-normal">({driver.carYear})</span></div>
                      <div className="text-xs text-white/50 mb-1">Cor: {driver.carColor}</div>
                      <div className="inline-flex px-2 py-0.5 rounded bg-black border border-white/20 text-xs font-mono uppercase tracking-widest text-white/70">
                        {driver.carPlate}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top hidden lg:table-cell">
                      <div className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1">Chave PIX</div>
                      <div className="text-sm text-white font-mono break-all">{driver.pixKey}</div>
                      {driver.cadastur && (
                        <div className="mt-2 text-[10px] text-white/40 uppercase tracking-widest border border-white/10 rounded px-1.5 py-0.5 inline-block">
                          Cadastur: {driver.cadastur}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                      {driver.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => updateStatus(driver.id, "APPROVED")}
                            className="bg-[#3ecf8e]/10 hover:bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/20 p-2 rounded-lg transition-colors flex items-center justify-center"
                            title="Aprovar"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            onClick={() => updateStatus(driver.id, "REJECTED")}
                            className="bg-[#f87171]/10 hover:bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/20 p-2 rounded-lg transition-colors flex items-center justify-center"
                            title="Rejeitar"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                      {driver.status === "REJECTED" && (
                        <button
                          onClick={() => updateStatus(driver.id, "APPROVED")}
                          className="text-[10px] uppercase font-bold text-white/40 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          Reavaliar (Aprovar)
                        </button>
                      )}
                      {driver.status === "APPROVED" && (
                        <button
                          onClick={() => updateStatus(driver.id, "REJECTED")}
                          className="text-[10px] uppercase font-bold text-white/40 hover:text-[#f87171] border border-white/10 hover:border-[#f87171]/30 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          Revogar (Rejeitar)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
