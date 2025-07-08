import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/router/app_router.dart';
import 'config/di/injection.dart';
import 'core/theme/app_themes.dart';
import 'shared/services/local_notification_service.dart';
import 'config/env/app_config.dart';
import 'core/storage/secure_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize dependencies
  await setupDependencies();

  // Ensure secure storage is initialized
  await SecureStorage.initialize();


  // Set environment configuration
  AppConfig.setEnvironment(Environment.development); 
  
  // Initialize local notifications
  await LocalNotificationService.instance.initialize();
  
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Roomy App',
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}