# Deployment Guide

## Prerequisites
- Node.js 18+ with npm package manager
- Flutter 3.16+ with Dart SDK
- MongoDB 6.0+ (local installation or Atlas cloud service)
- Git for version control

## Backend Deployment
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables in .env
npm run build
npm run deploy
```

## Mobile Application Build
```bash
cd mobile
flutter pub get
flutter packages pub run build_runner build
flutter build apk --release    # Android
flutter build ios --release    # iOS (macOS required)
```

## Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/roomy_production
JWT_ACCESS_SECRET=your-256-bit-access-secret
JWT_REFRESH_SECRET=your-256-bit-refresh-secret
GEMINI_API_KEY=your-google-ai-studio-api-key
EMAIL_SERVICE_KEY=your-smtp-service-credentials
NODE_ENV=development
PORT=3000
API_VERSION=1.0
```
