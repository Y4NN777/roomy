import 'package:dio/dio.dart';
// import 'package:shared_preferences/shared_preferences.dart';
import '../../config/env/app_config.dart';
// import '../../core/constants/app_constants.dart';
import '../../core/errors/app_exceptions.dart';
import '../../core/storage/secure_storage.dart';

class ApiClient {
  late final Dio _dio;
  static const String _refreshTokenEndpoint = '/auth/refresh';

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: AppConfig.apiTimeout,
      receiveTimeout: AppConfig.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _setupInterceptors();
  }

  void _setupInterceptors() {
    // Request interceptor for adding auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureStorage.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          if (AppConfig.enableLogging) {
            print('🚀 API Request: ${options.method} ${options.path}');
            print('📤 Headers: ${options.headers}');
            if (options.data != null) {
              print('📤 Body: ${options.data}');
            }
          }
          
          handler.next(options);
        },
        onResponse: (response, handler) {
          if (AppConfig.enableLogging) {
            print('✅ API Response: ${response.statusCode} ${response.requestOptions.path}');
            print('📥 Data: ${response.data}');
          }
          handler.next(response);
        },
        onError: (error, handler) async {
          if (AppConfig.enableLogging) {
            print('❌ API Error: ${error.response?.statusCode} ${error.requestOptions.path}');
            print('📥 Error: ${error.response?.data}');
          }

          // Handle token refresh for 401 errors
          if (error.response?.statusCode == 401 && 
              !error.requestOptions.path.contains(_refreshTokenEndpoint)) {
            
            final refreshed = await _refreshToken();
            if (refreshed) {
              // Retry original request
              final options = error.requestOptions;
              final token = await SecureStorage.getAccessToken();
              options.headers['Authorization'] = 'Bearer $token';
              
              try {
                final response = await _dio.fetch(options);
                handler.resolve(response);
                return;
              } catch (e) {
                // If retry fails, continue with original error
              }
            }
          }

          final exception = _handleError(error);
          handler.reject(DioException(
            requestOptions: error.requestOptions,
            error: exception,
          ));
        },
      ),
    );
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await SecureStorage.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await _dio.post(
        _refreshTokenEndpoint,
        options: Options(headers: {'Authorization': 'Bearer $refreshToken'}),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await SecureStorage.storeTokens(
          accessToken: data['token'],
          refreshToken: data['refreshToken'],
        );
        return true;
      }
    } catch (e) {
      if (AppConfig.enableLogging) {
        print('❌ Token refresh failed: $e');
      }
      // Clear invalid tokens
      await SecureStorage.clearAll();
    }
    return false;
  }

  AppException _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkException(
          'Connection timeout. Please check your internet connection.',
          originalError: error,
        );
      
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final data = error.response?.data;
        String message = 'An error occurred';
        
        if (data is Map<String, dynamic>) {
          message = data['message'] ?? data['error'] ?? message;
        }
        
        if (statusCode == 401) {
          return AuthException(
            'Your session has expired. Please login again.',
            originalError: error,
          );
        } else if (statusCode! >= 500) {
          return ServerException(
            'Server error. Please try again later.',
            statusCode: statusCode,
            originalError: error,
          );
        } else if (statusCode >= 400) {
          return ValidationException(
            message,
            originalError: error,
          );
        }
        
        return ServerException(
          message,
          statusCode: statusCode,
          originalError: error,
        );
      
      case DioExceptionType.cancel:
        return NetworkException('Request was cancelled', originalError: error);
      
      default:
        return NetworkException(
          'Network error. Please check your connection.',
          originalError: error,
        );
    }
  }

  // HTTP Methods
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return await _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) async {
    return await _dio.put(path, data: data);
  }

  Future<Response> patch(String path, {dynamic data}) async {
    return await _dio.patch(path, data: data);
  }

  Future<Response> delete(String path) async {
    return await _dio.delete(path);
  }
}