"use client";

import { useActionState, useMemo, useState } from "react";
import { AvatarFallback } from "@/components/avatar/avatar-fallback";

type AvatarActionState = {
  message: string | null;
  status: "idle" | "error" | "success";
};

type AvatarPickerOption = {
  caption: string;
  kind: "player" | "group";
  label: string;
  value: string;
  seed: string;
  variant?: string | null;
};

type AvatarPickerProps = {
  action: (
    state: AvatarActionState,
    formData: FormData,
  ) => Promise<AvatarActionState>;
  automaticOption: AvatarPickerOption;
  currentValue: string;
  description: string;
  hiddenFields?: Record<string, string>;
  options: AvatarPickerOption[];
  triggerLabel: string;
};

const initialState: AvatarActionState = {
  status: "idle",
  message: null,
};

export function AvatarPicker({
  action,
  automaticOption,
  currentValue,
  description,
  hiddenFields,
  options,
  triggerLabel,
}: AvatarPickerProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(currentValue);
  const allOptions = useMemo(() => [automaticOption, ...options], [automaticOption, options]);
  const selectedOption =
    allOptions.find((option) => option.value === selectedValue) ?? automaticOption;
  const isSheetOpen = open && state.status !== "success";

  return (
    <>
      <button
        type="button"
        className="profile-secondary-button"
        onClick={() => {
          setSelectedValue(currentValue);
          setOpen(true);
        }}
      >
        {triggerLabel}
      </button>
      {isSheetOpen ? (
        <div className="avatar-picker-sheet" role="dialog" aria-modal="true" aria-label={triggerLabel}>
          <button
            type="button"
            className="avatar-picker-backdrop"
            aria-label="Cerrar selector de avatar"
            onClick={() => {
              setOpen(false);
            }}
          />
          <div className="avatar-picker-panel">
            <div className="avatar-picker-header">
              <div>
                <p className="profile-field-label">Avatar</p>
                <h3 className="avatar-picker-title">{triggerLabel}</h3>
                <p className="avatar-picker-copy">{description}</p>
              </div>
              <button
                type="button"
                className="avatar-picker-close"
                aria-label="Cerrar"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cerrar
              </button>
            </div>

            <div className="avatar-picker-preview">
              <AvatarFallback
                className={selectedOption.kind === "group" ? "group-avatar-lg" : "player-avatar-lg"}
                kind={selectedOption.kind}
                label={selectedOption.label}
                seed={selectedOption.seed}
                variant={selectedOption.variant}
              />
              <div>
                <p className="avatar-picker-preview-title">{selectedOption.label}</p>
                <p className="avatar-picker-preview-copy">{selectedOption.caption}</p>
              </div>
            </div>

            <form action={formAction} className="avatar-picker-form">
              {hiddenFields
                ? Object.entries(hiddenFields).map(([key, value]) => (
                    <input key={key} type="hidden" name={key} value={value} />
                  ))
                : null}
              <input type="hidden" name="avatar_choice" value={selectedValue} />
              <div className="avatar-picker-grid">
                {allOptions.map((option) => {
                  const isSelected = option.value === selectedValue;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`avatar-picker-option ${isSelected ? "avatar-picker-option-active" : ""}`}
                      onClick={() => {
                        setSelectedValue(option.value);
                      }}
                    >
                      <AvatarFallback
                        className={option.kind === "group" ? "group-avatar" : "player-avatar"}
                        kind={option.kind}
                        label={option.label}
                        seed={option.seed}
                        variant={option.variant}
                      />
                      <span className="avatar-picker-option-label">{option.caption}</span>
                    </button>
                  );
                })}
              </div>

              {state.message && state.status !== "idle" ? (
                <p
                  className={
                    state.status === "success"
                      ? "profile-feedback profile-feedback-success"
                      : "profile-feedback profile-feedback-error"
                  }
                >
                  {state.message}
                </p>
              ) : null}

              <div className="avatar-picker-actions">
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="profile-save-button disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {pending ? "Guardando..." : "Guardar avatar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
