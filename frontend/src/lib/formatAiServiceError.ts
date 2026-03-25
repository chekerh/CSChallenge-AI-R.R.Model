/**
 * Maps server 503 / “AI not configured” responses to a clear French message.
 */
export function formatAiServiceUnavailableMessage(
  message: string,
  status?: number
): string {
  const m = message.toLowerCase();
  if (
    status === 503 ||
    m.includes('ai service not configured') ||
    m.includes('service not configured')
  ) {
    return 'Service IA indisponible : ajoutez OPENAI_API_KEY dans server/.env sur la machine qui héberge l’API, puis redémarrez le serveur.';
  }
  return message;
}
