# Deploy de Produção - Multi Trip

Este guia prepara o projeto para rodar em produção com alta disponibilidade, observabilidade e segurança.

## 1) Frontend (Vercel)

1. Conecte o repositório no Vercel.
2. Em **Project Settings → Environment Variables**, configure:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_GTM_ID`
   - `NEXT_PUBLIC_META_PIXEL_ID`
   - `NEXT_PUBLIC_SITE_URL`
3. Em **Git**, habilite:
   - **Automatic Builds**
   - **Preview Deployments**
4. Build command recomendado: `npm run build`
5. Output: `.next`

## 2) Backend

> Observação: este projeto é Next.js full-stack. O backend é servido pela própria aplicação (rotas em `src/app/api`).

### Opção A: Railway/Render

- Runtime: Node.js 24.x
- Start command: `npm run start`
- Build command: `npm run build`
- Pre-deploy command:

```bash
npm install
npx prisma migrate deploy
```

### Opção B: VPS (DigitalOcean / AWS EC2) com PM2

1. Instale Node.js 24.x e PM2 global (`npm i -g pm2`).
2. Configure `.env` com base em `.env.production.example`.
3. Deploy:

```bash
npm install
npx prisma migrate deploy
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

## 3) Banco de dados (PostgreSQL)

Use Supabase, Railway PostgreSQL ou AWS RDS.

Passos:

1. Criar instância PostgreSQL.
2. Configurar `DATABASE_URL`.
3. Executar migrations:

```bash
npx prisma migrate deploy
```

## 4) Fila (BullMQ + Redis)

Use Upstash (recomendado) ou Redis Cloud.

- Configure `REDIS_URL`.
- Aponte workers BullMQ para o mesmo `REDIS_URL`.
- Configure monitoramento de jobs com alertas para falhas e retries.

## 5) Domínio + SSL

- Frontend: `multitrip.com.br`
- Backend/API: `api.multitrip.com.br`

DNS:

- Vercel frontend: CNAME/A conforme painel Vercel.
- Backend: A (VPS) ou CNAME (Railway/Render custom domain).

SSL:

- Habilitar HTTPS automático na plataforma (Vercel/Railway/Render) ou Nginx + Certbot em VPS.

## 6) Variáveis de ambiente críticas

Obrigatórias em produção:

- `DATABASE_URL`
- `REDIS_URL`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_ID`
- `STRIPE_KEY` **ou** `MERCADOPAGO_TOKEN`
- `GOOGLE_TAG_MANAGER_ID`
- `META_PIXEL_ID`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `ABANDONMENT_WEBHOOK_URL`

## 7) Alta disponibilidade (24h)

- PM2 com auto-restart (`autorestart: true`).
- Healthcheck: `GET /api/health` retorna `ok`.
- Rate limiting e CORS aplicados via `middleware.ts` para rotas `/api/*`.
- Configure restart após reboot (`pm2 startup`, `pm2 save`).

## 8) Monitoramento

- UptimeRobot monitorando `https://api.multitrip.com.br/api/health`.
- Logs centralizados:
  - PM2 logs (`pm2 logs`)
  - opcional: envio para provedor externo (Datadog, Better Stack, etc.)
- Métricas mínimas:
  - erros da API
  - downtime
  - jobs falhos

## 9) Backup automático

- Backup diário do PostgreSQL com retenção mínima de 7-30 dias.
- Armazenamento em S3 (ou similar) com criptografia.
- Script disponível: `./scripts/backup-postgres.sh` (opcional upload via `S3_BACKUP_BUCKET`).
- Exemplo de cron diário: `0 3 * * * /var/www/multitrip-site/scripts/backup-postgres.sh`.
- Validar restauração ao menos 1x por mês.

## 10) Segurança de produção

- CORS restrito aos domínios oficiais.
- Rate limiting por IP em endpoints sensíveis.
- Validação de entrada em todas as rotas.
- Nunca expor tokens/chaves em logs e responses.

## 11) Performance

- Caching para endpoints de leitura.
- Revisão de queries e índices no PostgreSQL.
- Compressão HTTP habilitada no proxy/plataforma (ou padrão Next.js).

## 12) Teste final (go-live checklist)

1. Usuário acessa site.
2. Lead é criado.
3. WhatsApp é disparado.
4. Pagamento é gerado.
5. Pagamento é confirmado (webhook).
6. Follow-up é disparado.
7. Dados persistem no CRM.

Somente publicar produção após checklist completo verde.
