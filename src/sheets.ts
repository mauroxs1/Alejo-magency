import axios from "axios";

const SHEETS_URL = process.env.SHEETS_WEBHOOK_URL ?? "";

interface LeadData {
  nombre?: string;
  telefono: string;
  tipoLead?: string;
  rubro?: string;
  instagram?: string;
  planUpsell?: string;
  estado?: string;
  observaciones?: string;
}

export async function addLead(data: LeadData): Promise<void> {
  if (!SHEETS_URL) return;
  const params = new URLSearchParams({
    action: "addLead",
    nombre: data.nombre ?? "",
    telefono: data.telefono,
    tipoLead: data.tipoLead ?? "",
    rubro: data.rubro ?? "",
    instagram: data.instagram ?? "",
    planUpsell: data.planUpsell ?? "",
    estado: data.estado ?? "Nuevo",
    observaciones: data.observaciones ?? "",
  });
  await axios.get(`${SHEETS_URL}?${params.toString()}`).catch((e) => {
    console.error("Sheets addLead error:", e?.message);
  });
}

export async function updateLead(
  telefono: string,
  estado?: string,
  observaciones?: string
): Promise<void> {
  if (!SHEETS_URL) return;
  const params = new URLSearchParams({ action: "updateLead", telefono });
  if (estado) params.set("estado", estado);
  if (observaciones) params.set("observaciones", observaciones);
  await axios.get(`${SHEETS_URL}?${params.toString()}`).catch((e) => {
    console.error("Sheets updateLead error:", e?.message);
  });
}
