import type Anthropic from "@anthropic-ai/sdk";

const conversations = new Map<string, Anthropic.MessageParam[]>();

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
  if (history.length > 40) history.splice(0, history.length - 40);
  conversations.set(phoneNumber, history);
}

// Es primer contacto solo si no hay historial previo
export function isFirstContact(phoneNumber: string): boolean {
  const history = conversations.get(phoneNumber) ?? [];
  return history.length === 0;
}
