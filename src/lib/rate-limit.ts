import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Si no hay credenciales de Redis configuradas, rate limiting se desactiva
const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

function createLimiter(requests: number, window: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
  });
}

// Límites por tipo de operación
export const rateLimitAuth = createLimiter(5, "1 m");      // login/register: 5/min
export const rateLimitScan = createLimiter(30, "1 m");     // scan QR: 30/min
export const rateLimitPublic = createLimiter(10, "1 m");   // registro público de clientes: 10/min
export const rateLimitApi = createLimiter(60, "1 m");      // API general: 60/min

/**
 * Verifica rate limit. Retorna null si OK, o un Response 429 si excede el límite.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  request: Request
): Promise<Response | null> {
  if (!limiter) return null; // sin Redis → sin rate limiting

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const { success, limit, reset, remaining } = await limiter.limit(ip);

  if (!success) {
    return new Response(
      JSON.stringify({ success: false, error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  return null;
}
