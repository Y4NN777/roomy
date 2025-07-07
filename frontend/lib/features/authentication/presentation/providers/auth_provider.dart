import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../domain/entities/user.dart'; // Use domain user only
import '../../../../core/storage/secure_storage.dart';
import '../../../../data/models/user_model.dart';

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
}

// Auth provider
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    
    try {
      final isAuthenticated = await SecureStorage.isAuthenticated();
      if (isAuthenticated) {
        final userModel = await SecureStorage.getUser();
        if (userModel != null) {
          state = state.copyWith(
            currentUser: userModel.toDomainEntity(), // Use domain entity method
            isAuthenticated: true,
            isLoading: false,
          );
          return;
        }
      }
      
      state = state.copyWith(
        isAuthenticated: false,
        isLoading: false,
        clearUser: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(
      isLoading: true, 
      clearError: true,
    );
    
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
        );
        
        await SecureStorage.storeUser(mockUser);
        await SecureStorage.storeTokens(
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        );
        
        state = state.copyWith(
          currentUser: mockUser.toDomainEntity(), // Use domain entity method
          isAuthenticated: true,
          isLoading: false,
        );
        
        return true;
      }
      
      state = state.copyWith(
        isLoading: false,
        error: 'Invalid credentials',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    state = state.copyWith(
      isLoading: true, 
      clearError: true,
    );
    
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
        );
        
        await SecureStorage.storeUser(mockUser);
        await SecureStorage.storeTokens(
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        );
        
        state = state.copyWith(
          currentUser: mockUser.toDomainEntity(), // Use domain entity method
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
        error: e.toString(),
      );
      return false;
    }
  }

  Future<void> logout() async {
    await SecureStorage.clearAll();
    state = const AuthState();
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});