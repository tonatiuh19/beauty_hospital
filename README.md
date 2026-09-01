# All Beauty Luxury & Wellness Platform 💎

A complete solution designed for hair removal clinics and medical aesthetic centers. The platform centralizes patient management, appointment scheduling, payments, contracts, and notifications in one secure ecosystem.

## 🎯 Overview

The system includes:

- **Modern Landing Page**: Responsive and conversion-optimized entry point for patient scheduling
- **Multi-User Dashboard**: Roles for admin, POS, doctors, receptionists, and patients
- **POS System**: Appointment management, digital tickets, and Stripe integration for secure payments
- **Notifications**: Automated WhatsApp and email alerts for confirmations and reminders
- **Digital Clinical Records**: Medical notes, diagnostics, and media storage
- **Contract Generator**: Auto-generated treatment contracts with digital signature and PDF storage

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS 3
- **Backend**: Express.js + MySQL
- **Database**: MySQL (Hostgator, AWS RDS, or any external MySQL hosting)
- **Deployment**: Vercel (serverless functions)
- **Authentication**: JWT with refresh tokens
- **Payments**: Stripe
- **Notifications**: Twilio (WhatsApp) + Nodemailer (Email)
- **File Storage**: External hosting or cloud storage
- **PDF Generation**: PDFKit

## 📁 Project Structure

```
beauty_hospital/
├── client/                 # React frontend
│   ├── pages/              # Route components
│   ├── components/         # React components
│   │   └── ui/             # UI component library
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── App.tsx             # Main app component
│   └── global.css          # TailwindCSS styles
│
├── server/                 # Express backend
│   ├── db/                 # Database layer
│   │   ├── connection.ts   # MySQL connection pool
│   │   ├── migrate.ts      # Migration runner
│   │   └── migrations/     # SQL migration files
│   ├── middleware/         # Express middleware
│   │   └── auth.ts         # Authentication middleware
│   ├── routes/             # API route handlers
│   │   └── auth.ts         # Authentication routes
│   ├── utils/              # Utility functions
│   │   └── auth.ts         # Auth helpers
│   └── index.ts            # Server entry point
│
├── shared/                 # Shared TypeScript types
│   ├── api.ts              # API request/response types
│   └── database.ts         # Database schema types
│
└── netlify/                # Serverless functions
    └── functions/
        └── api.ts
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** 20 or higher
- **npm** (comes with Node.js)
- **MySQL** 8.0 or higher (Hostgator, AWS RDS, or local for development)
- **Vercel** account (free tier available)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd beauty_hospital

# Install dependencies
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=beauty_hospital

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key

# Stripe Keys (get from stripe.com dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Twilio (for WhatsApp notifications)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Application URL (for production)
APP_URL=https://your-app.vercel.app
```

### 3. Database Setup

Create the MySQL database:

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE beauty_hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Run migrations:

```bash
npm run db:migrate
```

This will create all tables and insert initial data including sample services. Staff sign in with a one-time code sent to their email (no default password account).

### 4. Development

Start the development server:

```bash
npm run dev
```

The application will be available at:

- Frontend & Backend: http://localhost:8080
- API: http://localhost:8080/api/

### 5. Testing

Run TypeScript type checking:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate refresh token
- `GET /api/auth/me` - Get current user info (protected)

### Health Check

- `GET /api/health` - API health check

## 🚢 Production Deployment

### Deploy to Vercel

**Quick Deploy (5 minutes):**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Deployment Checklist:**

1. ✅ Configure MySQL database (Hostgator, AWS RDS, etc.)
2. ✅ Run database migrations on production database
3. ✅ Set environment variables in Vercel dashboard
4. ✅ Deploy with `vercel --prod`
5. ✅ Configure custom domain (optional)

**Environment Variables in Vercel:**

Go to your project settings in Vercel and add:

- `DB_HOST` - Your MySQL host (e.g., from Hostgator)
- `DB_PORT` - MySQL port (usually 3306)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_SSL` - Set to "true" for production
- `JWT_SECRET` - Generate a strong secret
- `JWT_REFRESH_SECRET` - Generate a different strong secret
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_WHATSAPP_FROM` - Twilio WhatsApp number
- `SMTP_HOST` - Email SMTP host
- `SMTP_PORT` - Email SMTP port
- `SMTP_USER` - Email username
- `SMTP_PASSWORD` - Email password
- `APP_URL` - Your production URL (e.g., https://your-app.vercel.app)

📖 **Complete guides:**

- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 5-step deployment (15 minutes)
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Comprehensive guide with Hostgator MySQL setup

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Password Hashing**: bcrypt with 10 salt rounds
- **Role-Based Access Control**: Admin, POS, Doctor, Receptionist, Patient roles
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Configurable cross-origin resource sharing
- **HTTPS Only**: Enforced in production via Vercel

## 🎨 User Roles

- **Admin**: Full system access, user management, system configuration
- **POS**: Payment processing, appointment management, ticket generation
- **Doctor**: Medical records, appointments, patient consultation
- **Receptionist**: Patient registration, appointment scheduling
- **Patient**: View appointments, medical records, contracts

## 📊 Database Schema

Key tables:

- `users` - System users with roles
- `patients` - Patient information
- `appointments` - Appointment scheduling
- `services` - Available services and pricing
- `payments` - Payment transactions
- `medical_records` - Clinical notes and history
- `medical_media` - Medical images and files
- `contracts` - Treatment contracts
- `notifications` - Email/WhatsApp notifications
- `audit_logs` - System audit trail

## 🔄 Development Workflow

1. Create a feature branch
2. Make changes and test locally
3. Run type checking: `npm run typecheck`
4. Run tests: `npm test`
5. Build: `npm run build`
6. Commit and push
7. Create pull request
8. Deploy to production after merge

## 📝 Environment Variables Reference

See `.env.example` for a complete list of required environment variables.

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test local connection
mysql -h localhost -u root -p beauty_hospital

# Test remote connection (Hostgator, AWS RDS, etc.)
mysql -h your-db-host.com -u your_username -p beauty_hospital
```

### Vercel Deployment Issues

```bash
# Check deployment logs
vercel logs

# Redeploy with debug output
vercel --prod --debug
```

### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Twilio API Documentation](https://www.twilio.com/docs)

## 📄 License

Proprietary - All rights reserved

## 👥 Support

For support and questions, contact the development team.
