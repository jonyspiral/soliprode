"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function confirmParticipationAction(formData: FormData) {
  const participationId = String(formData.get("participation_id") ?? "").trim();

  if (!participationId) {
    throw new Error("Missing participation_id");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("participations")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", participationId);

  if (error) {
    throw new Error("No pudimos confirmar la participación.");
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/matches");
}
