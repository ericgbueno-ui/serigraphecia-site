import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import puppeteer from "puppeteer";

const execAsync = promisify(exec);

// Configurações de caminhos
const BASE_DIR = "c:\\Produção de Site\\GitHub\\multitrip-site";
const OUTPUT_DIR = path.join(BASE_DIR, "Roteiros Oficiais Multi Trip");
const PDFS_DIR = path.join(OUTPUT_DIR, "PDFs");
const ASSETS_DIR = path.join(OUTPUT_DIR, "assets");
const IMAGENS_DIR = path.join(OUTPUT_DIR, "imagens");
const CAPAS_DIR = path.join(OUTPUT_DIR, "capas");
const VERSOES_DIR = path.join(OUTPUT_DIR, "versões");
const THUMBNAILS_DIR = path.join(OUTPUT_DIR, "thumbnails");

// Garantir que todas as pastas existam
const directories = [OUTPUT_DIR, PDFS_DIR, ASSETS_DIR, IMAGENS_DIR, CAPAS_DIR, VERSOES_DIR, THUMBNAILS_DIR];
for (const dir of directories) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Pasta criada: ${dir}`);
  }
}

// -------------------------------------------------------------
// DADOS DOS ROTEIROS (CURADORIA EMOCIONAL DA JOLIE)
// -------------------------------------------------------------

const ROTEIROS_DATA = [
  {
    id: "casal-premium",
    title: "Gramado Premium para Casais",
    subtitle: "Sua Jornada de Luxo e Magia a Dois",
    description: "Um refúgio de aconchego, fondues apaixonantes e memórias inesquecíveis nos cenários mais charmosos da Serra Gaúcha.",
    profile: "Casal | Lua de Mel | Primeira Viagem | Luxo Emocional",
    palette: {
      primary: "#5B1024",     // Burgundy
      secondary: "#B76E79",   // Rose Gold
      bg: "#FAF6F0",          // Soft Cream
      text: "#2C3E50",        // Charcoal
      accent: "#D4AF37",      // Gold
      primaryLight: "#FAF0F2",
      cardBg: "#FFFFFF"
    },
    intro: `Sejam muito bem-vindos à Serra Gaúcha, o cenário perfeito para a história de amor de vocês. 🤎<br><br>
Imagine uma manhã fria, onde a névoa suave dança entre as copas dos pinheiros e o perfume de hortênsias frescas preenche o ar. À noite, o crepitar da lareira, a luz suave das velas e duas taças de vinho fino celebram um sonho realizado.<br><br>
Como sua <strong>Concierge de Luxo</strong>, preparei esta curadoria exclusiva. Não se trata apenas de pontos turísticos; desenhei cada deslocamento de forma linear, sem o estresse de "zigue-zagues" geográficos, para que vocês aproveitem cada batida do coração na Serra. Sintam-se acolhidos, protegidos e prontos para viver momentos cinematográficos. Sua jornada dos sonhos começa agora.`,
    itinerary: [
      {
        day: 1,
        title: "O Acolhimento e a Névoa do Amor",
        vector: "Pórtico RS-115 ──► Bella Mia ──► Rua Torta & Centro ──► Lago Negro ──► Catherine (Fondue)",
        timeline: [
          { time: "09:00", label: "Recepção VIP & Subida", text: "Seu motorista exclusivo da Multi Trip os recebe no aeroporto. A subida pela Rota Romântica é um portal cênico, com túneis verdes de plátanos e cheiro de serra. Parada rápida para foto icônica no Pórtico." },
          { time: "12:30", label: "Almoço Intimista", text: "Almoço acolhedor no <strong>Bella Mia</strong>. Massas artesanais e vinhos locais em um ambiente com luz suave e privacidade absoluta para vocês sintonizarem no ritmo da Serra." },
          { time: "14:30", label: "Check-in & Descanso", text: "Chegada ao hotel para check-in e acomodação de bagagens sem qualquer estresse." },
          { time: "16:00", label: "Caminhada Cênica", text: "Passeio a pé pela Av. Borges de Medeiros, Rua Torta e Fonte do Amor Eterno. Caminhada romântica ao redor do <strong>Lago Negro</strong> na margem esquerda, capturando o pôr do sol dourado entre as hortênsias." },
          { time: "17:30", label: "Café com Arte", text: "Parada na charmosa <strong>Amanda Selbach Pâtisserie</strong> em Canela (apelidada de 'Paris em Canela') para doces finos franceses elaborados e um cappuccino impecável." },
          { time: "19:30", label: "Noite de Fondue Premium", text: "À luz de velas no restrito e moderno <strong>Catherine</strong>. Uma experiência sensorial de fondue de queijos nobres, carnes selecionadas e chocolate suíço com uma carta de vinhos espetacular." }
        ]
      },
      {
        day: 2,
        title: "A Beleza Cênica e Alta Gastronomia",
        vector: "Le Jardin ──► Colosseo ──► Olivas de Gramado ──► Belvedere Quilombo ──► St. Hubertus",
        timeline: [
          { time: "09:30", label: "Jardim das Sensações", text: "Visita ao <strong>Le Jardin Parque de Lavanda</strong>. Caminhar de mãos dadas pelas estufas de vidro em estilo vitoriano e campos aromáticos na brisa suave da manhã." },
          { time: "12:00", label: "Almoço com Vista", text: "Almoço requintado no <strong>Colosseo</strong>, apreciando culinária italiana tradicional de altíssimo padrão com vista panorâmica para o centro histórico." },
          { time: "14:00", label: "Pôr do Sol Colonial", text: "Passeio privativo até o <strong>Olivas de Gramado</strong>. Degustação guiada de azeites finos, piquenique gourmet na grama e a vista de tirar o fôlego do sol mergulhando no canyon." },
          { time: "17:30", label: "O Vale Dourado", text: "Parada no <strong>Belvedere do Vale do Quilombo</strong>. Um mirante poético para contemplar o vale coberto de névoa no final da tarde." },
          { time: "20:00", label: "Fine Dining Exclusivo", text: "Jantar inesquecível de alta gastronomia contemporânea no estrelado <strong>St. Hubertus</strong>. Menu degustação harmonizado de 3 horas para marcar a viagem." }
        ]
      },
      {
        day: 3,
        title: "Canela Histórica e Natureza de Luxo",
        vector: "Catedral de Pedra ──► Cascata do Caracol ──► Skyglass ──► Empório Canela",
        timeline: [
          { time: "09:00", label: "Majestade Gótica", text: "Visita matinal à imponente <strong>Catedral de Pedra de Canela</strong>. Um cenário fotográfico belíssimo com arquitetura gótica e silêncio matinal acolhedor." },
          { time: "10:30", label: "A Cascata Monumental", text: "Passeio pelo Parque do Caracol. Vista esplêndida da cascata de 131 metros a partir dos mirantes cênicos." },
          { time: "12:00", label: "Almoço da Colônia", text: "Almoço na deliciosa <strong>Cantina da Nona</strong>, saboreando a tradicional e farta culinária italiana colonial." },
          { time: "14:00", label: "Flutuando no Vale", text: "Aventura sofisticada no <strong>Skyglass Canela</strong>. Caminhada inesquecível sobre a plataforma de vidro suspensa a 360m sobre o Vale da Ferradura." },
          { time: "17:00", label: "Tarde com Charme", text: "Retorno leve e parada no aconchegante <strong>Empório Canela</strong> para um expresso cremoso cercado por livros, artes e um ambiente acolhedor." },
          { time: "19:30", label: "Show de Luzes & Despedida", text: "Show noturno de projeção e luzes na fachada da Catedral de Canela, seguido por um brinde de espumante regional no carro privativo a caminho do hotel." }
        ]
      }
    ],
    tips: [
      { title: "Luz Perfeita no Lago Negro", desc: "Caminhem até a margem esquerda entre 16h00 e 16h45. A luz oblíqua cria reflexos incríveis na água e ilumina perfeitamente as flores para retratos." },
      { title: "Evitando Filas no Skyglass", desc: "Cheguem pontualmente às 09h00 da manhã. O vale amanhece com uma névoa mágica que se abre aos poucos, e a plataforma estará sem filas." },
      { title: "O que Vestir", desc: "Mesmo no verão, as noites na serra e o vento no Skyglass são frios. Tragam sempre um casaco elegante ou pashmina nos passeios da tarde." }
    ],
    secrets: [
      { title: "Apfelstrudel Centenário no Castelinho", desc: "No casarão histórico de enxaimel em Canela, experimentem o strudel de maçã autêntico servido quente com nata fresca batida na hora." },
      { title: "Mirante da Linha Bella", desc: "Um ponto secreto na colônia interna de Gramado com vista panorâmica exuberante livre de turistas e ideal para fotos privativas." }
    ],
    planoB: {
      title: "Chuva com Charme (Plano B Coberto)",
      desc: "A chuva na Serra torna os cenários ainda mais românticos e intimistas. Aqui está uma rota aquecida e coberta:",
      items: [
        "Manhã relaxante nas águas termais a 36°C do <strong>Acquamotion</strong> (parque totalmente coberto e climatizado).",
        "Tarde de degustação guiada na renomada fábrica de chocolates artesanais <strong>Prawer</strong>.",
        "Jantar-espetáculo luxuoso de cabaré e fondue no elegante lounge art déco <strong>Gatzz</strong>."
      ]
    },
    gastronomia: [
      { name: "Catherine", cat: "Romântico & Fondue", price: "$$$$$", desc: "Ambiente sofisticado à luz de velas, fondues com ingredientes nobres e carta de vinhos selecionados.", reserve: "Obrigatória" },
      { name: "St. Hubertus", cat: "Alta Gastronomia", price: "$$$$$", desc: "Cozinha contemporânea requintada com influência europeia e harmonizações locais.", reserve: "Obrigatória" },
      { name: "Bella Mia", cat: "Romântico Acolhedor", price: "$$$$", desc: "Massas artesanais excelentes em um ambiente intimista de iluminação acolhedora.", reserve: "Recomendada" },
      { name: "Amanda Selbach", cat: "Pâtisserie & Café", price: "$$$", desc: "Joias da confeitaria francesa fina no coração de Canela. Visual deslumbrante.", reserve: "Não requer" },
      { name: "Chalet Suíço", cat: "Custo-Benefício Fondue", price: "$$$", desc: "Fondue tradicional suíço muito saboroso com excelente custo-benefício.", reserve: "Recomendada" }
    ],
    cta: {
      text: "Viver Gramado a dois com a Multi Trip é garantir que o romance comece no instante do desembarque.",
      whatsappUrl: "https://wa.me/5554999999999?text=Oi%20Jolie,%20quero%20fechar%20meu%20transfer%20casal%20premium!"
    }
  },
  {
    id: "familia-serra-gaucha",
    title: "Família Encantada na Serra Gaúcha",
    subtitle: "Magia, Diversão e Conforto para Todas as Gerações",
    description: "Uma aventura inesquecível desenhada sob medida para o sorriso das crianças e o descanso dos pais, com a logística perfeita da Serra Gaúcha.",
    profile: "Famílias | Crianças | Conforto | Praticidade | Logística Inteligente",
    palette: {
      primary: "#0B3C2B",     // Deep Forest Green
      secondary: "#C5A059",   // Soft Gold
      bg: "#F0F7F4",          // Mint Cream
      text: "#2C3E50",        // Dark Slate
      accent: "#D4AF37",      // Gold
      primaryLight: "#E8F3ED",
      cardBg: "#FFFFFF"
    },
    intro: `Olá, mamães e papais! Sejam muito bem-vindos à terra da magia! 🌲✨<br><br>
Eu sei muito bem que viajar com as crianças exige um planejamento impecável. As malas são muitas, os horários precisam ser respeitados e o cansaço dos pequenos pode transformar o passeio em estresse. Por isso, <strong>fica tranquila, mamãe!</strong><br><br>
Como sua <strong>Concierge Oficial</strong>, planejei tudo. Nosso carro terá espaço de sobra para toda a bagagem, as cadeirinhas de segurança estarão higienizadas e instaladas, e as rotas diárias foram desenhadas em linhas retas contínuas. Sem zigue-zague ou idas e vindas cansativas. Preparem-se para ver os olhos deles brilharem com neve de verdade, dinossauros gigantes e jantares mágicos. Vou cuidar de vocês!`,
    itinerary: [
      {
        day: 1,
        title: "O Encontro com a Magia",
        vector: "Pórtico RS-115 ──► Chalet Suíço ──► Mini Mundo ──► Florybal Chocolates ──► Kongo Pizzaria",
        timeline: [
          { time: "09:30", label: "Recepção da Família", text: "Desembarque tranquilo. O motorista Multi Trip recebe a família com plaquinha, auxilia com todas as malas e acomoda as crianças com segurança absoluta nas cadeirinhas infantis certas." },
          { time: "12:00", label: "Almoço Acolhedor", text: "Almoço familiar excelente no <strong>Chalet Suíço</strong>. Ambiente amplo, menu infantil delicioso e muito acolhimento." },
          { time: "13:30", label: "Check-in do Hotel", text: "Parada no hotel para check-in rápido, lavagem de mãos e organização pré-passeio." },
          { time: "14:30", label: "O Mundo em Miniaturas", text: "Visitação ao maravilhoso <strong>Mini Mundo</strong>. Crianças ficam encantadas com os mini trens em movimento, castelos medievais e histórias fascinantes em escala 1:24." },
          { time: "17:00", label: "Tarde com Chocolate", text: "Parada na loja temática da <strong>Florybal Chocolates</strong>. Um castelo de doces com playground interno para gastar energia e provar iguarias locais." },
          { time: "19:00", label: "Jantar na Selva Mágica", text: "Noite espetacular na <strong>Kongo Pizzaria</strong>. Um rodízio incrível em uma selva cenográfica com animais robóticos, efeitos especiais de chuva e shows teatrais infantis fascinantes." }
        ]
      },
      {
        day: 2,
        title: "Neve Real e Dinossauros Gigantes",
        vector: "Snowland ──► Fogão de Lenha ──► Terra Mágica Florybal ──► Cara de Mau (Piratas)",
        timeline: [
          { time: "09:00", label: "Aventura na Neve", text: "Visita matinal ao <strong>Snowland</strong>, o único parque de neve indoor do Brasil. Roupas térmicas completas inclusas. Patinação no gelo, castelo de neve e boneco de neve garantidos!" },
          { time: "12:30", label: "Almoço da Fazenda", text: "Almoço farto e saboroso com comida caseira típica na panela de ferro no restaurante campestre <strong>Fogão de Lenha</strong>." },
          { time: "14:00", label: "Vale dos Dinossauros", text: "Passeio pela fantástica <strong>Terra Mágica Florybal</strong>. Trilhas seguras na floresta com dinossauros que se movem, gigantes de pedra, fadas e duendes lúdicos." },
          { time: "17:30", label: "Retorno & Banho", text: "Retorno confortável com a Multi Trip para banho aquecido e descanso rápido dos pequenos." },
          { time: "19:30", label: "Jantar dos Piratas", text: "Experiência teatral inesquecível no <strong>Cara de Mau</strong>. Pizzas deliciosas servidas por piratas em um galeão gigante com show musical e performances interativas." }
        ]
      },
      {
        day: 3,
        title: "Canela e o Mundo a Vapor",
        vector: "Mundo a Vapor ──► Alpen Park ──► Bondinhos Aéreos ──► Catedral ──► Spaghetti House",
        timeline: [
          { time: "09:30", label: "Locomotivas Históricas", text: "Visita ao fascinante <strong>Mundo a Vapor</strong>. Réplicas que funcionam de verdade de usinas e locomotivas históricas. Incrível aprendizado lúdico." },
          { time: "11:30", label: "Montanha e Trenós", text: "Aventura no <strong>Alpen Park</strong>. Trenó de montanha de 900m que desliza por entre as árvores com velocidade controlada por freio manual (seguro para crianças a partir de 3 anos com os pais)." },
          { time: "13:30", label: "Almoço Colonial", text: "Almoço farto no buffet colonial típico de Canela." },
          { time: "15:00", label: "Bondinhos e Cascata", text: "Passeio nos <strong>Bondinhos Aéreos</strong> para avistar de forma confortável e segura a icônica Cascata do Caracol de 131m." },
          { time: "17:30", label: "Luzes na Catedral", text: "Passeio pela praça de Canela com fotos infantis na Catedral de Pedra e lanche colonial quentinho." },
          { time: "19:30", label: "Jantar de Massas", text: "Jantar aconchegante e descontraído no tradicional <strong>Spaghetti House</strong>, fechando a jornada com polenta frita e massas que as crianças adoram." }
        ]
      }
    ],
    tips: [
      { title: "Preparação para o Snowland", desc: "Levem meias grossas extras e uma calça confortável de moletom para vestir por baixo do macacão térmico do parque. O frio da pista é de -5°C!" },
      { title: "Horários Estratégicos", desc: "Nas pizzarias Kongo e Cara de Mau, cheguem sempre às 18h30 ou reservem antes. As filas pós-19h30 costumam ser muito longas para os pequenos." },
      { title: "Carrinhos de Bebê na Calçada", desc: "O centro de Gramado tem calçadas excelentes e muito planas. Nos parques florestais de Canela, prefira usar canguru/sling ou carrinhos com rodas grandes." }
    ],
    secrets: [
      { title: "Forno Colonial da Praça das Etnias", desc: "No centro de Gramado, comprem cucas quentinhas de chocolate ou banana assadas na hora em fornos de barro por descendentes locais." },
      { title: "Parque Knorr (Aldeia do Papai Noel)", desc: "Um parque arborizado silencioso no centro com a casa oficial do Papai Noel, renas de verdade e trenó aéreo cênico." }
    ],
    planoB: {
      title: "Chuva com Crianças (Plano B Coberto)",
      desc: "Não se preocupem com o clima! A chuva na serra abre as portas para as melhores atrações cobertas do país:",
      items: [
        "Manhã inteira de diversão e toboáguas aquecidos no parque térmico coberto <strong>Acquamotion</strong>.",
        "Tarde visitando os museus climatizados do Grupo Dreams (<strong>Wax Museum</strong> e <strong>Hollywood Dream Cars</strong>).",
        "Jantar interativo e mágico de bruxaria e feitiçaria na fantástica pizzaria temática <strong>Hector</strong>."
      ]
    },
    gastronomia: [
      { name: "Kongo Pizzaria", cat: "Temática Kids / Show", price: "$$$$", desc: "Experiência de selva cenográfica com robôs realistas, shows musicais e rodízio completo.", reserve: "Recomendada / Chegar cedo" },
      { name: "Cara de Mau", cat: "Temática Kids / Show", price: "$$$$", desc: "Navio pirata gigante com atores interativos, dança com espadas e excelente rodízio.", reserve: "Recomendada / Chegar cedo" },
      { name: "Spaghetti House", cat: "Familiar / Massas", price: "$$$", desc: "Massas artesanais fartas e deliciosas, galeto e polenta frita que as crianças adoram.", reserve: "Não requer" },
      { name: "Chalet Suíço", cat: "Familiar / Fondue", price: "$$$", desc: "Ambiente muito aconchegante com menu de fondue clássico e porções sob medida para crianças.", reserve: "Recomendada" },
      { name: "Hector Pizzaria", cat: "Temática Magia", price: "$$$$", desc: "Estilo escola de magia de Harry Potter com rodízio de pizzas (os 'discos de sabor') e efeitos visuais.", reserve: "Obrigatória" }
    ],
    cta: {
      text: "Garantam o conforto de toda a sua família na Serra. Nosso carro estará pronto no aeroporto esperando vocês.",
      whatsappUrl: "https://wa.me/5554999999999?text=Oi%20Jolie,%20quero%20fechar%20meu%20transfer%20familiar%20com%20cadeirinhas!"
    }
  },
  {
    id: "instagramavel-gramado",
    title: "Gramado Instagramável & Experiências Exclusivas",
    subtitle: "Estilo, Cenários Cinematográficos e Segredos Luxuosos",
    description: "Uma curadoria sofisticada desenhada para criadores de memórias, amantes da alta gastronomia e caçadores dos segredos mais charmosos e fotogênicos da Serra Gaúcha.",
    profile: "Lifestyle | Creators | Jovens | Turistas Premium | Estética & Alta Gastronomia",
    palette: {
      primary: "#3D1E4E",     // Deep Violet
      secondary: "#D3A4F9",   // Lavender Rose
      bg: "#FBF9FB",          // Off-white lavender
      text: "#2C3E50",        // Rich Slate
      accent: "#FF69B4",      // Hot Pink/Gold
      primaryLight: "#F5EFFB",
      cardBg: "#FFFFFF"
    },
    intro: `Seja muito bem-vindo ao guia de estilo definitivo da Serra Gaúcha! ✨📸<br><br>
Gramado e Canela não são apenas destinos turísticos; são cenários pintados à mão, repletos de luzes europeias, arquitetura aristocrática e cantos escondidos de tirar o fôlego. Se você ama registrar momentos com elegância, saborear drinques autorais e viver experiências fora da rota comercial comum, está no lugar certo.<br><br>
Como sua <strong>Concierge de Estilo</strong>, desenhei este roteiro 100% linear e otimizado para o seu feed e alma. Nosso transfer privativo levará você aos mirantes do entardecer, vinícolas de design contemporâneo e rooftops sofisticados sem qualquer estresse. Prepare sua câmera, escolha seus melhores looks e venha viver a Serra Gaúcha sob um olhar cinematográfico.`,
    itinerary: [
      {
        day: 1,
        title: "Estilo Urbano e Gastronomia Fine Art",
        vector: "Pórtico ──► Wood Lounge ──► Rua Torta & Borges ──► Lago Negro ──► Catherine (Espumante & Fondue)",
        timeline: [
          { time: "10:00", label: "Chegada VIP & Rota Romântica", text: "Subida cinematográfica em Sedan Executivo ou SUV Elétrico Multi Trip. O motorista conhece os mirantes secretos de Nova Petrópolis para as primeiras fotos exclusivas na estrada." },
          { time: "12:30", label: "Almoço Design", text: "Almoço contemporâneo e ultra fotogênico no <strong>Wood Lounge Bar</strong>. Drinques autorais magníficos e culinária slow food regional refinada." },
          { time: "14:30", label: "Check-in Premium", text: "Check-in nos hotéis boutique mais charmosos da cidade para retoques de maquiagem e troca de figurino." },
          { time: "15:30", label: "Feed do Dia 1", text: "Sessão de fotos na Rua Torta, Fonte do Amor Eterno e fachadas clássicas. Caminhada no <strong>Lago Negro</strong> no golden hour (16h30) para captar a luz oblíqua dourada." },
          { time: "18:00", label: "Estética Europeia", text: "Parada no icônico e sofisticado <strong>Café de La Paix</strong> para cafés especiais servidos em louças de prata com decoração neoclássica." },
          { time: "20:00", label: "Noite Glow", text: "Jantar estético de fondue no moderno e badalado <strong>Catherine</strong>, harmonizado com espumantes finos regionais em ambiente decorado com obras de arte." }
        ]
      },
      {
        day: 2,
        title: "Campos de Lavanda e Azeite de Guarda",
        vector: "Le Jardin ──► Jolimont ──► Olivas de Gramado (Sunset VIP) ──► St. Hubertus",
        timeline: [
          { time: "09:00", label: "Estufas Vitorianas", text: "Visita matinal ao <strong>Le Jardin Parque de Lavanda</strong>. Retratos artísticos incríveis nas estufas de plantas antigas e jardins franceses com lavandas floridas." },
          { time: "11:30", label: "Terroir da Serra", text: "Tour na charmosa <strong>Vinícola Jolimont</strong> em Canela. Fotos lindíssimas nos vinhedos e degustação de vinhos artesanais premiados." },
          { time: "13:30", label: "Almoço Colonial Chic", text: "Almoço típico colonial recheado de cor e sabor no restaurante rústico no interior de Gramado." },
          { time: "15:00", label: "Sunset nas Oliveiras", text: "Passeio VIP no <strong>Olivas de Gramado</strong>. Caminhada fotográfica nas oliveiras sobre o canyon, degustação sensorial de azeites finos e tábua de frios rústica ao pôr do sol espetacular." },
          { time: "18:30", label: "Belvedere Sunset", text: "Parada no Belvedere do Vale do Quilombo para capturar o vale sendo abraçado pela névoa roxa do crepitar da noite." },
          { time: "20:30", label: "Experiência Estrelada", text: "Jantar de gala contemporâneo e sofisticado no elegante e estrelado <strong>St. Hubertus</strong>, um dos cenários mais exclusivos da gastronomia nacional." }
        ]
      },
      {
        day: 3,
        title: "Visual Monumental e Bosque Secreto",
        vector: "Skyglass ──► Kempinski Laje de Pedra ──► Garden Park ──► Catedral ──► Empório Canela",
        timeline: [
          { time: "09:00", label: "Flutuando no Vale", text: "Visita ao <strong>Skyglass Canela</strong>. Caminhada na passarela de vidro suspensa a 360m sobre o Rio Caí. Fotos vertiginosas e visual selvagem espetacular." },
          { time: "11:30", label: "Almoço dos Cânions", text: "Almoço sofisticado no restaurante do luxuoso <strong>Kempinski Laje de Pedra</strong> em Canela. Vista magnífica de tirar o fôlego para o vale." },
          { time: "14:00", label: "O Bosque Secreto", text: "Caminhada no deslumbrante <strong>Garden Park Canela</strong>. Trilhas planejadas por entre carvalhos canadenses, lagos cênicos e pontes de madeira impecáveis para retratos artísticos de outono/inverno." },
          { time: "16:30", label: "Paris na Serra", text: "Parada final em Canela para provar doces franceses magníficos na refinada confeitaria de autor <strong>Amanda Selbach Pâtisserie</strong>." },
          { time: "18:30", label: "Luzes Góticas 3D", text: "Registrar o início do show noturno de projeções em 3D e luzes cênicas na Catedral de Pedra de Canela." },
          { time: "19:30", label: "Bistrô & Vinho", text: "Brinde final com drinques artesanais e comidinhas charmosas no acolhedor e artístico <strong>Empório Canela</strong>." }
        ]
      }
    ],
    tips: [
      { title: "Look Perfeito para a Serra", desc: "Tons terrosos (marrom, ocre, mostarda) ou cores ricas como vinho e verde esmeralda criam contrastes espetaculares com a arquitetura europeia e o verde escuro dos pinheiros." },
      { title: "Enquadramento na Rua Torta", desc: "Cheguem às 08h00 da manhã. Usem a lente grande-angular (0.5x) do celular de baixo para cima. Isso alonga a curva da rua no enquadramento e elimina qualquer turista do fundo." },
      { title: "Melhor Sunset do Feed", desc: "O pôr do sol no Olivas de Gramado é espetacular. Garanta seu lugar nos decks de madeira virados para o canyon até as 16h45 para registrar a famosa transição de cores do céu." }
    ],
    secrets: [
      { title: "A Pâtisserie Escondida", desc: "Amanda Selbach em Canela tem um design interno que parece um bistrô de joias em Paris. Cada doce é esculpido como uma obra de arte." },
      { title: "Mirante da Rota Romântica", desc: "Uma parada rápida e secreta na subida, na curva do mirante de Nova Petrópolis, com visual completo livre de grades de proteção comercial." }
    ],
    planoB: {
      title: "Chuva com Estilo (Plano B Indoor Coberto)",
      desc: "Clima severo na Serra? Apenas um gancho estético para vestir seus melhores casacos e registrar ambientes de luz de velas luxuosos:",
      items: [
        "Jantar-show teatral com dançarinos e estética art déco do Great Gatsby no luxuoso cabaré <strong>Gatzz</strong>.",
        "Sessão de fotos de luxo nas caves e adegas de barricas francesas na degustação privativa da vinícola boutique.",
        "Tarde longa de cafés especiais e croissants folhados no requintado <strong>Chez Pierre Café</strong>."
      ]
    },
    gastronomia: [
      { name: "Kempinski Laje de Pedra", cat: "Visual / Luxo", price: "$$$$$", desc: "Visual espetacular dos cânions de Canela. Culinária contemporânea refinada de altíssimo nível.", reserve: "Obrigatória" },
      { name: "Catherine", cat: "Instagramável / Fondue", price: "$$$$$", desc: "Drinques decorados, ambiente moderno, luz rosa/neon suave e fondues artísticos excepcionais.", reserve: "Obrigatória" },
      { name: "Wood Lounge Bar", cat: "Design / Drinques", price: "$$$$", desc: "Drinques autorais espetaculares, petiscos inovadores e estética escandinava moderna de madeira.", reserve: "Recomendada" },
      { name: "Amanda Selbach", cat: "Estética Pâtisserie", price: "$$$", desc: "Doces franceses finos perfeitos e design interno rosa pastel digno de editoriais de moda.", reserve: "Não requer" },
      { name: "Empório Canela", cat: "Bistrô / Charme", price: "$$$", desc: "Comida excelente, drinques, livros antigos e quadros na parede em um ambiente alternativo de extremo bom gosto.", reserve: "Recomendada" }
    ],
    cta: {
      text: "Sua viagem merece ser contada como um filme de luxo. Reserve sua frota executiva premium com a Multi Trip agora.",
      whatsappUrl: "https://wa.me/5554999999999?text=Oi%20Jolie,%20quero%20fechar%20meu%20transfer%20executivo%20instagramavel!"
    }
  }
];

// -------------------------------------------------------------
// COMPILAÇÃO DOS ARQUIVOS E RENDERS
// -------------------------------------------------------------

function generateHTMLContent(data, isMobile = false) {
  const p = data.palette;
  const mobileStyle = isMobile ? `
    @media screen, print {
      body {
        max-width: 440px;
        margin: 0 auto;
        padding: 5px;
        font-size: 13px;
        background-color: ${p.bg};
      }
      .container {
        padding: 10px;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .capa {
        height: 680px;
        padding: 20px;
        border-radius: 0 !important;
      }
      .capa h1 {
        font-size: 32px;
      }
      .capa h2 {
        font-size: 16px;
      }
      .timeline-card {
        flex-direction: column !important;
        align-items: flex-start !important;
      }
      .timeline-time {
        margin-bottom: 5px;
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 4px;
        background: ${p.primary};
        color: #ffffff;
      }
      .timeline-dot {
        display: none !important;
      }
      .tips-grid, .secrets-grid {
        grid-template-columns: 1fr !important;
      }
      table {
        font-size: 11px !important;
      }
      th, td {
        padding: 6px 4px !important;
      }
      .hide-mobile {
        display: none !important;
      }
    }
    @page {
      size: 108mm 192mm;
      margin: 5mm;
    }
  ` : `
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    @page :first {
      margin: 0;
    }
    .tips-grid, .secrets-grid {
      grid-template-columns: 1fr 1fr;
    }
  `;

  let itineraryHTML = "";
  for (const d of data.itinerary) {
    let timelineHTML = "";
    for (const item of d.timeline) {
      timelineHTML += `
        <div class="timeline-card">
          <div class="timeline-time">${item.time}</div>
          <div class="timeline-dot" style="background: ${p.accent};"></div>
          <div class="timeline-content">
            <h4>${item.label}</h4>
            <p>${item.text}</p>
          </div>
        </div>
      `;
    }

    itineraryHTML += `
      <div class="page-break"></div>
      <section class="section day-section">
        <div class="section-badge" style="background: ${p.primaryLight}; color: ${p.primary};">DIA ${d.day}</div>
        <h2>${d.title}</h2>
        <div class="vector-track" style="border-left: 2px dashed ${p.secondary};">
          <div class="vector-text"><strong>Rota Linear Sem Zigue-Zague:</strong> ${d.vector}</div>
        </div>
        <div class="timeline-container">
          ${timelineHTML}
        </div>
      </section>
    `;
  }

  let tipsHTML = "";
  for (const t of data.tips) {
    tipsHTML += `
      <div class="card tip-card" style="border-left: 4px solid ${p.primary};">
        <div class="card-title">💡 ${t.title}</div>
        <div class="card-text">${t.desc}</div>
      </div>
    `;
  }

  let secretsHTML = "";
  for (const s of data.secrets) {
    secretsHTML += `
      <div class="card secret-card" style="border-left: 4px solid ${p.accent}; background: #FFFDF9;">
        <div class="card-title">✨ ${s.title}</div>
        <div class="card-text">${s.desc}</div>
      </div>
    `;
  }

  let planoBItemsHTML = "";
  for (const pb of data.planoB.items) {
    planoBItemsHTML += `<li>🌧️ ${pb}</li>`;
  }

  let gastTableHTML = "";
  for (const g of data.gastronomia) {
    gastTableHTML += `
      <tr>
        <td style="font-weight: 600; color: ${p.primary};">${g.name}</td>
        <td><span class="badge-cat" style="background: ${p.primaryLight}; color: ${p.primary};">${g.cat}</span></td>
        <td style="font-weight: 600; color: ${p.accent};">${g.price}</td>
        <td>${g.desc}</td>
        <td style="font-style: italic;">${g.reserve}</td>
      </tr>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${data.title} — Multi Trip</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Outfit', 'Montserrat', sans-serif;
      color: ${p.text};
      background-color: ${p.bg};
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: ${p.cardBg};
      box-shadow: 0 4px 30px rgba(0,0,0,0.03);
      padding: 20px 40px;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    /* Capa Premium */
    .capa {
      height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 60px 40px;
      background: linear-gradient(135deg, ${p.primary} 0%, #1D0A10 100%);
      color: #ffffff;
      text-align: center;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 40px;
    }
    
    .capa::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%);
      z-index: 1;
    }
    
    .capa-header, .capa-body, .capa-footer {
      position: relative;
      z-index: 2;
      width: 100%;
    }
    
    .logo-badge {
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 18px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 2px;
      text-transform: uppercase;
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(5px);
    }
    
    .capa-body {
      margin: auto 0;
    }
    
    .capa h1 {
      font-family: 'Playfair Display', serif;
      font-size: 46px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 15px;
      color: #ffffff;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    
    .capa h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 300;
      color: ${p.secondary};
      margin-bottom: 25px;
      letter-spacing: 1px;
    }
    
    .capa-divider {
      width: 60px;
      height: 2px;
      background: ${p.accent};
      margin: 0 auto 25px;
    }
    
    .capa p {
      font-size: 15px;
      max-width: 500px;
      margin: 0 auto;
      opacity: 0.85;
      font-weight: 300;
      line-height: 1.7;
    }
    
    .capa-footer {
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 30px;
    }
    
    .capa-footer span {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 3px;
      opacity: 0.5;
      margin-bottom: 8px;
    }
    
    .capa-footer strong {
      font-size: 14px;
      font-weight: 500;
      color: #ffffff;
    }
    
    /* Corpo Editorial */
    .section {
      padding: 30px 0;
    }
    
    .section-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    
    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: ${p.primary};
      margin-bottom: 20px;
      font-weight: 700;
    }
    
    p.intro-text {
      font-size: 16px;
      line-height: 1.8;
      color: ${p.text};
      margin-bottom: 20px;
    }
    
    .signature-card {
      margin-top: 25px;
      padding: 15px 25px;
      border-left: 2px solid ${p.accent};
      background: #FAFAFA;
      font-style: italic;
    }
    
    /* Itinerário e Logística */
    .vector-track {
      padding: 12px 20px;
      margin-bottom: 30px;
      background: ${p.primaryLight};
      border-radius: 6px;
    }
    
    .vector-text {
      font-size: 12.5px;
      color: ${p.primary};
      word-break: keep-all;
    }
    
    .timeline-container {
      position: relative;
      margin-left: 15px;
      padding-left: 20px;
      border-left: 2px solid #E5E5E5;
    }
    
    .timeline-card {
      position: relative;
      display: flex;
      margin-bottom: 25px;
      background: #FFFFFF;
      border-radius: 6px;
    }
    
    .timeline-time {
      font-size: 14px;
      font-weight: 700;
      color: ${p.primary};
      width: 60px;
      flex-shrink: 0;
    }
    
    .timeline-dot {
      position: absolute;
      left: -27px;
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid #FFFFFF;
      box-shadow: 0 0 0 2px #E5E5E5;
    }
    
    .timeline-content h4 {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: ${p.primary};
      margin-bottom: 5px;
    }
    
    .timeline-content p {
      font-size: 13.5px;
      color: ${p.text};
      line-height: 1.6;
    }
    
    /* Dicas e Segredos */
    .tips-grid, .secrets-grid {
      display: grid;
      gap: 20px;
      margin-top: 15px;
    }
    
    .card {
      background: #FFFFFF;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.02);
    }
    
    .card-title {
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: ${p.primary};
      margin-bottom: 10px;
    }
    
    .card-text {
      font-size: 13px;
      line-height: 1.6;
      color: ${p.text};
    }
    
    /* Plano B */
    .plano-b-box {
      background: #F4F6F9;
      border-radius: 8px;
      padding: 25px;
      border-top: 4px solid ${p.secondary};
      margin: 20px 0;
    }
    
    .plano-b-box ul {
      list-style: none;
      margin-top: 15px;
    }
    
    .plano-b-box li {
      font-size: 13.5px;
      margin-bottom: 12px;
      line-height: 1.6;
    }
    
    /* Gastronomia */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: #FFFFFF;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 15px rgba(0,0,0,0.02);
    }
    
    th, td {
      padding: 12px 15px;
      text-align: left;
      font-size: 13px;
    }
    
    th {
      background: ${p.primary};
      color: #ffffff;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
    }
    
    tr:nth-child(even) td {
      background: #FAFAFA;
    }
    
    .badge-cat {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 600;
    }
    
    /* CTA Final */
    .cta-card {
      background: linear-gradient(135deg, ${p.primary} 0%, #1D0A10 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 35px;
      text-align: center;
      margin-top: 40px;
      position: relative;
    }
    
    .cta-card p {
      font-size: 15px;
      max-width: 500px;
      margin: 0 auto 25px;
      opacity: 0.9;
      font-weight: 300;
    }
    
    .cta-btn {
      display: inline-block;
      background: ${p.accent};
      color: #1D0A10;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 1px;
      text-transform: uppercase;
      box-shadow: 0 4px 15px rgba(212,175,55,0.4);
      transition: all 0.3s;
    }
    
    .social-share {
      margin-top: 30px;
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0.5;
    }
    
    /* Custom Responsive / Print Styles */
    ${mobileStyle}
  </style>
</head>
<body>
  <div class="container">
    
    <!-- CAPA -->
    <header class="capa">
      <div class="capa-header">
        <div class="logo-badge">Multi Trip Receptivo</div>
      </div>
      <div class="capa-body">
        <h1>${data.title}</h1>
        <h2>${data.subtitle}</h2>
        <div class="capa-divider"></div>
        <p>${data.description}</p>
      </div>
      <div class="capa-footer">
        <span>Curadoria Oficial</span>
        <strong>Jolie Concierge Premium</strong>
      </div>
    </header>
    
    <!-- INTRODUÇÃO -->
    <section class="section">
      <div class="section-badge" style="background: ${p.primaryLight}; color: ${p.primary};">CONCIERGE DIGITAL</div>
      <h2>Bem-vindos à sua Viagem dos Sonhos</h2>
      <p class="intro-text">${data.intro}</p>
      <div class="signature-card">
        "Estarei acompanhando vocês em cada quilômetro e cada brisa da Serra. Vocês estão em ótimas mãos." — Jolie 🤎
      </div>
    </section>
    
    <!-- DIA A DIA -->
    ${itineraryHTML}
    
    <div class="page-break"></div>
    
    <!-- DICAS & SEGREDOS -->
    <section class="section">
      <div class="section-badge" style="background: ${p.primaryLight}; color: ${p.primary};">CURADORIA JOLIE</div>
      <h2>Dicas de Ouro e Segredos Locais</h2>
      <div class="tips-grid">
        ${tipsHTML}
      </div>
      <h3 style="font-family: 'Playfair Display', serif; font-size: 20px; color: ${p.primary}; margin: 30px 0 15px;">Segredos Escondidos ("Insider Access")</h3>
      <div class="secrets-grid">
        ${secretsHTML}
      </div>
    </section>
    
    <!-- PLANO B -->
    <section class="section">
      <div class="plano-b-box">
        <h3 style="font-family: 'Outfit', sans-serif; font-size: 17px; font-weight: 700; color: ${p.primary}; margin-bottom: 10px;">${data.planoB.title}</h3>
        <p style="font-size: 13.5px; color: ${p.text};">${data.planoB.desc}</p>
        <ul>
          ${planoBItemsHTML}
        </ul>
      </div>
    </section>
    
    <div class="page-break"></div>
    
    <!-- RESTAURANTES -->
    <section class="section">
      <div class="section-badge" style="background: ${p.primaryLight}; color: ${p.primary};">GUIA GASTRONÔMICO</div>
      <h2>A Curadoria Gastronômica da Jolie</h2>
      <p style="font-size: 14px; color: ${p.text}; margin-bottom: 15px;">Os melhores sabores da Serra Gaúcha divididos sob a ótica de custo-benefício, ambiente e exclusividade.</p>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Restaurante</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Experiência Recomendada</th>
              <th>Reserva</th>
            </tr>
          </thead>
          <tbody>
            ${gastTableHTML}
          </tbody>
        </table>
      </div>
    </section>
    
    <!-- CTA FINAL -->
    <footer class="cta-card">
      <h3 style="font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; margin-bottom: 10px;">Seu Próximo Passo Exclusivo</h3>
      <p>${data.cta.text}</p>
      <a href="${data.cta.whatsappUrl}" class="cta-btn">Garantir Meu Transfer VIP</a>
      <div class="social-share">Compartilhe sua jornada com @multitrip no Instagram 🤎</div>
    </footer>
    
  </div>
</body>
</html>
  `;
}

// -------------------------------------------------------------
// WHATSAPP TEXT GENERATION (JOLIE PERSONA)
// -------------------------------------------------------------

function generateWhatsAppText(data) {
  let text = `🤎 *ROTEIRO MULTI TRIP OFICIAL: ${data.title.toUpperCase()}* 🤎\n`;
  text += `✨ _${data.subtitle}_ _- Jolie Concierge_\n\n`;
  text += `Sejam muito bem-vindos à Serra Gaúcha! Preparei esse roteirinho exclusivo com muito amor e carinho, todo desenhado em *linhas retas e sem zigue-zague* para vocês aproveitarem cada minuto com o máximo conforto! 🌲🚗\n\n`;
  
  for (const d of data.itinerary) {
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📅 *DIA ${d.day} — ${d.title.toUpperCase()}*\n`;
    text += `📍 *Logística linear:* _${d.vector.replace(/──►/g, '→')}_\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const item of d.timeline) {
      text += `⏱️ *${item.time}* — *${item.label}*\n`;
      text += `${item.text.replace(/<strong>/g, '*').replace(/<\/strong>/g, '*')}\n\n`;
    }
  }
  
  text += `💡 *DICAS PRECIOSAS DA JOLIE:*\n`;
  for (const t of data.tips) {
    text += `• *${t.title}*: ${t.desc}\n`;
  }
  text += `\n✨ *SEGREDOS DA SERRA ("INSIDER ACCESS"):*\n`;
  for (const s of data.secrets) {
    text += `• *${s.title}*: ${s.desc}\n`;
  }
  
  text += `\n🌧️ *PLANO B (SE CHOVER):*\n`;
  text += `• ${data.planoB.desc}\n`;
  for (const pb of data.planoB.items) {
    text += `  - ${pb.replace(/<strong>/g, '*').replace(/<\/strong>/g, '*')}\n`;
  }
  
  text += `\n🍷 *CURADORIA GASTRONÔMICA JOLIE:*\n`;
  for (const g of data.gastronomia) {
    text += `• *${g.name}* (${g.cat}) | ${g.price} - ${g.desc} (Reserva: ${g.reserve})\n`;
  }
  
  text += `\n🚗 *EXPERIÊNCIA PREMIUM MULTI TRIP:*\n`;
  text += `${data.cta.text}\n\n`;
  text += `👇 *Toque no link abaixo para agendarmos o seu transfer privativo e garantir essa logística impecável com motorista exclusivo:* \n`;
  text += `${data.cta.whatsappUrl}\n\n`;
  text += `Estarei esperando por vocês! 🤎✨`;
  
  return text;
}

// -------------------------------------------------------------
// ESCRITA E COMPILAÇÃO NO DISCO
// -------------------------------------------------------------

async function main() {
  console.log("Iniciando a compilação de Roteiros Oficiais Multi Trip...");
  
  for (const roteiro of ROTEIROS_DATA) {
    console.log(`\nProcessando: ${roteiro.title}...`);
    
    // 1. Gerar e salvar HTML Desktop
    const htmlDesktop = generateHTMLContent(roteiro, false);
    const destHtmlDesktop = path.join(ASSETS_DIR, `roteiro-${roteiro.id}-desktop.html`);
    fs.writeFileSync(destHtmlDesktop, htmlDesktop, "utf8");
    console.log(`- HTML Desktop salvo: ${destHtmlDesktop}`);
    
    // 2. Gerar e salvar HTML Mobile
    const htmlMobile = generateHTMLContent(roteiro, true);
    const destHtmlMobile = path.join(ASSETS_DIR, `roteiro-${roteiro.id}-mobile.html`);
    fs.writeFileSync(destHtmlMobile, htmlMobile, "utf8");
    console.log(`- HTML Mobile salvo: ${destHtmlMobile}`);
    
    // 3. Gerar e salvar WhatsApp Versão Texto
    const waText = generateWhatsAppText(roteiro);
    const destWaText = path.join(VERSOES_DIR, `roteiro-${roteiro.id}-whatsapp.txt`);
    fs.writeFileSync(destWaText, waText, "utf8");
    console.log(`- WhatsApp versão texto salva: ${destWaText}`);
  }

  // -------------------------------------------------------------
  // PUPPETEER PDF GENERATION WITH LOCAL CHROME FALLBACK
  // -------------------------------------------------------------
  
  console.log("\nIniciando geração de PDFs via Puppeteer...");
  
  // Caminhos prováveis do Chrome local no Windows para fallback
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome\\chrome.exe"
  ];
  
  let localChromePath = null;
  for (const cp of chromePaths) {
    if (fs.existsSync(cp)) {
      localChromePath = cp;
      console.log(`Chrome local encontrado em: ${localChromePath}`);
      break;
    }
  }
  
  let browser = null;
  try {
    // Tenta iniciar com o puppeteer padrão
    const launchOptions = {
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    };
    if (localChromePath) {
      launchOptions.executablePath = localChromePath;
    }
    
    browser = await puppeteer.launch(launchOptions);
    console.log("Puppeteer iniciado com sucesso!");
  } catch (err) {
    console.error("Falha ao iniciar o Puppeteer. Tentando compilação direta via comando Chrome headless...");
  }
  
  if (browser) {
    try {
      const page = await browser.newPage();
      
      for (const roteiro of ROTEIROS_DATA) {
        // --- 1. RENDER DESKTOP PDF ---
        const htmlDesktopPath = path.join(ASSETS_DIR, `roteiro-${roteiro.id}-desktop.html`);
        const fileUrlDesktop = `file://${htmlDesktopPath.replace(/\\/g, "/")}`;
        await page.goto(fileUrlDesktop, { waitUntil: "networkidle0" });
        
        // Caminho final do PDF desktop
        const pdfDesktopPath = path.join(PDFS_DIR, `roteiro-${roteiro.id}.pdf`);
        await page.pdf({
          path: pdfDesktopPath,
          format: "A4",
          printBackground: true,
          margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
        });
        console.log(`[SUCESSO] PDF Desktop gerado: ${pdfDesktopPath}`);
        
        // --- 2. RENDER MOBILE PDF ---
        const htmlMobilePath = path.join(ASSETS_DIR, `roteiro-${roteiro.id}-mobile.html`);
        const fileUrlMobile = `file://${htmlMobilePath.replace(/\\/g, "/")}`;
        await page.goto(fileUrlMobile, { waitUntil: "networkidle0" });
        
        const pdfMobilePath = path.join(VERSOES_DIR, `roteiro-${roteiro.id}-mobile.pdf`);
        await page.pdf({
          path: pdfMobilePath,
          width: "108mm",
          height: "192mm",
          printBackground: true,
          margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
        });
        console.log(`[SUCESSO] PDF Mobile gerado: ${pdfMobilePath}`);
        
        // --- 3. GERAR CAPA E THUMBNAIL (PNG) ---
        await page.goto(fileUrlDesktop, { waitUntil: "networkidle0" });
        await page.setViewport({ width: 800, height: 980, deviceScaleFactor: 2 });
        
        const coverPngPath = path.join(CAPAS_DIR, `roteiro-${roteiro.id}-capa.png`);
        const thumbPngPath = path.join(THUMBNAILS_DIR, `roteiro-${roteiro.id}-thumbnail.png`);
        
        // Capturar a capa (primeira dobra)
        await page.screenshot({ path: coverPngPath, clip: { x: 0, y: 0, width: 800, height: 980 } });
        console.log(`- Capa PNG gerada: ${coverPngPath}`);
        
        // Copiar para thumbnail ou redimensionar se necessário (aqui salvamos com resolução e proporções perfeitas)
        fs.copyFileSync(coverPngPath, thumbPngPath);
        console.log(`- Thumbnail PNG salvo: ${thumbPngPath}`);
      }
      
      await browser.close();
      console.log("\nTodos os roteiros foram compilados e exportados com sucesso!");
    } catch (e) {
      console.error("Erro durante o ciclo de compilação do Puppeteer:", e);
      if (browser) await browser.close();
    }
  } else {
    // FALLBACK: Se o Puppeteer não iniciou, usa CLI direta do Chrome no Windows
    if (localChromePath) {
      console.log("Iniciando compilação resiliente via linha de comando do Chrome...");
      for (const roteiro of ROTEIROS_DATA) {
        const htmlDesktopPath = path.join(ASSETS_DIR, `roteiro-${roteiro.id}-desktop.html`);
        const pdfDesktopPath = path.join(PDFS_DIR, `roteiro-${roteiro.id}.pdf`);
        
        const htmlMobilePath = path.join(ASSETS_DIR, `roteiro-${roteiro.id}-mobile.html`);
        const pdfMobilePath = path.join(VERSOES_DIR, `roteiro-${roteiro.id}-mobile.pdf`);
        
        try {
          console.log(`Compilando PDF Desktop para ${roteiro.title}...`);
          await execAsync(`"${localChromePath}" --headless --disable-gpu --print-to-pdf="${pdfDesktopPath}" "${htmlDesktopPath}"`);
          console.log(`[FALLBACK SUCESSO] PDF Desktop gerado: ${pdfDesktopPath}`);
          
          console.log(`Compilando PDF Mobile para ${roteiro.title}...`);
          await execAsync(`"${localChromePath}" --headless --disable-gpu --print-to-pdf="${pdfMobilePath}" "${htmlMobilePath}"`);
          console.log(`[FALLBACK SUCESSO] PDF Mobile gerado: ${pdfMobilePath}`);
        } catch (execErr) {
          console.error(`Erro na compilação do fallback CLI para ${roteiro.title}:`, execErr);
        }
      }
    } else {
      console.error("Não foi possível gerar os arquivos PDF. Nenhuma instalação de Google Chrome encontrada no sistema para renderizar.");
    }
  }
}

main().catch(console.error);
