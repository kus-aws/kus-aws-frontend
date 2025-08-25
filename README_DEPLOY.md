## Amplify Hosting (Manual Upload) Guide

### 1) Set API base URL via Vite env

Create env files in `client/`:

```
client/.env.local
VITE_API_BASE_URL=http://localhost:8000

client/.env.production
VITE_API_BASE_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
```

Notes:
- Do not commit these files. `.gitignore` already ignores `.env*`.
- No trailing slash.

### 2) Build

From repository root:

```
npm i
npm run build
# Produces both dist/public and client/dist
```

For Amplify Hosting manual upload, use the artifacts in `client/dist`.

### 3) Upload to Amplify Hosting

1. Open Amplify console → Hosting → Deploy without Git → Drag & drop
2. Drop the folder `client/dist`
3. Set custom headers if needed (SPA routing):

```
/* 200
```

### 4) Verify API CORS

Allow your Amplify domain as allowed Origin in API Gateway/Lambda responses.

### 5) Troubleshooting

- 403/404 on refresh: ensure SPA rewrite above
- CORS errors: double-check `VITE_API_BASE_URL` and backend CORS settings
- API path: frontend calls `/api/*` under the configured base URL


