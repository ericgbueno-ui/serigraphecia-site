// POST /api/admin/b2b/import — importa as 39 agências reais do lote original
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

const ORIGINAL_39 = [
  { name: "Clube Turismo Goiânia",       city: "Goiânia",          state: "GO", instagram: "@clubeturismogoiania",     email: "goiania@clubeturismo.com.br",         site: "www.clubeturismo.com.br"       },
  { name: "Viaje Mais Turismo",          city: "Goiânia",          state: "GO", instagram: "@viajemaisturismo",         email: "comercial@viajemaisturismo.com.br",   site: "www.viajemaisturismo.com.br"   },
  { name: "Azul Viagens Goiânia",        city: "Goiânia",          state: "GO", instagram: "@azulviagensmarista",       email: "goiania@azulviagens.com.br",          site: "www.azulviagens.com.br"        },
  { name: "CVC Valparaíso",              city: "Valparaíso",       state: "GO", instagram: "@cvcvalparaiso",            email: "valparaiso@cvc.com.br",               site: "www.cvc.com.br"                },
  { name: "Mundo Tour Viagens",          city: "Anápolis",         state: "GO", instagram: "@mundotourviagens",         email: "contato@mundotourviagens.com.br",     site: "www.mundotourviagens.com.br"   },
  { name: "Bora Viajar Turismo",         city: "Rio Verde",        state: "GO", instagram: "@boraviajar.tur",           email: "contato@boraviajar.com.br",           site: "www.boraviajar.com.br"         },
  { name: "Destino Certo Turismo",       city: "Aparecida de Goiânia", state: "GO", instagram: "@destinocerto.tur",     email: "atendimento@destinocerto.com.br",     site: "www.destinocerto.com.br"       },
  { name: "Prime Turismo GO",            city: "Goiânia",          state: "GO", instagram: "@primeturismogo",           email: "comercial@primeturismogo.com.br",     site: "www.primeturismogo.com.br"     },
  { name: "Mais Férias Turismo",         city: "Catalão",          state: "GO", instagram: "@maisferias.tur",           email: "contato@maisferias.com.br",           site: "www.maisferias.com.br"         },
  { name: "Elite Travel Goiás",          city: "Goiânia",          state: "GO", instagram: "@elitetravelgo",            email: "contato@elitetravelgo.com.br",        site: "www.elitetravelgo.com.br"      },
  { name: "Conecta Turismo",             city: "Belo Horizonte",   state: "MG", instagram: "@conectaturismobh",         email: "atendimento@conectaturismo.com.br",   site: "www.conectaturismo.com.br"     },
  { name: "Azul Viagens Uberlândia",     city: "Uberlândia",       state: "MG", instagram: "@azulviagensuberlandia",    email: "uberlandia@azulviagens.com.br",       site: "www.azulviagens.com.br"        },
  { name: "Flytour Pouso Alegre",        city: "Pouso Alegre",     state: "MG", instagram: "@flytourpousoalegre",       email: "pousoalegre@flytour.com.br",          site: "www.flytour.com.br"            },
  { name: "Serra Azul Turismo",          city: "Uberaba",          state: "MG", instagram: "@serraazultur",             email: "contato@serraazultur.com.br",         site: "www.serraazultur.com.br"       },
  { name: "Minas Dream Viagens",         city: "Contagem",         state: "MG", instagram: "@minasdreamviagens",        email: "atendimento@minasdream.com.br",       site: "www.minasdream.com.br"         },
  { name: "Bora Viajar MG",             city: "Juiz de Fora",     state: "MG", instagram: "@boraviajarmg",             email: "contato@boraviajarmg.com.br",         site: "www.boraviajarmg.com.br"       },
  { name: "Premium Minas Travel",        city: "Belo Horizonte",   state: "MG", instagram: "@premiumminastravel",       email: "contato@premiumminas.com.br",         site: "www.premiumminas.com.br"       },
  { name: "Essencial Travel MG",         city: "Betim",            state: "MG", instagram: "@essencialtravelmg",        email: "contato@essencialtravelmg.com.br",    site: "www.essencialtravelmg.com.br"  },
  { name: "Viva Turismo Minas",          city: "Montes Claros",    state: "MG", instagram: "@vivaturismominas",         email: "atendimento@vivaturismominas.com.br", site: "www.vivaturismominas.com.br"   },
  { name: "Flytour Franca",              city: "Franca",           state: "SP", instagram: "@flytourfranca",            email: "franca@flytour.com.br",               site: "www.flytour.com.br"            },
  { name: "Mundo em Viagens",            city: "Bauru",            state: "SP", instagram: "@mundoemviagensbauru",      email: "atendimento@mundoemviagens.com.br",   site: "www.mundoemviagens.com.br"     },
  { name: "Essencial Turismo",           city: "Campinas",         state: "SP", instagram: "@essencialturismocps",      email: "contato@essencialturismo.com.br",     site: "www.essencialturismo.com.br"   },
  { name: "Bora Gramado Travel",         city: "Ribeirão Preto",   state: "SP", instagram: "@boragramadotravel",        email: "contato@boragramado.com.br",          site: "www.boragramado.com.br"        },
  { name: "Destino Família Turismo",     city: "Sorocaba",         state: "SP", instagram: "@destinofamiliatur",        email: "atendimento@destinofamilia.com.br",   site: "www.destinofamilia.com.br"     },
  { name: "Premium Travel RP",           city: "Ribeirão Preto",   state: "SP", instagram: "@premiumtravelrp",          email: "contato@premiumtravelrp.com.br",      site: "www.premiumtravelrp.com.br"    },
  { name: "Interior Viagens",            city: "Jundiaí",          state: "SP", instagram: "@interiorviagens",          email: "atendimento@interiorviagens.com.br",  site: "www.interiorviagens.com.br"    },
  { name: "CVC Campinas Interior",       city: "Campinas",         state: "SP", instagram: "@cvccampinasinterior",      email: "campinas@cvc.com.br",                 site: "www.cvc.com.br"                },
  { name: "Azul Viagens Sorocaba",       city: "Sorocaba",         state: "SP", instagram: "@azulviagenssorocaba",      email: "sorocaba@azulviagens.com.br",         site: "www.azulviagens.com.br"        },
  { name: "Viaje Mais Interior",         city: "São José do Rio Preto", state: "SP", instagram: "@viajemaisinterior",   email: "contato@viajemaisinterior.com.br",    site: "www.viajemaisinterior.com.br"  },
  { name: "Partiu Viagens Recife",       city: "Recife",           state: "PE", instagram: "@partiuviagensrecife",      email: "contato@partiuviagens.com.br",        site: "www.partiuviagens.com.br"      },
  { name: "Destino Férias Fortaleza",    city: "Fortaleza",        state: "CE", instagram: "@destinoferiasfortaleza",   email: "contato@destinoferias.com.br",        site: "www.destinoferias.com.br"      },
  { name: "Rota das Viagens",            city: "Salvador",         state: "BA", instagram: "@rotadasviagensssa",        email: "comercial@rotadasviagens.com.br",     site: "www.rotadasviagens.com.br"     },
  { name: "Bora Nordeste Travel",        city: "João Pessoa",      state: "PB", instagram: "@boranordestetravel",       email: "contato@boranordeste.com.br",         site: "www.boranordeste.com.br"       },
  { name: "Viva Gramado Nordeste",       city: "Maceió",           state: "AL", instagram: "@vivagramadonordeste",      email: "atendimento@vivagramado.com.br",      site: "www.vivagramado.com.br"        },
  { name: "Azul Viagens Recife",         city: "Recife",           state: "PE", instagram: "@azulviagensrecife",        email: "recife@azulviagens.com.br",           site: "www.azulviagens.com.br"        },
  { name: "Clube Turismo Fortaleza",     city: "Fortaleza",        state: "CE", instagram: "@clubeturismofortaleza",    email: "fortaleza@clubeturismo.com.br",       site: "www.clubeturismo.com.br"       },
  { name: "Sonhar Turismo",              city: "Natal",            state: "RN", instagram: "@sonharturismo",            email: "contato@sonharturismo.com.br",        site: "www.sonharturismo.com.br"      },
  { name: "Mais Destinos Bahia",         city: "Salvador",         state: "BA", instagram: "@maisdestinosbahia",        email: "atendimento@maisdestinosbahia.com.br", site: "www.maisdestinosbahia.com.br" },
  { name: "Elite Nordeste Travel",       city: "Aracaju",          state: "SE", instagram: "@elitenordestetravel",      email: "contato@elitenordeste.com.br",        site: "www.elitenordeste.com.br"      },
];

export async function POST() {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const existing = await prisma.b2bContact.count();
  if (existing > 0)
    return NextResponse.json({ error: "Contatos já importados. Limpe a tabela antes de reimportar." }, { status: 409 });

  await prisma.b2bContact.createMany({ data: ORIGINAL_39 });
  return NextResponse.json({ ok: true, imported: ORIGINAL_39.length });
}
