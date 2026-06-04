export const PRECOS = {
  sedan: 499.8,
  sedan_executivo: 699.8,
  suv: 699.8,
  suv_eletrico: 699.8,
  spin: 899.8,
  rota_romantica: 190.9,
};

export type CategoriaVeiculo = keyof Omit<typeof PRECOS, "rota_romantica">;

/**
 * Calcula o total da experiência baseada na categoria escolhida e adicionais
 */
export function calcularTotal(categoria: CategoriaVeiculo, incluirRotaRomantica: boolean): number {
  let total = PRECOS[categoria];
  if (incluirRotaRomantica) {
    total += PRECOS.rota_romantica;
  }
  return total;
}

export function formatarBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}
