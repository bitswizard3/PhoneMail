# 🍏 MacBook Setup Guide for PhoneMail Demo

Agar aapka MacBook bilkul naya hai aur usme kuch bhi installed nahi hai, toh chinta mat kariya! Ye step-by-step guide aapko zero se lekar final app run karne tak sab kuch bata degi.

---

## 🛠️ Step 1: Software Installation (Download & Install)

Aapko sirf **3 Softwares** download karne hain Google se:

1. **Node.js (LTS Version)**
   - Link: [https://nodejs.org/en](https://nodejs.org/en)
   - Wahan se **"LTS" (Long Term Support)** wala version download karke install kar lijiye (Next -> Next -> Install).

2. **Docker Desktop for Mac**
   - Link: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Download for Mac (Apple Silicon ya Intel, jo bhi aapka Mac ho).
   - Install hone ke baad usko open zaroor karna (Pehli baar open karne par background me chalne lagega, upar menu bar me whale 🐳 ka icon aayega).

3. **Visual Studio Code (VS Code)**
   - Link: [https://code.visualstudio.com/](https://code.visualstudio.com/)
   - Mac ke liye download karke install kar lijiye.

4. **Phone Par "Expo Go" App**
   - Apne mobile me Google Play Store ya Apple App Store kholiye aur **"Expo Go"** app search karke download kar lijiye.

---

## 🚀 Step 2: Project Open Karna aur IP Change Karna

Jab aap apne is Windows laptop se ZIP file banakar MacBook me dalenge, toh:
1. ZIP ko extract karke us folder ko **VS Code** me open kijiye.
2. MacBook ke VS Code me Terminal open kijiye (Shortcut: `` Control + ` ``).
3. Terminal me ye command type karke `Enter` dabaiye taaki MacBook ka naya WiFi IP address pata chal sake:
   ```bash
   ipconfig getifaddr en0
   ```
   *(Ye aapko ek IP dega, jaise `192.168.1.5` ya `10.x.x.x`)*
4. Ab VS Code me ye file kholiye: `mobile-client/src/services/api.ts`
5. Line number 7 par jo purani IP likhi hai, uski jagah nayi IP daal dijiye:
   `const API_URL = 'http://NAYI_IP_DAAL_DENA:4000/api';`
6. File ko Save (Cmd + S) kar dijiye.

---

## 🔥 Step 3: Run the Project (Final Demo Commands)

Ab aapko sirf 2 terminal tabs chahiye VS Code me:

**Terminal 1 (Backend & Web Client chalane ke liye):**
VS Code ke main folder me ye command run karein:
```bash
docker compose up -d
```
*(Kyunki Mac me pehli baar chalega, toh Docker download karne me 2-3 minute lega. Uske baad sab apne aap start ho jayega! Aap `http://localhost:3000` par browser me check kar sakte hain).*

**Terminal 2 (Mobile App chalane ke liye):**
Terminal ke upar `+` icon dabakar ek naya terminal kholiye aur ye run karein:
```bash
cd mobile-client
npm install
npx expo start
```

### 🎉 The Magic Trick (Teacher ke saamne):
Jaise hi aap `npx expo start` run karenge, MacBook ki screen par ek **bada sa QR Code** aayega.
Apne phone me **Expo Go** app kholiye, "Scan QR Code" par click kijiye aur Macbook ki screen scan kariye. 

BAM! 💥 Aapki PhoneMail app directly aapke phone par bina install kiye smoothly chalne lagegi aur Macbook ke backend se automatically connected hogi!
