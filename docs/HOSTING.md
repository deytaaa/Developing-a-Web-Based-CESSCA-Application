# CESSCA Hosting Guide

This guide shows the simplest way to host the CESSCA app publicly with one backend service and one domain.

## Recommended Setup

- Backend: Node.js + Express
- Frontend: Vite build served from `frontend/dist`
- Database: MySQL
- Reverse proxy: Nginx or any platform that can proxy HTTP traffic

## What Changed For Hosting

The app now supports same-origin hosting:

- The frontend API base defaults to `/api`
- Uploaded images and profile pictures resolve against the deployed host
- The backend serves the built frontend automatically when `frontend/dist` exists

## Environment Variables

### Backend `.env`

```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=cessca_user
DB_PASSWORD=your_strong_password
DB_NAME=cessca_prod
JWT_SECRET=your_very_long_and_random_secret_key_here
CORS_ORIGIN=https://yourdomain.com
```

### Frontend `.env`

```env
VITE_API_URL=/api
```

## Deploy Steps

1. Create the production MySQL database and import `database/schema.sql`.
2. Install backend dependencies in `backend/`.
3. Install frontend dependencies in `frontend/`.
4. Build the frontend with `npm run build` inside `frontend/`.
5. Start the backend with a process manager such as PM2.
6. Point your domain or reverse proxy to the backend service.

## If You Use Nginx

Use the frontend build as the site root and proxy `/api` to the backend.

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api {
    proxy_pass http://localhost:5000;
}

location /uploads {
    alias /var/www/cessca/backend/uploads;
}
```

## Notes

- Keep `frontend/dist` on the server if you want the backend to serve the app directly.
- Use `VITE_API_URL=/api` for a same-domain deployment.
- Keep `frontend/vite.config.js` proxy settings for local development only.
