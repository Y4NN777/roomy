import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/task.dart';
import 'user_model.dart';

part 'task_model.g.dart';

/// Task model for data layer with JSON serialization
@JsonSerializable()
class TaskModel {
  @JsonKey(name: '_id')
  final String id;
  final String title;
  final String? description;
  @JsonKey(name: 'priority')
  final String priority;
  @JsonKey(name: 'status')
  final String status;
  @JsonKey(name: 'assigned_to')
  final UserModel assignedTo;
  @JsonKey(name: 'created_by')
  final UserModel createdBy;
  @JsonKey(name: 'due_date')
  final DateTime dueDate;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  @JsonKey(name: 'group_id')
  final String? groupId;
  final List<String> tags;

  const TaskModel({
    required this.id,
    required this.title,
    this.description,
    required this.priority,
    required this.status,
    required this.assignedTo,
    required this.createdBy,
    required this.dueDate,
    required this.createdAt,
    required this.updatedAt,
    this.groupId,
    this.tags = const [],
  });

  /// Create TaskModel from JSON
  factory TaskModel.fromJson(Map<String, dynamic> json) => _$TaskModelFromJson(json);

  /// Convert TaskModel to JSON
  Map<String, dynamic> toJson() => _$TaskModelToJson(this);

  /// Convert priority string to enum
  TaskPriority _priorityFromString(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return TaskPriority.high;
      case 'medium':
        return TaskPriority.medium;
      case 'low':
        return TaskPriority.low;
      default:
        return TaskPriority.medium;
    }
  }

  /// Convert status string to enum
  TaskStatus _statusFromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return TaskStatus.pending;
      case 'in_progress':
      case 'inprogress':
        return TaskStatus.inProgress;
      case 'completed':
        return TaskStatus.completed;
      case 'cancelled':
        return TaskStatus.cancelled;
      default:
        return TaskStatus.pending;
    }
  }

  /// Convert priority enum to string
  static String _priorityToString(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.high:
        return 'high';
      case TaskPriority.medium:
        return 'medium';
      case TaskPriority.low:
        return 'low';
    }
  }

  /// Convert status enum to string
  static String _statusToString(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending:
        return 'pending';
      case TaskStatus.inProgress:
        return 'in_progress';
      case TaskStatus.completed:
        return 'completed';
      case TaskStatus.cancelled:
        return 'cancelled';
    }
  }

  /// Convert TaskModel to Task entity
  Task toEntity() {
    return Task(
      id: id,
      title: title,
      description: description,
      priority: _priorityFromString(priority),
      status: _statusFromString(status),
      assignedTo: assignedTo.toEntity(),
      createdBy: createdBy.toEntity(),
      dueDate: dueDate,
      createdAt: createdAt,
      updatedAt: updatedAt,
      groupId: groupId,
      tags: tags,
    );
  }

  /// Create TaskModel from Task entity
  factory TaskModel.fromEntity(Task task) {
    return TaskModel(
      id: task.id,
      title: task.title,
      description: task.description,
      priority: _priorityToString(task.priority),
      status: _statusToString(task.status),
      assignedTo: UserModel.fromEntity(task.assignedTo),
      createdBy: UserModel.fromEntity(task.createdBy),
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      groupId: task.groupId,
      tags: task.tags,
    );
  }

  /// Create a copy of this TaskModel with updated fields
  TaskModel copyWith({
    String? id,
    String? title,
    String? description,
    String? priority,
    String? status,
    UserModel? assignedTo,
    UserModel? createdBy,
    DateTime? dueDate,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? groupId,
    List<String>? tags,
  }) {
    return TaskModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      assignedTo: assignedTo ?? this.assignedTo,
      createdBy: createdBy ?? this.createdBy,
      dueDate: dueDate ?? this.dueDate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      groupId: groupId ?? this.groupId,
      tags: tags ?? this.tags,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TaskModel &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          title == other.title &&
          description == other.description &&
          priority == other.priority &&
          status == other.status &&
          assignedTo == other.assignedTo &&
          createdBy == other.createdBy &&
          dueDate == other.dueDate &&
          createdAt == other.createdAt &&
          updatedAt == other.updatedAt &&
          groupId == other.groupId &&
          tags == other.tags;

  @override
  int get hashCode =>
      id.hashCode ^
      title.hashCode ^
      description.hashCode ^
      priority.hashCode ^
      status.hashCode ^
      assignedTo.hashCode ^
      createdBy.hashCode ^
      dueDate.hashCode ^
      createdAt.hashCode ^
      updatedAt.hashCode ^
      groupId.hashCode ^
      tags.hashCode;

  @override
  String toString() {
    return 'TaskModel(id: $id, title: $title, priority: $priority, status: $status)';
  }
} 