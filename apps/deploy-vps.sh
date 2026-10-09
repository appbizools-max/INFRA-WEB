#!/bin/bash
# ==============================================================================
# InfraOps 360 - Hostinger VPS Docker Deployment & Update Script
# ==============================================================================

set -e

echo "🚀 Starting InfraOps 360 Docker deployment on Hostinger VPS..."

# 1. Update repository
echo "📥 Pulling latest updates from GitHub..."
git pull origin main

# 2. Check for .env file or create template if missing
if [ ! -f .env ]; then
  echo "⚠️ .env file not found. Creating a production .env template..."
  SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
  cat <<EOF > .env
# Production Environment Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=infraops_prod_pass
POSTGRES_DB=infraops360
DATABASE_PORT=5432
BACKEND_PORT=5000
BACKEND_DATABASE_URL=postgresql://postgres:infraops_prod_pass@db:5432/infraops360

# Frontend Configuration (Points browser to this VPS IP/domain)
VITE_API_URL=http://${SERVER_IP}:5000
VITE_FIREBASE_API_KEY=AIzaSyCa2l_OuSqRygbCUiFND6hVA6sxwSG4rCE
VITE_FIREBASE_AUTH_DOMAIN=infraops360-2c3d9.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=infraops360-2c3d9
EOF
  echo "✅ Created default .env (API pointing to http://${SERVER_IP}:5000)"
fi

# 3. Build & start containers
echo "🐳 Building and starting Docker containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml up -d --build

# 4. Show container status
echo ""
echo "🎉 Deployment finished successfully!"
echo "--------------------------------------------------"
docker compose -f docker-compose.prod.yml ps
echo "--------------------------------------------------"
echo "🌐 Web App is running at: http://<YOUR_VPS_IP>:8080"
echo "🔌 Backend API is running at: http://<YOUR_VPS_IP>:5000"
echo "--------------------------------------------------"
