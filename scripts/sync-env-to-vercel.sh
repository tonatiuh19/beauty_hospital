#!/bin/bash

# Script to sync .env.production to Vercel production environment
# Usage: ./scripts/sync-env-to-vercel.sh

ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found"
    exit 1
fi

echo "🚀 Syncing environment variables from $ENV_FILE to Vercel production..."
echo ""

# Read the .env.production file and add each variable
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extract variable name and value
    if [[ "$line" =~ ^([A-Z_][A-Z0-9_]*)=(.*)$ ]]; then
        VAR_NAME="${BASH_REMATCH[1]}"
        VAR_VALUE="${BASH_REMATCH[2]}"
        
        echo "📝 Adding $VAR_NAME..."
        echo "$VAR_VALUE" | vercel env add "$VAR_NAME" production
    fi
done < "$ENV_FILE"

echo ""
echo "✅ Done! Environment variables synced to Vercel production."
echo ""
echo "Next steps:"
echo "1. Verify with: vercel env ls"
echo "2. Deploy with: vercel --prod"
