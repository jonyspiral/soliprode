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
        aria-label={label}
        className={sizeClass}
        role="img"
        style={{ backgroundImage: `url("${imageUrl}")` }}
      />
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
