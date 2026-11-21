# GovGuide Split Deployment Guide

## Architecture

```
  Users
    |
    v
[Cloudflare Pages]  -->  [Oracle Cloud Free Tier]  -->  [Neon PostgreSQL]
  (React frontend)        (Spring Boot backend)          (Database)
  - Static files           - API endpoints
  - Global CDN             - Always-on (no cold starts)
  - Auto HTTPS             - ARM Ampere A1 (free)
```

## Part 1: Oracle Cloud Free Tier (Backend)

### Step 1: Create Oracle Cloud Account

1. Go to https://cloud.oracle.com/
2. Click **Start for Free**
3. Complete registration (credit card required but won't be charged for Always Free)
4. Select your home region (closest to your users, e.g., Mumbai for India)

### Step 2: Create Compute Instance

1. Go to **Compute > Instances > Create Instance**
2. Configure:
   - **Name**: `govguide-backend`
   - **Image**: Oracle Linux 8 (or 9)
   - **Shape**: Click **Change Shape** > **Ampere** > **VM.Standard.A1.Flex**
     - OCPUs: 1 (can use up to 4 free)
     - Memory: 6 GB (can use up to 24 GB free)
   - **Networking**: Create new VCN or use default
   - **SSH Key**: Upload your public key or generate a new pair (download it!)
3. Click **Create**
4. Wait for instance to be **Running**, note the **Public IP Address**

### Step 3: Open Port 8080

1. Go to **Networking > Virtual Cloud Networks**
2. Click your VCN > Click your Subnet > Click the **Security List**
3. Click **Add Ingress Rules**:
   - Source CIDR: `0.0.0.0/0`
   - Destination Port Range: `8080`
   - Description: `GovGuide API`
4. Click **Add Ingress Rules**

### Step 4: SSH and Setup

```bash
ssh opc@<YOUR_ORACLE_IP>
```

Open the firewall on the instance itself:
```bash
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

Install Java 21:
```bash
sudo dnf install -y java-21-openjdk
java -version
```

Create directories:
```bash
sudo mkdir -p /opt/govguide/{content,data}
sudo chown -R opc:opc /opt/govguide
```

### Step 5: Build and Upload Backend

On your local machine:
```bash
cd backend
./mvnw package -DskipTests -B
```

Upload to Oracle Cloud:
```bash
scp target/government-guide-companion-api-0.1.0-SNAPSHOT.jar opc@<ORACLE_IP>:/opt/govguide/app.jar
scp -r ../content/services opc@<ORACLE_IP>:/opt/govguide/content/
```

### Step 6: Configure and Run

SSH back in and create the environment file:
```bash
cat > /opt/govguide/govguide.env << 'EOF'
DB_URL=jdbc:postgresql://<NEON_HOST>/<DB_NAME>?sslmode=require
DB_USERNAME=<DB_USER>
DB_PASSWORD=<DB_PASSWORD>
APP_CORS_ALLOWED_ORIGINS=https://<YOUR_PROJECT>.pages.dev
GOVGUIDE_CONTENT_ROOT=/opt/govguide/content/services
JAVA_OPTS=-Xmx512m -Xms256m
EOF
```

Create systemd service (copy from `deploy/oracle-cloud-setup.sh` step 5) and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable govguide
sudo systemctl start govguide
```

Verify: `curl http://localhost:8080/api/v1/health`

### Step 7: (Optional) Set Up HTTPS with Caddy

For production HTTPS, install Caddy as a reverse proxy:
```bash
sudo dnf install -y 'dnf-command(copr)'
sudo dnf copr enable @caddy/caddy -y
sudo dnf install -y caddy

# Open ports 80 and 443
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

Also add ingress rules in Oracle Cloud Security List for ports 80 and 443.

Configure Caddy:
```bash
sudo tee /etc/caddy/Caddyfile > /dev/null << 'EOF'
api.govguide.yourdomain.com {
    reverse_proxy localhost:8080
}
EOF

sudo systemctl enable caddy
sudo systemctl start caddy
```

Point your domain's DNS A record to the Oracle Cloud IP.

---

## Part 2: Cloudflare Pages (Frontend)

### Step 1: Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account

### Step 2: Connect GitHub Repository

1. Go to **Workers & Pages** > **Create** > **Pages** > **Connect to Git**
2. Select your GitHub account and the **GovGuide** repository
3. Configure build:
   - **Framework preset**: None
   - **Build command**: `cd frontend-react && npm install && npm run build`
   - **Build output directory**: `frontend-react/dist`
4. Add environment variable:
   - `VITE_API_BASE` = `http://<ORACLE_IP>:8080` (or `https://api.govguide.yourdomain.com` if using Caddy)
5. Click **Save and Deploy**

### Step 3: Verify

1. Cloudflare will build and deploy automatically
2. Your site will be at `https://<project-name>.pages.dev`
3. Test that API calls work (open browser console, check network tab)

### Step 4: Custom Domain (Optional)

1. In Cloudflare Pages > your project > **Custom domains**
2. Add your domain (e.g., `govguide.yourdomain.com`)
3. Cloudflare handles SSL automatically

---

## Part 3: Update CORS on Backend

After getting your Cloudflare Pages URL, update CORS on Oracle Cloud:

```bash
ssh opc@<ORACLE_IP>
# Edit the env file
nano /opt/govguide/govguide.env
# Update APP_CORS_ALLOWED_ORIGINS with your actual Cloudflare Pages URL
# Restart
sudo systemctl restart govguide
```

---

## Comparison: Before vs After

| Aspect | Render (Before) | Cloudflare + Oracle Cloud (After) |
|--------|-----------------|-----------------------------------|
| Cold starts | 30-60 sec spinup | None (always running) |
| Frontend speed | Single server | Global CDN (200+ PoPs) |
| SSL | Included | Included (both) |
| Cost | Free (with cold starts) | Free tier (both) |
| Backend uptime | Spins down after 15 min idle | 24/7 always on |
| Build time | 5-8 min (combined) | ~30 sec (frontend only) |

---

## Keeping Render as Fallback

You can keep the Render deployment running as a backup. The Dockerfile still works for the monolithic deployment. Just don't remove it.
