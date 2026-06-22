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

interface SaleData {
  nombre?: string;
  apellido?: string;
  dni?: string;
  whatsapp?: string;
  email?: string;
  calle?: string;
  ciudad?: string;
  provincia?: string;
  referencia?: string;
  tipoEnvio?: string;
  nombreLocal?: string;
  mapLink?: string;
  monto?: string;
  alias?: string;
  comprobanteOk?: string;
  notas?: string;
}

export async function registerSale(data: SaleData): Promise<void> {
  if (!SHEETS_URL) return;
  const params = new URLSearchParams({
    action: "registerSale",
    nombre: data.nombre ?? "",
    apellido: data.apellido ?? "",
    dni: data.dni ?? "",
    whatsapp: data.whatsapp ?? "",
    email: data.email ?? "",
    calle: data.calle ?? "",
    ciudad: data.ciudad ?? "",
    provincia: data.provincia ?? "",
    referencia: data.referencia ?? "",
    tipoEnvio: data.tipoEnvio ?? "domicilio",
    nombreLocal: data.nombreLocal ?? "",
    mapLink: data.mapLink ?? "",
    monto: data.monto ?? "299000",
    alias: data.alias ?? "mm.kit",
    comprobanteOk: data.comprobanteOk ?? "Si",
    notas: data.notas ?? "",
  });
  await axios.get(`${SHEETS_URL}?${params.toString()}`).catch((e) => {
    console.error("Sheets registerSale error:", e?.message);
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
