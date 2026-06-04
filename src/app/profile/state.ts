export type ProfileActionState = {
  message: string | null;
  status: "idle" | "error" | "success";
};

export const initialProfileActionState: ProfileActionState = {
  status: "idle",
  message: null,
};
