import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class GroupSetupPage extends StatefulWidget {
  const GroupSetupPage({Key? key}) : super(key: key);

  @override
  State<GroupSetupPage> createState() => _GroupSetupPageState();
}

class _GroupSetupPageState extends State<GroupSetupPage>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Custom colors
  static const Color primaryOrange = Color(0xFFF97316);
  static const Color primaryBlue = Color(0xFF03339C);
  static const Color white = Color(0xFFFFFFFF);

  @override
  void initState() {
    super.initState();
    
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: Curves.elasticOut,
    ));

    _fadeController.forward();
    _slideController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: white,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  const SizedBox(height: 60),
                  
                  // Main Content
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Icon Section
                        _buildIconSection(),
                        
                        const SizedBox(height: 40),
                        
                        // Title and Description
                        _buildTitleSection(),
                        
                        const SizedBox(height: 60),
                        
                        // Buttons Section
                        _buildButtonsSection(),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIconSection() {
    return TweenAnimationBuilder<double>(
      duration: const Duration(milliseconds: 800),
      tween: Tween(begin: 0.0, end: 1.0),
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: primaryBlue.withOpacity(0.1),
              boxShadow: [
                BoxShadow(
                  color: primaryBlue.withOpacity(0.1),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Center(
              child: Icon(
                Icons.group_outlined,
                size: 50,
                color: primaryBlue,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTitleSection() {
    return TweenAnimationBuilder<double>(
      duration: const Duration(milliseconds: 1000),
      tween: Tween(begin: 0.0, end: 1.0),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, 30 * (1 - value)),
          child: Opacity(
            opacity: value,
            child: Column(
              children: [
                const Text(
                  'Join or Create Group',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: primaryBlue,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Connect with your roommates to get started',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    color: primaryBlue.withOpacity(0.7),
                    fontWeight: FontWeight.w500,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildButtonsSection() {
    return Column(
      children: [
        // Create New Group Button
        TweenAnimationBuilder<double>(
          duration: const Duration(milliseconds: 1200),
          tween: Tween(begin: 0.0, end: 1.0),
          curve: Curves.elasticOut,
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Container(
                width: double.infinity,
                height: 60,
                decoration: BoxDecoration(
                  color: primaryBlue,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: primaryBlue.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    _handleCreateGroup();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryBlue,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Create New Group',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: white,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
        
        const SizedBox(height: 20),
        
        // Join Existing Group Button
        TweenAnimationBuilder<double>(
          duration: const Duration(milliseconds: 1400),
          tween: Tween(begin: 0.0, end: 1.0),
          curve: Curves.elasticOut,
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Container(
                width: double.infinity,
                height: 60,
                decoration: BoxDecoration(
                  color: white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: primaryBlue,
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: primaryBlue.withOpacity(0.1),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    _handleJoinGroup();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: white,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Join Existing Group',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: primaryBlue,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  void _handleCreateGroup() {
    _showCreateGroupModal();
  }

  void _handleJoinGroup() {
    _showJoinGroupModal();
  }

  void _showCreateGroupModal() {
    final groupNameController = TextEditingController();
    final groupDescriptionController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        child: Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: primaryBlue.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Title
              const Text(
                'Create New Group',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: primaryBlue,
                ),
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'Set up your shared living space',
                style: TextStyle(
                  fontSize: 16,
                  color: primaryBlue.withOpacity(0.7),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Group Name Field
              _buildModalTextField(
                controller: groupNameController,
                label: 'Group Name',
                hint: 'e.g., Sunset Apartment',
                icon: Icons.home_outlined,
              ),
              
              const SizedBox(height: 20),
              
              // Group Description Field
              _buildModalTextField(
                controller: groupDescriptionController,
                label: 'Description (Optional)',
                hint: 'Tell us about your living space',
                icon: Icons.description_outlined,
                maxLines: 3,
              ),
              
              const Spacer(),
              
              // Create Button
              Container(
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  color: primaryOrange,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: primaryOrange.withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: () {
                    if (groupNameController.text.isNotEmpty) {
                      Navigator.pop(context);
                      _navigateToMainApp();
                    } else {
                      _showSnackBar('Please enter a group name');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryOrange,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Create Group',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showJoinGroupModal() {
    final groupCodeController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: const BoxDecoration(
          color: white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        child: Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: primaryBlue.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Title
              const Text(
                'Join Existing Group',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: primaryBlue,
                ),
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'Enter the group code shared by your roommate',
                style: TextStyle(
                  fontSize: 16,
                  color: primaryBlue.withOpacity(0.7),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Group Code Field
              _buildModalTextField(
                controller: groupCodeController,
                label: 'Group Code',
                hint: 'e.g., APT2024',
                icon: Icons.qr_code_2_outlined,
              ),
              
              const SizedBox(height: 16),
              
              // Info message
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: primaryOrange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: primaryOrange.withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: primaryOrange,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Ask your roommate for the group code to join their existing group.',
                        style: TextStyle(
                          fontSize: 14,
                          color: primaryOrange,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              const Spacer(),
              
              // Join Button
              Container(
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  color: primaryOrange,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: primaryOrange.withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: () {
                    if (groupCodeController.text.isNotEmpty) {
                      Navigator.pop(context);
                      _navigateToMainApp();
                    } else {
                      _showSnackBar('Please enter a group code');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryOrange,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Join Group',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModalTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    int maxLines = 1,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: primaryBlue.withOpacity(0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: primaryBlue.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: primaryBlue,
        ),
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          labelStyle: TextStyle(
            color: primaryBlue.withOpacity(0.6),
            fontWeight: FontWeight.w500,
          ),
          hintStyle: TextStyle(
            color: primaryBlue.withOpacity(0.4),
          ),
          prefixIcon: Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryOrange,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: white,
              size: 20,
            ),
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(
              color: primaryOrange,
              width: 2,
            ),
          ),
          filled: true,
          fillColor: white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 20,
          ),
        ),
      ),
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: primaryOrange,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  void _navigateToMainApp() {
    // Show success message
    _showSnackBar('Group setup completed successfully!');
    
    // Navigate to main app after a short delay
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/main');
      }
    });
  }
}