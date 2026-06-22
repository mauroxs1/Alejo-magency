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
  // Meta espera 200 rápido — respondemos de inmediato y procesamos async
  res.status(200).json({ status: "ok" });

  const incoming = extractMessage(req.body);
  if (!incoming) return;

  // Deduplicación
  if (processedMessageIds.has(incoming.messageId)) return;
  processedMessageIds.add(incoming.messageId);
  // Limpiamos el set cada 1000 mensajes para no llenar memoria
  if (processedMessageIds.size > 1000) processedMessageIds.clear();

  console.log(`Mensaje de ${incoming.from}: ${incoming.text}`);

  try {
    const { text, actions } = await getAlejosReply(incoming.from, incoming.text);

    // Enviamos la respuesta de Alejo
    await sendTextMessage(incoming.from, text);

    // Ejecutamos las acciones del sistema
    await runActions(actions, incoming.from);
  } catch (error) {
    console.error("Error procesando mensaje:", error);
  }
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
