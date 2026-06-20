# Diagnóstico de Erros do Painel Administrativo

Este documento lista todos os erros críticos detectados no painel administrativo por meio de análise de código e relatórios do compilador TypeScript (`tsc`) e do `eslint`.

---

## 1. Erros de Sintaxe & Parsing (Compilação Quebrada)

- **Arquivo:** [TabelaPrecos.tsx](file:///c:/Produção de Site/serigraphecia-site/admin/src/app/components/TabelaPrecos.tsx)
  - **Erros:**
    - `error TS1381: Unexpected token. Did you mean {'}'} or &rbrace;?`
    - `error TS17002: Expected corresponding JSX closing tag for 'button'`
  - **Causa:** Bloco de código órfão a partir do fechamento de chave incompleto da lógica de descontos (linhas 306-311), que foi parcialmente deletada. Impede a compilação do Next.js de forma definitiva.

---

## 2. Violações das Regras de Hooks do React (`eslint`)

- **Arquivo:** [LeadPopup.tsx](file:///c:/Produção de Site/serigraphecia-site/admin/src/app/components/LeadPopup.tsx)
  - **Erro:** `React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render`
  - **Causa:** Retorno prematuro (`if (pathname?.startsWith("/links")) return null`) inserido na linha 19, antes da chamada do hook `useEffect` na linha 23.

- **Arquivos do Servidor (Autenticação do WhatsApp Baileys):**
  - **Arquivos:**
    - [whatsapp-auth.ts](file:///c:/Produção de Site/serigraphecia-site/admin/src/lib/whatsapp-auth.ts)
    - [route.ts (whatsapp/connect)](file:///c:/Produção de Site/serigraphecia-site/admin/src/app/api/admin/whatsapp/connect/route.ts)
    - [route.ts (cron/whatsapp-sync)](file:///c:/Produção de Site/serigraphecia-site/admin/src/app/api/cron/whatsapp-sync/route.ts)
  - **Erros:**
    - `React Hook "usePrismaAuthState" cannot be called in an async function`
    - `React Hook "usePrismaAuthState" is called conditionally`
    - `React Hook "usePrismaAuthState" is called in function "start" that is neither a React function component nor a custom React Hook function`
  - **Causa:** O utilitário do Baileys para salvar credenciais no Prisma foi batizado de `usePrismaAuthState`. Como o nome começa com `use`, o linter assume erroneamente que é um React Hook, disparando regras de hooks em rotas API puramente no backend do Next.js.

---

## 3. Imutabilidade e Reatribuição Síncrona (`eslint`)

- **Arquivo:** [route.ts (whatsapp/connect)](file:///c:/Produção de Site/serigraphecia-site/admin/src/app/api/admin/whatsapp/connect/route.ts)
  - **Erro:** `Cannot reassign heartbeatId inside async function` (regra `react-hooks/immutability`)
  - **Causa:** Reatribuição direta de `heartbeatId` na linha 51.

---

## 4. Chamadas de `setState` Síncronas em Effects (`eslint`)

- **Arquivos:**
  - [whatsapp/page.tsx](file:///c:/Produção de Site/serigraphecia-site/admin/src/app/admin/painel/whatsapp/page.tsx) (linha 58)
  - [FinanceiroSection.tsx](file:///c:/Produção de Site/serigraphecia-site/admin/src/app/admin/reservas/%5Bid%5D/editar/FinanceiroSection.tsx) (linhas 63 e 81)
  - **Erro:** `Calling setState synchronously within an effect can trigger cascading renders`
  - **Causa:** Execução direta de funções atualizadoras de estado dentro do corpo síncrono do hook `useEffect`, gerando loops e processamento desnecessário na árvore de renderização do React.
