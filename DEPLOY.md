# GovGuide Deployment Guide

## Architecture
- **Frontend**: React (Vite) → Vercel (free, CDN)
- **Backend**: Spring Boot → Render (free web service, Docker)
- **Analytics**: Plausible (privacy-friendly, already added to index.html)

## Step 1: Push to GitHub

```bash
# Create a new repo on GitHub (github.com/new) named "govguide"
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/govguide.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend on Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `govguide-api`
   - **Root Directory**: (leave empty — Dockerfile is at repo root)
   - **Runtime**: Docker
   - **Plan**: Free
4. Environment Variables:
   - `APP_CORS_ALLOWED_ORIGINS` = `https://govguide.vercel.app,https://YOUR_CUSTOM_DOMAIN`
   - `GOVGUIDE_CONTENT_ROOT` = `/app/content/services`
5. Deploy — note the URL (e.g. `https://govguide-api.onrender.com`)

**Note**: Free tier spins down after 15 min of inactivity. First request after idle takes ~30s. Consider upgrading to Starter ($7/mo) for always-on if you get real users.

## Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Connect your GitHub repo
3. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend-react`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables:
   - `VITE_API_BASE` = `https://govguide-api.onrender.com` (your Render URL from Step 2)
5. Deploy

## Step 4: Set Up Plausible Analytics

1. Go to [plausible.io](https://plausible.io) → Sign up (30-day free trial, then $9/mo)
   - Or self-host: [plausible.io/docs/self-hosting](https://plausible.io/docs/self-hosting)
2. Add site: `govguide.in` (or your Vercel domain)
3. The tracking script is already in `index.html`
4. Update `data-domain` in index.html if your domain differs from `govguide.in`

## Step 5: Custom Domain (Optional)

### For Vercel (frontend):
1. Vercel Dashboard → Project → Settings → Domains
2. Add `govguide.in`
3. Configure DNS: CNAME `@` → `cname.vercel-dns.com`

### For Render (backend):
1. Render Dashboard → Service → Settings → Custom Domains
2. Add `api.govguide.in`
3. Configure DNS: CNAME `api` → `govguide-api.onrender.com`

Then update:
- Vercel env: `VITE_API_BASE` = `https://api.govguide.in`
- Render env: `APP_CORS_ALLOWED_ORIGINS` = `https://govguide.in`

## After Deploy: Verify

1. Open the Vercel URL
2. Check that services load (API call to backend works)
3. Try registering a user
4. Check Plausible dashboard for your visit
