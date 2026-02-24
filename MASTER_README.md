# UnderDesk Flow - Universal Setup & Operations Guide

Welcome to the **Master Documentation** for UnderDesk Flow. This document provides a unified overview of the platform's architecture, deployment, and operational workflows.

## 🏗️ Architecture Overview

UnderDesk Flow is built on a modern, high-performance stack designed for multi-tenant scalability.

- **Frontend**: Next.js 14+ (App Router) with Tailwind CSS & Shadcn/UI.
- **Backend**: Firebase Auth, Firestore, and Cloud Functions (V2).
- **Billing**: custom Stripe + Chile-specific gateway integrations (Webpay, Mercado Pago).
- **Logistics**: Universal Dispatch Orchestrator (UDO) for multi-channel shipping management.
- **Inventory**: Real-time synchronization with Shopify, Mercado Libre, and local warehouse.

## 🚀 Deployment & Operations

### Vercel Integration
The application is deployed on Vercel, leveraging:
- ISR (Incremental Static Regeneration) for store pages.
- Edge Functions for performance-critical middleware.
- Automatic Git-based deployment on `main`.

### CRON & Scheduled Tasks
Periodic tasks (Ledger audits, inventory sync, commission calculations) are handled via:
- Google Cloud Scheduler triggering Firebase Functions.
- Vercel Cron jobs for light-weight maintenance.

## 🛠️ Developer Guide

### Setup
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Configure `.env.local` with Firebase and Stripe credentials.
4. Run locally: `npm run dev`.

### Code Standards
- **Validation**: Strict Zod schemas for all form and API interactions.
- **Types**: 100% TypeScript coverage for core business logic.
- **UI**: Reusable components in `src/components/ui`.

## 📈 Roadmap

- [x] Universal Setup Wizard (Completed Feb 2026)
- [ ] Advanced BI Dashboard
- [ ] Mobile App for Drivers
- [ ] Global Kill-Switch for Logistics

---
*Created by the UnderDesk Flow Core Team.*
