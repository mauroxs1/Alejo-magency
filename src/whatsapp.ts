import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v20.0";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function sendTextMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    },
    { headers: getHeaders() }
  );
}

export async function notifySaleToTeam(detail: string, clientPhone: string): Promise<void> {
  const mauro = process.env.MAURO_PHONE;
  const roberto = process.env.ROBERTO_PHONE;

  const message = `🔔 *Nueva venta cerrada por Alejo*\n\nCliente: ${clientPhone}\nDetalle: ${detail}`;

  const promises: Promise<void>[] = [];
  if (mauro) promises.push(sendTextMessage(mauro, message));
  if (roberto) promises.push(sendTextMessage(roberto, message));

  await Promise.allSettled(promises);
}

// Extrae el primer mensaje de texto de un payload de webhook de Meta
export interface IncomingMessage {
  from: string;
  text: string;
  messageId: string;
}

export function extractMessage(body: unknown): IncomingMessage | null {
  try {
    const b = body as Record<string, unknown>;
    const entry = (b.entry as unknown[])?.[0] as Record<string, unknown>;
    const change = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value = change?.value as Record<string, unknown>;
    const messages = value?.messages as unknown[];

    if (!messages || messages.length === 0) return null;

    const msg = messages[0] as Record<string, unknown>;
    if (msg.type !== "text") return null;

    const textObj = msg.text as Record<string, unknown>;

    return {
      from: msg.from as string,
      text: textObj.body as string,
      messageId: msg.id as string,
    };
  } catch {
    return null;
  }
}
