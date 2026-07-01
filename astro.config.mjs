import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    react(),
    tailwind(),
  ],
  // Proteção nativa de CSRF do Astro (checagem de Origin em requisições que
  // alteram estado). Reativada em 2026-07-01 — auditoria de segurança.
  // Se algum formulário do admin passar a falhar por causa disso, o correto é
  // corrigir o formulário (garantir que o Origin bate com o host), nunca
  // desativar esta proteção de novo.
  security: {
    checkOrigin: true,
  },
});
