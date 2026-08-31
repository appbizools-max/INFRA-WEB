# Authentication & Registration Flow Update

You requested a completely new 2-step authentication flow for regular users (Tenants) on both Web and Mobile.

## Goal
Implement a "Create Account" flow that captures user details and enforces a dual OTP verification (Email + Mobile). Additionally, provide users the option to log in using either their Mobile Number or Email Address.

## User Review Required

> [!WARNING]
> **Firebase Limitations on Email OTPs**
> Firebase natively supports sending 6-digit OTPs to **Mobile Numbers** via SMS. However, it **DOES NOT** natively support sending 6-digit OTPs to **Email Addresses**. Firebase only supports "Magic Links" for emails. 
> 
> To implement a true 6-digit Email OTP as you requested, we have two options:

## Open Questions

1. **How should we handle Email OTPs?**
   - **Option A (Recommended):** Build a custom email OTP service in our Node.js backend using `nodemailer`. We will generate a 6-digit code, email it, and verify it on our backend before creating the Firebase user.
   - **Option B:** Use Firebase's native "Email Magic Link" instead of a 6-digit OTP for the email verification step.

2. **How should Email Login work for existing users?**
   - When a user chooses "Log in with Email", should they enter a **Password**, or should we send them another **Email OTP**?

## Proposed Changes

### 1. Backend (`apps/backend`)
- Add new endpoints for Email OTP generation and verification.
- `POST /api/auth/send-email-otp`
- `POST /api/auth/verify-email-otp`

### 2. Web App (`apps/web/src/components/auth/LoginForm.tsx`)
- Add an "Email vs Mobile" toggle back to the login screen for existing users.
- Add a "Create Account" toggle.
- Create a multi-step registration UI:
  - **Step 1:** Name, Email, Mobile, Terms & Conditions checkbox.
  - **Step 2:** Dual OTP Input (one for SMS, one for Email).

### 3. Mobile App (`apps/mobile/src/auth/PhoneLoginScreen.tsx`)
- Mirror the exact same UI and logic from the Web App.
- Re-add the Email login option (either password or OTP based on your preference).
- Add the "Create Account" dual-OTP flow.

## Verification Plan
- Register a test account and verify both the SMS OTP (via Firebase test numbers) and the Email OTP.
- Attempt to log in using the mobile number.
- Attempt to log in using the email address.
