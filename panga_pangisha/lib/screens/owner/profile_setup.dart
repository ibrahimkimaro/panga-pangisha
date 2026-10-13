import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../l10n.dart';
import '../../ui.dart';
import '../profile_edit_screens.dart';
import 'landlord_welcome.dart';

/// Screen 9: Landlord Profile Setup
class LandlordProfileSetupScreen extends StatefulWidget {
  const LandlordProfileSetupScreen({super.key, this.userName});
  final String? userName;

  @override
  State<LandlordProfileSetupScreen> createState() => _LandlordProfileSetupScreenState();
}

class _LandlordProfileSetupScreenState extends State<LandlordProfileSetupScreen> {
  bool _photoAdded = false;
  bool _contactAdded = false;
  bool _businessAdded = false;

  int get _progressPercent {
    int p = 0;
    if (_photoAdded) p += 33;
    if (_contactAdded) p += 33;
    if (_businessAdded) p += 34;
    return p;
  }

  void _proceed() {
    HapticFeedback.mediumImpact();
    push(context, LandlordWelcomeScreen(userName: widget.userName));
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.userName?.split(' ').first ?? 'John';

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: C.overlay,
      child: Scaffold(
        backgroundColor: C.card,
        body: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight - 24),
                  child: IntrinsicHeight(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                // Back button
                Row(
                  children: [
                    Press(
                      onTap: () => Navigator.of(context).maybePop(),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: C.fill,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.arrow_back_rounded,
                          color: C.wino,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                Text(
                  t('Welcome, $name 👋', 'Karibu, $name 👋'),
                  style: display(28, color: C.wino, weight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                Text(
                  t(
                    'You\'re all set! Let\'s set up your landlord profile.',
                    'Uko tayari! Tusanidi wasifu wako wa mmiliki.',
                  ),
                  style: body(15, color: C.muted),
                ),
                const SizedBox(height: 24),

                // Card: Complete your profile with progress indicator
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: C.chokaa,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: C.line),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.badge_outlined,
                              color: Color(0xFF2563EB),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t('Complete your profile', 'Kamilisha wasifu wako'),
                                  style: display(15, color: C.wino, weight: FontWeight.w700),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  t(
                                    'Add business details and preferences to get started.',
                                    'Weka maelezo ya biashara na mapendeleo kuanza.',
                                  ),
                                  style: body(12.5, color: C.muted),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Progress Bar
                      Row(
                        children: [
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value: _progressPercent / 100,
                                backgroundColor: C.line,
                                valueColor: AlwaysStoppedAnimation<Color>(C.teal),
                                minHeight: 8,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            '$_progressPercent% ${t('complete', 'kamili')}',
                            style: body(12.5, color: C.wino, weight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // 1. Add Profile Photo
                _setupTile(
                  icon: Icons.person_add_alt_1_outlined,
                  title: t('Add Profile Photo', 'Weka Picha ya Wasifu'),
                  isCompleted: _photoAdded,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _photoAdded = !_photoAdded);
                    toast(
                      context,
                      _photoAdded
                          ? t('Profile photo updated', 'Picha ya wasifu imewekwa')
                          : t('Profile photo removed', 'Picha imeondolewa'),
                    );
                  },
                ),
                const SizedBox(height: 12),

                // 2. Add Contact Details
                _setupTile(
                  icon: Icons.phone_outlined,
                  title: t('Add Contact Details', 'Weka Taarifa za Mawasiliano'),
                  isCompleted: _contactAdded,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _contactAdded = !_contactAdded);
                    toast(
                      context,
                      _contactAdded
                          ? t('Contact details saved', 'Mawasiliano yamehifadhiwa')
                          : t('Contact details removed', 'Mawasiliano yameondolewa'),
                    );
                  },
                ),
                const SizedBox(height: 12),

                // 3. Add Business Information
                _setupTile(
                  icon: Icons.business_outlined,
                  title: t('Add Business Information', 'Weka Taarifa za Biashara'),
                  isCompleted: _businessAdded,
                  onTap: () async {
                    HapticFeedback.selectionClick();
                    // The real form: what is saved here goes to the admin team for verification.
                    final current = await ProfileDataService.loadBusinessInfo();
                    if (!context.mounted) return;
                    final sent = await push<Map<String, String>>(context, EditBusinessInfoScreen(initialData: current));
                    if (sent != null && mounted) setState(() => _businessAdded = true);
                  },
                ),

                const Spacer(),

                Button(
                  t('Continue', 'Endelea'),
                  tone: Tone.navy,
                  onTap: _proceed,
                ),
                const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _setupTile({
    required IconData icon,
    required String title,
    required bool isCompleted,
    required VoidCallback onTap,
  }) {
    return Press(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: C.card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isCompleted ? C.teal : C.line,
            width: isCompleted ? 1.6 : 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: .025),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isCompleted
                    ? C.teal.withValues(alpha: .14)
                    : C.fill,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 20,
                color: isCompleted ? C.teal : C.wino,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: display(15, color: C.wino, weight: FontWeight.w700),
              ),
            ),
            Icon(
              isCompleted ? Icons.check_circle_rounded : Icons.chevron_right_rounded,
              color: isCompleted ? C.teal : C.faint,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}
