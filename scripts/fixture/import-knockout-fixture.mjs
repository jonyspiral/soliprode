import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_COLUMNS = [
  "match_number",
  "stage",
  "round_name",
  "home_slot_rule",
  "home_slot_label",
  "away_slot_rule",
  "away_slot_label",
  "starts_at",
  "prediction_closes_at",
  "venue",
  "city",
  "status",
  "bracket_position",
  "bracket_side",
];

const VALID_STAGES = new Set([
  "round_of_32",
  "round_of_16",
  "quarter_finals",
  "semi_finals",
  "third_place",
  "final",
]);
const VALID_STATUS = new Set(["scheduled"]);
const VALID_BRACKET_SIDES = new Set(["left", "right"]);

function parseArgs(argv) {
  const args = {
    file: null,
    apply: false,
    confirmWrite: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--file") {
      args.file = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--apply") {
      args.apply = true;
      continue;
    }

    if (arg === "--confirm-write") {
      args.confirmWrite = true;
    }
  }

  return args;
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [key, ...rest] = line.split("=");
    let value = rest.join("=");

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function buildSupabaseClient() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadEnvFile(path.resolve(process.cwd(), ".env"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure them before importing knockout fixture.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    throw new Error("CSV is empty. Provide at least the header row.");
  }

  const header = parseCsvLine(lines[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !header.includes(column));

  if (missingColumns.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingColumns.join(", ")}`);
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);

    if (values.length !== header.length) {
      throw new Error(`CSV row ${index + 2} has ${values.length} columns; expected ${header.length}.`);
    }

    const row = {};
    header.forEach((column, columnIndex) => {
      row[column] = values[columnIndex];
    });

    return {
      ...row,
      __rowNumber: index + 2,
    };
  });
}

function validateRows(rows) {
  const errors = [];
  const matchNumbers = new Set();
  const normalizedRows = [];

  for (const row of rows) {
    const matchNumber = Number.parseInt(row.match_number, 10);
    const stage = row.stage;
    const roundName = row.round_name;
    const status = row.status;
    const startsAt = row.starts_at;
    const closesAt = row.prediction_closes_at;
    const venue = row.venue;
    const city = row.city;
    const homeSlotRule = row.home_slot_rule;
    const awaySlotRule = row.away_slot_rule;
    const homeSlotLabel = row.home_slot_label;
    const awaySlotLabel = row.away_slot_label;
    const bracketPosition = row.bracket_position;
    const bracketSide = row.bracket_side;

    if (!Number.isInteger(matchNumber) || matchNumber <= 0) {
      errors.push(`row ${row.__rowNumber}: match_number must be a positive integer.`);
    } else if (matchNumbers.has(matchNumber)) {
      errors.push(`row ${row.__rowNumber}: duplicate match_number ${matchNumber}.`);
    } else {
      matchNumbers.add(matchNumber);
    }

    if (!VALID_STAGES.has(stage)) {
      errors.push(`row ${row.__rowNumber}: stage must be one of ${[...VALID_STAGES].join(", ")}.`);
    }

    if (!roundName) {
      errors.push(`row ${row.__rowNumber}: round_name is required.`);
    }

    if (!homeSlotRule || !awaySlotRule) {
      errors.push(`row ${row.__rowNumber}: slot rules are required for both sides.`);
    }

    if (!homeSlotLabel || !awaySlotLabel) {
      errors.push(`row ${row.__rowNumber}: slot labels are required for both sides.`);
    }

    if (!VALID_STATUS.has(status)) {
      errors.push(`row ${row.__rowNumber}: status must be scheduled.`);
    }

    const startsAtDate = new Date(startsAt);
    const closesAtDate = new Date(closesAt);

    if (!startsAt || Number.isNaN(startsAtDate.getTime())) {
      errors.push(`row ${row.__rowNumber}: starts_at must be a valid ISO datetime.`);
    }

    if (!closesAt || Number.isNaN(closesAtDate.getTime())) {
      errors.push(`row ${row.__rowNumber}: prediction_closes_at must be a valid ISO datetime.`);
    }

    if (
      startsAt &&
      closesAt &&
      !Number.isNaN(startsAtDate.getTime()) &&
      !Number.isNaN(closesAtDate.getTime()) &&
      closesAtDate.getTime() > startsAtDate.getTime()
    ) {
      errors.push(`row ${row.__rowNumber}: prediction_closes_at must be less than or equal to starts_at.`);
    }

    if (!venue) {
      errors.push(`row ${row.__rowNumber}: venue is required.`);
    }

    if (!city) {
      errors.push(`row ${row.__rowNumber}: city is required.`);
    }

    if (!bracketPosition) {
      errors.push(`row ${row.__rowNumber}: bracket_position is required.`);
    }

    if (bracketSide && !VALID_BRACKET_SIDES.has(bracketSide)) {
      errors.push(`row ${row.__rowNumber}: bracket_side must be left or right when present.`);
    }

    normalizedRows.push({
      matchNumber,
      stage,
      roundName,
      startsAt,
      predictionClosesAt: closesAt,
      venue,
      city,
      status,
      homeSlotRule,
      awaySlotRule,
      homeSlotLabel,
      awaySlotLabel,
      bracketPosition,
      bracketSide: bracketSide || null,
    });
  }

  return { errors, normalizedRows };
}

async function fetchExistingMatches(supabase, rows) {
  const matchNumbers = rows.map((row) => row.matchNumber);

  if (matchNumbers.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("matches")
    .select("match_number, home_team_id, away_team_id")
    .in("match_number", matchNumbers);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((match) => [match.match_number, match]));
}

async function upsertMatches(supabase, rows, existingMatches) {
  const matchPayloads = rows.map((row) => {
    const existingMatch = existingMatches.get(row.matchNumber);

    return {
      match_number: row.matchNumber,
      phase: row.roundName,
      round_name: row.roundName,
      stage: row.stage,
      group_name: null,
      group_code: null,
      home_team_id: existingMatch?.home_team_id ?? null,
      away_team_id: existingMatch?.away_team_id ?? null,
      home_slot_rule: row.homeSlotRule,
      away_slot_rule: row.awaySlotRule,
      home_slot_label: row.homeSlotLabel,
      away_slot_label: row.awaySlotLabel,
      starts_at: row.startsAt,
      prediction_closes_at: row.predictionClosesAt,
      venue: row.venue,
      city: row.city,
      status: row.status,
      bracket_position: row.bracketPosition,
      bracket_side: row.bracketSide,
    };
  });

  const { error } = await supabase.from("matches").upsert(matchPayloads, {
    onConflict: "match_number",
  });

  if (error) {
    throw error;
  }
}

function printSummary({ filePath, apply, rows, existingMatches }) {
  const createdMatches = rows.filter((row) => !existingMatches.has(row.matchNumber)).length;
  const updatedMatches = rows.length - createdMatches;

  console.log("");
  console.log(apply ? "Knockout fixture import applied." : "Knockout fixture dry-run succeeded.");
  console.log(`CSV: ${filePath}`);
  console.log(`Matches: ${rows.length} total | ${createdMatches} to create | ${updatedMatches} to update`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    throw new Error(
      "Usage: node scripts/fixture/import-knockout-fixture.mjs --file <csv-path> [--apply --confirm-write]",
    );
  }

  if (args.apply && !args.confirmWrite) {
    throw new Error("Writing requires both --apply and --confirm-write.");
  }

  const filePath = path.resolve(process.cwd(), args.file);

  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const csvRows = parseCsvFile(filePath);
  const { errors, normalizedRows } = validateRows(csvRows);

  if (errors.length > 0) {
    console.error("Knockout fixture validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const supabase = buildSupabaseClient();
  const existingMatches = await fetchExistingMatches(supabase, normalizedRows);

  printSummary({
    filePath,
    apply: args.apply,
    rows: normalizedRows,
    existingMatches,
  });

  if (!args.apply) {
    console.log("No writes were made. Re-run with --apply --confirm-write to upsert knockout matches.");
    return;
  }

  await upsertMatches(supabase, normalizedRows, existingMatches);
  console.log("Knockout matches were upserted successfully.");
}

main().catch((error) => {
  console.error(error.message ?? String(error));
  process.exitCode = 1;
});
