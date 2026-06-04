import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { PromoterShareActions } from "@/components/admin/promoter-share-actions";
import { InfoNotice, PageStack, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { requireAdminUser } from "@/lib/admin/access";
import { formatEntryPrice } from "@/lib/product/entry-config";
import {
  buildPromoterShareLink,
  buildPromoterShareMessage,
  getPromotersAdminSnapshot,
  normalizeWhatsappForLink,
} from "@/lib/promoters/admin";
import { getBaseUrl } from "@/lib/payments/config";
import { savePromoterAction, togglePromoterStatusAction } from "@/app/admin/promoters/actions";

type PromotersPageProps = {
  searchParams?: Promise<{
    edit?: string;
    error?: string;
    notice?: string;
    view?: string;
  }>;
};

function buildMailtoHref(email: string | null, message: string) {
  if (!email) {
    return null;
  }

  const searchParams = new URLSearchParams({
    subject: "Invitacion para compartir SoliProde",
    body: message,
  });

  return `mailto:${encodeURIComponent(email)}?${searchParams.toString()}`;
}

function buildWhatsappHref(whatsapp: string | null, message: string) {
  const normalizedWhatsapp = normalizeWhatsappForLink(whatsapp);

  if (!normalizedWhatsapp) {
    return null;
  }

  return `https://wa.me/${normalizedWhatsapp}?text=${encodeURIComponent(message)}`;
}

export default async function AdminPromotersPage({ searchParams }: PromotersPageProps) {
  try {
    await requireAdminUser();
  } catch (error) {
    if (error instanceof Error && error.message === "unauthenticated") {
      redirect("/login?next=/admin/promoters");
    }

    return (
      <PageStack>
        <PageHero
          title="Promoters"
          description="Panel interno para la operacion comercial del torneo."
          tone="stadium"
        />
        <SurfaceCard title="Acceso restringido" description="Necesitás perfil admin para operar esta sección.">
          <InfoNotice
            tone="error"
            message="Tu cuenta no tiene permisos de administración para revisar Promoters."
          />
        </SurfaceCard>
      </PageStack>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const baseUrl = getBaseUrl();
  const snapshot = await getPromotersAdminSnapshot();
  const selectedPromoter =
    snapshot.promoters.find((promoter) => promoter.id === params?.view) ??
    snapshot.promoters.find((promoter) => promoter.id === params?.edit) ??
    snapshot.promoters[0] ??
    null;
  const editingPromoter =
    snapshot.promoters.find((promoter) => promoter.id === params?.edit) ?? null;

  return (
    <PageStack>
      <PageHero
        title="Promoters"
        description="Ranking de alumnos y personas que empujan la recaudación de SoliProde."
        tone="stadium"
      />

      {params?.notice ? <InfoNotice tone="info" message={params.notice} /> : null}
      {params?.error ? <InfoNotice tone="error" message={params.error} /> : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Promoters" value={String(snapshot.totals.promoterCount)} detail="Cargados en Admin" />
        <StatCard label="Activos" value={String(snapshot.totals.activePromoterCount)} detail="Listos para mover el link" />
        <StatCard label="Jugadores activos" value={String(snapshot.totals.activePlayersCount)} detail="Con Aporte confirmado" />
        <StatCard label="Recaudado" value={formatEntryPrice(snapshot.totals.totalRaised)} detail="Segun participaciones paid" />
      </section>

      <SurfaceCard
        title={editingPromoter ? "Editar Promoter" : "Crear Promoter"}
        description="Promoter es una entidad interna de Admin. No tiene login ni credenciales."
      >
        <form action={savePromoterAction} className="grid gap-4">
          <input type="hidden" name="promoter_id" value={editingPromoter?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-[var(--color-muted)]">
              <span className="font-semibold uppercase tracking-[0.08em]">Nombre</span>
              <input
                name="name"
                defaultValue={editingPromoter?.name ?? ""}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                placeholder="Nombre del Promoter"
                required
              />
            </label>
            <label className="grid gap-1 text-sm text-[var(--color-muted)]">
              <span className="font-semibold uppercase tracking-[0.08em]">Codigo</span>
              <input
                name="code"
                defaultValue={editingPromoter?.code ?? ""}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                placeholder="Se genera si lo dejás vacío"
              />
            </label>
            <label className="grid gap-1 text-sm text-[var(--color-muted)]">
              <span className="font-semibold uppercase tracking-[0.08em]">Email</span>
              <input
                name="email"
                type="email"
                defaultValue={editingPromoter?.email ?? ""}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                placeholder="Opcional"
              />
            </label>
            <label className="grid gap-1 text-sm text-[var(--color-muted)]">
              <span className="font-semibold uppercase tracking-[0.08em]">WhatsApp</span>
              <input
                name="whatsapp"
                defaultValue={editingPromoter?.whatsapp ?? ""}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                placeholder="+54 9 11..."
              />
            </label>
            <label className="grid gap-1 text-sm text-[var(--color-muted)]">
              <span className="font-semibold uppercase tracking-[0.08em]">Estado</span>
              <select
                name="status"
                defaultValue={editingPromoter?.status ?? "active"}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm text-[var(--color-muted)]">
              <span className="font-semibold uppercase tracking-[0.08em]">Email vinculado</span>
              <input
                name="linked_profile_email"
                type="email"
                defaultValue={editingPromoter?.linkedProfileEmail ?? ""}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                placeholder="Usuario que podrá entrar a /promoters"
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm text-[var(--color-muted)]">
            <span className="font-semibold uppercase tracking-[0.08em]">Notas</span>
            <textarea
              name="notes"
              defaultValue={editingPromoter?.notes ?? ""}
              className="min-h-28 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              placeholder="Notas internas para el equipo."
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
            >
              {editingPromoter ? "Guardar Promoter" : "Crear Promoter"}
            </button>
            {editingPromoter ? (
              <Link
                href="/admin/promoters"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
              >
                Cancelar edicion
              </Link>
            ) : null}
          </div>
        </form>
      </SurfaceCard>

      {selectedPromoter ? (
        <SurfaceCard
          title={`Resumen de ${selectedPromoter.name}`}
          description="La recaudación sale solo de participations atribuidas al Promoter."
        >
          <div className="grid gap-3 md:grid-cols-4">
            <StatCard label="Registrados" value={String(selectedPromoter.registeredPlayersCount)} detail="Participaciones atribuidas" />
            <StatCard label="Jugadores activos" value={String(selectedPromoter.activePlayersCount)} detail="payment_status = paid" />
            <StatCard label="Aportes" value={String(selectedPromoter.confirmedContributionsCount)} detail="Aportes confirmados" />
            <StatCard label="Recaudado" value={formatEntryPrice(selectedPromoter.totalRaised)} detail="entry_price o fallback controlado" />
          </div>
          <div className="mt-4 grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-sm text-[var(--color-muted)]">
              Link del Promoter:{" "}
              <a href={buildPromoterShareLink(baseUrl, selectedPromoter.code)} className="font-semibold text-[var(--color-primary)] underline">
                {buildPromoterShareLink(baseUrl, selectedPromoter.code)}
              </a>
            </p>
            <PromoterShareActions
              email={selectedPromoter.email}
              mailtoHref={buildMailtoHref(
                selectedPromoter.email,
                buildPromoterShareMessage(baseUrl, selectedPromoter.code),
              )}
              message={buildPromoterShareMessage(baseUrl, selectedPromoter.code)}
              whatsappHref={buildWhatsappHref(
                selectedPromoter.whatsapp,
                buildPromoterShareMessage(baseUrl, selectedPromoter.code),
              )}
            />
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard
        title="Promoters cargados"
        description="ABM simple y ranking interno para seguir la recaudación real."
      >
        {snapshot.promoters.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Todavía no hay Promoters cargados.
          </p>
        ) : (
          <div className="grid gap-4">
            {snapshot.promoters.map((promoter) => {
              const message = buildPromoterShareMessage(baseUrl, promoter.code);

              return (
                <div
                  key={promoter.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-serif text-[1.5rem] font-bold uppercase text-[var(--color-primary)]">
                          {promoter.name}
                        </p>
                        <span className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                          {promoter.status}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-muted)]">Codigo: {promoter.code}</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {promoter.email ?? "Sin email"} · {promoter.whatsapp ?? "Sin WhatsApp"}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Login vinculado: {promoter.linkedProfileEmail ?? "Sin vincular"}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Jugadores activos: {promoter.activePlayersCount} · Aportes confirmados:{" "}
                        {promoter.confirmedContributionsCount} · Recaudado: {formatEntryPrice(promoter.totalRaised)}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/promoters?edit=${promoter.id}&view=${promoter.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/admin/promoters?view=${promoter.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                        >
                          Ver resumen
                        </Link>
                        <form action={togglePromoterStatusAction}>
                          <input type="hidden" name="promoter_id" value={promoter.id} />
                          <input
                            type="hidden"
                            name="next_status"
                            value={promoter.status === "active" ? "inactive" : "active"}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                          >
                            {promoter.status === "active" ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                      </div>
                      <PromoterShareActions
                        email={promoter.email}
                        mailtoHref={buildMailtoHref(promoter.email, message)}
                        message={message}
                        whatsappHref={buildWhatsappHref(promoter.whatsapp, message)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard
        title="Ranking de Promoters"
        description="Ordenado por recaudación descendente. La fuente de verdad es participations.promoter_id."
      >
        {snapshot.ranking.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Todavía no hay datos para el ranking.
          </p>
        ) : (
          <div className="grid gap-3">
            {snapshot.ranking.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-sm font-bold text-[var(--color-primary)]">
                  #{entry.rankingPosition}
                </div>
                <div className="grid gap-1">
                  <p className="font-semibold text-[var(--color-ink)]">{entry.name}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {entry.code} · {entry.status} · {entry.activePlayersCount} Jugadores activos ·{" "}
                    {entry.confirmedContributionsCount} Aportes confirmados
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                    Recaudado
                  </p>
                  <p className="font-serif text-[1.5rem] uppercase text-[var(--color-primary)]">
                    {formatEntryPrice(entry.totalRaised)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </PageStack>
  );
}
