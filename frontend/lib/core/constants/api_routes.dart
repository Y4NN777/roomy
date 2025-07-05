import 'app_constants.dart';

/// API route constants for the application
class ApiRoutes {
  // Auth routes
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  
  // User routes
  static const String profile = '/users/profile';
  static const String updateProfile = '/users/profile';
  static const String changePassword = '/users/change-password';
  
  // Group routes
  static const String groups = '/groups';
  static const String createGroup = '/groups';
  static const String joinGroup = '/groups/join';
  static const String leaveGroup = '/groups/leave';
  static const String groupMembers = '/groups/{groupId}/members';
  static const String groupInvite = '/groups/{groupId}/invite';
  
  // Task routes
  static const String tasks = '/tasks';
  static const String createTask = '/tasks';
  static const String updateTask = '/tasks/{taskId}';
  static const String deleteTask = '/tasks/{taskId}';
  static const String completeTask = '/tasks/{taskId}/complete';
  static const String assignTask = '/tasks/{taskId}/assign';
  static const String groupTasks = '/groups/{groupId}/tasks';
  
  // Finance routes
  static const String finances = '/finances';
  static const String createExpense = '/finances/expenses';
  static const String updateExpense = '/finances/expenses/{expenseId}';
  static const String deleteExpense = '/finances/expenses/{expenseId}';
  static const String groupExpenses = '/groups/{groupId}/expenses';
  static const String settleExpense = '/finances/expenses/{expenseId}/settle';
  
  /// Build a complete API URL with base URL and endpoint
  static String buildUrl(String endpoint) {
    return '${AppConstants.baseUrl}$endpoint';
  }
  
  /// Replace path parameters in a route
  static String replaceParams(String route, Map<String, String> params) {
    String result = route;
    params.forEach((key, value) {
      result = result.replaceAll('{$key}', value);
    });
    return result;
  }
} 