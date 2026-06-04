import Link from "next/link";
import { WhatsLink } from "./WhatsLink";

export function HomeHeroCtas({ whatsE164 }: { whatsE164: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Link href="/checkout?routeId=poa_gramado" className="btn-primary px-8 py-3 shadow-lg">
        Quero garantir minha data
      </Link>
      <Link href="/transfer/porto-alegre-gramado" className="btn-secondary px-8 py-3 shadow-lg">
        Quero escolher minha categoria
      </Link>
      <WhatsLink href={`https://wa.me/${whatsE164}`} className="btn-ghost px-8 py-3 shadow-lg">
        💬 Tire suas dúvidas com a Jolie
      </WhatsLink>
    </div>
  );
}
