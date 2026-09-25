"use client";

import { useId, type InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
}

/**
 * Case à cocher native. `accent-primary` la teinte selon le thème — noire en
 * clair, blanche en sombre — sans redessiner la case.
 */
export function Checkbox({ label, hint, id: idProp, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 size-4 accent-primary"
        {...rest}
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
