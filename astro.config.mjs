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
  // alteram estado).
  //
  // DESATIVADA DE NOVO em 2026-07-01 (mesmo dia em que foi ligada): causa raiz
  // encontrada é de configuração de domínio, não do formulário. O domínio
  // cadastrado na Vercel é "www.serigraphecia.com.br", mas o acesso testado
  // foi por "serigraphecia.com.br" (sem www) — o apex não está corretamente
  // apontado para a Vercel (provável redirecionamento no DNS/registrador em
  // vez de A/CNAME direto), então o Origin do navegador não bate com o Host
  // que a Vercel repassa, e a checagem barra o login de verdade.
  //
  // Antes de reativar: confirmar no DNS do domínio (registro.br ou onde o
  // domínio foi registrado) que "serigraphecia.com.br" (apex) tem um registro
  // A/ALIAS apontando direto para a Vercel (76.76.21.21) — igual ao que já
  // deve existir para o "www" — e não um "redirecionamento"/"forwarding" de
  // URL configurado no painel do registrador. Depois disso, true de novo.
  security: {
    checkOrigin: false,
  },
});
