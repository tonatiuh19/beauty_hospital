#!/bin/bash

# Remove old variables
vercel env rm DB_HOST production --yes
vercel env rm DB_PORT production --yes
vercel env rm DB_USER production --yes
vercel env rm DB_PASSWORD production --yes
vercel env rm DB_NAME production --yes

# Add new variables (without newlines)
printf "mx50.hostgator.mx" | vercel env add DB_HOST production
printf "3306" | vercel env add DB_PORT production
printf "alanchat_support" | vercel env add DB_USER production
printf "Beauty2025_db_" | vercel env add DB_PASSWORD production
printf "alanchat_beauty_hospital" | vercel env add DB_NAME production

echo "Environment variables updated! Now deploy with: vercel --prod"
