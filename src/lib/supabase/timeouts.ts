const DEFAULT_SUPABASE_TIMEOUT_MS = 4000;

export function withSupabaseTimeout<T>(
  promise: Promise<T>,
  message = "Supabase request timed out",
  timeoutMs = DEFAULT_SUPABASE_TIMEOUT_MS,
) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(message));
      }, timeoutMs);

      void timeoutId;
    }),
  ]);
}
