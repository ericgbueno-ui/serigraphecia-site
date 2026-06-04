/**
 * generate-contract-pdf.tsx
 * Re-exporta a implementação do arquivo .ts (sem JSX de React web).
 * O Turbopack prefere .tsx, então este arquivo serve de ponte.
 *
 * A implementação real usa React.createElement puro (sem JSX) para
 * evitar conflito entre o reconciliador do Next.js e o do @react-pdf/renderer.
 */

// Força o módulo .ts a ser usado em vez deste arquivo
// re-exportando tudo explicitamente.
export type { ContractBookingData } from "./generate-contract-pdf-impl";
export { generateContractPdf, generateContractPdfBuffer } from "./generate-contract-pdf-impl";
