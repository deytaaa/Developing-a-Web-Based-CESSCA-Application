# Render Deployment Guide

Render can host the Node.js backend, but the application still needs a real MySQL database that is reachable from Render.

## Important

- Render does not provide a local MySQL service inside the web process
- `DB_HOST=localhost` will fail on Render
- Use an external MySQL provider such as Railway MySQL, Aiven, DigitalOcean Managed MySQL, or another hosted MySQL server

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
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-mysql-database
DB_PORT=3306
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

If you see `connect ECONNREFUSED ::1:3306`, the backend is still trying to use a local database. Set `DB_HOST` to a real external MySQL host.
