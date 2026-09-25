# RESI Backoffice

Administration de la plateforme RESI, réservée au rôle `admin`.

## Démarrage

```bash
cp .env.example .env.local   # puis ajuster API_URL
npm install
npm run dev                  # http://localhost:3000
```

L'API ([../api](../api)) doit tourner : le backoffice n'a pas de données
propres, il passe tout par elle.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run start` | sert le build |
| `npm run lint` | eslint |
| `npx tsc --noEmit` | typage |

Architecture et conventions : voir la section `backoffice` du
[CLAUDE.md](../CLAUDE.md) racine.
