"use client";

export type ViewMode = "connections" | "paths";

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewModeToggle({ mode, onChange }: Props) {
  return (
    <div
      className="pointer-events-auto inline-flex items-center gap-1 p-1 rounded-full"
      style={{
        backgroundColor: "color-mix(in srgb, var(--text-primary) 5%, transparent)",
        boxShadow:
          "inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 10%, transparent)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <ModeButton
        active={mode === "connections"}
        onClick={() => onChange("connections")}
        label="Connections"
        icon={
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="5" cy="6" r="2" />
            <circle cx="19" cy="6" r="2" />
            <circle cx="5" cy="18" r="2" />
            <circle cx="19" cy="18" r="2" />
            <circle cx="12" cy="12" r="2" />
            <line x1="6.5" y1="7" x2="10.5" y2="11" />
            <line x1="17.5" y1="7" x2="13.5" y2="11" />
            <line x1="6.5" y1="17" x2="10.5" y2="13" />
            <line x1="17.5" y1="17" x2="13.5" y2="13" />
          </svg>
        }
      />
      <ModeButton
        active={mode === "paths"}
        onClick={() => onChange("paths")}
        label="Paths"
        icon={
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="4" r="2" />
            <circle cx="5" cy="13" r="2" />
            <circle cx="19" cy="13" r="2" />
            <circle cx="5" cy="20" r="1.5" />
            <circle cx="19" cy="20" r="1.5" />
            <line x1="11" y1="5.5" x2="6.5" y2="11.5" />
            <line x1="13" y1="5.5" x2="17.5" y2="11.5" />
            <line x1="5" y1="15" x2="5" y2="18.5" />
            <line x1="19" y1="15" x2="19" y2="18.5" />
          </svg>
        }
      />
    </div>
  );
}

interface ButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function ModeButton({ active, onClick, label, icon }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[11px] tracking-wide leading-none ${
        active
          ? "text-text-secondary"
          : "text-text-muted hover:text-text-secondary"
      }`}
      style={{
        backgroundColor: active
          ? "color-mix(in srgb, var(--text-primary) 9%, transparent)"
          : "transparent",
        boxShadow: active
          ? "inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 15%, transparent)"
          : "none",
      }}
      aria-pressed={active}
      aria-label={`Switch to ${label} view`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
