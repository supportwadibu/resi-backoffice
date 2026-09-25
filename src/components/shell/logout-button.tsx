"use client";

import {
  useRef,
  useState,
} from 'react';

import { LogOut } from 'lucide-react';

import { logout } from '@/app/actions/auth';
import { ConfirmDialog } from '@/components/confirm-dialog';

/**
 * Déconnexion après confirmation. L'action reste soumise par un formulaire,
 * le chemin que Next.js documente pour une server action qui redirige : il se
 * charge de la navigation vers `/login`.
 */
export function LogoutButton() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Se déconnecter"
        className="flex cursor-pointer items-center gap-2 p-2 text-sm text-muted hover:bg-background hover:text-foreground"
      >
        <LogOut aria-hidden className="size-4" />
        <span className="sr-only md:not-sr-only">Se déconnecter</span>
      </button>

      <form ref={formRef} action={logout} hidden />

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Se déconnecter ?"
        description="Vous devrez saisir à nouveau vos identifiants pour revenir au backoffice."
        confirmLabel="Se déconnecter"
        onConfirm={() => {
          formRef.current?.requestSubmit();
          return new Promise<never>(() => {});
        }}
      />
    </>
  );
}
