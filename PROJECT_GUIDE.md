# 📧 AlphaStack PhoneMail — Complete Project & Architecture Guide

This document explains exactly how the PhoneMail project works, what technologies are used, what Docker does, and how to host this for real users permanently.

---

## 📋 1. What is PhoneMail & How Does It Work?

PhoneMail is a modern email service where **your phone number IS your email address** (e.g., `9876543210@phonemail.local`).

### The Magic Behind the Scenes:
1. **Frontend (UI):** We built a Web App (React.js) and a Mobile App (React Native/Expo). This is what the user sees.
2. **Backend (Logic):** We built a Node.js API that acts as the brain. When you click "Login", the frontend talks to the backend.
3. **Real SMS OTP (Fast2SMS):** When a user enters their number, the backend calls the Fast2SMS API, which sends a real SMS to the user's phone. The OTP is temporarily saved in **Redis** (a super-fast temporary memory) for 5 minutes.
4. **Cloud Database (Supabase):** Once OTP is verified, the user's account is permanently saved in Supabase (a cloud PostgreSQL database). All emails, contacts, and settings are saved here.
5. **Custom Email Server (SMTP):** We built our own email server on Port 2525. When someone sends an email to `9876543210@phonemail.local`, our custom server receives it, reads the text, and saves it to the Supabase database.

---

## 🐳 2. What is Docker doing here?

When building complex apps, you usually have to install Node.js, PostgreSQL, Redis, and run 4 different terminal windows just to start the app. This is a headache and often causes "it works on my machine but not yours" errors.

**Docker solves this.** Docker puts every piece of your app into isolated boxes called "Containers".

### In this project, `docker-compose.yml` runs 3 containers automatically:
1. **`phonemail-backend`**: Runs your Node.js API.
2. **`phonemail-smtp`**: Runs your custom email server.
3. **`phonemail-redis`**: Runs the temporary memory for OTPs.

*Note: The database is in the cloud (Supabase), so we don't need a Docker container for PostgreSQL anymore!*

Because of Docker, you just run ONE command (`docker compose up -d`) and the entire architecture starts automatically. 

---

## 📦 3. How to Transfer this Project to Someone Else?

Transferring this project to your friend, teacher, or another computer is extremely easy because of Docker.

**Steps to transfer:**
1. **Zip the folder:** Just zip the entire `AlphaStack` folder (you can delete the `node_modules` folders inside `backend` and `web-client` first to make the zip smaller, they will auto-install later).
2. **Send the zip file:** Email or pen-drive the zip file to the other person.
3. **What they need to do:**
   - Install **Docker Desktop** on their PC.
   - Install **Node.js** (for running the mobile app).
   - Unzip the folder.
   - Open terminal in the folder and run: `docker compose up -d`
4. **That's it!** Docker will automatically download all dependencies and start the servers. They don't need to configure Supabase or Fast2SMS again because the `.env` file (with API keys) is already inside the folder.

---

## 🌍 4. How to Host it Permanently for Real Users?

Right now, your app runs on `localhost` (your computer). If you turn off your laptop, the website goes down. To make it a permanent, real-world startup, you need to "Host" it in the cloud.

### Step A: Hosting the Database (Already Done! ✅)
Your database is already hosted on **Supabase**. Even if your laptop is off, your user data is safely stored in the cloud.

### Step B: Hosting the Backend & SMTP Server (Render / AWS / DigitalOcean)
You need to put your Docker containers on a 24/7 cloud server.
1. **DigitalOcean Droplet / AWS EC2:** Rent a Linux server for $5/month.
2. Install Docker on that server.
3. Upload your code there and run `docker compose up -d`.
4. Now your backend API runs 24/7 on a public IP address (e.g., `http://13.24.56.78:4000`).

### Step C: Hosting the Web App (Vercel / Netlify)
1. Push your `web-client` code to a GitHub repository.
2. Go to [Vercel.com](https://vercel.com) (it's 100% free) and connect your GitHub.
3. Vercel will automatically build your React website and give you a real, permanent link like: `https://phonemail-app.vercel.app`.
4. You tell Vercel to connect to your backend's public IP address.

### Step D: Releasing the Mobile App (Play Store)
Right now, you test the app using "Expo Go". To give it to real users:
1. Run a command: `eas build -p android --profile production`
2. Expo will generate an `.apk` or `.aab` file.
3. You pay a one-time $25 fee to Google and upload this file to the **Google Play Store**.
4. Anyone in the world can now download "PhoneMail" from the Play Store!

### Step E: Real Email Domain (Buying a .com)
Currently, emails end in `@phonemail.local`. For the real world:
1. Buy a real domain like `phonemail.com` from GoDaddy (₹500/year).
2. Change `SMTP_DOMAIN=phonemail.com` in your `.env`.
3. Point the domain's "MX Records" to your cloud server's IP address.
4. Now users can actually receive emails from Gmail directly to their phone numbers!
