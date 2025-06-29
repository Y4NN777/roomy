# System Architecture

## Mobile Application Stack
- **Presentation Layer**: Flutter 3.16+ with Material Design 3
- **State Management**: Riverpod with BLoC pattern implementation
- **Data Persistence**: Hive for local storage, Flutter Secure Storage for credentials
- **Communication**: Dio HTTP client with WebSocket support
- **Platform Integration**: Speech-to-text, camera access, secure storage APIs

## Backend Services Architecture
- **API Layer**: Express.js with TypeScript, versioned REST endpoints
- **Business Logic**: Service-oriented architecture with dependency injection
- **Data Access**: Mongoose ODM with MongoDB, optimized queries and indexing
- **Authentication**: JWT-based security with refresh token rotation
- **External Integration**: Google Gemini 2.0 Flash, SMTP email services
- **Real-time Engine**: Socket.io for bidirectional communication

## Infrastructure Components
- **Database**: MongoDB 6.0+ with replica set configuration
- **Caching**: Redis for session management and API response caching
- **Email Service**: Nodemailer with configurable SMTP providers
- **AI Processing**: Google Gemini 2.0 Flash API with rate limiting
- **Monitoring**: Comprehensive logging and error tracking systems
