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

export interface WeeklyAiAgent {
  nombre: string;
  telefono: string;
  rubro: string;
  plan: string; // AI Starter / AI Full
  timestamp: number;
}

export interface WeeklyConsulta {
  nombre: string;
  telefono: string;
  rubro: string;
  interes: string; // qué preguntó / qué producto le interesa
  timestamp: number;
}

const KEY_SALES     = "alejo:weekly:ventas";
const KEY_LEADS     = "alejo:weekly:marketing";
const KEY_AI        = "alejo:weekly:agentes_ai";
const KEY_CONSULTAS = "alejo:weekly:consultas";

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function logWeeklySale(sale: Omit<WeeklySale, "timestamp">): Promise<void> {
  const redis = getRedis();
  await redis.rpush(KEY_SALES, JSON.stringify({ ...sale, timestamp: Date.now() }));
  await redis.expire(KEY_SALES, 60 * 60 * 24 * 30);
}

export async function logWeeklyLead(lead: Omit<WeeklyLead, "timestamp">): Promise<void> {
  const redis = getRedis();
  await redis.rpush(KEY_LEADS, JSON.stringify({ ...lead, timestamp: Date.now() }));
  await redis.expire(KEY_LEADS, 60 * 60 * 24 * 30);
}

export async function logWeeklyAiAgent(agent: Omit<WeeklyAiAgent, "timestamp">): Promise<void> {
  const redis = getRedis();
  await redis.rpush(KEY_AI, JSON.stringify({ ...agent, timestamp: Date.now() }));
  await redis.expire(KEY_AI, 60 * 60 * 24 * 30);
}

export async function logWeeklyConsulta(consulta: Omit<WeeklyConsulta, "timestamp">): Promise<void> {
  const redis = getRedis();
  await redis.rpush(KEY_CONSULTAS, JSON.stringify({ ...consulta, timestamp: Date.now() }));
  await redis.expire(KEY_CONSULTAS, 60 * 60 * 24 * 30);
}

export async function getAndClearWeeklyData(): Promise<{
  sales: WeeklySale[];
  leads: WeeklyLead[];
  aiAgents: WeeklyAiAgent[];
  consultas: WeeklyConsulta[];
}> {
  const redis = getRedis();

  const [rawSales, rawLeads, rawAi, rawConsultas] = await Promise.all([
    redis.lrange(KEY_SALES, 0, -1),
    redis.lrange(KEY_LEADS, 0, -1),
    redis.lrange(KEY_AI, 0, -1),
    redis.lrange(KEY_CONSULTAS, 0, -1),
  ]);

  const parse = (arr: unknown[]) => arr.map(r => typeof r === "string" ? JSON.parse(r) : r);

  await Promise.all([
    redis.del(KEY_SALES),
    redis.del(KEY_LEADS),
    redis.del(KEY_AI),
    redis.del(KEY_CONSULTAS),
  ]);

  return {
    sales:     parse(rawSales) as WeeklySale[],
    leads:     parse(rawLeads) as WeeklyLead[],
    aiAgents:  parse(rawAi) as WeeklyAiAgent[],
    consultas: parse(rawConsultas) as WeeklyConsulta[],
  };
}
