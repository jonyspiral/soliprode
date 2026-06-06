"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { AvatarFallback } from "@/components/avatar/avatar-fallback";
import { buildProxyAvatarSrc } from "@/lib/player/avatar-src";

type GroupAvatarProps = {
  fallbackImageUrl?: string | null;
  imageUrl?: string | null;
  label: string;
  seed?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: string | null;
};

export function GroupAvatar({
  fallbackImageUrl = null,
  imageUrl = null,
  label,
  seed = null,
  size = "md",
  variant = null,
}: GroupAvatarProps) {
  const [failureState, setFailureState] = useState({
    failedCount: 0,
    signature: "",
  });
  const sizeClass =
    size === "lg" ? "group-avatar-lg" : size === "sm" ? "group-avatar-sm" : "group-avatar";
  const imageCandidates = useMemo(
    () =>
      [...new Set([imageUrl, fallbackImageUrl].filter((value): value is string => Boolean(value)))].map(
        (value) => buildProxyAvatarSrc(value),
      ),
    [fallbackImageUrl, imageUrl],
  );
  const imageSignature = imageCandidates.join("|");
  const failedCount =
    failureState.signature === imageSignature ? failureState.failedCount : 0;
  const currentImage = imageCandidates[failedCount] ?? null;

  if (currentImage) {
    return (
      <div className={sizeClass}>
        <img
          src={currentImage}
          alt={label}
          className="player-avatar-media"
          loading="lazy"
          onError={() => {
            setFailureState((state) => ({
              failedCount:
                state.signature === imageSignature ? state.failedCount + 1 : 1,
              signature: imageSignature,
            }));
          }}
        />
      </div>
    );
  }

  return <AvatarFallback className={sizeClass} kind="group" label={label} seed={seed} variant={variant} />;
}
