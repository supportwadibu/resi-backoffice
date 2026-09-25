import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-background",
  danger: "bg-danger text-surface hover:opacity-90",
  ghost: "text-muted hover:bg-background hover:text-foreground",
};

/**
 * Taille en prop plutôt qu'en `className` : deux classes de padding dans le
 * même attribut, l'emporte celle que Tailwind génère en dernier, pas celle
 * écrite en dernier.
 */
const SIZES: Record<Size, string> = {
  md: "px-4 py-2",
  sm: "px-2 py-1",
};

const BASE = "inline-flex items-center justify-center gap-2 text-sm font-medium";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${SIZES[size]} disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}

/**
 * Lien à l'allure de bouton, pour une action qui mène ailleurs (« Réservations
 * de ce logement ») : un `<a>` reste ouvrable dans un nouvel onglet.
 */
export function ButtonLink({
  variant = "secondary",
  size = "md",
  className = "",
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`} {...rest} />;
}
