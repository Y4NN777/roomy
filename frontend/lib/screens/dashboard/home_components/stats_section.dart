import 'package:flutter/material.dart';

class StatsSection extends StatelessWidget {
  final Color primaryBlue;
  final Color primaryOrange;
  final Color white;

  const StatsSection({
    Key? key,
    required this.primaryBlue,
    required this.primaryOrange,
    required this.white,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      duration: const Duration(milliseconds: 800),
      tween: Tween(begin: 0.0, end: 1.0),
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: Row(
            children: [
              // Pending Tasks
              Expanded(
                child: _buildStatCard(
                  title: '3',
                  subtitle: 'Pending\nTasks',
                  color: primaryBlue,
                  delay: 0,
                ),
              ),
              const SizedBox(width: 12),
              // Total Expenses
              Expanded(
                child: _buildStatCard(
                  title: '159',
                  subtitle: 'Total\nExpense',
                  color: primaryOrange,
                  delay: 200,
                ),
              ),
              const SizedBox(width: 12),
              // Group Members
              Expanded(
                child: _buildStatCard(
                  title: '3',
                  subtitle: 'Group\nMember',
                  color: primaryBlue,
                  delay: 400,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatCard({
    required String title,
    required String subtitle,
    required Color color,
    required int delay,
  }) {
    return TweenAnimationBuilder<double>(
      duration: Duration(milliseconds: 600 + delay),
      tween: Tween(begin: 0.0, end: 1.0),
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, 30 * (1 - value)),
          child: Opacity(
            opacity: value,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: color.withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 14,
                      color: white.withOpacity(0.9),
                      fontWeight: FontWeight.w500,
                      height: 1.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
