import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_COLUMNS = [
  "match_number",
  "stage",
  "round_name",
  "group_code",
  "group_position_home",
  "group_position_away",
  "home_team_name",
  "home_short_name",
  "home_fifa_code",
  "home_country_code",
  "home_flag_emoji",
  "away_team_name",
  "away_short_name",
  "away_fifa_code",
  "away_country_code",
  "away_flag_emoji",
  "starts_at",
  "prediction_closes_at",
  "venue",
  "city",
  "status",
];

const VALID_GROUP_CODES = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]);
const VALID_STATUS = new Set(["scheduled"]);

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
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure them before importing fixture.",
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

  const rows = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const values = parseCsvLine(lines[rowIndex]);

    if (values.length !== header.length) {
      throw new Error(
        `CSV row ${rowIndex + 1} has ${values.length} columns; expected ${header.length}.`,
      );
    }

    const row = {};

    header.forEach((column, columnIndex) => {
      row[column] = values[columnIndex];
    });

    rows.push({
      ...row,
      __rowNumber: rowIndex + 1,
    });
  }

  return rows;
}

function normalizeTeamFields(prefix, row, errors) {
  const name = row[`${prefix}_team_name`];
  const shortName = row[`${prefix}_short_name`];
  const fifaCode = row[`${prefix}_fifa_code`]?.toUpperCase();
  const countryCode = row[`${prefix}_country_code`]?.toUpperCase();
  const flagEmoji = row[`${prefix}_flag_emoji`];
  const groupPosition = Number.parseInt(row[`group_position_${prefix}`], 10);

  if (!name) {
    errors.push(`row ${row.__rowNumber}: ${prefix}_team_name is required.`);
  }

  if (!shortName) {
    errors.push(`row ${row.__rowNumber}: ${prefix}_short_name is required.`);
  }

  if (!fifaCode || !/^[A-Z0-9]{2,4}$/u.test(fifaCode)) {
    errors.push(`row ${row.__rowNumber}: ${prefix}_fifa_code must be a valid FIFA code.`);
  }

  if (!countryCode || !/^[A-Z]{2}$/u.test(countryCode)) {
    errors.push(`row ${row.__rowNumber}: ${prefix}_country_code must be ISO alpha-2.`);
  }

  if (!flagEmoji) {
    errors.push(`row ${row.__rowNumber}: ${prefix}_flag_emoji is required.`);
  }

  if (!Number.isInteger(groupPosition) || groupPosition < 1 || groupPosition > 4) {
    errors.push(
      `row ${row.__rowNumber}: group_position_${prefix} must be an integer between 1 and 4.`,
    );
  }

  return {
    name,
    shortName,
    fifaCode,
    countryCode,
    flagEmoji,
    groupPosition,
  };
}

function validateRows(rows) {
  const errors = [];
  const normalizedRows = [];
  const matchNumbers = new Set();
  const exactPairsByGroup = new Set();
  const normalizedPairsByGroup = new Set();
  const matchesPerGroup = new Map();
  const teamsPerGroup = new Map();

  for (const row of rows) {
    const matchNumber = Number.parseInt(row.match_number, 10);
    const groupCode = row.group_code?.toUpperCase();
    const stage = row.stage;
    const roundName = row.round_name;
    const status = row.status;
    const startsAt = row.starts_at;
    const closesAt = row.prediction_closes_at;
    const venue = row.venue;
    const city = row.city;

    if (!Number.isInteger(matchNumber) || matchNumber <= 0) {
      errors.push(`row ${row.__rowNumber}: match_number must be a positive integer.`);
    } else if (matchNumbers.has(matchNumber)) {
      errors.push(`row ${row.__rowNumber}: duplicate match_number ${matchNumber}.`);
    } else {
      matchNumbers.add(matchNumber);
    }

    if (stage !== "group_stage") {
      errors.push(`row ${row.__rowNumber}: stage must be group_stage.`);
    }

    if (roundName !== "Fase de grupos") {
      errors.push(`row ${row.__rowNumber}: round_name must be "Fase de grupos".`);
    }

    if (!VALID_GROUP_CODES.has(groupCode)) {
      errors.push(`row ${row.__rowNumber}: group_code must be between A and L.`);
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
      errors.push(
        `row ${row.__rowNumber}: prediction_closes_at must be a valid ISO datetime.`,
      );
    }

    if (
      startsAt &&
      closesAt &&
      !Number.isNaN(startsAtDate.getTime()) &&
      !Number.isNaN(closesAtDate.getTime()) &&
      closesAtDate.getTime() > startsAtDate.getTime()
    ) {
      errors.push(
        `row ${row.__rowNumber}: prediction_closes_at must be less than or equal to starts_at.`,
      );
    }

    if (!venue) {
      errors.push(`row ${row.__rowNumber}: venue is required.`);
    }

    if (!city) {
      errors.push(`row ${row.__rowNumber}: city is required.`);
    }

    const home = normalizeTeamFields("home", row, errors);
    const away = normalizeTeamFields("away", row, errors);

    if (home.name && away.name && home.name === away.name) {
      errors.push(`row ${row.__rowNumber}: home_team_name and away_team_name cannot match.`);
    }

    if (home.fifaCode && away.fifaCode && home.fifaCode === away.fifaCode) {
      errors.push(`row ${row.__rowNumber}: home_fifa_code and away_fifa_code cannot match.`);
    }

    if (VALID_GROUP_CODES.has(groupCode)) {
      matchesPerGroup.set(groupCode, (matchesPerGroup.get(groupCode) ?? 0) + 1);

      const teamSet = teamsPerGroup.get(groupCode) ?? new Map();
      teamSet.set(home.fifaCode, home.groupPosition);
      teamSet.set(away.fifaCode, away.groupPosition);
      teamsPerGroup.set(groupCode, teamSet);

      const exactKey = `${groupCode}:${home.fifaCode}:${away.fifaCode}`;
      if (exactPairsByGroup.has(exactKey)) {
        errors.push(
          `row ${row.__rowNumber}: duplicate local/visitor pairing ${home.fifaCode} vs ${away.fifaCode} in group ${groupCode}.`,
        );
      } else {
        exactPairsByGroup.add(exactKey);
      }

      const normalizedPair = [home.fifaCode, away.fifaCode].sort().join(":");
      const normalizedKey = `${groupCode}:${normalizedPair}`;
      if (normalizedPairsByGroup.has(normalizedKey)) {
        errors.push(
          `row ${row.__rowNumber}: duplicate team pairing ${home.fifaCode}/${away.fifaCode} in group ${groupCode}.`,
        );
      } else {
        normalizedPairsByGroup.add(normalizedKey);
      }
    }

    normalizedRows.push({
      matchNumber,
      stage,
      roundName,
      groupCode,
      startsAt,
      predictionClosesAt: closesAt,
      venue,
      city,
      status,
      home,
      away,
      rowNumber: row.__rowNumber,
    });
  }

  for (const [groupCode, matchCount] of matchesPerGroup.entries()) {
    if (matchCount > 6) {
      errors.push(`group ${groupCode}: group stage cannot have more than 6 matches.`);
    }

    if (matchCount < 6) {
      errors.push(`group ${groupCode}: group stage must have 6 matches in the import file.`);
    }
  }

  for (const [groupCode, teamSet] of teamsPerGroup.entries()) {
    if (teamSet.size > 4) {
      errors.push(`group ${groupCode}: group stage cannot have more than 4 teams.`);
    }

    if (teamSet.size < 4) {
      errors.push(`group ${groupCode}: group stage must have exactly 4 teams in the import file.`);
    }
  }

  return { errors, normalizedRows };
}

function buildTeamPayloads(rows) {
  const teamMap = new Map();

  for (const row of rows) {
    for (const team of [row.home, row.away]) {
      teamMap.set(team.fifaCode, {
        name: team.name,
        short_name: team.shortName,
        code: team.fifaCode,
        fifa_code: team.fifaCode,
        country_code: team.countryCode,
        flag_emoji: team.flagEmoji,
        group_code: row.groupCode,
        group_position: team.groupPosition,
      });
    }
  }

  return [...teamMap.values()];
}

async function fetchExistingMaps(supabase, teamPayloads, rows) {
  const fifaCodes = teamPayloads.map((team) => team.fifa_code);
  const matchNumbers = rows.map((row) => row.matchNumber);

  const [{ data: existingTeams, error: teamsError }, { data: existingMatches, error: matchesError }] =
    await Promise.all([
      supabase.from("teams").select("id, fifa_code").in("fifa_code", fifaCodes),
      supabase.from("matches").select("id, match_number").in("match_number", matchNumbers),
    ]);

  if (teamsError) {
    throw teamsError;
  }

  if (matchesError) {
    throw matchesError;
  }

  return {
    existingTeamMap: new Map((existingTeams ?? []).map((team) => [team.fifa_code, team.id])),
    existingMatchNumbers: new Set((existingMatches ?? []).map((match) => match.match_number)),
  };
}

async function upsertTeams(supabase, teamPayloads) {
  const { error } = await supabase.from("teams").upsert(teamPayloads, {
    onConflict: "fifa_code",
  });

  if (error) {
    throw error;
  }

  const { data: teams, error: readError } = await supabase
    .from("teams")
    .select("id, fifa_code")
    .in(
      "fifa_code",
      teamPayloads.map((team) => team.fifa_code),
    );

  if (readError) {
    throw readError;
  }

  return new Map((teams ?? []).map((team) => [team.fifa_code, team.id]));
}

async function upsertMatches(supabase, rows, teamIdMap) {
  const matchPayloads = rows.map((row) => ({
    match_number: row.matchNumber,
    phase: row.roundName,
    round_name: row.roundName,
    stage: row.stage,
    group_name: row.groupCode,
    group_code: row.groupCode,
    home_team_id: teamIdMap.get(row.home.fifaCode),
    away_team_id: teamIdMap.get(row.away.fifaCode),
    starts_at: row.startsAt,
    prediction_closes_at: row.predictionClosesAt,
    venue: row.venue,
    city: row.city,
    status: row.status,
  }));

  const missingTeamId = matchPayloads.find(
    (match) => !match.home_team_id || !match.away_team_id,
  );

  if (missingTeamId) {
    throw new Error("Could not resolve team IDs for every match row.");
  }

  const { error } = await supabase.from("matches").upsert(matchPayloads, {
    onConflict: "match_number",
  });

  if (error) {
    throw error;
  }
}

function printSummary({
  filePath,
  apply,
  teamPayloads,
  rows,
  existingTeamMap,
  existingMatchNumbers,
}) {
  const createdTeams = teamPayloads.filter((team) => !existingTeamMap.has(team.fifa_code)).length;
  const updatedTeams = teamPayloads.length - createdTeams;
  const createdMatches = rows.filter((row) => !existingMatchNumbers.has(row.matchNumber)).length;
  const updatedMatches = rows.length - createdMatches;

  console.log("");
  console.log(apply ? "Fixture import applied." : "Fixture import dry-run succeeded.");
  console.log(`CSV: ${filePath}`);
  console.log(`Teams: ${teamPayloads.length} total | ${createdTeams} to create | ${updatedTeams} to update`);
  console.log(`Matches: ${rows.length} total | ${createdMatches} to create | ${updatedMatches} to update`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    throw new Error("Usage: node scripts/fixture/import-fixture.mjs --file <csv-path> [--apply --confirm-write]");
  }

  if (args.apply && !args.confirmWrite) {
    throw new Error("Writing requires both --apply and --confirm-write.");
  }

  const filePath = path.resolve(process.cwd(), args.file);

  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const csvRows = parseCsvFile(filePath);

  if (csvRows.length === 0) {
    if (args.apply) {
      throw new Error("CSV does not contain data rows. Refusing to write an empty fixture import.");
    }

    console.log("");
    console.log("Fixture import dry-run succeeded.");
    console.log(`CSV: ${filePath}`);
    console.log("No data rows were found. The template is structurally valid and no writes were made.");
    return;
  }

  const { errors, normalizedRows } = validateRows(csvRows);

  if (errors.length > 0) {
    console.error("Fixture validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const teamPayloads = buildTeamPayloads(normalizedRows);
  const supabase = buildSupabaseClient();
  const { existingTeamMap, existingMatchNumbers } = await fetchExistingMaps(
    supabase,
    teamPayloads,
    normalizedRows,
  );

  printSummary({
    filePath,
    apply: args.apply,
    teamPayloads,
    rows: normalizedRows,
    existingTeamMap,
    existingMatchNumbers,
  });

  if (!args.apply) {
    console.log("No writes were made. Re-run with --apply --confirm-write to upsert teams and matches.");
    return;
  }

  const teamIdMap = await upsertTeams(supabase, teamPayloads);
  await upsertMatches(supabase, normalizedRows, teamIdMap);
  console.log("Teams and matches were upserted successfully.");
}

main().catch((error) => {
  console.error(error.message ?? String(error));
  process.exitCode = 1;
});
