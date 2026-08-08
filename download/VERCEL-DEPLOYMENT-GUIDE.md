# 🚀 Mouth Care Solutions — Vercel Deployment Guide

> **Why Vercel?** Your Hostinger plan is **shared hosting** (cPanel), which does NOT support Next.js. **Vercel is FREE** and is the best platform for Next.js websites.

## What We Changed
- ✅ Database switched from local SQLite → **Turso** (free cloud SQLite)
- ✅ Removed standalone build (not needed for Vercel)
- ✅ Cron route updated for external cron service
- ✅ Seed script for initial database setup

---

## OVERVIEW: 6 Steps to Go Live

| Step | Where | Time |
|------|-------|------|
| 1. Create Turso Database | turso.tech | 5 min |
| 2. Push Code to GitHub | github.com | 10 min |
| 3. Deploy to Vercel | vercel.com | 5 min |
| 4. Add DNS Records in Hostinger | Hostinger Panel | 5 min |
| 5. Seed Database | Your browser | 2 min |
| 6. Setup Auto-Blogger Cron | cron-job.org | 5 min |

---

## STEP 1: Create Turso Database (Free)

Turso gives you a **free cloud SQLite database** that works perfectly with Vercel.

### 1A — Create Account
1. Go to **[turso.tech](https://turso.tech/)**
2. Click **"Start Free"** → Sign up with **GitHub** (easiest)
3. Verify your email

### 1B — Create Database
1. In Turso dashboard → Click **"Create Database"
2. **Name:** `mcs-dental`
3. **Location:** Choose closest to India → `ap-south-1` (Mumbai) or `ap-southeast-1` (Singapore)
4. Click **Create**
5. Wait 30 seconds for it to provision

### 1C — Get Your Database URL & Token
1. Click on your database `mcs-dental`
2. Go to **Settings** → **Connection Info** (or click "Connect")
3. You'll see:
   - **URL:** Something like `libsql://mcs-dental-username.turso.io`
   - **Auth Token:** A long string
4. **Copy both** — you'll need them in Step 3

> ⚠️ Keep the auth token safe! Don't share it publicly.

---

## STEP 2: Push Code to GitHub

### 2A — Create GitHub Account (if needed)
1. Go to **[github.com](https://github.com/)** → Sign up (free)

### 2B — Create Repository
1. Click **"+"** → **"New repository"**
2. **Name:** `mouthcaresolutions`
3. **Visibility:** Private (recommended)
4. **Do NOT** initialize with README
5. Click **Create repository**

### 2C — Upload Your Code

**On your computer** (where the project files are), open **Terminal** (Mac) or **Command Prompt** (Windows):

```bash
# Go to your project folder
cd path/to/your/project

# Initialize Git
git init
git add .
git commit -m "Initial commit - Mouth Care Solutions dental website"

# Connect to GitHub
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/mouthcaresolutions.git
git branch -M main
git push -u origin main
```

> Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.
> If it asks for login, use your GitHub username and a **Personal Access Token** (not password).
> To create a token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic) → Check "repo" → Generate.

---

## STEP 3: Deploy to Vercel

### 3A — Sign Up
1. Go to **[vercel.com](https://vercel.com/)**
2. Click **"Sign Up"** → Sign up with **GitHub** (recommended)
3. Authorize Vercel to access your GitHub repos

### 3B — Import Your Project
1. In Vercel dashboard → Click **"Add New"** → **"Project"**
2. You'll see your `mouthcaresolutions` repo → Click **"Import"**
3. **Framework Preset:** Vercel auto-detects **Next.js** ✅
4. **Build Command:** Leave as `next build`
5. **Don't change** any other settings
6. Click **"Deploy"**
7. Wait 2-3 minutes for build to complete

### 3C — Add Environment Variables
1. After deploy, go to your project → **Settings** → **Environment Variables**
2. Add these variables one by one:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `libsql://mcs-dental-xxx.turso.io` (from Step 1C) |
| `DIRECT_DATABASE_URL` | Same as DATABASE_URL |
| `TURSO_AUTH_TOKEN` | Your Turso auth token (from Step 1C) |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `admin123` |
| `JWT_SECRET` | `mcs-vijayawada-2024-secure-random-secret-key` |
| `NEXT_PUBLIC_SITE_URL` | `https://mouthcaresolutions.com` |
| `CRON_SECRET` | `mcs-cron-secret-2024-change-this` |

3. Click **Save**
4. Go to **Deployments** → Click **"Redeploy"** (so the new env vars take effect)

---

## STEP 4: Connect Domain (DNS in Hostinger)

Since your nameservers already point to Hostinger, you manage DNS from Hostinger.

### 4A — Add DNS Records in Hostinger
1. Log in to **Hostinger** → **Domains** → Click **mouthcaresolutions.com**
2. Go to **DNS** (or "DNS Zone")
3. You may see existing records — that's fine
4. **Add these records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `@` | `cname.vercel-dns.com` | Auto/3600 |
| CNAME | `www` | `cname.vercel-dns.com` | Auto/3600 |

> ⚠️ If there's already an **A record** for `@`, **delete it first**, then add the CNAME.
> If Hostinger doesn't allow CNAME for `@`, use this instead:
>
> | Type | Name | Value |
> |------|------|-------|
> | A | `@` | `76.76.21.21` |
> | CNAME | `www` | `cname.vercel-dns.com` |

### 4B — Add Domain in Vercel
1. Go to **Vercel** → Your project → **Settings** → **Domains**
2. Type `mouthcaresolutions.com` → Click **Add**
3. Also add `www.mouthcaresolutions.com`
4. Vercel will verify DNS — may take **1-4 hours** to propagate
5. Once verified, Vercel automatically provisions **SSL/HTTPS** ✅

### 4C — Redirect www → non-www (optional)
In Vercel → Settings → Domains:
- Click the ⋯ next to `www.mouthcaresolutions.com`
- Set as **Redirect** to `mouthcaresolutions.com`

---

## STEP 5: Seed the Database

After Vercel deployment succeeds:

### 5A — Push Schema to Turso
On your **local computer** terminal (with the project):

```bash
cd path/to/your/project

# Set your Turso credentials temporarily
export DATABASE_URL="libsql://mcs-dental-xxx.turso.io"
export DIRECT_DATABASE_URL="libsql://mcs-dental-xxx.turso.io"
export TURSO_AUTH_TOKEN="your-turso-auth-token"

# Push the database schema
npx prisma db push

# Seed the admin user and auto-blogger config
npm run db:seed
```

You should see:
```
✅ Admin user created: admin / admin123
✅ Auto-blogger config created
🌱 Seeding complete!
```

> Replace the `xxx` and token with your actual Turso credentials.

### 5B — Verify
1. Open **Vercel deployment URL** (like `mcs-website.vercel.app`)
2. Go to **mouthcaresolutions.com/rajeshark/login**
3. Login: username `admin`, password `admin123`
4. ✅ If login works, database is connected!

---

## STEP 6: Setup Auto-Blogger (Free Cron)

Vercel's free tier doesn't have built-in cron. We use **cron-job.org** (free).

### 6A — Create Cron Job
1. Go to **[cron-job.org](https://cron-job.org/)** → Sign up (free)
2. Click **"Create Cronjob"
3. **Title:** `MCS Auto-Blogger`
4. **URL:** `https://mouthcaresolutions.com/api/cron/autoblog?secret=mcs-cron-secret-2024-change-this`
   - Replace the secret with your actual `CRON_SECRET` value
5. **Schedule:** Choose **"Every 8 hours"** (3 times/day = 9AM, 5PM, 1AM)
   - Or set custom times: 9:00, 13:00, 18:00 (IST)
6. **Save**

### 6B — Test It
1. In cron-job.org, click **"Run now"** next to your job
2. Wait 30 seconds
3. Check your blog: `mouthcaresolutions.com/blog`
4. You should see a new post!

---

## ✅ VERIFY EVERYTHING

| URL | What to Check |
|-----|---------------|
| `https://mouthcaresolutions.com` | Homepage with hero, services, doctors, social links |
| `https://mouthcaresolutions.com/about` | About page |
| `https://mouthcaresolutions.com/doctors` | All 10 doctors |
| `https://mouthcaresolutions.com/services` | Dental services |
| `https://mouthcaresolutions.com/blog` | Blog listing |
| `https://mouthcaresolutions.com/contact` | Contact form + Google Map |
| `https://mouthcaresolutions.com/rajeshark/login` | Admin login (admin / admin123) |
| `https://mouthcaresolutions.com/sitemap.xml` | SEO sitemap |
| `https://mouthcaresolutions.com/robots.txt` | Robots file |

## 🔐 IMPORTANT: Change Default Password!

After first login, change your admin password:
1. In Vercel → Settings → Environment Variables
2. Update `ADMIN_PASSWORD` to a strong password
3. Also update `JWT_SECRET` to a random 40+ character string
4. Redeploy

---

## 📋 Quick Checklist

- [ ] Turso database created
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] DNS records added in Hostinger
- [ ] Domain connected in Vercel
- [ ] Database schema pushed & seeded
- [ ] Admin login works
- [ ] Auto-blogger cron set up
- [ ] Default password changed
- [ ] SSL/HTTPS working
- [ ] Submit sitemap to [Google Search Console](https://search.google.com/search-console)
- [ ] Google Maps embed working
- [ ] WhatsApp button working
- [ ] All social media links working (Facebook, YouTube, Instagram, Threads)

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails on Vercel | Check build logs, ensure all env vars are set |
| Database connection error | Verify Turso URL & token in Vercel env vars |
| Domain not connecting | DNS takes 1-4 hours. Check at whatsmydns.net |
| Admin login not working | Run `npm run db:seed` to create admin user |
| Blog posts not showing | Check Turso database has data in Turso dashboard |
| Auto-blogger not running | Verify cron-job.org URL has correct secret |
| SSL not working | Wait for DNS propagation, then check Vercel domains |
| 404 on pages | Redeploy on Vercel after adding env vars |