"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createAffiliate } from "../actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "11px 14px",
  color: "var(--text)",
  fontSize: "14px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "var(--muted)",
  marginBottom: "7px",
};

const optionStyle: React.CSSProperties = {
  background: "#121b2c",
  color: "#fff",
};

export function NewAffiliateForm({ error }: { error?: string }) {
  const [type, setType] = useState<"agency" | "influencer">("agency");

  // Fields for Agency
  const [agentName, setAgentName] = useState("");
  const [agencyName, setAgencyName] = useState("");

  // Fields for Influencer
  const [influencerName, setInfluencerName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");

  // Indication code & basic info
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [commIda, setCommIda] = useState("25,00");
  const [commIdaVolta, setCommIdaVolta] = useState("50,00");

  // Dynamic values
  const [finalName, setFinalName] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (type === "agency") {
      const combined = agencyName && agentName ? `${agencyName} - ${agentName}` : agencyName || agentName || "";
      setFinalName(combined);
    } else {
      setFinalName(influencerName);
      // Auto-fill code from instagram handle (removing @ and special chars)
      const cleanHandle = instagramHandle
        .replace(/@/g, "")
        .trim();
      setCode(cleanHandle);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [type, agentName, agencyName, influencerName, instagramHandle]);

  // Clean and format code input (only uppercase, letters, numbers, hyphens)
  const handleCodeChange = (val: string) => {
    const cleaned = val
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9_-]/g, "");
    setCode(cleaned);
  };

  // Format currency on blur
  const formatCurrency = (val: string, setter: (v: string) => void) => {
    let clean = val.replace(/[^0-9,.]/g, "").replace(",", ".");
    let parsed = parseFloat(clean);
    if (isNaN(parsed)) {
      setter("0,00");
    } else {
      setter(parsed.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  };

  return (
    <form
      action={createAffiliate}
      className="grid grid-cols-1 md:grid-cols-2 gap-5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "24px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "18px",
      }}
    >
      {error && (
        <div
          style={{
            gridColumn: "1 / -1",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "10px",
            padding: "11px 14px",
            color: "#f87171",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Hidden input for combined name submitted to the server */}
      <input type="hidden" name="name" value={finalName} />

      {/* Tipo de Afiliado Select (Styled properly for high contrast) */}
      <div>
        <label style={labelStyle}>Tipo de Afiliado</label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          required
          style={inputStyle}
          className="hover:border-[color:var(--gold-line)] focus:border-[color:var(--gold-line)] transition-colors cursor-pointer"
        >
          <option value="agency" style={optionStyle}>Agência de Viagens</option>
          <option value="influencer" style={optionStyle}>Influencer</option>
        </select>
      </div>

      {/* E-mail */}
      <div>
        <label style={labelStyle}>E-mail de acesso</label>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="parceiro@email.com"
          style={inputStyle}
        />
      </div>

      {/* Dynamic Name Inputs based on Type */}
      {type === "agency" ? (
        <>
          <div>
            <label style={labelStyle}>Nome da Agência</label>
            <input
              type="text"
              required
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Ex: K&F Turismo"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Nome do Agente (Parceiro)</label>
            <input
              type="text"
              required
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Ex: Karine"
              style={inputStyle}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label style={labelStyle}>Nome do Influencer</label>
            <input
              type="text"
              required
              value={influencerName}
              onChange={(e) => setInfluencerName(e.target.value)}
              placeholder="Ex: Gramado em Luzes"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Instagram @</label>
            <div style={{ position: "relative", width: "100%" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted)",
                  fontSize: "14px",
                  fontWeight: 600,
                  pointerEvents: "none"
                }}
              >
                @
              </span>
              <input
                type="text"
                required
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="gramadoemluzes"
                style={{ ...inputStyle, paddingLeft: "30px" }}
              />
            </div>
          </div>
        </>
      )}

      {/* WhatsApp */}
      <div>
        <label style={labelStyle}>WhatsApp</label>
        <input
          name="whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          required
          placeholder="51999999999"
          style={inputStyle}
        />
      </div>

      {/* Código de Indicação (URL / Indication code) */}
      <div>
        <label style={labelStyle}>Código de indicação</label>
        <input
          name="code"
          required
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder={type === "agency" ? "Ex: KEF" : "Ex: GRAMADOEMLUZES"}
          style={{ ...inputStyle, textTransform: "uppercase" }}
          readOnly={type === "influencer"}
        />
        <p style={{ marginTop: "6px", fontSize: "11px", color: "var(--muted)" }}>
          {type === "influencer" 
            ? "Gerado automaticamente a partir do Instagram @." 
            : "Usado no link de indicação e nos contratos."}
        </p>
      </div>

      {/* Senha de acesso */}
      <div>
        <label style={labelStyle}>Senha de acesso</label>
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          style={inputStyle}
        />
      </div>

      {/* Comissão Ida ou Volta */}
      <div>
        <label style={labelStyle}>Comissão ida ou volta (R$)</label>
        <input
          name="commIda"
          required
          value={commIda}
          onChange={(e) => setCommIda(e.target.value)}
          onBlur={(e) => formatCurrency(e.target.value, setCommIda)}
          inputMode="decimal"
          style={inputStyle}
        />
      </div>

      {/* Comissão Ida e Volta */}
      <div>
        <label style={labelStyle}>Comissão ida e volta (R$)</label>
        <input
          name="commIdaVolta"
          required
          value={commIdaVolta}
          onChange={(e) => setCommIdaVolta(e.target.value)}
          onBlur={(e) => formatCurrency(e.target.value, setCommIdaVolta)}
          inputMode="decimal"
          style={inputStyle}
        />
      </div>

      {/* Form Actions */}
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          paddingTop: "8px",
        }}
      >
        <Link
          href="/admin/afiliados"
          style={{
            padding: "11px 16px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Cancelar
        </Link>
        <button
          type="submit"
          style={{
            padding: "11px 18px",
            borderRadius: "10px",
            border: "none",
            background: "var(--gold)",
            color: "#05080d",
            fontSize: "13px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Criar Afiliado
        </button>
      </div>
    </form>
  );
}
