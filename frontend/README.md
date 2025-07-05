# Roomy - Roommate Task Manager

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" width="60" height="60" alt="Flutter">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg" width="60" height="60" alt="Dart">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="60" height="60" alt="Node.js">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" width="60" height="60" alt="MongoDB">
</div>

A modern Flutter mobile application designed to help roommates manage shared tasks, expenses, and household responsibilities efficiently. Built with Clean Architecture principles and modern development practices.

## <img src="https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/flutter.svg" width="20" height="20" alt="Features"> Features

### Authentication & User Management
- Secure user registration and login system
- Comprehensive profile management with avatar support
- JWT token-based authentication with refresh tokens
- Persistent session management

### Group Management
- Create and join roommate groups seamlessly
- Unique group codes for easy invitation system
- Comprehensive group member management
- Customizable group settings and preferences

### Task Management
- Create, assign, and track household tasks
- Priority levels (High, Medium, Low) with visual indicators
- Due date tracking with automated notifications
- Task status updates (Pending, In Progress, Completed, Cancelled)
- Advanced task categorization and tagging system

### Financial Management
- Comprehensive shared expense tracking
- Automated bill splitting and expense management
- Payment settlement tracking with notifications
- Detailed financial reports and analytics

### Dashboard & Analytics
- Real-time task completion statistics
- Recent activity feed with filtering options
- Upcoming task reminders and notifications
- Performance metrics and productivity insights

## Architecture

This project follows **Clean Architecture** principles with a feature-first organization approach:

```
lib/
├── core/                    # Core utilities and constants
│   ├── constants/          # Application constants, API routes
│   ├── errors/             # Custom exceptions and failure handling
│   └── utils/              # Utility classes (Result, Validators)
├── data/                   # Data layer implementation
│   ├── datasources/        # API client and data sources
│   ├── models/             # Data models with JSON serialization
│   └── repositories/       # Repository implementations
├── domain/                 # Domain layer (business logic)
│   ├── entities/           # Core business entities
│   ├── repositories/       # Repository interfaces
│   └── usecases/           # Business use cases
├── presentation/           # Presentation layer
│   ├── providers/          # State management providers
│   ├── blocs/              # Business logic components
│   ├── screens/            # User interface screens
│   └── widgets/            # Reusable UI components
└── shared/                 # Shared components
    ├── widgets/            # Common widgets
    └── utils/              # Shared utilities
```

### Architecture Principles

- **Separation of Concerns**: Clear boundaries between architectural layers
- **Dependency Inversion**: Domain layer independent of external dependencies
- **Single Responsibility**: Each class maintains one clear purpose
- **Testability**: Comprehensive unit testing for each layer
- **Scalability**: Easy feature addition without affecting existing codebase

## Getting Started

### Prerequisites

- Flutter SDK (>=3.4.1)
- Dart SDK (>=3.4.1)
- Android Studio / Visual Studio Code
- Node.js (for backend API)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd roomy-mobile-frontend-app/frontend
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate code**
   ```bash
   dart run build_runner build
   ```

4. **Run the application**
   ```bash
   flutter run
   ```

### Environment Configuration

Create a `.env` file in the project root:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_VERSION=v1

# Application Configuration
APP_NAME=Roomy
APP_VERSION=1.0.0
```

##  API Integration

### Backend Requirements

The application is designed to work with a **Node.js REST API** backed by **MongoDB**. The API should provide the following endpoints:

#### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh

#### User Management Endpoints
- `GET /users/profile` - Retrieve user profile
- `PUT /users/profile` - Update user profile
- `PUT /users/change-password` - Change user password

#### Group Management Endpoints
- `GET /groups` - Retrieve user groups
- `POST /groups` - Create new group
- `POST /groups/join` - Join group with invitation code
- `POST /groups/leave` - Leave group
- `GET /groups/:id/members` - Retrieve group members
- `POST /groups/:id/invite` - Invite user to group

#### Task Management Endpoints
- `GET /tasks` - Retrieve user tasks
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /tasks/:id/complete` - Mark task as complete
- `POST /tasks/:id/assign` - Assign task to user

#### Financial Management Endpoints
- `GET /finances/expenses` - Retrieve expenses
- `POST /finances/expenses` - Create expense
- `PUT /finances/expenses/:id` - Update expense
- `DELETE /finances/expenses/:id` - Delete expense
- `POST /finances/expenses/:id/settle` - Settle expense

### API Response Format

All API responses follow this standardized format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "code": "SUCCESS_CODE"
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "errors": {
    "field": "Field-specific error"
  }
}
```

## Testing

### Unit Tests
```bash
flutter test
```

### Widget Tests
```bash
flutter test test/widget_test.dart
```

### Integration Tests
```bash
flutter test integration_test/
```

## Dependencies

### Core Dependencies
- **flutter**: UI framework
- **dio**: HTTP client for API communication
- **provider**: State management solution
- **go_router**: Navigation management
- **shared_preferences**: Local storage
- **json_annotation**: JSON serialization

### Development Dependencies
- **flutter_lints**: Code linting and analysis
- **build_runner**: Code generation
- **json_serializable**: JSON code generation

## UI/UX Design

The application follows Material Design 3 principles with a custom color scheme:

- **Primary Colors**: Orange (#F97316) and Blue (#03339C)
- **Background**: Light gray (#FAFAFA)
- **Text**: Dark blue (#03339C) and gray (#757575)

### Design System
- Consistent spacing and typography
- Responsive design for various screen sizes
- Accessibility support and compliance
- Dark mode ready (future implementation)

## Configuration

### API Configuration
Update `lib/core/constants/app_constants.dart` to match your backend:

```dart
static const String baseUrl = 'http://your-api-url.com/api';
```


## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style Guidelines
- Follow Dart/Flutter conventions and best practices
- Use meaningful variable and function names
- Add comprehensive comments for complex logic
- Write unit tests for new features
- Maintain consistent code formatting


## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

### Phase 1 (Current)
- Basic authentication system
- Group management functionality
- Task management system
- Basic UI/UX implementation

### Phase 2 (In Progress)
- Push notifications
- Real-time updates
  File attachments
- Advanced analytics

### Phase 3 (Future)
- Calendar integration
- Voice commands
- AI-powered task suggestions
- Multi-language support

---

<div align="center">
  <strong>Built with Flutter</strong>
  <br>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" width="30" height="30" alt="Flutter">
</div>