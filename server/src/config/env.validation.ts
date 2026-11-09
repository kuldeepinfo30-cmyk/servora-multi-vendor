/**
 * Environment validation without an extra dependency. Throws at boot with a
 * readable list of problems instead of failing lazily at query time.
 */
export function validateEnv(raw: Record<string, unknown>) {
  const env = { ...raw } as Record<string, string | undefined>;
  const errors: string[] = [];

  if (!env.DATABASE_URL) errors.push('DATABASE_URL is required (PostgreSQL connection string).');
  if (!env.JWT_ACCESS_SECRET || env.JWT_ACCESS_SECRET.length < 32) {
    errors.push('JWT_ACCESS_SECRET must be at least 32 characters.');
  }
  if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters.');
  }

  if (errors.length && env.NODE_ENV === 'production') {
    throw new Error(`Invalid environment:\n- ${errors.join('\n- ')}`);
  }

  return {
    ...env,
    NODE_ENV: env.NODE_ENV ?? 'development',
    PORT: Number(env.PORT ?? 4000),
    THROTTLE_TTL_SECONDS: Number(env.THROTTLE_TTL_SECONDS ?? 60),
    THROTTLE_LIMIT: Number(env.THROTTLE_LIMIT ?? 120),
    JWT_ACCESS_TTL: env.JWT_ACCESS_TTL ?? '15m',
    JWT_REFRESH_TTL: env.JWT_REFRESH_TTL ?? '30d',
    SEED_DEMO_DATA: env.SEED_DEMO_DATA !== 'false',
  };
}
