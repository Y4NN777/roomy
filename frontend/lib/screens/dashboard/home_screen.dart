import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'home_components/header.dart';
import 'home_components/welcome_section.dart';
import 'home_components/stats_section.dart';
import 'home_components/recent_activity.dart';
import 'home_components/upcoming_tasks.dart';
import 'home_components/bottom_navigation.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage>
    with TickerProviderStateMixin {
  int _currentIndex = 0;
  
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  // Consistent color scheme
  static const Color primaryOrange = Color(0xFFF97316);
  static const Color primaryBlue = Color(0xFF03339C);
  static const Color white = Color(0xFFFFFFFF);

  @override
  void initState() {
    super.initState();
    
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    ));

    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  void _handleNavigation(int index) {
    switch (index) {
      case 0:
        // Already on Home
        break;
      case 1:
        Navigator.pushNamed(context, '/tasks');
        break;
      case 2:
        Navigator.pushNamed(context, '/groups');
        break;
      case 3:
        Navigator.pushNamed(context, '/finances');
        break;
      // Removed case 4 (Settings)
    }
  }  

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Column(
          children: [
            HomeHeader(
              primaryBlue: primaryBlue,
              primaryOrange: primaryOrange,
              white: white,
            ),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      WelcomeSection(primaryBlue: primaryBlue),
                      const SizedBox(height: 24),
                      StatsSection(
                        primaryBlue: primaryBlue,
                        primaryOrange: primaryOrange,
                        white: white,
                      ),
                      const SizedBox(height: 24),
                      RecentActivity(
                        primaryBlue: primaryBlue,
                        primaryOrange: primaryOrange,
                        white: white,
                      ),
                      const SizedBox(height: 24),
                      UpcomingTasks(
                        primaryBlue: primaryBlue,
                        white: white,
                        primaryOrange: primaryOrange,
                      ),
                      const SizedBox(height: 100), // Space for bottom nav
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigation(
        primaryBlue: primaryBlue,
        white: white,
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
          _handleNavigation(index);
        },
      ),
    );
  }
}
