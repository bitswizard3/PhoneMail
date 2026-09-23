# 📱 AlphaStack PhoneMail

Welcome to **PhoneMail**! A next-generation email platform that replaces complex email addresses with **Phone Numbers** (e.g., `+919876543210@phonemail.local`). 

Built specifically for the **AlphaStack Buildathon**, PhoneMail offers a Gmail-style desktop web interface and a WhatsApp-style mobile experience.

---

## 🌟 Key Features
- **Phone Number Authentication**: Login using your phone number and OTP (or password).
- **Responsive Web Client**: A beautiful, desktop-first Gmail-like interface built with React & Vite.
- **Mobile Experience**: A WhatsApp-like mobile interface with Swipe-to-delete, Read Receipts (Blue ticks), and Quick Replies.
- **Twilio IVR Integration**: Call a Toll-Free number and press `1` to instantly activate your email account.
- **External Email Relay**: Automatically routes external domains (like `@gmail.com`) to real internet emails via SMTP relay.

---

## 🚀 How to Run Locally (Step-by-Step)

This guide will help anyone clone this repository from GitHub and run the entire platform perfectly on their local machine within 2 minutes.

### 📋 Prerequisites
Before you begin, ensure you have the following installed on your PC:
1. **[Git](https://git-scm.com/downloads)** (To clone the repository)
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Must be running in the background)

---

### Step 1: Clone the Repository
Open your Terminal (Command Prompt / PowerShell / Mac Terminal) and run:
```bash
git clone https://github.com/bitswizard3/PhoneMail.git
cd PhoneMail
```

### Step 2: Setup Environment Variables
We need to set up the configuration file before starting the servers.
1. In the `PhoneMail` folder, you will find a file named `.env.example`.
2. Rename this file to `.env` (or create a copy named `.env`).
3. *(Optional)* If you have your own Twilio credentials, you can add them to the `.env` file. Otherwise, the app uses a fallback mock system that works perfectly for local testing!

### Step 3: Start the Application using Docker
We have containerized the entire application (Database, Cache, Backend, and Frontend) to make it a 1-click startup.

Run the following command in your terminal:
```bash
docker compose up -d
```
> **Note:** The first time you run this, Docker will download the necessary images (Postgres, Redis, Node.js) and build the code. This might take 1-3 minutes depending on your internet speed.

### Step 4: Access the Application!
Once the terminal says `Started` for all containers, your application is LIVE on your machine!

Open your web browser and visit:
- 🌐 **Web Client (Frontend):** [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend API (Health Check):** [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 🧪 How to Test the Features

### 1. Account Creation (OTP)
1. Go to `http://localhost:3000`.
2. Enter a demo phone number (e.g., `+91 9876543210`).
3. Click **Next**.
4. Check the Docker logs for the OTP, or simply use the default test OTP (if configured). 
5. Enter the OTP to log in!

### 2. Twilio IVR Simulation (Toll-Free Activation)
Don't want to enter an OTP? Test our Automated Phone System!
1. On the Login screen, enter your phone number.
2. Click the special **"Simulate Toll-Free Call (Demo)"** button at the bottom.
3. The system will simulate a user calling the Twilio Toll-Free Number and pressing `1`. Your account will be instantly created!

### 3. Send an Email
1. Once logged in, click **Compose**.
2. To send an internal email, type another phone number (e.g., `9998887776@phonemail.local`).
3. To send a real email, type an external address (e.g., `your-name@gmail.com`). The backend will automatically use the SMTP relay to deliver it!

---

## 🛑 How to Stop the Application
When you are done testing, you can stop the servers gracefully by running:
```bash
docker compose down
```
If you ever want to completely wipe the database and start fresh, run:
```bash
docker compose down -v
```

---

## 🛠️ Technology Stack
- **Frontend**: React, Vite, TypeScript, Vanilla CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL 16 (Local Docker)
- **Cache**: Redis 7
- **Integrations**: Twilio Voice/SMS API, Nodemailer

*Designed and Built by Ujjwal Sharma (bitswizard3)*
