# Implementing a Shared Calendar View in Flutter (with Dio) for Roomy Backend

## Overview
This guide explains how to build a shared calendar view in a Flutter mobile app using Dio for API calls, fully integrated with the Roomy backend. It covers backend data structure, API usage, Flutter setup, UI implementation, and real-time updates.

---

## 1. Backend Data & API Endpoints
- **Tasks** are the main schedulable entity, each with `dueDate`, `title`, `description`, `assignedTo`, `groupId`, `status`, etc.
- **Key Endpoints:**
  - `GET /api/v1/tasks?groupId=<groupId>` — fetch all tasks for a group.
  - `GET /api/v1/tasks?assignedTo=<userId>` — fetch user’s tasks.
  - Optionally filter by date range: `dueDate[gte]`, `dueDate[lte]`.
  - Real-time: WebSocket events for task creation, update, completion.

---

## 2. Flutter Setup

### a. Dependencies
Add to `pubspec.yaml`:
```yaml
dependencies:
  dio: ^5.0.0
  provider: ^6.0.0
  intl: ^0.18.0
  table_calendar: ^3.0.0
  web_socket_channel: ^2.4.0
```

### b. Dio API Client Example
```dart
import 'package:dio/dio.dart';

class ApiClient {
  final Dio dio = Dio(BaseOptions(
    baseUrl: 'https://your-backend-url/api/v1',
    headers: {'Authorization': 'Bearer <token>'},
  ));

  Future<List<Task>> fetchGroupTasks(String groupId) async {
    final response = await dio.get('/tasks', queryParameters: {'groupId': groupId});
    return (response.data['tasks'] as List).map((json) => Task.fromJson(json)).toList();
  }
}
```

### c. Task Model Example
```dart
class Task {
  final String id;
  final String title;
  final String description;
  final DateTime dueDate;
  final String status;

  Task({required this.id, required this.title, required this.description, required this.dueDate, required this.status});

  factory Task.fromJson(Map<String, dynamic> json) => Task(
    id: json['_id'],
    title: json['title'],
    description: json['description'],
    dueDate: DateTime.parse(json['dueDate']),
    status: json['status'],
  );
}
```

---

## 3. Calendar UI with TableCalendar
```dart
import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';

class CalendarScreen extends StatefulWidget {
  final List<Task> tasks;
  CalendarScreen({required this.tasks});

  @override
  _CalendarScreenState createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  List<Task> _tasksForDay(DateTime day) {
    return widget.tasks.where((task) =>
      task.dueDate.year == day.year &&
      task.dueDate.month == day.month &&
      task.dueDate.day == day.day
    ).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TableCalendar(
          focusedDay: _focusedDay,
          firstDay: DateTime.utc(2020),
          lastDay: DateTime.utc(2030),
          selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
          onDaySelected: (selectedDay, focusedDay) {
            setState(() {
              _selectedDay = selectedDay;
              _focusedDay = focusedDay;
            });
          },
          eventLoader: _tasksForDay,
        ),
        Expanded(
          child: ListView(
            children: _tasksForDay(_selectedDay ?? _focusedDay).map((task) =>
              ListTile(
                title: Text(task.title),
                subtitle: Text(task.description),
                trailing: Text(task.status),
              )
            ).toList(),
          ),
        ),
      ],
    );
  }
}
```

---

## 4. Real-Time Updates (Optional)
- Use `web_socket_channel` to listen for backend events (`task:created`, `task:updated`, etc.) and update the calendar instantly.

```dart
import 'package:web_socket_channel/web_socket_channel.dart';

final channel = WebSocketChannel.connect(Uri.parse('wss://your-backend-url/ws'));

channel.stream.listen((event) {
  // Parse event and update tasks list
});
```

---

## 5. Best Practices & Recommendations
- Implement pagination or date-range filtering for large groups.
- Handle errors and token expiry in Dio.
- Only show tasks relevant to the user/group.
- Highlight overdue tasks, allow task creation from the calendar, and show details on tap.

---

## 6. Sample Workflow
1. Login, store JWT token.
2. Fetch tasks for the group.
3. Display tasks in the calendar view.
4. Tap a date to see tasks; tap a task for details.
5. Listen for WebSocket updates for real-time sync.

---

## 7. Extending Further
- Add task creation/editing from the calendar.
- Color-code by status or priority.
- Integrate reminders using local notifications.

---

With this approach, your Flutter app will deliver a seamless shared calendar experience powered by the Roomy backend.
