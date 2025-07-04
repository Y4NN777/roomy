import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/app_colors.dart';

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
        Navigator.pushNamed(context, '/task');
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
      backgroundColor: AppColors.background,
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Column(
          children: [
            HomeHeader(
              primaryBlue: AppColors.primaryBlue,
              primaryOrange: AppColors.primaryOrange,
              white: AppColors.white,
            ),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      WelcomeSection(primaryBlue: AppColors.primaryBlue),
                      const SizedBox(height: 24),
                      StatsSection(
                        primaryBlue: AppColors.primaryBlue,
                        primaryOrange: AppColors.primaryOrange,
                        white: AppColors.white,
                      ),
                      const SizedBox(height: 24),
                      RecentActivity(
                        primaryBlue: AppColors.primaryBlue,
                        primaryOrange: AppColors.primaryOrange,
                        white: AppColors.white,
                      ),
                      const SizedBox(height: 24),
                      UpcomingTasks(
                        primaryBlue: AppColors.primaryBlue,
                        white: AppColors.white,
                        primaryOrange: AppColors.primaryOrange,
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
        primaryBlue: AppColors.primaryBlue,
        white: AppColors.white,
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
