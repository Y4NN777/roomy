import '../datasources/api_client.dart';
import '../models/group_model.dart';
import '../../core/constants/api_routes.dart';

/// API response wrapper for consistent error handling
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final String? code;

  const ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.code,
  });

  factory ApiResponse.success(T data) {
    return ApiResponse(success: true, data: data);
  }

  factory ApiResponse.error(String message, {String? code}) {
    return ApiResponse(success: false, message: message, code: code);
  }
}

/// Group API service for handling group-related API calls
class GroupApiService {
  final ApiClient _apiClient;

  GroupApiService({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Get all groups for the current user
  Future<ApiResponse<List<GroupModel>>> getUserGroups() async {
    try {
      final response = await _apiClient.get(ApiRoutes.groups);
      
      if (response.statusCode == 200) {
        final List<dynamic> groupsData = response.data['data'] ?? response.data;
        final groups = groupsData
            .map((json) => GroupModel.fromJson(json))
            .toList();
        
        return ApiResponse.success(groups);
      } else {
        return ApiResponse.error('Failed to load groups');
      }
    } catch (e) {
      return ApiResponse.error('Error loading groups: $e');
    }
  }

  /// Create a new group
  Future<ApiResponse<GroupModel>> createGroup({
    required String name,
    String? description,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiRoutes.createGroup,
        data: {
          'name': name,
          if (description != null) 'description': description,
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final groupData = response.data['data'] ?? response.data;
        final group = GroupModel.fromJson(groupData);
        return ApiResponse.success(group);
      } else {
        return ApiResponse.error('Failed to create group');
      }
    } catch (e) {
      return ApiResponse.error('Error creating group: $e');
    }
  }

  /// Join an existing group using group code
  Future<ApiResponse<GroupModel>> joinGroup({
    required String groupCode,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiRoutes.joinGroup,
        data: {
          'groupCode': groupCode,
        },
      );

      if (response.statusCode == 200) {
        final groupData = response.data['data'] ?? response.data;
        final group = GroupModel.fromJson(groupData);
        return ApiResponse.success(group);
      } else {
        return ApiResponse.error('Failed to join group');
      }
    } catch (e) {
      return ApiResponse.error('Error joining group: $e');
    }
  }

  /// Leave a group
  Future<ApiResponse<bool>> leaveGroup({
    required String groupId,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiRoutes.leaveGroup,
        data: {
          'groupId': groupId,
        },
      );

      if (response.statusCode == 200) {
        return ApiResponse.success(true);
      } else {
        return ApiResponse.error('Failed to leave group');
      }
    } catch (e) {
      return ApiResponse.error('Error leaving group: $e');
    }
  }

  /// Get group members
  Future<ApiResponse<List<dynamic>>> getGroupMembers({
    required String groupId,
  }) async {
    try {
      final route = ApiRoutes.replaceParams(
        ApiRoutes.groupMembers,
        {'groupId': groupId},
      );
      
      final response = await _apiClient.get(route);

      if (response.statusCode == 200) {
        final membersData = response.data['data'] ?? response.data;
        return ApiResponse.success(membersData);
      } else {
        return ApiResponse.error('Failed to load group members');
      }
    } catch (e) {
      return ApiResponse.error('Error loading group members: $e');
    }
  }

  /// Invite user to group
  Future<ApiResponse<bool>> inviteToGroup({
    required String groupId,
    required String email,
  }) async {
    try {
      final route = ApiRoutes.replaceParams(
        ApiRoutes.groupInvite,
        {'groupId': groupId},
      );
      
      final response = await _apiClient.post(
        route,
        data: {
          'email': email,
        },
      );

      if (response.statusCode == 200) {
        return ApiResponse.success(true);
      } else {
        return ApiResponse.error('Failed to invite user to group');
      }
    } catch (e) {
      return ApiResponse.error('Error inviting user to group: $e');
    }
  }

  /// Get group details by ID
  Future<ApiResponse<GroupModel>> getGroupById({
    required String groupId,
  }) async {
    try {
      final response = await _apiClient.get('${ApiRoutes.groups}/$groupId');

      if (response.statusCode == 200) {
        final groupData = response.data['data'] ?? response.data;
        final group = GroupModel.fromJson(groupData);
        return ApiResponse.success(group);
      } else {
        return ApiResponse.error('Failed to load group details');
      }
    } catch (e) {
      return ApiResponse.error('Error loading group details: $e');
    }
  }

  /// Update group details
  Future<ApiResponse<GroupModel>> updateGroup({
    required String groupId,
    String? name,
    String? description,
  }) async {
    try {
      final response = await _apiClient.put(
        '${ApiRoutes.groups}/$groupId',
        data: {
          if (name != null) 'name': name,
          if (description != null) 'description': description,
        },
      );

      if (response.statusCode == 200) {
        final groupData = response.data['data'] ?? response.data;
        final group = GroupModel.fromJson(groupData);
        return ApiResponse.success(group);
      } else {
        return ApiResponse.error('Failed to update group');
      }
    } catch (e) {
      return ApiResponse.error('Error updating group: $e');
    }
  }

  /// Delete group (only for group owner)
  Future<ApiResponse<bool>> deleteGroup({
    required String groupId,
  }) async {
    try {
      final response = await _apiClient.delete('${ApiRoutes.groups}/$groupId');

      if (response.statusCode == 200) {
        return ApiResponse.success(true);
      } else {
        return ApiResponse.error('Failed to delete group');
      }
    } catch (e) {
      return ApiResponse.error('Error deleting group: $e');
    }
  }
} 