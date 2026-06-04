"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NovoMotoristaClient() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    carModel: "",
    carColor: "",
    carYear: "",
    carPlate: "",
    isElectric: false,
    pixKey: "",
    cadastur: "",
    companyType: "Autônomo",
    password: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/motoristas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          hybridOrElectric: formData.isElectric ? "100% Elétrico" : null,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao criar motorista.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/motoristas");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 md:p-10 text-white font-sans flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-3xl max-w-lg w-full text-center shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-[#3ecf8e]/20 text-[#3ecf8e] rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-4">Motorista Cadastrado!</h1>
          <p className="text-white/60 mb-8 leading-relaxed">
            O motorista foi adicionado e já está Aprovado no sistema.
          </p>
          <Link
            href="/admin/motoristas"
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-6 py-3 font-semibold transition-all"
          >
            Voltar para Motoristas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 text-white font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin/motoristas" className="text-white/50 hover:text-white mb-6 flex items-center gap-1 transition-colors text-sm w-fit">
          <ChevronLeft size={16} /> Voltar
        </Link>
        
        <h1 className="text-2xl font-bold text-white mb-2">Cadastrar Motorista Manualmente</h1>
        <p className="text-sm text-white/50 mb-8">
          Preencha os dados do novo motorista parceiro. Ele entrará no sistema automaticamente como "Aprovado". O aceite dos termos será exigido no primeiro login dele (em breve).
        </p>

        <form onSubmit={handleSubmit} className="bg-[#111] border border-white/5 rounded-[24px] p-6 md:p-10 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-sm text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Informações Pessoais */}
            <div className="md:col-span-2">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Informações Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/70">Nome Completo *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/70">WhatsApp *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="(54) 99999-9999"
                  />
                </div>
              </div>
            </div>

            {/* Informações do Veículo */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Informações do Veículo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/70">Modelo do Carro *</label>
                  <input
                    type="text"
                    name="carModel"
                    required
                    value={formData.carModel}
                    onChange={handleChange}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Ex: Chevrolet Spin"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/70">Ano do Veículo *</label>
                  <input
                    type="text"
                    name="carYear"
                    required
                    value={formData.carYear}
                    onChange={handleChange}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Ex: 2022"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/70">Cor *</label>
                  <input
                    type="text"
                    name="carColor"
                    required
                    value={formData.carColor}
                    onChange={handleChange}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Ex: Prata"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/70">Placa *</label>
                  <input
                    type="text"
                    name="carPlate"
                    required
                    value={formData.carPlate}
                    onChange={handleChange}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors uppercase"
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-white/10 bg-black hover:bg-white/[0.02] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isElectric}
                      onChange={(e) => setFormData(prev => ({ ...prev, isElectric: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/20 bg-black text-[#3ecf8e] focus:ring-[#3ecf8e] focus:ring-offset-black"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">Veículo 100% Elétrico ⚡</span>
                    </div>
                  </label>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2 mt-4">
                  <label className="text-sm font-medium text-white/70">Senha Inicial de Acesso *</label>
                  <input
                    type="text"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Ex: multitrip2026"
                  />
                </div>
              </div>
            </div>

            {/* Informações Profissionais */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Informações Profissionais</h3>
              
              <div className="flex flex-col gap-3 mb-6">
                <label className="text-sm font-medium text-white/70 mb-1">Vínculo Profissional *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {["Autônomo", "Autônomo MEI", "Empresa/Agência"].map((type) => (
                    <label
                      key={type}
                      className={`flex items-center justify-center text-sm font-semibold rounded-xl border p-3 cursor-pointer transition-all ${
                        formData.companyType === type
                          ? "bg-white/10 border-white/30 text-white"
                          : "bg-black border-white/10 text-white/50 hover:bg-white/[0.02]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="companyType"
                        value={type}
                        checked={formData.companyType === type}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white/70">Chave PIX (Para Repasses) *</label>
                  <input
                    type="text"
                    name="pixKey"
                    required
                    value={formData.pixKey}
                    onChange={handleChange}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Telefone, CPF, E-mail..."
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-white/70">Número CADASTUR <span className="text-white/30 text-xs font-normal">(Opcional)</span></label>
                  <input
                    type="number"
                    name="cadastur"
                    value={formData.cadastur}
                    onChange={handleChange}
                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Deixe em branco se não possuir"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--gold)] text-black font-bold text-[15px] py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting ? "Salvando..." : "Salvar Motorista"}
          </button>
        </form>
      </div>
    </div>
  );
}
