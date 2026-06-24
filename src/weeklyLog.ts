import { Redis } from "@upstash/redis";

export interface WeeklySale {
  nombre: string;
  apellido: string;
  ciudad: string;
  monto: string;
  whatsapp: string;
  timestamp: number;
}

export interface WeeklyLead {
  nombre: string;
  telefono: string;
  rubro: string;
  plan: string;
  timestamp: number;
}

const KEY_SALES = "alejo:weekly:ventas";
const KEY_LEADS = "alejo:weekly:marketing";

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function logWeeklySale(sale: Omit<WeeklySale, "timestamp">): Promise<void> {
  const redis = getRedis();
  const entry: WeeklySale = { ...sale, timestamp: Date.now() };
  await redis.rpush(KEY_SALES, JSON.stringify(entry));
  await redis.expire(KEY_SALES, 60 * 60 * 24 * 30); // 30 días por seguridad
}

export async function logWeeklyLead(lead: Omit<WeeklyLead, "timestamp">): Promise<void> {
  const redis = getRedis();
  const entry: WeeklyLead = { ...lead, timestamp: Date.now() };
  await redis.rpush(KEY_LEADS, JSON.stringify(entry));
  await redis.expire(KEY_LEADS, 60 * 60 * 24 * 30);
}

export async function getAndClearWeeklyData(): Promise<{ sales: WeeklySale[]; leads: WeeklyLead[] }> {
  const redis = getRedis();

  const [rawSales, rawLeads] = await Promise.all([
    redis.lrange(KEY_SALES, 0, -1),
    redis.lrange(KEY_LEADS, 0, -1),
  ]);

  const sales: WeeklySale[] = rawSales.map(r =>
    typeof r === "string" ? JSON.parse(r) : r
  );
  const leads: WeeklyLead[] = rawLeads.map(r =>
    typeof r === "string" ? JSON.parse(r) : r
  );

  // Limpiar listas después de leer
  await Promise.all([
    redis.del(KEY_SALES),
    redis.del(KEY_LEADS),
  ]);

  return { sales, leads };
}
