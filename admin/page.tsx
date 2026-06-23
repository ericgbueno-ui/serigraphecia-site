import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createAdminToken, verifyAdminToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_TTL } from "@/lib/server/adminAuth";
import { PasswordInput } from "./PasswordInput";

async function loginAction(formData: FormData) {
  "use server";
  const password = formData.get("password")?.toString() ?? "";
  const secret = process.env.ADMIN_PASSWORD ?? "";

  if (secret) {
    const a = Buffer.from(password.padEnd(64, "\0"), "utf-8").subarray(0, 64);
    const b = Buffer.from(secret.padEnd(64, "\0"), "utf-8").subarray(0, 64);
    const match = require("crypto").timingSafeEqual(a, b) && password === secret;
    if (match) {
      const jar = await cookies();
      jar.set(ADMIN_COOKIE_NAME, createAdminToken(secret), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: ADMIN_COOKIE_TTL,
        path: "/",
      });
      redirect("/admin/painel");
    }
  }

  redirect("/admin?error=1");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const jar = await cookies();
  const adminSecret = process.env.ADMIN_PASSWORD;
  const isAdmin = !!adminSecret && verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value ?? "", adminSecret);
  if (isAdmin) redirect("/admin/painel");

  const params = await searchParams;
  const hasError = !!params.error;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 700px 500px at 50% 40%, rgba(201,168,76,0.06), transparent 65%)",
        }}
      />

      <div style={{ width: "100%", maxWidth: "360px", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <Link href="/" aria-label="Voltar para o site" style={{ display: "inline-block" }}>
            <Image
              src="/brand/logo-horizontal.webp"
              alt="[NOME DO NEGÓCIO]"
              width={150}
              height={44}
              style={{ height: "40px", width: "auto", margin: "0 auto", display: "block" }}
            />
          </Link>
          <h1 style={{ marginTop: "24px", fontSize: "20px", fontWeight: 700 }}>
            Painel Administrativo
          </h1>
          <p style={{ marginTop: "6px", fontSize: "13px", color: "var(--muted)" }}>
            Insira a senha de acesso para continuar.
          </p>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-md)",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <form action={loginAction}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  marginBottom: "8px",
                }}
              >
                Senha de administrador
              </label>
              <PasswordInput hasError={hasError} />
            </div>

            {hasError && (
              <div
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.25)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "var(--red)",
                  marginBottom: "16px",
                }}
              >
                Senha incorreta. Tente novamente.
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "13px",
                background: "var(--gold)",
                color: "#05080d",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.03em",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(201,168,76,0.25)",
              }}
            >
              Entrar →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
