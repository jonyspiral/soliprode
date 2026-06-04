"use client";

import { useEffect, useRef } from "react";
import { joinGroupAction } from "@/app/groups/actions";
import type { TeamInviteContext } from "@/app/teams/_page-state";

type TeamInviteJoinPanelProps = {
  authStatus: "guest" | "member";
  inviteContext: TeamInviteContext;
  returnPath: string;
};

export function TeamInviteJoinPanel({
  authStatus,
  inviteContext,
  returnPath,
}: TeamInviteJoinPanelProps) {
  const autoJoinFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (authStatus !== "member" || !inviteContext.shouldAutoJoin || inviteContext.status !== "ready") {
      return;
    }

    autoJoinFormRef.current?.requestSubmit();
  }, [authStatus, inviteContext]);

  if (inviteContext.status === "missing") {
    return (
      <div className="teams-alert teams-alert-error">
        Ese Código del Team no existe o ya no está disponible.
      </div>
    );
  }

  if (inviteContext.status === "already-in-team") {
    return (
      <div className="teams-alert teams-alert-success">
        Ya formás parte de {inviteContext.targetGroupName ?? "este Team"}.
      </div>
    );
  }

  if (inviteContext.status === "requires-confirmation") {
    return (
      <form action={joinGroupAction} className="teams-form">
        <input type="hidden" name="return_to" value={returnPath} />
        <input type="hidden" name="invite_code" value={inviteContext.code} />
        <input type="hidden" name="confirm_replace" value="1" />
        <div className="teams-alert teams-alert-error">
          Ya tenés un Team. Si querés sumarte a {inviteContext.targetGroupName ?? "este Team"}, tenés
          que confirmar el cambio.
        </div>
        <button type="submit" className="teams-button-secondary">
          Confirmar cambio de Team
        </button>
      </form>
    );
  }

  if (authStatus === "member" && inviteContext.shouldAutoJoin) {
    return (
      <form ref={autoJoinFormRef} action={joinGroupAction} className="teams-form">
        <input type="hidden" name="return_to" value={returnPath} />
        <input type="hidden" name="invite_code" value={inviteContext.code} />
        <div className="teams-alert teams-alert-success">
          Te estamos sumando a {inviteContext.targetGroupName ?? "este Team"}.
        </div>
        <button type="submit" className="teams-button-secondary">
          Sumarme al Team
        </button>
      </form>
    );
  }

  return null;
}
