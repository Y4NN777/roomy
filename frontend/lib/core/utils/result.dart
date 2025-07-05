/// Result class for handling success and failure cases
sealed class Result<T> {
  const Result();

  /// Check if the result is a success
  bool get isSuccess => this is Success<T>;
  
  /// Check if the result is a failure
  bool get isFailure => this is Failure<T>;
  
  /// Get the success value if available
  T? get successValue => isSuccess ? (this as Success<T>).value : null;
  
  /// Get the failure if available
  dynamic get failureValue => isFailure ? (this as Failure<T>).failure : null;
  
  /// Map the success value to a new type
  Result<R> map<R>(R Function(T value) mapper) {
    return when(
      success: (value) => Success(mapper(value)),
      failure: (failure) => Failure(failure),
    );
  }
  
  /// Flat map the success value to a new Result
  Result<R> flatMap<R>(Result<R> Function(T value) mapper) {
    return when(
      success: (value) => mapper(value),
      failure: (failure) => Failure(failure),
    );
  }
  
  /// Handle both success and failure cases
  R when<R>({
    required R Function(T value) success,
    required R Function(dynamic failure) failure,
  }) {
    if (this is Success<T>) {
      return success((this as Success<T>).value);
    } else if (this is Failure<T>) {
      return failure((this as Failure<T>).failure);
    }
    throw Exception('Unknown Result type');
  }
  
  /// Handle only success case
  void whenSuccess(void Function(T value) handler) {
    if (isSuccess && successValue != null) {
      handler(successValue!);
    }
  }
  
  /// Handle only failure case
  void whenFailure(void Function(dynamic failure) handler) {
    if (isFailure) {
      handler(failureValue!);
    }
  }
}

/// Success result
class Success<T> extends Result<T> {
  final T value;
  
  const Success(this.value);
  
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Success<T> &&
          runtimeType == other.runtimeType &&
          value == other.value;

  @override
  int get hashCode => value.hashCode;
  
  @override
  String toString() => 'Success($value)';
}

/// Failure result
class Failure<T> extends Result<T> {
  final dynamic failure;
  
  const Failure(this.failure);
  
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Failure<T> &&
          runtimeType == other.runtimeType &&
          failure == other.failure;

  @override
  int get hashCode => failure.hashCode;
  
  @override
  String toString() => 'Failure($failure)';
} 