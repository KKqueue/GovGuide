#!/bin/bash
# Oracle Cloud Free Tier - Backend Deployment Script
# Run this on your Oracle Cloud ARM instance after SSH-ing in

set -e

echo "=== GovGuide Backend Setup on Oracle Cloud Free Tier ==="

# 1. Install Java 21
echo "[1/6] Installing Java 21..."
sudo dnf install -y java-21-openjdk java-21-openjdk-devel
java -version

# 2. Create app directory
echo "[2/6] Creating application directory..."
sudo mkdir -p /opt/govguide
sudo mkdir -p /opt/govguide/content
sudo mkdir -p /opt/govguide/data
sudo chown -R opc:opc /opt/govguide

# 3. Copy files (run this from your local machine first):
# scp backend/target/government-guide-companion-api-0.1.0-SNAPSHOT.jar opc@<ORACLE_IP>:/opt/govguide/app.jar
# scp -r content/services opc@<ORACLE_IP>:/opt/govguide/content/

echo "[3/6] Checking for app.jar..."
if [ ! -f /opt/govguide/app.jar ]; then
    echo "ERROR: /opt/govguide/app.jar not found!"
    echo "Upload it from your local machine:"
    echo "  scp backend/target/government-guide-companion-api-0.1.0-SNAPSHOT.jar opc@<ORACLE_IP>:/opt/govguide/app.jar"
    exit 1
fi

# 4. Create environment file
echo "[4/6] Creating environment file..."
cat > /opt/govguide/govguide.env << 'ENVEOF'
# Database (Neon PostgreSQL)
DB_URL=jdbc:postgresql://YOUR_NEON_HOST/YOUR_DB?sslmode=require
DB_USERNAME=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD

# CORS - add your Cloudflare Pages domain
APP_CORS_ALLOWED_ORIGINS=https://YOUR_PROJECT.pages.dev,https://govguide.YOUR_DOMAIN.com

# Content directory
GOVGUIDE_CONTENT_ROOT=/opt/govguide/content/services

# Java memory settings (Oracle Free Tier ARM: up to 24GB RAM available)
JAVA_OPTS=-Xmx512m -Xms256m
ENVEOF

echo "  >>> EDIT /opt/govguide/govguide.env with your actual values! <<<"

# 5. Create systemd service
echo "[5/6] Creating systemd service..."
sudo tee /etc/systemd/system/govguide.service > /dev/null << 'SVCEOF'
[Unit]
Description=GovGuide Backend API
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/govguide
EnvironmentFile=/opt/govguide/govguide.env
ExecStart=/usr/bin/java $JAVA_OPTS -jar /opt/govguide/app.jar \
    --server.port=8080 \
    --spring.profiles.active=db \
    --app.data.dir=/opt/govguide/data
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVCEOF

# 6. Enable and start
echo "[6/6] Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable govguide
sudo systemctl start govguide
sudo systemctl status govguide

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit /opt/govguide/govguide.env with your actual database and CORS values"
echo "2. Restart: sudo systemctl restart govguide"
echo "3. Check logs: sudo journalctl -u govguide -f"
echo "4. Open port 8080 in Oracle Cloud Security List (VCN > Subnet > Security List > Ingress Rules)"
echo "5. Open port 8080 in instance firewall: sudo firewall-cmd --permanent --add-port=8080/tcp && sudo firewall-cmd --reload"
