# Deploy on Railway

## Railway service

1. Push this repository to GitHub.
2. In Railway, create a new project from the GitHub repository.
3. Set the service root directory to `gaston`.
4. Railway will use `railway.json`:
   - Build command: `npm run build`
   - Start command: `npm run start`
   - Runtime: Node.js 20 via `nixpacks.toml`

## Database

1. Add a PostgreSQL service to the same Railway project.
2. In the Next.js service variables, add:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
```

`npm run start` runs `prisma migrate deploy` before starting Next.js, so migrations are applied on deploy.

## Environment variables

Copy the keys from `.env.example` into Railway variables and fill the production values:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-app-password
BREVO_API_KEY=your-brevo-api-key
BREVO_SMS_SENDER=Gaston
CLEANUP_SECRET=generate-a-long-random-secret
```

## Persistent uploads

The app stores avatars, messages, photos, videos, and contracts under `/uploads/...`.

For production, attach a Railway volume to the Next.js service and set:

```env
UPLOAD_DIR=${{RAILWAY_VOLUME_MOUNT_PATH}}
```

Without a volume, uploads can disappear after redeploys because the container filesystem is ephemeral.

## Local verification

```bash
npm install
npm run build
```

The production server command is:

```bash
npm run start
```
