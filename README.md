# Roomy

**Roommate management app built from real shared living experience**

[![Flutter](https://img.shields.io/badge/Flutter-3.16+-blue.svg)](https://flutter.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-brightgreen.svg)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Roomy is a roommate task and expense management platform that solves real coordination problems in shared living situations. Born from experiencing countless roommate conflicts over chores, bills, and household responsibilities.

## Problem

Living with roommates creates predictable friction points:
- Unclear task responsibility and rotation
- Complicated expense splitting and tracking
- Lost communication in group chats
- Unequal distribution of household mental load

## Solution

**Dual-Mode Task Management**

*Voice Interface*
- Google Gemini 2.0 Flash integration for natural language processing
- Context-aware interpretation of household terminology and priorities
- Automatic task categorization and priority assignment
- Confidence scoring for AI-generated suggestions
- Support for complex multi-task scenarios from single voice input

*Manual Interface*
- Comprehensive form-based task creation with full metadata control
- Custom field support for specific household requirements
- Advanced scheduling with recurring task automation
- Multi-criteria filtering and search functionality
- Bulk task operations and template management

**Advanced Expense Management**
- Automated equal-split calculations with customizable percentages
- Receipt OCR processing for automatic expense data extraction
- Category-based expense organization with custom tags
- Historical spending analysis and budget tracking
- Multi-currency support with real-time conversion rates
- Payment integration preparation for Venmo/PayPal APIs

**Real-Time Collaboration Platform**
- WebSocket-based live synchronization across all connected devices
- Optimistic UI updates with conflict resolution algorithms
- Offline-first architecture with background sync reconciliation
- Push notification system for task assignments and deadline reminders
- Activity feed with comprehensive audit logging

## Tech Stack

**Mobile Application (Flutter 3.16+)**
- **UI Framework**: Material Design 3 with custom theme system
- **State Management**: Riverpod with BLoC pattern for complex state flows
- **Local Storage**: Hive for structured data, Flutter Secure Storage for credentials
- **Network Layer**: Dio HTTP client with retry policies and caching
- **Real-time Communication**: Socket.io client for live updates
- **Voice Processing**: Flutter speech-to-text with noise cancellation
- **Platform Integration**: Camera access, file system, background processing

**Backend Services (Node.js)**
- **API Framework**: Express.js with helmet security middleware
- **Architecture**: Service-oriented with dependency injection container
- **Database**: MongoDB 6.0+ with Mongoose ODM and connection pooling
- **Authentication**: JWT with access/refresh token rotation strategy
- **Real-time Engine**: Socket.io server with Redis adapter for scaling
- **Email Service**: Nodemailer with configurable SMTP providers
- **File Storage**: Multer for multipart uploads with cloud storage integration
- **Process Management**: PM2 for production deployment with clustering

**AI Integration**
- **Voice Processing**: Google Gemini 2.0 Flash API with rate limiting
- **Context Management**: Conversation history with sliding window approach
- **Error Handling**: Fallback mechanisms for AI service interruptions
- **Performance**: Response caching and request batching optimization

**Infrastructure & DevOps**
- **Database**: MongoDB Atlas with replica set configuration
- **Caching**: Redis for session storage and API response caching
- **Monitoring**: Winston logging with structured JSON output
- **Testing**: Jest for backend, Flutter test framework for mobile
- **CI/CD**: GitHub Actions with automated testing and deployment

## API

Base URL: `http://localhost:3000/api/v1`

### Authentication
```http
POST /auth/register
POST /auth/login
GET  /auth/profile
```

### Group Management
```http
POST   /groups                    # Create household
GET    /groups/:id                # Group details  
POST   /groups/join               # Join with invite code
DELETE /groups/:id/members/:userId # Remove member (admin only)
POST   /groups/:id/invite-email   # Send email invitation
PATCH  /groups/:id/transfer-admin # Transfer admin privileges
```

### Tasks
```http
GET    /tasks          # List tasks
POST   /tasks          # Create task
PATCH  /tasks/:id/complete # Mark task complete
DELETE /tasks/:id      # Remove task
```

### Voice AI
```http
POST /ai/process-voice
# Body: { audioData: base64, groupId: string }
# Response: { tasks: Array<TaskSuggestion>, confidence: number }

POST /ai/confirm-tasks  
# Body: { taskSuggestions: Array<TaskSuggestion>, modifications: Object }
# Response: { createdTasks: Array<Task>, failedTasks: Array<Error> }

GET /ai/context/:groupId
# Response: { recentTasks: Array<Task>, memberPreferences: Object }
```

### Expenses
```http
GET    /expenses       # Expense history  
POST   /expenses       # Log expense
GET    /expenses/balances # Current balances
DELETE /expenses/:id   # Remove expense
```

## Setup

### Prerequisites
- Node.js 18+
- Flutter 3.16+
- MongoDB

### Installation

```bash
git clone https://github.com/Y4NN777/roomy.git
cd roomy

# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Mobile
cd mobile
flutter pub get
flutter run
```

### Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/roomy
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
GEMINI_API_KEY=your-gemini-api-key
EMAIL_SERVICE_KEY=your-smtp-credentials
```

## Project Structure

```
roomy/
├── mobile/                      # Flutter Cross-Platform Application
│   ├── lib/
│   │   ├── features/           # Feature-based modular architecture
│   │   │   ├── authentication/ # User authentication and security
│   │   │   ├── group_management/ # Household group coordination
│   │   │   ├── task_management/ # Task creation and tracking
│   │   │   ├── calendar_view/   # Scheduling and timeline management
│   │   │   ├── expense_tracking/ # Financial management system
│   │   │   └── voice_assistant/ # AI-powered voice interface
│   │   ├── shared/             # Reusable components and utilities
│   │   │   ├── widgets/        # Common UI components
│   │   │   ├── services/       # API and data services
│   │   │   ├── models/         # Data models and DTOs
│   │   │   └── utils/          # Helper functions and constants
│   │   ├── core/               # Application foundation
│   │   │   ├── config/         # App configuration and constants
│   │   │   ├── theme/          # UI theme and styling
│   │   │   └── routing/        # Navigation and route management
│   │   └── main.dart           # Application entry point
│   ├── test/                   # Testing suite
│   │   ├── unit/               # Unit tests
│   │   ├── widget/             # Widget tests
│   │   └── integration/        # Integration tests
│   ├── android/                # Android-specific configuration
│   ├── ios/                    # iOS-specific configuration
│   └── pubspec.yaml            # Dependencies and metadata
│
├── backend/                     # Node.js Enterprise API Server
│   ├── src/
│   │   ├── controllers/v1/     # HTTP request handlers (versioned)
│   │   │   ├── auth.controller.js
│   │   │   ├── groups.controller.js
│   │   │   ├── tasks.controller.js
│   │   │   ├── expenses.controller.js
│   │   │   └── ai.controller.js
│   │   ├── services/           # Business logic implementation
│   │   │   ├── auth.service.js
│   │   │   ├── groups.service.js
│   │   │   ├── tasks.service.js
│   │   │   ├── expenses.service.js
│   │   │   └── ai.service.js
│   │   ├── models/             # Database schema definitions
│   │   │   ├── User.js
│   │   │   ├── Group.js
│   │   │   ├── Task.js
│   │   │   └── Expense.js
│   │   ├── routes/v1/          # API endpoint definitions (versioned)
│   │   │   ├── auth.routes.js
│   │   │   ├── groups.routes.js
│   │   │   ├── tasks.routes.js
│   │   │   ├── expenses.routes.js
│   │   │   └── ai.routes.js
│   │   ├── middleware/         # Request processing pipeline
│   │   │   ├── auth.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── config/             # System configuration management
│   │   │   ├── database.js
│   │   │   ├── jwt.js
│   │   │   └── ai.js
│   │   └── utils/              # Shared utility functions
│   │       ├── helpers.js
│   │       ├── validators.js
│   │       └── constants.js
│   ├── tests/                  # Backend testing infrastructure
│   │   ├── unit/               # Unit tests
│   │   ├── integration/        # API integration tests
│   │   └── fixtures/           # Test data and mocks
│   ├── package.json            # Dependencies and scripts
│   └── server.js               # Application bootstrap
│
├── docs/                       # Technical Documentation
│   ├── API.md                  # Comprehensive API reference
│   ├── ARCHITECTURE.md         # System design and architecture
│   ├── DEPLOYMENT.md           # Production deployment guide
│   ├── DEVELOPMENT.md          # Development setup and guidelines  
│   ├── VOICE_AI.md             # AI voice processing documentation
│   ├── DATABASE_SCHEMA.md      # Database design and relationships
│   └── USER_GUIDE.md           # End-user documentation
│
└── config/                     # Development and deployment configuration
    ├── docker-compose.yml      # Container orchestration
    ├── .github/
    │   └── workflows/          # CI/CD pipeline definitions
    ├── deployment/             # Infrastructure configuration
    └── .env.example            # Environment variables template
```

## Development

### Testing
```bash
# Backend tests
cd backend && npm test

# Mobile tests
cd mobile && flutter test
```

### Code Quality
- ESLint + Prettier for backend
- Flutter/Dart analyzer for mobile
- Conventional commits

## Deployment

### Backend
```bash
npm run build
npm run deploy
```

### Mobile
```bash
flutter build apk --release
flutter build ios --release
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built by developers who got tired of roommate coordination problems.
