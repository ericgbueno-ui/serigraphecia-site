-- Script para identificar e limpar duplicatas na tabela TabelaPreco
-- Garante que cada combinação (modelo, tamanho, gramatura) apareça apenas uma vez
-- com as 10 faixas de quantidade (100, 200, ... 1000)

-- 1. Encontrar e deletar registros duplicados (manter apenas a versão mais recente)
DELETE FROM "TabelaPreco"
WHERE id NOT IN (
  SELECT MAX(id)
  FROM "TabelaPreco"
  WHERE "ativo" = true
  GROUP BY "modeloId", "tamanho", "gramatura", "qtdMin"
);

-- 2. Encontrar gramaturas que têm intervalos (ex: "0,04 - 0,06") e específicas (ex: "0,06")
-- e consolidar para apenas uma versão

-- Listar conflitos para revisão:
SELECT
  DISTINCT "tamanho",
  "gramatura",
  COUNT(*) as total_registros,
  COUNT(DISTINCT "qtdMin") as faixas_diferentes
FROM "TabelaPreco"
WHERE "ativo" = true
  AND "tamanho" IS NOT NULL
  AND "gramatura" IS NOT NULL
GROUP BY "tamanho", "gramatura"
HAVING COUNT(DISTINCT "qtdMin") < 10
ORDER BY "tamanho", "gramatura";

-- Se encontrar faixas incompletas (menos de 10 faixas), deletar e reconstruir
-- via sync-prices-complete.js
