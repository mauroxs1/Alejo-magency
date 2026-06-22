import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./systemPrompt";
import { getHistory, addToHistory, isFirstContact } from "./conversation";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ACTIONS_DELIMITER = "---ACTIONS---";

export interface ParsedResponse {
  text: string;
  actions: Action[];
}

export interface Action {
  type: "addLead" | "updateLead" | "notificarVenta" | "registerSale";
  nombre?: string;
  apellido?: string;
  telefono?: string;
  tipoLead?: string;
  rubro?: string;
  instagram?: string;
  planUpsell?: string;
  estado?: string;
  observaciones?: string;
  detalle?: string;
  dni?: string;
  whatsapp?: string;
  email?: string;
  calle?: string;
  ciudad?: string;
  provincia?: string;
  referencia?: string;
  tipoEnvio?: string;
  nombreLocal?: string;
  mapLink?: string;
  monto?: string;
  alias?: string;
  comprobanteOk?: string;
  notas?: string;
}

export async function getAlejosReply(
  phoneNumber: string,
  incomingMessage: string
): Promise<ParsedResponse> {
  const firstTime = isFirstContact(phoneNumber);

  const userContent = firstTime
    ? `[PRIMER CONTACTO DE ESTE NÚMERO]\n${incomingMessage}`
    : incomingMessage;

  addToHistory(phoneNumber, "user", userContent);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: getHistory(phoneNumber),
  });

  const fullText =
    response.content[0].type === "text" ? response.content[0].text : "";

  addToHistory(phoneNumber, "assistant", fullText);

  return parseResponse(fullText);
}

function parseResponse(raw: string): ParsedResponse {
  const delimIdx = raw.indexOf(ACTIONS_DELIMITER);

  if (delimIdx === -1) {
    return { text: raw.trim(), actions: [] };
  }

  const text = raw.slice(0, delimIdx).trim();
  const jsonPart = raw.slice(delimIdx + ACTIONS_DELIMITER.length).trim();

  let actions: Action[] = [];
  try {
    const parsed = JSON.parse(jsonPart);
    actions = parsed.actions ?? [];
  } catch {
    // Si el JSON viene mal formado, ignoramos las acciones pero no rompemos
    console.error("Error parsing actions JSON:", jsonPart);
  }

  return { text, actions };
}
