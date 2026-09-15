# InfraOps 360 — System Architecture & Configuration Matrix

This document provides a comprehensive overview of the root directories, service configurations, database connection credentials, IP addresses, ports, and authentication keys for the InfraOps 360 workspace.

---

## 📂 1. Directory Structure

```
d:\Infraops360\Code3
├── apps/                        # Main multi-app container workspace
│   ├── backend/                 # Node.js / Express / PostgreSQL Backend API Server
│   ├── web/                     # React / Vite / TypeScript / Firebase Frontend Web App
│   ├── mobile/                  # React Native / Expo Mobile Application
│   ├── docker-compose.yml       # Docker Compose for local development environment
│   ├── docker-compose.prod.yml  # Docker Compose for production environment
│   └── .env                     # App-level environment configuration
```

### Git Repository Locations
- **Root Project Repository**: `https://github.com/appbizools-max/INFRA-WEB.git`
- **Apps Submodule/Sub-repository**: `https://github.com/appbizools-max/Infra_Ops.git`

---

## 🌐 2. IP Addresses, Hosts & Service Ports

| Service / Component | Host / IP Address | Port | Protocol | Usage / Access URL |
| :--- | :--- | :--- | :--- | :--- |
| **Backend REST Server** | `127.0.0.1` / `0.0.0.0` | **5000** | HTTP | `http://localhost:5000` / `http://0.0.0.0:5000` |
| **Web Frontend (Dev)** | `127.0.0.1` / `localhost` | **5173** | HTTP | `http://localhost:5173` |
| **Web Frontend (Prod Nginx)** | `0.0.0.0` | **8080** | HTTP | `http://localhost:8080` (Mapped to container port 80) |
| **PostgreSQL Database** | `127.0.0.1` / `db` | **5432** | TCP | `127.0.0.1:5432` (Container alias: `db:5432`) |
| **Legacy API Port** | `127.0.0.1` / `localhost` | **3000** | HTTP | `http://localhost:3000` |
| **Production Cloud Backend** | `infra-web-q8tb.onrender.com` | **443** | HTTPS | `https://infra-web-q8tb.onrender.com` |
| **Resend Email API Host** | `api.resend.com` | **443** | HTTPS | `https://api.resend.com/emails` |

---

## 🛢️ 3. Database Credentials & Connection Strings

### Primary Active PostgreSQL Connection (`apps/backend/.env`)
- **Database Engine**: PostgreSQL 15
- **Host**: `127.0.0.1` (Alias: `40easyapps360.com`)
- **Port**: `5432`
- **Database Name**: `postgres`
- **Username**: `postgres`
- **Password**: `infraops@40easyapps360.com`
- **Connection URI**:
  ```text
  postgresql://postgres:infraops@40easyapps360.com@127.0.0.1:5432/postgres
  ```

### Docker Local Development Database (`apps/docker-compose.yml`)
- **Container Name**: `infraops360_db`
- **Database Name**: `infraops360`
- **Username**: `postgres`
- **Password**: `infraops_dev_pass`
- **Docker Internal URI**:
  ```text
  postgresql://postgres:infraops_dev_pass@db:5432/infraops360
  ```

### Docker Production Database (`apps/docker-compose.prod.yml`)
- **Container Name**: `infraops360_db_prod`
- **Database Name**: `infraops360`
- **Username**: `postgres`
- **Password**: `infraops_prod_pass`
- **Production Internal URI**:
  ```text
  postgresql://postgres:infraops_prod_pass@db:5432/infraops360
  ```

---

## 🔐 4. Admin & Demo Credentials

### SaaS Super Admin Account
- **Admin Email**: `admin@easyapps360.com`
- **Password Hash**: `$2b$10$J8xLKIKkkApU0QOOxqvGLOUMRiaDy/d6W1RHZMHdq0MGGNpouIGae`
- **JWT Secret Key**: `infraops360_super_secret_jwt_key_2026`

### Client Demo Tenant Admin Account
- **Tenant Company**: `Bizools Software Services` (`BIZOOL` | Tenant ID `1`)
- **Admin Name**: `Preetham Ram`
- **Email**: `preethamram.avala2004@gmail.com`
- **Mobile Number**: `8374062188` (or `+918374062188`)
- **Universal Demo OTP / PIN**: **`123456`**

---

## 🔑 5. Third-Party Integrations & Firebase Config

### Firebase Client Configuration (`apps/web/.env`)
- **API Key**: `AIzaSyCa2l_OuSqRygbCUiFND6hVA6sxwSG4rCE`
- **Auth Domain**: `infraops360-2c3d9.firebaseapp.com`
- **Project ID**: `infraops360-2c3d9`

### Google & Resend Service Accounts
- **Google Application Credentials**: `./serviceAccountKey.json`
- **Resend Sender Email**: `InfraOps 360 <onboarding@easyapps360.com>`
- **Resend API Endpoint**: `https://api.resend.com/emails`
