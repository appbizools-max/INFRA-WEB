# InfraOps 360 â€” Product Requirements Document (PRD)

## Project Name
**InfraOps 360**

## Vision
InfraOps 360 is a modern, role-based infrastructure and operations management platform designed to manage field operations, workforce, assets, vehicles, documents, approvals, attendance, and reporting from a single system across Web and Mobile.

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend Framework | React + Vite |
| Frontend Language | TypeScript |
| Frontend Styling | Tailwind CSS |
| UI Components | Shadcn UI |
| Forms | React Hook Form |
| Validation | Zod |
| Data Fetching | TanStack Query |
| Global State | Zustand |
| Routing | React Router v6 |
| Web Authentication | Firebase Authentication (Web SDK) |
| Mobile Framework | React Native + Expo |
| Mobile Language | TypeScript |
| Mobile Styling | NativeWind |
| Mobile Data Fetching | TanStack Query |
| Mobile Global State | Zustand |
| Navigation | React Navigation v6 |
| Mobile Authentication | Firebase Authentication |
| Offline Storage | WatermelonDB (SQLite) |
| Camera | Expo Camera |
| GPS | Expo Location |
| Push Notifications | Firebase Cloud Messaging |
| Backend Framework | Express.js + TypeScript |
| API Type | REST |
| Database | PostgreSQL |
| ORM | Prisma |
| Backend Authentication | Firebase Admin SDK |
| File Storage | Local File System (VPS) |
| Payments | Razorpay |
| API Documentation | Swagger |
| Hosting | Hostinger VPS |
| Database Hosting | PostgreSQL on Hostinger VPS |
| Authentication Service | Firebase Authentication |
| SMS / OTP | Firebase Authentication |
| OCR (Phase 2) | AWS Textract |
| AI (Phase 4) | OpenAI / Gemini API |

---

# Monorepo Folder Structure

```text
infraops-360/
â”‚
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ web/
â”‚   â”œâ”€â”€ mobile/
â”‚   â””â”€â”€ api/
â”‚
â”œâ”€â”€ docs/
â”‚
â”œâ”€â”€ package.json
â”œâ”€â”€ tsconfig.json
â””â”€â”€ README.md
```

## Web Structure

```text
apps/web/src/
â”œâ”€â”€ assets/
â”œâ”€â”€ components/
â”œâ”€â”€ features/
â”œâ”€â”€ hooks/
â”œâ”€â”€ layouts/
â”œâ”€â”€ pages/
â”œâ”€â”€ routes/
â”œâ”€â”€ services/
â”œâ”€â”€ store/
â”œâ”€â”€ types/
â”œâ”€â”€ utils/
â””â”€â”€ main.tsx
```

## Mobile Structure

```text
apps/mobile/
â”œâ”€â”€ app/
â”œâ”€â”€ components/
â”œâ”€â”€ hooks/
â”œâ”€â”€ services/
â”œâ”€â”€ store/
â”œâ”€â”€ screens/
â”œâ”€â”€ navigation/
â”œâ”€â”€ database/
â””â”€â”€ assets/
```

## API Structure

```text
apps/api/src/
â”œâ”€â”€ config/
â”œâ”€â”€ controllers/
â”œâ”€â”€ middleware/
â”œâ”€â”€ routes/
â”œâ”€â”€ services/
â”œâ”€â”€ prisma/
â”œâ”€â”€ validators/
â”œâ”€â”€ utils/
â”œâ”€â”€ types/
â””â”€â”€ server.ts
```

# Development Roadmap

## Phase 1
- Project setup
- Authentication
- Role management
- Dashboard
- User management
- Company settings

## Phase 2
- Employee management
- Attendance
- Vehicle management
- Asset management
- Documents
- OCR integration

## Phase 3
- Operations
- Approvals
- Reports
- Notifications
- Offline mobile sync

## Phase 4
- Billing
- AI Assistant
- Analytics
- Predictions

# Task Breakdown

## Sprint 1
- Initialize monorepo
- Configure React + Vite
- Configure Expo
- Configure Express
- Configure PostgreSQL
- Configure Prisma
- Configure Firebase
- Setup authentication
- Create common layouts

## Sprint 2
- User CRUD
- Roles & Permissions
- Dashboard
- Profile Management

## Sprint 3
- Employee Module
- Attendance
- GPS
- Camera Uploads

## Sprint 4
- Vehicle Module
- Asset Module
- Documents
- Reports

## Sprint 5
- Payments
- Notifications
- Testing
- Deployment

# Coding Standards

- Use TypeScript everywhere.
- Keep business logic inside services.
- Thin controllers.
- Validate all input using Zod.
- Use TanStack Query for API calls.
- Use Zustand for global state.
- Follow REST conventions.
- Reusable components first.
- Mobile-first responsive UI.
- Feature-based architecture.

# Definition of Done

- Feature implemented.
- Validation completed.
- API integrated.
- UI responsive.
- Types complete.
- Error handling implemented.
- Tested manually.
- Documentation updated.
