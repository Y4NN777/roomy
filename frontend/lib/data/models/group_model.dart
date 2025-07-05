import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/group.dart';
import 'user_model.dart';

part 'group_model.g.dart';

/// Group model for data layer with JSON serialization
@JsonSerializable()
class GroupModel {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String? description;
  final String code;
  @JsonKey(name: 'owner')
  final UserModel owner;
  @JsonKey(name: 'members')
  final List<UserModel> members;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  @JsonKey(name: 'is_active')
  final bool isActive;

  const GroupModel({
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

  /// Create GroupModel from JSON
  factory GroupModel.fromJson(Map<String, dynamic> json) => _$GroupModelFromJson(json);

  /// Convert GroupModel to JSON
  Map<String, dynamic> toJson() => _$GroupModelToJson(this);

  /// Convert GroupModel to Group entity
  Group toEntity() {
    return Group(
      id: id,
      name: name,
      description: description,
      code: code,
      owner: owner.toEntity(),
      members: members.map((member) => member.toEntity()).toList(),
      createdAt: createdAt,
      updatedAt: updatedAt,
      isActive: isActive,
    );
  }

  /// Create GroupModel from Group entity
  factory GroupModel.fromEntity(Group group) {
    return GroupModel(
      id: group.id,
      name: group.name,
      description: group.description,
      code: group.code,
      owner: UserModel.fromEntity(group.owner),
      members: group.members.map((member) => UserModel.fromEntity(member)).toList(),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      isActive: group.isActive,
    );
  }

  /// Create a copy of this GroupModel with updated fields
  GroupModel copyWith({
    String? id,
    String? name,
    String? description,
    String? code,
    UserModel? owner,
    List<UserModel>? members,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
  }) {
    return GroupModel(
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
      other is GroupModel &&
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
    return 'GroupModel(id: $id, name: $name, code: $code, members: ${members.length})';
  }
} 