import 'package:flutter/foundation.dart';
import '../../domain/entities/group.dart';
import '../../data/services/group_api_service.dart';

/// Group provider for managing group state
class GroupProvider extends ChangeNotifier {
  final GroupApiService _groupApiService;
  
  List<Group> _groups = [];
  Group? _currentGroup;
  bool _isLoading = false;
  String? _error;

  GroupProvider({required GroupApiService groupApiService}) 
      : _groupApiService = groupApiService;

  // Getters
  List<Group> get groups => _groups;
  Group? get currentGroup => _currentGroup;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Load user groups
  Future<void> loadGroups() async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await _groupApiService.getUserGroups();
      if (response.success && response.data != null) {
        _groups = response.data!.map((groupModel) => groupModel.toEntity()).toList();
        notifyListeners();
      } else {
        _setError(response.message ?? 'Failed to load groups');
      }
    } catch (e) {
      _setError('Error loading groups: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Create a new group
  Future<bool> createGroup({required String name, String? description}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await _groupApiService.createGroup(
        name: name,
        description: description,
      );
      
      if (response.success && response.data != null) {
        _groups.add(response.data!.toEntity());
        notifyListeners();
        return true;
      } else {
        _setError(response.message ?? 'Failed to create group');
      }
    } catch (e) {
      _setError('Error creating group: $e');
    } finally {
      _setLoading(false);
    }
    
    return false;
  }

  /// Join a group
  Future<bool> joinGroup({required String groupCode}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await _groupApiService.joinGroup(groupCode: groupCode);
      
      if (response.success && response.data != null) {
        _groups.add(response.data!.toEntity());
        notifyListeners();
        return true;
      } else {
        _setError(response.message ?? 'Failed to join group');
      }
    } catch (e) {
      _setError('Error joining group: $e');
    } finally {
      _setLoading(false);
    }
    
    return false;
  }

  /// Set current group
  void setCurrentGroup(Group group) {
    _currentGroup = group;
    notifyListeners();
  }

  /// Clear current group
  void clearCurrentGroup() {
    _currentGroup = null;
    notifyListeners();
  }

  /// Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Set error message
  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  /// Clear error message
  void _clearError() {
    _error = null;
    notifyListeners();
  }

  /// Clear error manually
  void clearError() {
    _clearError();
  }
} 