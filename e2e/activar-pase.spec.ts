import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");
loadEnvFile(".env");

const DEFAULT_ENTRY_PRICE = 6000;
const NONPAID_EMAIL = "qa+nonpaid@soliprode.com";
const PAID_EMAIL = "qa+paid@soliprode.com";
const FALLBACK_ADMIN_EMAIL = "qa+admin@soliprode.com";
const E2E_AUTH_PASSWORD = "CodexE2E123!";

type Credentials = {
  email: string;
  password: string;
};

type SupabaseSessionCookie = {
  name: string;
  value: string;
};

type ParticipationStatus = "pending" | "paid";

function loadEnvFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getEntryPriceLabel() {
  const parsedPrice = Number(process.env.NEXT_PUBLIC_ENTRY_PRICE ?? DEFAULT_ENTRY_PRICE);
  const amount = Number.isFinite(parsedPrice) && parsedPrice > 0 ? Math.round(parsedPrice) : DEFAULT_ENTRY_PRICE;

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getProtectedLoginRegex(nextPath: string) {
  const encoded = encodeURIComponent(nextPath);
  return new RegExp(`/login\\?next=(?:${escapeRegExp(encoded)}|${escapeRegExp(nextPath)})`);
}

async function loginThroughProtectedRoute(page: Page, nextPath: string, credentials: Credentials) {
  await authenticatePageSession(page, credentials);
  await page.goto(nextPath);
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(nextPath)}(?:\\?.*)?$`));
}

function getSupabaseUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for Playwright auth session setup.");
  }

  return supabaseUrl;
}

function getSupabasePublishableKey() {
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY for Playwright auth session setup.",
    );
  }

  return publishableKey;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getSupabaseSessionCookieName(supabaseUrl: string) {
  const hostnamePrefix = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${hostnamePrefix}-auth-token`;
}

async function createSupabaseSessionCookie(credentials: Credentials): Promise<SupabaseSessionCookie> {
  const supabaseUrl = getSupabaseUrl();
  const supabase = createClient(supabaseUrl, getSupabasePublishableKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await ensureAuthPassword(credentials.email, credentials.password);

  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error || !data.session) {
    throw error ?? new Error(`Could not authenticate Playwright QA user ${credentials.email}.`);
  }

  return {
    name: getSupabaseSessionCookieName(supabaseUrl),
    value: `base64-${toBase64Url(JSON.stringify(data.session))}`,
  };
}

async function authenticatePageSession(page: Page, credentials: Credentials) {
  const sessionCookie = await createSupabaseSessionCookie(credentials);

  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: sessionCookie.name,
      value: sessionCookie.value,
      url: "http://127.0.0.1:3000",
      sameSite: "Lax",
    },
  ]);
}

async function findAuthUserByEmail(email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const found = users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;

    if (found) {
      return { supabase, user: found };
    }

    if (users.length < 200) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthPassword(email: string, password: string) {
  const authLookup = await findAuthUserByEmail(email);

  if (!authLookup) {
    throw new Error(`QA auth user not found for ${email}. Run qa:prepare-users first.`);
  }

  const { error } = await authLookup.supabase.auth.admin.updateUserById(authLookup.user.id, {
    password,
    email_confirm: true,
  });

  if (error) {
    throw error;
  }
}

async function ensureQaParticipationStatus(email: string, status: ParticipationStatus) {
  const authLookup = await findAuthUserByEmail(email);

  if (!authLookup) {
    throw new Error(`QA auth user not found for ${email}. Run qa:prepare-users first.`);
  }

  const now = new Date().toISOString();
  const { data: participations, error: participationError } = await authLookup.supabase
    .from("participations")
    .select("id")
    .eq("profile_id", authLookup.user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (participationError) {
    throw participationError;
  }

  const participation = participations?.[0];

  if (!participation) {
    throw new Error(`No participation found for ${email}. Run qa:prepare-users first.`);
  }

  if (status === "pending") {
    const { error: deleteAttemptsError } = await authLookup.supabase
      .from("payment_attempts")
      .delete()
      .eq("participation_id", participation.id);

    if (deleteAttemptsError) {
      throw deleteAttemptsError;
    }
  }

  const updatePayload =
    status === "paid"
      ? {
          payment_status: "paid",
          payment_provider: "mercadopago",
          payment_started_at: now,
          paid_at: now,
          activated_at: now,
          eligible_from: now,
          entry_price: 5000,
          price_snapshot_at: now,
        }
      : {
          payment_status: "pending",
          payment_provider: null,
          payment_started_at: null,
          paid_at: null,
          activated_at: null,
          eligible_from: null,
          payment_reference: null,
          payment_submitted_at: null,
        };

  const { error: updateError } = await authLookup.supabase
    .from("participations")
    .update(updatePayload)
    .eq("id", participation.id);

  if (updateError) {
    throw updateError;
  }
}

async function resolveOptionalAdminCredentials(): Promise<Credentials | null> {
  const explicitEmail = process.env.QA_ADMIN_EMAIL?.trim();
  const adminEmail = explicitEmail || FALLBACK_ADMIN_EMAIL;

  const authLookup = await findAuthUserByEmail(adminEmail);

  if (!authLookup?.user.email) {
    return null;
  }

  const { data: profile, error } = await authLookup.supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", authLookup.user.id)
    .maybeSingle();

  if (error || !profile?.is_admin) {
    return null;
  }

  return {
    email: authLookup.user.email,
    password: E2E_AUTH_PASSWORD,
  };
}

test("visitante en /activar-pase redirige a login con next", async ({ page }) => {
  await page.goto("/activar-pase");
  await expect(page).toHaveURL(getProtectedLoginRegex("/activar-pase"));
});

test("nonpaid autenticado ve precio dominante y arranca checkout Mercado Pago", async ({ page }) => {
  const priceLabel = getEntryPriceLabel();

  await ensureQaParticipationStatus(NONPAID_EMAIL, "pending");

  await loginThroughProtectedRoute(page, "/activar-pase", {
    email: NONPAID_EMAIL,
    password: E2E_AUTH_PASSWORD,
  });

  await expect(page.getByRole("heading", { name: "Activá tu Pase Solidario" })).toBeVisible();
  await expect(page.getByText(priceLabel, { exact: true })).toBeVisible();

  const payButton = page.getByRole("button", { name: "PAGAR Y ACTIVAR MI PASE" });
  await expect(payButton).toHaveCount(1);
  await expect(payButton).toBeVisible();

  await page.getByRole("checkbox").check();

  const checkoutResponsePromise = page.waitForResponse((response) => {
    return (
      response.url().includes("/api/payments/mercadopago/start-checkout") &&
      response.request().method() === "POST"
    );
  });

  await payButton.click();

  const checkoutResponse = await checkoutResponsePromise;
  expect(checkoutResponse.status()).toBe(303);

  const redirectLocation = checkoutResponse.headers().location;
  expect(redirectLocation).toMatch(/^https:\/\/www\.mercadopago\.com\.ar\//i);
});

test("paid autenticado ve Pase activo y no ve CTA de pago", async ({ page }) => {
  await ensureQaParticipationStatus(PAID_EMAIL, "paid");

  await loginThroughProtectedRoute(page, "/activar-pase", {
    email: PAID_EMAIL,
    password: E2E_AUTH_PASSWORD,
  });

  await expect(page.getByRole("heading", { name: "Tu Pase Solidario ya está activo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "PAGAR Y ACTIVAR MI PASE" })).toHaveCount(0);
});

for (const returnCase of [
  {
    path: "/pago/success",
    title: "Estamos confirmando tu pago",
  },
  {
    path: "/pago/pending",
    title: "El pago no se completó",
  },
  {
    path: "/pago/failure",
    title: "No se pudo activar tu Pase",
  },
  {
    path: "/payment/success",
    title: "Estamos confirmando tu pago",
  },
] as const) {
  test(`${returnCase.path} renderiza`, async ({ page }) => {
    await page.goto(returnCase.path);
    await expect(page.getByRole("heading", { name: returnCase.title })).toBeVisible();
  });
}

test("admin renderiza métricas principales si existe usuario QA admin", async ({ page }) => {
  const adminCredentials = await resolveOptionalAdminCredentials();

  test.skip(
    !adminCredentials,
    "No hay QA admin configurado para E2E. Definí QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD o creá qa+admin@soliprode.com con is_admin=true.",
  );

  await loginThroughProtectedRoute(page, "/admin", adminCredentials);

  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  await expect(page.getByText("Registrados", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Sin Pase", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Pagos pendientes", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Jugadores activos", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Conversión", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Recaudado", { exact: true }).first()).toBeVisible();
});
