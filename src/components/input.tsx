"use client";

import { Eye, EyeOff, Search } from "lucide-react";
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface FieldProps {
  label?: string;
  /** Texte d'aide sous le champ, remplacé par `error` quand il y en a une. */
  hint?: string;
  error?: string;
}

type SingleLineProps = FieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    type?: "text" | "email" | "password" | "search" | "tel" | "number" | "date";
  };

type DescriptionProps = FieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    type: "description";
  };

export type InputProps = SingleLineProps | DescriptionProps;

const FIELD =
  "w-full border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted " +
  "focus:border-primary disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Champ de formulaire du backoffice : libellé, aide et erreur compris.
 *
 * Un seul composant plutôt qu'un par type, pour que libellé, message d'erreur
 * et accessibilité (`aria-invalid`, `aria-describedby`) soient câblés une fois.
 * `description` rend un `<textarea>` : un texte long n'a rien à faire dans un
 * champ d'une ligne.
 */
export function Input(props: InputProps) {
  const {
    label,
    hint,
    error,
    id: idProp,
    className = "",
    type,
    ...rest
  } = props;
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const noteId = `${id}-note`;
  const note = error ?? hint;

  const shared = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": note ? noteId : undefined,
    className: `${FIELD} ${error ? "border-danger" : "border-border"} ${className}`,
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}

      {/* La déstructuration perd le lien entre `type` et le reste des props ;
          les assertions le rétablissent, `type` ayant été testé juste avant. */}
      {type === "description" ? (
        <textarea
          rows={4}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          {...shared}
        />
      ) : (
        <SingleLine
          type={type}
          {...(rest as Omit<InputHTMLAttributes<HTMLInputElement>, "type">)}
          {...shared}
        />
      )}

      {note && (
        <p
          id={noteId}
          className={`text-xs ${error ? "text-danger" : "text-muted"}`}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function SingleLine({
  type = "text",
  className,
  ...rest
}: Omit<SingleLineProps, keyof FieldProps>) {
  const [revealed, setRevealed] = useState(false);

  if (type === "search") {
    return (
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        />
        <input type="search" className={`${className} pl-9`} {...rest} />
      </div>
    );
  }

  if (type === "password") {
    const Icon = revealed ? EyeOff : Eye;
    return (
      <div className="relative">
        <input
          type={revealed ? "text" : "password"}
          className={`${className} pr-10`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          aria-label={
            revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          aria-pressed={revealed}
          disabled={rest.disabled}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-foreground disabled:pointer-events-none"
        >
          <Icon aria-hidden className="size-4" />
        </button>
      </div>
    );
  }

  return <input type={type} className={className} {...rest} />;
}
