"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE, waLink } from "@/lib/site";
import { WhatsLink } from "./WhatsLink";

const WHATSAPP_MESSAGE =
  "Olá! Estou vendo a página principal da Multi Trip e gostaria de reservar. Pode me ajudar? 🙏";

export function StickyCtaBar() {
  const pathname = usePathname();

  // Não exibir em páginas de pagamento, reserva ou admin
  const hide =
    pathname.startsWith("/pagamento") ||
    pathname.startsWith("/reserva") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin");

  if (hide) return null;

  // Detecta a rota atual para direcionar o CTA corretamente
  const isCaxias = pathname.includes("caxias");
  const transferUrl = isCaxias ? "/transfer/caxias-gramado" : "/transfer/porto-alegre-gramado";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/70 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-5xl gap-2 px-3 py-3">
        <Link href={transferUrl} className="btn-primary flex-[2] justify-center text-sm">
          Garantir minha data
        </Link>

        <WhatsLink
          href={waLink(WHATSAPP_MESSAGE, SITE.whatsE164)}
          className="flex-1 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 transition"
          variant="image"
          iconSrc="/brand/chama-whatsapp.webp"
          imgWidth={260}
          imgHeight={80}
          imgClassName="h-11 w-auto"
          iconOnly
          srLabel="Falar com a Jolie pelo WhatsApp"
          title="Falar com a Jolie"
        />
      </div>
    </div>
  );
}
