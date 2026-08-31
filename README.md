# InfraOps 360 – Enterprise Infrastructure & Logistics Platform

InfraOps 360 is a full-stack multi-tenant platform designed for heavy logistics, mining, port operations, and industrial worksite management. It features a Web Command Center, an Android/iOS Field Mobile Application, and a scalable RESTful Express backend service.

---

##  Repository Structure

This repository is structured as a clean monorepo:

```
├── apps/
│   ├── backend/    # Express.js REST API server & PostgreSQL database integration
│   ├── web/        # React + TypeScript + Tailwind CSS Web Command Center (Vite)
│   └── mobile/     # React Native + Expo Cross-Platform Mobile Application
├── README.md       # Project Overview & Setup Instructions
└── .gitignore      # Monorepo version control rules
```

---

##  Quick Start & Local Setup

### Prerequisites
- **Node.js**: `v18.x` or higher
- **PostgreSQL**: `v14.x` or higher
- **npm** or **yarn**

---

### 1. Backend Setup (`apps/backend`)

1. Navigate to the backend directory:
   ```bash
   cd apps/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the database migration script:
   ```bash
   npm run db:init
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   *Backend server runs by default on `http://localhost:5000`.*

---

### 2. Web Application Setup (`apps/web`)

1. Navigate to the web directory:
   ```bash
   cd apps/web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Web application opens on `http://localhost:5173`.*

---

### 3. Mobile Application Setup (`apps/mobile`)

1. Navigate to the mobile directory:
   ```bash
   cd apps/mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npm run android  # For Android Emulator / Device
   # or
   npm run ios      # For iOS Simulator
   ```

---

##  Key Features & Modules

- **Multi-Tenant Architecture**: Dynamic subdomains, plan-based feature gates, custom branding.
- **Passwordless Authentication**: 2-Factor Authentication (Email & SMS OTPs) backed by Firebase & Custom Token minting.
- **Projects & Work Sites Management**: Real-time worksite monitoring, geofencing, and supervisory controls.
- **Access & Controls**: Fine-grained role-based permissions (Admin, HR, Field Operator).
- **Accounts & Financials**: Invoicing, client & vendor management, expense tracking.
- **HR & Team Management**: Employee profiles, digital onboarding, department assignment.

---

##  Tech Stack

- **Backend**: Express.js, TypeScript, PostgreSQL (`pg`), Node-Resend, Firebase Admin SDK.
- **Web App**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite, React Router v6.
- **Mobile App**: React Native, Expo, React Navigation, Feather Icons.
- **Auth**: Firebase Auth + Passwordless OTP Verification.

---

## License

Private & Proprietary — InfraOps 360 © 2026. All rights reserved.
