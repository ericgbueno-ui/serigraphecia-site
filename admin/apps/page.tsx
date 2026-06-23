import { getIsAdmin } from "@/lib/server/adminAuth";
import { redirect } from "next/navigation";
import { AppCard } from "./AppCard";

export const metadata = {
  title: "Apps | Admin",
};

export default async function AppsPage() {
  if (!(await getIsAdmin())) redirect("/admin");

  const apps = [
    {
      id: "conversas",
      name: "Assistente Conversas",
      description: "Monitor completo de conversas com sidebar e painel de chat",
      icon: "💬",
      url: "/admin/conversas",
      color: "from-blue-600 to-blue-800",
      features: [
        "Lista de conversas com search",
        "Painel de chat completo",
        "Informações do lead",
        "Histórico de mensagens",
      ],
    },
    {
      id: "whats",
      name: "Assistente Whats",
      description: "Interface minimalista tipo WhatsApp - apenas conversas",
      icon: "📱",
      url: "/admin/atendimento-whatsapp",
      color: "from-green-600 to-green-800",
      features: [
        "Interface minimalista",
        "Sidebar + chat em fullscreen",
        "Focado em conversas",
        "Ideal para mobile",
      ],
    },
  ];

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: "24px 20px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
          color: "var(--text)",
        }}>
          Apps Assistente
        </h1>
        <p style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
        }}>
          Acesse os aplicativos de monitoramento de conversas
        </p>
      </div>

      {/* Grid de Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: 20,
        maxWidth: "1200px",
      }}>
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>

      {/* Instruções de Instalação */}
      <div style={{
        marginTop: 48,
        maxWidth: "800px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        padding: 24,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          marginTop: 0,
          marginBottom: 16,
          color: "var(--text)",
        }}>
          📱 Como instalar como App no celular
        </h3>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{
            fontSize: 14,
            fontWeight: 600,
            margin: "0 0 8px 0",
            color: "rgba(255,255,255,0.9)",
          }}>
            Android
          </h4>
          <ol style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            margin: "0 0 0 20px",
            lineHeight: 1.8,
          }}>
            <li>Clique no card do app desejado</li>
            <li>Menu (⋮) → &quot;Instalar app&quot;</li>
            <li>Ícone aparece na tela inicial</li>
          </ol>
        </div>

        <div>
          <h4 style={{
            fontSize: 14,
            fontWeight: 600,
            margin: "0 0 8px 0",
            color: "rgba(255,255,255,0.9)",
          }}>
            iPhone/iPad
          </h4>
          <ol style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            margin: "0 0 0 20px",
            lineHeight: 1.8,
          }}>
            <li>Abra em <strong>Safari</strong></li>
            <li>Compartilhar → &quot;Adicionar à Tela de Início&quot;</li>
            <li>Ícone aparece na tela inicial</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
