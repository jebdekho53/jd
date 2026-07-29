export interface NormalizedError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export function normalizeError(
  err: unknown,
  context?: Record<string, unknown>,
): NormalizedError {
  const timestamp = new Date().toISOString();

  if (err && typeof err === 'object' && 'normalized' in err) {
    const n = (err as { normalized?: NormalizedError }).normalized;
    if (n) return { ...n, context: { ...n.context, ...context } };
  }

  if (err instanceof Error) {
    const status = 'status' in err ? Number((err as { status: number }).status) : 0;
    return {
      code: status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`,
      message: err.message,
      context,
      timestamp,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(err),
    context,
    timestamp,
  };
}
