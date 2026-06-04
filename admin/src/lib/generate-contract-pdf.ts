/**
 * generate-contract-pdf.ts
 * Re-exporta da implementação real.
 * Mantido para compatibilidade com imports existentes.
 */
export type { ContractBookingData } from "./generate-contract-pdf-impl";
export { generateContractPdf, generateContractPdfBuffer } from "./generate-contract-pdf-impl";
