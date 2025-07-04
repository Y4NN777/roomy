import 'package:flutter/material.dart';

class RecentActivity extends StatelessWidget {
  final Color primaryBlue;
  final Color primaryOrange;
  final Color white;

  const RecentActivity({
    Key? key,
    required this.primaryBlue,
    required this.primaryOrange,
    required this.white,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      duration: const Duration(milliseconds: 1000),
      tween: Tween(begin: 0.0, end: 1.0),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, 30 * (1 - value)),
          child: Opacity(
            opacity: value,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: primaryBlue.withOpacity(0.08),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Recent Activity',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: primaryBlue,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildActivityItem(
                    text: 'Axel completed "Clean kitchen"',
                    time: '2 hours ago',
                    iconColor: primaryOrange,
                    delay: 0,
                  ),
                  const SizedBox(height: 12),
                  _buildActivityItem(
                    text: 'Jonh added groceries expense: \$45.67',
                    time: '5 hours ago',
                    iconColor: primaryBlue,
                    delay: 200,
                  ),
                  const SizedBox(height: 12),
                  _buildActivityItem(
                    text: 'Prisca assigned "Take out trash" to John',
                    time: '1 day ago',
                    iconColor: primaryOrange,
                    delay: 400,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildActivityItem({
    required String text,
    required String time,
    required Color iconColor,
    required int delay,
  }) {
    return TweenAnimationBuilder<double>(
      duration: Duration(milliseconds: 500 + delay),
      tween: Tween(begin: 0.0, end: 1.0),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(20 * (1 - value), 0),
          child: Opacity(
            opacity: value,
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: iconColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.bolt,
                    color: iconColor,
                    size: 16,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        text,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: primaryBlue,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        time,
                        style: TextStyle(
                          fontSize: 12,
                          color: primaryBlue.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
