import 'app_exceptions.dart';

/// Base failure class for the domain layer
abstract class Failure {
  final String message;
  final String? code;

  const Failure(this.message, {this.code});

  @override
  String toString() => 'Failure: $message';
}

/// Network failure
class NetworkFailure extends Failure {
  const NetworkFailure(super.message, {super.code});
}

/// Server failure
class ServerFailure extends Failure {
  final int? statusCode;
  
  const ServerFailure(super.message, {this.statusCode, super.code});
}

/// Authentication failure
class AuthFailure extends Failure {
  const AuthFailure(super.message, {super.code});
}

/// Validation failure
class ValidationFailure extends Failure {
  final Map<String, String>? fieldErrors;
  
  const ValidationFailure(super.message, {this.fieldErrors, super.code});
}

/// Cache failure
class CacheFailure extends Failure {
  const CacheFailure(super.message, {super.code});
}

/// Unknown failure
class UnknownFailure extends Failure {
  const UnknownFailure(super.message, {super.code});
}

/// Extension to convert exceptions to failures
extension ExceptionToFailure on AppException {
  Failure toFailure() {
    switch (runtimeType) {
      case NetworkException _:
        return NetworkFailure(message, code: code);
      case ServerException _:
        return ServerFailure(message, statusCode: (this as ServerException).statusCode, code: code);
      case AuthException _:
        return AuthFailure(message, code: code);
      case ValidationException _:
        return ValidationFailure(message, fieldErrors: (this as ValidationException).fieldErrors, code: code);
      case CacheException _:
        return CacheFailure(message, code: code);
      default:
        return UnknownFailure(message, code: code);
    }
  }
} 