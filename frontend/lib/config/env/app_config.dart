enum Environment { development, staging, production }

class AppConfig {
  static Environment _environment = Environment.development;
  
  static Environment get environment => _environment;
  
  static void setEnvironment(Environment env) {
    _environment = env;
  }
  
  // API Configuration
  static String get baseUrl {
    switch (_environment) {
      case Environment.development:
        return 'http://localhost:3000/api/v1';
      case Environment.staging:
        return 'https://staging-api.roomy.app/api/v1';
      case Environment.production:
        return 'https://api.roomy.app/api/v1';
    }
  }
  
  // WebSocket Configuration
  static String get wsUrl {
    switch (_environment) {
      case Environment.development:
        return 'ws://localhost:3000';
      case Environment.staging:
        return 'wss://staging-api.roomy.app';
      case Environment.production:
        return 'wss://api.roomy.app';
    }
  }
  
  // Feature Flags
  static bool get enableAI {
    switch (_environment) {
      case Environment.development:
        return true;
      case Environment.staging:
        return true;
      case Environment.production:
        return false; // Enable when ready
    }
  }
  
  static bool get enablePushNotifications {
    return _environment == Environment.production;
  }
  
  // Debug Configuration
  static bool get isDebug => _environment == Environment.development;
  static bool get enableLogging => _environment != Environment.production;
  
  // Timeouts
  static Duration get apiTimeout {
    switch (_environment) {
      case Environment.development:
        return const Duration(seconds: 30);
      case Environment.staging:
        return const Duration(seconds: 15);
      case Environment.production:
        return const Duration(seconds: 10);
    }
  }
}