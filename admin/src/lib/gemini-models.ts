export async function getAvailableGeminiModels(): Promise<string[]> {
  return ["gemini-1.5-pro", "gemini-1.5-flash"];
}
