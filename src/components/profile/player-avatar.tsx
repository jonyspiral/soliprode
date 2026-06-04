/* eslint-disable @next/next/no-img-element */
import { getPlayerInitials } from "@/lib/player/identity";

type PlayerAvatarProps = {
  imageUrl?: string | null;
  label: string;
  size?: "sm" | "md" | "lg";
};

export function PlayerAvatar({
  imageUrl = null,
  label,
  size = "md",
}: PlayerAvatarProps) {
  const sizeClass =
    size === "lg" ? "player-avatar-lg" : size === "sm" ? "player-avatar-sm" : "player-avatar";

  if (imageUrl) {
    return (
      <div
        className={sizeClass}
      >
        <img
          src={imageUrl}
          alt={label}
          className="player-avatar-media"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={sizeClass}
    >
      {getPlayerInitials(label)}
    </div>
  );
}
