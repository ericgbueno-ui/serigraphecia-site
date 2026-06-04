"""
Meta Ads Creator — Multi Trip
Lê meta-import.xlsx e cria campanha, conjuntos e anúncios via Marketing API.

Pré-requisitos:
  pip install requests openpyxl python-dotenv

Uso:
  python meta-create-ads.py
  python meta-create-ads.py --token SEU_TOKEN   # sobrescreve o .env
  python meta-create-ads.py --dry-run           # valida sem criar nada
"""

import argparse
import json
import os
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("[ERRO] pip install requests")

# ----------------------------------------------
# CONFIG
# ----------------------------------------------
AD_ACCOUNT_ID = "1637758977778486"
API_VERSION   = "v21.0"
BASE           = f"https://graph.facebook.com/{API_VERSION}"
XLSX_PATH      = Path(__file__).parent / "meta-import.xlsx"
ENV_PATH       = Path(__file__).parent.parent.parent / ".env"


def load_token_from_env():
    if not ENV_PATH.exists():
        return None
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("META_CAPI_ACCESS_TOKEN="):
            val = line.split("=", 1)[1].strip().strip('"').strip("'")
            return val or None
    return None


# ----------------------------------------------
# XLSX READER (sem pandas)
# ----------------------------------------------
def read_xlsx(path: Path) -> list[dict]:
    ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
    with zipfile.ZipFile(path) as z:
        tree = ET.parse(z.open("xl/worksheets/sheet1.xml"))
        root = tree.getroot()

    headers = []
    rows = []
    for row_el in root.findall(f".//{ns}row"):
        cells = {}
        for c in row_el.findall(f"{ns}c"):
            ref = c.get("r")  # e.g. "A1"
            col_letter = "".join(ch for ch in ref if ch.isalpha())
            t = c.get("t")
            v_el = c.find(f"{ns}v")
            is_el = c.find(f".//{ns}t")  # inlineStr
            if t == "inlineStr" and is_el is not None:
                val = is_el.text or ""
            elif v_el is not None:
                val = v_el.text or ""
            else:
                val = ""
            cells[col_letter] = val

        if not headers:
            headers = [cells.get(chr(65 + i), "") for i in range(18)]
        else:
            rows.append({headers[i]: cells.get(chr(65 + i), "") for i in range(len(headers))})

    return [r for r in rows if any(r.values())]


# ----------------------------------------------
# API HELPERS
# ----------------------------------------------
def api_get(path, token, params=None):
    r = requests.get(f"{BASE}{path}", params={"access_token": token, **(params or {})})
    return r.json()


def api_post(path, token, data):
    # Meta Marketing API espera form-encoded; listas/dicts viram JSON strings
    encoded = {}
    for k, v in data.items():
        if isinstance(v, (list, dict)):
            encoded[k] = json.dumps(v)
        else:
            encoded[k] = v
    r = requests.post(f"{BASE}{path}", params={"access_token": token}, data=encoded)
    return r.json()


def check_token(token):
    res = api_get("/me", token, {"fields": "id,name"})
    if "error" in res:
        return False, res["error"].get("message", "unknown error")
    return True, res.get("name", "unknown")


# ----------------------------------------------
# STEP 1 — UPLOAD IMAGE
# ----------------------------------------------
def upload_image(image_url: str, token: str, dry_run: bool) -> str | None:
    """Faz upload de imagem via URL e retorna o hash."""
    if dry_run:
        print(f"    [dry-run] upload_image({image_url})")
        return "DRY_HASH"

    res = api_post(f"/act_{AD_ACCOUNT_ID}/adimages", token, {"url": image_url})

    if "error" in res:
        print(f"    [AVISO]  Erro ao enviar imagem {image_url}: {res['error']['message']}")
        return None

    # Resposta: {"images": {"filename": {"hash": "...", ...}}}
    images = res.get("images", {})
    for fname, data in images.items():
        h = data.get("hash")
        print(f"    [OK] Imagem enviada → hash {h}")
        return h

    print(f"    [AVISO]  Resposta inesperada ao enviar imagem: {res}")
    return None


# ----------------------------------------------
# STEP 2 — FIND OR CREATE CAMPAIGN
# ----------------------------------------------
def delete_campaign(campaign_id: str, token: str):
    r = requests.delete(f"{BASE}/{campaign_id}", params={"access_token": token})
    res = r.json()
    if res.get("success"):
        print(f"  [OK] Campanha {campaign_id} deletada")
    else:
        print(f"  [AVISO] Nao foi possivel deletar campanha {campaign_id}: {res}")


def find_or_create_campaign(name: str, objective: str, daily_budget_brl: float, token: str, dry_run: bool) -> str | None:
    # Buscar existente — deletar campanhas com mesmo nome (estavam em ABO)
    res = api_get(
        f"/act_{AD_ACCOUNT_ID}/campaigns", token,
        {"fields": "id,name,daily_budget", "limit": 100}
    )
    for c in res.get("data", []):
        if c["name"] == name:
            if c.get("daily_budget"):
                # Já tem orçamento na campanha (CBO) — reutilizar
                print(f"  [EXISTE]  Campanha CBO existente: {name} (id={c['id']}, R${int(c['daily_budget'])/100:.0f}/dia)")
                return c["id"]
            else:
                # ABO — deletar para recriar como CBO
                print(f"  [EXISTE]  Campanha ABO encontrada (id={c['id']}) — deletando para recriar como CBO...")
                if not dry_run:
                    delete_campaign(c["id"], token)

    if dry_run:
        print(f"  [dry-run] criar campanha CBO: {name} (R${daily_budget_brl:.0f}/dia total)")
        return "DRY_CAMPAIGN_ID"

    daily_budget_cents = int(daily_budget_brl * 100)

    res = api_post(f"/act_{AD_ACCOUNT_ID}/campaigns", token, {
        "name": name,
        "objective": objective,
        "status": "PAUSED",
        "buying_type": "AUCTION",
        "special_ad_categories": [],
        "daily_budget": daily_budget_cents,          # CBO: orçamento total na campanha
        "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    })

    if "error" in res:
        err = res["error"]
        print(f"  [ERRO] Campanha: {err.get('message')} | code={err.get('code')} sub={err.get('error_subcode')} | {err.get('error_user_msg','')}")
        return None

    cid = res.get("id")
    print(f"  [OK] Campanha criada: {name} (id={cid})")
    return cid


# ----------------------------------------------
# STEP 3 — FIND OR CREATE AD SET
# ----------------------------------------------
def find_or_create_adset(
    campaign_id: str, name: str, age_min: int, age_max: int,
    page_id: str, token: str, dry_run: bool
) -> str | None:
    res = api_get(
        f"/act_{AD_ACCOUNT_ID}/adsets", token,
        {"fields": "id,name,campaign_id", "limit": 100}
    )
    for s in res.get("data", []):
        if s["name"] == name and s.get("campaign_id") == campaign_id:
            print(f"  [EXISTE]  Conjunto existente: {name} (id={s['id']})")
            return s["id"]

    if dry_run:
        print(f"  [dry-run] criar adset: {name}")
        return "DRY_ADSET_ID"

    res = api_post(f"/act_{AD_ACCOUNT_ID}/adsets", token, {
        "name": name,
        "campaign_id": campaign_id,
        "status": "PAUSED",
        "billing_event": "IMPRESSIONS",
        "optimization_goal": "CONVERSATIONS",
        "destination_type": "WHATSAPP",
        # sem daily_budget — CBO gerencia o orçamento na campanha
        "targeting": json.dumps({
            "geo_locations": {"countries": ["BR"]},
            "age_min": age_min,
            "age_max": age_max,
            "targeting_automation": {"advantage_audience": 0},
        }),
        "promoted_object": json.dumps({"page_id": page_id}),
    })

    if "error" in res:
        err = res["error"]
        print(f"  [ERRO] Adset: {err.get('message')} | code={err.get('code')} sub={err.get('error_subcode')} | {err.get('error_user_msg','')}")
        return None

    sid = res.get("id")
    print(f"  [OK] Conjunto criado: {name} (id={sid})")
    return sid


# ----------------------------------------------
# STEP 4 — CREATE CREATIVE
# ----------------------------------------------
def create_creative(
    name: str, page_id: str, image_hash: str,  # image_hash pode ser URL ou hash
    primary_text: str, headline: str, link_url: str,
    token: str, dry_run: bool
) -> str | None:
    if dry_run:
        print(f"    [dry-run] criar creative: {name}")
        return "DRY_CREATIVE_ID"

    object_story_spec = {
        "page_id": page_id,
        "link_data": {
            "picture": image_hash,   # URL direta (sem upload prévio)
            "link": link_url,
            "message": primary_text,
            "name": headline,
            "call_to_action": {
                "type": "WHATSAPP_MESSAGE",
                "value": {"app_destination": "WHATSAPP"},
            },
        },
    }

    res = api_post(f"/act_{AD_ACCOUNT_ID}/adcreatives", token, {
        "name": name,
        "object_story_spec": json.dumps(object_story_spec),
    })

    if "error" in res:
        err = res["error"]
        print(f"    [ERRO] Creative: {err.get('message')} | code={err.get('code')} | {err.get('error_user_msg','')}")
        return None

    cid = res.get("id")
    print(f"    [OK] Creative criado (id={cid})")
    return cid


# ----------------------------------------------
# STEP 5 — CREATE AD
# ----------------------------------------------
def create_ad(name: str, adset_id: str, creative_id: str, token: str, dry_run: bool) -> str | None:
    if dry_run:
        print(f"    [dry-run] criar anúncio: {name}")
        return "DRY_AD_ID"

    res = api_post(f"/act_{AD_ACCOUNT_ID}/ads", token, {
        "name": name,
        "adset_id": adset_id,
        "creative": json.dumps({"creative_id": creative_id}),
        "status": "PAUSED",
    })

    if "error" in res:
        print(f"    [ERRO] Erro ao criar anúncio: {res['error']['message']}")
        return None

    aid = res.get("id")
    print(f"    [OK] Anúncio criado: {name} (id={aid})")
    return aid


# ----------------------------------------------
# MAIN
# ----------------------------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--token", help="Access Token (sobrescreve .env)")
    parser.add_argument("--dry-run", action="store_true", help="Valida sem criar nada na API")
    args = parser.parse_args()

    token = args.token or load_token_from_env()
    if not token:
        sys.exit(
            "[ERRO] Token não encontrado.\n"
            "  Opção 1: defina META_CAPI_ACCESS_TOKEN no .env\n"
            "  Opção 2: python meta-create-ads.py --token SEU_TOKEN\n\n"
            "  Para obter um token com ads_management:\n"
            "  1. Acesse developers.facebook.com/tools/explorer\n"
            "  2. Selecione seu App → Generate Token\n"
            "  3. Marque: ads_management, ads_read, pages_read_engagement\n"
            "  4. Copie o token gerado"
        )

    if args.dry_run:
        print("[DRY-RUN] MODO DRY-RUN — nenhuma alteração será feita na API\n")
    else:
        ok, name = check_token(token)
        if not ok:
            sys.exit(
                f"[ERRO] Token inválido ou sem permissão: {name}\n\n"
                "  O META_CAPI_ACCESS_TOKEN é um token de Conversions API.\n"
                "  Para criar anúncios, você precisa de um token com ads_management:\n\n"
                "  1. Acesse: developers.facebook.com/tools/explorer\n"
                "  2. App: seu app Meta → Generate Token\n"
                "  3. Permissões: ads_management, ads_read, pages_read_engagement\n"
                "  4. Execute: python meta-create-ads.py --token SEU_TOKEN_AQUI"
            )
        print(f"[OK] Token válido — autenticado como: {name}\n")

    rows = read_xlsx(XLSX_PATH)
    print(f"[INFO] {len(rows)} anúncios encontrados na planilha\n")

    image_cache: dict[str, str] = {}
    adset_cache: dict[str, str] = {}
    campaign_id: str | None = None
    results = {"ok": 0, "fail": 0}

    for i, row in enumerate(rows, 1):
        campaign_name = row["Campaign Name"]
        adset_name    = row["Ad Set Name"]
        ad_name       = row["Ad Name"]
        objective     = row["Objective"]
        daily_budget  = float(row["Daily Budget (BRL)"] or 25)
        age_min       = int(row["Age Min"] or 18)
        age_max       = int(row["Age Max"] or 65)
        page_id       = row["Page ID"]
        primary_text  = row["Primary Text"]
        headline      = row["Headline"]
        link_url      = row["Website URL"]
        image_url     = row["Image URL"]

        print(f"---- [{i}/{len(rows)}] {ad_name}")

        # Campanha (criar uma vez — CBO com R$25/dia total)
        if campaign_id is None:
            campaign_id = find_or_create_campaign(campaign_name, objective, daily_budget, token, args.dry_run)
        if not campaign_id:
            results["fail"] += 1
            continue

        # Ad Set (cache por nome — sem orçamento próprio, CBO gerencia)
        if adset_name not in adset_cache:
            adset_id = find_or_create_adset(
                campaign_id, adset_name, age_min, age_max,
                page_id, token, args.dry_run
            )
            if adset_id:
                adset_cache[adset_name] = adset_id
        adset_id = adset_cache.get(adset_name)
        if not adset_id:
            results["fail"] += 1
            continue

        # Creative (usa URL direta — sem upload prévio)
        creative_id = create_creative(
            f"Creative | {ad_name}", page_id, image_url,
            primary_text, headline, link_url, token, args.dry_run
        )
        if not creative_id:
            results["fail"] += 1
            continue

        # Ad
        ad_id = create_ad(ad_name, adset_id, creative_id, token, args.dry_run)
        if ad_id:
            results["ok"] += 1
        else:
            results["fail"] += 1

        print()

    print("=" * 50)
    print(f"[OK] Criados com sucesso : {results['ok']}")
    print(f"[ERRO] Falhas              : {results['fail']}")
    if not args.dry_run and results["ok"] > 0:
        print("\n[NOTA] Todos os anúncios foram criados como PAUSED.")
        print("   Ative pelo Gerenciador quando estiver pronto para veicular.")


if __name__ == "__main__":
    main()
