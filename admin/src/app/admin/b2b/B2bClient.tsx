"use client";

import { useState, useEffect, useCallback } from "react";

type B2bContact = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  site?: string | null;
  notes?: string | null;
  status: string;
  sentAt?: string | null;
};

const STATUS_OPTIONS = [
  { value: "a_enviar",   label: "A enviar",   color: "var(--muted)" },
  { value: "enviado",    label: "Enviado",     color: "#60a5fa" },
  { value: "respondeu",  label: "Respondeu",   color: "#facc15" },
  { value: "parceiro",   label: "Parceiro",    color: "#4ade80" },
  { value: "descartado", label: "Descartado",  color: "#f87171" },
];

function statusColor(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.color ?? "var(--muted)";
}
function statusLabel(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}
function whatsLink(num: string) {
  const clean = num.replace(/\D/g, "");
  return `https://wa.me/${clean.startsWith("55") ? clean : "55" + clean}`;
}

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "20px 24px",
};

export default function B2bClient() {
  const [contacts, setContacts] = useState<B2bContact[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [editing, setEditing]   = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<B2bContact>>({});
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/b2b/contacts");
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleImport() {
    setImporting(true);
    const res = await fetch("/api/admin/b2b/import", { method: "POST" });
    const data = await res.json();
    if (res.ok) { setMsg(`✅ ${data.imported} agências importadas.`); await load(); }
    else setMsg(`❌ ${data.error}`);
    setImporting(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/admin/b2b/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(status === "enviado" ? { sentAt: new Date().toISOString() } : {}) }),
    });
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  }

  async function handleSaveEdit(id: string) {
    await fetch(`/api/admin/b2b/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, ...editData } : c));
    setEditing(null);
    setEditData({});
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este contato?")) return;
    await fetch(`/api/admin/b2b/contacts/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = contacts.filter((c) => {
    const matchStatus = filter === "all" || c.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) ||
      (c.city ?? "").toLowerCase().includes(q) ||
      (c.state ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = contacts.filter((c) => c.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  const inputS: React.CSSProperties = {
    padding: "7px 10px", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: "6px", color: "var(--text)", fontSize: "12px", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--muted)", marginBottom: "6px" }}>
            Admin · B2B
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>💼 CRM Agências B2B</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
            Prospecção via WhatsApp · {contacts.length} contatos cadastrados
          </p>
        </div>
        {contacts.length === 0 && (
          <button onClick={handleImport} disabled={importing}
            style={{ padding: "10px 20px", background: "var(--gold)", color: "#1a1004", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            {importing ? "Importando..." : "⬇️ Importar 39 agências"}
          </button>
        )}
      </div>

      {msg && (
        <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", color: "#4ade80", marginBottom: "16px" }}>
          {msg}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "20px" }}>
        {STATUS_OPTIONS.map((s) => (
          <div key={s.value} onClick={() => setFilter(filter === s.value ? "all" : s.value)}
            style={{ ...card, padding: "14px 16px", cursor: "pointer", border: `1px solid ${filter === s.value ? s.color : "var(--border)"}`, background: filter === s.value ? `${s.color}10` : "var(--bg-card)" }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{counts[s.value] ?? 0}</div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, cidade, estado ou e-mail..."
        style={{ ...inputS, marginBottom: "16px", fontSize: "13px", padding: "10px 14px" }} />

      {/* Lista */}
      {loading ? (
        <p style={{ fontSize: "13px", color: "var(--muted)", padding: "40px 0", textAlign: "center" }}>Carregando...</p>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "60px 24px" }}>
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>💼</p>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
            {contacts.length === 0 ? "Nenhum contato ainda" : "Nenhum resultado"}
          </p>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            {contacts.length === 0 ? 'Clique em "Importar 39 agências" para começar.' : "Tente outro filtro."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((c) => (
            <div key={c.id} style={{ ...card, padding: "16px 20px" }}>
              {editing === c.id ? (
                // ── Modo edição ──
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {(["whatsapp", "email", "instagram", "site", "notes"] as const).map((field) => (
                    <div key={field}>
                      <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "4px" }}>{field}</label>
                      <input value={(editData[field] ?? c[field]) ?? ""} onChange={(e) => setEditData((p) => ({ ...p, [field]: e.target.value }))}
                        style={inputS} placeholder={field} />
                    </div>
                  ))}
                  <div style={{ gridColumn: "span 2", display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button onClick={() => handleSaveEdit(c.id)}
                      style={{ padding: "7px 18px", background: "var(--gold)", color: "#1a1004", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                      Salvar
                    </button>
                    <button onClick={() => { setEditing(null); setEditData({}); }}
                      style={{ padding: "7px 18px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", color: "var(--muted)", cursor: "pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // ── Modo visualização ──
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{c.name}</span>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: `${statusColor(c.status)}18`, color: statusColor(c.status), fontWeight: 700 }}>
                        {statusLabel(c.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      {c.city && <span>📍 {c.city}/{c.state}</span>}
                      {c.email && <span>📧 {c.email}</span>}
                      {c.instagram && <span>📸 {c.instagram}</span>}
                      {c.site && <a href={`https://${c.site}`} target="_blank" rel="noreferrer" style={{ color: "var(--muted)", textDecoration: "none" }}>🌐 {c.site}</a>}
                    </div>
                    {c.notes && <p style={{ fontSize: "11px", color: "#60a5fa", marginTop: "6px" }}>💬 {c.notes}</p>}
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    {c.whatsapp ? (
                      <a href={whatsLink(c.whatsapp)} target="_blank" rel="noreferrer"
                        style={{ padding: "6px 14px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#4ade80", textDecoration: "none" }}>
                        💬 WhatsApp
                      </a>
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic" }}>sem WhatsApp</span>
                    )}

                    <select value={c.status} onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      style={{ padding: "6px 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", color: statusColor(c.status), fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    <button onClick={() => { setEditing(c.id); setEditData({}); }}
                      style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", color: "var(--muted)", cursor: "pointer" }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(c.id)}
                      style={{ padding: "6px 10px", background: "transparent", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", fontSize: "12px", color: "#f87171", cursor: "pointer" }}>
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Aviso lista de transmissão */}
      {contacts.filter((c) => c.whatsapp && c.status === "a_enviar").length > 0 && (
        <div style={{ marginTop: "20px", background: "rgba(180,140,60,0.06)", border: "1px solid var(--gold-line)", borderRadius: "12px", padding: "16px 20px", fontSize: "12px", color: "var(--muted)", lineHeight: "1.7" }}>
          <strong style={{ color: "var(--gold)" }}>📋 Lista de transmissão WhatsApp:</strong>{" "}
          {contacts.filter((c) => c.whatsapp && c.status === "a_enviar").length} contatos com WhatsApp prontos para envio.
          Copie os números abaixo e importe manualmente no WhatsApp da Jolie ({" "}
          <strong style={{ color: "var(--text)" }}>(51) 98912-9376</strong>) como lista de transmissão:
          <div style={{ marginTop: "10px", fontFamily: "monospace", fontSize: "11px", background: "var(--bg)", borderRadius: "8px", padding: "10px 14px", lineHeight: "1.8" }}>
            {contacts.filter((c) => c.whatsapp && c.status === "a_enviar").map((c) => (
              <div key={c.id}>{c.whatsapp} — {c.name}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
