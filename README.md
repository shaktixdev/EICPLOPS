# EICPLOPS

Eastern India Cement fleet / gate dispatch console (Next.js + Prisma + MongoDB).

## Local

```bash
npm install
cp .env.example .env   # fill DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma generate
npm run seed
npm run dev
```

Login after seed: `Admin@EICPL.com` / `Ogx@6666`

## Vercel deploy

1. Import the GitHub repo on [vercel.com](https://vercel.com)
2. Add **Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Same MongoDB Atlas URI as local |
| `NEXTAUTH_SECRET` | Long random string (same across redeploys) |
| `NEXTAUTH_URL` | Exact site URL, e.g. `https://eicplops.vercel.app` (no trailing slash) |

3. In **MongoDB Atlas → Network Access**, allow `0.0.0.0/0` (or Vercel IPs), otherwise login returns **401**
4. Redeploy after saving env vars
5. If the DB has no users yet, run seed once against that `DATABASE_URL`: `npm run seed`

`vercel.json` runs `prisma generate` on build. Region is `bom1` (Mumbai).
