"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Metadata } from "next";

const PHONE = "51986876557";

type ConnStatus = "loading" | "connected" | "disconnected" | "connecting";

const btn: React.CSSProperties = {
  padding: "9px 20px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  transition: "opacity 0.15s",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

function fmtPhone(p: string) {
  const s = p.replace(/\D/g, "");
  if (s.length === 11) return `(${s.slice(0, 2)}) ${s.slice(2, 7)}-${s.slice(7)}`;
  if (s.length === 13) return `+${s.slice(0, 2)} (${s.slice(2, 4)}) ${s.slice(4, 9)}-${s.slice(9)}`;
  return s;
}

export default function WhatsAppCRMPage() {
  const [status, setStatus] = useState<ConnStatus>("loading");
  const [me, setMe] = useState<Record<string, string> | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const checkStatus = useCallback(async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/whatsapp/connect?phone=${PHONE}&action=status`);
      const data = await res.json();
      if (data.isConnected) {
        setStatus("connected");
        setMe(data.me);
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkStatus();
    return () => {
      esRef.current?.close();
    };
  }, [checkStatus]);

  async function startConnect(method: "pair" | "qr" = "pair") {
    esRef.current?.close();
    setStatus("connecting");
    setQr(null);
    setPairCode(null);
    setErrorMsg(null);

    // Limpa sessão antiga no banco antes de gerar novo QR/código
    try {
      await fetch(`/api/admin/whatsapp/connect?phone=${PHONE}`, { method: "POST" });
    } catch {}

    const es = new EventSource(`/api/admin/whatsapp/connect?phone=${PHONE}&action=generate&method=${method}`);
    esRef.current = es;

    es.addEventListener("pair_code", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setPairCode(d.code);
    });

    es.addEventListener("qr", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setQr(d.qr);
    });

    es.addEventListener("status", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      if (d.status === "connected") {
        setStatus("connected");
        setMe(d.me);
        setQr(null);
        es.close();
      } else if (d.status === "logged_out") {
        setStatus("disconnected");
        setQr(null);
        es.close();
      }
    });

    es.addEventListener("error", (e) => {
      if (e instanceof MessageEvent) {
        try {
          setErrorMsg(JSON.parse(e.data).error ?? "Erro ao gerar QR.");
        } catch {
          setErrorMsg("Tempo esgotado. Tente novamente.");
        }
      } else {
        setErrorMsg("Conexão interrompida. Tente novamente.");
      }
      setStatus("disconnected");
      setQr(null);
      es.close();
    });
  }

  function cancelConnect() {
    esRef.current?.close();
    setStatus("disconnected");
    setQr(null);
    setPairCode(null);
    setErrorMsg(null);
  }

  async function forceSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const diag = data._diag?.length ? ` [${data._diag.join(' → ')}]` : '';
        setSyncResult({
          ok: true,
          msg: `${data.syncedLeads?.length ?? 0} leads · ${data.syncedMessagesCount ?? 0} mensagens sincronizadas${diag}`,
        });
      } else {
        setSyncResult({ ok: false, msg: data.message ?? data.error ?? "Erro desconhecido" });
      }
    } catch (err: any) {
      setSyncResult({ ok: false, msg: err.message });
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    try {
      await fetch(`/api/admin/whatsapp/connect?phone=${PHONE}`, { method: "POST" });
    } catch {}
    esRef.current?.close();
    setStatus("disconnected");
    setMe(null);
    setQr(null);
  }

  const meId = me?.id?.split(":")?.[0] ?? PHONE;
  const meName = me?.name;

  return (
    <div style={{ padding: "40px 32px", maxWidth: 580 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "var(--muted)",
            marginBottom: 8,
          }}
        >
          Admin · WhatsApp CRM
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          Conexão WhatsApp
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.7, margin: "8px 0 0" }}>
          Conecte o número da equipe para sincronizar conversas e alimentar o CRM automaticamente.
        </p>
      </div>

      {/* ── Status Card ── */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "28px 24px",
          marginBottom: 16,
        }}
      >
        {/* LOADING */}
        {status === "loading" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--muted)" }}>
            <div className="wa-spin" />
            <span style={{ fontSize: 14 }}>Verificando conexão...</span>
          </div>
        )}

        {/* CONNECTED */}
        {status === "connected" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                  boxShadow: "0 0 8px #22c55e88",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#22c55e" }}>Conectado</span>
            </div>

            <div
              style={{
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.18)",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 24,
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Número ativo</p>
              <p style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>
                {meName ?? fmtPhone(meId)}
              </p>
              {meName && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>
                  {fmtPhone(meId)}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={checkStatus}
                style={{ ...btn, background: "rgba(255,255,255,0.06)", color: "var(--text)" }}
              >
                ↻ Atualizar status
              </button>
              <button
                onClick={disconnect}
                style={{
                  ...btn,
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                Desconectar
              </button>
            </div>
          </div>
        )}

        {/* DISCONNECTED */}
        {status === "disconnected" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#64748b",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>
                Desconectado
              </span>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 18,
                  fontSize: 13,
                  color: "#f87171",
                }}
              >
                {errorMsg}
              </div>
            )}

            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, lineHeight: 1.7, margin: "0 0 20px" }}>
              Clique em <strong style={{ color: "var(--text)" }}>Conectar</strong> para gerar o QR
              Code. Abra o WhatsApp no celular e escaneie para vincular.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => startConnect("pair")}
                style={{
                  ...btn,
                  background: "var(--gold, #c9a84c)",
                  color: "#000",
                  fontWeight: 700,
                  padding: "11px 24px",
                }}
              >
                # Código de Pareamento
              </button>
              <button
                onClick={() => startConnect("qr")}
                style={{
                  ...btn,
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  padding: "11px 24px",
                }}
              >
                QR Code
              </button>
            </div>
          </div>
        )}

        {/* CONNECTING */}
        {status === "connecting" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div className="wa-spin" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {pairCode ? "Digite o código no WhatsApp" : qr ? "Aguardando leitura do QR..." : "Gerando código de conexão..."}
              </span>
            </div>

            {/* Pairing Code — método principal */}
            {pairCode && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    background: "rgba(34,197,94,0.06)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    borderRadius: 16,
                    padding: "28px 36px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    Código de Pareamento
                  </p>
                  <p style={{ margin: 0, fontSize: 40, fontWeight: 800, color: "#22c55e", letterSpacing: "0.12em", fontFamily: "monospace" }}>
                    {pairCode}
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(201,168,76,0.06)",
                    border: "1px solid rgba(201,168,76,0.18)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    maxWidth: 340,
                  }}
                >
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "var(--gold, #c9a84c)" }}>
                    Como usar:
                  </p>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--muted)", lineHeight: 2 }}>
                    <li>Abra o <strong style={{ color: "var(--text)" }}>WhatsApp</strong> no celular</li>
                    <li>Menu → <strong style={{ color: "var(--text)" }}>Dispositivos Vinculados</strong></li>
                    <li>Toque em <strong style={{ color: "var(--text)" }}>Vincular um Dispositivo</strong></li>
                    <li>Toque em <strong style={{ color: "var(--text)" }}>Vincular com número de telefone</strong></li>
                    <li>Digite o código acima</li>
                  </ol>
                </div>

                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                  O código expira em ~60 segundos. Aguardando confirmação...
                </p>

                <button
                  onClick={cancelConnect}
                  style={{ ...btn, background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* QR fallback */}
            {qr && !pairCode && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="QR Code WhatsApp" style={{ width: 220, height: 220, display: "block" }} />
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", maxWidth: 280 }}>
                  WhatsApp → Menu (⋮) → Dispositivos Vinculados → Vincular um Dispositivo
                </p>
                <button onClick={cancelConnect} style={{ ...btn, background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}>
                  Cancelar
                </button>
              </div>
            )}

            {/* Aguardando código */}
            {!pairCode && !qr && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--muted)", fontSize: 13 }}>
                <div className="wa-spin" />
                Conectando ao WhatsApp...
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sync Card (only when connected) ── */}
      {status === "connected" && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 16,
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
            Sincronização Manual
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
            Importa mensagens novas do WhatsApp para o CRM imediatamente, sem esperar o cron das 14h.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={forceSync}
              disabled={syncing}
              style={{
                ...btn,
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.3)",
                color: "var(--gold, #c9a84c)",
                opacity: syncing ? 0.6 : 1,
                cursor: syncing ? "wait" : "pointer",
              }}
            >
              {syncing ? "Sincronizando..." : "↻ Sincronizar Agora"}
            </button>
            {syncResult && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: syncResult.ok ? "#22c55e" : "#f87171",
                }}
              >
                {syncResult.ok ? "✓ " : "✕ "}{syncResult.msg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Info Card ── */}
      <div
        style={{
          background: "rgba(201,168,76,0.04)",
          border: "1px solid rgba(201,168,76,0.14)",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--gold, #c9a84c)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Como funciona
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 13,
            color: "var(--muted)",
            lineHeight: 1.9,
          }}
        >
          <li>
            Mensagens recebidas viram{" "}
            <strong style={{ color: "var(--text)" }}>leads automaticamente</strong> no CRM
          </li>
          <li>
            Sincronização diária às{" "}
            <strong style={{ color: "var(--text)" }}>14h UTC (11h Brasília)</strong>
          </li>
          <li>
            Este número é{" "}
            <strong style={{ color: "var(--text)" }}>diferente do número da Jolie</strong>{" "}
            (Meta Business API)
          </li>
          <li>A sessão é salva no banco — reconecta automaticamente</li>
        </ul>
      </div>

      <style>{`
        .wa-spin {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border, #2a2a2a);
          border-top-color: var(--gold, #c9a84c);
          border-radius: 50%;
          animation: wa-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes wa-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
