import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// Import all your screens
import '../../features/authentication/presentation/screens/welcome_screen.dart';
import '../../features/authentication/presentation/screens/login_screen.dart';
import '../../features/authentication/presentation/screens/register_screen.dart';
import '../../features/authentication/presentation/screens/group_setup.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/tasks/presentation/screens/tasks_screen.dart';
import '../../features/tasks/presentation/screens/create_task_screen.dart';
import '../../features/tasks/presentation/screens/task_detail_screen.dart';
import '../../features/groups/presentation/screens/groups_screen.dart';
import '../../features/expenses/presentation/screens/finances_screen.dart';
import '../../features/expenses/presentation/screens/create_expense_screen.dart';
import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/ai_assistant/presentation/screens/voice_assistant_screen.dart';

// Import providers
import '../../features/authentication/presentation/providers/auth_provider.dart';

import 'route_names.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  
  return GoRouter(
    initialLocation: RouteNames.welcome,
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final hasGroup = authState.currentUser?.groupId != null;
      final currentLocation = state.uri.toString();
      
      // Public routes that don't require auth
      final publicRoutes = [
        RouteNames.welcome,
        RouteNames.login,
        RouteNames.register,
      ];
      
      if (!isAuthenticated && !publicRoutes.contains(currentLocation)) {
        return RouteNames.welcome;
      }
      
      if (isAuthenticated && !hasGroup && currentLocation != RouteNames.groupSetup) {
        return RouteNames.groupSetup;
      }
      
      if (isAuthenticated && hasGroup && publicRoutes.contains(currentLocation)) {
        return RouteNames.dashboard;
      }
      
      return null; // No redirect needed
    },
    routes: [
      // Auth routes
      GoRoute(
        path: RouteNames.welcome,
        name: 'welcome',
        builder: (context, state) => const WelcomePage(),
      ),
      GoRoute(
        path: RouteNames.login,
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: RouteNames.register,
        name: 'register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: RouteNames.groupSetup,
        name: 'groupSetup',
        builder: (context, state) => const GroupSetupPage(),
      ),
      
      // Main app routes with shell route for bottom navigation
      ShellRoute(
        builder: (context, state, child) {
          return MainNavigationShell(child: child);
        },
        routes: [
          GoRoute(
            path: RouteNames.dashboard,
            name: 'dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: RouteNames.tasks,
            name: 'tasks',
            builder: (context, state) => const TasksPage(),
            routes: [
              GoRoute(
                path: 'create',
                name: 'createTask',
                builder: (context, state) => const CreateTaskScreen(),
              ),
              GoRoute(
                path: ':taskId',
                name: 'taskDetail',
                builder: (context, state) {
                  final taskId = state.pathParameters['taskId']!;
                  return TaskDetailScreen(taskId: taskId);
                },
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.groups,
            name: 'groups',
            builder: (context, state) => const GroupsPage(),
          ),
          GoRoute(
            path: RouteNames.finances,
            name: 'finances',
            builder: (context, state) => const FinancesPage(),
            routes: [
              GoRoute(
                path: 'create',
                name: 'createExpense',
                builder: (context, state) => const CreateExpenseScreen(),
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.calendar,
            name: 'calendar',
            builder: (context, state) => const CalendarScreen(),
          ),
        ],
      ),
      
      // Modal routes (don't use shell)
      GoRoute(
        path: RouteNames.notifications,
        name: 'notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: RouteNames.voiceAssistant,
        name: 'voiceAssistant',
        builder: (context, state) => const VoiceAssistantScreen(),
      ),
    ],
    errorBuilder: (context, state) => const WelcomePage(),
  );
});

// Shell for bottom navigation
class MainNavigationShell extends StatelessWidget {
  final Widget child;
  
  const MainNavigationShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: const MainBottomNavigation(),
    );
  }
}

// You'll implement this widget to replace the bottom nav in each screen
class MainBottomNavigation extends ConsumerWidget {
  const MainBottomNavigation({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentRoute = GoRouterState.of(context).uri.toString();
    
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: _getSelectedIndex(currentRoute),
      onTap: (index) => _onTabTapped(context, index),
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          activeIcon: Icon(Icons.home),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.check_circle_outline),
          activeIcon: Icon(Icons.check_circle),
          label: 'Tasks',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.group_outlined),
          activeIcon: Icon(Icons.group),
          label: 'Groups',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.attach_money_outlined),
          activeIcon: Icon(Icons.attach_money),
          label: 'Finances',
        ),
      ],
    );
  }

  int _getSelectedIndex(String route) {
    if (route.startsWith('/dashboard')) return 0;
    if (route.startsWith('/tasks')) return 1;
    if (route.startsWith('/groups')) return 2;
    if (route.startsWith('/finances')) return 3;
    return 0;
  }

  void _onTabTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(RouteNames.dashboard);
        break;
      case 1:
        context.go(RouteNames.tasks);
        break;
      case 2:
        context.go(RouteNames.groups);
        break;
      case 3:
        context.go(RouteNames.finances);
        break;
    }
  }
}