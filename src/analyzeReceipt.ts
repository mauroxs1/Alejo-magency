import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ReceiptAnalysis {
  valid: boolean;
  monto?: string;
  destinatario?: string;
  motivo?: string; // si no es válido, por qué
}

export async function analyzeReceipt(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ReceiptAnalysis> {
  // Solo imágenes soportadas por Claude Vision (PDF no soportado directamente)
  const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const cleanMime = mimeType.split(";")[0].trim();

  if (!supportedTypes.includes(cleanMime)) {
    // PDF u otro formato — no podemos analizarlo visualmente, lo damos por válido pending
    return { valid: true, motivo: "PDF no analizable visualmente — verificar manualmente" };
  }

  const base64 = imageBuffer.toString("base64");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: cleanMime as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: base64 },
          },
          {
            type: "text",
            text: `Analizá este comprobante de transferencia bancaria.
Verificá si cumple TODAS estas condiciones:
1. Es una transferencia bancaria real (no una captura de saldo ni otro documento)
2. El monto es de $299.000 (pesos argentinos, puede tener puntos o comas)
3. El destinatario es "Roberto Oscar Martinez" o similar, cuenta Banco Nación, alias mm.kit

Respondé SOLO con este JSON (sin texto extra):
{"valid": true/false, "monto": "valor que ves", "destinatario": "nombre que ves", "motivo": "si es inválido, explicá por qué brevemente"}`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as ReceiptAnalysis;
  } catch {
    // fallback
  }

  return { valid: false, motivo: "No se pudo analizar el comprobante" };
}
