function readEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export function getRequiredEnv(name: string) {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string) {
  const value = readEnv(name);
  return value || null;
}
