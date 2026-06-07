"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GroupAvatar } from "@/components/groups/group-avatar";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import type { AvatarEmojiCategory, AvatarKind } from "@/lib/avatar/identity";

type AvatarActionState = {
  message: string | null;
  status: "idle" | "error" | "success";
};

type AvatarPickerOption = {
  caption: string;
  category?: AvatarEmojiCategory;
  detail?: string;
  fallbackImageUrl?: string | null;
  imageUrl?: string | null;
  kind: AvatarKind;
  label: string;
  recommended?: boolean;
  seed: string;
  tab: "emoji" | "google" | "soliprode";
  value: string;
  variant?: string | null;
};

type AvatarPickerProps = {
  action: (
    state: AvatarActionState,
    formData: FormData,
  ) => Promise<AvatarActionState>;
  autoOption?: AvatarPickerOption | null;
  currentValue: string;
  description: string;
  emojiOptions: AvatarPickerOption[];
  googleOption?: AvatarPickerOption | null;
  hiddenFields?: Record<string, string>;
  showGoogleTab?: boolean;
  soliprodeOptions: AvatarPickerOption[];
  triggerLabel: string;
};

const initialState: AvatarActionState = {
  status: "idle",
  message: null,
};

function AvatarOptionVisual({
  option,
  size = "md",
}: {
  option: AvatarPickerOption;
  size?: "sm" | "md" | "lg";
}) {
  if (option.kind === "group") {
    return (
      <GroupAvatar
        fallbackImageUrl={option.fallbackImageUrl}
        imageUrl={option.imageUrl}
        label={option.label}
        seed={option.seed}
        size={size}
        variant={option.variant}
      />
    );
  }

  return (
    <PlayerAvatar
      fallbackImageUrl={option.fallbackImageUrl}
      imageUrl={option.imageUrl}
      label={option.label}
      seed={option.seed}
      size={size}
      variant={option.variant}
    />
  );
}

function AvatarPickerDialog({
  action,
  autoOption,
  currentValue,
  description,
  emojiOptions,
  googleOption,
  hiddenFields,
  onClose,
  showGoogleTab = false,
  soliprodeOptions,
  triggerLabel,
}: AvatarPickerProps & { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [activeTab, setActiveTab] = useState<"emoji" | "google" | "soliprode">("emoji");
  const [emojiCategory, setEmojiCategory] = useState<AvatarEmojiCategory | "Todas">("Todas");
  const [emojiQuery, setEmojiQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState(currentValue);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const allOptions = useMemo(
    () =>
      [autoOption, googleOption, ...emojiOptions, ...soliprodeOptions].filter(
        (option): option is AvatarPickerOption => Boolean(option),
      ),
    [autoOption, emojiOptions, googleOption, soliprodeOptions],
  );
  const selectedOption =
    allOptions.find((option) => option.value === selectedValue) ??
    googleOption ??
    emojiOptions[0] ??
    soliprodeOptions[0] ??
    autoOption ??
    null;
  const emojiCategories = useMemo(
    () =>
      ["Todas", ...new Set(emojiOptions.map((option) => option.category).filter(Boolean))] as Array<
        AvatarEmojiCategory | "Todas"
      >,
    [emojiOptions],
  );
  const normalizedEmojiQuery = emojiQuery.trim().toLowerCase();
  const recommendedEmojiOptions = emojiOptions.filter((option) => option.recommended);
  const remainingEmojiOptions = emojiOptions.filter((option) => !option.recommended);
  const filteredEmojiOptions = remainingEmojiOptions.filter((option) => {
    const matchesCategory =
      emojiCategory === "Todas" || option.category === emojiCategory;
    const matchesQuery =
      !normalizedEmojiQuery ||
      option.caption.toLowerCase().includes(normalizedEmojiQuery) ||
      option.label.toLowerCase().includes(normalizedEmojiQuery) ||
      option.category?.toLowerCase().includes(normalizedEmojiQuery) ||
      option.value.toLowerCase().includes(normalizedEmojiQuery);

    return matchesCategory && matchesQuery;
  });

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, []);

  if (state.status === "success") {
    return null;
  }

  return (
    <div className="avatar-picker-sheet" role="dialog" aria-modal="true" aria-label={triggerLabel}>
      <button
        type="button"
        className="avatar-picker-backdrop"
        aria-label="Cerrar selector de avatar"
        onClick={onClose}
      />
      <div ref={panelRef} className="avatar-picker-panel">
        <div className="avatar-picker-handle" />
        <div className="avatar-picker-header">
          <div>
            <h3 className="avatar-picker-title">CAMBIAR AVATAR</h3>
            <p className="avatar-picker-copy">Personalizá tu identidad en SoliProde</p>
            <p className="avatar-picker-copy avatar-picker-copy-muted">{description}</p>
          </div>
          <button
            type="button"
            className="avatar-picker-close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        {selectedOption ? (
          <div className="avatar-picker-preview">
            <AvatarOptionVisual option={selectedOption} size="lg" />
            <div>
              <p className="avatar-picker-preview-title">{selectedOption.label}</p>
              <p className="avatar-picker-preview-copy">{selectedOption.caption}</p>
              {selectedOption.detail ? (
                <p className="avatar-picker-preview-detail">{selectedOption.detail}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="avatar-picker-tabs" role="tablist" aria-label="Tipos de avatar">
          {[
            { key: "emoji", label: "Emojis" },
            ...(showGoogleTab ? [{ key: "google", label: "Google" }] : []),
            { key: "soliprode", label: "SoliProde" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`avatar-picker-tab ${activeTab === tab.key ? "avatar-picker-tab-active" : ""}`}
              onClick={() => {
                setActiveTab(tab.key as "emoji" | "google" | "soliprode");
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form action={formAction} className="avatar-picker-form">
          {hiddenFields
            ? Object.entries(hiddenFields).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))
            : null}
          <input type="hidden" name="avatar_choice" value={selectedValue} />

          {activeTab === "emoji" ? (
            <div className="avatar-picker-tab-panel">
              <section className="avatar-picker-section">
                <div className="avatar-picker-section-header">
                  <p className="avatar-picker-section-title">Recomendados</p>
                </div>
                <div className="avatar-picker-grid avatar-picker-grid-emoji">
                  {recommendedEmojiOptions.map((option) => {
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
                        <AvatarOptionVisual option={option} />
                        <span className="avatar-picker-option-label">{option.caption}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="avatar-picker-section">
                <div className="avatar-picker-section-header">
                  <p className="avatar-picker-section-title">Más emojis</p>
                </div>
                <input
                  type="search"
                  value={emojiQuery}
                  onChange={(event) => {
                    setEmojiQuery(event.target.value);
                  }}
                  className="avatar-picker-search"
                  placeholder="Buscar emoji"
                />
                <div className="avatar-picker-chip-row">
                  {emojiCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`avatar-picker-chip ${emojiCategory === category ? "avatar-picker-chip-active" : ""}`}
                      onClick={() => {
                        setEmojiCategory(category);
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="avatar-picker-grid avatar-picker-grid-emoji">
                  {filteredEmojiOptions.map((option) => {
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
                        <AvatarOptionVisual option={option} />
                        <span className="avatar-picker-option-label">{option.caption}</span>
                      </button>
                    );
                  })}
                </div>
                {filteredEmojiOptions.length === 0 ? (
                  <p className="avatar-picker-empty">No encontramos emojis para esa búsqueda.</p>
                ) : null}
              </section>
            </div>
          ) : null}

          {activeTab === "google" ? (
            <div className="avatar-picker-tab-panel">
              {googleOption ? (
                <button
                  type="button"
                  className={`avatar-picker-google-card ${selectedValue === googleOption.value ? "avatar-picker-option-active" : ""}`}
                  onClick={() => {
                    setSelectedValue(googleOption.value);
                  }}
                >
                  <AvatarOptionVisual option={googleOption} size="lg" />
                  <div>
                    <p className="avatar-picker-section-title">Usar foto de tu cuenta Google</p>
                    <p className="avatar-picker-option-subcopy">
                      Si la foto falla, volvemos a tu avatar SoliProde sin romper la UI.
                    </p>
                  </div>
                </button>
              ) : (
                <div className="avatar-picker-empty-card">
                  <p className="avatar-picker-section-title">Google</p>
                  <p className="avatar-picker-option-subcopy">
                    No encontramos una foto de Google disponible.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "soliprode" ? (
            <div className="avatar-picker-tab-panel">
              <section className="avatar-picker-section">
                <div className="avatar-picker-section-header">
                  <p className="avatar-picker-section-title">Avatares SoliProde</p>
                </div>
                <div className="avatar-picker-grid">
                  {soliprodeOptions.map((option) => {
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
                        <AvatarOptionVisual option={option} />
                        <span className="avatar-picker-option-label">{option.caption}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {autoOption ? (
                <section className="avatar-picker-section">
                  <div className="avatar-picker-section-header">
                    <p className="avatar-picker-section-title">Modo automático</p>
                  </div>
                  <button
                    type="button"
                    className={`avatar-picker-google-card ${selectedValue === autoOption.value ? "avatar-picker-option-active" : ""}`}
                    onClick={() => {
                      setSelectedValue(autoOption.value);
                    }}
                  >
                    <AvatarOptionVisual option={autoOption} size="lg" />
                    <div>
                      <p className="avatar-picker-section-title">{autoOption.caption}</p>
                      <p className="avatar-picker-option-subcopy">
                        {autoOption.detail ?? "Si no elegís uno fijo, SoliProde resuelve tu avatar automáticamente."}
                      </p>
                    </div>
                  </button>
                </section>
              ) : null}
            </div>
          ) : null}

          {state.message && state.status !== "idle" ? (
            <p
              className={
                state.status === "error"
                  ? "profile-feedback profile-feedback-error"
                  : "profile-feedback profile-feedback-success"
              }
            >
              {state.message}
            </p>
          ) : null}

          <div className="avatar-picker-actions">
            <button
              type="button"
              className="profile-secondary-button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="profile-save-button disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? "Guardando..." : "GUARDAR AVATAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AvatarPicker(props: AvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  return (
    <>
      <button
        type="button"
        className="profile-secondary-button"
        onClick={() => {
          setDialogKey((key) => key + 1);
          setOpen(true);
        }}
      >
        {props.triggerLabel}
      </button>
      {open ? (
        <AvatarPickerDialog
          key={dialogKey}
          {...props}
          onClose={() => {
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
