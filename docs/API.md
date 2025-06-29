# API Documentation

## Base Configuration
- Base URL: `http://localhost:3000/api/v1`
- Version: 1.0
- Content-Type: `application/json`
- Authorization: `Bearer <JWT_TOKEN>`

## Authentication Endpoints
- `POST /api/v1/auth/register` - User account creation
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/refresh` - Token renewal
- `GET /api/v1/auth/profile` - User profile retrieval
- `PUT /api/v1/auth/profile` - Profile information update

## Group Management API
- `POST /api/v1/groups` - Group creation with admin assignment
- `GET /api/v1/groups/:id` - Group information retrieval
- `POST /api/v1/groups/join` - Group membership via invite code
- `DELETE /api/v1/groups/:id/members/:userId` - Member removal (admin only)
- `POST /api/v1/groups/:id/invite-email` - Email invitation dispatch
- `PATCH /api/v1/groups/:id/transfer-admin` - Administrative privilege transfer

## Task Management API
- `GET /api/v1/tasks` - Task list with filtering support
- `POST /api/v1/tasks` - Manual task creation
- `PATCH /api/v1/tasks/:id/complete` - Task completion marking
- `DELETE /api/v1/tasks/:id` - Task removal (permission-based)

## AI Voice Processing API
- `POST /api/v1/ai/process-voice` - Natural language task interpretation
- `POST /api/v1/ai/confirm-tasks` - AI suggestion confirmation and creation

## Financial Management API
- `GET /api/v1/expenses` - Expense history with filtering
- `POST /api/v1/expenses` - Expense logging and split calculation
- `GET /api/v1/expenses/balances` - Member balance reconciliation
- `DELETE /api/v1/expenses/:id` - Expense record removal
