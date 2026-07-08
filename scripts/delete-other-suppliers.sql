-- Migração: Manter apenas custos da Marfel
-- Deleta todos os registros de FornecedorCusto que não são da Marfel

BEGIN TRANSACTION;

-- Deletar todos os FornecedorCusto que NÃO são da Marfel
DELETE FROM "FornecedorCusto"
WHERE "fornecedorId" NOT IN (
  SELECT id FROM "Fornecedor" WHERE nome = 'Marfel'
);

-- Confirmar a transação
COMMIT;
