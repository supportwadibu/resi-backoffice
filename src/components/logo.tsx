import Image from "next/image";

/**
 * Le fichier est noir sur fond transparent : inversé en mode sombre, sans quoi
 * il disparaîtrait sur le fond noir. L'inversion garde le logo bicolore
 * (pastille blanche, maison noire) au lieu d'exiger une seconde version.
 *
 * `onMedia` : posé sur une photo assombrie, le logo est toujours en blanc,
 * quel que soit le mode.
 */
export function Logo({
  height = 32,
  eager = false,
  onMedia = false,
}: {
  height?: number;
  eager?: boolean;
  onMedia?: boolean;
}) {
  return (
    <Image
      src="/images/resi_logo.png"
      alt="Resi"
      width={Math.round((height * 1136) / 412)}
      height={height}
      loading={eager ? "eager" : "lazy"}
      className={onMedia ? "invert" : "dark:invert"}
    />
  );
}
