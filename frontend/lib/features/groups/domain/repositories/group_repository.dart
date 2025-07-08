import '../../../../domain/entities/group.dart';

abstract class GroupRepository {
  Future<List<Group>> getUserGroups();
  Future<Group> createGroup({required String name, String? description});
  Future<bool> deleteGroup(String groupId);
  Future<Group> updateGroup(Group group);
  Future<bool> joinGroup(String inviteCode);
  Future<bool> leaveGroup(String groupId);
}