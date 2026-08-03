type ButtonVariant = "primary" | "outline" | "ghost";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none";

const SIZES = {
  md: "px-6 py-3",
  sm: "px-4 py-2",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-jade text-jade-ink hover:bg-jade-bright",
  outline: "border border-white/15 text-white hover:border-jade/70 hover:text-jade",
  ghost: "text-white/70 hover:text-jade",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: keyof typeof SIZES = "md",
  extra = ""
): string {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${extra}`.trim();
}
