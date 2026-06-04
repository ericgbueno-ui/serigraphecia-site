# -*- coding: utf-8 -*-
"""
Multi Trip Receptivos e Viagens
Script Ingestor de Transcrições do YouTube para a Base da Jolie
Ele baixa legendas via youtube-transcript-api e destila insights estratégicos com Gemini ou OpenAI.
"""

import os
import json
import re
from datetime import datetime

# =====================================================================
# 1. Carregamento de Variáveis de Ambiente (.env / .env.local)
# =====================================================================
def load_env():
    """
    Carrega chaves de API do arquivo .env.local ou .env no diretório atual de forma independente.
    """
    for file_name in [".env.local", ".env"]:
        p = os.path.join(os.getcwd(), file_name)
        if not os.path.exists(p):
            continue
        print(f"[INFO] Carregando variaveis de {file_name}...")
        try:
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$", line)
                    if m:
                        k, v = m.groups()
                        # Remove aspas se existirem
                        v = v.strip("'\"")
                        if k not in os.environ:
                            os.environ[k] = v
        except Exception as e:
            print(f"[AVISO] Erro ao ler {file_name}: {e}")

load_env()

# =====================================================================
# 2. Extração de Transcrição
# =====================================================================
def extrair_transcricao_youtube(video_id):
    """
    Busca a legenda de qualquer vídeo do YouTube. Tenta português primeiro
    e depois tradução automática se disponível.
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        from youtube_transcript_api.formatters import TextFormatter
    except ImportError:
        print("[ERRO] Biblioteca 'youtube-transcript-api' nao esta instalada.")
        print("💡 Execute: pip install youtube-transcript-api")
        return None

    try:
        api = YouTubeTranscriptApi()
        # Tenta obter a transcricao em portugues brasileiro ou portugues de Portugal primeiro
        transcript = api.fetch(video_id, languages=['pt-BR', 'pt'])
        formatter = TextFormatter()
        return formatter.format_transcript(transcript)
    except Exception as e:
        print(f"[AVISO] Legenda nativa em portugues para {video_id} falhou: {e}. Tentando traducao automatica...")
        try:
            api = YouTubeTranscriptApi()
            transcript_list = api.list(video_id)
            # Tenta encontrar legendas em ingles, portugues, espanhol ou qualquer uma
            first_transcript = transcript_list.find_transcript(['en', 'pt-BR', 'pt', 'es'])
            translated_transcript = first_transcript.translate('pt-BR')
            formatter = TextFormatter()
            return formatter.format_transcript(translated_transcript.fetch())
        except Exception as fallback_error:
            print(f"[ERRO] Falha no download de legenda para {video_id}: {fallback_error}")
            return None

# =====================================================================
# 3. Destilação Cognitiva via LLM (Gemini / OpenAI)
# =====================================================================
def destilar_com_llm(conteudo, tipo, nome_alvo):
    """
    Envia a transcrição para a LLM ativa (Gemini ou OpenAI) e destila os insights.
    """
    openai_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY") or os.environ.get("GEMINI_API_KEY")

    if not openai_key and not gemini_key:
        print("[ERRO] Nenhuma chave de API (OpenAI ou Gemini) encontrada no ambiente.")
        return None

    # Define prompts
    if tipo == "mentores":
        prompt = f"""Você é o Analista de Processos e Inteligência Comercial da Multi Trip. 
Leia esta transcrição de aula de {nome_alvo}. 
Destile o conhecimento e escreva em português no formato markdown as 3 maiores lições práticas que nossa equipe comercial ou a nossa inteligência artificial Jolie podem usar para vender transfer privativo de alto padrão.
Foque em atitude de luxo silencioso, contorno de objeções de preço (explicando por que somos premium e não 'caros') e encantamento do cliente.

TRANSCRICAO:
{conteudo}

Responda diretamente com o conteúdo markdown limpo e estruturado. Comece com '# Mentoria — {nome_alvo}'."""
    else:
        prompt = f"""Você é o Concierge Especialista em Gramado e Canela da Multi Trip.
Leia esta transcrição de vídeo de turismo de {nome_alvo}.
Identifique e extraia todas as atualizações de atrações, preços de ingressos, novos restaurantes recomendados, problemas operacionais e avisos logísticos relevantes na Serra Gaúcha.
Escreva em português no formato markdown um relatório curto de curadoria local focado em manter nossos roteiros atualizados e precisos.

TRANSCRICAO:
{conteudo}

Responda diretamente com o conteúdo markdown limpo e estruturado. Comece com '# Concierge — {nome_alvo}'."""

    # Tenta usar Gemini primeiro se configurado (preferencial)
    if gemini_key:
        try:
            print(f"[IA] Processando '{nome_alvo}' com Gemini (gemini-2.0-flash)...")
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"[AVISO] Erro ao chamar o Gemini: {e}. Tentando fallback...")

    # Se falhar ou não houver Gemini, tenta OpenAI
    if openai_key:
        try:
            print(f"[IA] Processando '{nome_alvo}' com OpenAI (gpt-4o-mini)...")
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            res = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            return res.choices[0].message.content
        except Exception as e:
            print(f"[ERRO] Erro ao chamar a OpenAI: {e}")
            
    return None

# =====================================================================
# 4. Execução Principal e Gravação
# =====================================================================
def main():
    config_path = os.path.join("config", "youtube_config.json")
    if not os.path.exists(config_path):
        print(f"[ERRO] Arquivo de configuracao nao encontrado em: {config_path}")
        return

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    base_cerebro = "ia-jolie-cerebro"
    pasta_mentores = os.path.join(base_cerebro, "3. LÍDER - MENTORA", "Mentores")
    pasta_influenciadores = os.path.join(base_cerebro, "1. CONCIERGE GRAMADO - CANELA")

    hoje = datetime.now().strftime("%Y-%m-%d")

    # --- PROCESSA MENTORES ---
    print("\n--- [MÓDULO] Processando Mentores Globais ---")
    for item in config.get("mentores", []):
        autor = item.get("autor")
        video_id = item.get("video_id")
        ref = item.get("titulo_referencia", "Insights")
        
        # Nome limpo de arquivo
        safe_ref = re.sub(r'[\\/*?:"<>|]', "", ref).replace(" ", "_")[:50]
        nome_arquivo = f"Mentoria — {autor} — {safe_ref}.md"
        caminho_final = os.path.join(pasta_mentores, nome_arquivo)

        if os.path.exists(caminho_final):
            print(f"[PULO] Ja processado: {nome_arquivo}")
            continue

        print(f"[VIDEO] Ingerindo {autor} (ID: {video_id})...")
        transcricao = extrair_transcricao_youtube(video_id)
        if not transcricao:
            print(f"[AVISO] Pulando {autor} devido a falha na transcricao.")
            continue

        analise = destilar_com_llm(transcricao, "mentores", autor)
        if not analise:
            print(f"[AVISO] Falha ao gerar analise para {autor}.")
            continue

        # Cria o diretório se necessário
        os.makedirs(os.path.dirname(caminho_final), exist_ok=True)
        
        # Gera o Frontmatter
        frontmatter = f"""---
tags: [youtube, mentoria, {autor.lower().replace(' ', '_')}, RAG]
relacionado: [[Mentoria — Visão Geral dos Mentores]]
atualizado: {hoje}
---

"""
        with open(caminho_final, "w", encoding="utf-8") as out:
            out.write(frontmatter + analise)
            
        print(f"[SUCESSO] Gravado em: {caminho_final}")

    # --- PROCESSA INFLUENCIADORES ---
    print("\n--- [MÓDULO] Processando Influenciadores Locais ---")
    for item in config.get("influenciadores", []):
        canal = item.get("canal")
        video_id = item.get("video_id")
        ref = item.get("titulo_referencia", "Turismo")

        # Nome limpo de arquivo
        safe_ref = re.sub(r'[\\/*?:"<>|]', "", ref).replace(" ", "_")[:50]
        nome_arquivo = f"Concierge — {canal} — {safe_ref}.md"
        caminho_final = os.path.join(pasta_influenciadores, nome_arquivo)

        if os.path.exists(caminho_final):
            print(f"[PULO] Ja processado: {nome_arquivo}")
            continue

        print(f"[VIDEO] Ingerindo {canal} (ID: {video_id})...")
        transcricao = extrair_transcricao_youtube(video_id)
        if not transcricao:
            print(f"[AVISO] Pulando {canal} devido a falha na transcricao.")
            continue

        analise = destilar_com_llm(transcricao, "influenciadores", canal)
        if not analise:
            print(f"[AVISO] Falha ao gerar analise para {canal}.")
            continue

        # Cria o diretório se necessário
        os.makedirs(os.path.dirname(caminho_final), exist_ok=True)

        # Gera o Frontmatter
        frontmatter = f"""---
tags: [youtube, concierge, {canal.lower().replace(' ', '_')}, atualizado-youtube, RAG]
relacionado: [[Gramado — Visão Geral]], [[Concierge — Referências Instagram Turismo]]
atualizado: {hoje}
---

"""
        with open(caminho_final, "w", encoding="utf-8") as out:
            out.write(frontmatter + analise)

        print(f"[SUCESSO] Gravado em: {caminho_final}")

    print("\n=======================================================")
    print("Ingestao de Transcricoes do YouTube Concluida!")
    print("=======================================================")
    print("Para subir e sincronizar esta nova inteligencia com o banco vetorial Neon (JolieKnowledge), execute:")
    print("   npx tsx prisma/seed-jolie.ts")
    print("=======================================================\n")

if __name__ == "__main__":
    main()
