# Online Examination System

Production-oriented MERN online examination system with JWT authentication, role-based admin/student portals, exam attempts, auto-save answers, result analytics, PDF export, and Excel export.

## Local Development

```bash
npm run install:all
npm run dev
```

The API runs on `http://localhost:5000` and the Vite client runs on `http://localhost:5173`.

## Environment

The backend reads `server/.env`. Copy `server/.env.example` to `server/.env` and update values before running:

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

## Deploy to Vercel

This project is configured for **single-deployment** on Vercel — both the React frontend and the Express API are deployed together from one repo.

### Steps

1. **Push your code** to a GitHub/GitLab/Bitbucket repository.

2. **Import the project** in the [Vercel Dashboard](https://vercel.com/new):
   - Select your repository
   - **Framework Preset**: select `Other`
   - **Root Directory**: leave as `.` (the repo root)
   - Click **Deploy**

3. **Set Environment Variables** in Vercel → Project Settings → Environment Variables:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A long random secret |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://your-app.vercel.app` |

   > **Note**: `VITE_API_URL` is **not needed** — the frontend and backend share the same Vercel domain.

4. **Redeploy** after setting environment variables (Vercel → Deployments → Redeploy).

### How It Works

```
vercel.json (root)
├── installCommand  → installs server/ and client/ dependencies
├── buildCommand    → builds the Vite frontend into client/dist
├── outputDirectory → serves client/dist as static files
├── functions       → bundles server/ code into api/[...path].js
└── rewrites
    ├── /api/*      → serverless function (Express)
    ├── /uploads/*  → serverless function (Express)
    └── /*          → index.html (SPA fallback)
```

### Important Notes

- **MongoDB Atlas**: Make sure your Atlas cluster allows connections from `0.0.0.0/0` (or Vercel's IP ranges) in Network Access settings.
- **File Uploads**: Vercel serverless functions have a read-only filesystem. File uploads via `multer` will not persist. For persistent uploads, integrate a cloud storage service (AWS S3, Cloudinary, or Vercel Blob).
