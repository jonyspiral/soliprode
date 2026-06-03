import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const QA_USERS = [
  {
    key: "nonpaid",
    email: "qa+nonpaid@soliprode.com",
    fullName: "QA Nonpaid",
    alias: "QA Nonpaid",
    participationStatus: "pending",
  },
  {
    key: "pending",
    email: "qa+pending@soliprode.com",
    fullName: "QA Pending",
    alias: "QA Pending",
    participationStatus: "payment_pending",
  },
  {
    key: "paid",
    email: "qa+paid@soliprode.com",
    fullName: "QA Paid",
    alias: "QA Paid",
    participationStatus: "paid",
  },
];

function loadEnvFile(filename) {
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

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. The script refuses to run without service role access.",
  );
}

const sharedPassword = process.env.QA_TEST_USERS_PASSWORD?.trim() || null;

function readPassword(key) {
  return (
    process.env[`QA_${key.toUpperCase()}_PASSWORD`]?.trim() ||
    sharedPassword
  );
}

for (const user of QA_USERS) {
  if (!readPassword(user.key)) {
    throw new Error(
      `Missing password env for ${user.email}. Set QA_TEST_USERS_PASSWORD or QA_${user.key.toUpperCase()}_PASSWORD before running.`,
    );
  }
}

const args = new Set(process.argv.slice(2));
const resetPredictions = args.has("--reset-predictions");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyKeys = onlyArg
  ? new Set(
      onlyArg
        .slice("--only=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    )
  : null;

const usersToProcess = onlyKeys
  ? QA_USERS.filter((user) => onlyKeys.has(user.key))
  : QA_USERS;

if (usersToProcess.length === 0) {
  throw new Error("No QA users matched --only=...");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(email) {
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
    const found = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

    if (found) {
      return found;
    }

    if (users.length < 200) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser(userConfig) {
  const password = readPassword(userConfig.key);
  const existingUser = await findUserByEmail(userConfig.email);

  if (existingUser) {
    await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: userConfig.fullName,
        public_alias: userConfig.alias,
      },
    });

    return {
      id: existingUser.id,
      email: userConfig.email,
      created: false,
    };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: userConfig.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: userConfig.fullName,
      public_alias: userConfig.alias,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Could not create auth user for ${userConfig.email}`);
  }

  return {
    id: data.user.id,
    email: userConfig.email,
    created: true,
  };
}

async function ensureProfile(userConfig, authUser) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: authUser.id,
      full_name: userConfig.fullName,
      public_alias: userConfig.alias,
      email: userConfig.email,
      role: "player",
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function ensureParticipation(userConfig, authUser) {
  const { data, error } = await supabase
    .from("participations")
    .select("id, payment_status, payment_started_at, created_at")
    .eq("profile_id", authUser.id)
    .order("created_at", { ascending: false })
    .limit(2);

  if (error) {
    throw error;
  }

  const now = new Date().toISOString();
  const current = data?.[0] ?? null;

  const basePayload = {
    profile_id: authUser.id,
    payment_provider:
      userConfig.participationStatus === "pending" ? null : "mercadopago",
    payment_reference: null,
    payment_submitted_at: null,
    entry_baseline_points: 0,
  };

  if (!current) {
    const insertPayload =
      userConfig.participationStatus === "paid"
        ? {
            ...basePayload,
            payment_status: "paid",
            payment_started_at: now,
            paid_at: now,
            activated_at: now,
            eligible_from: now,
            entry_price: 5000,
            price_snapshot_at: now,
          }
        : userConfig.participationStatus === "payment_pending"
          ? {
              ...basePayload,
              payment_status: "payment_pending",
              payment_started_at: now,
              paid_at: null,
              activated_at: null,
              eligible_from: null,
            }
          : {
              ...basePayload,
              payment_status: "pending",
              payment_started_at: null,
              paid_at: null,
              activated_at: null,
              eligible_from: null,
            };

    const { error: insertError } = await supabase.from("participations").insert(insertPayload);

    if (insertError) {
      throw insertError;
    }

    return;
  }

  const updatePayload =
    userConfig.participationStatus === "paid"
      ? {
          ...basePayload,
          payment_status: "paid",
          payment_started_at: current.payment_started_at ?? now,
          paid_at: now,
          activated_at: now,
          eligible_from: now,
          entry_price: 5000,
          price_snapshot_at: now,
        }
      : userConfig.participationStatus === "payment_pending"
        ? {
            ...basePayload,
            payment_status: "payment_pending",
            payment_started_at: current.payment_started_at ?? now,
            paid_at: null,
            activated_at: null,
            eligible_from: null,
          }
        : {
            ...basePayload,
            payment_status: "pending",
            payment_started_at: null,
            paid_at: null,
            activated_at: null,
            eligible_from: null,
          };

  const { error: updateError } = await supabase
    .from("participations")
    .update(updatePayload)
    .eq("id", current.id);

  if (updateError) {
    throw updateError;
  }
}

async function resetQaPredictions(profileIds) {
  if (profileIds.length === 0) {
    return 0;
  }

  const { error } = await supabase
    .from("predictions")
    .delete()
    .in("profile_id", profileIds);

  if (error) {
    throw error;
  }

  return profileIds.length;
}

async function main() {
  const summary = [];
  const profileIds = [];

  for (const userConfig of usersToProcess) {
    const authUser = await ensureAuthUser(userConfig);
    await ensureProfile(userConfig, authUser);
    await ensureParticipation(userConfig, authUser);
    profileIds.push(authUser.id);

    summary.push({
      email: userConfig.email,
      userId: authUser.id,
      status: userConfig.participationStatus,
      authUserCreated: authUser.created,
    });
  }

  if (resetPredictions) {
    await resetQaPredictions(profileIds);
  }

  console.log(JSON.stringify({ ok: true, resetPredictions, users: summary }, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
