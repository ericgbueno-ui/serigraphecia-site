import type { ReactNode } from "react";
import { AdminShell } from "./AdminShell";

// O layout do /admin é apenas um wrapper visual.
// A autenticação é feita em cada página via cookies().
// A /admin/page.tsx (login) renderiza sem a shell.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
