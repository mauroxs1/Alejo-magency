import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ReceiptAnalysis {
  valid: boolean;
  monto?: string;
  destinatario?: string;
  alias?: string;
  motivo?: string;
  isPdf?: boolean;
}

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function analyzeReceipt(
  mediaBuffer: Buffer,
  mimeType: string
): Promise<ReceiptAnalysis> {
  const cleanMime = mimeType.split(";")[0].trim();

  // ── PDF: no se puede analizar con vision — notificar manual pero NO auto-aprobar
  if (!SUPPORTED_IMAGE_TYPES.includes(cleanMime)) {
    return {
      valid: false,
      isPdf: true,
      motivo: "PDF recibido — se reenvía al equipo para verificación manual",
    };
  }

  const base64 = mediaBuffer.toString("base64");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: cleanMime as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64,
            },
          },
          {
            type: "text",
            text: `Analizá esta imagen. ¿Es un comprobante de transferencia bancaria?

Verificá si cumple TODAS estas condiciones:
1. Es una transferencia bancaria completada (no un saldo, no una promesa, no un error)
2. El monto transferido es $299.000 pesos argentinos (puede tener punto o coma como separador)
3. El destinatario es "Roberto Oscar Martinez" o nombre muy similar, con cuenta en Banco Nación o alias mm.kit

Respondé SOLO con este JSON sin texto extra:
{"valid": true/false, "monto": "monto que ves exactamente", "destinatario": "nombre que ves exactamente", "alias": "alias o CBU si ves", "motivo": "si es inválido, explicá en una línea por qué"}`,
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as ReceiptAnalysis;
  } catch {
    // ignorar error de parseo
  }

  return { valid: false, motivo: "No se pudo interpretar el comprobante" };
}
