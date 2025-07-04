import 'package:flutter/material.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/welcome_screen.dart';
import 'screens/auth/group_setup.dart';
import 'screens/dashboard/home_screen.dart';
import 'screens/task/tasks_screen.dart';
// Import placeholders for groups and finances screens
import 'screens/groups/groups_screen.dart';
import 'screens/finances/finances_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Roomy App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      initialRoute: '/task',
      routes: {
        '/welcome': (context) => const WelcomePage(),
        '/login': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/group-setup': (context) => const GroupSetupPage(),
        '/main': (context) => const HomePage(),
        '/task': (context) => const TasksPage(),
        '/groups': (context) => const GroupsPage(), // Placeholder screen
        '/finances': (context) => const FinancesPage(), // Placeholder screen
      },
      onUnknownRoute: (settings) {
        // Redirect unknown routes to welcome page
        return MaterialPageRoute(builder: (context) => const WelcomePage());
      },
    );
  }
}
