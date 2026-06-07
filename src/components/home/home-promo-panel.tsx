import Link from "next/link";
import { PromoCountdownInline } from "@/components/home/promo-countdown-inline";

type HomePromoPanelProps = {
  entryPrice: string;
  clickable?: boolean;
};

export function HomePromoPanel({ entryPrice, clickable = false }: HomePromoPanelProps) {
  const content = (
    <div className="home-landing-promo-panel">
      <div className="home-landing-promo-header">
        <p className="home-landing-promo-title">Inscribite ya!</p>
        <span className="home-landing-promo-pill">
          {entryPrice}
          <span>promo</span>
        </span>
      </div>
      <div className="home-landing-promo-countdown">
        <span className="home-landing-promo-countdown-label">Hasta</span>
        <p className="home-landing-promo-countdown-value">
          <PromoCountdownInline />
        </p>
      </div>
      <p className="home-landing-promo-note">Pozo incremental: crece con cada jugador.</p>
    </div>
  );

  if (!clickable) {
    return content;
  }

  return (
    <Link href="/activar-pase" className="block text-left">
      {content}
    </Link>
  );
}
