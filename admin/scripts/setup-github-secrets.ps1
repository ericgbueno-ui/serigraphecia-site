# setup-github-secrets.ps1
#
# Configura os GitHub Secrets necessários para o workflow youtube_sync.yml
#
# PRÉ-REQUISITO: gh CLI instalado — https://cli.github.com/
#
# USO:
#   $env:GOOGLE_GENERATIVE_AI_API_KEY = "sua_chave"
#   $env:OPENAI_API_KEY               = "sua_chave"
#   $env:DATABASE_URL                 = "postgresql://..."
#   .\scripts\setup-github-secrets.ps1

$Repo = "ericgbueno-ui/multitrip-site"

$RequiredVars = @(
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "OPENAI_API_KEY",
    "DATABASE_URL"
)

Write-Host "🔐 Configurando GitHub Secrets para: $Repo" -ForegroundColor Cyan
Write-Host ""

# Verificar se gh está instalado
if (-not (Get-Command "gh" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ gh CLI não encontrado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale em: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host "Depois execute: gh auth login" -ForegroundColor Yellow
    exit 1
}

# Verificar se está autenticado
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Não autenticado no GitHub." -ForegroundColor Red
    Write-Host "Execute: gh auth login" -ForegroundColor Yellow
    exit 1
}

# Verificar variáveis
$missing = @()
foreach ($var in $RequiredVars) {
    if ([string]::IsNullOrEmpty([System.Environment]::GetEnvironmentVariable($var))) {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-Host "❌ Variáveis não definidas no ambiente:" -ForegroundColor Red
    foreach ($v in $missing) {
        Write-Host "   `$env:$v = `"valor`"" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Defina as variáveis e execute novamente." -ForegroundColor Yellow
    exit 1
}

# Configurar secrets
foreach ($var in $RequiredVars) {
    $value = [System.Environment]::GetEnvironmentVariable($var)
    Write-Host -NoNewline "  Setting $var... "
    $value | gh secret set $var --repo $Repo
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅" -ForegroundColor Green
    } else {
        Write-Host "❌" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Concluído!" -ForegroundColor Green
Write-Host "Verifique em: https://github.com/$Repo/settings/secrets/actions" -ForegroundColor Cyan
