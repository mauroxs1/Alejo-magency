import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractMessage, sendTextMessage, notifySaleToTeam, notifyPendingSale, downloadMedia, downloadAudio } from "../src/whatsapp";
import { getAlejosReply } from "../src/claude";
import { addLead, updateLead, registerSale } from "../src/sheets";
import { transcribeAudio } from "../src/transcribe";
import { analyzeReceipt } from "../src/analyzeReceipt";
import { savePendingSale, getPendingSale, clearPendingSale, isTeamMember, isConfirmation } from "../src/pendingSales";
import { getHistory } from "../src/conversation";
import type { Action } from "../src/claude";

const processedMessageIds = new Set<string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return handleVerification(req, res);
  if (req.method === "POST") return handleIncoming(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}

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

async function handleIncoming(req: VercelRequest, res: VercelResponse) {
  const incoming = extractMessage(req.body);
  if (!incoming) return res.status(200).json({ status: "ok" });

  if (processedMessageIds.has(incoming.messageId)) return res.status(200).json({ status: "ok" });
  processedMessageIds.add(incoming.messageId);
  if (processedMessageIds.size > 1000) processedMessageIds.clear();

  // ── CASO 1A: Equipo pide historial de un contacto ────────────────
  if (isTeamMember(incoming.from) && incoming.text) {
    const histMatch = incoming.text.trim().match(/^historial\s+(\d+)/i);
    if (histMatch) {
      const targetPhone = histMatch[1];
      const history = await getHistory(targetPhone);
      if (!history.length) {
        await sendTextMessage(incoming.from, `No hay historial guardado para ${targetPhone}.`);
      } else {
        const lines = history.map((m) => {
          const who = m.role === "user" ? "👤 Cliente" : "🤖 Alejo";
          const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
          return `${who}: ${content}`;
        });
        // WhatsApp tiene límite de 4096 chars — enviamos en bloques si es necesario
        const full = `📋 *Historial de ${targetPhone}*\n\n` + lines.join("\n\n");
        const chunks: string[] = [];
        for (let i = 0; i < full.length; i += 3800) chunks.push(full.slice(i, i + 3800));
        for (const chunk of chunks) await sendTextMessage(incoming.from, chunk);
      }
      return res.status(200).json({ status: "ok" });
    }
  }

  // ── CASO 1B: Miembro del equipo confirma venta pendiente ─────────
  if (isTeamMember(incoming.from) && incoming.text && isConfirmation(incoming.text)) {
    const pending = await getPendingSale();
    if (pending) {
      await registerSale({
        nombre: pending.nombre, apellido: pending.apellido, dni: pending.dni,
        whatsapp: pending.clientPhone, email: pending.email,
        calle: pending.calle, ciudad: pending.ciudad, provincia: pending.provincia,
        referencia: pending.referencia, tipoEnvio: pending.tipoEnvio,
        nombreLocal: pending.nombreLocal, mapLink: pending.mapLink,
        monto: pending.monto, alias: "mm.kit", comprobanteOk: "Si", notas: pending.notas,
      });
      await clearPendingSale();
      await sendTextMessage(
        pending.clientPhone,
        `✅ ¡${pending.nombre}, tu pedido está confirmado! El Kit Live Commerce está en camino. Te llega en 3 a 5 días hábiles.${pending.tipoEnvio !== "domicilio" ? "" : ""} ¡Cualquier consulta estoy por acá!`
      );
      await sendTextMessage(incoming.from, `✅ Venta de ${pending.nombre} registrada y confirmada al cliente.`);
      return res.status(200).json({ status: "ok" });
    }
  }

  // ── CASO 2: Comprobante de pago (imagen o documento) ────────────
  if (incoming.mediaId) {
    try {
      const { buffer, mimeType } = await downloadMedia(incoming.mediaId);
      const analysis = await analyzeReceipt(buffer, mimeType);

      if (analysis.valid) {
        // Buscar datos del pedido pendiente en la conversación (guardados en Redis)
        const pending = await getPendingSale();

        if (pending && pending.clientPhone === incoming.from) {
          // Notificar al equipo para que confirmen en el banco
          await notifyPendingSale(incoming.from, pending.clientName, {
            monto: pending.monto, tipoEnvio: pending.tipoEnvio,
            ciudad: pending.ciudad, provincia: pending.provincia,
          });
          await sendTextMessage(
            incoming.from,
            `¡Gracias ${pending.nombre}! Vi el comprobante y todo parece estar en orden 💪 Le avisé al equipo para que confirmen que llegó el dinero al banco. En unos minutos te confirmo el pedido.`
          );
        } else {
          // Comprobante sin pedido previo registrado — igual notificamos
          await notifySaleToTeam(`Comprobante recibido de ${incoming.from}. Monto: ${analysis.monto ?? "?"} — Destinatario: ${analysis.destinatario ?? "?"}. Verificar manualmente.`, incoming.from);
          await sendTextMessage(
            incoming.from,
            "¡Recibí el comprobante! El equipo lo está revisando y te confirma en breve 🙌"
          );
        }
      } else {
        await sendTextMessage(
          incoming.from,
          `Mmm, el comprobante no parece coincidir con los datos del pago. ${analysis.motivo ?? ""} ¿Podés reenviar el comprobante correcto? La transferencia tiene que ser de $299.000 al alias *mm.kit* (Roberto Oscar Martinez — Banco Nación).`
        );
      }
    } catch (err) {
      console.error("Error analizando comprobante:", err);
      await sendTextMessage(incoming.from, "No pude leer el comprobante. ¿Podés mandarlo de nuevo?");
    }
    return res.status(200).json({ status: "ok" });
  }

  // ── CASO 3: Mensaje de texto o audio normal ──────────────────────
  let userText = incoming.text;

  if (incoming.audioId) {
    try {
      const audioBuffer = await downloadAudio(incoming.audioId);
      const transcription = await transcribeAudio(audioBuffer, incoming.audioMime ?? "audio/ogg");
      userText = `[AUDIO TRANSCRIPTO] ${transcription}`;
      console.log(`Audio transcripto de ${incoming.from}: ${transcription}`);
    } catch (err) {
      console.error("Error transcribiendo audio:", err);
      await sendTextMessage(incoming.from, "Perdón, no pude escuchar el audio. ¿Podés escribirme?");
      return res.status(200).json({ status: "ok" });
    }
  }

  if (!userText?.trim()) return res.status(200).json({ status: "ok" });

  console.log(`Mensaje de ${incoming.from}: ${userText}`);

  // Delay humano aleatorio: 20s, 35s o 60s
  const delays = [20000, 35000, 60000];
  const delay = delays[Math.floor(Math.random() * delays.length)];
  await new Promise(resolve => setTimeout(resolve, delay));

  try {
    const { text, actions } = await getAlejosReply(incoming.from, userText);
    await sendTextMessage(incoming.from, text);
    await runActions(actions, incoming.from);
  } catch (error) {
    console.error("Error procesando mensaje:", error);
  }

  return res.status(200).json({ status: "ok" });
}

async function runActions(actions: Action[], fromPhone: string): Promise<void> {
  for (const action of actions) {
    try {
      if (action.type === "addLead") {
        await addLead({
          nombre: action.nombre, telefono: action.telefono ?? fromPhone,
          tipoLead: action.tipoLead, rubro: action.rubro, instagram: action.instagram,
          planUpsell: action.planUpsell, estado: action.estado, observaciones: action.observaciones,
        });
      } else if (action.type === "updateLead") {
        await updateLead(action.telefono ?? fromPhone, action.estado, action.observaciones);
      } else if (action.type === "registerSale") {
        // Guardar venta como pendiente hasta que Roberto/Mauro confirmen
        await savePendingSale({
          clientPhone: fromPhone,
          clientName: `${action.nombre ?? ""} ${action.apellido ?? ""}`.trim(),
          nombre: action.nombre ?? "", apellido: action.apellido ?? "",
          dni: action.dni ?? "", email: action.email ?? "",
          calle: action.calle ?? "", ciudad: action.ciudad ?? "",
          provincia: action.provincia ?? "", referencia: action.referencia ?? "",
          tipoEnvio: action.tipoEnvio ?? "domicilio", nombreLocal: action.nombreLocal ?? "",
          mapLink: action.mapLink ?? "", monto: action.monto ?? "299000",
          notas: action.notas ?? "", createdAt: Date.now(),
        });
      } else if (action.type === "notificarVenta") {
        await notifySaleToTeam(action.detalle ?? "Sin detalle", fromPhone);
      }
    } catch (error) {
      console.error(`Error ejecutando acción ${action.type}:`, error);
    }
  }
}
