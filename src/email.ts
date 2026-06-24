import type { WeeklySale, WeeklyLead } from "./weeklyLog";

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

function buildHtml(sales: WeeklySale[], leads: WeeklyLead[], weekLabel: string): string {
  const totalVentas = sales.reduce((acc, s) => acc + parseInt(s.monto.replace(/\D/g, ""), 10) || 0, 0);

  const salesRows = sales.length > 0
    ? sales.map(s => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${s.nombre} ${s.apellido}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${s.ciudad || "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace">${s.whatsapp}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#16a34a;font-weight:600">${formatMoney(s.monto)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px">${formatDate(s.timestamp)}</td>
        </tr>`).join("")
    : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#9ca3af">Sin ventas esta semana</td></tr>`;

  const leadsRows = leads.length > 0
    ? leads.map(l => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${l.nombre}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${l.rubro || "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#7c3aed;font-weight:600">${l.plan || "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace">${l.telefono}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px">${formatDate(l.timestamp)}</td>
        </tr>`).join("")
    : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#9ca3af">Sin cierres de marketing esta semana</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e1b4b 0%,#4c1d95 100%);padding:32px 32px 24px">
      <p style="color:#c4b5fd;margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:1px">Reporte Semanal</p>
      <h1 style="color:#fff;margin:0;font-size:24px">Magency — ${weekLabel}</h1>
      <p style="color:#a78bfa;margin:8px 0 0;font-size:14px">Generado automáticamente por Alejo</p>
    </div>

    <!-- Resumen rápido -->
    <div style="display:flex;gap:0;border-bottom:1px solid #e5e7eb">
      <div style="flex:1;padding:20px 24px;border-right:1px solid #e5e7eb">
        <p style="margin:0;color:#6b7280;font-size:13px">Ventas Kit</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#1e1b4b">${sales.length}</p>
        ${sales.length > 0 ? `<p style="margin:4px 0 0;font-size:14px;color:#16a34a;font-weight:600">${formatMoney(String(totalVentas))} total</p>` : ""}
      </div>
      <div style="flex:1;padding:20px 24px">
        <p style="margin:0;color:#6b7280;font-size:13px">Cierres Marketing</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#1e1b4b">${leads.length}</p>
      </div>
    </div>

    <div style="padding:24px 32px">

      <!-- Ventas Kit -->
      <h2 style="margin:0 0 12px;font-size:16px;color:#1e1b4b;display:flex;align-items:center;gap:8px">
        🛒 Ventas Kit Live Commerce
      </h2>
      <div style="overflow-x:auto;margin-bottom:32px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">Cliente</th>
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">Ciudad</th>
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">WhatsApp</th>
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">Monto</th>
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">Fecha</th>
            </tr>
          </thead>
          <tbody>${salesRows}</tbody>
        </table>
      </div>

      <!-- Cierres Marketing -->
      <h2 style="margin:0 0 12px;font-size:16px;color:#1e1b4b">
        📊 Cierres de Marketing Digital
      </h2>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">Cliente</th>
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">Rubro</th>
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">Plan</th>
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">Teléfono</th>
              <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600">Fecha</th>
            </tr>
          </thead>
          <tbody>${leadsRows}</tbody>
        </table>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:12px">
        Este reporte es generado automáticamente cada lunes por Alejo, el agente de Magency.<br>
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
  weekLabel: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no configurada");

  const to = process.env.REPORT_EMAIL ?? "rubioj12345@gmail.com";
  const html = buildHtml(sales, leads, weekLabel);

  const body = {
    from: "Alejo Magency <alejo@magency.ar>",
    to: [to],
    subject: `📊 Resumen semanal Magency — ${weekLabel}`,
    html,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error enviando email: ${res.status} — ${err}`);
  }
}
