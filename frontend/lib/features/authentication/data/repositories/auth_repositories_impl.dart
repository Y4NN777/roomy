import '../../../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../data/datasources/api_client.dart';
import '../../../../data/models/user_model.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/constants/api_routes.dart';

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;

  AuthRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<User?> login(String email, String password) async {
    try {
      final response = await _apiClient.post(
        ApiRoutes.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        final userModel = UserModel.fromJson(data['user']);
        
        await SecureStorage.storeTokens(
          accessToken: data['token'],
          refreshToken: data['refreshToken'],
        );
        await SecureStorage.storeUser(userModel);
        
        return userModel.toDomainEntity();
      }
      return null;
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  @override
  Future<User?> register(String name, String email, String password) async {
    try {
      final response = await _apiClient.post(
        ApiRoutes.register,
        data: {
          'name': name,
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = response.data['data'];
        final userModel = UserModel.fromJson(data['user']);
        
        await SecureStorage.storeTokens(
          accessToken: data['token'],
          refreshToken: data['refreshToken'],
        );
        await SecureStorage.storeUser(userModel);
        
        return userModel.toDomainEntity();
      }
      return null;
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _apiClient.post(ApiRoutes.logout);
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      await SecureStorage.clearAll();
    }
  }

  @override
  Future<User?> getCurrentUser() async {
    try {
      final userModel = await SecureStorage.getUser();
      return userModel?.toDomainEntity();
    } catch (e) {
      return null;
    }
  }

  @override
  Future<String?> refreshToken() async {
    final refreshToken = await SecureStorage.getRefreshToken();
    if (refreshToken == null) return null;

    try {
      final response = await _apiClient.post(
        ApiRoutes.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await SecureStorage.storeTokens(
          accessToken: data['token'],
          refreshToken: data['refreshToken'],
        );
        return data['token'];
      }
    } catch (e) {
      await SecureStorage.clearAll();
    }
    return null;
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await SecureStorage.getAccessToken();
    return token != null;
  }

  @override
  Future<User?> updateProfile({
    String? name,
    String? email,
  }) async {
    try {
      final response = await _apiClient.put(
        ApiRoutes.profile,
        data: {
          if (name != null) 'name': name,
          if (email != null) 'email': email,
        },
      );

      if (response.statusCode == 200) {
        final userModel = UserModel.fromJson(response.data['data']);
        await SecureStorage.storeUser(userModel);
        return userModel.toDomainEntity();
      }
      return null;
    } catch (e) {
      throw Exception('Profile update failed: $e');
    }
  }
}