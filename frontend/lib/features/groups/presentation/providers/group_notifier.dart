import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../domain/entities/group.dart';
import '../../domain/repositories/group_repository.dart';

class GroupState {
  final List<Group> groups;
  final Group? currentGroup;
  final bool isLoading;
  final String? error;
  final bool isCreating;

  const GroupState({
    this.groups = const [],
    this.currentGroup,
    this.isLoading = false,
    this.error,
    this.isCreating = false,
  });

  GroupState copyWith({
    List<Group>? groups,
    Group? currentGroup,
    bool? isLoading,
    String? error,
    bool? isCreating,
    bool clearError = false,
    bool clearCurrentGroup = false,
  }) {
    return GroupState(
      groups: groups ?? this.groups,
      currentGroup: clearCurrentGroup ? null : (currentGroup ?? this.currentGroup),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      isCreating: isCreating ?? this.isCreating,
    );
  }
}

class GroupNotifier extends StateNotifier<GroupState> {
  final GroupRepository _repository;

  GroupNotifier(this._repository) : super(const GroupState());

  Future<void> loadGroups() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final groups = await _repository.getUserGroups();
      state = state.copyWith(
        groups: groups,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      rethrow;
    }
  }

  Future<Group> createGroup({required String name, String? description}) async {
    state = state.copyWith(isCreating: true, error: null);
    try {
      final newGroup = await _repository.createGroup(
        name: name,
        description: description,
      );
      state = state.copyWith(
        groups: [...state.groups, newGroup],
        isCreating: false,
      );
      return newGroup;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isCreating: false,
      );
      rethrow;
    }
  }

  Future<void> joinGroup(String inviteCode) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final success = await _repository.joinGroup(inviteCode);
      if (success) {
        await loadGroups(); // Refresh groups after joining
      }
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      rethrow;
    }
  }

  Future<void> leaveGroup(String groupId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final success = await _repository.leaveGroup(groupId);
      if (success) {
        state = state.copyWith(
          groups: state.groups.where((g) => g.id != groupId).toList(),
          isLoading: false,
        );
      }
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
      rethrow;
    }
  }

  void setCurrentGroup(Group group) {
    state = state.copyWith(currentGroup: group);
  }

  void clearError() {
    if (state.error != null) {
      state = state.copyWith(error: null, clearError: true);
    }
  }
}
