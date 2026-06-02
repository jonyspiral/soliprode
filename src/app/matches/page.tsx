import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { PredictionBoard, type MatchBoardItem } from "@/components/matches/prediction-board";
import { InfoNotice, PageStack, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type MatchRow = {
  id: string;
  phase: string;
  group_name: string | null;
  starts_at: string;
  status: string;
  score_home: number | null;
  score_away: number | null;
  home_team: {
    id: string;
    name: string;
    code: string;
    flag_url: string | null;
  }[] | null;
  away_team: {
    id: string;
    name: string;
    code: string;
    flag_url: string | null;
  }[] | null;
};

type PredictionRow = {
  id: string;
  match_id: string;
  predicted_home: number;
  predicted_away: number;
  locked_at: string | null;
  points: number;
};

function isFuture(startsAt: string) {
  return new Date(startsAt).getTime() > Date.now();
}

function formatStartsAt(startsAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

function formatCountdown(startsAt: string) {
  const diffMs = new Date(startsAt).getTime() - Date.now();

  if (diffMs <= 0) {
    return "Cerrado";
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `Cierra en ${minutes}m`;
  }

  return `Cierra en ${hours}h ${minutes}m`;
}

export default async function MatchesPage() {
  let matches: MatchBoardItem[] = [];
  let liveMatches: MatchBoardItem[] = [];
  let recentMatches: MatchBoardItem[] = [];
  let predictions: PredictionRow[] = [];
  let currentUserId: string | null = null;
  let participationActive = false;
  let dataNotice: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    currentUserId = user?.id ?? null;

    const matchQuery = supabase
      .from("matches")
      .select(
        `
          id,
          phase,
          group_name,
          starts_at,
          status,
          score_home,
          score_away,
          home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url),
          away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url)
        `,
      )
      .order("starts_at", { ascending: true });

    const participationQuery = currentUserId
      ? supabase
          .from("participations")
          .select("payment_status")
          .eq("profile_id", currentUserId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const predictionQuery = currentUserId
      ? supabase
          .from("predictions")
          .select("id, match_id, predicted_home, predicted_away, locked_at, points")
          .eq("profile_id", currentUserId)
      : Promise.resolve({ data: [], error: null });

    const [{ data: matchRows }, { data: participation }, { data: predictionRows }] =
      await withSupabaseTimeout(
        Promise.all([matchQuery, participationQuery, predictionQuery]),
        "Supabase matches query timed out",
      );

    const normalizedMatches: MatchBoardItem[] = ((matchRows ?? []) as MatchRow[])
      .map((match) => {
        const homeTeam = match.home_team?.[0] ?? null;
        const awayTeam = match.away_team?.[0] ?? null;

        if (!homeTeam || !awayTeam) {
          return null;
        }

        return {
          id: match.id,
          phase: match.phase,
          group_name: match.group_name,
          starts_at: match.starts_at,
          status: match.status,
          score_home: match.score_home,
          score_away: match.score_away,
          home_team: homeTeam,
          away_team: awayTeam,
        };
      })
      .filter((match): match is MatchBoardItem => Boolean(match));

    matches = normalizedMatches.filter(
      (match) => match.status === "scheduled" && isFuture(match.starts_at),
    );
    liveMatches = normalizedMatches.filter((match) => match.status === "live");
    recentMatches = normalizedMatches
      .filter((match) => match.status === "finished")
      .sort(
        (a, b) =>
          new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
      )
      .slice(0, 3);

    predictions = (predictionRows ?? []) as PredictionRow[];
    participationActive = participation?.payment_status === "paid";

    if (normalizedMatches.length === 0) {
      dataNotice = "Todavía no hay fixture cargado. Cuando esté listo, vas a poder empezar a pronosticar desde acá.";
    }
  } catch {
    dataNotice =
      "No pudimos cargar el fixture en este momento. Reintentá en unos minutos.";
  }

  const featuredMatch = matches[0] ?? null;
  const closesTodayCount = matches.filter((match) => {
    const startsAt = new Date(match.starts_at);
    const now = new Date();

    return (
      startsAt.getDate() === now.getDate() &&
      startsAt.getMonth() === now.getMonth() &&
      startsAt.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <PageStack>
      <section className="rounded-lg bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] p-4 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2.2rem] font-bold uppercase leading-[0.94] tracking-[-0.03em]">
              Cargá tus
              <br />
              pronósticos
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#dfe6ff]">
              {featuredMatch
                ? `${featuredMatch.phase}${featuredMatch.group_name ? ` • Grupo ${featuredMatch.group_name}` : ""} · ${formatCountdown(featuredMatch.starts_at)}`
                : "El fixture va a aparecer acá apenas esté disponible."}
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
            {participationActive ? "Participación activa" : "Modo borrador"}
          </div>
        </div>
      </section>

      {dataNotice ? <InfoNotice message={dataNotice} tone="info" /> : null}

      {currentUserId ? (
        participationActive ? (
          <InfoNotice
            message="Tus pronósticos ya compiten por premios mientras los guardes antes del inicio de cada partido."
            tone="info"
          />
        ) : (
          <InfoNotice
            message="Podés cargar tus pronósticos gratis. Quedan guardados como borrador. Para que participen por premios, pagá tu participación."
            tone="info"
          />
        )
      ) : (
        <InfoNotice
          message="Podés mirar el fixture ahora. Para guardar borradores y competir después, creá tu cuenta."
          tone="info"
        />
      )}

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Abiertos" value={String(matches.length)} detail="Partidos futuros" />
        <StatCard label="En vivo" value={String(liveMatches.length)} detail="Siguiéndolos ahora" />
        <StatCard label="Cierran hoy" value={String(closesTodayCount)} detail="Pronosticá a tiempo" />
      </section>

      {featuredMatch ? (
        <SurfaceCard title="Próximo cierre" description="El partido que más te apura a definir ahora.">
          <div className="overflow-hidden rounded-lg border-[1.5px] border-[var(--color-primary)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between bg-[var(--color-primary)] px-4 py-2 text-white">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em]">
                {featuredMatch.phase}
                {featuredMatch.group_name ? ` • Grupo ${featuredMatch.group_name}` : ""}
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[12px] font-semibold">
                {formatCountdown(featuredMatch.starts_at)}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
              <div className="text-center">
                <CountryFlag
                  country={featuredMatch.home_team.name}
                  label={featuredMatch.home_team.name}
                  size="sm"
                  className="mx-auto mb-2"
                />
                <p className="font-serif text-[1.9rem] font-bold uppercase leading-none">
                  {featuredMatch.home_team.code}
                </p>
              </div>
              <div className="rounded-md border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 font-serif text-[1.6rem] font-bold text-[var(--color-muted)]">
                VS
              </div>
              <div className="text-center">
                <CountryFlag
                  country={featuredMatch.away_team.name}
                  label={featuredMatch.away_team.name}
                  size="sm"
                  className="mx-auto mb-2"
                />
                <p className="font-serif text-[1.9rem] font-bold uppercase leading-none">
                  {featuredMatch.away_team.code}
                </p>
              </div>
            </div>
            <div className="border-t border-[var(--color-line)] px-4 py-3 text-sm text-[var(--color-muted)]">
              Empieza {formatStartsAt(featuredMatch.starts_at)}.
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      {matches.length > 0 ? (
        <SurfaceCard
          title="Tus pronósticos"
          description={
            participationActive
              ? "Guardalos antes del inicio. Si el partido no empezó, entran a competir."
              : "Guardalos ahora como borrador. Después activás tu participación para competir."
          }
        >
          <PredictionBoard
            matches={matches.slice(0, 6)}
            initialPredictions={predictions}
            currentUserId={currentUserId}
            isAuthenticated={Boolean(currentUserId)}
            participationActive={participationActive}
          />
        </SurfaceCard>
      ) : null}

      {liveMatches.length > 0 ? (
        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-[1.6rem] font-bold uppercase text-[var(--color-ink)]">
                En vivo
              </h3>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-error)] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-error)]" />
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            {liveMatches.map((match) => (
              <div
                key={match.id}
                className="relative flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-[var(--color-error)]" />
                <div className="flex flex-col gap-1 pl-2">
                  <span className="text-[14px] font-semibold uppercase">
                    {match.home_team?.name ?? "Local"}
                  </span>
                  <span className="text-[14px] uppercase text-[var(--color-muted)]">
                    {match.away_team?.name ?? "Visitante"}
                  </span>
                </div>
                <span className="rounded-full bg-[#ffdad6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#93000a]">
                  Live
                </span>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-serif text-[1.6rem] font-bold text-[var(--color-primary)]">
                    {match.score_home ?? 0}
                  </span>
                  <span className="font-serif text-[1.6rem] font-bold text-[var(--color-muted)]">
                    {match.score_away ?? 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {recentMatches.length > 0 ? (
        <SurfaceCard
          title="Resultados cargados"
          description="Sirven para empezar a probar el circuito de scoring cuando esa capa quede conectada."
        >
          <div className="grid gap-4">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3"
              >
                <div>
                  <p className="font-semibold uppercase text-[var(--color-ink)]">
                    {match.home_team?.code ?? "LOC"} vs {match.away_team?.code ?? "VIS"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {match.phase}
                    {match.group_name ? ` • Grupo ${match.group_name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-[1.8rem] font-bold text-[var(--color-primary)]">
                    {match.score_home ?? 0} - {match.score_away ?? 0}
                  </p>
                  <p className="text-xs uppercase text-[var(--color-muted)]">
                    Finalizado
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {!featuredMatch && !dataNotice ? (
        <SurfaceCard
          title="Fixture en preparación"
          description="El catálogo de partidos ya está listo para conectarse. Falta cargar los cruces reales."
        >
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Cuando el admin publique el fixture, esta pantalla va a pasar de maqueta a juego real:
            partidos futuros, borradores, lock por horario y resultados.
          </p>
        </SurfaceCard>
      ) : null}

      <div className="text-center text-sm text-[var(--color-muted)]">
        {currentUserId ? (
          participationActive ? (
            "Tus pronósticos ya están listos para competir por premios."
          ) : (
            <>
              Tus picks quedan guardados como borrador.{" "}
              <Link href="/dashboard" className="font-semibold text-[var(--color-primary)]">
                Pagá con Mercado Pago
              </Link>
              {" "}cuando quieras que empiecen a competir por premios.
            </>
          )
        ) : (
          <>
            Mirá el fixture y después{" "}
            <Link href="/register" className="font-semibold text-[var(--color-primary)]">
              creá tu cuenta
            </Link>
            {" "}para empezar a guardar pronósticos.
          </>
        )}
      </div>
    </PageStack>
  );
}
