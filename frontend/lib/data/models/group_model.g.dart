// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'group_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

GroupModel _$GroupModelFromJson(Map<String, dynamic> json) => GroupModel(
      id: json['_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      code: json['code'] as String,
      owner: UserModel.fromJson(json['owner'] as Map<String, dynamic>),
      members: (json['members'] as List<dynamic>)
          .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      isActive: json['is_active'] as bool,
    );

Map<String, dynamic> _$GroupModelToJson(GroupModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'code': instance.code,
      'owner': instance.owner,
      'members': instance.members,
      'created_at': instance.createdAt.toIso8601String(),
      'updated_at': instance.updatedAt.toIso8601String(),
      'is_active': instance.isActive,
    };
