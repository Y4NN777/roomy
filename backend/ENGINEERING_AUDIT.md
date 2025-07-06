# Roomy Backend Engineering Audit

This engineering audit delivers a comprehensive, code-driven review of the Roomy backend, examining every major architectural layer—including controllers, services, middleware, models, utilities, and core entry points—with a focus on correctness, security, stability, maintainability, and readiness for frontend integration. The audit confirms that all business logic is modularized and well-structured, with robust error handling, strong validation, and multi-layered security enforced throughout the stack. All present Mongoose models (`User`, `Group`, `Task`, `Expense`, `Notification`) are thoroughly validated and encapsulate domain logic, while AI features are cleanly integrated at the service level. Utilities and entry points follow best practices, ensuring clean separation of concerns and reliable operations. No critical issues or blockers were identified; only minor suggestions for future extensibility and analytics are noted. Overall, the Roomy backend is secure, stable, and production-ready, providing a solid foundation for seamless frontend integration and future growth.

This document provides a comprehensive, code-driven engineering review of the Roomy backend. Each controller, service, middleware, and model is systematically analyzed for feature completeness, security, code quality, and readiness for frontend integration. Any issues or risks are noted.

---

## 1. Controllers

### aiController.js
**Purpose:** Handles AI-powered features for processing voice/text input into task suggestions and confirming task creation.

**Key Methods:**
- `processVoiceInput(req, res)`: Validates input and group context, fetches group/user data, calls AI service for task extraction, returns suggestions and context.
- `confirmAndCreateTasks(tasks, context)`: Delegates task creation to aiService.
- `testAI(req, res)`: Dev-only endpoint for AI service connection and processing tests.
- `getStatus(req, res)`: Returns AI service availability, model info, and features.

**Security & Validation:**
- Relies on upstream authentication.
- Validates required input (`text`, `groupId`).
- Handles group/user context checks.

**Engineering Quality:**
- Clean separation of concerns.
- Handles errors and service unavailability.
- No sensitive data leaks.
- Uses helper utilities for responses and eventing.
- Production safety for test endpoints.

**Potential Issues:**
- No obvious issues. Assumes `req.user` is always present (should be enforced by auth middleware).

---

## 1. Controllers

### aiController.js
**Purpose:** Handles AI-powered features for processing voice/text input into task suggestions and confirming task creation.

**Key Methods:**
- `processVoiceInput(req, res)`: Validates input and group context, fetches group/user data, calls AI service for task extraction, returns suggestions and context.
- `confirmAndCreateTasks(tasks, context)`: Delegates task creation to aiService.
- `testAI(req, res)`: Dev-only endpoint for AI service connection and processing tests.
- `getStatus(req, res)`: Returns AI service availability, model info, and features.

**Security & Validation:**
- Relies on upstream authentication.
- Validates required input (`text`, `groupId`).
- Handles group/user context checks.

**Engineering Quality:**
- Clean separation of concerns.
- Handles errors and service unavailability.
- No sensitive data leaks.
- Uses helper utilities for responses and eventing.
- Production safety for test endpoints.

**Potential Issues:**
- No obvious issues. Assumes `req.user` is always present (should be enforced by auth middleware).

---

### authController.js
**Purpose:** Handles registration, login, token refresh, logout, and user profile management.

**Key Methods:**
- `register(req, res, next)`: Registers a new user, checks for duplicate emails.
- `login(req, res, next)`: Authenticates user and returns tokens.
- `refreshToken(req, res, next)`: Issues new access token from refresh token.
- `logout(req, res, next)`: Invalidates refresh token on logout.
- `getProfile(req, res, next)`: Returns current user's profile.
- `updateProfile(req, res, next)`: Updates user profile and optional profile picture.
- `deleteProfilePicture(req, res, next)`: Removes user's profile picture.

**Security & Validation:**
- Relies on upstream authentication for profile actions.
- Handles duplicate email, missing/invalid tokens, and missing user cases.

**Engineering Quality:**
- Delegates business logic to `authService`.
- Consistent error handling and response structure.
- No sensitive data leaks.

**Potential Issues:**
- No obvious issues. All error cases handled; relies on service for deeper validation.

---

### debugController.js
**Purpose:** Provides development/debug endpoints for analyzing expenses and group balances.

**Key Methods:**
- `analyzeExpense(req, res, next)`: Returns detailed split/payment analysis for an expense.
- `analyzeBalances(req, res, next)`: Returns group member balances and validates net sum.

**Security & Validation:**
- Intended for debugging; should be protected or disabled in production.

**Engineering Quality:**
- Uses models directly for queries and calculations.
- Returns detailed validation and analysis objects.

**Potential Issues:**
- Should be restricted in production for security.

---

### expenseController.js
**Purpose:** Manages group expenses, splits, payments, statistics, and reminders.

**Key Methods:**
- `createExpense`, `createExpenseWithCustomSplits`: Create expenses with equal/custom splits.
- `getExpenses`, `getExpense`, `getExpenseSummary`: Retrieve expenses and summaries.
- `updateExpense`, `deleteExpense`: Modify or remove expenses.
- `markSplitPaid`, `setCustomSplits`, `resetToEqualSplits`: Manage split payments and configurations.
- `getGroupBalances`, `getEnhancedGroupBalances`, `getDetailedUserBalance`: Calculate and return balances.
- `validateExpenseIntegrity`: Validates all expenses in a group.
- `getUnpaidExpenses`, `getMyOwedAmount`, `getExpenseStatistics`: Retrieve unpaid, owed, and statistical data.
- `sendPaymentReminders`: Sends reminders to group members.

**Security & Validation:**
- Permission checks for all sensitive actions.
- Handles not-found, permission, and validation errors.

**Engineering Quality:**
- Delegates all business logic to `expenseService`.
- Consistent error handling and response structure.
- Comprehensive coverage of expense flows.

**Potential Issues:**
- No major issues. Relies on service layer for deeper validation.

---

### groupController.js
**Purpose:** Manages group creation, membership, admin actions, invitations, and statistics.

**Key Methods:**
- `createGroup`, `joinGroup`: Group creation and joining via invite code.
- `getGroup`, `getAllGroups`, `searchGroups`: Retrieve group(s) and search.
- `updateGroup`, `removeMember`, `transferAdmin`, `regenerateInviteCode`: Admin actions.
- `leaveGroup`, `getGroupMembers`, `getGroupActivity`, `updateMemberRole`: Member management.
- `getGroupStatistics`, `getMyGroups`, `sendEmailInvitation`: Stats and communication.

**Security & Validation:**
- Handles not-found, permission, duplicate, and validation errors.
- Admin/member checks for sensitive actions.

**Engineering Quality:**
- Delegates business logic to `groupService`.
- Returns detailed error codes for edge cases.
- Covers all typical group flows.

**Potential Issues:**
- No major issues. Relies on service for deeper validation.

---

### notificationController.js
**Purpose:** Manages notifications, preferences, real-time updates, and broadcasts.

**Key Methods:**
- `getNotifications`, `getUnreadCount`, `getNotificationsByType`: Retrieve notifications.
- `markAsRead`, `markAllAsRead`, `bulkMarkAsRead`: Mark notifications read.
- `deleteNotification`, `bulkDelete`: Delete notifications.
- `getNotificationPreferences`, `updateNotificationPreferences`: Manage preferences.
- `getWebSocketStatus`, `getSystemStats`, `testEventEmission`: Real-time and system stats.
- `broadcastToGroup`, `sendDirectNotification`, `testNotification`: Broadcasting and dev/test endpoints.

**Security & Validation:**
- Permission checks for broadcast and sensitive actions.
- Handles not-found, permission, and validation errors.

**Engineering Quality:**
- Delegates logic to notification/websocket/event services.
- Consistent error handling and response structure.
- Dev/test endpoints restricted in production.

**Potential Issues:**
- No major issues. Relies on service for deeper validation.

---

### taskController.js
**Purpose:** Manages group and user tasks, assignment, completion, and notes.

**Key Methods:**
- `createTask`, `getTasks`, `getTask`, `updateTask`, `deleteTask`: CRUD for tasks.
- `completeTask`: Mark task complete.
- `addTaskNote`: Add note to task.
- `getUserTasks`, `getTaskStatistics`: Retrieve user/group tasks and stats.

**Security & Validation:**
- Permission checks for all sensitive actions.
- Handles not-found, permission, and validation errors.

**Engineering Quality:**
- Delegates business logic to `taskService`.
- Consistent error handling and response structure.
- AI suggestions included when available.

**Potential Issues:**
- No major issues. Relies on service for deeper validation.

---

## 2. Services

#### Central Index File
No `index.js` file is present in the main services directory. Services are imported individually. (Note: The notifications submodule does not have an index file either.)

### aiService.js
**Purpose:** Handles all interactions with Google Gemini AI for converting voice/text into task suggestions and confirming AI-generated tasks.

**Key Methods:**
- `initializeAI()`: Sets up Gemini AI client/model, disables features if API key missing.
- `processVoiceToTasks(text, context)`: Main entry; emits events, performs AI processing, returns suggestions, handles errors/fallbacks.
- `performAIProcessing(text, context)`: Builds prompt, calls model, parses/cleans response, enhances assignments.
- `confirmAndCreateTask(tasks, context)`: Creates tasks in system and emits confirmation event.
- `createFallbackResponse(text, context)`: Generates rule-based fallback suggestions if AI fails.

**Security & Validation:**
- Disables AI if no API key.
- Errors are logged and do not expose sensitive info.
- Fallback logic ensures user always receives a response.

**Engineering Quality:**
- Modular, well-logged, robust to AI/model failure.
- Event-driven for observability.
- Handles circular dependencies cleanly.

**Potential Issues:**
- No major issues. Assumes eventBus and taskService are always available.

---

### authService.js
**Purpose:** Handles all authentication, user registration, login, token management, and profile updates.

**Key Methods:**
- `registerUser(userData)`: Checks for existing user, creates user, generates tokens.
- `loginUser(email, password)`: Authenticates, updates last login, generates tokens.
- `refreshToken(refreshToken)`: Verifies and issues new access token.
- `logoutUser(userId)`: Revokes tokens by incrementing token version.
- `getUserProfile(userId)`: Retrieves user profile, group details, and role.
- `updateUserProfile(userId, updateData, profilePictureFile)`: Updates user fields and profile picture.
- `deleteProfilePicture(userId)`: Deletes profile picture from storage and DB.

**Security & Validation:**
- Validates user existence and active status.
- Checks token version for refresh/logout.
- Handles duplicate emails and missing/invalid tokens.

**Engineering Quality:**
- Consistent error handling and logging.
- Uses async/await and modular helpers.
- Cleans up files on profile picture update/delete.

**Potential Issues:**
- No major issues. File system errors on picture deletion are logged but not fatal.

---

### expenseService.js
**Purpose:** Manages all expense logic: creation, updates, splits, notifications, statistics, and reminders.

**Key Methods:**
- `createExpense(expenseData, payerId)`: Creates expense, calculates splits, triggers notifications/events.
- `updateExpense(expenseId, updateData, requestingUserId)`: Updates expense and recalculates splits if needed.
- `deleteExpense(expenseId, requestingUserId)`: Deletes expense after permission check.
- `markSplitPaid(expenseId, memberId, requestingUserId)`: Marks split as paid, triggers notifications.
- `sendPaymentReminders(groupId, requestingUserId, daysThreshold)`: Sends reminders for outstanding payments.
- `setCustomSplits(expenseId, customSplits, requestingUserId)`: Allows unequal split configuration.
- `getExpenses/getExpense`: Retrieves expenses for group or by ID.
- `getGroupBalances/getExpenseStatistics`: Calculates balances/statistics for group.
- `updateGroupExpenseStatistics(groupId)`: Updates group stats cache.

**Security & Validation:**
- Checks group/activity status, permissions, and membership for all actions.
- Validates splits and amounts.

**Engineering Quality:**
- Well-logged, modular, and robust to errors.
- Notification/event emission for all major actions.
- Handles circular dependencies for notifications.

**Potential Issues:**
- No major issues. Relies on models for validation.

---

### groupService.js
**Purpose:** Handles all group management: creation, membership, admin actions, invites, and statistics.

**Key Methods:**
- `createGroup(groupData, creatorId)`: Creates group, sets creator as admin, updates user.
- `joinGroup(inviteCode, userId, shouldSendWelcomeEmail)`: Adds user to group, sends welcome email.
- `getGroup/getAllGroups`: Retrieves group(s) with membership checks.
- `updateGroup/removeMember/transferAdmin`: Admin group actions.
- `leaveGroup`: Allows member to leave with admin checks.
- `regenerateInviteCode`: Admin-only action.
- `getGroupStatistics`: Retrieves/updates group stats.
- `sendEmailInvitation`: Sends invite email.
- `getGroupMembers/getGroupActivity/updateMemberRole/searchGroups/getMyGroups`: Member/admin management and queries.

**Security & Validation:**
- Checks membership, admin status, and group activity for all actions.
- Validates roles and prevents self-demotion.

**Engineering Quality:**
- Modular, event-driven, and robust error handling.
- Notification/email integration is lazy-loaded to avoid circular deps.

**Potential Issues:**
- No major issues. Relies on model validation for group/member integrity.

---

### taskService.js
**Purpose:** Manages all task logic: creation, updates, completion, notes, assignment, and statistics.

**Key Methods:**
- `createTask(taskData, creatorId)`: Creates task, checks membership, notifies assignee, emits events.
- `updateTask(taskId, updateData, requestingUserId)`: Updates task with permission and membership checks.
- `completeTask(taskId, requestingUserId, actualDuration)`: Marks task complete, updates stats.
- `deleteTask(taskId, requestingUserId)`: Deletes task after permission check.
- `getTasks/getTask`: Retrieves tasks for group or by ID.
- `addTaskNote(taskId, content, authorId)`: Adds note to task, checks membership.
- `getUserTasks`: Lists user tasks.
- `getTaskStatistics/updateGroupTaskStatistics`: Calculates and updates group stats.

**Security & Validation:**
- Checks group membership, permissions, and assignee validity for all actions.
- Validates status, assignment, and note authorship.

**Engineering Quality:**
- Modular, well-logged, and robust to errors.
- Notification/event emission for all major actions.
- Handles circular dependencies for notifications.

**Potential Issues:**
- No major issues. Relies on models for validation.

---

### Notification Service Layer

The notification subsystem is implemented as a set of modular services under `src/services/notifications/`:
- `notificationService.js` (main orchestrator: in-app, email, event-driven)
- `eventBus.js` (singleton event bus for decoupled event-driven architecture)
- `WebSocketService.js` (real-time delivery via websockets)
- `pushNotificationService.js` (placeholder or not yet implemented)

#### notificationService.js
**Purpose:** Central orchestrator for all notification types: in-app, email, and real-time. Handles event listening, notification creation, delivery, and user preferences.

**Key Features & Methods:**
- **Initialization:** Checks email config, sets up event listeners for all major domain events (tasks, expenses, groups, AI, etc.).
- **Email Delivery:** Uses nodemailer (via config) and custom templates for group invites, welcomes, role changes, task/expense events, etc. Handles errors gracefully and logs them.
- **In-App Notifications:** Persists notifications to MongoDB, supports CRUD, marking read, snoozing, digests, and stats. Integrates with WebSocket and eventBus for delivery.
- **Group Broadcasts & Direct:** Supports group-wide and direct user notifications, with permission checks handled by upstream logic.
- **Bulk Operations:** Bulk mark/read/delete for user notification management.
- **User Preferences:** Allows per-user notification preference management (types, channels, do-not-disturb, etc.).
- **Event-Driven:** Listens to all relevant events via eventBus and triggers appropriate notification workflows.
- **Cleanup:** Can remove all listeners for graceful shutdown.

**Security & Validation:**
- Email sending is gated by config/env checks.
- All notification creation and delivery is logged.
- Does not expose sensitive info; errors are handled and do not leak data.
- Relies on upstream permission checks for sensitive actions (broadcast, direct notify).

**Engineering Quality:**
- Highly modular, event-driven, and robust.
- Gracefully handles failures in any delivery channel (email, socket, etc.).
- Scalable: supports bulk ops and high event throughput.
- Good separation of concerns (email, in-app, real-time, event listening).

**Potential Issues:**
- Large file and class; could benefit from further splitting if complexity increases.
- Assumes eventBus and WebSocketService are always available.
- Email delivery can fail silently if config is missing (warns in logs).

---

#### eventBus.js
**Purpose:** Singleton event emitter (extends Node's EventEmitter) for decoupled, application-wide pub-sub. Used by all services to emit and subscribe to domain events.

**Key Features & Methods:**
- **safeEmit:** Emits events with error handling to prevent crashes from listener exceptions.
- **setupEventLogging:** Logs all emitted events for observability.
- **onMultiple:** Allows subscribing a handler to multiple events at once.
- **onceWithTimeout:** Waits for an event with a timeout (prevents hangs).
- **getStats:** Returns event/listener stats for monitoring.
- **cleanup:** Removes all listeners for clean shutdown.

**Security & Validation:**
- No sensitive data exposed in logs.
- All event emission is logged.

**Engineering Quality:**
- Decouples all major backend subsystems (notifications, tasks, expenses, AI, etc.).
- Prevents memory leaks with listener limits and cleanup.
- Robust to event handler errors.

**Potential Issues:**
- No major issues. Relies on proper event naming and listener cleanup.

---

#### WebSocketService.js
**Purpose:** Handles all real-time, bidirectional communication between server and clients using Socket.IO. Used for instant notification delivery, group/user presence, and activity feeds.

**Key Features & Methods:**
- **Initialization:** Sets up Socket.IO, CORS, authentication middleware (JWT-based), and all connection handlers.
- **Connection Management:** Tracks connected users, group rooms, and user-to-socket mappings.
- **Event Handling:** Listens for notification, task, expense, and AI events via eventBus; broadcasts to users/groups as appropriate.
- **Notification Delivery:** Delivers notifications to individual users or groups in real time.
- **Presence:** Broadcasts user online/offline status to group members.
- **Stats:** Provides connection and group membership stats for monitoring.
- **Cleanup:** Graceful shutdown and resource cleanup.

**Security & Validation:**
- Requires JWT auth for all socket connections.
- Verifies user/group membership before broadcasting.
- Does not expose sensitive data over the wire.

**Engineering Quality:**
- Modular, robust, and scalable for multi-user/group scenarios.
- Handles connection churn and user presence efficiently.
- Integrates tightly with eventBus and notificationService.

**Potential Issues:**
- Assumes user/group state is always up to date in DB.
- Socket authentication failures are handled but could be further hardened.

---

#### pushNotificationService.js
**Purpose:** Placeholder or not yet implemented. No outline or code present.

---

**Summary:**
The notification service layer is robust, modular, and highly event-driven, supporting email, in-app, and real-time notifications. Security and validation are handled at multiple layers, and the system is engineered for scalability and resilience. Minor improvements could include further splitting notificationService.js for maintainability and expanding push notification support if needed.

## 3. Middleware

#### Central Index File
No `index.js` file is present in the middleware directory. Each middleware module is imported directly.

### auth.js
**Purpose:** Handles JWT-based authentication for routes and optional authentication.

**Key Features:**
- Validates JWT tokens, checks user activity, handles token revocation.
- Attaches user info to request for downstream use.
- Supports both required and optional authentication.

**Security & Validation:**
- Strict token validation, user activity checks, no sensitive data leaks.
- Handles errors gracefully.

**Engineering Quality:**
- Modular and reusable. Clear separation of concerns.

**Improvement Suggestions:**
- Could add token blacklisting for instant revocation if needed.

---

### errorHandler.js
**Purpose:** Centralized error-handling middleware for all Express routes.

**Key Features:**
- Logs errors with context (stack, URL, user agent, etc.).
- Handles Mongoose/JWT errors, provides generic fallback.

**Security & Validation:**
- No sensitive data in responses. Detailed logs for debugging.

**Engineering Quality:**
- Standardized error responses. Comprehensive error coverage.

**Improvement Suggestions:**
- Could integrate with external error tracking.

---

### expensePermissions.js
**Purpose:** Permission checks for expense-related actions.

**Key Features:**
- Ensures user is group admin or expense payer for management.
- Allows split marking by admin, payer, or self.
- Attaches models and roles to request.

**Security & Validation:**
- Strict permission checks, robust error handling.

**Engineering Quality:**
- Modular and reusable. Follows least privilege.

**Improvement Suggestions:**
- None critical; logic is clear and robust.

---

### groupPermissions.js
**Purpose:** Handles group membership, admin checks, and resource access control.

**Key Features:**
- Confirms group membership, admin privileges, and flexible access patterns.
- Attaches group, role, and member info to request.

**Security & Validation:**
- Prevents unauthorized access. Logs errors and enforces boundaries.

**Engineering Quality:**
- Highly reusable and modular.

**Improvement Suggestions:**
- None significant; coverage is thorough.

---

### rateLimiter.js
**Purpose:** Prevents abuse and DoS by limiting API request rates.

**Key Features:**
- General/auth-specific rate limiters, custom handler, configurable settings.

**Security & Validation:**
- Mitigates brute force and abuse. Clear error messages.

**Engineering Quality:**
- Simple, effective, easily adjustable.

**Improvement Suggestions:**
- Could add per-user or per-endpoint customization if needed.

---

### validation.js
**Purpose:** Centralizes request validation using Joi and express-validator.

**Key Features:**
- Middleware factory for Joi schema validation. Handles express-validator errors.
- Provides comprehensive Joi schemas for all domains.
- Returns detailed validation errors.

**Security & Validation:**
- Prevents malformed/malicious input. Standardized error reporting.

**Engineering Quality:**
- Modular, DRY, easy to extend.

**Improvement Suggestions:**
- Could move very large schemas to separate files for maintainability.

---

**Summary:**
The middleware layer is robust, modular, and covers all critical concerns for a secure, stable, and maintainable backend. Security and validation are enforced at multiple layers, and the code is cleanly organized for extensibility. No critical issues found; only minor maintainability improvements are suggested for future scalability.

## 4. Models

#### Central Index File (`models/index.js`)
This file serves as a central hub, re-exporting all Mongoose models (`User`, `Group`, `Task`, `Expense`, `Notification`) from a single location. It allows other parts of the backend to import all models conveniently and consistently, improving maintainability and organization. No business logic is contained here—only aggregation and export.

### Expense.js
**Purpose:** Represents a group expense, its splits, payment status, and related operations.

**Key Fields:**
- `groupId`, `payerId`, `amount`, `currency`, `description`, `category`, `splits`, `splitType`, `date`, `isSettled`, `settledAt`, `notes`.

**Key Methods:**
- `calculateEqualSplits(groupMembers)`: Evenly distributes expense among members.
- `setCustomSplits(customSplits)`: Supports custom split logic.
- `resetToEqualSplits(groupMembers)`: Restores equal split.
- `markSplitPaid(memberId, paidBy)`: Marks a member's split as paid.
- `getSummary()`, `getMemberBalance(memberId)`, `getGroupExpenses(groupId, filters)`, `getDetailedBalanceExplanation(groupId, userId)`, `calculateGroupBalances(groupId)`, `toJSON()`.
- Virtuals: `totalOwed`, `outstandingAmount`, `paymentStatus`.

**Security & Validation:**
- Strong schema validation on amounts, splits, and references.
- Indexes for performance and integrity.
- Methods ensure splits match group membership.

**Engineering Quality:**
- Comprehensive, extensible, and supports both equal and custom splits.
- Good use of virtuals and static methods for reporting.

**Improvement Suggestions:**
- Consider splitting complex calculations into service utilities for testability.

---

### Group.js
**Purpose:** Represents a user group, its members, settings, statistics, and invite logic.

**Key Fields:**
- `name`, `description`, `inviteCode`, `members`, `settings`, `statistics`, `isActive`.

**Key Methods:**
- `generateInviteCode()`: Static, ensures unique codes.
- `findMember(userId)`, `isAdmin(userId)`, `isMember(userId)`, `addMember(userId, role)`, `removeMember(userId)`, `transferAdmin(currentAdminId, newAdminId)`, `updateStatistics()`, `toJSONWithMembers()`.

**Security & Validation:**
- Enforces unique invite codes, max members, and admin role integrity.
- Prevents removing last admin.
- Indexes for performance.

**Engineering Quality:**
- Well-structured, robust membership management.
- Good encapsulation of group logic.

**Improvement Suggestions:**
- None critical; logic is clear and maintainable.

---

### Notification.js
**Purpose:** Stores and manages all user notifications (in-app, email, push, direct, group, snooze, batching).

**Key Fields:**
- `recipientId`, `groupId`, `type`, `title`, `message`, `isSnoozed`, `snoozedUntil`, `isBatched`, `deliveryAttempts`, `clickedAt`, `dismissedAt`, `data`, `priority`, `isRead`, `readAt`, `deliveryStatus`, `expiresAt`.

**Key Methods:**
- Instance: `markAsRead()`, `markAsDelivered(method, messageId)`, `markAsClicked()`, `markAsDismissed()`, `shouldShow()`, `snooze(until)`, `unsnooze()`.
- Static: `getActiveNotifications(userId, options)`, `getSnoozedNotifications(userId)`, `processExpiredSnoozes()`, `getUnreadCount(recipientId, groupId)`, `markAllAsRead(recipientId, groupId)`, `getRecentNotifications(recipientId, options)`.
- Virtuals: `timeAgo`.

**Security & Validation:**
- Strict type and reference validation.
- Indexes for efficient querying and expiry.
- Prevents notification loss or duplication.

**Engineering Quality:**
- Highly flexible, supports batching, snoozing, and multiple delivery channels.
- Robust static and instance methods.

**Improvement Suggestions:**
- Consider archiving old notifications before expiry for analytics.

---

### Task.js
**Purpose:** Represents a group task, its assignment, completion, notes, and recurrence.

**Key Fields:**
- `groupId`, `title`, `description`, `assignedTo`, `createdBy`, `dueDate`, `priority`, `status`, `category`, `recurring`, `aiGenerated`, `attachments`, `completedAt`, `completedBy`, `estimatedDuration`, `actualDuration`, `notes`.

**Key Methods:**
- Instance: `canEdit(userId, userRole)`, `canComplete(userId, userRole)`, `markCompleted(userId)`, `addNote(content, authorId)`, `toJSON()`.
- Static: `getUserTasks(userId, status)`, `getGroupTasks(groupId, filters)`.
- Virtuals: `isOverdue`, `daysUntilDue`.

**Security & Validation:**
- Validates references, required fields, and enums.
- Indexes for fast queries.
- Pre-save hooks for completion status.

**Engineering Quality:**
- Modular, supports AI/voice features and recurrence.
- Good encapsulation of task logic.

**Improvement Suggestions:**
- None critical; structure is robust and extensible.

---

### User.js
**Purpose:** Represents a user, authentication, preferences, and notification settings.

**Key Fields:**
- `name`, `email`, `password`, `profilePicture`, `groupId`, `preferences`, `notificationPreferences`, `isActive`, `lastLoginAt`, `tokenVersion`.

**Key Methods:**
- Instance: `comparePassword(candidatePassword)`, `updateLastLogin()`, `revokeTokens()`, `toJSON()`.
- Static: `findByEmailWithPassword(email)`.
- Pre-save: Hashes password automatically.

**Security & Validation:**
- Passwords hashed with bcrypt, never returned in queries.
- Strong email/field validation. Token versioning for JWT revocation.
- Indexes for performance and integrity.

**Engineering Quality:**
- Secure, modular, and extensible. Good separation of auth and profile logic.

**Improvement Suggestions:**
- Consider adding audit fields (e.g., login IP history) for further security.

---

**Summary:**
The Roomy backend models are robust, well-validated, and encapsulate all business logic and constraints for their respective domains. Security, data integrity, and extensibility are prioritized throughout. No critical issues found; only minor suggestions for analytics and maintainability.

---

## 5. Utilities & Core Entry Points

### Central Index File
No `index.js` file is present in the `utils` directory. Each utility module is imported as needed.

### Utility Modules (`src/utils/`)
**Purpose:** Encapsulate common logic, configuration, and helpers used throughout the backend.

**Key Files:**
- `constants.js`: Defines shared constants used across the app.
- `emailTemplates.js`: Stores and manages reusable email templates.
- `eventTypes.js`: Centralizes event names for event-driven features.
- `logger.js`: Provides centralized logging (used by server, error handlers, etc.).
- `responseHelper.js`: Standardizes API responses.
- `validateAISetup.js`: Ensures AI integration (e.g., Gemini) is properly configured.
- `validators.js`: Custom validation helpers for models and requests.

**Engineering Quality:**
- Promotes DRY principles and maintainability.
- No business logic or data persistence—pure helpers and configuration.
- Modules are cleanly separated by concern.

**Improvement Suggestions:**
- Consider adding a central `index.js` if grouped imports become necessary.

---

### Core Application Files

#### `src/app.js`
**Purpose:** Composes and configures the Express application.

**Key Features:**
- Applies global middleware (security, CORS, logging, body parsing).
- Initializes and attaches the WebSocket server (delegates all real-time logic—event handling, authentication, broadcasting, etc.—to `WebSocketService.js`).
- Serves static files from `/uploads`.
- Health check endpoint (`/health`).
- Mounts all main routes under `/api`.
- Handles 404s and global errors.
- Exports `{ app, io }` for server use.

**Engineering Quality:**
- Clean separation of middleware, routes, and error handling.
- Follows Node.js/Express best practices.
- Easily extensible for future needs.

#### `server.js`
**Purpose:** Top-level entry point for the backend process.

**Key Features:**
- Loads environment variables.
- Connects to MongoDB and email services.
- Starts HTTP server using the Express app.
- Logs server status and health check URLs.
- Handles unhandled promise rejections for graceful shutdown and error logging.
- Exports the running server instance.

**Engineering Quality:**
- Cleanly separates infrastructure concerns from app logic.
- Robust error handling and startup sequence.

---

**Summary:**
The utilities and core entry points are well-structured, modular, and follow industry best practices. They support maintainability, scalability, and reliability across the backend. No critical issues found; only minor suggestions for future extensibility.
