import 'package:dio/dio.dart';

/// Base exception class for the application
abstract class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  const AppException(this.message, {this.code, this.originalError});

  @override
  String toString() => 'AppException: $message';
}

/// Network related exceptions
class NetworkException extends AppException {
  const NetworkException(super.message, {super.code, super.originalError});
}

/// Server related exceptions
class ServerException extends AppException {
  final int? statusCode;
  
  const ServerException(super.message, {this.statusCode, super.code, super.originalError});
  factory ServerException.fromDioError(dynamic error) {
    if (error is DioException) {
      return ServerException(
        error.message ?? 'Server error',
        statusCode: error.response?.statusCode,
        originalError: error,
      );
    }
    return ServerException('Unknown server error', originalError: error);
  }
}

/// Authentication related exceptions
class AuthException extends AppException {
  const AuthException(super.message, {super.code, super.originalError});
}

/// Validation related exceptions
class ValidationException extends AppException {
  final Map<String, String>? fieldErrors;
  
  const ValidationException(super.message, {this.fieldErrors, super.code, super.originalError});
}

/// Cache related exceptions
class CacheException extends AppException {
  const CacheException(super.message, {super.code, super.originalError});
}

/// Unknown exceptions
class UnknownException extends AppException {
  const UnknownException(super.message, {super.code, super.originalError});
} 