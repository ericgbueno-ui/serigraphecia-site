export async function searchKnowledge(
  query: string,
  limit?: number,
  leadId?: string
): Promise<any[]> {
  return [];
}

export async function getClientMemory(clientId: string): Promise<any> {
  return {};
}

export function buildDynamicPrompt(
  corePrompt: string,
  knowledgeChunks: any[],
  clientMemory: any,
  instrucaoFase?: string
): string {
  return corePrompt + (instrucaoFase ? `\n\n${instrucaoFase}` : "");
}
