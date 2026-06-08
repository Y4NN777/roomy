import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

class TaskDetailScreen extends StatelessWidget {
  final String taskId;
  
  const TaskDetailScreen({super.key, required this.taskId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Task Details'),
        backgroundColor: AppColors.primaryBlue,
        foregroundColor: AppColors.white,
      ),
      body: Center(
        child: Text(
          'Task Details for: $taskId\nComing Soon',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 24,
            color: AppColors.primaryBlue,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}