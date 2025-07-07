class RouteNames {
  // Auth routes
  static const String welcome = '/welcome';
  static const String login = '/login';
  static const String register = '/register';
  static const String groupSetup = '/group-setup';
  
  // Main app routes
  static const String dashboard = '/dashboard';
  static const String tasks = '/tasks';
  static const String taskDetail = '/tasks/:taskId';
  static const String createTask = '/tasks/create';
  static const String groups = '/groups';
  static const String groupDetail = '/groups/:groupId';
  static const String finances = '/finances';
  static const String expenseDetail = '/finances/:expenseId';
  static const String createExpense = '/finances/create';
  static const String calendar = '/calendar';
  static const String notifications = '/notifications';
  static const String voiceAssistant = '/voice-assistant';
  static const String profile = '/profile';
  
  // Settings routes
  static const String settings = '/settings';
  static const String notificationSettings = '/settings/notifications';
}