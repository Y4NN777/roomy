import '../../../../domain/entities/user.dart'; // Use domain user
import '../../domain/repositories/auth_repository.dart';
import '../../../../data/datasources/api_client.dart';
import '../../../../data/models/user_model.dart';
import '../../../../core/storage/secure_storage.dart';

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;

  AuthRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<User?> login(String email, String password) async {
    try {
      // TODO: Replace with real API call
      await Future.delayed(const Duration(seconds: 2));
      
      if (email.isNotEmpty && password.isNotEmpty) {
        final mockUser = UserModel(
          id: 'user_123',
          name: 'John Doe',
          email: email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          isActive: true,
          groupId: '', // Add groupId parameter
        );
        
        await SecureStorage.storeUser(mockUser);
        await SecureStorage.storeTokens(
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        );
        
        // Convert to auth domain User entity
        final authUser = User(
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          profilePicture: mockUser.profilePicture,
          groupId: mockUser.groupId,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          isActive: mockUser.isActive,
        );
        
        return authUser;
      }
      return null;
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  @override
  Future<User?> register(String name, String email, String password) async {
    try {
      // TODO: Replace with real API call
      await Future.delayed(const Duration(seconds: 2));
      
      if (name.isNotEmpty && email.isNotEmpty && password.isNotEmpty) {
        final mockUser = UserModel(
          id: 'user_${DateTime.now().millisecondsSinceEpoch}',
          name: name,
          email: email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          isActive: true,
          groupId: '', // Add groupId parameter
        );
        
        await SecureStorage.storeUser(mockUser);
        await SecureStorage.storeTokens(
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        );
        
        // Convert to auth domain User entity
        final authUser = User(
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          profilePicture: mockUser.profilePicture,
          groupId: mockUser.groupId,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          isActive: mockUser.isActive,
        );
        
        return authUser;
      }
      return null;
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  @override
  Future<void> logout() async {
    await SecureStorage.clearAll();
  }

  @override
  Future<User?> getCurrentUser() async {
    try {
      final userModel = await SecureStorage.getUser();
      if (userModel != null) {
        // Convert to auth domain User entity
        return User(
          id: userModel.id,
          name: userModel.name,
          email: userModel.email,
          profilePicture: userModel.profilePicture,
          groupId: userModel.groupId,
          createdAt: userModel.createdAt,
          updatedAt: userModel.updatedAt,
          isActive: userModel.isActive,
        );
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  @override
  Future<String?> refreshToken() async {
    // TODO: Implement token refresh logic with _apiClient
    return await SecureStorage.getRefreshToken();
  }

  @override
  Future<bool> isAuthenticated() async {
    return await SecureStorage.isAuthenticated();
  }
}