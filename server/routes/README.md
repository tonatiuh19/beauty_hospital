# Route Management System

This document explains how to easily import and use routes from the `server/routes/` folder in your API.

## Quick Start

### 1. Generate Route Imports

Run this command to see all available route handlers:

```bash
npm run routes:generate
```

This will show you all the export names from each route file and provide ready-to-copy import statements.

### 2. Import Route Handlers

Add the import statements to your `api/index.ts` file:

```typescript
// Import route handlers
import { handleDemo } from "../server/routes/demo";
import {
  handleGetServices,
  handleGetServiceById,
} from "../server/routes/services";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} from "../server/routes/appointments";
```

### 3. Add Routes to Express App

In the `createServer()` function, add your routes:

```typescript
// Demo routes
expressApp.get("/api/demo", handleDemo);

// Services routes
expressApp.get("/api/services", handleGetServices);
expressApp.get("/api/services/:id", handleGetServiceById);

// Appointments routes
expressApp.post("/api/appointments", createAppointment);
expressApp.get("/api/appointments", getAppointments);
expressApp.get("/api/appointments/:id", getAppointmentById);
expressApp.put("/api/appointments/:id", updateAppointment);
expressApp.delete("/api/appointments/:id", cancelAppointment);
```

## Available Route Files

- `admin-appointments.ts` - Admin appointment management
- `admin-auth.ts` - Admin authentication
- `admin-dashboard.ts` - Admin dashboard data
- `admin-patients.ts` - Admin patient management
- `admin-payments.ts` - Admin payment management
- `admin-services.ts` - Admin service management
- `admin-settings.ts` - Admin settings
- `appointments-payment.ts` - Appointment payment processing
- `appointments.ts` - Public appointment booking
- `auth-passwordless.ts` - Passwordless authentication (OTP)
- `auth.ts` - Standard authentication
- `blocked-dates.ts` - Calendar blocked dates
- `business-hours.ts` - Business hours management
- `demo.ts` - Demo/test endpoints
- `services.ts` - Public services listing

## Route Organization

The routes are organized into two main categories:

### Core Routes (`/api/...`)

Public-facing routes for customers:

- Authentication and registration
- Appointment booking
- Service browsing
- Payment processing

### Admin Routes (`/api/admin/...`)

Administrative routes for clinic management:

- Admin authentication
- Patient management
- Appointment administration
- Payment management
- Settings and configuration

## Tips

1. **Use the generator script** - Always run `npm run routes:generate` to see current exports
2. **Import only what you need** - Don't import all handlers if you only need a few
3. **Follow naming conventions** - Route handlers should be descriptive (e.g., `handleGetServices`, `createAppointment`)
4. **Group related routes** - Keep related functionality together in the same file
5. **Add middleware as needed** - Use authentication middleware for protected routes

## Example: Adding a New Route Category

1. Create a new route file: `server/routes/my-new-feature.ts`
2. Export your handlers:
   ```typescript
   export const handleGetMyData: RequestHandler = async (req, res) => {
     // Implementation
   };
   ```
3. Run `npm run routes:generate` to see your new exports
4. Import and add to your API file:

   ```typescript
   import { handleGetMyData } from "../server/routes/my-new-feature";

   // In createServer():
   expressApp.get("/api/my-data", handleGetMyData);
   ```

## File Structure Reference

```
api/
├── index.ts              # Main API file - import routes here

server/
├── routes/
│   ├── index.ts          # Route organization helper
│   ├── demo.ts           # Demo routes
│   ├── services.ts       # Service routes
│   ├── appointments.ts   # Appointment routes
│   ├── auth.ts          # Auth routes
│   └── ...              # Other route files
└── utils/
    └── route-config.ts   # Route patterns reference

scripts/
└── generate-route-imports.js  # Import generator script
```
