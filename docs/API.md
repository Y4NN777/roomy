# Roomy API Documentation

Welcome to the Roomy API! This guide provides a comprehensive, code-accurate overview of all backend endpoints, their purposes, and integration tips for frontend developers. The API is RESTful, uses JSON for all payloads, and supports JWT-based authentication. Real-time features are planned via WebSockets for in-app notifications, but some features are not yet implemented.

---

## Features & Capabilities (As Implemented)

### 1. User Authentication & Profile

- **User Registration:** Create a new user account with email, password, and name.
- **User Login:** Authenticate with email and password to receive JWT and refresh token.
- **Token Refresh:** Obtain a new JWT using a valid refresh token.
- **Profile Retrieval:** Fetch current user profile details (name, email, avatar, etc).
- **Profile Update:** Update user profile information, including avatar upload.
- **Session Security:** JWT required for all protected endpoints.

### 2. Group Management

- **Group Creation:** Create a new group and assign the creator as admin.
- **Group Info Retrieval:** Get group details, including members and admin.
- **Join Group:** Join an existing group using an invite code.
- **Member Management:**
  - Remove members (admin only)
  - Transfer admin rights to another member
  - View group membership list
- **Invite by Email:** Send group invitations via email to prospective members.
- **Group Roles:** Role-based permissions for admin and regular members.

### 3. Task Management

- **Task Listing:** Retrieve all tasks, with support for filtering by group, status, assignee, category, due date, and priority.

  - **Endpoint:** `GET /tasks`

  **Query Parameters:**
  - `status` (pending, in_progress, completed)
  - `assignedTo` (user ID or "me")
  - `category` (e.g., cleaning, shopping)
  - `dueDate` (date or range)
  - `priority` (low, medium, high)
  - `limit`, `offset` (pagination)

  **Example:** `GET /tasks?status=pending&assignedTo=me&limit=10`

  **Response:**

  ```json
  {
    "success": true,
    "data": {
      "tasks": [
        {
          "id": "64f8a1b2c3d4e5f6a7b8c9d2",
          "title": "Clean kitchen thoroughly",
          "assignedTo": "64f8a1b2c3d4e5f6a7b8c9d3",
          "dueDate": "2025-07-03T18:00:00Z",
          "priority": "high",
          "status": "pending",
          "category": "cleaning"
        }
      ]
    }
  }
  ```

- **Task Creation:**

  - **Endpoint:** `POST /tasks`

  **Request:**

  ```json
  {
    "title": "Clean kitchen thoroughly",
    "description": "Deep clean counters, appliances, and floor",
    "assignedTo": "64f8a1b2c3d4e5f6a7b8c9d3",
    "dueDate": "2025-07-03T18:00:00Z",
    "priority": "high",
    "category": "cleaning"
  }
  ```

  **Response:**

  ```json
  {
    "success": true,
    "data": {
      "task": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "title": "Clean kitchen thoroughly",
        "assignedTo": "64f8a1b2c3d4e5f6a7b8c9d3",
        "dueDate": "2025-07-03T18:00:00Z",
        "priority": "high",
        "status": "pending",
        "category": "cleaning"
      }
    }
  }
  ```

- **Task Completion:** Mark tasks as complete (with permission checks).

  - **Endpoint:** `PATCH /tasks/:id/complete`

  **Response:**

  ```json
  {
    "success": true,
    "data": {
      "task": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "status": "completed",
        "completedAt": "2025-07-02T14:30:00Z",
        "completedBy": "64f8a1b2c3d4e5f6a7b8c9d0"
      }
    }
  }
  ```

- **Task Deletion:** Remove tasks (admin or creator only).

  - **Endpoint:** `DELETE /tasks/:id`

- **Task Assignment:** Assign tasks to group members and notify them in real time (notification: not yet implemented).

- **Task Notes:** Add notes/comments to tasks.

  - **Endpoint:** `POST /tasks/:id/notes`

  **Request:**

  ```json
  {
    "content": "Kitchen looks great! Extra attention paid to the stove."
  }
  ```

- **Task Statistics:** Retrieve statistics for tasks in a group.

  - **Endpoint:** `GET /tasks/group/:groupId/statistics`

  **Response:**

  ```json
  {
    "success": true,
    "data": {
      "totalTasks": 45,
      "completedTasks": 38,
      "pendingTasks": 7,
      "completionRate": 84.4,
      "memberStats": [
        {
          "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "assigned": 12,
          "completed": 10,
          "completionRate": 83.3
        }
      ],
      "categoryBreakdown": {
        "cleaning": 15,
        "cooking": 8,
        "shopping": 12
      }
    }
  }
  ```

- **Task Notifications:** In-app notifications for new, updated, or completed tasks (real-time not yet implemented).

- **Task Due Reminders:** Email reminders for tasks due soon.

- **Task Reassignment:** Notify users when tasks are reassigned.

**Frontend Integration Tips:**

- Use query parameters to filter and paginate tasks for dashboards and lists.
- Display task status, priority, and assignment visually in the UI.
- Use the statistics endpoint to show group productivity and member contributions.
- Integrate note/comment features for collaborative task tracking.

### 4. AI Voice Processing & Task Extraction

- **AI Task Extraction:** Extract actionable tasks from natural language (voice/text) input using Google Gemini AI.

  - **Endpoint:** `POST /ai/process-voice`
  - **Auth:** Required (JWT)
  - **Body:**
    - `text` (string, required, 1-2000 chars): The user’s input.
    - `groupId` (optional, MongoId): Group context (defaults to user’s group).
  - **Validation:** Fails if text is missing/empty/too long, or if user is not in a group.
  - **Response:**
    - `suggestedTasks`: Array of task objects (see below).
    - `confidence`: AI confidence score.
    - `processingTime`: ms taken.
    - `memberMentions`: Array of detected member mentions.
    - `metadata`: AI model, categories, assignment strategy, fallbackUsed.
    - `groupContext`: Info about group and recent tasks.
  - **Fallback:** If AI fails, a rule-based fallback generates basic tasks.

  **Example Request:**

  ```json
  {
    "text": "John should clean the kitchen and Sarah can buy groceries"
  }
  ```

  **Example Response:**

  ```json
  {
    "success": true,
    "data": {
      "originalText": "...",
      "suggestedTasks": [
        {
          "title": "Clean the kitchen",
          "description": "...",
          "category": "cleaning",
          "priority": "medium",
          "estimatedDuration": 45,
          "suggestedAssignee": "user_id",
          "assignmentConfidence": 0.9,
          "suggestedDueDate": "2025-07-06T20:00:00Z",
          "notes": "Assigned to John as explicitly mentioned"
        }
      ],
      "confidence": 0.92,
      "processingTime": 1200,
      "memberMentions": [
        { "memberId": "1", "memberName": "John Doe", "mentionText": "John should", "confidence": 0.9 }
      ],
      "metadata": {
        "detectedCategories": ["cleaning", "shopping"],
        "assignmentStrategy": "explicit",
        "aiModel": "gemini-2.0-flash-exp",
        "fallbackUsed": false
      },
      "groupContext": {
        "groupId": "group_id",
        "memberCount": 3,
        "recentTaskCount": 5
      }
    }
  }
  ```

- **Confirm and Create AI-Suggested Tasks:**

  - **Endpoint:** `POST /ai/confirm-tasks`
  - **Auth:** Required (JWT)
  - **Body:**
    - `tasks` (array, required, 1-10): Each with:
      - `title` (string, 1-200 chars, required)
      - `description` (string, ≤1000 chars, optional)
      - `category` (enum: cleaning, cooking, shopping, maintenance, bills, other)
      - `priority` (enum: low, medium, high)
      - `estimatedDuration` (int, 5-480, optional)
      - `suggestedAssignee` (userId, optional)
      - `suggestedDueDate` (ISO date, optional)
      - `notes` (string, optional)
      - `assignmentConfidence` (number, optional)
    - `originalText` (string, optional, ≤2000 chars)
  - **Validation:** Fails if tasks array is empty, too large, or fields are invalid.
  - **Response:**
    - `createdTasks`: Array of created task objects (with `aiGenerated: true`).
    - `summary`: Success/error counts.

- **AI Service Status:**

  - **Endpoint:** `GET /ai/status`
  - **Auth:** Required (JWT)
  - **Response:**
    - `available`: Boolean
    - `model`: String (e.g., gemini-2.0-flash-exp)
    - `features`: Object (taskExtraction, assignmentDetection, etc.)

- **AI Test Endpoint (Development only):**

  - **Endpoint:** `POST /ai/test`
  - **Auth:** Required (JWT)
  - **Body:** `testInput` (string, optional, ≤500 chars)
  - **Response:** AI status and connection info.

**AI Service Features:**

- Uses Google Gemini 2.0 Flash for task extraction and assignment.
- Detects member mentions and assigns tasks based on explicit/implicit language.
- Returns confidence scores and metadata.
- Fallback system generates basic tasks if AI is unavailable or fails.
- Assignment, category, and priority detection are all supported.
- All AI endpoints require authentication and group context.

**Frontend Integration Tips:**

- Use `/ai/process-voice` to convert user speech or text into actionable tasks.
- Show AI confidence, assignment, and fallback status in the UI.
- Use `/ai/confirm-tasks` to let users review and confirm AI-suggested tasks before creation.
- Use `/ai/status` to display AI availability and features to users/admins.

### 5. Financial Management (Expenses)

- **Expense Logging:** Add new expenses with amount, description, payer, and participants.

  - **Endpoint:** `POST /expenses/`

  **Request:**

  ```json
  {
    "amount": 85.50,
    "description": "Weekly groceries - Whole Foods",
    "category": "groceries",
    "receiptUrl": "https://cloudinary.com/receipts/abc123.jpg"
  }
  ```

  **Response:**

  ```json
  {
    "success": true,
    "data": {
      "expense": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d6",
        "amount": 85.50,
        "description": "Weekly groceries - Whole Foods",
        "payerId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "payerName": "John Doe",
        "splits": [
          { "memberId": "64f8a1b2c3d4e5f6a7b8c9d0", "memberName": "John Doe", "amount": 28.50, "paid": true },
          { "memberId": "64f8a1b2c3d4e5f6a7b8c9d3", "memberName": "Jane Smith", "amount": 28.50, "paid": false },
          { "memberId": "64f8a1b2c3d4e5f6a7b8c9d8", "memberName": "Bob Wilson", "amount": 28.50, "paid": false }
        ],
        "date": "2025-07-02T15:00:00Z"
      }
    }
  }
  ```

- **Expense Splitting:**
  - Equal split among group members (default)
  - Custom split (manual adjustment per member)

    - **Endpoint:** `POST /expenses/custom-splits`

    **Request:**

    ```json
    {
      "amount": 100,
      "splits": [
        { "memberId": "64f8a1b2c3d4e5f6a7b8c9d0", "amount": 60 },
        { "memberId": "64f8a1b2c3d4e5f6a7b8c9d3", "amount": 40 }
      ]
    }
    ```

- **Expense History:** Retrieve all expenses for a group, with filtering by date, category, payer, or settlement status.

  - **Endpoint:** `GET /expenses/group/:groupId`
  - **Query Parameters:**
    - `dateRange`, `category`, `payerId`, `status`

- **Balance Calculation:** Calculate and display how much each member owes or is owed.

  - **Endpoint:** `GET /expenses/group/:groupId/balances`

  **Response:**

  ```json
  {
    "success": true,
    "data": {
      "balances": [
        { "memberId": "64f8a1b2c3d4e5f6a7b8c9d0", "balance": 12.50 },
        { "memberId": "64f8a1b2c3d4e5f6a7b8c9d3", "balance": -12.50 }
      ]
    }
  }
  ```

- **Expense Deletion:** Remove expenses (admin or payer only).

  - **Endpoint:** `DELETE /expenses/:expenseId`

- **Split Management:**
  - Mark splits as paid (admin, payer, or member themselves)

    - **Endpoint:** `PATCH /expenses/:expenseId/splits/:memberId/pay`

  - Reset splits to equal

    - **Endpoint:** `PATCH /expenses/:expenseId/splits/reset`

  - Set custom splits (admin only)

    - **Endpoint:** `PATCH /expenses/:expenseId/splits/custom`

- **Expense Validation:** Check for errors or inconsistencies in splits (handled by backend validation).

- **Expense Statistics:** Get summaries by category, user, or time period.

  - **Endpoint:** `GET /expenses/group/:groupId/statistics`

- **Payment Reminders:** Send reminders to members with unpaid balances (email and batch).

  - **Endpoint:** `POST /expenses/group/:groupId/send-reminders`

- **Expense Details:** View detailed breakdowns and explanations for each expense.

  - **Endpoint:** `GET /expenses/:expenseId`

- **Unpaid Expenses:** List all unpaid expenses for a group.

  - **Endpoint:** `GET /expenses/group/:groupId/unpaid`

- **Owed Amount:** Retrieve how much a user owes in a group.

  - **Endpoint:** `GET /expenses/group/:groupId/my-owed`

- **Enhanced Group Balances:** Get advanced balance breakdowns and conservation checks (see balances endpoint).

- **Expense Summary:** Get a summary for a specific expense.

  - **Endpoint:** `GET /expenses/:expenseId/summary`

**Frontend Integration Tips:**

- Use the balances and owed endpoints to show each member's financial position in the UI.
- Display split status and payment reminders for transparency.
- Use the statistics endpoint for group financial dashboards and insights.
- Allow users to upload receipts and view detailed expense breakdowns.

### 6. Real-Time In-App Notifications 

The notification system provides comprehensive real-time capabilities through WebSockets, with support for various event types and delivery methods.

#### System Architecture

```plaintext
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

#### Core Features
- **WebSocket Server**: Full-featured implementation using Socket.IO
- **Authentication**: JWT-based secure connections
- **Connection Management**: Handles user presence and group memberships
- **Event Types**: Supports a wide range of system and application events
- **Delivery Methods**: Both direct and group notifications

#### Supported Event Types

##### Task Events
- `task.created` - New task created
- `task.assigned` - Task assigned to user
- `task.completed` - Task marked complete
- `task.updated` - Task details updated
- `task.deleted` - Task removed
- `task.due_soon` - Task due date approaching
- `task.overdue` - Task is past due
- `task.reassigned` - Task reassigned to different user

##### AI Events
- `ai.tasks_suggested` - AI has generated task suggestions
- `ai.tasks_confirmed` - User confirmed AI-suggested tasks
- `ai.processing_started` - AI processing initiated
- `ai.processing_completed` - AI processing finished
- `ai.processing_failed` - Error in AI processing

##### Expense Events
- `expense.created` - New expense added
- `expense.updated` - Expense details modified
- `expense.deleted` - Expense removed
- `expense.split_paid` - Split payment made
- `expense.fully_settled` - Expense fully settled
- `expense.splits_changed` - Expense splits modified
- `expense.split_reset` - Splits reset to equal
- `expense.custom_split_set` - Custom splits configured
- `payment.reminder` - Payment reminder sent

##### Group Events
- `group.created` - New group created
- `group.updated` - Group details modified
- `group.member_joined` - New member joined group
- `group.member_left` - Member left group
- `group.member_removed` - Member removed from group
- `group.admin_transferred` - Group admin changed
- `group.role_changed` - Member role updated
- `group.invite_code_regenerated` - New invite code generated
- `group.email_invitation_sent` - Email invite sent

#### API Endpoints

##### Get Notifications
```
GET /notifications
```
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 50)
- `unreadOnly` - Filter unread notifications
- `type` - Filter by notification type
- `groupId` - Filter by group
- `priority` - Filter by priority level
- `sortBy` - Field to sort by (default: createdAt)
- `sortOrder` - Sort order (asc/desc, default: desc)

##### Get Unread Count
```
GET /notifications/unread-count
```
**Query Parameters:**
- `groupId` - Filter by group

##### Mark as Read
```
PATCH /notifications/:notificationId/read
```

##### Mark All as Read
```
PATCH /notifications/mark-all-read
```
**Body:**
```json
{
  "groupId": "optional_group_id"
}
```

##### WebSocket Status
```
GET /notifications/websocket/status
```

##### Group Broadcast (Admin Only)
```
POST /notifications/broadcast
```
**Body:**
```json
{
  "groupId": "required_group_id",
  "message": "Broadcast message"
}
```

#### WebSocket Events

##### Server to Client
- `notification:new` - New notification received
- `task:created` - New task created
- `task:completed` - Task marked complete
- `expense:added` - New expense added
- `ai:tasks_suggested` - AI task suggestions ready
- `user:online` - User came online
- `user:offline` - User went offline
- `connection:status` - Connection status update

##### Client to Server
- `notification:read` - Mark notification as read
- `notification:read_all` - Mark all notifications as read

### 7. Email Notifications

The system supports various email notifications that are sent asynchronously for important events. These emails help keep users informed even when they're not actively using the application.

#### Key Features
- **Templated Emails**: Consistent branding and formatting
- **Asynchronous Delivery**: Non-blocking email sending
- **Preference Management**: Users can manage notification preferences
- **Event-Based**: Triggered by specific system events

#### Notification Types

##### User Account
- **Welcome Email**: Sent after successful registration
  - Includes account verification link
  - Provides app introduction and next steps

- **Password Reset**: For account recovery  ( NEXT VERSION )
  - Contains secure reset link
  - Expires after a set duration

- **Email Verification**: For new/changed email addresses ( NEXT VERSION )
  - Includes verification link
  - Required for account activation

##### Group Management
- **Group Invitation**: Invite to join a group
  - Includes group details and invitation code
  - Accept/decline options

- **Group Invitation Reminder**: Follow-up for pending invites
  - Sent after 24 hours if invite not accepted( NEXT VERSION )

- **Group Role Change**: Notification of permission updates
  - Sent when admin changes user roles
  - Includes previous and new role information

- **Group Admin Transfer**: Notification of ownership transfer
  - Sent to both previous and new admins
  - Includes transfer confirmation

##### Task Management
- **Task Assignment**: Notification of new task assignment
  - Includes task details and due date
  - Direct link to the task

- **Task Due Soon**: Reminder for upcoming deadlines
  - Configurable reminder window (24h by default)
  - Sent to all task assignees

- **Task Overdue**: Notification for missed deadlines
  - Sent to task assignees and creator
  - Includes overdue duration

- **Task Update**: Notification of task changes
  - Sent when important fields are modified
  - Highlights what changed

##### Expense Management
- **Expense Added**: Notification of new expense
  - Shows amount and split details
  - Sent to all group members

- **Expense Settlement**: Notification of payment received
  - Confirms payment details
  - Updates remaining balance

- **Payment Reminder**: For unsettled expenses
  - Sent to users with outstanding balances
  - Includes payment instructions

- **Expense Report**: Weekly summary of expenses
  - Shows activity in all user's groups
  - Includes balances and recent transactions( NEXT VERSION )

##### System Notifications
- **Security Alerts**: For suspicious activities ( NEXT VERSION )
  - Failed login attempts
  - Password changes
  - New device logins

- **Account Activity**: Important account events( NEXT VERSION )
  - Profile changes
  - Connected services updates
  - Subscription status changes

#### Email Preferences
Users can manage their notification preferences through their account settings, including:
- Global email notifications on/off
- Per-category notification settings
- Frequency of digest emails
- Critical alerts (always on)

#### Technical Implementation
- Uses Nodemailer for email delivery
- Supports multiple email providers (SMTP, SendGrid, etc.)
- Implements rate limiting and retries
- Tracks email delivery status
- Supports HTML and plain-text versions

### 8. Admin & Security

#### Authentication Middleware
- **JWT Authentication**: All protected routes require a valid JWT token
  - Token must be included in the `Authorization: Bearer <token>` header
  - Validates token signature and expiration
  - Verifies user account is active
  - Checks token version to prevent use of revoked tokens

#### Authorization Middleware

##### Group Permissions
- `verifyGroupMembership`: Verifies user is a member of the specified group
  - Required for all group-specific operations
  - Attaches group and user role to request object
  
- `verifyGroupAdmin`: Verifies user is an admin of the specified group
  - Required for administrative actions (e.g., removing members, updating group settings)
  - Inherits from verifyGroupMembership

##### Expense Permissions
- `verifyExpenseAccess`: Verifies user can manage an expense
  - User must be either the expense payer or a group admin
  - Validates expense and group status
  
- `verifyExpenseAdminAccess`: Verifies user is a group admin for expense operations
  - Required for administrative expense actions
  
- `verifyExpenseSplitAccess`: Verifies user permissions for split operations
  - Validates user can mark splits as paid

#### Rate Limiting
- **General API Endpoints**: 100 requests per 15 minutes per IP
- **Authentication Endpoints**: 10 requests per hour per IP
- Custom error responses with rate limit information in headers

#### Input Validation
- **Joi Schemas**: Request body validation for all endpoints
- **Express-Validator**: Additional validation for complex scenarios
- **File Uploads**:
  - Image files only (JPEG, PNG, WebP)
  - 5MB file size limit
  - Secure filename generation

#### Security Headers
- **CORS**: Configured with allowed origins and methods
- **Helmet**: Enabled for secure HTTP headers
- **Content Security Policy**: Restricts resource loading

#### Error Handling
- Consistent error response format
- Detailed validation error messages
- Secure error messages in production
- Request ID for tracking

#### Data Protection
- Password hashing with bcrypt
- Sensitive data filtering in responses
- NoSQL injection prevention
- XSS protection

---

## Example Real-Life Scenarios

### Scenario 1: Creating a Group and Adding Members

1. Alice registers and logs in to Roomy.
2. She creates a new group called "Room 101" using `/groups/`.
3. Alice invites Bob and Carol by email using `/groups/:groupId/invite-email`.
4. Bob and Carol join the group using the invite code via `/groups/join`.
5. Alice assigns Bob as the new admin using `/groups/:groupId/transfer-admin`.

### Scenario 2: Managing Shared Tasks

1. Carol creates a cleaning task for "Room 101" using `/tasks/`.
2. She assigns the task to herself and Bob.
3. Bob marks the task as complete using `/tasks/:taskId/complete`.
4. Carol adds a note to the task using `/tasks/:taskId/notes`.
5. The group can view task statistics via `/tasks/group/:groupId/statistics`.

### Scenario 3: Splitting Expenses

1. Bob logs a new grocery expense for "Room 101" using `/expenses/`.
2. He sets a custom split so Carol pays 60% and Alice 40% using `/expenses/custom-splits`.
3. Carol pays her share and marks it as paid using `/expenses/:expenseId/splits/:memberId/pay`.
4. Alice checks her owed amount using `/expenses/group/:groupId/my-owed`.
5. Bob sends payment reminders to all unpaid members using `/expenses/group/:groupId/send-reminders`.


## Permissions & Middleware

- All endpoints (except registration, login, and refresh) require a valid JWT in the `Authorization` header.
- Group and expense endpoints enforce membership and/or admin permissions via middleware.
- Data validation is enforced for all create/update endpoints.

---

## Request/Response Format

- All requests and responses use JSON unless otherwise specified (e.g., avatar upload uses `multipart/form-data`).

Standard error responses:

```json
{
  "error": "Error message here"
}
```

On success, endpoints return the created/updated resource or:

```json
{ "success": true }
```

---

## Changelog

- This documentation is fully synchronized with the backend codebase as of the latest update.
- Endpoints not present in the backend have been removed or marked as not implemented.
- For detailed request/response payloads, see backend controller and validation schemas.
