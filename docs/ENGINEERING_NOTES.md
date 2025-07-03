# Roomy Backend Engineering Notes

## Project Status (as of July 2, 2025)

This document provides an overview of the current state of the Roomy backend, the engineering approaches taken, and guidance for future contributors to complete or extend the work.

---

## 1. Project Status Overview

- **Core Features Implemented:**
  - User authentication (JWT-based)
  - Group management (creation, membership, admin transfer, invites)
  - Task management (CRUD, assignment, notifications via REST)
  - Expense management (logging, splitting, balances, statistics)
  - Email notifications for key events
  - Role-based access and security middleware

- **Not Implemented / Planned:**
  - Real-time in-app notifications (WebSocket, push logic not implemented)
  - AI voice/text processing (endpoints and stubs exist, backend logic not implemented)

---

## 2. Engineering Approaches & Choices

### API Design

- RESTful API, versioned under `/api/v1/`.
- Consistent use of HTTP status codes and JSON responses.
- Modular route structure (per feature: auth, groups, tasks, expenses, ai).

### Authentication & Security

- JWT for stateless authentication; refresh tokens supported.
- Middleware for authentication, authorization, and rate limiting.
- Role-based permissions for sensitive actions (admin/member distinction).
- Data validation middleware for all incoming requests.

### Code Organization

- **Controllers:** Handle request/response logic, separated by feature. Example: `expenseController.js` with methods like `createExpense`, `getExpenses`, `deleteExpense`, `setCustomSplits`, etc.

- **Services:** Business logic and data manipulation, reusable across controllers. Example: `ExpenseService` class in `expenseService.js` with methods like `createExpense`, `getExpenses`, `getGroupBalances`, `setCustomSplits`, `validateExpenseIntegrity`, etc.

- **Models:** Mongoose schemas for MongoDB collections (User, Group, Task, Expense). Example: `Expense.js` with static methods like `getGroupExpenses`, `getDetailedBalanceExplanation`.

- **Middleware:** Auth, permissions, error handling, validation, file uploads. Example: `expensePermissions.js` for verifying access to expense actions.

- **Utils:** Helpers for email, logging, response formatting, etc.

### Notifications

- **Email notifications** are implemented for group invites, task/expense events, and reminders. See `notificationService.js` for methods like `sendEmail`, `sendGroupInvitation`, `sendWelcomeToGroup`, `sendRoleChangeNotification`, etc.

- **Real-time in-app notifications:** REST endpoints and WebSocket stubs exist, but push logic is not implemented. See `notificationService.js` for planned structure and stub methods like `sendInAppNotification`.

### AI Voice Processing

- Endpoints and service stubs exist for AI-driven task creation, but no actual AI logic is implemented. See `aiController.js` and `aiService.js` for extension points.

### Testing

- Unit and integration tests exist for core features (auth, groups, tasks, expenses).
- Use Jest for testing; see `backend/tests/` for structure.

---

## 3. Key Classes, Functions, and Files

### Controllers

- **authController.js**: Handles registration, login, token refresh, logout, profile retrieval/update, and profile picture deletion.

- **groupController.js**: Manages group creation, joining, info retrieval, updates, member management, admin transfer, leaving, invite code regeneration, statistics, group listing, email invitations, member listing, activity, role updates, group search, and user group listing.

- **taskController.js**: Handles task creation, retrieval, update, completion, deletion, notes, user tasks, and statistics.

- **expenseController.js**: Handles all expense-related HTTP requests. Main methods:
  - `createExpense`, `getExpenses`, `getExpense`, `updateExpense`, `deleteExpense`, `markSplitPaid`, `getGroupBalances`, `getEnhancedGroupBalances`, `getDetailedUserBalance`, `validateExpenseIntegrity`, `setCustomSplits`, `resetToEqualSplits`, `getExpenseSummary`, `createExpenseWithCustomSplits`, `getUnpaidExpenses`, `getMyOwedAmount`, `getExpenseStatistics`, `sendPaymentReminders`.

- Other controllers: `aiController.js` (stub), `debugController.js` (for admin/debugging purposes).

### Services

- **authService.js**: Handles user registration, login, token refresh, logout, profile management, and profile picture deletion.
- **groupService.js**: Manages group creation, joining, info retrieval, updates, member management (remove, transfer admin, leave), invite code regeneration, statistics, group listing, email invitations, member listing, activity, role updates, group search, and user group listing.
- **taskService.js**: Handles task creation, retrieval, update, completion, deletion, notes, user tasks, statistics, and group task statistics update.
- **expenseService.js**: Core business logic for expenses. Main methods: create, retrieve, update, delete expenses; manage splits; balances; statistics; integrity validation; summaries; reminders; and more.
- **notificationService.js**: Email and (stub) in-app notification logic. Handles all email notifications, task/expense/group events, and planned real-time notification stubs.
- **aiService.js**: (Stub) Placeholder for future AI/voice processing logic.

### Models

- **Expense.js**: Mongoose schema for expenses. Static methods:
  - `getGroupExpenses`, `getDetailedBalanceExplanation`, etc.

- Other models: `User.js`, `Group.js`, `Task.js`.

### Middleware

- **expensePermissions.js**: Functions like `verifyExpenseAccess`, `verifyExpenseAdminAccess`, `verifyExpenseSplitAccess`.
- **groupPermissions.js**: Functions like `verifyGroupMembership`, `verifyGroupAdmin`.
- **auth.js**: `authenticateToken` middleware.
- **validation.js**: Request validation logic.

### Utilities

- **emailTemplates.js**: Email template generation for notifications.
- **logger.js**: Logging utility.
- **responseHelper.js**: Standardized API responses.
- **constants.js**: Shared constants.

---

## 4. Recommendations for Completion

- **Real-Time Notifications:**
  - Implement WebSocket server logic in `notificationService.js` and integrate with task/group/expense events.
  - Ensure notifications are pushed to connected clients and persisted for offline users.

- **AI Voice Processing:**
  - Integrate with a real AI/NLP service (e.g., Google Gemini, OpenAI) in `aiService.js`.
  - Implement intent extraction and task suggestion logic.

- **Frontend Integration:**
  - Ensure all endpoints are documented and tested with real frontend flows.
  - Add CORS and security headers as needed for production.

- **Code Quality:**
  - Expand test coverage, especially for new features.
  - Refactor and document any complex logic for maintainability.

---

## 5. Contact & Handover

For questions or handover, please refer to the backend README or contact the current maintainer. All major architectural decisions are documented in `docs/ARCHITECTURE.md`.

---

*This document should be updated as the project evolves or as new contributors join.*
