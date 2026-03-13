# Cloud Functions Deployment Script for Windows PowerShell

Write-Host "🚀 Firebase Cloud Functions Setup" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if firebase CLI is installed
$firebase = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebase) {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
} else {
    Write-Host "✓ Firebase CLI found" -ForegroundColor Green
}

# Check if functions/.env.local exists
$envPath = "functions\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host ""
    Write-Host "⚠️  Creating functions/.env.local template..." -ForegroundColor Yellow
    
    $envContent = @"
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
TELEGRAM_CHAT_ID=YOUR_CHAT_ID_HERE
"@
    
    Set-Content -Path $envPath -Value $envContent
    Write-Host "📝 Please edit functions/.env.local with your credentials" -ForegroundColor Yellow
    exit 1
}

# Read env vars from .env.local
Write-Host "📖 Reading env vars from functions/.env.local..." -ForegroundColor Blue

$envVars = @{}
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($key -ne '' -and -not $key.StartsWith('#')) {
            $envVars[$key] = $value
        }
    }
}

$botToken = $envVars["TELEGRAM_BOT_TOKEN"]
$chatId = $envVars["TELEGRAM_CHAT_ID"]

if (-not $botToken -or -not $chatId) {
    Write-Host "❌ Missing env vars in functions/.env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Env vars loaded" -ForegroundColor Green

# Set Firebase config
Write-Host ""
Write-Host "🔧 Configuring Firebase..." -ForegroundColor Blue
firebase functions:config:set `
    telegram.bot_token=$botToken `
    telegram.chat_id=$chatId

Write-Host "✓ Firebase config set" -ForegroundColor Green

# Deploy
Write-Host ""
Write-Host "📤 Deploying Cloud Functions..." -ForegroundColor Blue
firebase deploy --only functions

Write-Host ""
Write-Host "✅ Deploy complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check functions in Firebase Console: https://console.firebase.google.com"
Write-Host "2. View logs: firebase functions:log"
Write-Host "3. Test by updating Firestore data"
