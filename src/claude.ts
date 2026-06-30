import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./systemPrompt";
import { getHistory, addToHistory, isFirstContact } from "./conversation";
import { trackUsage } from "./credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ACTIONS_DELIMITER = "---ACTIONS---";

export interface ParsedResponse {
  text: string;
  actions: Action[];
}

export interface Action {
  type: "addLead" | "updateLead" | "notificarVenta" | "registerSale" | "derivarCompraFisica";
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
  motivo?: string;
}

export async function getAlejosReply(
  phoneNumber: string,
  incomingMessage: string
): Promise<ParsedResponse> {
  const firstTime = await isFirstContact(phoneNumber);

  const userContent = firstTime
    ? `[PRIMER CONTACTO]\n${incomingMessage}`
    : incomingMessage;

  await addToHistory(phoneNumber, "user", userContent);

  // Máximo 20 mensajes de historial para ahorrar tokens
  const fullHistory = await getHistory(phoneNumber);
  const history = fullHistory.slice(-20);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: buildSystemPrompt(),
    messages: history,
  });

  const fullText =
    response.content[0].type === "text" ? response.content[0].text : "";

  await addToHistory(phoneNumber, "assistant", fullText);

  // Trackear uso de tokens en background (no bloquea la respuesta)
  trackUsage(
    response.usage.input_tokens,
    response.usage.output_tokens
  ).catch(err => console.error("Error tracking usage:", err));

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
    console.error("Error parsing actions JSON:", jsonPart);
  }

  return { text, actions };
}
