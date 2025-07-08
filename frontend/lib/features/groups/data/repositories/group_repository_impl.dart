import 'package:dio/dio.dart';
import '../../../../domain/entities/group.dart';
import '../../domain/repositories/group_repository.dart';
import '../../../../data/services/group_api_service.dart';
import '../../../../core/errors/app_exceptions.dart';

class GroupRepositoryImpl implements GroupRepository {
  final GroupApiService _apiService;

  GroupRepositoryImpl(this._apiService);

  @override
  Future<List<Group>> getUserGroups() async {
    try {
      final response = await _apiService.getUserGroups();
      if (response.success && response.data != null) {
        return response.data!.map((model) => model.toEntity()).toList();
      }
      throw ServerException(response.message ?? 'Failed to load groups');
    } on DioException catch (e) {
      throw ServerException.fromDioError(e);
    }
  }

  @override
  Future<Group> createGroup({required String name, String? description}) async {
    try {
      final response = await _apiService.createGroup(
        name: name,
        description: description,
      );
      if (response.success && response.data != null) {
        return response.data!.toEntity();
      }
      throw ServerException(response.message ?? 'Failed to create group');
    } on DioException catch (e) {
      throw ServerException.fromDioError(e);
    }
  }

  @override
  Future<bool> deleteGroup(String groupId) async {
    try {
      final response = await _apiService.deleteGroup(groupId: groupId);
      if (response.success) {
        return true;
      }
      throw ServerException( response.message ?? 'Failed to delete group');
    } on DioException catch (e) {
      throw ServerException.fromDioError(e);
    }
  }

  @override
  Future<Group> updateGroup(Group group) async {
    try {
      final response = await _apiService.updateGroup(
        groupId: group.id,
        name: group.name,
        description: group.description,
      );
      if (response.success && response.data != null) {
        return response.data!.toEntity();
      }
      throw ServerException(response.message ?? 'Failed to update group');
    } on DioException catch (e) {
      throw ServerException.fromDioError(e);
    }
  }

  @override
  Future<bool> joinGroup(String inviteCode) async {
    try {
      final response = await _apiService.joinGroup(groupCode: inviteCode);
      if (response.success) {
        return true;
      }
      throw ServerException(response.message ?? 'Failed to join group');
    } on DioException catch (e) {
      throw ServerException.fromDioError(e);
    }
  }

  @override
  Future<bool> leaveGroup(String groupId) async {
    try {
      final response = await _apiService.leaveGroup(groupId: groupId);
      if (response.success) {
        return true;
      }
      throw ServerException(response.message ?? 'Failed to leave group');
    } on DioException catch (e) {
      throw ServerException.fromDioError(e);
    }
  }
}
