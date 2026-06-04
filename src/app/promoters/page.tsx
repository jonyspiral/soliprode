import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { PromoterShareActions } from "@/components/admin/promoter-share-actions";
import { InfoNotice, PageStack, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { requireLinkedPromoterUser } from "@/lib/admin/access";
import { formatEntryPrice } from "@/lib/product/entry-config";
import {
  buildPromoterShareLink,
  buildPromoterShareMessage,
  getPromoterSelfSnapshot,
  normalizeWhatsappForLink,
} from "@/lib/promoters/admin";
import { getBaseUrl } from "@/lib/payments/config";

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

export default async function PromotersPage() {
  let authUserId: string;

  try {
    const { user } = await requireLinkedPromoterUser();
    authUserId = user.id;
  } catch (error) {
    if (error instanceof Error && error.message === "unauthenticated") {
      redirect("/login?next=/promoters");
    }

    return (
      <PageStack>
        <PageHero
          title="Promoters"
          description="Panel privado para seguir el avance de Promoters en SoliProde."
          tone="stadium"
        />
        <SurfaceCard title="Acceso restringido" description="Necesitás estar vinculado a un Promoter para ver este panel.">
          <InfoNotice
            tone="error"
            message="Tu cuenta no está vinculada a un Promoter. Pedile al Admin que relacione tu email desde /admin/promoters."
          />
        </SurfaceCard>
      </PageStack>
    );
  }

  const snapshot = await getPromoterSelfSnapshot(authUserId);

  if (!snapshot) {
    return (
      <PageStack>
        <PageHero
          title="Promoters"
          description="Panel privado para seguir el avance de Promoters en SoliProde."
          tone="stadium"
        />
        <SurfaceCard title="Acceso restringido" description="Necesitás estar vinculado a un Promoter para ver este panel.">
          <InfoNotice
            tone="error"
            message="Tu cuenta no está vinculada a un Promoter. Pedile al Admin que relacione tu email desde /admin/promoters."
          />
        </SurfaceCard>
      </PageStack>
    );
  }

  const baseUrl = getBaseUrl();
  const { promoter, ranking } = snapshot;
  const message = buildPromoterShareMessage(baseUrl, promoter.code);

  return (
    <PageStack>
      <PageHero
        title="Promoters"
        description="Seguimiento privado del ranking general de Promoters."
        tone="stadium"
      />

      <SurfaceCard
        title={`Tu avance: ${promoter.name}`}
        description="La fuente de verdad del ranking sigue siendo participations.promoter_id."
      >
        <div className="grid gap-3 md:grid-cols-5">
          <StatCard label="Puesto" value={`#${promoter.rankingPosition}`} detail="Posicion actual" />
          <StatCard label="Registrados" value={String(promoter.registeredPlayersCount)} detail="Participaciones atribuidas" />
          <StatCard label="Jugadores activos" value={String(promoter.activePlayersCount)} detail="Aportes confirmados" />
          <StatCard label="Aportes" value={String(promoter.confirmedContributionsCount)} detail="payment_status = paid" />
          <StatCard label="Recaudado" value={formatEntryPrice(promoter.totalRaised)} detail="entry_price o fallback controlado" />
        </div>
        <div className="mt-4 grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
          <p className="text-sm text-[var(--color-muted)]">
            Tu link:{" "}
            <a href={buildPromoterShareLink(baseUrl, promoter.code)} className="font-semibold text-[var(--color-primary)] underline">
              {buildPromoterShareLink(baseUrl, promoter.code)}
            </a>
          </p>
          <PromoterShareActions
            email={promoter.email}
            mailtoHref={buildMailtoHref(promoter.email, message)}
            message={message}
            whatsappHref={buildWhatsappHref(promoter.whatsapp, message)}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard
        title="Ranking general de Promoters"
        description="Vista solo lectura del leaderboard completo. No expone emails, WhatsApp ni notas internas de otros."
      >
        <div className="grid gap-3">
          {ranking.map((entry) => {
            const isCurrentPromoter = entry.id === promoter.id;

            return (
              <div
                key={entry.id}
                className={[
                  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-4",
                  isCurrentPromoter
                    ? "border-[#e7ca55] bg-[#fff7d4]"
                    : "border-[var(--color-line)] bg-[var(--color-surface-muted)]",
                ].join(" ")}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-sm font-bold text-[var(--color-primary)]">
                  #{entry.rankingPosition}
                </div>
                <div className="grid gap-1">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {entry.name}
                    {isCurrentPromoter ? " · Vos" : ""}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {entry.code} · {entry.activePlayersCount} Jugadores activos ·{" "}
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
            );
          })}
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
