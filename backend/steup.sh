#!/bin/bash

# Roomy Backend File Structure Creation Script
# This script creates the complete backend file structure for the Roomy project

echo "🚀 Creating Roomy Backend File Structure..."

# Create main directories
echo "📁 Creating directories..."
mkdir -p src/controllers/v1
mkdir -p src/services
mkdir -p src/models
mkdir -p src/routes/v1
mkdir -p src/middleware
mkdir -p src/config
mkdir -p src/utils
mkdir -p tests/controllers
mkdir -p tests/services
mkdir -p tests/integration

# Create controller files
echo "🎮 Creating controller files..."
touch src/controllers/v1/authController.js
touch src/controllers/v1/groupController.js
touch src/controllers/v1/taskController.js
touch src/controllers/v1/aiController.js
touch src/controllers/index.js

# Create service files
echo "⚙️ Creating service files..."
touch src/services/authService.js
touch src/services/groupService.js
touch src/services/taskService.js
touch src/services/aiService.js
touch src/services/notificationService.js

# Create model files
echo "📊 Creating model files..."
touch src/models/User.js
touch src/models/Group.js
touch src/models/Task.js
touch src/models/Expense.js
touch src/models/index.js

# Create route files
echo "🛣️ Creating route files..."
touch src/routes/v1/auth.js
touch src/routes/v1/groups.js
touch src/routes/v1/tasks.js
touch src/routes/v1/ai.js
touch src/routes/v1/index.js
touch src/routes/index.js

# Create middleware files
echo "🔧 Creating middleware files..."
touch src/middleware/auth.js
touch src/middleware/validation.js
touch src/middleware/groupPermissions.js
touch src/middleware/rateLimiter.js
touch src/middleware/errorHandler.js

# Create config files
echo "⚙️ Creating config files..."
touch src/config/database.js
touch src/config/jwt.js
touch src/config/gemini.js

# Create utility files
echo "🛠️ Creating utility files..."
touch src/utils/logger.js
touch src/utils/responseHelper.js
touch src/utils/validators.js
touch src/utils/constants.js

# Create test files
echo "🧪 Creating test files..."
touch tests/controllers/authController.test.js
touch tests/controllers/groupController.test.js
touch tests/controllers/taskController.test.js
touch tests/services/authService.test.js
touch tests/services/groupService.test.js
touch tests/services/taskService.test.js
touch tests/integration/auth.test.js
touch tests/integration/tasks.test.js

# Create main files if they don't exist
echo "📄 Creating main application files..."
if [ ! -f server.js ]; then
    touch server.js
fi

if [ ! -f src/app.js ]; then
    touch src/app.js
fi

# Create additional configuration files
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build output
dist/
build/

# Test files
temp/
tmp/
EOF
fi

if [ ! -f .eslintrc.js ]; then
    echo "📝 Creating .eslintrc.js..."
    cat > .eslintrc.js << 'EOF'
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
EOF
fi

if [ ! -f jest.config.js ]; then
    echo "📝 Creating jest.config.js..."
    cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/*.js',
  ],
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
EOF
fi

if [ ! -f tests/setup.js ]; then
    echo "📝 Creating test setup file..."
    cat > tests/setup.js << 'EOF'
// Test setup file
require('dotenv').config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(10000);

// Mock console for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
EOF
fi

if [ ! -f README.md ]; then
    echo "📝 Creating README.md..."
    cat > README.md << 'EOF'
# Roomy Backend API

Intelligent roommate task management platform with AI-powered voice assistance.

## Features

- 🏠 Household group management
- ✅ Collaborative task management
- 🎤 AI-powered voice task creation
- 📅 Shared calendar integration
- 💰 Basic expense tracking
- 🔄 Real-time synchronization

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **AI Integration**: Google Gemini 2.0 Flash
- **Real-time**: Socket.io

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm test
   ```

## API Documentation

API documentation is available at `/api-docs` when running the server.

## Project Structure

```
src/
├── controllers/v1/    # Request handlers
├── services/          # Business logic
├── models/           # Database schemas
├── routes/v1/        # Route definitions
├── middleware/       # Custom middleware
├── config/          # Configuration files
└── utils/           # Utility functions
```

## Contributing

This is an academic project for Mobile OS & Frameworks + XML & Web Services courses.

## License

MIT
EOF
fi

# Create a sample .env.example if it doesn't exist
if [ ! -f .env.example ]; then
    echo "📝 Creating .env.example..."
    cat > .env.example << 'EOF'
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/roomy_development

# Security Configuration
JWT_ACCESS_SECRET=your-256-bit-access-secret-key-here
JWT_REFRESH_SECRET=your-256-bit-refresh-secret-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# External Service Integration
GEMINI_API_KEY=your-google-ai-studio-api-key-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Application Configuration
NODE_ENV=development
PORT=3000
API_VERSION=1.0
CORS_ORIGIN=http://localhost:3001

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
fi

echo ""
echo "✅ Backend file structure created successfully!"
echo ""
echo "📁 Directory structure:"
tree -I 'node_modules' . 2>/dev/null || find . -type d -not -path './node_modules*' | head -20

echo ""
echo "📋 Next steps:"
echo "1. Copy your environment variables: cp .env.example .env"
echo "2. Edit .env with your actual values"
echo "3. Install dependencies: npm install"
echo "4. Start development: npm run dev"
echo ""
echo "🎉 Ready to start building your Roomy backend!"