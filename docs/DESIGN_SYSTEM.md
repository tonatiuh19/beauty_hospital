# Design System Reference

> Extracted from the web app — use this as the source of truth for new features, mobile apps, and all design/development work.

---

## General Info

### What is All Beauty Luxury & Wellness?

**All Beauty Luxury & Wellness** is a **medical aesthetics clinic management system** with a public-facing booking site and a full internal CRM for clinic staff. It enables patients to book appointments online, process payments via Stripe, check in via QR code, and manage their history. Staff use the admin panel to manage appointments, patients, contracts, payments, invoices, medical records, and services.

### Who Uses It

| User Type         | Role in DB      | Description                                                                                                 |
| ----------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| **Patient**       | `patient`       | End customer. Books appointments online, logs in via OTP, manages their appointments at `/my-appointments`. |
| **Admin**         | `admin`         | Clinic owner / senior manager. Full access to appointments, patients, contracts, payments, services.        |
| **General Admin** | `general_admin` | Full back-office access including users management, medical records, and system settings.                   |
| **Receptionist**  | `receptionist`  | Front-desk staff. Can manage appointments, patients, contracts, payments, and invoices.                     |
| **Doctor**        | `doctor`        | Medical staff. Can view patients and manage medical records.                                                |
| **POS**           | `pos`           | Point-of-sale operator. Can manage appointments, patients, contracts, payments, and invoices.               |

### Core Workflow

```
1. Patient visits the public landing page at /
        ↓
2. Patient clicks "Book Appointment" → /appointment
        ↓
3. Patient selects service, date/time, and fills out info
        ↓
4. Patient logs in (OTP to email) or creates an account
        ↓
5. Patient pays via Stripe → appointment confirmed
        ↓
6. Day of appointment: patient scans QR code at /check-in
        ↓
7. Receptionist/Admin sees check-in in the admin panel → /admin/appointments
        ↓
8. Doctor records medical notes in /admin/medical-records
        ↓
9. Contracts are generated and signed digitally (DocuSign or in-house canvas)
        ↓
10. Invoices generated and sent to patient
        ↓
11. Notifications sent via Email, SMS (Twilio), or WhatsApp
```

### Key Feature Modules

| Module                  | Description                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Landing Page**        | Public marketing site with Hero, Services, Features, Process, Testimonials, FAQ, and CTA sections.                |
| **Appointment Booking** | Multi-step wizard: select service → select date/time → patient info → login/register → Stripe payment.            |
| **Patient Portal**      | `/my-appointments` — patient views and manages their own appointments after logging in.                           |
| **QR Check-In**         | `/check-in` — patients scan a QR code on arrival; staff confirm check-in; optionally sign contract.               |
| **Admin Dashboard**     | KPIs and overview metrics for the clinic.                                                                         |
| **Appointments**        | Calendar view of all appointments; admin can filter, edit, cancel, and confirm.                                   |
| **Patient Management**  | Full CRUD for patient records including demographics, notes, and history.                                         |
| **Contracts**           | Digital treatment contracts with in-browser signature canvas and DocuSign integration for multi-session packages. |
| **Payments**            | Stripe-integrated payment records, refund tracking, and manual payment entries.                                   |
| **Invoices**            | Invoice generation and management tied to appointments and payments.                                              |
| **Medical Records**     | Doctors attach diagnoses, treatments, allergies, medications, and media (photos/files) per patient.               |
| **Services**            | CRUD for clinic services (laser hair removal, facials, body treatments, consultations, etc.).                     |
| **Blocked Dates**       | Admin blocks specific dates or time ranges to prevent bookings.                                                   |
| **Users Management**    | `general_admin` manages internal staff accounts (create, update, deactivate).                                     |
| **Settings**            | Business hours, clinic configuration, and system-level settings.                                                  |
| **Notifications**       | Email (Nodemailer), SMS and WhatsApp (Twilio) notifications sent at key events.                                   |

### Tech Stack Summary

| Layer          | Technology                                                                               |
| -------------- | ---------------------------------------------------------------------------------------- |
| Frontend       | React 18, TypeScript, Vite, TailwindCSS 3, Redux Toolkit, React Router v6, Framer Motion |
| UI Components  | Radix UI primitives + shadcn/ui component library                                        |
| Backend        | Node.js, Express 5 (single `api/index.ts` serverless function)                           |
| Database       | MySQL 8.0 (hosted on HostGator cPanel)                                                   |
| Payments       | Stripe (`@stripe/react-stripe-js`, `@stripe/stripe-js`, `stripe` server SDK)             |
| Notifications  | Nodemailer (email), Twilio (SMS + WhatsApp)                                              |
| Contracts      | DocuSign SDK (`docusign-esign`), in-browser `react-signature-canvas`                     |
| Deployment     | Vercel (frontend + serverless API) + HostGator MySQL                                     |
| OTP Auth       | Passwordless — 6-digit numeric code delivered via email                                  |
| PDF Generation | `jspdf`, `pdfkit`                                                                        |
| QR Code        | `qrcode.react`, `html5-qrcode` (scanner)                                                 |
| Forms          | Formik + Yup validation                                                                  |

### Vercel Deployment & API Routing

```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.ts" },
    { "src": "/(.*\\.(js|css|png|jpg|...))", "dest": "/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

| Path pattern  | Handled by                                  | Description                                    |
| ------------- | ------------------------------------------- | ---------------------------------------------- |
| `/api/*`      | `api/index.ts` (Vercel Serverless Function) | Every API call — Express app as serverless fn  |
| Static assets | `dist/` (Vite build output)                 | Compiled frontend assets                       |
| Everything    | `index.html`                                | React SPA — client-side routing handles routes |

---

## Logo

| Usage              | Path / URL                                   |
| ------------------ | -------------------------------------------- |
| Primary logo (PNG) | `client/assets/images/logos/logo-header.png` |
| Logo component     | `client/components/Logo.tsx`                 |
| Brand name         | All Beauty Luxury & Wellness                 |

### Logo Component Usage

```tsx
import { Logo } from "@/components/Logo";

// Full logo (default)
<Logo />

// Icon only
<Logo variant="icon" />

// Light background (no filter)
<Logo inverted={false} />

// Dark background (brightness-0 invert)
<Logo inverted={true} />
```

---

## Typography

### Font Families

Two fonts are used — one serif for display/headings, one sans-serif for body text.

**Imported from Google Fonts:**

```
https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600;700;800&family=Nunito+Sans:wght@400;500;600;700;800&display=swap
```

| Font          | Role     | Tailwind class | CSS variable         |
| ------------- | -------- | -------------- | -------------------- |
| `Newsreader`  | Headings | `font-heading` | `fontFamily.heading` |
| `Nunito Sans` | Body/UI  | `font-sans`    | `fontFamily.sans`    |

### Font Weights

| Weight    | Value | Usage                       |
| --------- | ----- | --------------------------- |
| Regular   | 400   | Body text, labels, captions |
| Medium    | 500   | Subtext, secondary labels   |
| SemiBold  | 600   | Buttons, emphasized text    |
| Bold      | 700   | Headings, section titles    |
| ExtraBold | 800   | Hero display text           |

### Type Scale (Tailwind)

| Class       | Size | Usage                |
| ----------- | ---- | -------------------- |
| `text-xs`   | 12px | Fine print, captions |
| `text-sm`   | 14px | Secondary labels     |
| `text-base` | 16px | Body text (default)  |
| `text-lg`   | 18px | Lead text            |
| `text-xl`   | 20px | Section subheadings  |
| `text-2xl`  | 24px | Section headings     |
| `text-3xl`  | 30px | Page titles          |
| `text-4xl`  | 36px | Hero subheadings     |
| `text-5xl`  | 48px | Hero headings        |
| `text-6xl`  | 60px | Large hero text      |

---

## Color Palette

All colors are defined as HSL CSS variables in `client/global.css`. Tailwind tokens are configured in `tailwind.config.ts`.

### Light Mode

| Token                    | HSL           | HEX (approx) | Description                            |
| ------------------------ | ------------- | ------------ | -------------------------------------- |
| `background`             | `45 100% 94%` | `#FFF5E1`    | App background — warm light cream      |
| `foreground`             | `0 0% 0%`     | `#000000`    | Default text — pure black              |
| `card`                   | `0 0% 100%`   | `#FFFFFF`    | Card/surface background                |
| `card-foreground`        | `0 0% 0%`     | `#000000`    | Text on cards                          |
| `primary`                | `40 45% 57%`  | `#C9A159`    | Brand gold — buttons, CTAs, highlights |
| `primary-foreground`     | `0 0% 100%`   | `#FFFFFF`    | Text on primary gold                   |
| `secondary`              | `42 58% 70%`  | `#DFC07A`    | Light gold — secondary elements        |
| `secondary-foreground`   | `0 0% 0%`     | `#000000`    | Text on secondary                      |
| `muted`                  | `0 0% 94%`    | `#F0F0F0`    | Disabled/inactive backgrounds          |
| `muted-foreground`       | `0 0% 25%`    | `#404040`    | Placeholder & hint text                |
| `accent`                 | `40 45% 57%`  | `#C9A159`    | Same as primary — accent surfaces      |
| `accent-foreground`      | `0 0% 100%`   | `#FFFFFF`    | Text on accent                         |
| `destructive`            | `0 70% 50%`   | `#D93030`    | Errors, delete, danger actions         |
| `destructive-foreground` | `0 0% 100%`   | `#FFFFFF`    | Text on destructive                    |
| `border`                 | `0 0% 94%`    | `#F0F0F0`    | Dividers and input borders             |
| `input`                  | `0 0% 94%`    | `#F0F0F0`    | Input border/background                |
| `ring`                   | `40 45% 57%`  | `#C9A159`    | Focus ring — same as primary           |

### Dark Mode

| Token                    | HSL           | HEX (approx) | Description               |
| ------------------------ | ------------- | ------------ | ------------------------- |
| `background`             | `0 0% 7%`     | `#121212`    | Dark screen background    |
| `foreground`             | `45 100% 94%` | `#FFF5E1`    | Text on dark — warm cream |
| `card`                   | `0 0% 13%`    | `#212121`    | Dark card surface         |
| `card-foreground`        | `45 100% 94%` | `#FFF5E1`    | Text on dark cards        |
| `primary`                | `40 45% 57%`  | `#C9A159`    | Same brand gold           |
| `primary-foreground`     | `0 0% 0%`     | `#000000`    | Text on primary (dark)    |
| `secondary`              | `42 58% 70%`  | `#DFC07A`    | Light gold (same)         |
| `secondary-foreground`   | `0 0% 0%`     | `#000000`    | Text on secondary         |
| `muted`                  | `0 0% 25%`    | `#404040`    | Dark muted surface        |
| `muted-foreground`       | `0 0% 94%`    | `#F0F0F0`    | Subdued text on dark      |
| `accent`                 | `40 45% 57%`  | `#C9A159`    | Same brand gold           |
| `accent-foreground`      | `0 0% 0%`     | `#000000`    | Text on accent (dark)     |
| `destructive`            | `0 70% 45%`   | `#C42B2B`    | Dark destructive tone     |
| `destructive-foreground` | `0 0% 100%`   | `#FFFFFF`    | Text on destructive       |
| `border`                 | `0 0% 25%`    | `#404040`    | Dark borders              |
| `input`                  | `0 0% 25%`    | `#404040`    | Dark input border         |
| `ring`                   | `40 45% 57%`  | `#C9A159`    | Focus ring on dark        |

### Sidebar Colors (Admin Panel)

The admin sidebar uses **deep black tones** in both light and dark mode — it is always dark-themed regardless of the app color scheme.

| Token                        | Light HSL    | Light HEX | Dark HSL     | Dark HEX  |
| ---------------------------- | ------------ | --------- | ------------ | --------- |
| `sidebar-background`         | `0 0% 13%`   | `#212121` | `0 0% 7%`    | `#121212` |
| `sidebar-foreground`         | `0 0% 94%`   | `#F0F0F0` | `0 0% 94%`   | `#F0F0F0` |
| `sidebar-primary`            | `0 0% 7%`    | `#121212` | `40 45% 57%` | `#C9A159` |
| `sidebar-primary-foreground` | `0 0% 94%`   | `#F0F0F0` | `0 0% 0%`    | `#000000` |
| `sidebar-accent`             | `0 0% 25%`   | `#404040` | `0 0% 13%`   | `#212121` |
| `sidebar-accent-foreground`  | `0 0% 94%`   | `#F0F0F0` | `0 0% 94%`   | `#F0F0F0` |
| `sidebar-border`             | `0 0% 25%`   | `#404040` | `0 0% 25%`   | `#404040` |
| `sidebar-ring`               | `40 45% 57%` | `#C9A159` | `40 45% 57%` | `#C9A159` |

### Luxury Brand Palette (Custom Tailwind Colors)

These are the hand-crafted luxury colors from `tailwind.config.ts`, used in components for rich gold/black aesthetics.

| Token                | HEX       | Usage                                         |
| -------------------- | --------- | --------------------------------------------- |
| `luxury-black`       | `#000000` | Pure black backgrounds                        |
| `luxury-black-light` | `#111111` | Slightly lighter black                        |
| `luxury-gray-dark`   | `#212121` | Dark gray for sidebar/panels                  |
| `luxury-gray-medium` | `#3F3F3F` | Medium gray dividers                          |
| `luxury-gold-dark`   | `#C9A159` | Rich gold — primary brand color               |
| `luxury-gold-light`  | `#E8C580` | Light gold — secondary highlights             |
| `luxury-cream-dark`  | `#F9E6BD` | Warm cream for dark text on light backgrounds |
| `luxury-cream-light` | `#FFF5E1` | Very light cream — app background             |
| `luxury-beige`       | `#EFEFEF` | Neutral beige dividers                        |

### Semantic Colors

| Token     | HEX       | Foreground | Usage                         |
| --------- | --------- | ---------- | ----------------------------- |
| `success` | `#10B981` | `#FFFFFF`  | Success states, confirmations |
| `warning` | `#F59E0B` | `#000000`  | Caution indicators            |
| `danger`  | `#EF4444` | `#FFFFFF`  | Errors, destructive actions   |

---

## Border Radius

| Token      | Value                       | Computed | Usage                 |
| ---------- | --------------------------- | -------- | --------------------- |
| `--radius` | `1rem`                      | `16px`   | Base radius variable  |
| `lg`       | `var(--radius)`             | `16px`   | Cards, modals, panels |
| `md`       | `calc(var(--radius) - 2px)` | `14px`   | Inputs, buttons       |
| `sm`       | `calc(var(--radius) - 4px)` | `12px`   | Badges, tags, chips   |

---

## Spacing Scale (Tailwind defaults, rem-based)

`1rem = 16px`

| Tailwind | px   |
| -------- | ---- |
| `1`      | 4px  |
| `2`      | 8px  |
| `3`      | 12px |
| `4`      | 16px |
| `5`      | 20px |
| `6`      | 24px |
| `8`      | 32px |
| `10`     | 40px |
| `12`     | 48px |
| `16`     | 64px |
| `20`     | 80px |
| `24`     | 96px |

---

## Animations

All animations are defined in `client/global.css` keyframes and exposed as Tailwind utility classes via `@layer utilities`.

### Custom Keyframe Animations

| Class                    | Keyframe       | Duration | Easing                 | Effect                        |
| ------------------------ | -------------- | -------- | ---------------------- | ----------------------------- |
| `animate-fade-in-up`     | `fadeInUp`     | `0.6s`   | `ease-out`             | Fade in + slide up 30px       |
| `animate-fade-in-down`   | `fadeInDown`   | `0.6s`   | `ease-out`             | Fade in + slide down 30px     |
| `animate-slide-in-left`  | `slideInLeft`  | `0.6s`   | `ease-out`             | Fade in + slide in from left  |
| `animate-slide-in-right` | `slideInRight` | `0.6s`   | `ease-out`             | Fade in + slide in from right |
| `animate-scale-in`       | `scaleIn`      | `0.6s`   | `ease-out`             | Fade in + scale from 0.95 → 1 |
| `animate-glow`           | `glow`         | `3s`     | `ease-in-out infinite` | Pink glow pulse on box-shadow |

### UI Component Animations (Tailwind Config)

| Class                    | Duration | Easing              | Effect                            |
| ------------------------ | -------- | ------------------- | --------------------------------- |
| `animate-accordion-down` | `0.2s`   | `ease-out`          | Accordion open (height expand)    |
| `animate-accordion-up`   | `0.2s`   | `ease-out`          | Accordion close (height collapse) |
| `animate-fade-in-up`     | `0.6s`   | `ease-out forwards` | Fade + slide from bottom          |
| `animate-fade-in-down`   | `0.6s`   | `ease-out forwards` | Fade + slide from top             |

### Framer Motion

Page sections and interactive elements use **Framer Motion** for richer animations:

```typescript
// Standard entrance variant pattern used across pages
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Usage
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <motion.h1 variants={itemVariants}>Title</motion.h1>
</motion.div>
```

### Text Gradient Utility

```css
/* Defined in global.css @layer utilities */
.text-gradient {
  @apply bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent;
}
```

---

## Icons

Two icon libraries are used:

| Library        | Import                                   | Style Used                              | Usage                               |
| -------------- | ---------------------------------------- | --------------------------------------- | ----------------------------------- |
| `react-icons`  | `import { Md... } from "react-icons/md"` | Material Design Outlined (`MdOutline*`) | Admin panel navigation, admin forms |
| `lucide-react` | `import { ... } from "lucide-react"`     | Lucide outline                          | Public pages, header, CTAs          |

**Preference:** Use `lucide-react` for new public-facing components. Use `react-icons/md` when matching the existing admin panel style.

---

## Component Library (`client/components/ui/`)

Pre-built components based on Radix UI primitives + shadcn/ui conventions. **Always check this directory before creating new components.**

| Component         | File                        | Description                               |
| ----------------- | --------------------------- | ----------------------------------------- |
| `Accordion`       | `accordion.tsx`             | Collapsible content panels                |
| `AlertDialog`     | `alert-dialog.tsx`          | Confirmation/destructive action dialogs   |
| `Alert`           | `alert.tsx`                 | Inline status messages                    |
| `Avatar`          | `avatar.tsx`                | User initials or image avatar             |
| `Badge`           | `badge.tsx`                 | Status pills / count labels               |
| `Button`          | `button.tsx`                | Primary action button (multiple variants) |
| `Calendar`        | `calendar.tsx`              | Date picker (based on react-day-picker)   |
| `Card`            | `card.tsx`                  | Content container with header/footer      |
| `Carousel`        | `carousel.tsx`              | Swipeable content carousel                |
| `Chart`           | `chart.tsx`                 | Recharts-based chart wrapper              |
| `Checkbox`        | `checkbox.tsx`              | Radix checkbox                            |
| `Dialog`          | `dialog.tsx`                | Modal dialog                              |
| `Drawer`          | `drawer.tsx`                | Bottom/side drawer                        |
| `DropdownMenu`    | `dropdown-menu.tsx`         | Contextual dropdown menus                 |
| `Form`            | `form.tsx`                  | React Hook Form integration               |
| `Input`           | `input.tsx`                 | Text input field                          |
| `InputOTP`        | `input-otp.tsx`             | 6-digit OTP code input                    |
| `Label`           | `label.tsx`                 | Accessible form labels                    |
| `Popover`         | `popover.tsx`               | Floating content anchored to a trigger    |
| `Progress`        | `progress.tsx`              | Progress bar                              |
| `RadioGroup`      | `radio-group.tsx`           | Radio button group                        |
| `ScrollArea`      | `scroll-area.tsx`           | Custom scrollbar container                |
| `Select`          | `select.tsx`                | Dropdown select                           |
| `Separator`       | `separator.tsx`             | Horizontal/vertical divider               |
| `Sheet`           | `sheet.tsx`                 | Slide-over panel (mobile sidebar)         |
| `Sidebar`         | `sidebar.tsx`               | Admin sidebar with collapse support       |
| `Skeleton`        | `skeleton.tsx`              | Loading placeholder                       |
| `Slider`          | `slider.tsx`                | Range input slider                        |
| `Sonner`          | `sonner.tsx`                | Toast notifications (sonner)              |
| `Switch`          | `switch.tsx`                | Toggle switch                             |
| `Table`           | `table.tsx`                 | Styled HTML table                         |
| `Tabs`            | `tabs.tsx`                  | Tab navigation                            |
| `Textarea`        | `textarea.tsx`              | Multi-line text input                     |
| `Toast`/`Toaster` | `toast.tsx` / `toaster.tsx` | Toast system (radix-based)                |
| `Tooltip`         | `tooltip.tsx`               | Hover tooltip                             |

---

## Page Components (`client/components/`)

Reusable section/feature components used across the public site and booking flow.

| Component                      | File                               | Used On                 |
| ------------------------------ | ---------------------------------- | ----------------------- |
| `Header`                       | `Header.tsx`                       | All public pages        |
| `Footer`                       | `Footer.tsx`                       | All public pages        |
| `HeroSection`                  | `HeroSection.tsx`                  | `/`                     |
| `ServicesSection`              | `ServicesSection.tsx`              | `/`                     |
| `FeaturesSection`              | `FeaturesSection.tsx`              | `/`                     |
| `ProcessSection`               | `ProcessSection.tsx`               | `/`                     |
| `TestimonialsSection`          | `TestimonialsSection.tsx`          | `/`                     |
| `CTASection`                   | `CTASection.tsx`                   | `/`                     |
| `FAQSection`                   | `FAQSection.tsx`                   | `/`                     |
| `AppointmentWizard`            | `AppointmentWizard.tsx`            | `/appointment`          |
| `AppointmentCalendar`          | `AppointmentCalendar.tsx`          | `/appointment`          |
| `SimpleCalendar`               | `SimpleCalendar.tsx`               | `/appointment`          |
| `AppointmentConfirmationModal` | `AppointmentConfirmationModal.tsx` | `/appointment`          |
| `EditAppointmentModal`         | `EditAppointmentModal.tsx`         | `/my-appointments`      |
| `AuthModal`                    | `AuthModal.tsx`                    | Booking flow            |
| `StripeCheckoutForm`           | `StripeCheckoutForm.tsx`           | Booking payment         |
| `CheckInWithContract`          | `CheckInWithContract.tsx`          | `/check-in`             |
| `SignatureCanvas`              | `SignatureCanvas.tsx`              | Contracts, check-in     |
| `InvoiceRequestModal`          | `InvoiceRequestModal.tsx`          | Patient portal          |
| `LoadingMask`                  | `LoadingMask.tsx`                  | Global (always mounted) |
| `ErrorModal`                   | `ErrorModal.tsx`                   | Error states            |
| `MetaHelmet`                   | `MetaHelmet.tsx`                   | All pages (SEO)         |
| `Logo`                         | `Logo.tsx`                         | Header, Admin           |

---

## Authentication

The app has **two completely separate auth systems** — one for patients (public site) and one for admin/staff.

---

### 1. Patient Authentication

**Used for:** Booking appointments, viewing `/my-appointments`

**Auth type:** Passwordless OTP (email code)

#### Flow

```
[Landing Page / Booking Flow]
       │
       │  POST /api/auth/check-user
       │  { email }
       ▼
[Patient found?]
       │
   Yes ├──→ [Send OTP]
       │     POST /api/auth/send-code
       │     { patient_id, email }
       │           │
       │           ▼
       │    [Enter 6-digit code]
       │     POST /api/auth/verify-code
       │     { patient_id, code }
       │           │
       │           ▼
       │    [Session Created]
       │     → localStorage["user"] = JSON(patient)
       │     → Redux: auth.user set, auth.isAuthenticated = true
       │
   No  └──→ [Create account inline during booking]
             POST /api/auth/create-user
             { email, first_name, last_name, phone?, date_of_birth? }
                   │
                   ▼
             [OTP sent] → same verify flow
```

#### API Endpoints

| Method | Endpoint                | Description                            |
| ------ | ----------------------- | -------------------------------------- |
| `POST` | `/api/auth/check-user`  | Check if patient exists by email       |
| `POST` | `/api/auth/send-code`   | Send 6-digit OTP to patient's email    |
| `POST` | `/api/auth/verify-code` | Verify OTP and return patient + tokens |
| `POST` | `/api/auth/create-user` | Register new patient inline            |

#### Session Persistence

| Storage key            | Content                        |
| ---------------------- | ------------------------------ |
| `localStorage["user"]` | JSON-serialized patient object |

On app load, `restoreUser()` is dispatched — reads `localStorage["user"]` and rehydrates the Redux `auth` slice.

#### Patient Object Shape

```typescript
interface Patient {
  id: number;
  email: string;
  role: "patient";
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: number;
  is_email_verified: number;
  date_of_birth: string | null;
  created_at: string;
  last_login: string | null;
}
```

#### Redux Slice: `auth`

| Field             | Type              | Description                       |
| ----------------- | ----------------- | --------------------------------- |
| `user`            | `Patient \| null` | Authenticated patient             |
| `isAuthenticated` | `boolean`         | Gate for patient-protected routes |
| `isLoading`       | `boolean`         | Any async in-flight               |

---

### 2. Admin / Staff Authentication

**Used for:** All `/admin/*` routes

**Auth type:** Passwordless OTP (email code)

#### Flow

```
[/admin/login]
       │
       │  POST /api/admin/auth/check-user
       │  { email }
       ▼
[Staff user found?]
       │
   Yes ├──→ [Send OTP]
       │     POST /api/admin/auth/send-code
       │     { user_id, email }
       │           │
       │           ▼
       │    [Enter 6-digit code]
       │     POST /api/admin/auth/verify-code
       │     { user_id, code }
       │           │
       │           ▼
       │    [Session Created]
       │     → localStorage["adminAccessToken"] = accessToken
       │     → localStorage["adminRefreshToken"] = refreshToken
       │     → localStorage["adminUser"] = JSON(adminUser)
       │     → navigate("/admin/dashboard")
       │
   No  └──→ Error: "No se encontró una cuenta de administrador"
```

#### API Endpoints

| Method | Endpoint                      | Description                             |
| ------ | ----------------------------- | --------------------------------------- |
| `POST` | `/api/admin/auth/check-user`  | Check if staff user exists by email     |
| `POST` | `/api/admin/auth/send-code`   | Send 6-digit OTP to staff email         |
| `POST` | `/api/admin/auth/verify-code` | Verify OTP and return JWT tokens + user |

#### Session Persistence

| Storage key                         | Content                           |
| ----------------------------------- | --------------------------------- |
| `localStorage["adminAccessToken"]`  | JWT access token string           |
| `localStorage["adminRefreshToken"]` | JWT refresh token string          |
| `localStorage["adminUser"]`         | JSON-serialized admin user object |

All authenticated admin API calls attach the access token as:

```
Authorization: Bearer <adminAccessToken>
```

#### Admin User Object Shape

```typescript
interface AdminUser {
  id: number;
  email: string;
  role: "admin" | "general_admin" | "receptionist" | "doctor" | "pos";
  first_name: string;
  last_name: string;
  employee_id?: string;
  specialization?: string;
  profile_picture_url?: string;
}
```

### Auth Comparison Table

|                        | Patient Auth                         | Admin Auth                                           |
| ---------------------- | ------------------------------------ | ---------------------------------------------------- |
| Login route            | Inline in booking flow / `AuthModal` | `/admin/login`                                       |
| Check user endpoint    | `POST /api/auth/check-user`          | `POST /api/admin/auth/check-user`                    |
| Send code endpoint     | `POST /api/auth/send-code`           | `POST /api/admin/auth/send-code`                     |
| Verify code endpoint   | `POST /api/auth/verify-code`         | `POST /api/admin/auth/verify-code`                   |
| Storage key            | `user`                               | `adminUser`, `adminAccessToken`, `adminRefreshToken` |
| Tokens                 | Stateless (user JSON only)           | JWT access + refresh tokens                          |
| Post-login destination | Booking flow / `/my-appointments`    | `/admin/dashboard`                                   |
| Redux slice            | `auth`                               | Component-local state in `DashboardLayout`           |
| New user flow          | Register inline during booking       | N/A (staff created by `general_admin`)               |

---

## Layouts

### 1. Public Layout — Landing Page Shell

**Used by:** `/`, `/appointment`, `/my-appointments`, `/check-in`

```
┌──────────────────────────────────────┐
│           <Header />                 │  ← sticky, black/dark background
├──────────────────────────────────────┤
│                                      │
│       <main page content>            │
│                                      │
├──────────────────────────────────────┤
│           <Footer />                 │
└──────────────────────────────────────┘
```

The `Header` is **sticky** (`sticky top-0 z-50`) with a `bg-black/90 backdrop-blur-sm` background.  
Navigation links scroll to sections on the home page via `scrollIntoView`.  
If the user is authenticated (`auth.isAuthenticated`), a user `Avatar` with an initials dropdown replaces the login button.

---

### 2. Admin Layout — Dashboard Shell

**File:** `client/pages/admin/DashboardLayout.tsx`  
**Used by:** All `/admin/*` routes

```
┌─────────┬────────────────────────────────────────────┐
│         │         Top Header Bar                     │
│         │  [Logo]  [Breadcrumb]  [User Avatar ▼]     │
│  Side-  ├────────────────────────────────────────────┤
│  bar    │                                            │
│ (icons  │         <Outlet /> (page content)          │
│  +      │          scrollable, padded                │
│  labels)│                                            │
│         │                                            │
└─────────┴────────────────────────────────────────────┘
```

**Sidebar behaviour:**

- Desktop: collapsible (toggles between full labels and icon-only mode via state `sidebarOpen`)
- Mobile: hidden by default; opens as a full-screen overlay with `AnimatePresence` transition (`mobileMenuOpen`)
- Active route highlighted with dedicated active styles
- Menu items filtered by `adminUser.role` — only accessible items are rendered

**Bootstrap sequence on mount:**

1. Read `localStorage["adminUser"]` → set `adminUser` state
2. Check if current route is accessible for the user's role
3. If not accessible, redirect to the first available route for that role
4. If no user in localStorage, redirect to `/admin/login`

**User avatar dropdown:**

- Shows initials (first + last name)
- Dropdown items: profile info, logout
- Logout clears both `adminUser` and `adminAccessToken`/`adminRefreshToken` from localStorage

---

## Roles & Permissions

### Role Definitions

| Role value      | Display name  | Who it is                                                                                       |
| --------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `admin`         | Admin         | Clinic owner / senior manager. Access to appointments, patients, contracts, payments, services. |
| `general_admin` | General Admin | Full access including users management, medical records, settings.                              |
| `receptionist`  | Receptionist  | Front-desk. Appointments, patients, contracts, payments, invoices.                              |
| `doctor`        | Doctor        | Medical staff. Patients and medical records only.                                               |
| `pos`           | POS           | Point-of-sale. Same as receptionist.                                                            |

### Role-Based Navigation Visibility

| Section               | `admin` | `general_admin` | `receptionist` | `doctor` | `pos` |
| --------------------- | :-----: | :-------------: | :------------: | :------: | :---: |
| Dashboard             |    ✓    |        ✓        |       —        |    —     |   —   |
| Citas (Appointments)  |    ✓    |        ✓        |       ✓        |    —     |   ✓   |
| Pacientes (Patients)  |    ✓    |        ✓        |       ✓        |    ✓     |   ✓   |
| Contratos (Contracts) |    ✓    |        ✓        |       ✓        |    —     |   ✓   |
| Pagos (Payments)      |    ✓    |        ✓        |       ✓        |    —     |   ✓   |
| Facturas (Invoices)   |    ✓    |        ✓        |       ✓        |    —     |   ✓   |
| Expedientes Médicos   |    —    |        ✓        |       —        |    ✓     |   —   |
| Servicios (Services)  |    ✓    |        ✓        |       —        |    —     |   —   |
| Fechas Bloqueadas     |    ✓    |        ✓        |       —        |    —     |   —   |
| Gestión de Usuarios   |    —    |        ✓        |       —        |    —     |   —   |
| Configuración         |    —    |        ✓        |       —        |    —     |   —   |

---

## Redux Store

**File:** `client/store/index.ts`  
**Hooks:** `useAppDispatch` / `useAppSelector` from `client/store/hooks.ts`

### Store Shape (13 slices)

| Slice key             | File                          | Purpose                                                   |
| --------------------- | ----------------------------- | --------------------------------------------------------- |
| `services`            | `servicesSlice.ts`            | Available clinic services (fetched on page load)          |
| `appointment`         | `appointmentSlice.ts`         | Booking wizard local state (selected service, date, etc.) |
| `appointmentApi`      | `appointmentApiSlice.ts`      | Async thunks for appointment CRUD API calls               |
| `auth`                | `authSlice.ts`                | Patient auth: user, isAuthenticated, isLoading            |
| `blockedDates`        | `blockedDatesSlice.ts`        | Blocked date ranges that disable calendar slots           |
| `businessHours`       | `businessHoursSlice.ts`       | Clinic open/close hours per day of week                   |
| `bookedSlots`         | `bookedSlotsSlice.ts`         | Already-booked time slots for a given date                |
| `loading`             | `loadingSlice.ts`             | Global loading mask state                                 |
| `users`               | `usersSlice.ts`               | Staff user management (admin CRUD)                        |
| `medicalRecords`      | `medicalRecordsSlice.ts`      | Patient medical records + media                           |
| `contracts`           | `contractsSlice.ts`           | Treatment contracts and signing state                     |
| `patientAppointments` | `patientAppointmentsSlice.ts` | Patient's own appointment list at `/my-appointments`      |
| `config`              | `configSlice.ts`              | Environment flags (isLocalhost, enableConsoleLogs)        |

### Middleware

- **`loadingMiddleware`** (`client/store/middleware/loadingMiddleware.ts`) — automatically shows/hides the global `LoadingMask` based on async thunk pending/fulfilled/rejected lifecycle.

### Usage Pattern

```typescript
// Always use typed hooks
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// Reading state
const { user, isAuthenticated } = useAppSelector((state) => state.auth);

// Dispatching async thunks
const dispatch = useAppDispatch();
dispatch(fetchServices());
```

### Data Fetching Convention

All API calls live in slice files via `createAsyncThunk`. **Components never call axios directly.**

```typescript
// ✅ In slice (e.g., servicesSlice.ts)
export const fetchServices = createAsyncThunk(
  "services/fetchAll",
  async (_, { rejectWithValue }) => {
    const { data } = await axios.get("/api/services");
    return data;
  },
);

// ✅ In component
useEffect(() => {
  dispatch(fetchServices());
}, [dispatch]);
const { services, loading } = useAppSelector((state) => state.services);
```

---

## Routing Overview

The app is a **SPA** using React Router v6. Routes are defined in `client/routes/AppRoutes.tsx`.

### Public Routes

| Path                   | Page             | Notes                            |
| ---------------------- | ---------------- | -------------------------------- |
| `/`                    | `Index`          | Marketing landing page           |
| `/appointment`         | `Appointment`    | Booking wizard + Stripe payment  |
| `/appointment/success` | `PaymentSuccess` | Post-payment success screen      |
| `/appointment/failed`  | `PaymentFailed`  | Post-payment failure screen      |
| `/my-appointments`     | `MyAppointments` | Patient's appointment history    |
| `/check-in`            | `PatientCheckIn` | QR code check-in + contract sign |

### Auth Routes

| Path           | Page         | Notes                             |
| -------------- | ------------ | --------------------------------- |
| `/admin/login` | `AdminLogin` | Staff OTP login (no layout shell) |

### Admin Routes (`/admin/*`)

All wrapped in `DashboardLayout` (nested route via `<Outlet />`). Require valid `localStorage["adminUser"]`.

| Path                           | Page                       | Role Access                                     |
| ------------------------------ | -------------------------- | ----------------------------------------------- |
| `/admin` or `/admin/dashboard` | `DashboardHome`            | admin, general_admin                            |
| `/admin/appointments`          | `AppointmentsCalendar`     | admin, general_admin, receptionist, pos         |
| `/admin/patients`              | `PatientManagement`        | admin, general_admin, receptionist, doctor, pos |
| `/admin/contracts`             | `ContractsManagement`      | admin, general_admin, receptionist, pos         |
| `/admin/payments`              | `PaymentsManagement`       | admin, general_admin, receptionist, pos         |
| `/admin/invoices`              | `InvoicesManagement`       | admin, general_admin, receptionist, pos         |
| `/admin/medical-records`       | `MedicalRecordsManagement` | general_admin, doctor                           |
| `/admin/services`              | `ServicesManagement`       | admin, general_admin                            |
| `/admin/blocked-dates`         | `BlockedDatesManagement`   | admin, general_admin                            |
| `/admin/users`                 | `UsersManagement`          | general_admin                                   |
| `/admin/settings`              | `SettingsManagement`       | general_admin                                   |

---

## Database Schema (Key Types)

Defined in `shared/database.ts`. **Always reference this file before writing new queries.**

### Enums

#### UserRole

```typescript
enum UserRole {
  ADMIN = "admin",
  GENERAL_ADMIN = "general_admin",
  RECEPTIONIST = "receptionist",
  DOCTOR = "doctor",
  POS = "pos",
  PATIENT = "patient",
}
```

#### AppointmentStatus

```typescript
enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}
```

#### BookingSource

```typescript
enum BookingSource {
  ONLINE = "online",
  RECEPTIONIST = "receptionist",
  PHONE = "phone",
  WALK_IN = "walk_in",
}
```

#### PaymentStatus / PaymentMethod

```typescript
enum PaymentStatus {
  PENDING,
  PROCESSING,
  COMPLETED,
  FAILED,
  REFUNDED,
}

enum PaymentMethod {
  CASH = "cash",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  TRANSFER = "transfer",
  STRIPE = "stripe",
}
```

#### ContractStatus

```typescript
enum ContractStatus {
  DRAFT = "draft",
  PENDING_SIGNATURE = "pending_signature",
  SIGNED = "signed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}
```

#### ServiceCategory

```typescript
enum ServiceCategory {
  LASER_HAIR_REMOVAL = "laser_hair_removal",
  FACIAL_TREATMENT = "facial_treatment",
  BODY_TREATMENT = "body_treatment",
  CONSULTATION = "consultation",
  OTHER = "other",
}
```

#### NotificationType / NotificationStatus

```typescript
enum NotificationType {
  EMAIL = "email",
  WHATSAPP = "whatsapp",
  SMS = "sms",
}
enum NotificationStatus {
  PENDING,
  SENT,
  DELIVERED,
  FAILED,
}
```

### Core Tables

| Entity              | Key Fields                                                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`             | `id`, `email`, `password_hash`, `role` (UserRole), `first_name`, `last_name`, `phone`, `profile_picture_url`, `specialization`, `employee_id`, `is_active`, `is_email_verified`                                                                                     |
| `patients`          | `id`, `email`, `password_hash?`, `role: "patient"`, `first_name`, `last_name`, `phone?`, `date_of_birth?`, `gender?`, `address?`, `city?`, `state?`, `zip_code?`, `emergency_contact_name?`, `emergency_contact_phone?`, `notes?`, `is_active`, `is_email_verified` |
| `appointments`      | `id`, `patient_id`, `doctor_id?`, `service_id`, `status` (AppointmentStatus), `scheduled_at`, `duration_minutes`, `notes?`, `booked_for_self`, `created_by`, `booking_source`, `check_in_at?`, `check_in_by?`, `contract_id?`, `cancellation_reason?`               |
| `services`          | `id`, `name`, `description?`, `image_url?`, `category` (ServiceCategory), `price`, `duration_minutes`, `is_active`                                                                                                                                                  |
| `payments`          | `id`, `appointment_id?`, `patient_id`, `amount`, `payment_method` (PaymentMethod), `payment_status` (PaymentStatus), `stripe_payment_id?`, `stripe_payment_intent_id?`, `discount_amount`, `notes?`, `processed_by`                                                 |
| `contracts`         | `id`, `patient_id`, `service_id`, `contract_number`, `status` (ContractStatus), `total_amount`, `sessions_included`, `sessions_completed`, `terms_and_conditions`, `pdf_url?`, `signature_data?`, `signed_at?`, `signed_by?`, `created_by`                          |
| `medical_records`   | `id`, `patient_id`, `doctor_id`, `appointment_id?`, `diagnosis?`, `treatment?`, `notes?`, `allergies?`, `medications?`, `medical_history?`                                                                                                                          |
| `medical_media`     | `id`, `medical_record_id`, `file_name`, `file_url`, `file_type`, `file_size`, `description?`, `uploaded_at`                                                                                                                                                         |
| `notifications`     | `id`, `patient_id`, `appointment_id?`, `type` (NotificationType), `status` (NotificationStatus), `recipient`, `subject?`, `message`, `sent_at?`, `delivered_at?`, `error_message?`                                                                                  |
| `blocked_dates`     | `id`, `start_date`, `end_date`, `start_time?`, `end_time?`, `all_day`, `reason?`, `notes?`, `created_by`                                                                                                                                                            |
| `business_hours`    | `id`, `day_of_week` (0=Sun..6=Sat), `is_open`, `open_time`, `close_time`, `break_start?`, `break_end?`                                                                                                                                                              |
| `audit_logs`        | `id`, `user_id?`, `patient_id?`, `action`, `entity_type`, `entity_id`, `old_values?`, `new_values?`, `metadata?`, `ip_address?`, `user_agent?`                                                                                                                      |
| `coupons`           | `id`, `code`, `discount_type` (percentage/fixed_amount), `discount_value`, `min_purchase_amount?`, `usage_limit?`, `valid_from`, `valid_until?`, `is_active`, `applicable_services?`                                                                                |
| `settings`          | `id`, `setting_key`, `setting_value?`, `setting_type` (text/number/boolean/json), `category`, `description?`, `is_public`                                                                                                                                           |
| `content_pages`     | `id`, `slug`, `title`, `content?`, `meta_description?`, `is_published`                                                                                                                                                                                              |
| `dashboard_metrics` | `id`, `metric_date`, `total_appointments`, `completed_appointments`, `cancelled_appointments`, `no_show_appointments`, `total_revenue`, `total_refunds`, `new_patients`, `active_contracts`                                                                         |

---

## API Conventions

### Request Format

```typescript
// Standard API response shape (ApiResponse<T>)
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated response shape
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### Authentication Headers

```typescript
// Patient routes — no auth header (token managed as cookie or localStorage user)
// Admin routes — Bearer JWT
headers: {
  Authorization: `Bearer ${localStorage.getItem("adminAccessToken")}`;
}
```

### Key Public API Endpoints

| Method | Endpoint                         | Description                           |
| ------ | -------------------------------- | ------------------------------------- |
| `GET`  | `/api/services`                  | Get all active services               |
| `POST` | `/api/auth/check-user`           | Check if patient exists               |
| `POST` | `/api/auth/send-code`            | Send OTP to patient email             |
| `POST` | `/api/auth/verify-code`          | Verify OTP code                       |
| `POST` | `/api/auth/create-user`          | Register new patient                  |
| `POST` | `/api/appointments`              | Create appointment + initiate payment |
| `GET`  | `/api/appointments/booked-slots` | Get booked time slots for a date      |
| `GET`  | `/api/business-hours`            | Get clinic business hours             |
| `GET`  | `/api/blocked-dates`             | Get blocked dates                     |
| `POST` | `/api/payments/create-intent`    | Create Stripe payment intent          |
| `POST` | `/api/payments/confirm`          | Confirm payment after Stripe          |
| `GET`  | `/api/patient/appointments`      | Patient's appointment history         |

---

## Form Validation

All forms use **Formik + Yup**.

```typescript
import { useFormik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object({
  email: Yup.string().email("Email inválido").required("Campo requerido"),
  first_name: Yup.string().required("Campo requerido"),
  phone: Yup.string().matches(/^\+?[\d\s\-()]+$/, "Teléfono inválido"),
  // OTP code validation
  code: Yup.string()
    .matches(/^\d{6}$/, "El código debe tener 6 dígitos")
    .required("Campo requerido"),
});

const formik = useFormik({
  initialValues: { email: "", first_name: "" },
  validationSchema,
  onSubmit: (values) => dispatch(someAction(values)),
});
```

---

## Logging

Always use the `logger` utility — **never use `console.log` directly** inside UI components.

```typescript
import { logger } from "@/lib/logger";

logger.log("Info message");
logger.error("Error occurred:", error);
logger.warn("Warning:", warning);
```

The logger respects `config.enableConsoleLogs` from the Redux store — logs are suppressed in production by default.

---

## Path Aliases

| Alias       | Maps to   |
| ----------- | --------- |
| `@/*`       | `client/` |
| `@shared/*` | `shared/` |

```typescript
import { Button } from "@/components/ui/button";
import { ApiResponse } from "@shared/api";
```

---

## Theme Starter

Use this as a reference when building any new UI outside this codebase:

```typescript
export const Colors = {
  // Primary brand gold
  primary: "#C9A159",
  primaryForeground: "#FFFFFF",

  // Backgrounds
  background: "#FFF5E1", // Light warm cream
  card: "#FFFFFF",

  // Text
  foreground: "#000000",
  mutedForeground: "#404040",

  // Secondary
  secondary: "#DFC07A",
  secondaryForeground: "#000000",

  // Muted
  muted: "#F0F0F0",

  // Accent (same as primary)
  accent: "#C9A159",
  accentForeground: "#FFFFFF",

  // Destructive
  destructive: "#D93030",
  destructiveForeground: "#FFFFFF",

  // Borders
  border: "#F0F0F0",
  input: "#F0F0F0",
  ring: "#C9A159",

  // Sidebar (always dark)
  sidebarBackground: "#212121",
  sidebarForeground: "#F0F0F0",
  sidebarAccent: "#404040",

  // Luxury palette
  luxuryBlack: "#000000",
  luxuryBlackLight: "#111111",
  luxuryGrayDark: "#212121",
  luxuryGrayMedium: "#3F3F3F",
  luxuryGoldDark: "#C9A159",
  luxuryGoldLight: "#E8C580",
  luxuryCreamDark: "#F9E6BD",
  luxuryCreamLight: "#FFF5E1",
  luxuryBeige: "#EFEFEF",

  // Semantic
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export const DarkColors: typeof Colors = {
  primary: "#C9A159",
  primaryForeground: "#000000",
  background: "#121212",
  card: "#212121",
  foreground: "#FFF5E1",
  mutedForeground: "#F0F0F0",
  secondary: "#DFC07A",
  secondaryForeground: "#000000",
  muted: "#404040",
  accent: "#C9A159",
  accentForeground: "#000000",
  destructive: "#C42B2B",
  destructiveForeground: "#FFFFFF",
  border: "#404040",
  input: "#404040",
  ring: "#C9A159",
  sidebarBackground: "#121212",
  sidebarForeground: "#F0F0F0",
  sidebarAccent: "#212121",
  luxuryBlack: "#000000",
  luxuryBlackLight: "#111111",
  luxuryGrayDark: "#212121",
  luxuryGrayMedium: "#3F3F3F",
  luxuryGoldDark: "#C9A159",
  luxuryGoldLight: "#E8C580",
  luxuryCreamDark: "#F9E6BD",
  luxuryCreamLight: "#FFF5E1",
  luxuryBeige: "#EFEFEF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

export const Typography = {
  fontFamily: {
    sans: "Nunito Sans",
    heading: "Newsreader",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
    "6xl": 60,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const BorderRadius = {
  sm: 12,
  md: 14,
  lg: 16,
  full: 9999,
};

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};
```
