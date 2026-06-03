import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Only enforce rate limiting when Upstash is configured
const isConfigured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const limiters = isConfigured
  ? {
      '/api/parse-resume': new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(50, '1 h'),
        prefix: 'rl:parse-resume',
      }),
      '/api/search-jobs': new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(100, '1 h'),
        prefix: 'rl:search-jobs',
      }),
      '/api/job-recs': new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(200, '1 h'),
        prefix: 'rl:job-recs',
      }),
    }
  : null;

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  );
}

export async function proxy(req: NextRequest) {
  if (!limiters) return NextResponse.next();

  const path = req.nextUrl.pathname as keyof typeof limiters;
  const limiter = limiters[path];
  if (!limiter) return NextResponse.next();

  const ip = getIp(req);
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/parse-resume', '/api/search-jobs', '/api/job-recs'],
};
