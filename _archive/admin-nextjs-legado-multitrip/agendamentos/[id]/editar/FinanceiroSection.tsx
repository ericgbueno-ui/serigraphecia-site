"use client";

import { useState, useEffect } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "var(--text)",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  color: "#000000",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--muted)",
  marginBottom: "6px",
  display: "block",
};

interface Props {
  totalCents: number;
  depositCents: number;
  cashbackRedeemedCents: number;
  remainderCents: number;
  payMethod: string;
}

export function FinanceiroSection({
  totalCents,
  depositCents,
  cashbackRedeemedCents,
  remainderCents,
  payMethod: initialPayMethod,
}: Props) {
  const fmt = (cents: number) => (cents / 100).toFixed(2);
  const parse = (v: string) => Math.round(parseFloat(v || "0") * 100);

  const [payMethod, setPayMethod] = useState(initialPayMethod);
  const [total, setTotal] = useState(fmt(totalCents));
  const [deposit, setDeposit] = useState(fmt(depositCents));
  const [cashback, setCashback] = useState(fmt(cashbackRedeemedCents));
  const [remainder, setRemainder] = useState(fmt(remainderCents));

  useEffect(() => {
    const totalVal = parse(total);
    const cashbackVal = parse(cashback);

    let depositVal = parse(deposit);
    if (payMethod === "pix_50") {
      depositVal = Math.round(totalVal / 2);
      setDeposit(fmt(depositVal));
    } else if (payMethod === "pix") {
      depositVal = totalVal;
      setDeposit(fmt(depositVal));
    }

    const rem = Math.max(0, totalVal - depositVal - cashbackVal);
    setRemainder(fmt(rem));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payMethod, total, cashback]);

  // recalcula remainder quando deposit muda manualmente
  useEffect(() => {
    if (payMethod === "manual" || payMethod === "cartao") {
      const totalVal = parse(total);
      const depositVal = parse(deposit);
      const cashbackVal = parse(cashback);
      const rem = Math.max(0, totalVal - depositVal - cashbackVal);
      setRemainder(fmt(rem));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deposit]);

  const remainderNum = parse(remainder);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Total (R$)</label>
        <input
          name="totalCents"
          type="number"
          step="0.01"
          min="0"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Pago / Sinal (R$)</label>
        <input
          name="depositCents"
          type="number"
          step="0.01"
          min="0"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Cashback Resgatado (R$)</label>
        <input
          name="cashbackRedeemed"
          type="number"
          step="0.01"
          min="0"
          value={cashback}
          onChange={(e) => setCashback(e.target.value)}
          style={inputStyle}
          placeholder="0.00"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Forma de pagamento</label>
        <select
          name="payMethod"
          value={payMethod}
          onChange={(e) => setPayMethod(e.target.value)}
          style={selectStyle}
        >
          <option value="pix">PIX (Total)</option>
          <option value="pix_50">PIX 50% (Sinal)</option>
          <option value="cartao">Cartão</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Restante a Pagar (R$)</label>
        <input
          name="remainderDisplay"
          type="number"
          step="0.01"
          min="0"
          value={remainder}
          readOnly
          style={{
            ...inputStyle,
            opacity: 0.6,
            cursor: "not-allowed",
            color: remainderNum > 0 ? "var(--gold, #d4a827)" : "var(--muted)",
          }}
          title="Calculado automaticamente: Total − Pago/Sinal"
        />
      </div>
    </div>
  );
}
