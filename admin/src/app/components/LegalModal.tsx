"use client";

import { useEffect } from "react";
import { SITE } from "@/lib/site";

type LegalType = "termos" | "privacidade";

interface Props {
  type: LegalType;
  onClose: () => void;
}

function TermosContent() {
  return (
    <div className="space-y-8 text-sm text-white/85 leading-relaxed">
      <div className="space-y-4 border-b border-white/10 pb-6">
        <div>
          <strong className="text-[color:var(--gold)]">CONTRATADA:</strong>
          <br />
          Multi Trip Receptivo e Viagens
          <br />
          Endereço: Rua Nair Garcia Martins, 295/171 – Porto Alegre/RS
          <br />
          Telefone: (51) 98912-9376
          <br />
          CNPJ: 59.824.538/0001-63
          <br />
          Registro Cadastur: 59.824.538/0001-63
        </div>
        <div>
          <strong className="text-[color:var(--gold)]">CONTRATANTE:</strong>
          <br />
          <span className="text-white/70">
            Os dados do contratante são coletados no momento da reserva e vinculados eletronicamente
            a este contrato conforme aceite digital (Lei nº 14.063/2020).
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">1. OBJETO</h2>
        <p className="mt-2">
          Prestação de serviço de transporte turístico privativo, conforme itinerário previamente
          acordado, realizado em padrão executivo, com foco em conforto, segurança, pontualidade e
          atendimento profissional.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">2. CONDIÇÕES GERAIS</h2>

        <div className="mt-4">
          <h3 className="font-semibold text-[color:var(--gold)]">2.1 Quilometragem e Roteiro</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>O serviço será realizado conforme roteiro contratado.</li>
            <li>
              Quilometragem excedente, paradas adicionais, desvios de trajeto ou alterações não
              previstas poderão gerar custos adicionais.
            </li>
          </ul>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-[color:var(--gold)]">
            2.2 Responsabilidades do CONTRATANTE
          </h3>
          <p className="mt-2">
            O CONTRATANTE é responsável pela veracidade das informações, conduta dos passageiros e
            danos causados ao veículo.
          </p>
          <p className="mt-3 text-[color:var(--gold)] font-medium">
            Será cobrada taxa de limpeza em casos de:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>derramamento de líquidos</li>
            <li>sujeira excessiva</li>
            <li>vômitos ou necessidade de higienização especial</li>
          </ul>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-[color:var(--gold)]">
            2.3 Normas de Transporte (ANTT)
          </h3>
          <p className="mt-2">
            O serviço segue as diretrizes da ANTT, conforme Lei nº 10.233/2001 e regulamentações
            vigentes.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-[color:var(--gold)]">2.4 Multas de Trânsito</h3>
          <p className="mt-2">
            Multas são de responsabilidade da CONTRATADA, exceto quando decorrentes de não
            utilização de cinto, uso inadequado de dispositivos obrigatórios ou comportamento dos
            passageiros.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-[color:var(--gold)]">
            2.5 Veículo e Padrão de Serviço
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              O serviço contratado refere-se a um padrão de veículo, não a um modelo específico.
            </li>
            <li>
              A CONTRATADA compromete-se a disponibilizar veículo compatível com a categoria
              contratada, podendo haver variação de modelo, marca ou cor.
            </li>
          </ul>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-[color:var(--gold)]">2.6 Bagagens</h3>
          <p className="mt-2">
            Cada passageiro tem direito a 1 mala padrão e 1 bagagem de mão. Bagagens adicionais
            devem ser informadas previamente.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-[color:var(--gold)]">
            2.7 Falhas Mecânicas ou Força Maior
          </h3>
          <p className="mt-2">
            Em caso de falha mecânica ou força maior, a CONTRATADA poderá substituir o veículo ou
            readequar o atendimento.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">3. OPERAÇÃO E LOGÍSTICA</h2>

        <div className="mt-4">
          <h3 className="font-semibold text-[color:var(--gold)]">3.1 Tolerância Operacional</h3>
          <p className="mt-2">
            Em transfers aeroportuários, a CONTRATADA aguardará o passageiro por até 60 minutos após
            o horário programado de chegada do voo, para que o translado seja iniciado. Esse período
            inclui desembarque, retirada de bagagens e deslocamento até o ponto de encontro. Para
            atrasos superiores a 60 minutos, entraremos em contato pelo WhatsApp. O reagendamento
            está sujeito à disponibilidade de agenda e pode gerar custos adicionais conforme
            previsto em contrato.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-[color:var(--gold)]">3.2 No-show e Remarcações</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>No-show: remarcação sujeita à disponibilidade + acréscimo de 20%.</li>
            <li>Alterações até 24h antes: sem custo.</li>
            <li>Alterações com menos de 24h: acréscimo de 20%.</li>
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">4. LIMITAÇÃO DE RESPONSABILIDADE</h2>
        <p className="mt-2">
          A CONTRATADA não se responsabiliza por perda de voos, reservas ou compromissos decorrentes
          de trânsito, condições climáticas, acidentes de terceiros ou força maior.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">5. USO DO VEÍCULO</h2>
        <p className="mt-2">
          Não é permitido o transporte de itens ilícitos, comportamento que comprometa a segurança
          ou excesso de passageiros.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">6. ACEITE DIGITAL</h2>
        <p className="mt-2">
          A confirmação via WhatsApp, envio de dados ou pagamento caracteriza aceite integral deste
          contrato, conforme Lei nº 14.063/2020.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">7. FORO</h2>
        <p className="mt-2">Fica eleito o foro da Comarca de Porto Alegre/RS.</p>
      </div>

      <p className="text-xs text-white/40 text-center pt-4 border-t border-white/10">
        Última atualização: {SITE.legalLastUpdated}
      </p>
    </div>
  );
}

function PrivacidadeContent() {
  return (
    <div className="space-y-6 text-sm text-white/85 leading-relaxed">
      <div>
        <h2 className="text-base font-semibold text-white">1. Quem somos</h2>
        <p className="mt-2">
          Somos a <strong>{SITE.legalName}</strong> e usamos este site para vender e organizar
          transfers e serviços turísticos.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">2. Quais dados coletamos</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>Dados de contato:</strong> nome, WhatsApp e e-mail.
          </li>
          <li>
            <strong>Dados da reserva:</strong> origem/destino, datas, horários, número do voo e
            hotel.
          </li>
          <li>
            <strong>Identificação:</strong> RG/CPF/passaporte para normativas de segurança e
            transporte.
          </li>
          <li>
            <strong>Dados técnicos:</strong> informações básicas do dispositivo e navegação.
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">3. Para que usamos</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Executar o serviço contratado e enviar confirmações.</li>
          <li>Atendimento ao cliente e monitoramento de voo.</li>
          <li>Prevenção a fraude e segurança do pagamento.</li>
          <li>Cumprimento de obrigações legais.</li>
        </ul>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">4. Pagamentos</h2>
        <p className="mt-2">
          O pagamento é processado pelo <strong>Mercado Pago</strong>. Não armazenamos dados
          sensíveis do cartão.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">5. Compartilhamento</h2>
        <p className="mt-2">
          Compartilhamos apenas o necessário com o motorista credenciado e provedores de pagamento.
          Não vendemos seus dados.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white">6. Seus direitos</h2>
        <p className="mt-2">
          Você pode solicitar acesso, correção, anonimização ou exclusão dos seus dados entrando em
          contato via WhatsApp oficial.
        </p>
      </div>

      <p className="text-xs text-white/40 text-center pt-4 border-t border-white/10">
        Última atualização: {SITE.legalLastUpdated}
      </p>
    </div>
  );
}

export function LegalModal({ type, onClose }: Props) {
  const title =
    type === "termos"
      ? "Contrato de Prestação de Serviço — Transfer"
      : "Política de Privacidade (LGPD)";

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    // Travar scroll do body
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[85dvh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[#0d1117] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <span className="block w-8 h-0.5 bg-[color:var(--gold)] rounded mb-2" />
            <h2 className="text-base font-semibold text-white leading-snug">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {type === "termos" ? <TermosContent /> : <PrivacidadeContent />}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-white/10 bg-black/30">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[color:var(--gold)] py-3 text-sm font-bold text-black transition hover:brightness-105 active:scale-[0.99]"
          >
            Entendi — Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
