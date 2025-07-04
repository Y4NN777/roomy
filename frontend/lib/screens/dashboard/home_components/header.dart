import 'package:flutter/material.dart';

class HomeHeader extends StatelessWidget {
  final Color primaryBlue;
  final Color primaryOrange;
  final Color white;

  const HomeHeader({
    Key? key,
    required this.primaryBlue,
    required this.primaryOrange,
    required this.white,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: primaryBlue,
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Logo
              Text(
                'Roomy',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: white,
                ),
              ),
              // Right side
              Row(
                children: [
                  // Notification Icon with Badge
                  Stack(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        child: Icon(
                          Icons.notifications_outlined,
                          color: white,
                          size: 24,
                        ),
                      ),
                      Positioned(
                        right: 6,
                        top: 6,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: primaryOrange,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '3',
                              style: TextStyle(
                                color: white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  // User Avatar
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: primaryOrange,
                      border: Border.all(
                        color: white.withOpacity(0.3),
                        width: 2,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        'R',
                        style: TextStyle(
                          color: white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
