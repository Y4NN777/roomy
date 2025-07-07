# Navigation Guide

This document outlines the navigation structure and patterns used in the Roomy Flutter application.

## Table of Contents
- [Navigation Setup](#navigation-setup)
- [Route Definitions](#route-definitions)
- [Navigation Patterns](#navigation-patterns)
- [Authentication Flow](#authentication-flow)
- [Main App Navigation](#main-app-navigation)
- [Best Practices](#best-practices)

## Navigation Setup

The app uses `go_router` for declarative routing and `riverpod` for state management.

### Dependencies
- `go_router`: ^8.0.0
- `flutter_riverpod`: ^2.0.0

## Route Definitions

All route names are defined in `lib/config/router/route_names.dart` as static constants.

Example:
```dart
class RouteNames {
  static const String welcome = '/welcome';
  static const String login = '/login';
  // ... other routes
}
```

## Navigation Patterns

### Basic Navigation

Use `context.go()` for navigation:

```dart
// Navigate to login screen
context.go(RouteNames.login);

// Navigate with parameters
context.go('${RouteNames.taskDetail}/123');
```

### Navigation with Result

For screens that return data:

```dart
// In source screen
final result = await context.push(RouteNames.someScreen);

// In destination screen
context.pop('return value');
```

## Authentication Flow

The router handles authentication state automatically:

1. Unauthenticated users are redirected to the welcome screen
2. Authenticated users without a group are redirected to group setup
3. Authenticated users with a group can access main app screens

## Main App Navigation

The main app uses a bottom navigation bar with these tabs:

1. **Home** (`/dashboard`)
2. **Tasks** (`/tasks`)
3. **Groups** (`/groups`)
4. **Finances** (`/finances`)

### Navigation Structure

```
/
├── /welcome
├── /login
├── /register
├── /group-setup
└── /app (shell)
    ├── /dashboard
    ├── /tasks
    │   ├── /create
    │   └── /:taskId
    ├── /groups
    │   └── /:groupId
    └── /finances
        ├── /create
        └── /:expenseId
```

## Best Practices

1. **Always use RouteNames**
   ```dart
   // Good
   context.go(RouteNames.login);
   
   // Avoid
   context.go('/login');
   ```

2. **Use context.go() vs context.push()**
   - Use `context.go()` for main navigation
   - Use `context.push()` for modals or dialogs

3. **Handle Deep Links**
   ```dart
   // Handle deep links
   final router = GoRouter(
     routes: [/*...*/],
     initialLocation: RouteNames.welcome,
     redirect: (context, state) {
       // Handle deep link logic
       return null;
     },
   );
   ```

4. **Navigation in State Management**
   When navigation needs to happen from business logic:
   ```dart
   // In your provider
   final someProvider = Provider((ref) {
     return SomeNotifier(
       onSuccess: () {
         final context = ref.read(navigatorKey).currentContext!;
         if (context.mounted) {
           context.go(RouteNames.dashboard);
         }
       },
     );
   });
   ```

## Common Issues

1. **Context Not Available**
   - Use `navigatorKey` for navigation outside the widget tree
   - Store it in your main app and provide it via Riverpod

2. **Route Not Found**
   - Ensure all routes are properly defined in `app_router.dart`
   - Check for typos in route names

3. **Navigation Duplicates**
   - Use `context.go()` to replace the current route
   - Use `context.push()` to add to the navigation stack
