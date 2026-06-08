import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/user.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String email;
  @JsonKey(name: 'profile_picture')
  final String? profilePicture;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  @JsonKey(name: 'is_active')
  final bool isActive;
  @JsonKey(name: 'group_id')
  final String? groupId;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.profilePicture,
    required this.createdAt,
    required this.updatedAt,
    required this.isActive,
    this.groupId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  // Convert to domain User entity
  User toDomainEntity() {
    return User(
      id: id,
      name: name,
      email: email,
      profilePicture: profilePicture,
      groupId: groupId,
      createdAt: createdAt,
      updatedAt: updatedAt,
      isActive: isActive,
    );
  }

   /// Create UserModel from User entity
  factory UserModel.fromEntity(User user) {
    return UserModel(
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: user.isActive,
      groupId: user.groupId ?? '', // Ensure groupId is not null
    );
  }

  // Keep old method name for backward compatibility
  User toEntity() => toDomainEntity();

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? profilePicture,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
    String? groupId,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      profilePicture: profilePicture ?? this.profilePicture,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
      groupId: groupId ?? this.groupId,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserModel && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'UserModel(id: $id, name: $name, email: $email)';
}


