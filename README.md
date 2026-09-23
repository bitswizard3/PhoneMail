<div align="center">
  <h1>📱 AlphaStack PhoneMail</h1>
  <p><em>The Next-Generation Email Experience using Phone Numbers instead of Email IDs.</em></p>
  
  [![Built for](https://img.shields.io/badge/Built_for-AlphaStack_Buildathon-blue.svg?style=for-the-badge)](https://alphastack.com)
  [![Tech Stack](https://img.shields.io/badge/Tech-React_|_Node_|_Docker_|_Postgres-success.svg?style=for-the-badge)](#)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-testing-the-app">How to Test</a> •
    <a href="#-troubleshooting">Troubleshooting</a>
  </p>
</div>

---

## 📖 About PhoneMail
PhoneMail completely reimagines the traditional email system. Instead of complex email addresses (`firstname.lastname.2024@gmail.com`), your email address is simply your **Phone Number** (`+919876543210@phonemail.local`).

It features a **Gmail-style interface for Desktop** and a **WhatsApp-style chat interface for Mobile**, bridging the gap between formal email and instant messaging.

---

## 🌟 Premium Features

### 💻 Desktop Web Client (Gmail Style)
- **Familiar UI**: A beautiful, responsive desktop-first interface.
- **Folder Management**: Inbox, Sent, Drafts, Spam, and Trash.
- **Smart Filters**: Instantly filter emails by Unread, Attachments, or Favorites.
- **SMTP Relay**: Automatically routes external emails (like `@gmail.com`) to the real internet!

### 📱 Mobile Web Client (WhatsApp Style)
- **Conversational View**: Read emails like you read chat messages.
- **Gestures**: Swipe left to delete an email thread instantly!
- **Read Receipts**: WhatsApp-style Blue Ticks (✓✓) when the recipient opens the email.
- **Quick Replies**: Pre-filled one-tap smart replies at the bottom of the chat.

### 🤖 Smart Automation & Security
- **Toll-Free IVR Activation**: Call our Twilio Toll-Free Number and press `1` to instantly activate your account.
- **OTP Verification**: Secure login using SMS OTP.
- **Alias Support**: Mask your phone number by creating custom aliases (`boss@phonemail.local`).

---

## 🚀 Getting Started (Local Setup Guide)

We have containerized the entire application using Docker to ensure a flawless, 1-click startup on any operating system (Windows, Mac, Linux).

### 📋 Prerequisites
Ensure you have the following installed on your machine:
1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Must be running in the background)
2. *(Optional)* **[Git](https://git-scm.com/downloads)**

### Step 1: Download the Project
You can either clone the repository using Git or download it directly as a ZIP file.

**Option A: Using Git (Recommended)**
```bash
git clone https://github.com/bitswizard3/PhoneMail.git
cd PhoneMail
```

**Option B: Download as ZIP**
1. Click the green **`<> Code`** button at the top right of this GitHub page.
2. Select **`Download ZIP`**.
3. Extract the ZIP file on your computer.
4. Open your Terminal (or PowerShell) and navigate (`cd`) into the extracted folder.

### Step 2: Setup Environment Variables
1. Inside the `PhoneMail` folder, you will find a file named `.env.example`.
2. Rename this file to exactly `.env`.
   - *Windows Tip:* If you can't rename it to `.env` easily, open Command Prompt in the folder and type: `ren .env.example .env`
3. (Optional) You can edit `.env` to add your Twilio credentials if you want live SMS features. Otherwise, our built-in mock system will work perfectly for testing!

### Step 3: Start the Servers
Run the following magic command in your terminal:
```bash
docker compose up -d
```
> ⏳ **Note:** The very first time you run this, Docker will download the necessary components (PostgreSQL, Redis, Node.js). This might take **2-4 minutes** depending on your internet speed. Subsequent runs will be instant!

### Step 4: Open the Application
Once the terminal finishes running the command, open your web browser:
- 🌐 **Web Client:** [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend Health:** [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 🧪 Testing the App (For Evaluators)

Here is a step-by-step guide to testing the core functionality of PhoneMail:

### 1. Test: IVR Toll-Free Activation
1. Go to `http://localhost:3000`.
2. Type any random 10-digit phone number in the login box.
3. Instead of clicking "Next", click the **"Simulate Toll-Free Call (Demo)"** button at the bottom.
4. The system will simulate a real IVR call being made, and instantly activate the account in the database!

### 2. Test: Sending an Internal Email
1. Log in with the account you just created.
2. Click **Compose**.
3. In the "To" field, type another phone number: `9998887776@phonemail.local`.
4. Add a subject and body, then click **Send**.
5. Check your **Sent** folder! You can log out and log in as `9998887776` to see it in their Inbox.

### 3. Test: Mobile Swipe Gestures
1. Press `F12` in your browser (or right-click -> Inspect) to open Developer Tools.
2. Click the **Device Toggle Toolbar** (or press `Ctrl+Shift+M`) to switch to Mobile View (e.g., iPhone 12 Pro).
3. Refresh the page (`F5`).
4. Go to your Inbox, click and hold on an email thread, and **swipe left** with your mouse/finger to delete it instantly!

---

## 🛑 Stopping & Resetting
When you are done evaluating the project, you can stop all services securely:
```bash
docker compose down
```

If you want to completely wipe the database and start with a fresh installation:
```bash
docker compose down -v
```

---

## 🏗️ Architecture & Tech Stack

PhoneMail is built using modern, enterprise-grade technologies:

| Component | Technology Used | Why? |
|-----------|----------------|------|
| **Frontend** | React, Vite, TS | Lightning fast HMR and type-safety. |
| **Styling** | Vanilla CSS | Pure, zero-dependency styling for a custom premium UI. |
| **Backend** | Node.js, Express | Highly scalable and event-driven API. |
| **Database** | PostgreSQL 16 | Relational data integrity for emails and users. |
| **Cache** | Redis 7 | High-speed OTP caching and session management. |
| **Infrastructure**| Docker Compose | Guarantees identical execution on local and cloud servers. |
| **Telephony** | Twilio API | Real-world SMS and Voice Webhooks. |

---
*Created with ❤️ for the AlphaStack Buildathon.*
