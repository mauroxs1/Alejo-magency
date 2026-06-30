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

async function sendTemplate(
  to: string,
  templateName: string,
  parameters: string[]
): Promise<void> {
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "es_ES" },
        components: [
          {
            type: "body",
            parameters: parameters.map(p => ({ type: "text", text: p })),
          },
        ],
      },
    },
    { headers: getHeaders() }
  );
}

// Template: "Alejo registro un nuevo cierre de marketing. Cliente: {{1}}, telefono {{2}}, rubro {{3}}, plan contratado {{4}}."
export async function notifySaleToTeam(
  nombreCliente: string,
  telefono: string,
  rubro: string,
  plan: string
): Promise<void> {
  const targets = [process.env.MAURO_PHONE, process.env.ROBERTO_PHONE].filter(Boolean) as string[];
  await Promise.allSettled(
    targets.map(to =>
      sendTemplate(to, "alejo_cierre_marketing", [nombreCliente, telefono, rubro, plan])
        .catch(() => sendTextMessage(to,
          `🔔 *Cierre de Marketing — Alejo*\n\n👤 ${nombreCliente}\n📱 ${telefono}\n🏢 Rubro: ${rubro}\n📦 Plan: ${plan}`
        ))
    )
  );
}

// Template: "Alejo registro una venta del Kit Live Commerce. Cliente: {{1}}, telefono {{2}}, ciudad {{3}}. Monto $299.000 confirmado por Roberto."
export async function notifyKitSaleToTeam(
  nombre: string, telefono: string, ciudad: string
): Promise<void> {
  const targets = [process.env.MAURO_PHONE, process.env.ROBERTO_PHONE].filter(Boolean) as string[];
  await Promise.allSettled(
    targets.map(to =>
      sendTemplate(to, "alejo_cierre_kit", [nombre, telefono, ciudad])
        .catch(() => sendTextMessage(to,
          `🛒 *Venta Kit — Alejo*\n\n👤 ${nombre}\n📱 ${telefono}\n📍 ${ciudad}\n💰 $299.000`
        ))
    )
  );
}

export async function notifyKitInterest(
  nombre: string,
  telefono: string,
  rubro: string,
  resumenConversacion: string
): Promise<void> {
  const targets = [process.env.MAURO_PHONE, process.env.ROBERTO_PHONE].filter(Boolean) as string[];
  const msg =
    `👀 *Cliente interesado en Kit Live Commerce*\n\n` +
    `👤 *${nombre}*\n` +
    `📱 ${telefono}\n` +
    `🏢 Rubro: ${rubro}\n\n` +
    `💬 *Resumen de la conversación:*\n${resumenConversacion}\n\n` +
    `_Todavía no compró — está evaluando._`;
  await Promise.allSettled(targets.map(to => sendTextMessage(to, msg)));
}

// Template: "Alejo cerro una venta de Agente AI. Cliente: {{1}}, telefono {{2}}, rubro {{3}}, plan elegido: {{4}}."
export async function notifyAiAgentSaleToTeam(
  nombre: string, telefono: string, rubro: string, plan: string
): Promise<void> {
  const targets = [process.env.MAURO_PHONE, process.env.ROBERTO_PHONE].filter(Boolean) as string[];
  await Promise.allSettled(
    targets.map(to =>
      sendTemplate(to, "alejo_cierre_agente_ai", [nombre, telefono, rubro, plan])
        .catch(() => sendTextMessage(to,
          `🤖 *Venta Agente AI — Alejo*\n\n👤 ${nombre}\n📱 ${telefono}\n🏢 Rubro: ${rubro}\n📦 Plan: ${plan}`
        ))
    )
  );
}

export async function notifyOfflinePurchase(
  nombre: string,
  telefono: string,
  rubro: string,
  motivo: string
): Promise<void> {
  const targets = [process.env.MAURO_PHONE, process.env.ROBERTO_PHONE].filter(Boolean) as string[];
  const msg =
    `📞 *Cliente quiere comprar sin pagar online*\n\n` +
    `👤 *${nombre}*\n` +
    `📱 ${telefono}\n` +
    `🏢 Rubro: ${rubro}\n\n` +
    `💬 *Motivo:* ${motivo}\n\n` +
    `➡️ Contactarlo para coordinar la compra de forma alternativa (transferencia directa, efectivo, etc.)`;
  await Promise.allSettled(targets.map(to => sendTextMessage(to, msg)));
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
