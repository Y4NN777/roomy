# Roomy Backend Engineering Notes

## Project Status (as of July 7, 2025)

This document provides an overview of the current state of the Roomy backend, the engineering approaches taken, and guidance for future contributors to complete or extend the work.

---

## 1. Project Status Overview

- **Core Features Implemented:**
  - User authentication (JWT-based)
  - Group management (creation, membership, admin transfer, invites)
  - Task management (CRUD, assignment, notifications)
  - Expense management (logging, splitting, balances, statistics)
  - Comprehensive notification system with email and real-time WebSocket support
  - Role-based access and security middleware
  - Event-driven architecture with decoupled services

- **Recently Implemented (v1):**
  - Real-time WebSocket notifications
  - Event bus for decoupled service communication
  - Notification preferences and delivery tracking
  - Group activity feeds
  - Enhanced email templates

- **Planned for Next Version (v1.2.0):**
  - Push notifications (FCM/APNs)
  - Advanced AI voice processing
  - Email verification flow
  - Enhanced security alerts
  - Group invitation reminders

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

**Architecture Overview:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Service    │    │  Task Service   │    │ Expense Service │
│                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ emits events         │ emits events         │ emits events
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Event Bus (EventEmitter)                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │ listens to all events
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Notification Service                           │
│  • Processes events into notifications                          │
│  • Stores notifications in DB                                   │
│  • Determines delivery methods                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ triggers delivery
                      ▼
┌─────────────────┐              ┌─────────────────┐
│  WebSocket      │              │ Push Notification│
│  Service        │              │ Service (Future) │
│  • Real-time    │              │ • FCM/APNs      │
│  • In-app       │              │ • Email         │
└─────────────────┘              └─────────────────┘
```

**Key Components:**

1. **Event Bus** (`eventBus.js`)
   - Central event emitter for cross-service communication
   - Handles all domain events (tasks, expenses, groups, AI)
   - Implements error handling and logging

2. **Notification Service** (`notificationService.js`)
   - Processes events into notifications
   - Manages delivery methods (WebSocket, email)
   - Handles notification preferences
   - Tracks delivery status

3. **WebSocket Service** (`WebSocketService.js`)
   - Manages real-time connections
   - Handles user presence and group rooms
   - Implements JWT authentication
   - Supports direct and broadcast messaging

**Features:**
- Real-time in-app notifications via WebSockets
- Email notifications with rich templates
- Notification preferences per user
- Read receipts and delivery tracking
- Group activity feeds
- Typing indicators and online status

**Key Methods:**
- `createAndDeliverNotification`: Core notification creation and delivery
- `markAsRead`/`markAllAsRead`: Notification state management
- `getUserNotifications`: Retrieves notifications with pagination
- `broadcastToGroup`: Sends real-time updates to group members
- `sendEmail`: Handles all email notifications

### AI Voice & Text Processing

**Implementation Status: Partially Implemented (Beta)**

The AI system provides natural language processing for task creation and management, with integration to Google's Generative AI (Gemini 2.0 Flash).

**Key Components:**

1. **AIService (`aiService.js`)**
   - Handles all AI model interactions
   - Processes natural language input into structured tasks
   - Implements fallback mechanisms for AI service unavailability
   - Emits events for AI processing lifecycle

2. **AIController (`aiController.js`)**
   - `processVoiceInput`: Main endpoint for processing voice/text input
   - `confirmAndCreateTasks`: Creates tasks from AI suggestions
   - `testAI`: Diagnostic endpoint for AI service testing

**Features:**
- Natural language understanding for task creation
- Context-aware processing using group and user data
- Task suggestion with confidence scoring
- Member mention detection in task assignments
- Multi-turn conversation support (in progress)

**API Endpoints:**
- `POST /api/v1/ai/process` - Process voice/text input
- `POST /api/v1/ai/confirm-tasks` - Confirm and create suggested tasks
- `POST /api/v1/ai/test` - Test AI service (development only)

**Configuration:**
- Requires `GEMINI_API_KEY` environment variable
- Model: `gemini-2.0-flash-exp`
- Temperature: 0.7 (balanced creativity/consistency)

**Known Limitations:**
- Currently in beta with rate limits
- Limited to English language input
- May require refinement of task extraction prompts
- No support for complex task dependencies

**Future Enhancements (Planned):**
- Support for additional languages
- Improved context retention
- Integration with calendar/scheduling
- Advanced task dependency management
- Custom model fine-tuning

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

#### Authentication & Security
- **JWT Authentication** (`auth.js`)
  - Validates access tokens
  - Handles token refresh
  - Manages user sessions
  - Prevents token reuse

#### Authorization
- **Group Permissions** (`groupPermissions.js`)
  - `verifyGroupMembership`: Validates group access
  - `verifyGroupAdmin`: Restricts to admin actions
  - `optionalGroupMembership`: For public group data

- **Expense Permissions** (`expensePermissions.js`)
  - `verifyExpenseAccess`: Validates expense access
  - `verifyExpenseAdminAccess`: Admin-only expense actions
  - `verifyExpenseSplitAccess`: Split payment validation

#### Rate Limiting
- **General API**: 100 requests/15 minutes
- **Auth Endpoints**: 10 requests/hour
- Custom error responses with rate limit headers

#### Validation
- **Request Validation** (`validation.js`)
  - Joi schemas for all endpoints
  - Custom validators for complex rules
  - Sanitization of all inputs

#### File Uploads (`upload.js`)
- Image validation (JPEG, PNG, WebP)
- 5MB file size limit
- Secure filename generation
- Virus scanning (stub)

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

## 3. AI System Engineering Notes

- **AI Service:**
  - Located in `src/services/aiService.js`.
  - Uses Google Gemini 2.0 Flash via `@google/genai` for natural language to task extraction.
  - Handles prompt construction, member mention extraction, assignment confidence, and fallback logic.
  - Fallback system generates basic tasks if AI is unavailable or fails, using keyword templates and member mentions.
  - Assignment detection is both explicit (e.g., "John should...") and implicit (inferred from context and confidence).
  - All AI endpoints require authentication and group context for best results.
  - AI model, features, and status are exposed via `/ai/status`.
  - Development/test endpoint `/ai/test` is only available in non-production environments.

- **AI Controller:**
  - Located in `src/controllers/v1/aiController.js`.
  - Handles all AI API endpoints: `/process-voice`, `/confirm-tasks`, `/status`, `/test`.
  - Validates input, fetches group context, and delegates to `aiService`.
  - On `/process-voice`, returns suggested tasks, member mentions, confidence, and metadata.
  - On `/confirm-tasks`, validates and creates up to 10 tasks, marking them as `aiGenerated` and linking to the original input.
  - Handles error cases, including AI unavailability and input validation.

- **API Route:**
  - Defined in `src/routes/v1/ai.js`.
  - All routes require JWT authentication.
  - Input validation is enforced using `express-validator` and custom middleware.
  - Endpoints:
    - `POST /ai/process-voice`: Main AI task extraction
    - `POST /ai/confirm-tasks`: Confirm and create tasks
    - `GET /ai/status`: Service/model status
    - `POST /ai/test`: Development-only AI test

- **Testing:**
  - Unit and integration tests for AI are in `tests/services/ai.test.js`
  - Tests cover:
    - AI extraction and assignment
    - Fallback system
    - Input validation and error handling
    - Service status and connection
    - End-to-end API flows

- **Environment:**
  - Requires `GEMINI_API_KEY` in `.env` for AI features to be enabled.
  - If not set, AI endpoints will return fallback or service unavailable errors.

- **Frontend/Integration:**
  - See API.md for request/response formats and integration tips.
  - AI endpoints are designed for both voice and text input, and return rich metadata for UI/UX.

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

## 3. AI System Engineering Notes

### AI Service
- **Location:** `src/services/aiService.js`
- **AI Model:** Google Gemini 2.0 Flash via `@google/genai`
- **Key Features:**
  - Natural language to task extraction
  - Context-aware processing using group data
  - Fallback system for AI unavailability
  - Member mention extraction and assignment
  - Confidence scoring for suggestions
  - Multi-turn conversation support

### AI Controller
- **Location:** `src/controllers/v1/aiController.js`
- **Endpoints:**
  - `POST /ai/process-voice`: Process voice/text input
  - `POST /ai/confirm-tasks`: Create tasks from AI suggestions
  - `GET /ai/status`: Service health and model info
  - `POST /ai/test`: Development testing (non-production only)
- **Features:**
  - Input validation and sanitization
  - Group context integration
  - Error handling and fallbacks
  - Detailed response metadata

### API Routes
- **Location:** `src/routes/v1/ai.js`
- **Security:**
  - JWT authentication required
  - Rate limiting
  - Input validation
- **Request/Response Formats:**
  - JSON payloads
  - Standardized error responses
  - Rich metadata in responses

### Testing
- **Test Location:** `tests/services/ai.test.js`
- **Test Coverage:**
  - Task extraction accuracy
  - Member mention detection
  - Fallback system behavior
  - Error conditions
  - API endpoint validation

### Environment Configuration
- **Required Variables:**
  - `GEMINI_API_KEY`: Google AI API key
  - `AI_ENABLED`: Feature flag (default: true)
  - `AI_MODEL`: Model version (default: gemini-2.0-flash-exp)

### Integration Guidelines
1. **Frontend Implementation:**
   - Handle both success and error responses
   - Display confidence scores to users
   - Support for confirming/editing AI suggestions
   - Loading states for AI processing

2. **Error Handling:**
   - Graceful degradation when AI is unavailable
   - User-friendly error messages
   - Retry mechanisms for transient failures

## 4. Recommendations for Future Development

### AI/ML Enhancements
- [ ] Implement model fine-tuning with user feedback
- [ ] Add support for additional languages
- [ ] Improve context window for better conversation history
- [ ] Add sentiment analysis for task prioritization

### Performance Optimization
- [ ] Implement response caching
- [ ] Add request batching for bulk operations
- [ ] Optimize token usage for cost efficiency

### Security & Compliance
- [ ] Add data anonymization for training
- [ ] Implement usage quotas
- [ ] Add audit logging for AI operations

### User Experience
- [ ] Add preview mode for AI-generated tasks
- [ ] Implement undo/redo for AI actions
- [ ] Add user feedback mechanism for AI suggestions

## 5. Maintenance & Support

### Monitoring
- Track API usage and performance metrics
- Monitor error rates and failure modes
- Set up alerts for service degradation

### Documentation
- Keep API documentation up to date
- Document known limitations and edge cases
- Maintain example requests/responses

### Contact
For support or questions about the AI implementation, contact the backend team or refer to the internal wiki for additional resources.

---

*This document should be updated as the project evolves or as new contributors join.*
