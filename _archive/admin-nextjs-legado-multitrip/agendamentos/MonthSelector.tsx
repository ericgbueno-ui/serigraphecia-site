"use client";

import { useRouter } from "next/navigation";

export default function MonthSelector({
  months,
  selectedMonth,
  basePath = "/admin/agendamentos",
}: {
  months: string[];
  selectedMonth: string;
  basePath?: string;
}) {
  const router = useRouter();

  function monthLabel(key: string) {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Filtrar por Mês:
      </span>
      <select
        value={selectedMonth}
        onChange={(e) => {
          router.push(`${basePath}?month=${e.target.value}`);
        }}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          padding: "8px 16px",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 600,
          outline: "none",
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        className="hover:border-[rgba(201,168,76,0.5)] focus:border-[var(--gold)]"
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
