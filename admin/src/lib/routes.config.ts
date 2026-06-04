import { SITE, waLink } from "./site";

export type TransferRoute = {
  slug: string;
  origem: string;
  destino: string;
  badge: string;
  h1Line1: string;
  h1Line2: string;
  subtitle: string;
  heroImage: string;
  heroImageAlt: string;
  heroCaption: { label: string; text: string };
  features: string[];
  advantages: Array<{ title: string; text: string }>;
  howItWorks: { title: string; paragraphs: string[] };
  seo: {
    title: string;
    description: string;
    ogDescription: string;
    ogImage: string;
    ogImageAlt: string;
  };
  jsonLd: {
    serviceName: string;
    areaServed: string[];
    breadcrumbLabel: string;
  };
  whatsappMessage: string;
  routeId?: string;
};

export const TRANSFER_ROUTES: TransferRoute[] = [
  {
    slug: "porto-alegre-gramado",
    origem: "Porto Alegre",
    destino: "Gramado e Canela",
    badge: "Aeroporto Salgado Filho → Serra Gaúcha",
    h1Line1: "Transfer Porto Alegre",
    h1Line2: "→ Gramado e Canela",
    subtitle:
      "Sua experiência na Serra Gaúcha começa no desembarque. A Multi Trip monitora seu voo, organiza a recepção e conduz o trajeto com conforto, clareza e atenção real ao detalhe.",
    heroImage: "/photos/serra/portico.webp",
    heroImageAlt: "Pórtico de Gramado na Serra Gaúcha",
    heroCaption: {
      label: "Um começo mais elegante",
      text: "Menos atrito no aeroporto, mais tranquilidade para subir a serra.",
    },
    features: [
      "Monitoramento do voo em tempo real",
      "Recepção organizada no desembarque",
      "Rota Romântica opcional no trajeto",
      "Atendimento humano e confirmação rápida",
    ],
    advantages: [
      {
        title: "Chegada sem atrito",
        text: "Você desembarca e já sabe para onde seguir. A recepção é planejada para reduzir esperas, dúvida e improviso.",
      },
      {
        title: "Conforto para sair do aeroporto",
        text: "Depois do voo, o passageiro só quer fluidez. A operação foi desenhada para tornar a transição até a Serra muito mais leve.",
      },
      {
        title: "Rota com mais experiência",
        text: "Se fizer sentido para o seu roteiro, a Rota Romântica pode entrar como um upgrade de paisagem e memória.",
      },
    ],
    howItWorks: {
      title: "Como funciona o trajeto do Aeroporto Salgado Filho até a Serra",
      paragraphs: [
        "A viagem entre Porto Alegre e Gramado costuma ter aproximadamente 120 km. Com a Multi Trip, a recepção é acompanhada desde o voo, o motorista chega preparado e você segue com conforto até o hotel, pousada ou endereço final.",
        "Se o seu roteiro pede uma chegada mais panorâmica, a Rota Romântica pode ser considerada como um upgrade de experiência. Não é apenas uma estrada. É a entrada para a viagem em clima de Serra Gaúcha.",
      ],
    },
    seo: {
      title: "Transfer Porto Alegre → Gramado e Canela — Privativo, Sem Stress",
      description:
        "Transfer privativo do Aeroporto Salgado Filho para Gramado e Canela com monitoramento de voo, conforto real e atendimento humano do início ao fim.",
      ogDescription:
        "Chegue em Gramado com conforto, pontualidade e recepção organizada no Aeroporto Salgado Filho.",
      ogImage: "/photos/serra/portico.webp",
      ogImageAlt: "Transfer Porto Alegre para Gramado — Multi Trip",
    },
    jsonLd: {
      serviceName: "Transfer Aeroporto Porto Alegre → Gramado e Canela",
      areaServed: ["Porto Alegre", "Gramado", "Canela"],
      breadcrumbLabel: "Transfer POA → Gramado",
    },
    whatsappMessage:
      "Olá, Jolie! 🤎 Quero reservar meu transfer de Porto Alegre para Gramado e Canela. Podem me ajudar?",
    routeId: "poa_gramado",
  },
  {
    slug: "caxias-gramado",
    origem: "Caxias do Sul",
    destino: "Gramado e Canela",
    badge: "Serra Gaúcha → Serra Gaúcha",
    h1Line1: "Transfer Caxias do Sul",
    h1Line2: "→ Gramado e Canela",
    subtitle:
      "Transfer privativo entre Caxias do Sul e a Serra Gaúcha. Conforto, pontualidade e motoristas especializados para conectar as duas maiores cidades da região serrana.",
    heroImage: "/photos/serra/portico.webp",
    heroImageAlt: "Serra Gaúcha — Gramado e Canela",
    heroCaption: {
      label: "Conexão dentro da Serra",
      text: "Caxias do Sul a Gramado com a comodidade de um transfer privativo.",
    },
    features: [
      "Transfer privativo, sem divisão com outros passageiros",
      "Motoristas com experiência nas serras gaúchas",
      "Trajeto panorâmico pelas serras",
      "Atendimento humano e confirmação rápida",
    ],
    advantages: [
      {
        title: "Sem esperar lotar",
        text: "O veículo sai no horário que você escolhe. Não há outros passageiros, não há espera por completar grupo.",
      },
      {
        title: "Conforto entre cidades",
        text: "Cerca de 1 hora de trajeto pelas serras, com conforto executivo desde o embarque até o endereço final.",
      },
      {
        title: "Motoristas da Serra",
        text: "Nossa equipe conhece cada detalhe das estradas e dos destinos da região, garantindo segurança e fluidez.",
      },
    ],
    howItWorks: {
      title: "Como funciona o transfer de Caxias do Sul para Gramado",
      paragraphs: [
        "O trajeto entre Caxias do Sul e Gramado percorre aproximadamente 80 km pelas serras gaúchas. A Multi Trip busca você no endereço combinado e leva até o destino final, sem escalas ou transbordos.",
        "Ideal para quem veio a trabalho em Caxias e quer aproveitar a Serra, para famílias em roteiro regional ou para grupos que chegam pela rodoviária e preferem conforto até Gramado.",
      ],
    },
    seo: {
      title: "Transfer Caxias do Sul → Gramado e Canela — Privativo e Confortável",
      description:
        "Transfer privativo de Caxias do Sul para Gramado e Canela. Conforto, pontualidade e motoristas especializados na Serra Gaúcha.",
      ogDescription:
        "Conecte Caxias do Sul a Gramado com conforto e praticidade. Transfer privativo da Multi Trip.",
      ogImage: "/photos/serra/portico.webp",
      ogImageAlt: "Transfer Caxias do Sul para Gramado — Multi Trip",
    },
    jsonLd: {
      serviceName: "Transfer Caxias do Sul → Gramado e Canela",
      areaServed: ["Caxias do Sul", "Gramado", "Canela"],
      breadcrumbLabel: "Transfer Caxias → Gramado",
    },
    whatsappMessage:
      "Olá, Jolie! 🤎 Quero organizar meu transfer de Caxias do Sul para Gramado e Canela. Podem me ajudar?",
    routeId: "caxias_gramado",
  },
  {
    slug: "bento-goncalves-vale-dos-vinhedos",
    origem: "Bento Gonçalves",
    destino: "Vale dos Vinhedos",
    badge: "Capital do Vinho → Vale dos Vinhedos",
    h1Line1: "Transfer Bento Gonçalves",
    h1Line2: "→ Vale dos Vinhedos",
    subtitle:
      "Transfer privativo para o Vale dos Vinhedos. Perfeito para aproveitar as vinícolas da Serra Gaúcha sem preocupação com o retorno.",
    heroImage: "/photos/serra/portico.webp",
    heroImageAlt: "Vale dos Vinhedos — Bento Gonçalves Serra Gaúcha",
    heroCaption: {
      label: "Curta sem se preocupar",
      text: "Nós cuidamos do trajeto. Você aproveita os vinhos.",
    },
    features: [
      "Transfer privativo para vinícolas do Vale",
      "Flexibilidade de horário para degustações",
      "Motorista aguarda ou retorna no horário combinado",
      "Atendimento humano e confirmação rápida",
    ],
    advantages: [
      {
        title: "Beba com tranquilidade",
        text: "Com um motorista dedicado, você aproveita as degustações sem a preocupação de dirigir nas estradas sinuosas da Serra.",
      },
      {
        title: "Sem depender de horário fixo",
        text: "O transfer privativo se adapta ao ritmo da sua visita. Se a degustação se estender, o motorista espera.",
      },
      {
        title: "De volta ao hotel com conforto",
        text: "Ao fim do passeio, você volta relaxado para a hospedagem. Sem aplicativos de transporte ou correria.",
      },
    ],
    howItWorks: {
      title: "Como funciona o transfer para o Vale dos Vinhedos",
      paragraphs: [
        "O Vale dos Vinhedos fica a cerca de 12 km do centro de Bento Gonçalves. A Multi Trip busca você na hospedagem ou no endereço combinado e leva até a vinícola escolhida, com possibilidade de retorno ou espera programada.",
        "Ideal para casais em lua de mel, grupos de amigos em roteiro enoturístico ou qualquer viajante que queira explorar o Vale com mais liberdade e segurança.",
      ],
    },
    seo: {
      title: "Transfer Bento Gonçalves → Vale dos Vinhedos — Enoturismo sem Preocupação",
      description:
        "Transfer privativo de Bento Gonçalves para o Vale dos Vinhedos. Ideal para enoturismo na Serra Gaúcha com conforto e sem preocupação com o retorno.",
      ogDescription:
        "Explore o Vale dos Vinhedos com conforto. Transfer privativo da Multi Trip em Bento Gonçalves.",
      ogImage: "/photos/serra/portico.webp",
      ogImageAlt: "Transfer Bento Gonçalves para Vale dos Vinhedos — Multi Trip",
    },
    jsonLd: {
      serviceName: "Transfer Bento Gonçalves → Vale dos Vinhedos",
      areaServed: ["Bento Gonçalves", "Vale dos Vinhedos"],
      breadcrumbLabel: "Transfer Bento → Vale dos Vinhedos",
    },
    whatsappMessage:
      "Olá, Jolie! 🤎 Quero organizar meu transfer de Bento Gonçalves para o Vale dos Vinhedos. Podem me ajudar?",
  },
];

export function getRouteBySlug(slug: string): TransferRoute | undefined {
  return TRANSFER_ROUTES.find((r) => r.slug === slug);
}

export function buildRouteUrl(slug: string): string {
  return `${SITE.url}/transfer/${slug}`;
}

export function buildRouteJsonLd(route: TransferRoute) {
  const pageUrl = buildRouteUrl(route.slug);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: route.jsonLd.serviceName,
        serviceType: "Transfer Privativo",
        description: route.seo.description,
        url: pageUrl,
        provider: {
          "@type": "LocalBusiness",
          "@id": `${SITE.url}#business`,
          name: SITE.legalName,
          url: SITE.url,
          telephone: `+${SITE.whatsE164}`,
          logo: `${SITE.url}/brand/logo-horizontal.webp`,
        },
        areaServed: route.jsonLd.areaServed.map((name) => ({
          "@type": "City",
          name,
        })),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `Categorias de Veículo — ${route.jsonLd.serviceName}`,
          itemListElement: [
            {
              "@type": "Offer",
              name: "Sedan Premium (até 4 pessoas)",
              description:
                "Transfer privativo em Sedan Premium para até 4 pessoas. Monitoramento de voo incluso.",
              eligibleQuantity: { "@type": "QuantitativeValue", maxValue: 4, unitText: "pessoas" },
            },
            {
              "@type": "Offer",
              name: "Spin 6 Lugares (até 6 pessoas)",
              description:
                "Transfer privativo em minivan Spin para famílias ou grupos de até 6 pessoas.",
              eligibleQuantity: { "@type": "QuantitativeValue", maxValue: 6, unitText: "pessoas" },
            },
          ],
        },
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: pageUrl,
          servicePhone: `+${SITE.whatsE164}`,
          availableLanguage: { "@type": "Language", name: "Portuguese" },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Transfer", item: `${SITE.url}/transfer` },
          {
            "@type": "ListItem",
            position: 3,
            name: route.jsonLd.breadcrumbLabel,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}

export function buildRouteWhatsappLink(route: TransferRoute): string {
  return waLink(route.whatsappMessage, SITE.whatsE164);
}
