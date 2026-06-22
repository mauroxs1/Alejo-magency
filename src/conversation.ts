import type Anthropic from "@anthropic-ai/sdk";

// In-memory store — suficiente para Vercel serverless con volumen bajo
// Para escalar a producción con alto volumen, reemplazar por Redis o similar
const conversations = new Map<string, Anthropic.MessageParam[]>();
const firstContact = new Set<string>();

export function getHistory(phoneNumber: string): Anthropic.MessageParam[] {
  return conversations.get(phoneNumber) ?? [];
}

export function addToHistory(
  phoneNumber: string,
  role: "user" | "assistant",
  content: string
): void {
  const history = conversations.get(phoneNumber) ?? [];
  history.push({ role, content });
  // Mantener últimos 40 mensajes para no exceder context window
  if (history.length > 40) history.splice(0, history.length - 40);
  conversations.set(phoneNumber, history);
}

export function isFirstContact(phoneNumber: string): boolean {
  if (firstContact.has(phoneNumber)) return false;
  firstContact.add(phoneNumber);
  return true;
}
