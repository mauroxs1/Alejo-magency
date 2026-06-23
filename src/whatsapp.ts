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

export async function notifyPendingSale(
  clientPhone: string,
  clientName: string,
  saleData: Record<string, string>
): Promise<void> {
  const mauro = process.env.MAURO_PHONE;
  const roberto = process.env.ROBERTO_PHONE;

  const msg =
    `🛒 *NUEVO PEDIDO KIT LIVE COMMERCE*\n\n` +
    `👤 *${clientName}*\n` +
    `📱 ${clientPhone}\n` +
    `💰 Monto: $${saleData.monto ?? "299.000"}\n` +
    `📦 Envío: ${saleData.tipoEnvio ?? "domicilio"} — ${saleData.ciudad ?? ""}, ${saleData.provincia ?? ""}\n\n` +
    `✅ Comprobante verificado por Alejo.\n` +
    `Revisá el banco (alias *mm.kit* / Roberto Oscar Martinez / Banco Nación).\n\n` +
    `Respondé *SI* para confirmar y registrar el pedido.`;

  const promises: Promise<void>[] = [];
  if (mauro) promises.push(sendTextMessage(mauro, msg));
  if (roberto) promises.push(sendTextMessage(roberto, msg));
  await Promise.allSettled(promises);
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

export interface IncomingMessage {
  from: string;
  text: string;
  messageId: string;
  audioId?: string;
  audioMime?: string;
  mediaId?: string;
  mediaType?: "image" | "document";
  mediaMime?: string;
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

    if (msg.type === "text") {
      const textObj = msg.text as Record<string, unknown>;
      return { from: msg.from as string, text: textObj.body as string, messageId: msg.id as string };
    }

    if (msg.type === "audio") {
      const audioObj = msg.audio as Record<string, unknown>;
      return {
        from: msg.from as string, text: "", messageId: msg.id as string,
        audioId: audioObj.id as string,
        audioMime: (audioObj.mime_type as string) ?? "audio/ogg; codecs=opus",
      };
    }

    if (msg.type === "image") {
      const obj = msg.image as Record<string, unknown>;
      return {
        from: msg.from as string, text: "", messageId: msg.id as string,
        mediaId: obj.id as string, mediaType: "image",
        mediaMime: (obj.mime_type as string) ?? "image/jpeg",
      };
    }

    if (msg.type === "document") {
      const obj = msg.document as Record<string, unknown>;
      return {
        from: msg.from as string, text: "", messageId: msg.id as string,
        mediaId: obj.id as string, mediaType: "document",
        mediaMime: (obj.mime_type as string) ?? "application/pdf",
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const headers = { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` };
  const { data: mediaData } = await axios.get(`${BASE_URL}/${mediaId}`, { headers });
  const { data, headers: resHeaders } = await axios.get(mediaData.url, {
    headers, responseType: "arraybuffer",
  });
  return {
    buffer: Buffer.from(data),
    mimeType: (resHeaders["content-type"] as string) ?? mediaData.mime_type ?? "image/jpeg",
  };
}

export async function downloadAudio(mediaId: string): Promise<Buffer> {
  const { buffer } = await downloadMedia(mediaId);
  return buffer;
}
