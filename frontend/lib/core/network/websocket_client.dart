import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:async';
import '../constants/app_constants.dart';

class WebSocketClient {
  static WebSocketClient? _instance;
  static WebSocketClient get instance => _instance ??= WebSocketClient._();
  
  WebSocketClient._();

  IO.Socket? _socket;
  final StreamController<Map<String, dynamic>> _messageController = 
      StreamController.broadcast();

  Stream<Map<String, dynamic>> get messages => _messageController.stream;
  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect(String token) async {
    if (_socket?.connected == true) return;

    try {
      _socket = IO.io(
        AppConstants.baseUrl.replaceFirst('http', 'ws'),
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setExtraHeaders({'Authorization': 'Bearer $token'})
            .build(),
      );

      _socket!.onConnect((_) {
        print('WebSocket connected');
      });

      _socket!.onDisconnect((_) {
        print('WebSocket disconnected');
      });

      _socket!.on('notification:new', (data) {
        _messageController.add({'type': 'notification', 'data': data});
      });

      _socket!.on('task:created', (data) {
        _messageController.add({'type': 'task_created', 'data': data});
      });

      _socket!.on('expense:added', (data) {
        _messageController.add({'type': 'expense_added', 'data': data});
      });

      _socket!.connect();
    } catch (e) {
      print('WebSocket connection error: $e');
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void markNotificationRead(String notificationId) {
    _socket?.emit('notification:read', {'notificationId': notificationId});
  }
}