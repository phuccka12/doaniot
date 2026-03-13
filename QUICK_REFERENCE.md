# ⚡ Quick Reference Guide

**Last Updated:** 2024  
**Project:** IoT Health Monitoring System

---

## 🎯 I want to...

### Deploy Cloud Functions NOW 🚀

```bash
# Windows (PowerShell)
cd d:\DoanIot\functions
.\deploy.ps1

# OR Manual (any platform)
cd d:\DoanIot
firebase login
firebase functions:config:set telegram.bot_token="YOUR_TOKEN" telegram.chat_id="YOUR_CHAT_ID"
firebase deploy --only functions
```

### Test the System 🧪

```bash
# Option 1: Cloud Functions (after deploy)
firebase functions:log

# Option 2: Local Python Bot
cd d:\DoanIot\bot
python quickstart.py

# Option 3: Manual Firestore test
firebase firestore:import <backup-file>
# Or update health_monitoring/phuc_dev manually
```

### Check Deployment Status 📊

```bash
firebase functions:list
firebase functions:log --limit 50
```

### View Dashboard 🎨

```bash
cd d:\DoanIot
npm run dev
# Open: http://localhost:3000
```

### Update Telegram Bot Token 🔐

```bash
firebase functions:config:set telegram.bot_token="NEW_TOKEN"
firebase deploy --only functions
```

---

## 📂 File Structure Cheat Sheet

```
d:\DoanIot/
├── 🎨 FRONTEND (React/Next.js)
│   ├── src/app/page.tsx          ← Dashboard
│   ├── src/lib/firebase.js        ← Firebase config
│   ├── next.config.ts
│   └── tsconfig.json
│
├── ☁️ CLOUD FUNCTIONS (Node.js)
│   ├── functions/index.js         ← 4 triggers
│   ├── functions/package.json
│   ├── functions/deploy.ps1       ← Deploy script
│   └── functions/.env.local       ← Secrets
│
├── 🤖 LOCAL BOT (Python)
│   ├── bot/main.py                ← Main bot
│   ├── bot/quickstart.py          ← Test mode
│   ├── bot/config.py              ← Config
│   ├── bot/requirements.txt        ← Dependencies
│   └── bot/.env                   ← Secrets
│
├── 📚 DOCUMENTATION
│   ├── ARCHITECTURE.md            ← System overview
│   ├── DEPLOYMENT_STATUS.md       ← Checklist
│   ├── README.md                  ← Project intro
│   ├── bot/QUICKSTART.md          ← Bot setup
│   └── functions/CLOUD_FUNCTIONS_GUIDE.md
│
└── ⚙️ CONFIG
    ├── firebase.json
    ├── package.json
    └── .env.example
```

---

## 🚨 Cloud Functions: 4 Triggers

| Trigger | Watches | Sends | Action |
|---------|---------|-------|--------|
| 🔴 **onFallDetected** | `fall: false→true` | 🆘 SOS alert | Auto-create incident |
| ⚠️ **onHealthAlerts** | `hr` or `spo2` change | ⚠️ Warning | Check thresholds |
| 📋 **onNewIncidentLog** | `/logs` created | 📢 Notification | Include Maps link |
| 👁️ **updateLastSeen** | Any update | ⏱️ Timestamp | Status in dashboard |

---

## 📱 Telegram Bot Setup

### Get Bot Token

1. Open Telegram → @BotFather
2. `/newbot` → name → username
3. Copy token: `123456789:ABCdef...`

### Get Chat ID

```bash
# Send message to your bot
# Then run:
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"

# Look for: "chat":{"id":123456789}
```

### Test Bot

```bash
curl "https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>&text=Hello"
```

---

## 🔧 Commands

### Firebase CLI

```bash
firebase login                    # Authenticate
firebase projects:list            # List projects
firebase init                     # Setup project
firebase deploy                   # Deploy all
firebase deploy --only functions  # Deploy functions only
firebase functions:list           # List functions
firebase functions:log            # Watch logs
firebase firestore:indexes        # Check indexes
firebase shell                    # Interactive shell
```

### NPM / Node.js

```bash
npm install                       # Install deps
npm run dev                       # Dev server
npm run build                     # Build
npm test                          # Tests
npx tsc --noEmit                 # TS check
```

### Python

```bash
pip install -r requirements.txt   # Install deps
python quickstart.py              # Run bot
python -m venv venv               # Create venv
venv\Scripts\activate             # Activate (Windows)
source venv/bin/activate          # Activate (Mac/Linux)
```

### Git

```bash
git status
git add .
git commit -m "message"
git push origin main
```

---

## 🐛 Common Issues & Fixes

### Error: "TELEGRAM_BOT_TOKEN is undefined"

**Fix:**
```bash
firebase functions:config:set telegram.bot_token="YOUR_TOKEN"
firebase deploy --only functions
```

### Error: "Permission denied" on Firestore

**Fix:**
```
Go to Firebase Console → Firestore → Rules
Change: allow write: if request.auth != null;
```

### Error: "Function not found"

**Fix:**
```bash
firebase functions:list          # Check deployed
firebase deploy --only functions # Deploy again
```

### Python: "ModuleNotFoundError: No module named 'firebase'"

**Fix:**
```bash
cd d:\DoanIot\bot
pip install -r requirements.txt
python quickstart.py
```

### Telegram: "400 Bad Request"

**Fix:**
- Verify token format (should have colon)
- Verify chat ID is a number
- Check message encoding (UTF-8)

---

## 📊 Monitoring

### Cloud Functions

```bash
# Watch real-time logs
firebase functions:log --follow

# View errors only
firebase functions:log | grep -i error

# View specific function
firebase functions:log --function onFallDetected

# Get last 100 entries
firebase functions:log --limit 100
```

### Firestore

```bash
# Via Firebase CLI
firebase firestore:indexes

# Via Console
https://console.firebase.google.com → Firestore → Data
```

### Python Bot

```bash
# Logs saved to: d:\DoanIot\bot\bot.log
type bot.log
```

---

## 🔐 Security Checklist

- [x] Environment variables (not hardcoded)
- [x] Firestore security rules
- [x] Firebase authentication enabled
- [ ] Enable backup & disaster recovery
- [ ] Setup billing alerts
- [ ] Review access logs regularly

---

## 🚀 Deployment Checklist

### Before Deploy:

```
[ ] Firebase project created
[ ] Firestore database enabled
[ ] Telegram bot token obtained
[ ] .env file configured
[ ] Cloud Functions code reviewed
[ ] No hardcoded secrets in code
```

### Deploy:

```
[ ] firebase login
[ ] firebase functions:config:set telegram.bot_token="..." telegram.chat_id="..."
[ ] firebase deploy --only functions
[ ] firebase functions:list (verify)
[ ] firebase functions:log (watch)
```

### After Deploy:

```
[ ] Test manual Firestore update
[ ] Verify Telegram receives alert
[ ] Monitor logs for errors
[ ] Check Cloud Function metrics
```

---

## 📞 Help Links

| Topic | URL |
|-------|-----|
| Firebase Functions | https://firebase.google.com/docs/functions |
| Telegram Bot API | https://core.telegram.org/bots/api |
| Node.js | https://nodejs.org/docs |
| Python | https://docs.python.org/3 |
| GitHub | https://github.com |

---

## 💡 Pro Tips

1. **Always backup Firestore before major changes**
   ```bash
   firebase firestore:export ./backup
   ```

2. **Use Firebase Emulator for local testing**
   ```bash
   firebase emulators:start
   ```

3. **Monitor costs**
   - Cloud Functions free tier: 2M invocations/month
   - Firestore free tier: 1GB storage, 50K reads/day

4. **Use `firebase shell` for debugging**
   ```bash
   firebase shell
   > admin.firestore().collection('logs').count().get()
   ```

5. **Keep multiple devices in config for testing**
   ```python
   IOT_DEVICES = {
       'phuc_dev': {...},
       'test_device': {...},
       'emergency_test': {...}
   }
   ```

---

## 📋 Environment Variables Reference

### Cloud Functions (Firebase)

```env
# Set via Firebase CLI:
firebase functions:config:set telegram.bot_token="123456789:ABCdef..."
firebase functions:config:set telegram.chat_id="987654321"

# Access in code:
const token = process.env.TELEGRAM_BOT_TOKEN;
```

### Python Bot (Local)

```env
# Create bot/.env file:
TELEGRAM_BOT_TOKEN=123456789:ABCdef...
TELEGRAM_CHAT_ID=987654321
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

### Next.js Dashboard

```env
# Create .env.local:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

---

## 🎓 Learning Path

1. **Understand Architecture**
   - Read `ARCHITECTURE.md` (5 min)

2. **Deploy Cloud Functions**
   - Run `deploy.ps1` (5 min)
   - Watch logs: `firebase functions:log` (ongoing)

3. **Test System**
   - Manual Firestore updates (5 min)
   - Verify Telegram alerts (2 min)

4. **Integrate ESP32**
   - Program sensor board (30 min)
   - Update Firestore collection (10 min)

5. **Monitor & Scale**
   - Add more devices (10 min each)
   - Optimize alerts (ongoing)

**Total: ~1 hour from zero to working system** ⚡

---

## 🎉 Success Indicators

After deployment, you'll know it's working when:

✅ `firebase functions:list` shows 4 functions  
✅ Update Firestore → Telegram receives alert in <1s  
✅ Dashboard shows real-time data  
✅ `firebase functions:log` shows no errors  
✅ Multiple devices can send data simultaneously  

---

**Need help? Check ARCHITECTURE.md or DEPLOYMENT_STATUS.md** 📚
