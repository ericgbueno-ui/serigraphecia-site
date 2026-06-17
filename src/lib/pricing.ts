export type PrintOptions = {
  sides: 'one' | 'two'
  colorsSideA?: number // number of colors on side A (front)
  colorsSideB?: number // number of colors on side B (back), optional for one-sided jobs
}

export type PriceResult = {
  baseCents: number
  finalCents: number
  multiplier: number
  breakdown: {
    sidesIncrement: number
    colorsIncrement: number
  }
  description: string
}

/**
 * Calcula preço de impressão aplicando acréscimos:
 * - `two` sides: +40%
 * - duas cores em um lado: +40%
 * - duas cores em ambos os lados: +80%
 *
 * A lógica soma os acréscimos (ex: frente+verso + duas cores nos dois lados = 1 + 0.4 + 0.8 = 2.2)
 */
export function calculatePrintPrice(baseCents: number, opts: PrintOptions): PriceResult {
  const sidesIncrement = opts.sides === 'two' ? 0.4 : 0

  const colorsA = Math.max(0, Math.floor(opts.colorsSideA || 0))
  const colorsB = Math.max(0, Math.floor(opts.colorsSideB || 0))

  let colorsIncrement = 0
  const twoColorsA = colorsA >= 2
  const twoColorsB = colorsB >= 2
  if (twoColorsA && twoColorsB) colorsIncrement = 0.8
  else if (twoColorsA || twoColorsB) colorsIncrement = 0.4

  const multiplier = 1 + sidesIncrement + colorsIncrement
  const finalCents = Math.round(baseCents * multiplier)

  const parts: string[] = []
  parts.push(`Base: ${baseCents} cents`)
  if (sidesIncrement > 0) parts.push(`Dois lados: +${Math.round(sidesIncrement * 100)}%`)
  if (colorsIncrement > 0) parts.push(`Cores: +${Math.round(colorsIncrement * 100)}%`)
  parts.push(`Multiplicador total: ${multiplier.toFixed(2)}`)
  parts.push(`Total: ${finalCents} cents`)

  return {
    baseCents,
    finalCents,
    multiplier,
    breakdown: { sidesIncrement, colorsIncrement },
    description: parts.join(' | '),
  }
}

export function formatCents(cents: number) {
  return `R$ ${(cents / 100).toFixed(2)}`
}
