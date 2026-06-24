import { Redis } from "@upstash/redis";
import { sendTextMessage } from "./whatsapp";

// Precios Claude Sonnet 4.6 por millón de tokens
const PRICE_INPUT_PER_M = 3.0;   // USD
const PRICE_OUTPUT_PER_M = 15.0; // USD

const KEY_TOKENS_IN  = "alejo:tokens:input";
const KEY_TOKENS_OUT = "alejo:tokens:output";
const KEY_ALERTED    = "alejo:credits:alerted";

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function trackUsage(inputTokens: number, outputTokens: number): Promise<void> {
  const redis = getRedis();
  await Promise.all([
    redis.incrby(KEY_TOKENS_IN, inputTokens),
    redis.incrby(KEY_TOKENS_OUT, outputTokens),
  ]);

  const [totalIn, totalOut] = await Promise.all([
    redis.get<number>(KEY_TOKENS_IN),
    redis.get<number>(KEY_TOKENS_OUT),
  ]);

  const costUSD = ((totalIn ?? 0) / 1_000_000 * PRICE_INPUT_PER_M) +
                  ((totalOut ?? 0) / 1_000_000 * PRICE_OUTPUT_PER_M);

  // Saldo inicial $5 — alertar cuando el gasto supera $3 (quedan ~$2)
  const BUDGET = parseFloat(process.env.ANTHROPIC_BUDGET_USD ?? "5");
  const ALERT_THRESHOLD = BUDGET - 2;

  if (costUSD >= ALERT_THRESHOLD) {
    const alreadyAlerted = await redis.get<number>(KEY_ALERTED);
    if (!alreadyAlerted) {
      await redis.set(KEY_ALERTED, 1, { ex: 60 * 60 * 12 }); // no repetir por 12h
      const msg =
        `⚠️ *CRÉDITOS ALEJO — SALDO BAJO*\n\n` +
        `💸 Gasto estimado: $${costUSD.toFixed(2)} USD de $${BUDGET} USD\n` +
        `🔢 Tokens usados: ${((totalIn ?? 0) + (totalOut ?? 0)).toLocaleString()}\n\n` +
        `Quedan aproximadamente *$${(BUDGET - costUSD).toFixed(2)} USD* de crédito.\n` +
        `Recargá en: console.anthropic.com → Billing\n\n` +
        `_Alejo sigue funcionando pero recomendamos recargar pronto._`;

      const roberto = process.env.ROBERTO_PHONE;
      const mauro = process.env.MAURO_PHONE;
      await Promise.allSettled([
        roberto ? sendTextMessage(roberto, msg) : Promise.resolve(),
        mauro   ? sendTextMessage(mauro, msg)   : Promise.resolve(),
      ]);
    }
  }
}

export async function getUsageStats(): Promise<{ inputTokens: number; outputTokens: number; costUSD: number }> {
  const redis = getRedis();
  const [totalIn, totalOut] = await Promise.all([
    redis.get<number>(KEY_TOKENS_IN),
    redis.get<number>(KEY_TOKENS_OUT),
  ]);
  const inputTokens  = totalIn ?? 0;
  const outputTokens = totalOut ?? 0;
  const costUSD = (inputTokens / 1_000_000 * PRICE_INPUT_PER_M) +
                  (outputTokens / 1_000_000 * PRICE_OUTPUT_PER_M);
  return { inputTokens, outputTokens, costUSD };
}
