import type { WeeklySale, WeeklyLead, WeeklyAiAgent, WeeklyConsulta } from "./weeklyLog";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Mendoza",
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatMoney(m: string): string {
  const n = parseInt(m.replace(/\D/g, ""), 10);
  if (isNaN(n)) return m;
  return "$" + n.toLocaleString("es-AR");
}

function buildTable(headers: string[], rows: string[][], emptyMsg: string): string {
  const ths = headers.map(h =>
    `<th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">${h}</th>`
  ).join("");

  const trs = rows.length > 0
    ? rows.map(cells => {
        const tds = cells.map((c, i) =>
          `<td style="padding:9px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:${i === 0 ? "#111827" : "#4b5563"}">${c}</td>`
        ).join("");
        return `<tr>${tds}</tr>`;
      }).join("")
    : `<tr><td colspan="${headers.length}" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px">${emptyMsg}</td></tr>`;

  return `
    <div style="overflow-x:auto;margin-bottom:28px">
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <thead><tr style="background:#f8f7ff">${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    </div>`;
}

function buildSection(icon: string, title: string, count: number, tableHtml: string, badgeColor: string): string {
  return `
    <div style="margin-bottom:4px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-size:18px">${icon}</span>
        <h2 style="margin:0;font-size:15px;font-weight:700;color:#1e1b4b">${title}</h2>
        <span style="background:${badgeColor};color:#fff;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:700">${count}</span>
      </div>
      ${tableHtml}
    </div>`;
}

function buildHtml(
  sales: WeeklySale[],
  leads: WeeklyLead[],
  aiAgents: WeeklyAiAgent[],
  consultas: WeeklyConsulta[],
  weekLabel: string
): string {
  const totalVentas = sales.reduce((acc, s) => acc + (parseInt(s.monto.replace(/\D/g, ""), 10) || 0), 0);

  const salesTable = buildTable(
    ["Cliente", "Ciudad", "WhatsApp", "Monto", "Fecha"],
    sales.map(s => [
      `${s.nombre} ${s.apellido}`.trim() || "—",
      s.ciudad || "—",
      `<span style="font-family:monospace">${s.whatsapp}</span>`,
      `<span style="color:#16a34a;font-weight:600">${formatMoney(s.monto)}</span>`,
      formatDate(s.timestamp),
    ]),
    "Sin ventas Kit esta semana"
  );

  const leadsTable = buildTable(
    ["Cliente", "Rubro", "Plan", "Teléfono", "Fecha"],
    leads.map(l => [
      l.nombre || "—",
      l.rubro || "—",
      `<span style="color:#7c3aed;font-weight:600">${l.plan || "—"}</span>`,
      `<span style="font-family:monospace">${l.telefono || "—"}</span>`,
      formatDate(l.timestamp),
    ]),
    "Sin cierres de marketing esta semana"
  );

  const aiTable = buildTable(
    ["Cliente", "Rubro", "Plan", "Teléfono", "Fecha"],
    aiAgents.map(a => [
      a.nombre || "—",
      a.rubro || "—",
      `<span style="color:#0891b2;font-weight:600">${a.plan || "—"}</span>`,
      `<span style="font-family:monospace">${a.telefono || "—"}</span>`,
      formatDate(a.timestamp),
    ]),
    "Sin cierres de Agente AI esta semana"
  );

  const consultasTable = buildTable(
    ["Nombre", "Rubro", "Interés", "Teléfono", "Fecha"],
    consultas.map(c => [
      c.nombre || "—",
      c.rubro || "—",
      `<span style="color:#d97706">${c.interes || "—"}</span>`,
      `<span style="font-family:monospace">${c.telefono || "—"}</span>`,
      formatDate(c.timestamp),
    ]),
    "Sin consultas registradas esta semana"
  );

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f8;margin:0;padding:24px">
<div style="max-width:700px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

  <div style="background:linear-gradient(135deg,#1e1b4b 0%,#4c1d95 100%);padding:36px 36px 28px">
    <p style="color:#a78bfa;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px">Reporte Semanal</p>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">Magency — ${weekLabel}</h1>
    <p style="color:#c4b5fd;margin:8px 0 0;font-size:13px">Generado automáticamente por Alejo</p>
  </div>

  <div style="display:flex;border-bottom:2px solid #f3f4f6">
    <div style="flex:1;padding:18px 16px;border-right:1px solid #f3f4f6;text-align:center">
      <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px">Ventas Kit</p>
      <p style="margin:4px 0 0;font-size:30px;font-weight:800;color:#16a34a">${sales.length}</p>
      ${sales.length > 0 ? `<p style="margin:2px 0 0;font-size:12px;color:#16a34a">${formatMoney(String(totalVentas))}</p>` : ""}
    </div>
    <div style="flex:1;padding:18px 16px;border-right:1px solid #f3f4f6;text-align:center">
      <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px">Marketing</p>
      <p style="margin:4px 0 0;font-size:30px;font-weight:800;color:#7c3aed">${leads.length}</p>
    </div>
    <div style="flex:1;padding:18px 16px;border-right:1px solid #f3f4f6;text-align:center">
      <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px">Agentes AI</p>
      <p style="margin:4px 0 0;font-size:30px;font-weight:800;color:#0891b2">${aiAgents.length}</p>
    </div>
    <div style="flex:1;padding:18px 16px;text-align:center">
      <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px">Consultas</p>
      <p style="margin:4px 0 0;font-size:30px;font-weight:800;color:#d97706">${consultas.length}</p>
    </div>
  </div>

  <div style="padding:28px 32px">
    ${buildSection("🛒", "Ventas Kit Live Commerce", sales.length, salesTable, "#16a34a")}
    ${buildSection("📊", "Cierres Marketing Digital", leads.length, leadsTable, "#7c3aed")}
    ${buildSection("🤖", "Cierres Agente AI", aiAgents.length, aiTable, "#0891b2")}
    ${buildSection("💬", "Consultas e Interesados", consultas.length, consultasTable, "#d97706")}
  </div>

  <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
    <p style="margin:0;color:#9ca3af;font-size:12px">
      Reporte generado automáticamente cada lunes por Alejo · Magency<br>
      Los datos se sincronizan con Google Sheets en tiempo real.
    </p>
  </div>

</div>
</body>
</html>`;
}

export async function sendWeeklyReport(
  sales: WeeklySale[],
  leads: WeeklyLead[],
  aiAgents: WeeklyAiAgent[],
  consultas: WeeklyConsulta[],
  weekLabel: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no configurada");

  const to = process.env.REPORT_EMAIL ?? "rubioj12345@gmail.com";
  const html = buildHtml(sales, leads, aiAgents, consultas, weekLabel);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Alejo Magency <onboarding@resend.dev>",
      to: [to],
      subject: `📊 Resumen semanal Magency — ${weekLabel}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error enviando email: ${res.status} — ${err}`);
  }
}
