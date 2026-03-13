#!/bin/bash
# Cloud Functions Setup Script

echo "🚀 Firebase Cloud Functions Setup"
echo "=================================="

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
else
    echo "✓ Firebase CLI found"
fi

# Check if .env exists in functions
if [ ! -f "functions/.env.local" ]; then
    echo ""
    echo "⚠️  Creating functions/.env.local template..."
    cat > functions/.env.local << 'EOF'
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
TELEGRAM_CHAT_ID=YOUR_CHAT_ID_HERE
EOF
    echo "📝 Please edit functions/.env.local with your credentials"
    exit 1
fi

# Read env vars
export $(cat functions/.env.local | grep -v '^#' | xargs)

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "❌ Missing env vars in functions/.env.local"
    exit 1
fi

echo "✓ Env vars loaded"

# Set Firebase config
echo ""
echo "🔧 Configuring Firebase..."
firebase functions:config:set \
    telegram.bot_token="$TELEGRAM_BOT_TOKEN" \
    telegram.chat_id="$TELEGRAM_CHAT_ID"

echo "✓ Firebase config set"

# Deploy
echo ""
echo "📤 Deploying Cloud Functions..."
firebase deploy --only functions

echo ""
echo "✅ Deploy complete!"
echo ""
echo "Next steps:"
echo "1. Check functions in Firebase Console"
echo "2. View logs: firebase functions:log"
echo "3. Test by updating Firestore data"
