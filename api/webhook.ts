import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractMessage, sendTextMessage, notifySaleToTeam } from "../src/whatsapp";
import { getAlejosReply } from "../src/claude";
import { addLead, updateLead } from "../src/sheets";
import type { Action } from "../src/claude";

// IDs de mensajes ya procesados — evita duplicados por reintentos de Meta
const processedMessageIds = new Set<string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return handleVerification(req, res);
  }

  if (req.method === "POST") {
    return handleIncoming(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// Verificación del webhook de Meta
function handleVerification(req: VercelRequest, res: VercelResponse) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log("Webhook verificado correctamente.");
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: "Forbidden" });
}

// Manejo de mensajes entrantes
async function handleIncoming(req: VercelRequest, res: VercelResponse) {
  const incoming = extractMessage(req.body);

  if (!incoming) {
    return res.status(200).json({ status: "ok" });
  }

  // Deduplicación
  if (processedMessageIds.has(incoming.messageId)) {
    return res.status(200).json({ status: "ok" });
  }
  processedMessageIds.add(incoming.messageId);
  if (processedMessageIds.size > 1000) processedMessageIds.clear();

  console.log(`Mensaje de ${incoming.from}: ${incoming.text}`);

  try {
    const { text, actions } = await getAlejosReply(incoming.from, incoming.text);
    await sendTextMessage(incoming.from, text);
    await runActions(actions, incoming.from);
  } catch (error) {
    console.error("Error procesando mensaje:", error);
  }

  // Respondemos a Meta al final — Vercel no mata la función hasta que retorna
  return res.status(200).json({ status: "ok" });
}

async function runActions(actions: Action[], fromPhone: string): Promise<void> {
  for (const action of actions) {
    try {
      if (action.type === "addLead") {
        await addLead({
          nombre: action.nombre,
          telefono: action.telefono ?? fromPhone,
          tipoLead: action.tipoLead,
          rubro: action.rubro,
          instagram: action.instagram,
          planUpsell: action.planUpsell,
          estado: action.estado,
          observaciones: action.observaciones,
        });
      } else if (action.type === "updateLead") {
        await updateLead(
          action.telefono ?? fromPhone,
          action.estado,
          action.observaciones
        );
      } else if (action.type === "notificarVenta") {
        await notifySaleToTeam(action.detalle ?? "Sin detalle", fromPhone);
      }
    } catch (error) {
      console.error(`Error ejecutando acción ${action.type}:`, error);
    }
  }
}
