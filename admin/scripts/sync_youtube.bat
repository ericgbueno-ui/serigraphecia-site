@echo off
:: Multi Trip Receptivos e Viagens
:: Script de automacao para Ingestao e Sincronizacao Vetorial (Jolie)

echo ========================================================
echo   Multi Trip - Iniciando Sincronizacao de Inteligencia
echo ========================================================
echo.

:: Navega para o diretorio do projeto
cd /d "c:\Produção de Site\GitHub\multitrip-site"

:: Executa a ingestao do YouTube
echo [1/2] Buscando novas transcricoes e destilando com IA...
python scripts/youtube_ingestor.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Ocorreu um problema na ingestao do YouTube.
    pause
    exit /b %ERRORLEVEL%
)

:: Executa a sincronizacao vetorial
echo.
echo [2/2] Sincronizando novos chunks com o banco vetorial Neon...
call npx tsx prisma/seed-jolie.ts
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Ocorreu um problema na sincronizacao com o banco.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo   Sucesso! Base de conhecimento da Jolie atualizada.
echo ========================================================
echo.
timeout /t 5
