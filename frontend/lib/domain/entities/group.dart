import 'user.dart';

/// Group entity representing a group in the domain layer
class Group {
  final String id;
  final String name;
  final String? description;
  final String code;
  final User owner;
  final List<User> members;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isActive;

  const Group({
    required this.id,
    required this.name,
    this.description,
    required this.code,
    required this.owner,
    required this.members,
    required this.createdAt,
    required this.updatedAt,
    required this.isActive,
  });

  /// Get the total number of members including the owner
  int get totalMembers => members.length + 1;

  /// Check if a user is a member of this group
  bool isMember(String userId) {
    return owner.id == userId || members.any((member) => member.id == userId);
  }

  /// Check if a user is the owner of this group
  bool isOwner(String userId) {
    return owner.id == userId;
  }

  /// Create a copy of this group with updated fields
  Group copyWith({
    String? id,
    String? name,
    String? description,
    String? code,
    User? owner,
    List<User>? members,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
  }) {
    return Group(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      code: code ?? this.code,
      owner: owner ?? this.owner,
      members: members ?? this.members,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Group &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          description == other.description &&
          code == other.code &&
          owner == other.owner &&
          members == other.members &&
          createdAt == other.createdAt &&
          updatedAt == other.updatedAt &&
          isActive == other.isActive;

  @override
  int get hashCode =>
      id.hashCode ^
      name.hashCode ^
      description.hashCode ^
      code.hashCode ^
      owner.hashCode ^
      members.hashCode ^
      createdAt.hashCode ^
      updatedAt.hashCode ^
      isActive.hashCode;

  @override
  String toString() {
    return 'Group(id: $id, name: $name, code: $code, members: $totalMembers)';
  }
} 