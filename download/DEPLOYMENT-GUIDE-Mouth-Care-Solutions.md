# 🚀 Mouth Care Solutions — Website Deployment Guide

## Your Website Details
- **Domain:** mouthcaresolutions.com
- **Domain Registrar:** GoDaddy
- **Hosting:** Hostinger
- **Framework:** Next.js 16 (Standalone Output)
- **Database:** SQLite (file-based, no external DB needed)
- **Admin Dashboard:** mouthcaresolutions.com/rajeshark
- **Admin Login:** mouthcaresolutions.com/rajeshark/login
- **Default Credentials:** username: `admin` | password: `admin123`

---

## STEP 1: Prepare Your Hostinger Hosting

### Option A: Hostinger VPS (Recommended for Next.js)

If you have a **VPS plan** (not shared hosting), you can run Next.js directly:

1. **Log in to Hostinger** → Go to **VPS** section
2. **Choose OS Template:** Ubuntu 22.04 or 24.04 LTS
3. **Note your VPS IP address** (e.g., `185.234.xx.xx`)
4. **Connect via SSH:**
   ```bash
   ssh root@YOUR_VPS_IP
   ```

### Option B: Hostinger Shared Hosting (Use Static Export)

If you're on **shared hosting**, Next.js standalone won't work directly. You need to:
- Either upgrade to VPS (recommended)
- Or use a Node.js hosting service like **Vercel** (free tier works great)

> ⚠️ **Important:** Next.js with API routes, SQLite database, and server-side rendering **requires a VPS or Node.js hosting**. Shared hosting (cPanel) only supports static HTML/PHP.

---

## STEP 2: Connect Your GoDaddy Domain to Hostinger

### In GoDaddy:

1. Log in to **[GoDaddy](https://www.godaddy.com/)**
2. Go to **My Products** → Click on **mouthcaresolutions.com**
3. Click **DNS** (or "Manage DNS")
4. You'll see **Nameservers** section — click **Change**
5. Select **"I'll use my own nameservers"** (or "Custom nameservers")
6. Enter Hostinger's nameservers. Find them in:
   - **Hostinger Panel** → **Domains** → Your domain → **Nameservers**
   - They look like: `ns1.hostinger.com`, `ns2.hostinger.com`
7. Click **Save**

### Wait for Propagation:
- DNS changes take **1-24 hours** (usually 1-4 hours)
- You can check status at: https://www.whatsmydns.net/

### Alternative: A Record (if keeping GoDaddy nameservers)

If you prefer to keep GoDaddy's nameservers:

1. In **GoDaddy DNS** → **Add Record**
2. **Type:** A
3. **Host:** `@`
4. **Value:** Your Hostinger VPS IP address
5. **TTL:** 600 (or default)
6. Click **Save**

Also add a **CNAME** for www:
1. **Type:** CNAME
2. **Host:** `www`
3. **Value:** `mouthcaresolutions.com`
4. Click **Save**

---

## STEP 3: Deploy to Hostinger VPS (Node.js Method)

### 3A: Install Node.js on VPS

SSH into your VPS and run:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 22.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install PM2 (process manager to keep app running 24/7)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx

# Verify installations
node -v    # Should show v22.x.x
npm -v     # Should show 10.x.x
pm2 -v    # Should show 5.x.x
```

### 3B: Upload Your Website Files

**Method 1: Using SCP (from your local computer)**

On your **local computer** terminal (not the VPS), run:

```bash
# First, build the project locally (already done for you)
# The build output is in /home/z/my-project/.next/standalone/

# Create a deployment folder
mkdir -p /tmp/mcs-deploy

# Copy necessary files (adjust paths based on where you download)
cp -r .next/standalone/* /tmp/mcs-deploy/
cp -r .next/static /tmp/mcs-deploy/.next/static
cp -r public /tmp/mcs-deploy/public
cp prisma/schema.prisma /tmp/mcs-deploy/prisma/
cp db/custom.db /tmp/mcs-deploy/db/custom.db
```

Then upload to VPS:

```bash
scp -r /tmp/mcs-deploy/* root@YOUR_VPS_IP:/root/mouthcaresolutions/
```

**Method 2: Using Git (Recommended for future updates)**

On your VPS:

```bash
# Install git
apt install -y git

# Clone your repository (upload to GitHub first)
git clone YOUR_GITHUB_REPO_URL /root/mouthcaresolutions
cd /root/mouthcaresolutions

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build for production
npm run build
```

**Method 3: Using SFTP/FileZilla**

1. Download **[FileZilla](https://filezilla-project.org/)**
2. Connect with: Host = `YOUR_VPS_IP`, Username = `root`, Password = your VPS password
3. Upload all project files to `/root/mouthcaresolutions/`

### 3C: Configure Environment on VPS

```bash
cd /root/mouthcaresolutions

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="file:./db/custom.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
JWT_SECRET="change-this-to-a-random-long-string-in-production"
NEXT_PUBLIC_SITE_URL="https://mouthcaresolutions.com"
EOF

# Make sure db directory exists
mkdir -p db

# If you copied the database, it should be at db/custom.db
# If starting fresh, push the schema:
npx prisma db push
npx prisma generate
```

### 3D: Start the Application with PM2

```bash
cd /root/mouthcaresolutions

# Start the app
pm2 start npm --name "mcs-website" -- start

# Save PM2 config (auto-restart on reboot)
pm2 save
pm2 startup
# Run the command that pm2 startup outputs
```

Verify it's running:
```bash
pm2 status          # Should show "mcs-website" as "online"
curl http://localhost:3000   # Should return HTML
```

---

## STEP 4: Configure Nginx (Reverse Proxy + SSL)

### 4A: Create Nginx Config

```bash
cat > /etc/nginx/sites-available/mouthcaresolutions << 'EOF'
server {
    listen 80;
    server_name mouthcaresolutions.com www.mouthcaresolutions.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/mouthcaresolutions /etc/nginx/sites-enabled/

# Test config
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 4B: Setup Free SSL Certificate (HTTPS)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (automatically configures nginx too)
certbot --nginx -d mouthcaresolutions.com -d www.mouthcaresolutions.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose redirect HTTP → HTTPS (option 2)
```

SSL auto-renews:
```bash
# Certbot auto-renewal is already set up
# Verify:
certbot renew --dry-run
```

---

## STEP 5: Verify Everything Works

Open your browser and test these URLs:

| URL | What to Check |
|-----|---------------|
| `https://mouthcaresolutions.com` | Homepage loads with hero, services, doctors |
| `https://mouthcaresolutions.com/about` | About page |
| `https://mouthcaresolutions.com/doctors` | All 10 doctors listed |
| `https://mouthcaresolutions.com/services` | All dental services |
| `https://mouthcaresolutions.com/blog` | Blog listing page |
| `https://mouthcaresolutions.com/contact` | Contact form + Google Map |
| `https://mouthcaresolutions.com/rajeshark/login` | Admin login page |
| `https://mouthcaresolutions.com/sitemap.xml` | SEO sitemap |
| `https://mouthcaresolutions.com/robots.txt` | Robots file |

### Admin Access:
- **URL:** `https://mouthcaresolutions.com/rajeshark/login`
- **Username:** `admin`
- **Password:** `admin123`
- **⚠️ IMPORTANT:** Change the password after first login!

---

## STEP 6: Setup Auto-Blogger (Cron Job)

To automatically generate 2-3 blog posts per day, set up a cron job on your VPS:

```bash
crontab -e
```

Add these lines:
```cron
# Auto-blog: Generate posts at 9 AM, 1 PM, and 6 PM every day
0 9 * * * curl -s https://mouthcaresolutions.com/api/cron/autoblog >> /var/log/mcs-autoblog.log 2>&1
0 13 * * * curl -s https://mouthcaresolutions.com/api/cron/autoblog >> /var/log/mcs-autoblog.log 2>&1
0 18 * * * curl -s https://mouthcaresolutions.com/api/cron/autoblog >> /var/log/mcs-autoblog.log 2>&1
```

This will trigger your auto-blogger 3 times daily.

---

## 🔄 Alternative: Deploy to Vercel (Easiest, Free Tier)

If Hostinger VPS setup feels complex, **Vercel is the easiest option** and free:

### Vercel Steps:
1. Go to **[vercel.com](https://vercel.com/)** → Sign up (free)
2. Click **"Add New"** → **Project**
3. Upload your project files (or connect GitHub)
4. Vercel auto-detects Next.js and deploys
5. Go to **Settings** → **Domains** → Add `mouthcaresolutions.com`
6. Vercel gives you DNS records to add in **GoDaddy**:
   - **Type:** CNAME | **Host:** `@` | **Value:** `cname.vercel-dns.com`
   - **Type:** CNAME | **Host:** `www` | **Value:** `cname.vercel-dns.com`
7. Add those in GoDaddy DNS → Wait 1-4 hours
8. Vercel auto-provisions SSL certificate

### ⚠️ Vercel Limitation:
Vercel's free tier uses **serverless functions** and an **ephemeral filesystem** — SQLite won't persist data between deployments. For the blog database, you'd need to switch to:
- **Turso** (free SQLite cloud): turso.tech
- **PlanetScale** (free MySQL)
- **Vercel Postgres** (free tier)
- **Supabase** (free PostgreSQL)

### Switching to Turso (Recommended for Vercel):
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Sign up and create database
turso auth login
turso db create mcs-dental
turso db show mcs-dental --url  # Copy this URL

# Update your .env
DATABASE_URL="libsql://mcs-dental-xxx.turso.io"
```

---

## 📋 Quick Summary — Easiest Path

| Step | Where | What to Do |
|------|-------|------------|
| 1 | GoDaddy | Point DNS nameservers to Hostinger (or add A record to VPS IP) |
| 2 | Hostinger VPS | SSH in, install Node.js + PM2 + Nginx |
| 3 | VPS | Upload project files via SCP/Git |
| 4 | VPS | Run `npm install && npx prisma generate && npm run build` |
| 5 | VPS | `pm2 start npm --name mcs-website -- start` |
| 6 | VPS | Configure Nginx reverse proxy |
| 7 | VPS | `certbot --nginx` for free SSL/HTTPS |
| 8 | VPS | Set up cron job for auto-blogger |
| 9 | Browser | Test all pages at mouthcaresolutions.com |

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Site not loading | Check `pm2 status` and `pm2 logs mcs-website` |
| 502 Bad Gateway | Nginx can't reach Node.js — restart: `pm2 restart mcs-website` |
| SSL not working | Ensure DNS is fully propagated, then re-run `certbot --nginx` |
| Database errors | Check `db/custom.db` exists, run `npx prisma db push` |
| Permission denied | `chmod -R 755 /root/mouthcaresolutions` |
| Port 3000 in use | `pm2 delete all` then `pm2 start` again |
| Auto-blogger not running | Check cron: `crontab -l`, check logs: `tail /var/log/mcs-autoblog.log` |

---

## 🔐 Post-Deployment Checklist

- [ ] Change admin password from default
- [ ] Update JWT_SECRET in .env to a random 40+ char string
- [ ] Enable UFW firewall: `ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw enable`
- [ ] Set up automatic backups of `db/custom.db`
- [ ] Submit sitemap to Google Search Console: `https://search.google.com/search-console`
- [ ] Submit to Google Business Profile for Maps ranking
- [ ] Test mobile responsiveness on your phone
- [ ] Test WhatsApp button functionality
- [ ] Verify Google Maps embed loads correctly
