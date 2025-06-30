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
