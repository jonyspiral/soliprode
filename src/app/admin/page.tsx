import { redirect } from "next/navigation";
import { confirmParticipationAction } from "@/app/admin/actions";
import { PageHero } from "@/components/page-hero";
import { InfoNotice, PageStack, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type PendingParticipationRow = {
  id: string;
  payment_status: string;
  created_at: string;
  payment_reference: string | null;
  paid_at: string | null;
  profile_id: string;
  profile: {
    full_name: string | null;
    public_alias: string;
    email: string | null;
    whatsapp: string | null;
  }[] | null;
};

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

  if (!user) {
    redirect("/login?next=/admin");
  }

  const ownProfileQuery = supabase
    .from("profiles")
    .select("role, public_alias")
    .eq("id", user.id)
    .maybeSingle();
  const ownProfileResult = await withSupabaseTimeout(
    Promise.resolve(ownProfileQuery),
    "Supabase admin access check timed out",
  );
  const ownProfile = ownProfileResult.data;

  if (ownProfile?.role !== "admin") {
    return (
      <PageStack>
        <PageHero
          title="Admin"
          description="Superficie operativa reservada para administración del torneo."
          tone="stadium"
        />
        <SurfaceCard title="Acceso restringido" description="Necesitás perfil admin para operar esta sección.">
          <InfoNotice
            tone="error"
            message="Tu cuenta no tiene permisos de administración. Ingresá con un perfil admin para revisar pagos y activar participaciones."
          />
        </SurfaceCard>
      </PageStack>
    );
  }

  let pendingRows: PendingParticipationRow[] = [];
  let paidCount = 0;
  let pendingCount = 0;
  let predictionCount = 0;
  let adminNotice: string | null = null;

  try {
    const adminSupabase = createServiceRoleSupabaseClient();
    const adminResults = await withSupabaseTimeout(
      Promise.all([
        adminSupabase
          .from("participations")
          .select(
            `
              id,
              payment_status,
              created_at,
              payment_reference,
              paid_at,
              profile_id,
              profile:profiles(full_name, public_alias, email, whatsapp)
            `,
          )
          .eq("payment_status", "pending")
          .order("created_at", { ascending: true }),
        adminSupabase
          .from("participations")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "paid"),
        adminSupabase
          .from("participations")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "pending"),
        adminSupabase.from("predictions").select("id", { count: "exact", head: true }),
      ]),
      "Supabase admin query timed out",
    );
    const [pendingResult, paidResult, pendingCountResult, predictionCountResult] = adminResults;

    pendingRows = (((pendingResult.data ?? []) as PendingParticipationRow[])).map((row) => ({
      ...row,
      profile: row.profile ?? [],
    }));
    paidCount = paidResult.count ?? 0;
    pendingCount = pendingCountResult.count ?? 0;
    predictionCount = predictionCountResult.count ?? 0;
  } catch {
    adminNotice =
      "No pudimos cargar el panel operativo completo. Reintentá en unos minutos o revisá la configuración del service role.";
  }

  return (
    <PageStack>
      <PageHero
        title="Admin"
        description="Operación mínima para empezar a cobrar, revisar pendientes y activar participaciones."
        tone="stadium"
      />

      {adminNotice ? <InfoNotice tone="error" message={adminNotice} /> : null}

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Pendientes" value={String(pendingCount)} detail="Esperan confirmación manual" />
        <StatCard label="Activos" value={String(paidCount)} detail="Ya compiten oficialmente" />
        <StatCard label="Picks" value={String(predictionCount)} detail="Pronósticos cargados" />
      </section>

      <SurfaceCard
        title="Participaciones pendientes"
        description="Antes de Mercado Pago, esta es la bandeja operativa para confirmar pagos manuales."
      >
        {pendingRows.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            No hay participaciones pendientes ahora mismo.
          </p>
        ) : (
          <div className="grid gap-4">
            {pendingRows.map((row) => {
              const profile = row.profile?.[0] ?? null;

              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="grid gap-2">
                      <p className="font-serif text-[1.5rem] font-bold uppercase text-[var(--color-primary)]">
                        {profile?.public_alias ?? "Sin alias"}
                      </p>
                      <p className="text-sm text-[var(--color-ink)]">
                        {profile?.full_name ?? "Nombre pendiente"}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {profile?.email ?? "Sin email"} · {profile?.whatsapp ?? "WhatsApp opcional"}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Alta: {new Date(row.created_at).toLocaleDateString("es-AR")}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Referencia: {row.payment_reference?.trim() || "Todavía no cargó referencia o comprobante."}
                      </p>
                    </div>

                    <form action={confirmParticipationAction} className="sm:min-w-[180px]">
                      <input type="hidden" name="participation_id" value={row.id} />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                      >
                        Confirmar pago
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard
        title="Qué sigue"
        description="Con esta base ya podés empezar a operar manualmente mientras el cobro automático sigue pendiente."
      >
        <div className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
          <p>1. El jugador crea su cuenta y carga pronósticos.</p>
          <p>2. Guarda una referencia o comprobante desde su dashboard.</p>
          <p>3. El admin confirma manualmente y la participación pasa a activa.</p>
          <p>4. Desde ese momento, los pronósticos futuros ya compiten por premios y ranking oficial.</p>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
