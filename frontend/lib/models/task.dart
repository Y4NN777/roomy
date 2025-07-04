enum Priority { high, medium, low }

class Task {
  String title;
  String description;
  Priority priority;
  String assignedTo;
  DateTime dueDate;
  bool completed;

  Task({
    required this.title,
    required this.description,
    required this.priority,
    required this.assignedTo,
    required this.dueDate,
    required this.completed,
  });
}
