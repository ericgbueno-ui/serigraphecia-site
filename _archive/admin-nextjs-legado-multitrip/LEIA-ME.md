# Por que esta pasta foi arquivada aqui

Data: 2026-07-01 (Fase 6 da auditoria completa do sistema).

Esta pasta era `/admin` na raiz do projeto — um segundo painel administrativo,
escrito em React/Next.js, que **nunca esteve em produção**:

- Não tem `package.json` próprio (não é um workspace npm válido, mesmo
  estando listado em `workspaces` no `package.json` da raiz).
- O `astro.config.mjs` do projeto só registra as integrações `react()` e
  `tailwind()` — nada serve as rotas desta pasta.
- Consultei a API da Vercel (times `serigraphecia-site` e afins) e não existe
  nenhum segundo projeto publicado que aponte para esta pasta.
- O conteúdo é herdado do projeto **Multi Trip** (transporte turístico, outro
  negócio): menu com "Frota", "CRM B2B (agências e hotéis)", cookie de sessão
  chamado `mt_admin_token`, título de página "[NOME DO NEGÓCIO]" nunca
  preenchido.

O painel administrativo real e em produção do Serigraph e Cia é
`src/pages/admin/*.astro` + `src/pages/api/admin/*.ts`, na raiz do projeto.

## O que fazer com isto

Nada aqui é usado por nenhuma parte ativa do sistema. Pode ficar arquivado
para consulta (algum componente visual pode ser aproveitado no futuro) ou
ser apagado quando quiser — não afeta o funcionamento do site nem do admin
real.

Detalhes completos na auditoria: `diagnosticos/AUDITORIA-COMPLETA-SISTEMA-SERIGRAPHECIA-2026-07-01.docx`.
