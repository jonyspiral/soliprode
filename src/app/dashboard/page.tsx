import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ActivationPanel } from "@/components/participation/activation-panel";
import {
  InfoNotice,
  PageStack,
  StatCard,
} from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

export default async function DashboardPage() {
  let hasAuthenticatedUser = false;
  let userEmail: string | null = null;
  let profile:
    | {
        full_name: string | null;
        public_alias: string;
        whatsapp: string | null;
        email: string | null;
      }
    | null = null;
  let participation:
    | {
        id: string;
        payment_status: string;
        created_at: string;
        payment_reference: string | null;
        payment_submitted_at: string | null;
      }
    | null = null;
  let predictionCount = 0;
  let fallbackMessage =
    "No pudimos revisar tu sesión ahora. Reintentá en unos minutos o volvé a entrar.";

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    if (!user) {
      redirect("/login");
    }

    hasAuthenticatedUser = true;
    userEmail = user.email ?? null;

    const [
      { data: profileData },
      { data: participationRows },
      { count: userPredictionCount },
    ] = await withSupabaseTimeout(
      Promise.all([
        supabase
          .from("profiles")
          .select("full_name, public_alias, whatsapp, email, role")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("participations")
          .select("id, payment_status, created_at, payment_reference, payment_submitted_at")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(2),
        supabase
          .from("predictions")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", user.id),
      ]),
      "Supabase dashboard query timed out",
    );

    profile = profileData;
    participation = pickPrimaryParticipation(participationRows ?? []).participation;
    predictionCount = userPredictionCount ?? 0;
  } catch {
    if (hasAuthenticatedUser) {
      fallbackMessage =
        "Tu sesión está abierta, pero no pudimos leer tu cuenta completa. Reintentá en unos minutos.";
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

  if (hasAuthenticatedUser && !profile && !participation) {
    return (
      <PageStack>
        <SurfaceCard title="Estado temporal" description="Tu sesión existe, pero falta recuperar tus datos.">
          <InfoNotice tone="error" message={fallbackMessage} />
        </SurfaceCard>
      </PageStack>
    );
  }

  const participationStatus = participation?.payment_status ?? "pending";
  const participationActive = participationStatus === "paid";
  const aliasLabel = profile?.public_alias?.trim() || "jugador";
  const mainMessage = participationActive
    ? "Ya estás compitiendo."
    : "Tus picks quedan guardados. Falta pagar para competir por premios.";
  const stateLabel = participationActive ? "Compitiendo" : "Falta pagar";
  const picksLabel = `${predictionCount} pronóstico${predictionCount === 1 ? "" : "s"} cargado${predictionCount === 1 ? "" : "s"}`;

  return (
    <PageStack>
      <section className="-mx-4 -mt-2 overflow-hidden rounded-b-[2rem] bg-[#001a5c] md:-mx-6 md:rounded-[2rem]">
        <div className="relative flex min-h-[420px] flex-col justify-end px-4 pb-8 text-left md:min-h-[34rem] md:px-8 md:pb-10">
          <Image
            src="/lio_copa.jpeg"
            alt="Jugador con la copa del mundo"
            fill
            priority
            className="object-cover object-[55%_18%]"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_44%,rgba(0,26,92,0.68)_62%,rgba(0,26,92,0.94)_82%,#001a5c_100%)]" />
          <div className="relative z-10 flex items-end justify-between gap-4">
            <div className="grid max-w-[18rem] gap-3 md:max-w-[32rem] md:gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#dfe6ff]">
                Panel del jugador
              </p>
              <h1 className="font-serif text-[2.35rem] font-bold uppercase leading-[0.92] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.65)] md:text-[4rem]">
                {`Hola, ${aliasLabel}`}
              </h1>
              <p className="max-w-[16rem] text-base font-semibold leading-7 text-[#ffe16d] drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)] md:max-w-[28rem] md:text-[1.35rem]">
                {mainMessage}
              </p>
              <p className="text-sm leading-6 text-[#dfe6ff] md:text-[1rem]">
                {picksLabel}
              </p>
            </div>
            <div className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white md:inline-flex">
              {stateLabel}
            </div>
          </div>
        </div>
      </section>

      {participationActive ? (
        <SurfaceCard title="Ya estás compitiendo" description="Seguí cargando tus pronósticos y mirá cómo viene la tabla.">
          <div className="grid gap-3 md:grid-cols-2">
            <Link
              href="/matches"
              className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
            >
              Cargá tus pronósticos
            </Link>
            <Link
              href="/rankings"
              className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
            >
              Ver ranking
            </Link>
          </div>
        </SurfaceCard>
      ) : (
        <SurfaceCard tone="accent" title="Pagá con Mercado Pago" description="Tus picks quedan guardados. Pagá para que compitan por premios.">
          <div className="grid gap-4">
            <ActivationPanel
              participationId={participation?.id ?? null}
              participationStatus={participationStatus}
              draftCount={predictionCount}
              initialPaymentReference={participation?.payment_reference ?? null}
              initialPaymentSubmittedAt={participation?.payment_submitted_at ?? null}
            />
            <Link
              href="/matches"
              className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
            >
              Cargar pronósticos
            </Link>
          </div>
        </SurfaceCard>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tus picks" value={String(predictionCount)} detail={picksLabel} />
        <StatCard label="Estado" value={stateLabel} detail={participationActive ? "Ya entrás a competir por premios." : "Pagá con Mercado Pago para entrar en juego."} />
        <StatCard label="Alias" value={aliasLabel} detail="Así aparecés en el torneo." />
      </section>

      <SurfaceCard title="Cuenta">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Nombre
                </span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {profile?.full_name ?? "Pendiente"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Email
                </span>
                <span className="truncate pl-3 text-sm font-semibold text-[var(--color-ink)]">
                  {profile?.email ?? userEmail ?? "Sin email"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  WhatsApp
                </span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {profile?.whatsapp ?? "Opcional"}
                </span>
              </div>
            </div>
            <SignOutButton
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] sm:min-w-[160px]"
            />
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
