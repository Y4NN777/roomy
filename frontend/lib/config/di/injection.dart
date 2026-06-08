import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/datasources/api_client.dart';
import '../../data/services/group_api_service.dart';
import '../../features/authentication/data/repositories/auth_repositories_impl.dart';
import '../../features/authentication/domain/repositories/auth_repository.dart';
import '../../features/groups/data/repositories/group_repository_impl.dart';
import '../../features/groups/domain/repositories/group_repository.dart';
import '../../features/groups/presentation/providers/group_notifier.dart';
import '../../core/network/websocket_client.dart';
import '../../core/storage/secure_storage.dart';

// Global providers for dependency injection
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return AuthRepositoryImpl(apiClient: apiClient);
});

// Group Repository
final groupRepositoryProvider = Provider<GroupRepository>((ref) {
  final apiService = ref.read(groupApiServiceProvider);
  return GroupRepositoryImpl(apiService);
});

// Group State Notifier
final groupProvider = StateNotifierProvider<GroupNotifier, GroupState>((ref) {
  final repository = ref.read(groupRepositoryProvider);
  return GroupNotifier(repository);
});

final groupApiServiceProvider = Provider<GroupApiService>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return GroupApiService(apiClient: apiClient);
});

final webSocketClientProvider = Provider<WebSocketClient>((ref) {
  return WebSocketClient.instance;
});

// Setup function to initialize dependencies
Future<void> setupDependencies() async {
  // Initialize secure storage
  await SecureStorage.initialize();
  
  // You can add other initialization here
  // e.g., Firebase, crash reporting, etc.
}