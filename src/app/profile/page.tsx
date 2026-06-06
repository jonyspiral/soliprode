import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileEditorPanels } from "@/app/profile/_components/profile-editor-panels";
import { StartCheckoutButton } from "@/components/payments/start-checkout-trigger";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { SurfaceCard } from "@/components/surface-card";
import { getGroupCompetitionSnapshot } from "@/lib/groups/competition";
import {
  getAccountDisplayName,
  getPassStatus,
  getParticipationStatus,
  getPlayerAvatar,
  getPlayerDisplayName,
} from "@/lib/player/identity";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type ProfileRow = {
  email: string | null;
  full_name: string | null;
  public_alias: string | null;
  whatsapp: string | null;
};

type RankingRow = {
  points: number;
  position: number | null;
};

type UserMetadata = {
  avatar_url?: string | null;
  full_name?: string | null;
  name?: string | null;
  picture?: string | null;
  preferred_username?: string | null;
  user_name?: string | null;
};

function buildPrimaryAction(input: {
  isCaptain: boolean;
  isPaid: boolean;
  teamName: string | null;
}) {
  if (!input.isPaid) {
    return {
      kind: "checkout" as const,
      helper: "Tu Pase Solidario está pendiente.",
      label: "Confirmar Pase Solidario",
    };
  }

  if (!input.teamName) {
    return {
      kind: "link" as const,
      helper: "Todavía no tenés Team.",
      href: "/groups",
      label: "Crear o unirme a un Team",
    };
  }

  if (input.isCaptain) {
    return {
      kind: "link" as const,
      helper: "Sos Capitán de tu Team actual.",
      href: "/groups",
      label: "Administrar Team",
    };
  }

  return {
    kind: "link" as const,
    helper: `Ya estás jugando en ${input.teamName}.`,
    href: "/groups",
    label: "Ver mi Team",
  };
}

function StatRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="profile-stat-row">
      <p className="profile-stat-label">{label}</p>
      <p className="profile-stat-value">{value}</p>
      {detail ? <p className="profile-stat-detail">{detail}</p> : null}
    </div>
  );
}

export default async function ProfilePage() {
  let hasAuthenticatedUser = false;
  let fallbackMessage =
    "No pudimos revisar tu perfil ahora. Reintentá en unos minutos o volvé a entrar.";
  let userEmail: string | null = null;
  let userMetadata: UserMetadata | null = null;
  let profile: ProfileRow | null = null;
  let participationStatus = "pending";
  let ranking: RankingRow | null = null;
  let currentTeam:
    | {
        activeCount: number;
        dtProfileId: string | null;
        name: string;
        ownerProfileId: string | null;
      }
    | null = null;
  let currentUserId: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    if (!user) {
      redirect("/login?next=/profile&error=session_required");
    }

    hasAuthenticatedUser = true;
    currentUserId = user.id;
    userEmail = user.email ?? null;
    userMetadata = (user.user_metadata as UserMetadata | null) ?? null;

    const [profileResult, participationResult, rankingResult, groupSnapshot] = await withSupabaseTimeout(
      Promise.all([
        supabase
          .from("profiles")
          .select("full_name, public_alias, whatsapp, email")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("participations")
          .select("payment_status, created_at")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("rankings_cache")
          .select("points, position")
          .eq("ranking_type", "general")
          .is("scope_id", null)
          .eq("profile_id", user.id)
          .maybeSingle(),
        getGroupCompetitionSnapshot(user.id),
      ]),
      "Supabase profile query timed out",
    );

    profile = (profileResult.data as ProfileRow | null) ?? null;
    participationStatus =
      pickPrimaryParticipation(
        (participationResult.data ?? []) as Array<{ created_at: string; payment_status: string }>,
      ).participation?.payment_status ?? "pending";
    ranking = (rankingResult.data as RankingRow | null) ?? null;
    currentTeam = groupSnapshot.currentGroup
      ? {
          name: groupSnapshot.currentGroup.name,
          ownerProfileId: groupSnapshot.currentGroup.ownerProfileId,
          dtProfileId: groupSnapshot.currentGroup.dtProfileId,
          activeCount: groupSnapshot.currentGroup.activeCount,
        }
      : null;
  } catch {
    if (hasAuthenticatedUser) {
      fallbackMessage =
        "Tu sesión está abierta, pero no pudimos leer tu perfil completo. Reintentá en unos minutos.";
    }
  }

  if (!hasAuthenticatedUser) {
    return (
      <PageStack>
        <SurfaceCard title="Estado temporal" description="Podés volver a intentar en unos minutos.">
          <InfoNotice tone="error" message={fallbackMessage} />
        </SurfaceCard>
      </PageStack>
    );
  }

  const publicLabel = getPlayerDisplayName(profile ?? null, { user_metadata: userMetadata });
  const accountName = getAccountDisplayName(profile ?? null, { user_metadata: userMetadata });
  const avatarUrl = getPlayerAvatar(profile ?? null, { user_metadata: userMetadata });
  const statusLabel = getParticipationStatus(participationStatus);
  const passLabel = getPassStatus(participationStatus);
  const teamLabel = currentTeam?.name ?? "Todavía sin Team";
  const isPaid = participationStatus === "paid";
  const passChipLabel = isPaid ? "Pase Solidario confirmado" : "Pase pendiente";
  const isCaptain = Boolean(currentUserId && currentTeam?.ownerProfileId === currentUserId);
  const isDt = Boolean(currentUserId && currentTeam?.dtProfileId === currentUserId);
  const primaryAction = buildPrimaryAction({
    isCaptain,
    isPaid,
    teamName: currentTeam?.name ?? null,
  });

  return (
    <PageStack>
      <section className="profile-hero">
        <div className="profile-hero-head">
          <div className="profile-hero-copy">
            <p className="profile-kicker">Perfil</p>
            <h1 className="profile-hero-title">{publicLabel}</h1>
            <div className="profile-chip-row">
              <span className="profile-chip profile-chip-soft">
                {statusLabel}
              </span>
              <span className="profile-chip profile-chip-gold">
                {passChipLabel}
              </span>
              <span className="profile-chip profile-chip-soft">
                {teamLabel}
              </span>
              {isCaptain ? (
                <span className="profile-chip profile-chip-soft">
                  Capitán
                </span>
              ) : null}
              {isDt ? (
                <span className="profile-chip profile-chip-soft">
                  DT
                </span>
              ) : null}
            </div>
            <p className="profile-hero-helper">{primaryAction.helper}</p>
          </div>

          <PlayerAvatar imageUrl={avatarUrl} label={publicLabel} size="lg" />
        </div>

        <div className="profile-hero-actions">
          {primaryAction.kind === "checkout" ? (
            <StartCheckoutButton className="profile-primary-cta">
              {primaryAction.label}
            </StartCheckoutButton>
          ) : (
            <Link
              href={primaryAction.href}
              className="profile-primary-cta"
            >
              {primaryAction.label}
            </Link>
          )}
        </div>
      </section>

      <SurfaceCard
        title="Mi participación"
        description="Tu lectura competitiva del torneo vive acá. Primero juego; después datos de cuenta."
      >
        <div className="profile-stat-grid">
          <StatRow
            label="Estado"
            value={statusLabel}
            detail={isPaid ? "Ya estás dentro del torneo." : "Todavía no entrás a competir por premios."}
          />
          <StatRow
            label="Pase Solidario"
            value={passLabel}
            detail={
              isPaid
                ? "Tu Pase Solidario está confirmado."
                : "Completalo para que tus pronósticos entren a competir."
            }
          />
          <StatRow
            label="Team"
            value={teamLabel}
            detail={
              currentTeam
                ? `${currentTeam.activeCount} jugador${currentTeam.activeCount === 1 ? "" : "es"} activo${
                    currentTeam.activeCount === 1 ? "" : "s"
                  } en el Plantel.`
                : "Creá o unite por código para empezar a competir en Team."
            }
          />
          <StatRow
            label="Puntos y ranking"
            value={ranking ? `${ranking.points} pts${ranking.position ? ` · #${ranking.position}` : ""}` : "Todavía sin posición"}
            detail={
              ranking
                ? ranking.position
                  ? "Tu foto actual del ranking general."
                  : "Ya tenés puntos, pero todavía no hay puesto oficial."
                : "Cuando haya scoring oficial, tu posición aparece acá."
            }
          />
        </div>
      </SurfaceCard>

      <ProfileEditorPanels
        avatarUrl={avatarUrl}
        email={profile?.email ?? userEmail}
        fullName={accountName}
        hasAvatarImage={Boolean(avatarUrl)}
        publicLabel={publicLabel}
        publicNickname={publicLabel}
        whatsapp={profile?.whatsapp ?? null}
      />
    </PageStack>
  );
}
