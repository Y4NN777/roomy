# Roomy Backend API

Intelligent roommate task management platform with AI-powered voice assistance.

## Features

- 🏠 Household group management: Create, join, and manage roommate groups with role-based permissions and invite codes.
- ✅ Collaborative task management: Assign, track, and comment on shared tasks with filtering, statistics, and reminders.
- 🎤 AI-powered voice task creation: (Planned) Natural language and voice input for task suggestions and creation.
- 📅 Shared calendar integration: (Planned) Sync tasks and events with group calendars.
- 💰 Expense tracking & splitting: Log expenses, split costs (equal/custom), track balances, and send payment reminders.
- 🔄 Real-time synchronization: (Planned) WebSocket-based notifications for instant updates.
- 📧 Email notifications: Invites, reminders, and important activity alerts.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (access & refresh tokens)
- **AI Integration**: Google Gemini 2.0 Flash (planned)
- **Real-time**: Socket.io (planned)
- **Testing**: Jest

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

- Full API documentation: See [`../docs/API.md`](../docs/API.md) for a detailed, code-accurate endpoint and feature reference.
- Swagger/OpenAPI docs: Available at `/api-docs` when running the server.

## Backend Project Structure

```text
backend/
├── .env.example
├── .eslintrc.js
├── .gitignore
├── jest.config.js
├── package.json
├── package-lock.json
├── README.md
├── server.js
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── database.js
│   │   ├── email.js
│   │   ├── gemini.js
│   │   └── jwt.js
│   ├── controllers/
│   │   ├── index.js
│   │   └── v1/
│   │       ├── aiController.js
│   │       ├── authController.js
│   │       ├── debugController.js
│   │       ├── expenseController.js
│   │       ├── groupController.js
│   │       └── taskController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── expensePermissions.js
│   │   ├── groupPermissions.js
│   │   ├── rateLimiter.js
│   │   ├── upload.js
│   │   └── validation.js
│   ├── models/
│   │   ├── Expense.js
│   │   ├── Group.js
│   │   ├── index.js
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/
│   │   ├── index.js
│   │   └── v1/
│   │       ├── ai.js
│   │       ├── auth.js
│   │       ├── expenses.js
│   │       ├── groups.js
│   │       ├── index.js
│   │       └── tasks.js
│   ├── services/
│   │   ├── aiService.js
│   │   ├── authService.js
│   │   ├── expenseService.js
│   │   ├── groupService.js
│   │   ├── notificationService.js
│   │   └── taskService.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── emailTemplates.js
│   │   ├── logger.js
│   │   ├── responseHelper.js
│   │   └── validators.js
│   └── tests/
│       ├── setup.js
│       ├── controllers/
│       │   ├── authController.test.js
│       │   ├── groupController.test.js
│       │   └── taskController.test.js
│       ├── integration/
│       │   ├── auth.test.js
│       │   └── tasks.test.js
│       └── services/
│           ├── authService.test.js
│           ├── groupService.test.js
│           └── taskService.test.js
├── uploads/
│   └── profiles/
```

## Contributing

This is an academic project for Mobile OS & Frameworks + XML & Web Services courses.

## License

MIT
