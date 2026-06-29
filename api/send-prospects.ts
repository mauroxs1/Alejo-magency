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
const PROSPECTS_PER_RUN = 3;     // 3 mensajes por ejecución (cada 4 horas)
const PAUSE_BETWEEN_MS = 90_000; // 90 segundos entre cada mensaje del batch

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

async function sendProspectTemplate(prospect: Prospect, templateName: string): Promise<void> {
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
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    // Cuáles ya fueron enviados
    const sentIds = new Set<number>(
      (await redis.smembers(REDIS_KEY)).map(Number)
    );

    const pending = PROSPECTS_WITH_PHONE.filter((p) => !sentIds.has(p.id));

    if (pending.length === 0) {
      return res.status(200).json({ message: "Campaña completa — todos los prospectos fueron contactados." });
    }

    const toSend = pending.slice(0, PROSPECTS_PER_RUN);
    const totalSent = sentIds.size;
    const results: { nombre: string; rubro: string; template: string; status: string }[] = [];

    for (let i = 0; i < toSend.length; i++) {
      const prospect = toSend[i];
      const templateIndex = (totalSent + i) % TEMPLATES.length;
      const template = TEMPLATES[templateIndex];

      // Pausa entre mensajes (no antes del primero)
      if (i > 0) await sleep(PAUSE_BETWEEN_MS);

      try {
        await sendProspectTemplate(prospect, template);
        await redis.sadd(REDIS_KEY, prospect.id);

        // Guardar contexto del prospecto para cuando responda a Alejo
        const fit = getRubroFit(prospect.rubroSlug);
        await redis.set(
          `alejo:prospect:${prospect.telefono}`,
          JSON.stringify({
            nombre: prospect.nombre,
            rubro: prospect.rubro,
            rubroSlug: prospect.rubroSlug,
            fit,
          }),
          { ex: 60 * 60 * 24 * 30 } // 30 días
        );

        results.push({ nombre: prospect.nombre, rubro: prospect.rubro, template, status: "ok" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ nombre: prospect.nombre, rubro: prospect.rubro, template, status: `error: ${msg}` });
      }
    }

    const okCount = results.filter((r) => r.status === "ok").length;
    const remaining = pending.length - toSend.length;

    // Notificar a Mauro con resumen del batch
    const mauro = process.env.MAURO_PHONE;
    if (mauro && okCount > 0) {
      const resumen = results
        .map((r) => `${r.status === "ok" ? "✅" : "❌"} ${r.nombre} (${r.rubro})`)
        .join("\n");
      await axios.post(
        `${BASE_URL}/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: mauro,
          type: "text",
          text: {
            body:
              `📤 *Prospección Kit — batch enviado*\n\n${resumen}\n\n` +
              `📊 ${remaining} comercios restantes en la campaña.`,
          },
        },
        { headers: getHeaders() }
      );
    }

    return res.status(200).json({ sent: okCount, remaining, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
