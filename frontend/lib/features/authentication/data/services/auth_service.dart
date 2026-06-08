import 'dart:async';

/// Service class to handle authentication logic such as login and registration.
/// Currently simulates network calls with delays.
class AuthService {
  /// Simulates a login process with email and password.
  /// Returns true if login is successful.
  Future<bool> login(String email, String password) async {
    // TODO: Replace with real API call
    await Future.delayed(const Duration(seconds: 2));
    // For demo, accept any non-empty credentials
    return email.isNotEmpty && password.isNotEmpty;
  }

  /// Simulates a registration process with name, email, and password.
  /// Returns true if registration is successful.
  Future<bool> register(String name, String email, String password) async {
    // TODO: Replace with real API call
    await Future.delayed(const Duration(seconds: 2));
    // For demo, accept any non-empty inputs
    return name.isNotEmpty && email.isNotEmpty && password.isNotEmpty;
  }
}
