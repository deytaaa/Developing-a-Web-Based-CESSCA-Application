# Render Deployment Guide

Render can host the Node.js backend, and Supabase can host the PostgreSQL database.

## Important

- Render is IPv4-only for this deployment path, so Supabase's direct database host may show as not IPv4 compatible
- Use the Supabase Session Pooler connection string for Render, or buy the Supabase IPv4 add-on
- `DB_HOST=localhost` will fail on Render unless you are connecting to a VM you control

## Backend Service

### Build Command

```bash
npm install
```

### Start Command

```bash
npm start
```

### Environment Variables

Set these in the Render dashboard:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres.qpidhsjgymvjkkitmfnc:your_supabase_db_password@<session-pooler-host>:5432/postgres
DB_SSL=true
JWT_SECRET=your_long_random_secret
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## Frontend Service

If the frontend is on Vercel, point it to the Render API URL:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

## Uploads

Make sure uploaded files are stored on a persistent disk or in object storage if you need them to survive redeploys. Render’s ephemeral filesystem will not keep uploads forever unless you attach persistent storage.

## Common Error

If you see a connection error during startup, confirm that the Supabase `DATABASE_URL` is correct and that `DB_SSL=true` is set in Render.
If Render says the database is not IPv4 compatible, switch to the Supabase Session Pooler URL from the dashboard.

## Your Current `.env`

The values you shared are local-development values, not Render values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=cessca123
DB_NAME=cessca_db
CORS_ORIGIN=https://cessca.vercel.app
```

On Render with Supabase, replace the database block with your Supabase Session Pooler connection string:

```env
DATABASE_URL=postgresql://postgres.qpidhsjgymvjkkitmfnc:your_supabase_db_password@<session-pooler-host>:5432/postgres
DB_SSL=true
```

If you do not have the Supabase Session Pooler connection string yet, Render will keep failing even if the backend deploys successfully.
