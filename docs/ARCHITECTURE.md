# Roomy System Architecture

## Engineering Design Document

**Project:** Roommate Task Manager with AI Assistant  
**Version:** 1.0  
**Date:** July 2, 2025  
**Architecture Pattern:** Layered Clean Architecture with Event-Driven Communication

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Event-Driven Clean Architecture (EDCA) with Modular Service-Oriented Design](#event-driven-clean-architecture-edca-with-modular-service-oriented-design)
3. [Component Architecture](#component-architecture)
4. [Technology Stack & Engineering Choices](#technology-stack--engineering-choices)
5. [Data Architecture](#data-architecture)
6. [Communication Patterns](#communication-patterns)
7. [Security Architecture](#security-architecture)
8. [Scalability & Performance Design](#scalability--performance-design)
9. [Architecture Evolution Path](#architecture-evolution-path)

---

## Architecture Overview

### System Name: "Hybrid Clean Architecture with AI Integration (HCAAI)"

The Roomy system implements a **Hybrid Clean Architecture** that combines traditional layered architecture principles with modern event-driven patterns, specifically designed for real-time collaborative applications with AI capabilities.

---

## Event-Driven Clean Architecture (EDCA) with Modular Service-Oriented Design

### Overview

The Roomy system adopts a hybrid architecture called **Event-Driven Clean Architecture (EDCA)** combined with **Modular Service-Oriented Design**. This architecture was selected to support the system's core requirements: clean separation of responsibilities, maintainability, real-time collaboration, and long-term scalability.

This pattern merges principles from Clean Architecture (originally introduced by Robert C. Martin) with modern Event-Driven paradigms. Each module, or service, adheres to a clean dependency rule and communicates through emitted events rather than direct calls. The system remains layered and composable, while enabling low-latency updates and loosely coupled collaboration between features.

#### Clean Architecture Principles

- **Separation of Concerns**: Different layers handle distinct responsibilities, ensuring maintainability and testability.
- **Dependency Inversion**: Outer layers (UI, network, storage) depend on inner business rules via interfaces, not vice versa.
- **Use Case-Centric Design**: The business logic layer orchestrates actions and rules, decoupled from delivery mechanisms.

#### Event-Driven Communication Principles

- **Loose Coupling**: Modules publish and subscribe to domain-specific events, avoiding direct dependencies.
- **Real-Time Feedback**: Clients are notified via WebSocket or internal bus immediately upon relevant changes.
- **Asynchronous Processing**: Event handlers operate independently, enabling scalable and reactive flows.

#### Modular Service-Oriented Design

Each business domain (authentication, tasks, expenses, AI) is organized as an independent module:

- **Single Responsibility**: Each service handles one core concern.
- **Interface Boundaries**: Services expose only contracts or interfaces, enabling mockability and future refactoring.
- **Microservice-Ready**: Modules can evolve into standalone services if needed.

#### Architecture Flow Example: Creating an Expense

1. The mobile client sends a POST request to the backend API to create a new expense.
2. The API Gateway Layer validates the request and forwards it to the ExpenseService.
3. The ExpenseService executes business rules, creates the expense, and calculates member splits.
4. The service emits an `ExpenseCreated` event.
5. Event listeners, such as NotificationService or AIService, react to the event asynchronously.
6. WebSocket-connected clients receive real-time updates.

#### Architecture Stack

- **Presentation Layer** (Flutter): UI widgets, local state management (Riverpod), navigation.
- **API Gateway Layer** (Express.js): Request routing, input validation, authentication middleware.
- **Service Layer**: Business logic encapsulated in feature-specific services (TaskService, ExpenseService, etc.).
- **Data Access Layer** (Mongoose): Data persistence using MongoDB with schema validation and indexes.
- **Event Handling Layer**: Listeners for emitted domain events (e.g., TaskCompleted, ExpenseSettled).

#### Engineering Benefits

- **Maintainability**: Feature boundaries and layering simplify debugging, testing, and onboarding.
- **Real-Time Experience**: Event propagation through WebSocket enhances interactivity.
- **Modular Growth**: Each module can be maintained or scaled independently.
- **Flexible Integration**: External services (AI, email) can subscribe to events without altering core logic.

#### Core Architectural Principles

| Principle | Implementation | Benefit |
|-----------|----------------|---------|
| **Separation of Concerns** | Distinct layers with single responsibilities | Maintainable, testable code |
| **Dependency Inversion** | Dependencies point inward toward business logic | Flexible, decoupled components |
| **Event-Driven Communication** | WebSocket + REST for real-time collaboration | Responsive user experience |
| **AI-First Design** | Dedicated AI service layer with fallback patterns | Future-ready with graceful degradation |
| **Mobile-Centric API** | REST endpoints optimized for mobile clients | Efficient mobile app performance |

#### High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROOMY ECOSYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  MOBILE CLIENT  │    │  BACKEND API    │    │ EXTERNAL SERVICES│         │
│  │   (Flutter)     │◄──►│   (Node.js)     │◄──►│ & INTEGRATIONS  │         │
│  │                 │    │                 │    │                 │         │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │         │
│  │ │Presentation │ │    │ │ API Gateway │ │    │ │   MongoDB   │ │         │
│  │ │   Layer     │ │    │ │   Layer     │ │    │ │   Atlas     │ │         │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │         │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │         │
│  │ │ Business    │ │    │ │ Service     │ │    │ │   Google    │ │         │
│  │ │ Logic       │ │    │ │ Layer       │ │    │ │   Gemini    │ │         │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ │   2.0 Flash │ │         │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ └─────────────┘ │         │
│  │ │ Data Access │ │    │ │ Data Access │ │    │ ┌─────────────┐ │         │
│  │ │ Layer       │ │    │ │ Layer       │ │    │ │   Email     │ │         │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ │   Service   │ │         │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ └─────────────┘ │         │
│  │ │ Local       │ │    │ │ WebSocket   │ │    │                 │         │
│  │ │ Storage     │ │    │ │ Server      │ │    │                 │         │
│  │ └─────────────┘ │    │ └─────────────┘ │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           │                       │                       │                │
│           └───── HTTP/HTTPS ──────┘                       │                │
│           └──── WebSocket ────────────────────────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## System Architecture Pattern

### Pattern Name: Event-Driven Clean Architecture (EDCA)

This architecture combines the benefits of Clean Architecture's dependency management with Event-Driven Architecture's real-time capabilities, specifically tailored for collaborative mobile applications.

### Architecture Layers

#### 1. Presentation Layer (Mobile Client)

**Technology:** Flutter with Material Design 3  
**Responsibility:** User interface, user interaction, local state management

```text
Presentation Layer
├── Widgets (UI Components)
├── Pages (Screen Containers)
├── State Management (BLoC/Riverpod)
└── Navigation (GoRouter)
```

**Key Engineering Choices:**

- Flutter Clean Architecture: Feature-based folder structure with clear separation
- Riverpod State Management: Dependency injection and reactive state updates
- Optimistic Updates: Immediate UI feedback with server reconciliation
- Offline-First Design: Local storage with background synchronization

#### 2. API Gateway Layer (Backend)

**Technology:** Express.js (Node.js)  
**Responsibility:** Request routing, authentication, rate limiting, response formatting

```text
API Gateway Layer
├── Route Handlers (HTTP Endpoints)
├── Middleware Stack
│   ├── Authentication (JWT)
│   ├── Authorization (Role-based)
│   ├── Validation (Input sanitization)
│   ├── Rate Limiting
│   └── Error Handling
└── WebSocket Manager (Real-time events)
```

**Key Engineering Choices:**

- RESTful Design: Resource-based URLs with proper HTTP methods
- Versioned APIs: `/api/v1/` for future compatibility
- Middleware Pipeline: Composable request processing chain
- WebSocket Integration: Dual-channel communication (REST + WebSocket)

#### 3. Service Layer (Backend)

**Technology:** Node.js with business logic separation  
**Responsibility:** Core business logic, external integrations, data orchestration

```text
Service Layer
├── Authentication Service
├── Group Management Service
├── Task Management Service
├── Expense Management Service
├── AI Processing Service
├── Notification Service
└── Email Service
```

**Key Engineering Choices:**

- Single Responsibility: Each service handles one business domain
- Dependency Injection: Services are injected into controllers
- Event Emission: Services emit events for cross-domain notifications
- Graceful Degradation: AI service failures don't break core functionality

#### 4. Data Access Layer (Backend)

**Technology:** Mongoose ODM with MongoDB  
**Responsibility:** Data persistence, query optimization, relationship management

```text
Data Access Layer
├── Models (Mongoose Schemas)
├── Repositories (Data access patterns)
├── Migrations (Schema evolution)
└── Indexes (Performance optimization)
```

**Key Engineering Choices:**

- Document-Based Design: NoSQL for flexible, nested data structures
- Schema Validation: Mongoose schemas with business rule enforcement
- Index Strategy: Optimized queries for mobile app performance
- Embedded Documents: Denormalization for read-heavy operations

#### 5. Integration Layer (External Services)

**Technology:** HTTP clients with retry and circuit breaker patterns  
**Responsibility:** External API communication, error handling, fallback strategies

```text
Integration Layer
├── AI Service Client (Google Gemini)
├── Email Service Client (SMTP)
├── File Storage Client (Future: Cloudinary)
└── Push Notification Client (Future: FCM)
```

---

## Component Architecture

### Mobile Application Architecture

#### Feature-Based Clean Architecture

```text
lib/
├── core/                           # Shared infrastructure
│   ├── constants/                  # App-wide constants
│   ├── errors/                     # Custom exceptions
│   ├── network/                    # HTTP client configuration
│   ├── theme/                      # Material Design theme
│   └── utils/                      # Helper functions
├── features/                       # Business features
│   ├── authentication/
│   │   ├── data/
│   │   │   ├── datasources/        # API clients
│   │   │   ├── models/             # JSON serialization
│   │   │   └── repositories/       # Data layer implementation
│   │   ├── domain/
│   │   │   ├── entities/           # Business objects
│   │   │   ├── repositories/       # Data contracts
│   │   │   └── usecases/           # Business logic
│   │   └── presentation/
│   │       ├── bloc/               # State management
│   │       ├── pages/              # Screen widgets
│   │       └── widgets/            # Feature components
│   ├── groups/                     # Group management feature
│   ├── tasks/                      # Task management feature
│   ├── expenses/                   # Expense management feature
│   ├── voice_assistant/            # AI voice processing feature
│   └── notifications/              # Real-time notifications feature
└── shared/                         # Cross-feature components
    ├── widgets/                    # Reusable UI components
    ├── services/                   # Cross-cutting services
    └── models/                     # Shared data models
```

**Architecture Benefits:**

- **Feature Independence:** Each feature can be developed and tested in isolation
- **Dependency Flow:** Dependencies always point inward toward business logic
- **Testability:** Each layer can be unit tested with mocked dependencies
- **Maintainability:** Clear separation makes code changes predictable

### Backend Application Architecture

#### Layered Service Architecture

```text
src/
├── controllers/                    # HTTP request handlers
│   ├── v1/                        # API version 1
│   │   ├── authController.js      # Authentication endpoints
│   │   ├── groupController.js     # Group management endpoints
│   │   ├── taskController.js      # Task management endpoints
│   │   ├── expenseController.js   # Expense management endpoints
│   │   ├── aiController.js        # AI processing endpoints
│   │   └── index.js               # Controller aggregator
├── services/                      # Business logic layer
│   ├── authService.js            # Authentication business logic
│   ├── groupService.js           # Group management logic
│   ├── taskService.js            # Task management logic
│   ├── expenseService.js         # Expense management logic
│   ├── aiService.js              # AI integration logic
│   ├── notificationService.js    # Notification handling
│   └── emailService.js           # Email functionality
├── models/                       # Database schemas
│   ├── User.js                   # User document schema
│   ├── Group.js                  # Group document schema
│   ├── Task.js                   # Task document schema
│   ├── Expense.js                # Expense document schema
│   └── index.js                  # Model aggregator
├── middleware/                   # Request processing pipeline
│   ├── auth.js                   # JWT authentication
│   ├── groupPermissions.js       # Role-based access control
│   ├── validation.js             # Input validation
│   ├── errorHandler.js           # Error response formatting
│   └── rateLimiter.js            # API rate limiting
├── routes/                       # URL routing configuration
│   ├── v1/                       # API version 1 routes
│   └── index.js                  # Route aggregator
├── config/                       # Configuration management
│   ├── database.js               # MongoDB connection
│   ├── jwt.js                    # JWT configuration
│   └── email.js                  # Email service config
└── utils/                        # Utility functions
    ├── logger.js                 # Logging utility
    ├── responseHelper.js         # Standardized responses
    └── constants.js              # Application constants
```

---

## Technology Stack & Engineering Choices

### Frontend Technology Stack

| Technology | Version | Purpose | Engineering Rationale |
|------------|---------|---------|----------------------|
| **Flutter** | 3.16+ | Cross-platform mobile framework | Single codebase for iOS/Android, native performance |
| **Dart** | 3.0+ | Programming language | Type-safe, optimized for mobile development |
| **Riverpod** | 2.4+ | State management | Compile-time DI, reactive updates, testability |
| **GoRouter** | 12.0+ | Navigation | Declarative routing, deep linking support |
| **Dio** | 5.3+ | HTTP client | Interceptors, request/response transformation |
| **Hive** | 2.2+ | Local storage | Fast NoSQL database for offline support |
| **WebSocket** | Built-in | Real-time communication | Instant UI updates for collaboration |

### Backend Technology Stack

| Technology | Version | Purpose | Engineering Rationale |
|------------|---------|---------|----------------------|
| **Node.js** | 18+ | Runtime environment | Non-blocking I/O, JavaScript ecosystem |
| **Express.js** | 4.18+ | Web framework | Minimal, flexible, extensive middleware |
| **MongoDB** | 6.0+ | Database | Flexible schema, horizontal scaling, JSON-like docs |
| **Mongoose** | 7.5+ | ODM | Schema validation, relationship management |
| **JWT** | 9.0+ | Authentication | Stateless, scalable authentication |
| **Socket.io** | 4.7+ | WebSocket | Real-time bidirectional communication |
| **Joi** | 17.9+ | Validation | Schema-based input validation |

### External Services

| Service | Purpose | Integration Method |
|---------|---------|-------------------|
| **Google Gemini 2.0 Flash** | AI voice/text processing | REST API with SDK |
| **MongoDB Atlas** | Cloud database hosting | Connection string with authentication |
| **Email Service** | Notification delivery | SMTP with template engine |
| **Railway/Render** | Backend hosting | Git-based deployment |

---

## Data Architecture

### Database Design Philosophy

**Pattern:** Document-Oriented with Embedded Relationships  
**Approach:** Denormalization for Read Performance

### Core Collections

#### User Document Structure

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  groupId: ObjectId (ref: Group),
  preferences: {
    notifications: Boolean,
    voiceEnabled: Boolean,
    theme: String
  },
  // ... metadata fields
}
```

#### Group Document Structure

```javascript
{
  _id: ObjectId,
  name: String,
  inviteCode: String (unique),
  members: [{
    userId: ObjectId (ref: User),
    role: String (admin/member),
    joinedAt: Date
  }],
  settings: {
    maxMembers: Number,
    allowExpenses: Boolean,
    timezone: String
  },
  statistics: {
    totalTasks: Number,
    completedTasks: Number,
    totalExpenses: Number
  }
  // ... metadata fields
}
```

#### Task Document Structure

```javascript
{
  _id: ObjectId,
  groupId: ObjectId (ref: Group),
  title: String,
  description: String,
  assignedTo: ObjectId (ref: User),
  createdBy: ObjectId (ref: User),
  dueDate: Date,
  priority: String (low/medium/high),
  status: String (pending/completed),
  category: String,
  aiGenerated: Boolean,
  originalVoiceInput: String,
  notes: [{
    content: String,
    authorId: ObjectId (ref: User),
    createdAt: Date
  }]
  // ... metadata fields
}
```

### Data Relationship Strategy

**Embedding vs. Referencing Decision Matrix:**

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| **Group Members** | Embedded Array | Small, frequently accessed together |
| **Task Notes** | Embedded Array | Grows slowly, accessed with task |
| **Expense Splits** | Embedded Array | Always accessed together |
| **User References** | ObjectId Reference | Normalized to prevent duplication |
| **Group Statistics** | Embedded Object | Calculated fields for performance |

### Indexing Strategy

```javascript
// Performance-critical indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.groups.createIndex({ inviteCode: 1 }, { unique: true });
db.tasks.createIndex({ groupId: 1, status: 1, dueDate: 1 });
db.expenses.createIndex({ groupId: 1, date: -1 });

// Compound indexes for common queries
db.tasks.createIndex({ assignedTo: 1, status: 1, dueDate: 1 });
db.expenses.createIndex({ groupId: 1, isSettled: 1, date: -1 });
```

---

## Communication Patterns

### Request-Response Pattern (REST)

**Primary Use:** CRUD operations, authentication, data retrieval

```plaintext
Mobile Client ──HTTP Request──► Backend API
             ◄──JSON Response── 
```

**Characteristics:**

- Stateless communication
- Resource-based URLs
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JWT token authentication

### Event-Driven Pattern (WebSocket)

**Primary Use:** Real-time updates, notifications, collaborative features

```plaintext
Mobile Client ◄─── WebSocket ──► Backend API
             │                      │
             └── Event Broadcast ──┘
```

**Event Types:**

- `TASK_ASSIGNED` - New task assignment
- `TASK_COMPLETED` - Task completion notification
- `EXPENSE_ADDED` - New expense logged
- `GROUP_MEMBER_JOINED` - New member notification
- `PAYMENT_REMINDER` - Balance reminder

### AI Integration Pattern

**Primary Use:** Voice/text processing, task suggestion

```plaintext
Mobile Client ──Voice/Text──► Backend API ──Natural Language──► Google Gemini
             ◄──Task Suggestions── ◄──AI Response──
```

**Flow:**

1. User provides voice/text input
2. Backend processes and sends to AI service
3. AI returns structured task suggestions
4. Backend formats and returns suggestions
5. User confirms/modifies suggestions
6. Backend creates confirmed tasks

---

## Security Architecture

### Authentication & Authorization Flow

```plaintext
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───►│   JWT       │───►│  Protected  │
│  Request    │    │ Generation  │    │  Resource   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Credentials │    │ Access +    │    │ Permission  │
│ Validation  │    │ Refresh     │    │   Check     │
│             │    │ Tokens      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Security Layers

| Layer | Security Measure | Implementation |
|-------|------------------|----------------|
| **Transport** | HTTPS/TLS | SSL certificates, secure headers |
| **Authentication** | JWT Tokens | Stateless, short-lived access tokens |
| **Authorization** | Role-Based Access | Middleware permission checks |
| **Input Validation** | Schema Validation | Joi schemas, sanitization |
| **Data Protection** | Password Hashing | bcrypt with salt rounds |
| **Rate Limiting** | Request Throttling | IP-based rate limiting |

### Security Middleware Stack

```javascript
// Security middleware pipeline
app.use(helmet());                    // Security headers
app.use(cors());                      // Cross-origin resource sharing
app.use(rateLimiter);                 // Rate limiting
app.use(authenticateToken);           // JWT verification
app.use(validateInput);               // Input sanitization
app.use(checkPermissions);            // Role-based authorization
```

---

## Scalability & Performance Design

### Horizontal Scaling Strategy

**Database Scaling:**

- MongoDB Atlas auto-scaling
- Read replicas for query performance
- Sharding by group ID for multi-tenancy

**Application Scaling:**

- Stateless backend design
- Load balancer support
- Microservice decomposition readiness

### Performance Optimization Techniques

#### Backend Optimizations

| Technique | Implementation | Benefit |
|-----------|----------------|---------|
| **Database Indexing** | Compound indexes on common queries | 10x faster query performance |
| **Response Caching** | In-memory caching for static data | Reduced database load |
| **Connection Pooling** | MongoDB connection reuse | Lower connection overhead |
| **Lazy Loading** | On-demand relationship population | Reduced payload size |
| **Aggregation Pipelines** | Database-level data processing | Server-side computation |

#### Mobile Optimizations

| Technique | Implementation | Benefit |
|-----------|----------------|---------|
| **Offline Storage** | Hive local database | Instant app responsiveness |
| **Optimistic Updates** | Immediate UI feedback | Perceived performance improvement |
| **Image Caching** | CachedNetworkImage widget | Reduced network requests |
| **Lazy Widgets** | ListView.builder with pagination | Memory efficiency |
| **State Persistence** | Automatic state restoration | Seamless user experience |

### Monitoring & Observability

**Performance Metrics:**

- API response times (target: <500ms)
- Database query performance
- WebSocket connection stability
- Mobile app startup time (target: <3s)
- Memory usage and battery impact

**Error Tracking:**

- Centralized logging with structured data
- Error aggregation and alerting
- Performance regression detection
- User session replay for debugging

---

## Architecture Evolution Path

### Phase 1: MVP (Current)

- Core CRUD functionality
- Basic real-time features
- Simple AI integration

### Phase 2: Enhancement (3-6 months)

- Advanced AI capabilities
- Comprehensive notifications
- Performance optimizations
- Enhanced security features

### Phase 3: Scale (6-12 months)

- Microservice decomposition
- Multi-tenant architecture
- Advanced analytics
- Third-party integrations

### When to Use EDCA with Modular Services

This architecture pattern is most appropriate when:

- Building collaborative, real-time applications.
- Planning for scalable, modular, or microservice-ready systems.
- Needing testable and maintainable code with isolated business domains.
- Expecting integration with external asynchronous services (AI, messaging, etc.).

### Summary

Event-Driven Clean Architecture with Modular Service-Oriented Design provides Roomy with a scalable, maintainable, and real-time capable foundation. It enables the team to build modular features that interact through events and obey clean separation of concerns. This architecture positions Roomy for future enhancements, including advanced AI integrations, real-time analytics, and independent deployment of business domains.

This architecture provides a solid foundation for the Roomy application while maintaining flexibility for future enhancements and scaling requirements. The hybrid approach balances development speed with long-term maintainability, making it ideal for an academic project that demonstrates real-world software engineering practices.
