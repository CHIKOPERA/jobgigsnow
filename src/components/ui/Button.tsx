import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "success" | "disabled";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ink text-[#F6F7F0] hover:bg-[#2b2d24]",
  secondary: "bg-transparent border border-ink text-ink hover:bg-surface",
  success: "bg-accent-mint text-ink",
  disabled: "bg-accent-sage text-[#6D6F63] cursor-not-allowed",
};

interface ButtonClassOptions {
  variant?: Variant;
  loading?: boolean;
  fullWidthBelowMd?: boolean;
  disabled?: boolean;
  className?: string;
}

export function buttonClasses({
  variant = "primary",
  loading = false,
  fullWidthBelowMd = true,
  disabled = false,
  className = "",
}: ButtonClassOptions) {
  const isDisabled = disabled || variant === "disabled";
  return [
    "focus-ring inline-flex items-center justify-center gap-2 rounded-pill text-body font-medium transition-opacity",
    "min-h-(--hit-min) px-6",
    fullWidthBelowMd ? "w-full md:w-auto" : "",
    VARIANT_CLASSES[isDisabled && variant !== "disabled" ? "disabled" : variant],
    loading ? "opacity-55" : "",
    className,
  ].join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidthBelowMd?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  fullWidthBelowMd = true,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || variant === "disabled";
  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, loading, fullWidthBelowMd, disabled: isDisabled, className })}
      style={{ transitionDuration: "var(--dur-state)", transitionTimingFunction: "var(--ease-standard)" }}
      {...props}
    >
      {children}
    </button>
  );
}

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  fullWidthBelowMd?: boolean;
}

export function LinkButton({
  variant = "primary",
  fullWidthBelowMd = true,
  className = "",
  children,
  ...props
}: LinkButtonProps) {
  return (
    <a
      className={buttonClasses({ variant, fullWidthBelowMd, className })}
      style={{ transitionDuration: "var(--dur-state)", transitionTimingFunction: "var(--ease-standard)" }}
      {...props}
    >
      {children}
    </a>
  );
}
