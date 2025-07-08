import 'user.dart';

/// Task priority enumeration
enum TaskPriority { low, medium, high }

/// Task status enumeration
enum TaskStatus { pending, inProgress, completed, cancelled }

/// Task entity representing a task in the domain layer
class Task {
  final String id;
  final String title;
  final String? description;
  final TaskPriority priority;
  final TaskStatus status;
  final User assignedTo;
  final User createdBy;
  final DateTime dueDate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? groupId;
  final List<String> tags;

  const Task({
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

  /// Check if the task is overdue
  bool get isOverdue => DateTime.now().isAfter(dueDate) && status != TaskStatus.completed;

  /// Check if the task is due today
  bool get isDueToday {
    final now = DateTime.now();
    return dueDate.year == now.year &&
           dueDate.month == now.month &&
           dueDate.day == now.day;
  }

  /// Check if the task is due soon (within 3 days)
  bool get isDueSoon {
    final now = DateTime.now();
    final threeDaysFromNow = now.add(const Duration(days: 3));
    return dueDate.isBefore(threeDaysFromNow) && 
           dueDate.isAfter(now) && 
           status != TaskStatus.completed;
  }

  /// Get priority color for UI
  int get priorityColor {
    switch (priority) {
      case TaskPriority.high:
        return 0xFFF44336; // Red
      case TaskPriority.medium:
        return 0xFFFF9800; // Orange
      case TaskPriority.low:
        return 0xFF4CAF50; // Green
    }
  }

  /// Create a copy of this task with updated fields
  Task copyWith({
    String? id,
    String? title,
    String? description,
    TaskPriority? priority,
    TaskStatus? status,
    User? assignedTo,
    User? createdBy,
    DateTime? dueDate,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? groupId,
    List<String>? tags,
  }) {
    return Task(
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
      other is Task &&
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
    return 'Task(id: $id, title: $title, priority: $priority, status: $status)';
  }
} 