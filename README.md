# VContent 3.0

Repo moi cho VContent 3.0, di theo pattern cua `ecoteam`: Vite + React SPA + `api/` + `supabase/`.

## Cau truc

- `src/`: ung dung React
- `src/pages`: page-level screens
- `src/components`: UI va layout blocks
- `src/lib`: contract va utility chung
- `api/`: serverless endpoints cho Vercel
- `supabase/`: migrations va policy

## Chay local

```bash
npm install
npm run dev
```

Env local:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Build

```bash
npm run build
```

## Deploy

Repo nay deploy o root repo tren Vercel nhu mot Vite SPA.
