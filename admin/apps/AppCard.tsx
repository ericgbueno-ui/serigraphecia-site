"use client";

import Link from "next/link";
import { useState } from "react";

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  features: string[];
}

export function AppCard({ app }: { app: App }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={app.url}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          background: isHovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
          border: isHovered ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          overflow: "hidden",
          transition: "all 0.3s ease",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header do Card */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--primary, #3b82f6), var(--primary-dark, #1e40af))",
            padding: "24px",
            textAlign: "center" as const,
          }}
        >
          <div style={{
            fontSize: 48,
            marginBottom: 12,
          }}>
            {app.icon}
          </div>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: "white",
            margin: 0,
          }}>
            {app.name}
          </h2>
        </div>

        {/* Conteúdo */}
        <div
          style={{
            padding: "20px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
              margin: "0 0 16px 0",
              lineHeight: 1.5,
            }}
          >
            {app.description}
          </p>

          {/* Features */}
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.5)",
                margin: "0 0 8px 0",
                letterSpacing: "0.5px",
              }}
            >
              Funcionalidades
            </p>
            <ul
              style={{
                margin: 0,
                padding: "0 0 0 16px",
                listStyle: "none",
              }}
            >
              {app.features.map((feature, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: 6,
                  }}
                >
                  ✓ {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Botão */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(59, 130, 246, 0.2)",
              color: "#60a5fa",
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            Abrir App →
          </div>
        </div>
      </div>
    </Link>
  );
}
