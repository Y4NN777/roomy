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

### 4. AI Voice Processing (Not Yet Implemented)

- Endpoints exist for AI voice/text processing, but backend logic is not yet implemented.
- No actual AI processing or task suggestion is currently available.

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

### 6. Real-Time In-App Notifications (Not Yet Implemented)

- Endpoints and WebSocket stubs exist, but real-time notification delivery is not yet implemented.
- Notification retrieval and mark-as-read endpoints may be present, but push/real-time logic is not functional.

### 7. Email Notifications

- **Group Invites:** Send email invitations to join a group.
- **Welcome Emails:** Automated welcome messages for new users.
- **Role Changes:** Notify users of admin transfers or role updates.
- **Payment Reminders:** Email reminders for unpaid expenses.
- **Task Assignment, Completion, Due Soon, and Reassignment:** Email notifications for task events.
- **Expense Events:** Email notifications for new expenses, split changes, split paid, and full settlement.

### 8. Admin & Security

- **Role-Based Access:** Enforce permissions for sensitive actions (e.g., removing members, deleting expenses, managing splits).
- **Middleware Enforcement:** All protected routes use middleware for authentication and authorization.
- **Rate Limiting:** Prevent abuse of sensitive endpoints.
- **Data Validation:** Strict validation for all incoming data to prevent errors and security issues.

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

---

## Base Configuration

- **Base URL:** `http://localhost:3000/api/v1`
- **Version:** 1.0
- **Content-Type:** `application/json`
- **Authorization:** `Bearer <JWT_TOKEN>` (required for protected endpoints)

---

## Authentication Endpoints

| Method | Endpoint                  | Description                | Request Body / Notes         |
|--------|---------------------------|----------------------------|------------------------------|
| POST   | /auth/register            | User account creation      | `{ email, password, name }`  |
| POST   | /auth/login               | User authentication        | `{ email, password }`        |
| POST   | /auth/refresh             | Token renewal              | `{ refreshToken }`           |
| POST   | /auth/logout              | Logout (JWT required)      |                              |
| GET    | /auth/profile             | User profile retrieval     | JWT required                 |
| PATCH  | /auth/profile             | Profile update             | `{ name, avatar, ... }` (multipart/form-data for avatar) |
| DELETE | /auth/profile/picture     | Delete profile picture     | JWT required                 |

---

## Group Management Endpoints

| Method | Endpoint                                   | Description                        | Request Body / Notes         |
|--------|--------------------------------------------|------------------------------------|------------------------------|
| GET    | /groups/                                   | List all groups (user is a member) | JWT required                 |
| GET    | /groups/search                             | Search groups                      | JWT required, query params   |
| GET    | /groups/my-groups                          | List groups the user belongs to    | JWT required                 |
| POST   | /groups/                                   | Create group, assign admin         | `{ name, ... }`              |
| POST   | /groups/join                               | Join group via invite code         | `{ inviteCode }`             |
| GET    | /groups/:groupId                           | Get group info                     | JWT, group membership        |
| GET    | /groups/:groupId/statistics                | Group statistics                   | JWT, group membership        |
| POST   | /groups/:groupId/leave                     | Leave group                        | JWT, group membership        |
| PATCH  | /groups/:groupId                           | Update group (admin only)          | `{ name, ... }`              |
| POST   | /groups/:groupId/invite-email              | Send invite email (admin only)     | `{ email }`                  |
| DELETE | /groups/:groupId/members/:userId           | Remove member (admin only)         |                              |
| GET    | /groups/:groupId/members                   | List group members                 | JWT, group membership        |
| PATCH  | /groups/:groupId/transfer-admin            | Transfer admin (admin only)        | `{ newAdminId }`             |
| POST   | /groups/:groupId/regenerate-invite         | Regenerate invite code (admin only)|                              |

---

## Task Management Endpoints

| Method | Endpoint                                   | Description                        | Request Body / Notes         |
|--------|--------------------------------------------|------------------------------------|------------------------------|
| GET    | /tasks/my-tasks                            | List user’s personal tasks         | JWT required                 |
| POST   | /tasks/                                    | Create a group task                | `{ title, description, ... }`|
| GET    | /tasks/group/:groupId                      | List group tasks                   | JWT, group membership        |
| GET    | /tasks/group/:groupId/statistics           | Group task statistics              | JWT, group membership        |
| GET    | /tasks/:taskId                             | Get task details                   | JWT required                 |
| PATCH  | /tasks/:taskId                             | Update task                        | `{ ... }`                    |
| PATCH  | /tasks/:taskId/complete                    | Mark task complete                 | `{ ... }`                    |
| DELETE | /tasks/:taskId                             | Delete task                        | JWT required                 |
| POST   | /tasks/:taskId/notes                       | Add note to task                   | `{ note }`                   |

---

## Expense Management Endpoints

| Method | Endpoint                                   | Description                        | Request Body / Notes         |
|--------|--------------------------------------------|------------------------------------|------------------------------|
| POST   | /expenses/                                 | Create group expense               | `{ amount, description, ... }`|
| POST   | /expenses/custom-splits                    | Create expense with custom splits  | `{ ... }`                    |
| GET    | /expenses/group/:groupId                   | List group expenses                | JWT, group membership        |
| GET    | /expenses/group/:groupId/unpaid            | List unpaid expenses               | JWT, group membership        |
| GET    | /expenses/group/:groupId/my-owed           | Get user’s owed amount             | JWT, group membership        |
| GET    | /expenses/group/:groupId/balances          | Get group balances                 | JWT, group membership        |
| GET    | /expenses/group/:groupId/statistics        | Group expense statistics           | JWT, group membership        |
| GET    | /expenses/:expenseId                       | Get expense details                | JWT required                 |
| GET    | /expenses/:expenseId/summary               | Get expense summary                | JWT required                 |
| PATCH  | /expenses/:expenseId                       | Update expense                     | `{ ... }`                    |
| DELETE | /expenses/:expenseId                       | Delete expense                     | JWT required                 |
| PATCH  | /expenses/:expenseId/splits/custom         | Set custom splits (admin only)     | `{ ... }`                    |
| PATCH  | /expenses/:expenseId/splits/reset          | Reset to equal splits (admin only) |                              |
| PATCH  | /expenses/:expenseId/splits/:memberId/pay  | Mark split as paid                 |                              |
| POST   | /expenses/group/:groupId/send-reminders    | Send payment reminders             | JWT, group membership        |

---

## AI Voice Processing Endpoints (Not Yet Implemented)

| Method | Endpoint                  | Description                              | Request Body / Notes         |
|--------|---------------------------|------------------------------------------|------------------------------|
| POST   | /ai/process-voice         | Interpret natural language task input    | `{ audioData, text }`        |
| POST   | /ai/confirm-tasks         | Confirm and create AI-suggested tasks    | `{ tasks: [...] }`           |

**Note:** These endpoints exist but are not implemented in the backend.

---

## Real-Time In-App Notification API (Not Yet Implemented)

- REST and WebSocket endpoints for notifications are planned but not implemented in the backend.

---

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
