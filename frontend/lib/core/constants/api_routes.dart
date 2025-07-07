import 'app_constants.dart';

/// API route constants for the application
class ApiRoutes {
  // Base URL builder
  static String get baseUrl => '${AppConstants.baseUrl}/${AppConstants.apiVersion}';
  
  // Auth routes
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String profile = '/auth/profile';
  
  // Group routes
  static const String groups = '/groups';
  static const String createGroup = '/groups';
  static const String joinGroup = '/groups/join';
  static const String leaveGroup = '/groups/leave';
  static const String groupMembers = '/groups/{groupId}/members';
  static const String groupInvite = '/groups/{groupId}/invite-email';
  static const String transferAdmin = '/groups/{groupId}/transfer-admin';
  static const String regenerateCode = '/groups/{groupId}/regenerate-invite';
  
  // Task routes
  static const String tasks = '/tasks';
  static const String createTask = '/tasks';
  static const String updateTask = '/tasks/{taskId}';
  static const String deleteTask = '/tasks/{taskId}';
  static const String completeTask = '/tasks/{taskId}/complete';
  static const String taskNotes = '/tasks/{taskId}/notes';
  static const String taskStatistics = '/tasks/statistics';
  
  // Expense routes
  static const String expenses = '/expenses';
  static const String createExpense = '/expenses';
  static const String updateExpense = '/expenses/{expenseId}';
  static const String deleteExpense = '/expenses/{expenseId}';
  static const String groupExpenses = '/expenses/group/{groupId}';
  static const String groupBalances = '/expenses/group/{groupId}/balances';
  static const String markSplitPaid = '/expenses/{expenseId}/splits/{memberId}/paid';
  static const String setCustomSplits = '/expenses/{expenseId}/splits/custom';
  static const String expenseStatistics = '/expenses/group/{groupId}/statistics';
  
  // AI routes
  static const String aiProcess = '/ai/process';
  static const String aiConfirmTasks = '/ai/confirm-tasks';
  static const String aiStatus = '/ai/status';
  
  // Notification routes
  static const String notifications = '/notifications';
  static const String markNotificationRead = '/notifications/{notificationId}/read';
  static const String markAllRead = '/notifications/mark-all-read';
  static const String notificationPreferences = '/notifications/preferences';
  
  /// Build a complete API URL with base URL and endpoint
  static String buildUrl(String endpoint) {
    return '$baseUrl$endpoint';
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