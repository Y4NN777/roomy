# 🏠 Roomy

**Where Shared Living Meets Simplicity**

[![Flutter](https://img.shields.io/badge/Flutter-3.16+-blue.svg)](https://flutter.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-brightgreen.svg)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Roomy** is an intelligent roommate task management platform that transforms household coordination through AI-powered voice commands, real-time collaboration, and intuitive design. Built to eliminate chore conflicts and foster harmonious shared living experiences.

---

## 📖 Project Overview

### **Academic Context**

This project represents the culmination of advanced coursework in **Mobile Operating Systems & Frameworks** and **XML & Web Services**, demonstrating practical application of modern software engineering principles in solving real-world problems. The system showcases comprehensive full-stack development capabilities while integrating cutting-edge AI technologies.

### **Problem Statement**

Shared living environments often suffer from communication breakdowns, unequal task distribution, and financial disputes. Traditional solutions rely on manual coordination methods that fail to scale with busy lifestyles and diverse household dynamics.

### **Solution Architecture**

Roomy addresses these challenges through a sophisticated multi-platform application that combines:

- **Intelligent Voice Processing** via Google Gemini 2.0 Flash for natural task creation
- **Real-time Synchronization** ensuring immediate updates across all household members
- **Role-based Permission Systems** maintaining appropriate access controls
- **Automated Financial Tracking** with transparent expense splitting algorithms

---

## 🚀 Core Features

### **🎤 AI-Powered Task Management**

**Natural Language Processing Engine**

- **Voice-to-Task Conversion**: Transform casual speech into structured household tasks
- **Contextual Understanding**: Interpret household-specific terminology and priorities
- **Intelligent Assignment**: Suggest optimal task distribution based on member availability and historical patterns
- **Confidence Scoring**: Provide reliability metrics for AI-generated suggestions

**Example Workflow:**

```
User Input: "Kitchen is a mess and we're out of groceries"
AI Output: 
├── Task 1: "Deep clean kitchen" → Assigned: Next rotation member
├── Task 2: "Purchase groceries" → Assigned: Available member
└── Priority: High (kitchen), Medium (groceries)
```

### **👥 Advanced Group Management**

**Hierarchical Permission System**

- **Administrative Controls**: Comprehensive member management, group settings, and system configuration
- **Secure Invitation Process**: Multi-channel invite distribution with unique code generation
- **Role-based Access**: Granular permissions ensuring appropriate data access and modification rights
- **Audit Trail**: Complete activity logging for accountability and dispute resolution

**Group Administration Features:**

- Member addition/removal with notification workflows
- Administrative privilege transfer with verification
- Group-wide settings and preference management
- Invitation link generation with expiration controls

### **📋 Intelligent Task Coordination**

**Dual-Mode Task Creation**

- **Traditional Interface**: Comprehensive form-based task definition with full metadata support
- **Voice Interface**: Natural language input with AI interpretation and validation
- **Assignment Logic**: Fair distribution algorithms considering member workload and preferences
- **Progress Tracking**: Real-time status updates with completion verification

**Task Management Capabilities:**

- Multi-criteria filtering and search functionality
- Calendar integration with deadline management
- Recurring task automation with flexible scheduling
- Performance analytics and completion reporting

### **💰 Financial Management System**

**Automated Expense Processing**

- **Equal Split Calculations**: Transparent division of shared household expenses
- **Balance Reconciliation**: Real-time debt tracking with settlement recommendations
- **Category Management**: Organized expense classification for budget analysis
- **Historical Reporting**: Comprehensive financial tracking and trend analysis

**Financial Features:**

- Expense logging with receipt attachment support
- Automatic split calculation among active members
- Balance sheet generation with individual liability tracking
- Payment status monitoring and reminder system

### **🔄 Real-time Collaboration Platform**

**Synchronized Data Management**

- **Live Updates**: Instantaneous synchronization across all connected devices
- **Conflict Resolution**: Intelligent handling of simultaneous data modifications
- **Offline Capability**: Core functionality maintenance during connectivity interruptions
- **Background Synchronization**: Seamless data reconciliation upon reconnection

---

## 🛠️ Technical Architecture

### **Mobile Application Stack**

```
Presentation Layer:    Flutter 3.16+ with Material Design 3
State Management:      Riverpod with BLoC pattern implementation
Data Persistence:      Hive for local storage, Flutter Secure Storage for credentials
Communication:         Dio HTTP client with WebSocket support
Platform Integration:  Speech-to-text, camera access, secure storage APIs
```

### **Backend Services Architecture**

```
API Layer:           Express.js with TypeScript, versioned REST endpoints
Business Logic:      Service-oriented architecture with dependency injection
Data Access:         Mongoose ODM with MongoDB, optimized queries and indexing
Authentication:      JWT-based security with refresh token rotation
External Integration: Google Gemini 2.0 Flash, SMTP email services
Real-time Engine:    Socket.io for bidirectional communication
```

### **Infrastructure Components**

```
Database:           MongoDB 6.0+ with replica set configuration
Caching:            Redis for session management and API response caching
Email Service:      Nodemailer with configurable SMTP providers
AI Processing:      Google Gemini 2.0 Flash API with rate limiting
Monitoring:         Comprehensive logging and error tracking systems
```

---

## 📡 API Documentation

### **Base Configuration**

```
Base URL:     http://localhost:3000/api/v1
Version:      1.0
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### **Authentication Endpoints**

```http
POST   /api/v1/auth/register     # User account creation
POST   /api/v1/auth/login        # User authentication
POST   /api/v1/auth/refresh      # Token renewal
GET    /api/v1/auth/profile      # User profile retrieval
PUT    /api/v1/auth/profile      # Profile information update
```

### **Group Management API**

```http
POST   /api/v1/groups                    # Group creation with admin assignment
GET    /api/v1/groups/:id                # Group information retrieval
POST   /api/v1/groups/join               # Group membership via invite code
DELETE /api/v1/groups/:id/members/:userId # Member removal (admin only)
POST   /api/v1/groups/:id/invite-email   # Email invitation dispatch
PATCH  /api/v1/groups/:id/transfer-admin # Administrative privilege transfer
```

### **Task Management API**

```http
GET    /api/v1/tasks              # Task list with filtering support
POST   /api/v1/tasks              # Manual task creation
PATCH  /api/v1/tasks/:id/complete # Task completion marking
DELETE /api/v1/tasks/:id          # Task removal (permission-based)
```

### **AI Voice Processing API**

```http
POST   /api/v1/ai/process-voice   # Natural language task interpretation
POST   /api/v1/ai/confirm-tasks   # AI suggestion confirmation and creation
```

### **Financial Management API**

```http
GET    /api/v1/expenses           # Expense history with filtering
POST   /api/v1/expenses           # Expense logging and split calculation
GET    /api/v1/expenses/balances  # Member balance reconciliation
DELETE /api/v1/expenses/:id       # Expense record removal
```

**📚 Complete API Reference**: [View detailed documentation](docs/API.md)

---

## 🏗️ System Architecture

### **Project Structure**

```
roomy/
├── 📱 mobile/                   # Flutter Cross-Platform Application
│   ├── lib/
│   │   ├── features/            # Modular feature implementation
│   │   │   ├── authentication/  # User authentication and security
│   │   │   ├── group_management/# Household group coordination
│   │   │   ├── task_management/ # Task creation and tracking
│   │   │   ├── calendar_view/   # Scheduling and timeline management
│   │   │   ├── expense_tracking/# Financial management system
│   │   │   └── voice_assistant/ # AI-powered voice interface
│   │   ├── shared/              # Reusable components and utilities
│   │   ├── core/                # Application foundation and configuration
│   │   └── main.dart            # Application entry point
│   └── test/                    # Comprehensive testing suite
│
├── 🖥️ backend/                  # Node.js Enterprise API Server
│   ├── src/
│   │   ├── controllers/v1/      # HTTP request handlers (versioned)
│   │   ├── services/            # Business logic implementation
│   │   ├── models/              # Database schema definitions
│   │   ├── routes/v1/           # API endpoint definitions (versioned)
│   │   ├── middleware/          # Request processing pipeline
│   │   ├── config/              # System configuration management
│   │   └── utils/               # Shared utility functions
│   ├── tests/                   # Backend testing infrastructure
│   └── server.js                # Application bootstrap
│
├── 📚 docs/                     # Technical Documentation
│   ├── API.md                   # Comprehensive API reference
│   ├── ARCHITECTURE.md          # System design documentation
│   ├── DEPLOYMENT.md            # Production deployment guide
│   └── USER_GUIDE.md            # End-user documentation
│
└── 🔧 config/                   # Development and deployment configuration
    ├── docker-compose.yml       # Container orchestration
    ├── .github/workflows/       # CI/CD pipeline definitions
    └── deployment/              # Infrastructure as code
```

---

## ⚙️ Installation & Setup

### **Prerequisites**

Ensure the following dependencies are installed:

- **Node.js 18+** with npm package manager
- **Flutter 3.16+** with Dart SDK
- **MongoDB 6.0+** (local installation or Atlas cloud service)
- **Git** for version control

### **Environment Configuration**

1. **Repository Setup**

   ```bash
   git clone https://github.com/Y4NN777/roomy.git
   cd roomy
   ```

2. **Backend Configuration**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure environment variables in .env
   npm run dev
   ```

3. **Mobile Application Setup**

   ```bash
   cd mobile
   flutter pub get
   flutter packages pub run build_runner build
   flutter run
   ```

### **Environment Variables**

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/roomy_production

# Security Configuration
JWT_ACCESS_SECRET=your-256-bit-access-secret
JWT_REFRESH_SECRET=your-256-bit-refresh-secret

# External Service Integration
GEMINI_API_KEY=your-google-ai-studio-api-key
EMAIL_SERVICE_KEY=your-smtp-service-credentials

# Application Configuration
NODE_ENV=development
PORT=3000
API_VERSION=1.0
```

---

## 👥 Development Team

### **Group 21 **

| Team Member | Role | Specialization | Contact |
|-------------|------|----------------|---------|
| **R Yanis Axel DABO** | Software Engineer | Backend Architecture & AI Integration | [@Y4NN](https://github.com/Y4NN777) |
| **Rayane BICABA** | Software Engineer | Mobile Development & User Experience | [@Ryko](https://github.com/RayaneBICABA) |

### **Academic Framework**

- **Institution**: Burkina Insititute Of Technology
- **Major**: Computer Science, Software Engineering 
- **Course Integration**: Mobile Operating Systems & Frameworks + XML & Web Services
- **Project Timeline**: July 29 - August 4, 2025 (Intensive Development Sprint)
- **Methodology**: Agile development with pair programming and collaborative ownership

### **Development Philosophy**

Our team employs a collaborative full-stack approach where both developers contribute to all system components, ensuring comprehensive understanding, reduced knowledge silos, and enhanced code quality through continuous peer review.

---

## 🧪 Quality Assurance

### **Testing Strategy**

```bash
# Backend Testing Suite
cd backend
npm test                    # Unit and integration tests
npm run test:coverage       # Coverage analysis
npm run test:e2e           # End-to-end API testing

# Mobile Testing Suite  
cd mobile
flutter test               # Widget and unit tests
flutter test integration_test/ # Integration testing
flutter analyze            # Static code analysis
```

### **Code Quality Standards**

- **Backend**: ESLint with JavaScript(Node) Prettier formatting
- **Mobile**: Flutter/Dart analyzer with custom linting rules
- **Documentation**: Comprehensive inline documentation and external guides
- **Version Control**: Conventional commit messages with semantic versioning

---

## 🚀 Deployment Architecture

### **Production Environment**

```bash
# Backend Deployment (Railway/Render)
npm run build              # Compilation
npm run deploy             # Production deployment

# Mobile Application Build
flutter build apk --release    # Android application package
flutter build ios --release    # iOS application bundle (macOS required)
```

### **Infrastructure Configuration**

- **Application Server**: Node.js with Express.js on cloud platform
- **Database**: MongoDB Atlas with replica set configuration
- **CDN**: Static asset delivery with global distribution
- **Monitoring**: Application performance monitoring with error tracking

---

## 📊 Project Metrics & Goals

### **Technical Objectives**

- **Performance**: API response times under 200ms for 95% of requests
- **Reliability**: 99.5% uptime with graceful error handling
- **Security**: Zero critical vulnerabilities with regular security audits
- **Scalability**: Support for 10,000+ concurrent users

### **Academic Learning Outcomes**

- **Mobile Development Mastery**: Advanced Flutter architecture and state management
- **Web Services Excellence**: RESTful API design with proper HTTP semantics
- **AI Integration**: Practical machine learning implementation in production systems
- **Software Engineering**: Professional development practices and methodologies

---

## 📝 Contributing Guidelines

### **Development Workflow**

1. **Issue Creation**: Detailed problem description with acceptance criteria
2. **Branch Strategy**: Feature branches with descriptive naming conventions
3. **Pull Request Process**: Mandatory code review with automated testing
4. **Documentation**: Updated documentation for all new features

### **Code Standards**

- **Commit Messages**: Conventional commits with clear scope and description
- **Code Review**: Mandatory peer review before merge approval
- **Testing**: Comprehensive test coverage for all new functionality
- **Documentation**: Updated technical and user documentation

---

## 📞 Support & Contact

### **Technical Support**

- **Bug Reports**: Use GitHub Issues with detailed reproduction steps
- **Feature Requests**: GitHub Discussions with use case description
- **Documentation**: Comprehensive guides in `/docs` directory

### **Academic Supervision**

- **Course Instructors**: Available for technical guidance and evaluation
- **Project Mentors**: Regular progress reviews and architectural guidance

---

## 🔮 Roadmap & Future Development

### **Phase 2 Enhancements** (Post-Academic Submission)

- **Advanced Analytics**: Comprehensive household efficiency metrics and reporting
- **Push Notifications**: Real-time mobile notifications with customizable preferences
- **Multi-language Support**: Internationalization for global user base
- **Advanced AI Features**: Predictive task scheduling and smart home integration

### **Phase 3 Scalability** (Long-term Vision)

- **Multi-household Management**: Support for managing multiple living spaces
- **Enterprise Features**: Property management company integration
- **Mobile Platform Expansion**: Native iOS and Android applications
- **Advanced Financial Tools**: Budget tracking, savings goals, and financial insights

---

## 📄 Legal & Compliance

### **Licensing**

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

### **Privacy & Data Protection**

- **Data Minimization**: Collection limited to essential functionality requirements
- **User Consent**: Explicit permission for all data processing activities
- **Security**: Industry-standard encryption for data in transit and at rest
- **Transparency**: Clear privacy policy and data usage documentation

---

<div align="center">

## 🏠 **Roomy**

### *Where Shared Living Meets Simplicity*

**Built with precision and passion by Group 21**

---

*Transforming household coordination through intelligent technology*

</div>
