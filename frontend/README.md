# 🏠 Roomy - Roommate Task Manager

A modern Flutter mobile application designed to help roommates manage shared tasks, expenses, and household responsibilities efficiently.

## 📱 Features

### 🔐 Authentication & User Management
- Secure user registration and login
- Profile management with avatar support
- JWT token-based authentication
- Session persistence

### 👥 Group Management
- Create and join roommate groups
- Unique group codes for easy invitation
- Group member management
- Group settings and preferences

### ✅ Task Management
- Create, assign, and track household tasks
- Priority levels (High, Medium, Low)
- Due date tracking with notifications
- Task status updates (Pending, In Progress, Completed, Cancelled)
- Task categorization and tags

### 💰 Financial Management
- Shared expense tracking
- Split bills and expenses
- Payment settlement tracking
- Financial reports and summaries

### 📊 Dashboard & Analytics
- Real-time task completion statistics
- Recent activity feed
- Upcoming task reminders
- Performance metrics

## 🏗️ Architecture

This project follows **Clean Architecture** principles with a feature-first organization:

```
lib/
├── core/                    # Core utilities and constants
│   ├── constants/          # App constants, API routes
│   ├── errors/             # Custom exceptions and failures
│   └── utils/              # Utility classes (Result, Validators)
├── data/                   # Data layer
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
│   ├── screens/            # UI screens
│   └── widgets/            # Reusable UI components
└── shared/                 # Shared components
    ├── widgets/            # Common widgets
    └── utils/              # Shared utilities
```

### 🎯 Architecture Principles

- **Separation of Concerns**: Clear boundaries between layers
- **Dependency Inversion**: Domain layer independent of external concerns
- **Single Responsibility**: Each class has one clear purpose
- **Testability**: Easy to unit test each layer independently
- **Scalability**: Easy to add new features without affecting existing code

## 🚀 Getting Started

### Prerequisites

- Flutter SDK (>=3.4.1)
- Dart SDK (>=3.4.1)
- Android Studio / VS Code
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

4. **Run the app**
   ```bash
   flutter run
   ```

### Environment Setup

Create a `.env` file in the project root:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_VERSION=v1

# App Configuration
APP_NAME=Roomy
APP_VERSION=1.0.0
```

## 🔌 API Integration

### Backend Requirements

The app is designed to work with a **Node.js REST API** backed by **MongoDB**. The API should provide the following endpoints:

#### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh

#### User Endpoints
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `PUT /users/change-password` - Change password

#### Group Endpoints
- `GET /groups` - Get user's groups
- `POST /groups` - Create new group
- `POST /groups/join` - Join group with code
- `POST /groups/leave` - Leave group
- `GET /groups/:id/members` - Get group members
- `POST /groups/:id/invite` - Invite user to group

#### Task Endpoints
- `GET /tasks` - Get user's tasks
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /tasks/:id/complete` - Mark task as complete
- `POST /tasks/:id/assign` - Assign task to user

#### Finance Endpoints
- `GET /finances/expenses` - Get expenses
- `POST /finances/expenses` - Create expense
- `PUT /finances/expenses/:id` - Update expense
- `DELETE /finances/expenses/:id` - Delete expense
- `POST /finances/expenses/:id/settle` - Settle expense

### API Response Format

All API responses should follow this format:

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

## 🧪 Testing

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

## 📦 Dependencies

### Core Dependencies
- **flutter**: UI framework
- **dio**: HTTP client for API calls
- **provider**: State management
- **go_router**: Navigation
- **shared_preferences**: Local storage
- **json_annotation**: JSON serialization

### Development Dependencies
- **flutter_lints**: Code linting
- **build_runner**: Code generation
- **json_serializable**: JSON code generation

## 🎨 UI/UX Design

The app follows Material Design 3 principles with a custom color scheme:

- **Primary Colors**: Orange (#F97316) and Blue (#03339C)
- **Background**: Light gray (#FAFAFA)
- **Text**: Dark blue (#03339C) and gray (#757575)

### Design System
- Consistent spacing and typography
- Responsive design for different screen sizes
- Accessibility support
- Dark mode ready (future implementation)

## 🔧 Configuration

### API Configuration
Update `lib/core/constants/app_constants.dart` to match your backend:

```dart
static const String baseUrl = 'http://your-api-url.com/api';
```

### Build Configuration
- **Android**: Configure in `android/app/build.gradle`
- **iOS**: Configure in `ios/Runner/Info.plist`
- **Web**: Configure in `web/index.html`

## 🚀 Deployment

### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

### Web
```bash
flutter build web --release
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow Dart/Flutter conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Write unit tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic authentication
- ✅ Group management
- ✅ Task management
- ✅ Basic UI/UX

### Phase 2 (Planned)
- 🔄 Push notifications
- 🔄 Real-time updates
- 🔄 File attachments
- 🔄 Advanced analytics

### Phase 3 (Future)
- 📅 Calendar integration
- 📅 Voice commands
- 📅 AI-powered task suggestions
- 📅 Multi-language support

---

**Built with ❤️ using Flutter**
