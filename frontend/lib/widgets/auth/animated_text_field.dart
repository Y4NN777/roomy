import 'package:flutter/material.dart';
import '../../core/app_colors.dart';

/// A reusable animated text field widget with label, icon, validation, and optional password visibility toggle.
class AnimatedTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final bool isPassword;
  final bool isVisible;
  final VoidCallback? onVisibilityToggle;
  final TextInputType? keyboardType;
  final int delay;
  final String? Function(String?)? validator;

  const AnimatedTextField({
    Key? key,
    required this.controller,
    required this.label,
    required this.icon,
    this.isPassword = false,
    this.isVisible = false,
    this.onVisibilityToggle,
    this.keyboardType,
    this.delay = 0,
    this.validator,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      duration: Duration(milliseconds: 500 + delay),
      tween: Tween(begin: 0.0, end: 1.0),
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, 50 * (1 - value)),
          child: Opacity(
            opacity: value,
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.primaryBlue.withOpacity(0.02),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.primaryBlue.withOpacity(0.1),
                  width: 1,
                ),
              ),
              child: TextFormField(
                controller: controller,
                obscureText: isPassword && !isVisible,
                keyboardType: keyboardType,
                validator: validator,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: AppColors.primaryBlue,
                ),
                decoration: InputDecoration(
                  labelText: label,
                  labelStyle: TextStyle(
                    color: AppColors.primaryBlue.withOpacity(0.6),
                    fontWeight: FontWeight.w500,
                  ),
                  prefixIcon: Container(
                    margin: const EdgeInsets.all(12),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryOrange,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      icon,
                      color: AppColors.white,
                      size: 20,
                    ),
                  ),
                  suffixIcon: isPassword
                      ? IconButton(
                          onPressed: onVisibilityToggle,
                          icon: Icon(
                            isVisible
                                ? Icons.visibility_rounded
                                : Icons.visibility_off_rounded,
                            color: AppColors.primaryBlue.withOpacity(0.6),
                          ),
                        )
                      : null,
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
                      color: AppColors.primaryOrange,
                      width: 2,
                    ),
                  ),
                  errorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(
                      color: Colors.red,
                      width: 2,
                    ),
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(
                      color: Colors.red,
                      width: 2,
                    ),
                  ),
                  filled: true,
                  fillColor: AppColors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 20,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
