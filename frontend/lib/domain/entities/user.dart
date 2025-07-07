/// User entity representing a user in the domain layer
class User {
  final String id;
  final String name;
  final String email;
  final String? profilePicture;
  final String? groupId; // Add this field
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isActive;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.profilePicture,
    this.groupId, // Add this parameter
    required this.createdAt,
    required this.updatedAt,
    required this.isActive,
  });

  /// Create a copy of this user with updated fields
  User copyWith({
    String? id,
    String? name,
    String? email,
    String? profilePicture,
    String? groupId, // Add this parameter
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      profilePicture: profilePicture ?? this.profilePicture,
      groupId: groupId ?? this.groupId, // Add this line
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          email == other.email &&
          profilePicture == other.profilePicture &&
          groupId == other.groupId && // Add this line
          createdAt == other.createdAt &&
          updatedAt == other.updatedAt &&
          isActive == other.isActive;

  @override
  int get hashCode =>
      id.hashCode ^
      name.hashCode ^
      email.hashCode ^
      profilePicture.hashCode ^
      groupId.hashCode ^ // Add this line
      createdAt.hashCode ^
      updatedAt.hashCode ^
      isActive.hashCode;

  @override
  String toString() {
    return 'User(id: $id, name: $name, email: $email, groupId: $groupId, isActive: $isActive)';
  }
}