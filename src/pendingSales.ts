import { Redis } from "@upstash/redis";

export interface PendingSale {
  clientPhone: string;
  clientName: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  calle: string;
  ciudad: string;
  provincia: string;
  referencia: string;
  tipoEnvio: string;
  nombreLocal: string;
  mapLink: string;
  monto: string;
  notas: string;
  createdAt: number;
}

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

const KEY = "alejo:pending_sale";
const TTL = 60 * 60 * 48; // 48 horas

export async function savePendingSale(sale: PendingSale): Promise<void> {
  const redis = getRedis();
  await redis.set(KEY, sale, { ex: TTL });
}

export async function getPendingSale(): Promise<PendingSale | null> {
  const redis = getRedis();
  return await redis.get<PendingSale>(KEY);
}

export async function clearPendingSale(): Promise<void> {
  const redis = getRedis();
  await redis.del(KEY);
}

export function isTeamMember(phone: string): boolean {
  return (
    phone === process.env.ROBERTO_PHONE ||
    phone === process.env.MAURO_PHONE
  );
}

export function isConfirmation(text: string): boolean {
  const t = text.toLowerCase().trim()
    .normalize("NFD").replace(/[̀-ͯ]/g, ""); // quitar tildes para comparar
  return [
    "si", "sí", "ok", "yes", "dale", "confirmo", "confirmado",
    "llego", "llegó", "me llego", "me llegó", "llego el pago",
    "llegó el pago", "confirmar", "listo", "aparecio", "apareció",
  ].some(w => t.includes(w.normalize("NFD").replace(/[̀-ͯ]/g, "")));
}
