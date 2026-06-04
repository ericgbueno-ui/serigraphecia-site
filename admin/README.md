# Multi Trip Site

Aplicação Next.js oficial da Multi Trip (site + API), com foco em captação de leads, operação comercial e pagamentos.

## Produção

- Guia completo de deploy: [`docs/production-deploy.md`](docs/production-deploy.md)
- Variáveis recomendadas: [`.env.production.example`](.env.production.example)
- Healthcheck: `GET /api/health` → `ok`
- Segurança de borda: CORS, rate limiting e security headers em `middleware.ts`

## Scripts úteis

```bash
npm run dev
npm run build
npm run start
npm run check:env
npm run prisma:deploy
```

## Deploy em VPS com PM2

```bash
./scripts/deploy-production.sh
```

Ou manualmente:

```bash
npm install
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.cjs --env production
pm2 save
```

## Backup PostgreSQL

```bash
./scripts/backup-postgres.sh
```

Variáveis opcionais para backup:

- `BACKUP_DIR` (padrão `./backups`)
- `S3_BACKUP_BUCKET` (faz upload automático com `aws s3 cp`)
