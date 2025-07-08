import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../domain/entities/user.dart';
import '../../../../config/di/injection.dart';
import '../../../../features/authentication/domain/repositories/auth_repository.dart';
import '../../data/repositories/auth_repositories_impl.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return AuthRepositoryImpl(apiClient: apiClient);
});



// Auth state class
class AuthState {
  final User? currentUser;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.currentUser,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    User? currentUser,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    bool clearUser = false,
    bool clearError = false,
  }) {
    return AuthState(
      currentUser: clearUser ? null : (currentUser ?? this.currentUser),
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }

  bool get hasGroup => currentUser?.groupId != null;
}

// Auth provider
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;

  AuthNotifier(this._authRepository) : super(const AuthState()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    
    try {
      final user = await _authRepository.getCurrentUser();
      if (user != null) {
        state = state.copyWith(
          currentUser: user,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isAuthenticated: false,
          isLoading: false,
          clearUser: true,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    
    try {
      final user = await _authRepository.login(email, password);
      if (user != null) {
        state = state.copyWith(
          currentUser: user,
          isAuthenticated: true,
          isLoading: false,
        );
        return true;
      }
      
      state = state.copyWith(
        isLoading: false,
        error: 'Invalid email or password',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractErrorMessage(e),
      );
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    
    try {
      final user = await _authRepository.register(name, email, password);
      if (user != null) {
        state = state.copyWith(
          currentUser: user,
          isAuthenticated: true,
          isLoading: false,
        );
        return true;
      }
      
      state = state.copyWith(
        isLoading: false,
        error: 'Registration failed',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractErrorMessage(e),
      );
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    
    try {
      await _authRepository.logout();
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      state = const AuthState();
    }
  }

  Future<bool> updateProfile({String? name, String? email}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    
    try {
      final user = await _authRepository.updateProfile(name: name, email: email);
      if (user != null) {
        state = state.copyWith(
          currentUser: user,
          isLoading: false,
        );
        return true;
      }
      
      state = state.copyWith(
        isLoading: false,
        error: 'Profile update failed',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractErrorMessage(e),
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  String _extractErrorMessage(dynamic error) {
    if (error.toString().contains('Invalid email or password')) {
      return 'Invalid email or password';
    } else if (error.toString().contains('Email already exists')) {
      return 'An account with this email already exists';
    } else if (error.toString().contains('Network')) {
      return 'Network error. Please check your connection.';
    }
    return 'An error occurred. Please try again.';
  }
}

// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepository = ref.read(authRepositoryProvider);
  return AuthNotifier(authRepository);
});