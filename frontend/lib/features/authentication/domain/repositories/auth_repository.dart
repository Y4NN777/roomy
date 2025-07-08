import '../../../../domain/entities/user.dart'; // Use domain user


abstract class AuthRepository {
  Future<User?> login(String email, String password);
  Future<User?> register(String name, String email, String password);
  Future<void> logout();
  Future<User?> getCurrentUser();
  Future<User?> updateProfile({String? name, String? email});
  Future<String?> refreshToken();
  Future<bool> isAuthenticated();
}