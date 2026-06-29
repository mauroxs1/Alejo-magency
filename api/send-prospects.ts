import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import axios from "axios";
import { PROSPECTS_WITH_PHONE, getRubroFit, type Prospect } from "../src/prospects";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const BASE_URL = "https://graph.facebook.com/v20.0";
const REDIS_KEY = "alejo:prospects:sent";
const DAILY_KEY = () => `alejo:prospects:daily:${new Date().toISOString().slice(0, 10)}`;
const PROSPECTS_PER_DAY = 3;
const PAUSE_BETWEEN_MS = 45_000; // 45 segundos entre mensajes

// Los 3 templates rotando
const TEMPLATES = [
  "alejo_prospecto_v1",
  "alejo_prospecto_v2",
  "alejo_prospecto_v3",
];

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function sendProspectTemplate(
  prospect: Prospect,
  templateName: string
): Promise<void> {
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: prospect.telefono,
      type: "template",
      template: {
        name: templateName,
        language: { code: "es_ES" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: prospect.nombre }],
          },
        ],
      },
    },
    { headers: getHeaders() }
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verificar que viene del cron o de una llamada autorizada
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    // Cuántos mandamos hoy
    const dailyKey = DAILY_KEY();
    const todayCount = parseInt((await redis.get<string>(dailyKey)) ?? "0", 10);

    if (todayCount >= PROSPECTS_PER_DAY) {
      return res.status(200).json({
        message: `Ya se enviaron ${todayCount} mensajes hoy. Límite alcanzado.`,
      });
    }

    // Cuáles ya fueron enviados (IDs)
    const sentIds = new Set<number>(
      (await redis.smembers(REDIS_KEY)).map(Number)
    );

    // Buscar los que no se enviaron aún, con teléfono
    const pending = PROSPECTS_WITH_PHONE.filter((p) => !sentIds.has(p.id));

    if (pending.length === 0) {
      return res.status(200).json({ message: "Todos los prospectos ya fueron contactados." });
    }

    // Cuántos mandar hoy
    const toSend = pending.slice(0, PROSPECTS_PER_DAY - todayCount);

    // Índice global para rotar templates
    const totalSent = sentIds.size;
    const results: { nombre: string; template: string; status: string }[] = [];

    for (let i = 0; i < toSend.length; i++) {
      const prospect = toSend[i];
      const templateIndex = (totalSent + i) % TEMPLATES.length;
      const template = TEMPLATES[templateIndex];

      // Pausa antes del 2do y 3er mensaje (no antes del primero)
      if (i > 0) {
        await sleep(PAUSE_BETWEEN_MS);
      }

      try {
        await sendProspectTemplate(prospect, template);
        await redis.sadd(REDIS_KEY, prospect.id);
        await redis.incr(dailyKey);
        await redis.expire(dailyKey, 86400 * 2);

        // Guardar en Redis qué rubro para que Alejo lo sepa cuando responda
        const fit = getRubroFit(prospect.rubroSlug);
        await redis.set(
          `alejo:prospect:${prospect.telefono}`,
          JSON.stringify({ nombre: prospect.nombre, rubro: prospect.rubro, rubroSlug: prospect.rubroSlug, fit }),
          { ex: 60 * 60 * 24 * 30 } // 30 días
        );

        results.push({ nombre: prospect.nombre, template, status: "ok" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ nombre: prospect.nombre, template, status: `error: ${msg}` });
      }
    }

    // Notificar a Mauro con resumen
    const mauro = process.env.MAURO_PHONE;
    if (mauro) {
      const resumen = results
        .map((r) => `${r.status === "ok" ? "✅" : "❌"} ${r.nombre}`)
        .join("\n");
      const remaining = pending.length - toSend.length;

      await axios.post(
        `${BASE_URL}/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: mauro,
          type: "text",
          text: {
            body:
              `📤 *Prospección diaria enviada*\n\n${resumen}\n\n` +
              `📊 Pendientes: ${remaining} comercios restantes`,
          },
        },
        { headers: getHeaders() }
      );
    }

    return res.status(200).json({
      sent: results.filter((r) => r.status === "ok").length,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
