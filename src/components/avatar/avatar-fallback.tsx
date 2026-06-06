"use client";

import {
  buildGeneratedAvatarDataUrl,
  buildStableAvatarSeed,
  type AvatarKind,
} from "@/lib/avatar/identity";

type AvatarFallbackProps = {
  className: string;
  kind: AvatarKind;
  label: string;
  seed?: string | null;
  variant?: string | null;
};

export function AvatarFallback({
  className,
  kind,
  label,
  seed,
  variant,
}: AvatarFallbackProps) {
  const fallbackSeed = buildStableAvatarSeed(seed, label, kind);
  const backgroundImage = buildGeneratedAvatarDataUrl({
    kind,
    label,
    seed: fallbackSeed,
    variant,
  });

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ backgroundImage: `url("${backgroundImage}")` }}
    />
  );
}
