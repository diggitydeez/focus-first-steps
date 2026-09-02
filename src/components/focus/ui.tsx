import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-9 px-4 text-sm",
        size === "lg" && "h-11 px-5 text-[15px]",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary-hover",
        variant === "secondary" && "border border-border bg-background text-foreground hover:bg-muted",
        variant === "ghost" && "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "danger" && "text-muted-foreground hover:bg-muted hover:text-destructive",
        className,
      )}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  badge,
  className,
}: {
  label: string;
  hint?: ReactNode | undefined;
  children: ReactNode;
  badge?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-2 text-[13px] font-medium text-foreground">
        {label}
        {hint}
        {badge}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-9 w-full rounded-[8px] border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus-visible:outline-none";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

type SelectOption = { value: string; label: string; group?: string | undefined };

function collectOptions(children: ReactNode, group?: string): SelectOption[] {
  const out: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: string; label?: string; children?: ReactNode };
    if (child.type === "optgroup") {
      out.push(...collectOptions(props.children, props.label));
    } else if (child.type === "option") {
      out.push({
        value: String(props.value ?? ""),
        label: typeof props.children === "string" ? props.children : String(props.children ?? ""),
        group,
      });
    }
  });
  return out;
}

/**
 * Accessible custom select for this prototype. No native <select> is used anywhere:
 * the listbox is rendered through a portal with fixed positioning so it can never be
 * clipped by a drawer or modal.
 */
export function PrototypeSelect({
  value,
  onChange,
  onValueChange,
  children,
  className,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange?: ((e: { target: { value: string } }) => void) | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  children: ReactNode;
  className?: string | undefined;
  disabled?: boolean | undefined;
  "aria-label"?: string | undefined;
}) {
  const options = collectOptions(children);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  const place = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const height = Math.min(260, options.length * 34 + 10);
    setRect({
      top: below < height + 12 ? Math.max(8, r.top - height - 6) : r.bottom + 6,
      left: r.left,
      width: r.width,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open]);

  const commit = (v: string) => {
    onChange?.({ target: { value: v } });
    onValueChange?.(v);
    setOpen(false);
    btnRef.current?.focus();
  };

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex);
    setOpen(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[active];
      if (opt) commit(opt.value);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(inputClass, "flex items-center justify-between gap-2 pr-2 text-left", className)}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0 text-muted-foreground">
          <path
            d="M2 4.5 6 8.5 10 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            style={{ position: "fixed", top: rect.top, left: rect.left, minWidth: rect.width, zIndex: 9999 }}
            className="max-h-[260px] overflow-auto rounded-[10px] border border-border bg-background py-1 shadow-drawer"
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              const showGroup = o.group && o.group !== options[i - 1]?.group;
              return (
                <div key={`${o.group ?? ""}-${o.value}`}>
                  {showGroup && (
                    <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {o.group}
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(o.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-foreground",
                      i === active && "bg-muted",
                      isSelected && "font-medium text-primary",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSelected && <span aria-hidden>✓</span>}
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

export const Select = PrototypeSelect;


export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "teal" | "warning";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "accent" && "bg-accent-soft text-accent-foreground",
        tone === "teal" && "bg-teal-soft text-teal",
        tone === "warning" && "bg-warning-soft text-warning",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Tooltip({ text }: { text: string }) {
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`What is this? ${text}`}
        aria-describedby={id}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
      >
        ?
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 w-56 -translate-x-1/2 rounded-[8px] border border-border bg-background px-2.5 py-2 text-[12px] font-normal leading-snug text-muted-foreground opacity-0 shadow-drawer transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-[9px] border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-7 rounded-[7px] px-2.5 text-[12px] font-medium transition-colors",
            value === o.value ? "bg-accent-soft text-accent-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all",
          checked ? "left-[18px]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  width?: string | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input, select, button, textarea")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("relative w-full rounded-[12px] border border-border bg-background shadow-drawer", width)}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-[8px] px-2 py-1 text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1 rounded-full transition-all", i + 1 === step ? "w-7 bg-primary" : "w-5 bg-accent-soft")}
        />
      ))}
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-[440px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
  width?: string | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex h-full w-full flex-col border-l border-border bg-background shadow-drawer",
          width,
        )}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-[8px] px-2 py-1 text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
