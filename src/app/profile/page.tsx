import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { InfoNotice, PageStack, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

export default async function ProfilePage() {
  let hasAuthenticatedUser = false;
  let fallbackMessage =
    "No pudimos revisar tu cuenta ahora. Reintentá en unos minutos o volvé a entrar.";
  let userEmail: string | null = null;
  let profile:
    | {
        full_name: string | null;
        public_alias: string;
        whatsapp: string | null;
        email: string | null;
      }
    | null = null;
  let participationStatus = "pending";

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    if (!user) {
      redirect("/login?next=/profile");
    }

    hasAuthenticatedUser = true;
    userEmail = user.email ?? null;

    const [{ data: profileData }, { data: participationRows }] = await withSupabaseTimeout(
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
          .limit(2),
      ]),
      "Supabase profile query timed out",
    );

    profile = profileData;
    participationStatus =
      pickPrimaryParticipation(
        (participationRows ?? []) as Array<{ created_at: string; payment_status: string }>,
      ).participation?.payment_status ?? "pending";
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

  const stateLabel = participationStatus === "paid" ? "Compitiendo" : "Falta pagar";

  return (
    <PageStack>
      <SurfaceCard tone="primary" title="Perfil" description="Tu cuenta y tu estado en el juego.">
        <div className="grid gap-4">
          <p className="font-serif text-[2rem] font-bold uppercase text-white">
            {profile?.public_alias ?? "Jugador"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Estado" value={stateLabel} detail="Así está hoy tu cuenta en el torneo." />
            <StatCard label="Alias" value={profile?.public_alias ?? "Pendiente"} detail="Así aparecés en el juego." />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Cuenta">
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
            >
              Ir al panel
            </Link>
            <SignOutButton className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)]" />
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
