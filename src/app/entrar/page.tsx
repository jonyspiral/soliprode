import { redirect } from "next/navigation";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { buildEnterHref } from "@/lib/invite-flow";
import { resolveGroupInvite, resolvePromoterInvite } from "@/lib/invite-flow-server";
import { GAME_NICKNAME_MIN_LENGTH } from "@/lib/player/identity";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type EnterPageProps = {
  searchParams?: Promise<{
    p?: string;
    promoter?: string;
    group?: string;
    groupCode?: string;
    code?: string;
    setup_error?: string;
  }>;
};

function readGroupInviteFromParams(params: Awaited<EnterPageProps["searchParams"]>) {
  return params?.group ?? params?.groupCode ?? params?.code ?? null;
}

function resolveSetupErrorMessage(errorCode: string | undefined) {
  switch (errorCode) {
    case "invalid_nickname":
      return `El nick tiene que tener al menos ${GAME_NICKNAME_MIN_LENGTH} caracteres.`;
    case "nickname_unavailable":
      return "Ese nick ya existe. Elegí otro para seguir.";
    case "invalid_promoter":
    case "invalid_manual_promoter":
      return "No encontramos ese Promoter. Revisá el código e intentá de nuevo.";
    case "invalid_group":
      return "No encontramos ese Team de invitación.";
    case "participation_missing":
      return "No pudimos preparar tu participación todavía. Reintentá en unos minutos.";
    case "setup_persist_failed":
    case "bootstrap_failed":
      return "No pudimos guardar tu setup ahora. Intentá de nuevo en unos minutos.";
    default:
      return null;
  }
}

export default async function EnterPage({ searchParams }: EnterPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const promoterCode = params?.p ?? params?.promoter ?? null;
  const groupInviteCode = readGroupInviteFromParams(params);
  const nextPath = buildEnterHref({ promoterCode, groupInviteCode });
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const bootstrapResult = await ensureRegisteredUserRecords(user);

  if (!bootstrapResult.ok) {
    redirect(
      `${nextPath}${nextPath.includes("?") ? "&" : "?"}setup_error=${encodeURIComponent("bootstrap_failed")}`,
    );
  }

  const [{ data: profile }, { data: participationRows }, resolvedPromoter, resolvedGroupInvite] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, public_alias, full_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("participations")
        .select("id, promoter_id, group_id, payment_status, created_at")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      resolvePromoterInvite(promoterCode),
      resolveGroupInvite(groupInviteCode),
    ]);

  const participation = pickPrimaryParticipation(
    (participationRows ?? []) as Array<{
      id: string;
      promoter_id: string | null;
      group_id: string | null;
      payment_status: string;
      created_at: string;
    }>,
  ).participation;

  if (!participation) {
    redirect(
      `${nextPath}${nextPath.includes("?") ? "&" : "?"}setup_error=${encodeURIComponent("participation_missing")}`,
    );
  }

  const currentAlias = profile?.public_alias?.trim() ?? "";
  const hasDirectPromoter = Boolean(resolvedPromoter);
  const hasGroupInvite = Boolean(resolvedGroupInvite);
  const isPaid = participation?.payment_status === "paid";

  if (!hasDirectPromoter && !hasGroupInvite && currentAlias && !params?.setup_error) {
    redirect(isPaid ? "/dashboard" : "/activar-pase");
  }

  return (
    <PageStack>
      <section className="mx-auto w-full max-w-[32rem]">
        <SurfaceCard
          title="Invitación detectada"
          description="Terminá este paso corto y seguí directo a activar tu Pase."
        >
          <div className="grid gap-5">
            {resolveSetupErrorMessage(params?.setup_error) ? (
              <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
                {resolveSetupErrorMessage(params?.setup_error)}
              </p>
            ) : null}

            <div className="grid gap-1">
              <h1 className="font-serif text-[2rem] font-bold leading-none text-[var(--color-primary)]">
                {hasGroupInvite ? "Te invitaron a sumarte a un Team" : "Te invitaron a jugar SoliProde"}
              </h1>
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                Jugá el Prode Mundial, cargá tus pronósticos, competí por premios y ayudá a financiar una tesis universitaria.
              </p>
            </div>

            <form
              action="/api/onboarding/complete-invite"
              method="post"
              className="grid gap-4"
            >
              <input type="hidden" name="promoter_code" value={resolvedPromoter?.code ?? ""} />
              <input type="hidden" name="group_invite_code" value={resolvedGroupInvite?.code ?? ""} />

              <div className="grid gap-2">
                <label
                  htmlFor="game_nickname"
                  className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]"
                >
                  Nick de juego
                </label>
                <input
                  id="game_nickname"
                  name="game_nickname"
                  defaultValue={currentAlias}
                  minLength={GAME_NICKNAME_MIN_LENGTH}
                  maxLength={24}
                  required
                  className="min-h-12 rounded-lg border-[1.5px] border-[var(--color-line)] bg-white px-4 py-3 text-[0.95rem] font-semibold text-[var(--color-ink)] outline-none"
                  placeholder="Cómo querés aparecer jugando"
                />
              </div>

              {resolvedPromoter ? (
                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                    Promoter detectado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                    {resolvedPromoter.name} ({resolvedPromoter.code})
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  <label
                    htmlFor="manual_promoter_code"
                    className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]"
                  >
                    Promotor
                  </label>
                  <input
                    id="manual_promoter_code"
                    name="manual_promoter_code"
                    className="min-h-12 rounded-lg border-[1.5px] border-[var(--color-line)] bg-white px-4 py-3 text-[0.95rem] font-semibold text-[var(--color-ink)] outline-none"
                    placeholder="Opcional"
                  />
                </div>
              )}

              {resolvedGroupInvite ? (
                <label className="grid gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-ink)]">
                  <input type="hidden" name="join_group" value="1" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                    Team detectado
                  </span>
                  <span className="font-semibold">{resolvedGroupInvite.name}</span>
                  <span className="text-[var(--color-muted)]">
                    Vas a seguir con este Team cuando actives tu Pase.
                  </span>
                </label>
              ) : null}

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-5 py-3 text-[0.82rem] font-extrabold uppercase tracking-[0.09em] text-[var(--color-ink)]"
              >
                {isPaid ? "Continuar" : "Continuar y activar mi Pase"}
              </button>
            </form>
          </div>
        </SurfaceCard>
      </section>
    </PageStack>
  );
}

