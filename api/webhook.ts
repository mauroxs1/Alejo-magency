import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractMessage, sendTextMessage, notifySaleToTeam, notifyKitSaleToTeam, notifyKitInterest, notifyAiAgentSaleToTeam, notifyOfflinePurchase, notifyPendingSale, downloadMedia, downloadAudio } from "../src/whatsapp";
import { getAlejosReply } from "../src/claude";
import { addLead, updateLead, registerSale } from "../src/sheets";
import { transcribeAudio } from "../src/transcribe";
import { analyzeReceipt } from "../src/analyzeReceipt";
import { savePendingSale, getPendingSale, clearPendingSale, isTeamMember, isConfirmation } from "../src/pendingSales";
import { getHistory } from "../src/conversation";
import { getUsageStats } from "../src/credits";
import { logWeeklySale, logWeeklyLead, logWeeklyAiAgent, logWeeklyConsulta } from "../src/weeklyLog";
import type { Action } from "../src/claude";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const processedMessageIds = new Set<string>();

const OUR_TEMPLATES = ["alejo_cierre_marketing", "alejo_cierre_kit", "alejo_cierre_agente_ai"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return handleVerification(req, res);
  if (req.method === "POST") {
    // Detectar si es un evento de cambio de estado de template
    const templateEvent = extractTemplateEvent(req.body);
    if (templateEvent) return handleTemplateEvent(templateEvent, res);
    return handleIncoming(req, res);
  }
  return res.status(405).json({ error: "Method not allowed" });
}

interface TemplateEvent {
  templateName: string;
  event: string;
  reason?: string;
}

function extractTemplateEvent(body: unknown): TemplateEvent | null {
  try {
    const b = body as Record<string, unknown>;
    const entry = (b.entry as unknown[])?.[0] as Record<string, unknown>;
    const change = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    if (change?.field !== "message_template_status_update") return null;
    const value = change.value as Record<string, unknown>;
    return {
      templateName: value.message_template_name as string,
      event: value.event as string,
      reason: value.reason as string | undefined,
    };
  } catch {
    return null;
  }
}

async function handleTemplateEvent(ev: TemplateEvent, res: VercelResponse) {
  console.log(`Template event: ${ev.templateName} → ${ev.event}`);

  if (ev.event === "APPROVED" && OUR_TEMPLATES.includes(ev.templateName)) {
    const mauro = process.env.MAURO_PHONE!;
    const roberto = process.env.ROBERTO_PHONE!;
    const msg =
      `✅ *Alejo ya puede notificarte sin restricciones*\n\n` +
      `El template *${ev.templateName}* fue aprobado por Meta.\n\n` +
      `A partir de ahora, cuando se cierre una venta, te llega la notificación automáticamente — sin importar cuándo fue el último mensaje. 🚀`;
    await Promise.allSettled([
      sendTextMessage(mauro, msg),
      sendTextMessage(roberto, msg),
    ]);
  }

  if (ev.event === "REJECTED" && OUR_TEMPLATES.includes(ev.templateName)) {
    const mauro = process.env.MAURO_PHONE!;
    const msg =
      `⚠️ *Template rechazado por Meta*\n\n` +
      `Nombre: ${ev.templateName}\n` +
      `Motivo: ${ev.reason ?? "sin detalle"}\n\n` +
      `Avisale a tu desarrollador para revisarlo.`;
    await sendTextMessage(mauro, msg);
  }

  return res.status(200).json({ status: "ok" });
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

  // ── CASO 1A: Equipo — solo comandos del sistema, nunca IA ──────────
  if (isTeamMember(incoming.from) && incoming.text) {
    if (/^creditos?$/i.test(incoming.text.trim())) {
      const stats = await getUsageStats();
      const budget = parseFloat(process.env.ANTHROPIC_BUDGET_USD ?? "5");
      const remaining = budget - stats.costUSD;
      const pct = Math.round((stats.costUSD / budget) * 100);
      const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
      await sendTextMessage(incoming.from,
        `📊 *Créditos Alejo — Anthropic*\n\n` +
        `${bar} ${pct}% usado\n\n` +
        `💸 Gastado: $${stats.costUSD.toFixed(3)} USD\n` +
        `💰 Disponible: ~$${remaining.toFixed(2)} USD\n` +
        `🔢 Tokens: ${(stats.inputTokens + stats.outputTokens).toLocaleString()}\n\n` +
        `_Recargá en: console.anthropic.com → Billing_`
      );
      return res.status(200).json({ status: "ok" });
    }

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
        const full = `📋 *Historial de ${targetPhone}*\n\n` + lines.join("\n\n");
        const chunks: string[] = [];
        for (let i = 0; i < full.length; i += 3800) chunks.push(full.slice(i, i + 3800));
        for (const chunk of chunks) await sendTextMessage(incoming.from, chunk);
      }
      return res.status(200).json({ status: "ok" });
    }

    // Cualquier otro mensaje del equipo → silencio total. Alejo solo atiende clientes.
    return res.status(200).json({ status: "ok" });
  }

  // ── CASO 1B: Roberto confirma pago recibido ──────────────────────
  if (incoming.from === process.env.ROBERTO_PHONE && incoming.text && isConfirmation(incoming.text)) {
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

      // Loguear para reporte semanal
      logWeeklySale({
        nombre: pending.nombre, apellido: pending.apellido,
        ciudad: pending.ciudad, monto: pending.monto, whatsapp: pending.clientPhone,
      }).catch(() => {});

      // Notificar a Mauro y Roberto via template (sin restricción 24h)
      await notifyKitSaleToTeam(
        `${pending.nombre} ${pending.apellido}`,
        pending.clientPhone,
        pending.ciudad || "Mendoza"
      );

      // Mensaje de bienvenida completo al cliente
      const saludo = getSaludo();
      const msgCliente =
        `${saludo} ${pending.nombre}! 🎉\n\n` +
        `*¡Bienvenido/a al Kit Live Commerce!* Tu pedido está *confirmado* y ya está en preparación.\n\n` +
        `📦 Tu kit llega en *3 a 5 días hábiles*${pending.ciudad ? ` a ${pending.ciudad}` : ""}.\n\n` +
        `Dentro del kit vas a encontrar el código de acceso a la *academia online* donde aprendés a usarlo paso a paso desde cero.\n\n` +
        `Cualquier consulta sobre el kit, el envío o el curso, no dudes en escribirnos por acá. ¡Estamos para ayudarte! 🚀`;
      await sendTextMessage(pending.clientPhone, msgCliente);
      await sendTextMessage(incoming.from, `✅ Listo Roberto. Venta de ${pending.nombre} registrada. Le mandé la confirmación al cliente.`);
      return res.status(200).json({ status: "ok" });
    } else {
      await sendTextMessage(incoming.from, "No hay ninguna venta pendiente para confirmar en este momento.");
      return res.status(200).json({ status: "ok" });
    }
  }

  // ── CASO 2: Comprobante de pago (imagen o documento) ────────────
  if (incoming.mediaId) {
    const roberto = process.env.ROBERTO_PHONE!;
    const mauro = process.env.MAURO_PHONE!;

    try {
      const { buffer, mimeType } = await downloadMedia(incoming.mediaId);
      const analysis = await analyzeReceipt(buffer, mimeType);
      const pending = await getPendingSale();
      const clientName = pending?.clientPhone === incoming.from ? pending.nombre : null;
      const clientLabel = clientName ? ` (${clientName})` : "";

      // ── PDF ────────────────────────────────────────────────────────
      if (analysis.isPdf) {
        await sendTextMessage(roberto,
          `📄 *COMPROBANTE PDF — KIT LIVE COMMERCE*\n\n` +
          `📱 Cliente: ${incoming.from}${clientLabel}\n\n` +
          `No pude leer el PDF. Revisá en el banco el alias *mm.kit*.\n\n` +
          `Respondé *SI, ME LLEGÓ* para confirmar el pedido.`
        );
        if (clientName) await sendTextMessage(mauro, `🔔 *Nueva venta Kit*\nCliente: ${clientName} (${incoming.from})\nEsperando confirmación de Roberto.`);
        await sendTextMessage(incoming.from, `Recibí el comprobante 👌 Roberto lo está revisando, en breve te confirmo.`);
        return res.status(200).json({ status: "ok" });
      }

      // ── Imagen: SIEMPRE notificar a Roberto, pase lo que pase ─────
      if (analysis.valid) {
        // Comprobante OK
        await sendTextMessage(roberto,
          `✅ *COMPROBANTE VERIFICADO — KIT LIVE COMMERCE*\n\n` +
          `📱 Cliente: ${incoming.from}${clientLabel}\n` +
          `💰 Monto: ${analysis.monto ?? "$299.000"}\n` +
          `👤 Destinatario: ${analysis.destinatario ?? "Roberto Oscar Martinez"}\n` +
          `🏦 Alias: ${analysis.alias ?? "mm.kit"}\n\n` +
          `Revisá en el banco que haya llegado el pago.\n` +
          `Respondé *SI, ME LLEGÓ* para confirmar.`
        );
        if (clientName) await sendTextMessage(mauro, `🔔 *Nueva venta Kit*\nCliente: ${clientName} (${incoming.from})\nComprobante OK. Esperando confirmación de Roberto.`);
        await sendTextMessage(incoming.from,
          `¡Perfecto${clientName ? `, ${clientName}` : ""}! Revisé el comprobante y todo parece estar en orden ✅ Le avisé a Roberto para que confirme que llegó el pago al banco. En unos minutos te confirmo el pedido.`
        );
      } else {
        // Comprobante con observaciones — Roberto igual se entera
        await sendTextMessage(roberto,
          `⚠️ *COMPROBANTE RECIBIDO — REVISAR MANUALMENTE*\n\n` +
          `📱 Cliente: ${incoming.from}${clientLabel}\n` +
          `❓ Observación de Alejo: ${analysis.motivo ?? "No coinciden los datos"}\n` +
          `💰 Monto detectado: ${analysis.monto ?? "no legible"}\n` +
          `👤 Destinatario detectado: ${analysis.destinatario ?? "no legible"}\n\n` +
          `Revisá el banco igual. Respondé *SI, ME LLEGÓ* si el pago está y querés confirmar.`
        );
        await sendTextMessage(incoming.from,
          `Mmm, algo no cuadra con el comprobante 🤔 ${analysis.motivo ?? ""}\n\nLa transferencia tiene que ser de *$299.000* al alias *mm.kit* (Roberto Oscar Martinez — Banco Nación). ¿Podés mandarlo de nuevo?`
        );
      }

    } catch (err) {
      // Error técnico — igual avisamos a Roberto para que no se pierda nada
      console.error("Error analizando comprobante:", err);
      await sendTextMessage(roberto,
        `⚠️ *COMPROBANTE RECIBIDO — ERROR AL ANALIZAR*\n\n` +
        `📱 Cliente: ${incoming.from}\n\n` +
        `Alejo no pudo procesar el archivo. Revisá el banco manualmente (alias *mm.kit*).\n` +
        `Respondé *SI, ME LLEGÓ* para confirmar el pedido.`
      ).catch(() => {});
      await sendTextMessage(incoming.from, "Recibí el comprobante 👌 El equipo lo está revisando, en breve te confirmo.");
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

  // Inyectar contexto de prospecto si este número fue contactado por la campaña
  let prospectContext = "";
  try {
    const prospectData = await redis.get<{ nombre: string; rubro: string; rubroSlug: string; fit: string }>(
      `alejo:prospect:${incoming.from}`
    );
    if (prospectData) {
      prospectContext =
        `\n\n[CONTEXTO SISTEMA: Este número corresponde a "${prospectData.nombre}", un comercio de rubro "${prospectData.rubro}" ` +
        `contactado por la campaña de prospección de Magency. ` +
        `Afinidad al Kit Live Commerce: ${prospectData.fit === "kit" ? "ALTA — ofrecé Kit primero" : prospectData.fit === "marketing" ? "BAJA — evaluá plan de marketing o agente AI" : "MEDIA — analizá en la conversación"}. ` +
        `Ya conocen Magency por el mensaje que recibieron. No te presentes de cero — respondé como si fuera una conversación que ya empezó.]`;
    }
  } catch {
    // Si falla Redis no interrumpimos
  }

  try {
    const { text, actions } = await getAlejosReply(incoming.from, userText + prospectContext);
    await sendTextMessage(incoming.from, text);
    await runActions(actions, incoming.from);
  } catch (error) {
    console.error("Error procesando mensaje:", error);
  }

  return res.status(200).json({ status: "ok" });
}

function getSaludo(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Mendoza" }));
  const hora = now.getHours();
  const dia = now.getDay(); // 0=dom, 6=sab
  if (dia === 0) return "¡Feliz domingo";
  if (dia === 6) return "¡Feliz sábado";
  if (hora >= 6 && hora < 12) return "¡Buenos días";
  if (hora >= 12 && hora < 19) return "¡Buenas tardes";
  return "¡Buenas noches";
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
        const nombre = action.nombre ?? "Sin nombre";
        const telefono = action.telefono ?? fromPhone;
        const rubro = action.rubro ?? "—";
        const plan = action.planUpsell ?? "—";
        const esAI = /agente ai/i.test(action.tipoLead ?? "");

        if (action.estado === "Venta Cerrada") {
          if (esAI) {
            logWeeklyAiAgent({ nombre, telefono, rubro, plan }).catch(() => {});
          } else {
            logWeeklyLead({ nombre, telefono, rubro, plan }).catch(() => {});
          }
        } else if (action.estado === "Interesado") {
          logWeeklyConsulta({ nombre, telefono, rubro, interes: plan }).catch(() => {});
        }
      } else if (action.type === "updateLead") {
        await updateLead(action.telefono ?? fromPhone, action.estado, action.observaciones);
        if (action.estado === "Venta Cerrada") {
          logWeeklyLead({
            nombre: action.nombre ?? "—",
            telefono: action.telefono ?? fromPhone,
            rubro: action.rubro ?? "—",
            plan: action.planUpsell ?? "—",
          }).catch(() => {});
        } else if (action.estado === "Interesado") {
          logWeeklyConsulta({
            nombre: action.nombre ?? "—",
            telefono: action.telefono ?? fromPhone,
            rubro: action.rubro ?? "—",
            interes: action.planUpsell ?? action.observaciones ?? "—",
          }).catch(() => {});
        }
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
      } else if (action.type === "derivarCompraFisica") {
        const nombre = action.nombre ?? "Cliente";
        const telefono = action.telefono ?? fromPhone;
        const rubro = action.rubro ?? "—";
        const motivo = action.motivo ?? "Prefiere no pagar online";
        await notifyOfflinePurchase(nombre, telefono, rubro, motivo);
      } else if (action.type === "notificarVenta") {
        const detalle = action.detalle ?? "";
        const nombre = action.nombre ?? "Cliente";
        const telefono = action.telefono ?? fromPhone;
        const rubro = action.rubro ?? "—";
        const plan = action.planUpsell ?? detalle;

        if (/agente ai|ai starter|ai full/i.test(detalle + plan)) {
          await notifyAiAgentSaleToTeam(nombre, telefono, rubro, plan || detalle);
        } else if (/kit live commerce|kit/i.test(detalle)) {
          // Armar resumen de conversación con los últimos mensajes
          const history = await getHistory(fromPhone).catch(() => []);
          const resumen = history.slice(-6).map((m) => {
            const texto = typeof m.content === "string" ? m.content : (m.content as Array<{type:string;text?:string}>).filter(b => b.type === "text").map(b => b.text ?? "").join(" ");
            return `${m.role === "user" ? "Cliente" : "Alejo"}: ${texto}`;
          }).join("\n");
          await notifyKitInterest(nombre, telefono, rubro, resumen || detalle);
        } else {
          await notifySaleToTeam(nombre, telefono, rubro, plan || detalle);
        }
      }
    } catch (error) {
      console.error(`Error ejecutando acción ${action.type}:`, error);
    }
  }
}
