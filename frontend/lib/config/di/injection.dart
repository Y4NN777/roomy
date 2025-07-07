import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/api_client.dart';
import '../../data/services/group_api_service.dart';
import '../../core/storage/secure_storage.dart';

// Global providers for dependency injection
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final groupApiServiceProvider = Provider<GroupApiService>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return GroupApiService(apiClient: apiClient);
});

// Setup function to initialize dependencies
Future<void> setupDependencies() async {
  // Initialize secure storage
  await SecureStorage.initialize();
  
  // You can add other initialization here
  // e.g., Firebase, crash reporting, etc.
}