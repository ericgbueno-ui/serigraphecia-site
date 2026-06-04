#!/usr/bin/env node
/**
 * Seed: Inteligência Competitiva — Mercado de Transfers POA ↔ Gramado
 * Insere chunks na tabela JolieKnowledge para uso no RAG da Jolie.
 *
 * Uso: node scripts/seed-jolie-intelligence.mjs
 * Requer: DATABASE_URL no .env.local ou .env
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ── Carrega .env.local / .env ────────────────────────────────────────────────
for (const file of [".env.local", ".env"]) {
  const p = join(process.cwd(), file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (!(k in process.env)) {
      process.env[k] = v.replace(/^["']|["']$/g, "").trim();
    }
  }
}

const prisma = new PrismaClient();

// ── Chunks de conhecimento ───────────────────────────────────────────────────

const CHUNKS = [
  // ── MERCADO GERAL ──────────────────────────────────────────────────────────
  {
    type: "inteligencia_mercado",
    title: "Estrutura do mercado de transfers POA–Gramado",
    content: `O trajeto Porto Alegre (Aeroporto Salgado Filho/POA) ↔ Gramado/Canela (~118–120 km) sustenta cerca de 1.000 empresas e prestadores no Google Meu Negócio, mas 50 empresas detêm mais de 60% das avaliações e do tráfego orgânico.

Segmentação do mercado:
- Operadoras de massa (5%): ônibus/vans compartilhadas, tarifas mais baixas, desafio de padronização. Nota média 4.0–4.5.
- Agências executivas privativas (15%): sedans e SUVs, atendimento personalizado, notas mais altas. Nota média 4.8–5.0.
- Motoristas autônomos/MEIs (60%): bom custo-benefício, mas muitos sem Cadastur.
- Intermediários/Marketplaces (20%): captam leads digitais e redistribuem.

Como usar: Jolie deve reforçar que a Multi Trip é uma agência executiva privativa com Cadastur, diferente dos autônomos sem credenciais e das operadoras de massa impessoais.`,
  },

  // ── PRECIFICAÇÃO DO MERCADO ───────────────────────────────────────────────
  {
    type: "inteligencia_mercado",
    title: "Tabela de preços do mercado — transfers POA–Gramado",
    content: `Referência de preços praticados pelo mercado em 2025/2026:

Transfer Compartilhado (vans/ônibus):
- R$ 80 a R$ 150 por trecho por pessoa
- Tour Fácil: a partir de R$ 159,90 ida e volta
- Ponto negativo: espera de até 2h no aeroporto + paradas em hotéis (viagem vira 4h)

Transfer Privativo Standard (sedan/van até 6):
- R$ 250 a R$ 400 por trecho
- Roque'r Turismo: ida e volta por R$ 497 para até 4 pessoas
- Benefício: saída imediata, porta a porta

Transfer Privativo Premium (SUVs/luxo):
- R$ 450 a R$ 700+ por trecho

Tour + Transfer Integrado:
- US$ 100 a US$ 300+, transformando a viagem de 2h em roteiro de 8–10h com paradas

Como usar: Jolie deve posicionar os preços da Multi Trip como premium justificado, não caro. Mostrar que o compartilhado pode demorar 4h contra 2h do privativo.`,
  },

  // ── GATILHOS DE SATISFAÇÃO (5 ESTRELAS) ──────────────────────────────────
  {
    type: "gatilho_satisfacao",
    title: "O que gera avaliações 5 estrelas em transfers — padrões do mercado",
    content: `Auditoria de milhares de avaliações revela os fatores que geram 5 estrelas:

1. PONTUALIDADE (70%+ das avaliações máximas citam este fator)
   - Motorista rastreia o voo em tempo real
   - Já está a postos ANTES do desembarque, com placa personalizada com o nome do cliente
   - Auxílio imediato com as malas

2. MOTORISTA COMO ANFITRIÃO CULTURAL
   - Conta a história da imigração alemã e italiana durante a subida da Serra
   - Bilinguismo prático (inglês/espanhol) valorizado por estrangeiros
   - Sabe a hora de ficar em silêncio (não fala em excesso)
   - Proatividade: para em farmácia sem cobrar extra, resolve problemas práticos

3. SEGURANÇA NA NEBLINA ("heróis da neblina")
   - Motoristas que mantêm calma e técnica sob a densa cerração da Serra são exaltados
   - Condução suave nas curvas = avaliação 5 estrelas
   - Cadeirinhas infantis gratuitas = fidelização de famílias

4. VEÍCULO E FLEXIBILIDADE
   - Carro impecavelmente limpo e cheiroso
   - Paradas curtas para fotos no Pórtico de Gramado ou lojas de chocolate
   - Rota Romântica (RS-235 via Nova Petrópolis) gera excelentes comentários e justifica preço premium

Como usar: A Multi Trip já pratica tudo isso. Jolie deve citar esses pontos como diferenciais reais ao responder objeções de preço.`,
  },

  // ── DORES E RECLAMAÇÕES DOS CONCORRENTES ─────────────────────────────────
  {
    type: "dor_concorrente",
    title: "Principais falhas dos concorrentes — gatilhos de avaliação negativa",
    content: `O que gera avaliações de 1 a 3 estrelas nos concorrentes:

1. FALHAS DE COMUNICAÇÃO (atrito pré-serviço)
   - Falta de suporte rápido via WhatsApp
   - Instruções confusas sobre onde o motorista espera no aeroporto
   - Cliente chega ansioso e não encontra o motorista = nota 1

2. CONDUÇÃO INSEGURA
   - Frenagens bruscas e excesso de velocidade nas curvas da Serra
   - Condução agressiva na neblina = avaliação imediata 1 estrela

3. FALTA DE PLANO DE CONTINGÊNCIA
   - Problemas mecânicos são perdoados SE houver comunicação rápida
   - Deixar o cliente na beira da estrada sem veículo reserva ("backup") = nota 1 inevitável

4. VENDAS OCULTAS / ASSÉDIO COMERCIAL
   - Motoristas que forçam paradas em restaurantes ou atrações apenas para receber comissão
   - Turistas sentem "assédio comercial" e relatam nas avaliações

5. PROMESSAS NÃO CUMPRIDAS
   - Operadoras grandes prometem guias bilíngues que não aparecem no veículo
   - Destroy completo da confiança

6. ATRITOS DO TRANSPORTE COMPARTILHADO
   - Espera de até 2h no aeroporto para reunir passageiros
   - Paradas em múltiplos hotéis = viagem de 2h vira 4h+

Como usar: Jolie pode usar essas dores para diferenciar a Multi Trip sem citar concorrentes pelo nome. Ex: "Com a gente você não espera ninguém — sai na hora que quiser."`,
  },

  // ── CONCORRENTES: ANÁLISE INDIVIDUAL ─────────────────────────────────────
  {
    type: "dor_concorrente",
    title: "Análise de concorrentes específicos — fraquezas e diferenciais",
    content: `BROCKER TURISMO (operadora de massa)
- Ponto forte: infraestrutura própria no aeroporto, vans novas, equipe nos portões de desembarque
- Fraquezas: espera de até 1h entre saídas, serviço apressado e impessoal, falhas em traduções para estrangeiros, padronização inconsistente
- Nota média: 4.0–4.5

JMI TRANSPORTES (nota 4.9/5.0)
- Ponto forte: atendimento humanizado via WhatsApp (atendente Jéssica reconhecida por nome), motoristas elogiados nominalmente (Jerri, Celso, Alan)
- Fraqueza: menor porte, capacidade limitada
- Referência para o mercado em custo-benefício

MERCOSUL TRANSPORTE & TURISMO (nota 4.9–5.0)
- Modelo de excelência em traslado privativo
- Motorista/guia Sr. Cleber elogiado constantemente por nome
- Rastreamento de voos para eliminar espera no desembarque
- Tours personalizados a partir do aeroporto
- Forte apelo entre estrangeiros no TripAdvisor

DRIVE CONCEPT (boutique de luxo, nota 4.9–5.0)
- Foco em alto padrão: Wi-Fi, bebidas frias, bilinguismo, discrição
- Veículos de luxo, roteiros 100% customizados
- Público premium/executivo

ROQUE'R TURISMO / TRANSPORTES FEITEN
- Transfer privativo porta a porta
- Usa RS-020 (via Gravataí) como alternativa ao trânsito
- Preços fixos, sem surpresas

TOUR FÁCIL / WINEBUS
- Setor compartilhado, preços agressivos
- Declaram claramente o tempo de espera no contrato (gerenciamento de expectativas)

Como usar: Multi Trip compete diretamente com JMI, Mercosul e Drive Concept. Jolie deve enfatizar que a Multi Trip oferece o mesmo nível de excelência com atendimento 24h, Cadastur, placa com nome e monitoramento de voo.`,
  },

  // ── ROTAS ────────────────────────────────────────────────────────────────
  {
    type: "inteligencia_mercado",
    title: "Rotas POA–Gramado — vantagens e desvantagens",
    content: `RS-115 (via Taquara) — rota mais utilizada
- Prós: a mais rápida, ~1h30–2h
- Contras: excesso de caminhões, pedágios, frequentemente criticada

ROTA ROMÂNTICA (BR-116 + RS-235 via Nova Petrópolis)
- Prós: alto valor cênico, arquitetura germânica, gera excelentes avaliações, justifica preço premium
- A Multi Trip já oferece esta rota como opcional (acréscimo R$ 190,90)
- Paradas: Parque Histórico Jorge Kuhn, Mirante da Torre, Labirinto Verde

RS-020 (via Gravataí) — plano B
- Usada em dias de bloqueio ou trânsito intenso
- Motoristas que conhecem esta alternativa são elogiados pela proatividade

Como usar: Jolie pode usar a Rota Romântica como argumento de valor: "Você prefere chegar direto ou quer que a viagem já comece no caminho?"`,
  },

  // ── CLIMA E RESILIÊNCIA ───────────────────────────────────────────────────
  {
    type: "gatilho_satisfacao",
    title: "Fatores climáticos e resiliência — diferencial valorizado pelos clientes",
    content: `NEBLINA ("ruço") da Serra Gaúcha:
- Fator crítico avaliado pelos clientes
- Motoristas que mantêm calma e técnica sob cerração intensa são chamados de "heróis da neblina"
- Condução agressiva na neblina = nota 1 imediata
- A Multi Trip deve reforçar que seus motoristas são especialistas nessa rota, com anos de experiência nas curvas e neblina da Serra

ENCHENTES 2024 (contexto do RS):
- Severas enchentes no RS e fechamento do Aeroporto Salgado Filho mudaram a métrica de avaliação
- Empatia virou ouro: agências que não cobraram multas, devolveram dinheiro e navegaram por desvios alternativos com segurança viram reputação decolar
- Lição: clientes valorizam empresas que colocam o cliente acima do lucro em momentos difíceis

Como usar: Se cliente mencionar medo de neblina ou estrada, Jolie responde: "Nossos motoristas fazem essa rota todos os dias, com experiência total na Serra — neblina, chuva ou sol, eles conhecem cada curva."`,
  },

  // ── LINGUAGEM REAL DOS CLIENTES ───────────────────────────────────────────
  {
    type: "linguagem_cliente",
    title: "Vocabulário e frases reais de clientes de transfers Serra Gaúcha",
    content: `Expressões e padrões de linguagem identificados nas avaliações reais:

Elogios frequentes:
- "motorista super atencioso e pontual"
- "já estava me esperando com a placa"
- "viagem passou num piscar de olhos"
- "heróis da neblina"
- "senti que estava com um amigo local, não com um motorista"
- "carro cheiroso e impecável"
- "cadeirinha inclusa sem cobrar nada a mais"
- "respondeu no WhatsApp na hora, sem demora"
- "explicou tudo sobre Gramado durante a viagem"

Reclamações frequentes dos concorrentes:
- "fiquei esperando 2 horas no aeroporto"
- "motorista não falava nada, só dirigiu"
- "parou em restaurante sem a gente pedir" (vendas ocultas)
- "prometeram guia bilíngue e não tinha ninguém"
- "carro com cheiro de cigarro"
- "freou muito bruscamente nas curvas"
- "não tinha número para contato no WhatsApp"

Como usar: Jolie deve usar esse vocabulário nas respostas — "na hora que pousar já tem alguém com seu nome", "você não espera ninguém", "a viagem vai passar voando".`,
  },

  // ── PLATAFORMAS E REPUTAÇÃO DIGITAL ──────────────────────────────────────
  {
    type: "inteligencia_mercado",
    title: "Comportamento nas plataformas de avaliação — Google vs TripAdvisor/Viator",
    content: `GOOGLE MAPS (público brasileiro):
- Avaliações pragmáticas: preço, pontualidade, limpeza
- Notas abaixo de 4.2 = queda de visibilidade orgânica
- Algoritmo valoriza "recência" — empresas top pedem review via WhatsApp logo após a viagem
- Respostas rápidas às avaliações negativas ajudam a reverter impressões futuras

TRIPADVISOR e VIATOR (turistas estrangeiros e classe A):
- Avaliações mais longas e narrativas
- Foco na experiência com o guia e facilidade de reserva
- Comissões das plataformas chegam a 25%, mas o cliente paga pela garantia de cancelamento e segurança
- Palavras-chave valorizadas: "seamless experience", "knowledgeable guide", "on time"

PADRÃO DE EXCELÊNCIA DIGITAL:
- Envio antecipado da foto do motorista e placa do carro via WhatsApp
- Rastreamento de voo e comunicação proativa sobre horário de chegada
- Pedido de review logo após a entrega no hotel (ainda com emoção positiva)

Como usar: Jolie deve sugerir ao cliente deixar avaliação após a viagem, e a equipe deve pedir via WhatsApp no dia seguinte.`,
  },

  // ── ESTRATÉGIA DE OBJEÇÕES BASEADA NO MERCADO ────────────────────────────
  {
    type: "objecao",
    title: "Objeções de preço vs concorrentes — argumentos baseados no mercado",
    content: `Quando o cliente compara com transfer compartilhado mais barato:
"Entendo — o compartilhado custa menos, mas você vai esperar até 2h no aeroporto para reunir outros passageiros, e ainda pará em vários hotéis pelo caminho. Uma viagem de 2h pode virar 4h ou mais. Com a gente, você sai na hora que quiser, direto para o seu hotel. Parcelando em 4x fica muito mais próximo do que parece."

Quando o cliente pesquisou concorrentes mais baratos:
"Qualidade a esse nível — motorista especializado na Serra, monitoramento do voo, placa com seu nome, cadeirinha inclusa — tem um custo justo. O que a gente não entrega nunca: espera, surpresa, motorista apressado. Já passamos dos 1.000 transfers e temos 4.9★ no Google."

Quando pergunta sobre apps (Uber/99):
"Na Serra tem neblina, curvas e altitude. Aplicativo manda o motorista disponível — sem garantia de veículo, sem espera por voo atrasado, sem conhecimento da rota. Com a gente você tem um profissional que faz esse trajeto todo dia. Se o voo atrasar 1h, ele aguarda sem cobrar nada a mais."

Fator resiliência climática:
"Nossos motoristas conhecem cada curva da Serra — com neblina, chuva ou sol. Essa é a rota deles todos os dias."`,
  },

  // ── TENDÊNCIAS FUTURAS ────────────────────────────────────────────────────
  {
    type: "tendencia_busca",
    title: "Tendências do mercado de transfers Serra Gaúcha 2025–2026",
    content: `Hiper-personalização digital:
- Integração total via WhatsApp: envio antecipado de foto do motorista + placa já é padrão de corte para notas máximas
- Rastreamento de voo em tempo real e compartilhamento de GPS

Sustentabilidade:
- Veículos elétricos e híbridos começando a aparecer
- Turistas com consciência ecológica começam a perguntar sobre emissões
- Oportunidade para Multi Trip com SUV Elétrico no portfólio

Tour + Transfer Integrado:
- Tendência crescente: transformar a viagem de 2h em roteiro de 8–10h com paradas turísticas
- Bate e volta para Vale dos Vinhedos, Cânions de Cambará, Linha Bella
- Preços premium justificados pela experiência completa

Demanda por veículos blindados:
- Nicho emergente: executivos e figuras públicas que buscam segurança máxima no traslado

Como usar: Jolie pode mencionar o SUV Elétrico como opção sustentável e premium quando perceber perfil executivo ou consciente ambientalmente.`,
  },
];

// ── Inserção no banco ────────────────────────────────────────────────────────

async function seed() {
  console.log(`\n🧠 Inserindo ${CHUNKS.length} chunks de inteligência competitiva na JolieKnowledge...\n`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const chunk of CHUNKS) {
    try {
      // Verifica se já existe chunk com mesmo title para evitar duplicata
      const existing = await prisma.jolieKnowledge.findFirst({
        where: { title: chunk.title },
        select: { id: true },
      });

      if (existing) {
        console.log(`⏭  Já existe: ${chunk.title.slice(0, 60)}`);
        skip++;
        continue;
      }

      await prisma.jolieKnowledge.create({
        data: {
          type: chunk.type,
          title: chunk.title,
          content: chunk.content,
          source: "manual",
          sourceRef: "auditoria_mercado_poa_gramado_2026",
          successRate: 1.0,
          usageCount: 0,
          active: true,
        },
      });

      console.log(`✅ Inserido: ${chunk.title.slice(0, 60)}`);
      ok++;
    } catch (err) {
      console.error(`❌ Falhou: ${chunk.title.slice(0, 60)} — ${err.message}`);
      fail++;
    }
  }

  console.log(`\n📊 Resultado: ${ok} inseridos | ${skip} já existiam | ${fail} erros`);

  // Mostra total atual
  const total = await prisma.jolieKnowledge.count({ where: { active: true } });
  console.log(`📚 JolieKnowledge total ativo: ${total} chunks\n`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
