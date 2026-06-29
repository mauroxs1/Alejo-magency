import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAndClearWeeklyData } from "../src/weeklyLog";
import { sendWeeklyReport } from "../src/email";
import { sendTextMessage } from "../src/whatsapp";

export const maxDuration = 30;

function getWeekLabel(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Mendoza" }));
  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "America/Argentina/Mendoza" });
  return `${fmt(start)} al ${fmt(end)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { sales, leads, aiAgents, consultas } = await getAndClearWeeklyData();
    const weekLabel = getWeekLabel();

    await sendWeeklyReport(sales, leads, aiAgents, consultas, weekLabel);

    const mauro = process.env.MAURO_PHONE;
    if (mauro) {
      await sendTextMessage(mauro,
        `📊 *Reporte semanal enviado*\n\n` +
        `Semana: ${weekLabel}\n` +
        `🛒 Ventas Kit: ${sales.length}\n` +
        `📈 Cierres marketing: ${leads.length}\n` +
        `🤖 Cierres Agente AI: ${aiAgents.length}\n` +
        `💬 Consultas: ${consultas.length}\n\n` +
        `Revisá el detalle en rubioj12345@gmail.com`
      );
    }

    return res.status(200).json({ ok: true, sales: sales.length, leads: leads.length, aiAgents: aiAgents.length, consultas: consultas.length });
  } catch (err) {
    console.error("Error enviando reporte semanal:", err);
    return res.status(500).json({ error: String(err) });
  }
}
