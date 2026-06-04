import Link from "next/link";
import {
  InfoNotice,
  PageStack,
  PodiumCard,
  RankedRow,
  StatCard,
} from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type RankingRow = {
  profile_id: string;
  ranking_type: string;
  scope_id: string | null;
  points: number;
  position: number | null;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  public_alias: string;
};

type RankingProfileMap = Record<string, string>;

function formatPoints(points: number) {
  return `${points.toLocaleString("es-AR")} pts`;
}

function pickPrimaryRankingType(rows: RankingRow[]) {
  const rowsWithPosition = rows.filter((row) => row.position !== null);

  if (rowsWithPosition.length === 0) {
    return null;
  }

  const scoreByType = new Map<string, { count: number; bestPosition: number }>();

  for (const row of rowsWithPosition) {
    const current = scoreByType.get(row.ranking_type);
    const position = row.position ?? Number.MAX_SAFE_INTEGER;

    if (!current) {
      scoreByType.set(row.ranking_type, { count: 1, bestPosition: position });
      continue;
    }

    scoreByType.set(row.ranking_type, {
      count: current.count + 1,
      bestPosition: Math.min(current.bestPosition, position),
    });
  }

  return [...scoreByType.entries()].sort((a, b) => {
    if (b[1].count !== a[1].count) {
      return b[1].count - a[1].count;
    }

    return a[1].bestPosition - b[1].bestPosition;
  })[0]?.[0] ?? null;
}

export default async function RankingsPage() {
  const supabase = await createServerSupabaseClient();

  let currentUserId: string | null = null;
  let currentAlias: string | null = null;
  let participationStatus = "pending";
  let userRanking: RankingRow | null = null;
  let topRows: RankingRow[] = [];
  let rankingAliases: RankingProfileMap = {};
  let notice: string | null = null;

  try {
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    currentUserId = user?.id ?? null;

    const profileQuery = currentUserId
      ? supabase
          .from("profiles")
          .select("id, public_alias")
          .eq("id", currentUserId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const participationQuery = currentUserId
      ? supabase
          .from("participations")
          .select("payment_status, created_at")
          .eq("profile_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(2)
      : Promise.resolve({ data: null, error: null });

    const rankingQuery = supabase
      .from("rankings_cache")
      .select("profile_id, ranking_type, scope_id, points, position, updated_at")
      .is("scope_id", null)
      .order("ranking_type", { ascending: true })
      .order("position", { ascending: true, nullsFirst: false })
      .limit(60);

    const [{ data: profile }, { data: participationRows }, { data: rawRankings }] =
      await withSupabaseTimeout(
        Promise.all([profileQuery, participationQuery, rankingQuery]),
        "Supabase rankings query timed out",
      );

    currentAlias = (profile as ProfileRow | null)?.public_alias ?? null;
    participationStatus =
      pickPrimaryParticipation(
        (participationRows ?? []) as Array<{ created_at: string; payment_status: string }>,
      ).participation?.payment_status ?? "pending";

    const rankings = (rawRankings ?? []) as RankingRow[];
    const primaryRankingType = pickPrimaryRankingType(rankings);

    if (primaryRankingType) {
      topRows = rankings
        .filter((row) => row.ranking_type === primaryRankingType && row.position !== null)
        .sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999))
        .slice(0, 10);

      if (currentUserId) {
        userRanking =
          rankings.find(
            (row) => row.profile_id === currentUserId && row.ranking_type === primaryRankingType,
          ) ?? null;
      }
    }

    if (rankings.length === 0) {
      notice =
        "Todavía no hay ranking calculado. Cuando se carguen resultados y puntos, la tabla oficial va a aparecer acá.";
    }

    const aliasIds = [...new Set(topRows.map((row) => row.profile_id))];

    if (aliasIds.length > 0) {
      const service = createServiceRoleSupabaseClient();
      const { data: aliasRows } = await service
        .from("profiles")
        .select("id, public_alias")
        .in("id", aliasIds);

      rankingAliases = Object.fromEntries(
        ((aliasRows ?? []) as ProfileRow[]).map((row) => [row.id, row.public_alias]),
      );
    }
  } catch {
    notice =
      "No pudimos cargar el ranking oficial en este momento. Reintentá en unos minutos.";
  }

  const participationActive = participationStatus === "paid";
  const leaderboardUnlocked = participationActive;
  const podium = topRows.slice(0, 3);
  const tableRows = topRows.slice(0, 10);
  const updatedLabel =
    topRows[0]?.updated_at
      ? `Actualizado ${new Date(topRows[0].updated_at).toLocaleDateString("es-AR")}`
      : "Ranking oficial";

  return (
    <PageStack>
      <section className="rounded-lg bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] p-4 text-white">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-[2.2rem] font-bold uppercase tracking-[-0.03em]">
              Rankings
            </h1>
            <p className="mt-1 text-sm leading-6 text-[#dfe6ff]">
              {leaderboardUnlocked
                ? `${updatedLabel} • Competís por la tabla oficial`
                : "La tabla oficial se desbloquea cuando activás tu participación"}
            </p>
          </div>
          <div className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
            {leaderboardUnlocked ? "Oficial" : "Bloqueado"}
          </div>
        </div>
      </section>

      {notice ? <InfoNotice message={notice} tone="info" /> : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tu puesto"
          value={leaderboardUnlocked && userRanking?.position ? `#${userRanking.position}` : "--"}
          detail={
            leaderboardUnlocked
              ? "Tu lugar actual en el ranking oficial."
              : "Aparece cuando tu inscripción pasa a competir."
          }
        />
        <StatCard
          label="Tus puntos"
          value={leaderboardUnlocked && userRanking ? String(userRanking.points) : "--"}
          detail={
            leaderboardUnlocked
              ? "Se actualizan cuando haya resultados y scoring cargado."
              : "Tus pronósticos guardados todavía no compiten por puntos."
          }
        />
        <StatCard
          label="Estado"
          value={participationActive ? "Compitiendo" : "Sin activar"}
          detail={
            participationActive
              ? "Ya entrás en el ranking oficial."
              : "Activá tu inscripción para aparecer en la tabla oficial."
          }
        />
      </section>

      {!leaderboardUnlocked ? (
        <SurfaceCard
          tone="accent"
          title="Activá tu participación"
          description="El ranking oficial existe, pero solo cuenta a quienes ya activaron su inscripción."
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Podés seguir cargando pronósticos. Cuando actives tu inscripción, los próximos puntos
              entran al ranking oficial y a la pelea por premios.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
              >
                Activar participación
              </Link>
              <Link
                href="/matches"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
              >
                Seguir cargando pronósticos
              </Link>
            </div>
          </div>
        </SurfaceCard>
      ) : podium.length > 0 ? (
        <section className="mt-2 flex items-end justify-center gap-3">
          {podium[1] ? (
            <div className="w-24">
              <PodiumCard position="2" name="Jugador 2" points={formatPoints(podium[1].points)} />
            </div>
          ) : null}
          {podium[0] ? (
            <div className="w-28 -mt-6">
              <PodiumCard
                position="1"
                name={
                  currentUserId && podium[0].profile_id === currentUserId
                    ? currentAlias ?? "Vos"
                    : rankingAliases[podium[0].profile_id] ?? "Jugador 1"
                }
                points={formatPoints(podium[0].points)}
                emphasis="first"
              />
            </div>
          ) : null}
          {podium[2] ? (
            <div className="w-24">
              <PodiumCard position="3" name="Jugador 3" points={formatPoints(podium[2].points)} />
            </div>
          ) : null}
        </section>
      ) : null}

      <SurfaceCard
        title="Tabla general"
        description={
          leaderboardUnlocked
            ? "La lectura oficial del torneo vive acá. Los jugadores pendientes quedan afuera hasta activar su inscripción."
            : "Esta tabla se completa cuando tu participación queda activa."
        }
      >
        {leaderboardUnlocked && tableRows.length > 0 ? (
          <div className="grid gap-3">
            {tableRows.map((row) => {
              const isCurrentUser = currentUserId === row.profile_id;

              return (
                <RankedRow
                  key={`${row.ranking_type}-${row.profile_id}-${row.position ?? "na"}`}
                  name={
                    isCurrentUser
                      ? currentAlias ?? "Vos"
                      : rankingAliases[row.profile_id] ?? `Jugador ${row.position ?? "-"}`
                  }
                  meta={`Posición ${row.position ?? "-"}`}
                  points={formatPoints(row.points)}
                  highlight={isCurrentUser}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Todavía no hay posiciones oficiales para mostrar. Cuando entren resultados y scoring,
            esta tabla va a reflejar el torneo real.
          </p>
        )}
      </SurfaceCard>

      <section className="grid gap-4 sm:grid-cols-2">
        <SurfaceCard
          title="Tu Team"
          description="Teams es tu superficie corta: ahí se define tu Team principal, el Capitán, el DT y el teamScore."
        >
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Si ya activaste tu inscripción, podés entrar con código, armar tu Team y seguir el puntaje del Team con tus 11 mejores activos.
          </p>
          <Link
            href="/groups"
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
          >
            Ir a Teams
          </Link>
        </SurfaceCard>

        <SurfaceCard
          title="Premios y corte"
          description="La tabla general y la tabla de Teams usan la misma base: solo cuentan Jugadores activos con Aporte confirmado."
        >
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Los Teams con menos de 11 Jugadores activos siguen en formación. Recién con 11 o más entran en competencia oficial.
          </p>
        </SurfaceCard>
      </section>
    </PageStack>
  );
}
