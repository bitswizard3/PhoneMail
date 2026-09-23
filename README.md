# 📧 AlphaStack PhoneMail

> Email application using **phone numbers as email IDs** (e.g., `9876543210@phonemail.local`)

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js](https://nodejs.org/) v20+ (for local development)

### Run with Docker (Production)
```bash
# Clone and start
docker compose up -d

# All services will be available:
# Web Client:  http://localhost:3000
# Backend API: http://localhost:4000
# SMTP Server: localhost:2525
```

### Run Locally (Development)

**1. Start PostgreSQL & Redis** (using Docker):
```bash
docker compose up -d postgres redis
```

**2. Start Backend API:**
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:4000
```

**3. Start Web Client:**
```bash
cd web-client
npm install
npm run dev
# Runs on http://localhost:5173
```

**4. Start SMTP Server:**
```bash
cd smtp-server
npm install
npm run dev
# Listens on port 2525
```

**5. Start Mobile Client:**
```bash
cd mobile-client
npm install
npx expo start
# Scan QR with Expo Go app
```

## 📁 Project Structure

```
AlphaStack/
├── docker-compose.yml      # Docker Compose (single command deployment)
├── .env                    # Environment variables
├── backend/                # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── index.ts        # Express app entry point
│   │   ├── config/         # Database, Redis configs
│   │   ├── routes/         # Auth, Emails, Settings
│   │   ├── services/       # Twilio (OTP, SMS, IVR)
│   │   ├── middleware/     # JWT authentication
│   │   └── db/init.sql     # PostgreSQL schema
│   └── Dockerfile
├── smtp-server/            # Custom SMTP server
│   ├── src/index.ts        # SMTP receive & store
│   └── Dockerfile
├── web-client/             # React + Vite (Gmail-style)
│   ├── src/
│   │   ├── pages/          # Login, Register, Home, Settings
│   │   ├── services/       # API client
│   │   └── context/        # Auth state
│   └── Dockerfile
└── mobile-client/          # React Native + Expo (WhatsApp-style)
    ├── App.tsx             # Navigation setup
    └── src/
        ├── screens/        # All mobile screens
        ├── services/       # API client
        ├── styles/         # WhatsApp theme
        └── navigation/     # Drawer navigator
```

## 🔧 Features

### Account Creation
- **Web Portal**: Phone + Password registration
- **Mobile App**: WhatsApp-style onboarding (Language → T&C → Phone → OTP)
- **Toll-Free IVR**: Call and press 1 (Twilio integration)
- **SMS**: Send SMS to create account

### Web Client (Gmail-style)
- Gmail-like UI with sidebar folders
- Inbox, Sent, Drafts, Spam, Trash
- Compose with To, CC, BCC
- Search and filter (All, Unread, Attachments, Favorites)
- Settings with alias management
- Dark theme with premium design

### Mobile Client (WhatsApp-style)
- WhatsApp design language
- Chat-style email conversations
- Compose: FAB (traditional) + Chat view
- Filter chips: All, Unread, Attachments, Favorites
- Drawer menu: Home, Drafts, Spam, Trash
- Profile & alias management

### SMS Notifications
- For non-mobile users: "You have received an email from <Sender>. Subject: <Subject>"

### Twilio Integration
- OTP verification (with mock fallback)
- SMS notifications
- IVR account creation

## 🔐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with phone + password |
| POST | `/api/auth/login` | Login with phone + password |
| POST | `/api/auth/send-otp` | Send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/ivr` | Twilio IVR webhook |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/emails` | Get emails (with folder & filter) |
| GET | `/api/emails/conversations` | Get conversations |
| GET | `/api/emails/conversation/:id` | Get emails in conversation |
| POST | `/api/emails/send` | Send email |
| PATCH | `/api/emails/:id` | Update email flags |
| DELETE | `/api/emails/:id` | Delete email |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/settings/aliases` | Create alias |
| DELETE | `/api/settings/aliases/:id` | Delete alias |

## 🔑 Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT signing key
- `TWILIO_*` - Twilio credentials (optional)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Web Client | React, Vite, TypeScript |
| Mobile Client | React Native, Expo |
| SMTP | Custom (smtp-server npm) |
| SMS/OTP | Twilio (with mock fallback) |
| Container | Docker, Docker Compose |

---

**Built for AlphaStack 7-Day Buildathon** 🏆
