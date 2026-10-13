import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api.dart';
import '../l10n.dart';
import '../main.dart';
import '../ui.dart';
import 'auth.dart';

/// App Onboarding Experience:
/// - Step 1: 4-Slide Onboarding Carousel (Find, Manage, Save, Connect)
/// - Step 2: Screen 5: Welcome to Panga & Role Selection (holding chosen role in state)
class Onboarding extends StatefulWidget {
  const Onboarding({super.key});

  @override
  State<Onboarding> createState() => _OnboardingState();
}

class _OnboardingState extends State<Onboarding> {
  // 0 = Onboarding Carousel (Slides 1-4)
  // 1 = Screen 5: Role Selection
  int _view = 0;
  String _selectedRole = 'landlord';
  final _pageController = PageController();
  int _activeSlide = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goToRoleSelection() {
    try {
      HapticFeedback.lightImpact();
    } catch (_) {}
    setState(() => _view = 1);
  }

  void _goBackToCarousel() {
    try {
      HapticFeedback.lightImpact();
    } catch (_) {}
    setState(() => _view = 0);
  }

  void _nextSlide() {
    try {
      HapticFeedback.lightImpact();
    } catch (_) {}
    if (_activeSlide == 3) {
      _goToRoleSelection();
    } else {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  void _proceedToSignUp() {
    try {
      HapticFeedback.mediumImpact();
    } catch (_) {}
    AuthScreen.initialSelectedRole = _selectedRole;
    AuthScreen.startWithRegister = true;
    Api.finishOnboarding();
    onboarded.value = true;
    push(context, const AuthScreen());
  }

  void _proceedToSignIn() {
    try {
      HapticFeedback.lightImpact();
    } catch (_) {}
    AuthScreen.initialSelectedRole = _selectedRole;
    AuthScreen.startWithRegister = false;
    Api.finishOnboarding();
    onboarded.value = true;
    push(context, const AuthScreen());
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: C.overlay,
      child: Scaffold(
        backgroundColor: C.card,
        body: AnimatedSwitcher(
          duration: const Duration(milliseconds: 350),
          switchInCurve: Curves.easeInOutCubic,
          switchOutCurve: Curves.easeInOutCubic,
          child: _view == 0
              ? _AppOnboardingCarouselView(
                  key: const ValueKey('onboarding_carousel'),
                  pageController: _pageController,
                  activeSlide: _activeSlide,
                  onSlideChanged: (idx) => setState(() => _activeSlide = idx),
                  onSkip: _goToRoleSelection,
                  onNext: _nextSlide,
                  onFinish: _goToRoleSelection,
                )
              : _RoleSelectionView(
                  key: const ValueKey('role_selection'),
                  selectedRole: _selectedRole,
                  onRoleChanged: (r) => setState(() => _selectedRole = r),
                  onBack: _goBackToCarousel,
                  onContinue: _proceedToSignUp,
                  onSignIn: _proceedToSignIn,
                ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 4-STEP APP ONBOARDING CAROUSEL (Consistent, elegant arched cards)
// ---------------------------------------------------------------------------
class _AppOnboardingCarouselView extends StatelessWidget {
  const _AppOnboardingCarouselView({
    super.key,
    required this.pageController,
    required this.activeSlide,
    required this.onSlideChanged,
    required this.onSkip,
    required this.onNext,
    required this.onFinish,
  });

  final PageController pageController;
  final int activeSlide;
  final ValueChanged<int> onSlideChanged;
  final VoidCallback onSkip;
  final VoidCallback onNext;
  final VoidCallback onFinish;

  @override
  Widget build(BuildContext context) {
    return PageView(
      controller: pageController,
      physics: const ClampingScrollPhysics(),
      onPageChanged: onSlideChanged,
      children: [
        // Slide 1: Find a home that fits your life
        _StandardSlide(
          slideNumber: 1,
          badgeIcon: Icons.home_rounded,
          badgeCategory: t('Find', 'Tafuta'),
          badgeSub: t('Your perfect home', 'Nyumba yako bora'),
          title: t('Find a home\nthat fits your life', 'Tafuta nyumba\ninayolingana na maisha'),
          bodyText: t(
            'Explore verified properties, direct from owners and trusted agencies across Tanzania.',
            'Gundua nyumba zilizohakikiwa, moja kwa moja kutoka kwa wamiliki na mawakala wanaoaminika Tanzania.',
          ),
          imagePath: 'assets/images/discover_terrace.jpg',
          overlayWidget: const SizedBox.shrink(),
          onSkip: onSkip,
          onNext: onNext,
          isLast: false,
        ),

        // Slide 2: Manage rental life with artwork & phone mockup
        _StandardSlide(
          slideNumber: 2,
          badgeIcon: Icons.tune_rounded,
          badgeCategory: t('Manage', 'Simamia'),
          badgeSub: t('Rent & maintenance', 'Kodi na ukarabati'),
          title: t('Simplify your\nrental life', 'Rahisisha maisha\nyako ya upangaji'),
          bodyText: t(
            'Sign leases, pay rent, request maintenance and communicate — all in one place.',
            'Weka saini mikataba, lipa kodi, omba ukarabati na wasiliana kwa urahisi — yote mahali pamoja.',
          ),
          imagePath: 'assets/images/manage_bg.jpg',
          overlayWidget: const _PhoneMockupOverlay(),
          onSkip: onSkip,
          onNext: onNext,
          isLast: false,
        ),

        // Slide 3: Save today for tomorrow with savings goal card
        _StandardSlide(
          slideNumber: 3,
          badgeIcon: Icons.eco_rounded,
          badgeCategory: t('Save', 'Akiba'),
          badgeSub: t('Build your future', 'Jenga kesho yako'),
          title: t('Save today,\nfor tomorrow', 'Weka akiba leo,\nkwa ajili ya kesho'),
          bodyText: t(
            'Set housing goals, save consistently, and access financial solutions through our trusted partners.',
            'Panga malengo ya nyumba, weka akiba kila mwezi, na upate suluhisho za kifedha kupitia washirika wetu.',
          ),
          imagePath: 'assets/images/save_piggy.jpg',
          overlayWidget: const _SavingsGoalOverlay(),
          onSkip: onSkip,
          onNext: onNext,
          isLast: false,
        ),

        // Slide 4: Connect ecosystem with network avatars
        _StandardSlide(
          slideNumber: 4,
          badgeIcon: Icons.handshake_rounded,
          badgeCategory: t('Connect', 'Ungana'),
          badgeSub: t('Services & partners', 'Huduma na washirika'),
          title: t('More than just\na place to live', 'Zaidi ya sehemu\nya kuishi tu'),
          bodyText: t(
            'Get access to trusted service providers, financing partners, and a growing housing ecosystem.',
            'Pata watoa huduma wanaoaminika, washirika wa fedha, na mtandao mpana wa makazi nchini.',
          ),
          imagePath: 'assets/images/connect_ecosystem.jpg',
          overlayWidget: const _EcosystemOverlay(),
          onSkip: onSkip,
          onNext: onFinish,
          isLast: true,
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// STANDARD ONBOARDING SLIDE: Organic arched card with category badge
// ---------------------------------------------------------------------------
class _StandardSlide extends StatelessWidget {
  const _StandardSlide({
    required this.slideNumber,
    required this.badgeIcon,
    required this.badgeCategory,
    required this.badgeSub,
    required this.title,
    required this.bodyText,
    required this.imagePath,
    required this.overlayWidget,
    required this.onSkip,
    required this.onNext,
    required this.isLast,
  });

  final int slideNumber;
  final IconData badgeIcon;
  final String badgeCategory;
  final String badgeSub;
  final String title;
  final String bodyText;
  final String imagePath;
  final Widget overlayWidget;
  final VoidCallback onSkip;
  final VoidCallback onNext;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Bar
            Row(
              children: [
                const _PangaMiniMark(),
                const Spacer(),
                const LangSwitch(dark: false),
              ],
            ),
            const SizedBox(height: 16),

            // Arched Image Container with Pill Badge
            Expanded(
              flex: 6,
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(32),
                        topRight: Radius.circular(32),
                        bottomLeft: Radius.circular(32),
                        bottomRight: Radius.circular(72),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: .08),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.asset(
                          imagePath,
                          fit: BoxFit.cover,
                        ),
                        overlayWidget,
                      ],
                    ),
                  ),

                  // Floating Category Pill Badge
                  Positioned(
                    top: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .94),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: .1),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: C.teal.withValues(alpha: .15),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(badgeIcon, size: 16, color: C.teal),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                badgeCategory,
                                style: display(13, color: C.wino, weight: FontWeight.w700),
                              ),
                              Text(
                                badgeSub,
                                style: body(11, color: C.muted, weight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Title & Description
            Expanded(
              flex: 4,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: display(28, color: C.wino, weight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    bodyText,
                    style: body(14.5, color: C.muted, weight: FontWeight.w400),
                  ),
                ],
              ),
            ),

            // Bottom Navigation Controls
            Row(
              children: [
                _dots(slideNumber - 1),

                const Spacer(),

                TextButton(
                  onPressed: onSkip,
                  child: Text(
                    t('Skip', 'Ruka'),
                    style: body(14.5, color: C.muted, weight: FontWeight.w600),
                  ),
                ),
                const SizedBox(width: 8),

                Press(
                  onTap: onNext,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
                    decoration: BoxDecoration(
                      color: C.navy,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: C.navy.withValues(alpha: .28),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          isLast ? t('Get Started', 'Anza Sasa') : t('Next', 'Endelea'),
                          style: body(14.5, color: Colors.white, weight: FontWeight.w700),
                        ),
                        const SizedBox(width: 6),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                          size: 16,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// SCREEN 5: Welcome to Panga & Role Selection
// ---------------------------------------------------------------------------
class _RoleSelectionView extends StatelessWidget {
  const _RoleSelectionView({
    super.key,
    required this.selectedRole,
    required this.onRoleChanged,
    required this.onBack,
    required this.onContinue,
    required this.onSignIn,
  });

  final String selectedRole;
  final ValueChanged<String> onRoleChanged;
  final VoidCallback onBack;
  final VoidCallback onContinue;
  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    final roles = [
      (
        key: 'tenant',
        title: t('Tenant', 'Mpangaji'),
        desc: t('Looking for a place to rent', 'Natafuta nyumba ya kupanga'),
        icon: Icons.person_outline_rounded,
        color: C.teal,
      ),
      (
        key: 'landlord',
        title: t('Landlord', 'Mmiliki wa Nyumba'),
        desc: t('Own and manage properties', 'Mmiliki na msimamizi wa nyumba'),
        icon: Icons.home_work_outlined,
        color: const Color(0xFFF59E0B),
      ),
      (
        key: 'manager',
        title: t('Property Manager', 'Msimamizi wa Majengo'),
        desc: t('Manage properties for others', 'Simamia nyumba za wengine'),
        icon: Icons.business_center_outlined,
        color: C.teal,
      ),
      (
        key: 'service',
        title: t('Service Provider', 'Mtoa Huduma'),
        desc: t('Offer maintenance or other services', 'Toa huduma za ukarabati na ufundi'),
        icon: Icons.build_outlined,
        color: const Color(0xFF8B5CF6),
      ),
      (
        key: 'finance',
        title: t('Financing Partner', 'Mshirika wa Fedha'),
        desc: t('Provide home financing solutions', 'Toa suluhisho za fedha za makazi'),
        icon: Icons.account_balance_outlined,
        color: C.teal,
      ),
    ];

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top bar with Back Button + Language Switch
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Press(
                  onTap: onBack,
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
                const Spacer(),
                const LangSwitch(dark: false),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t('Welcome to Panga', 'Karibu Panga'),
                  style: display(28, color: C.wino, weight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                Text(
                  t('Join Panga and get the best experience.', 'Jiunge na Panga upate uzoefu bora wa makazi.'),
                  style: body(14.5, color: C.muted),
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // Role selection list cards (Screen 5 from reference)
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              itemCount: roles.length,
              physics: const ClampingScrollPhysics(),
              itemBuilder: (context, index) {
                final r = roles[index];
                final isSelected = selectedRole == r.key;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Press(
                    onTap: () {
                      try {
                        HapticFeedback.selectionClick();
                      } catch (_) {}
                      onRoleChanged(r.key);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: C.card,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isSelected ? C.teal : C.line,
                          width: isSelected ? 1.8 : 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: isSelected
                                ? C.teal.withValues(alpha: .12)
                                : Colors.black.withValues(alpha: .03),
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
                              color: isSelected
                                  ? r.color.withValues(alpha: .15)
                                  : C.fill,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              r.icon,
                              size: 20,
                              color: isSelected ? r.color : C.wino,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  r.title,
                                  style: display(15, color: C.wino, weight: FontWeight.w700),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  r.desc,
                                  style: body(12.5, color: C.muted),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSelected ? C.teal : C.line,
                                width: 2,
                              ),
                              color: isSelected ? C.teal : Colors.transparent,
                            ),
                            child: isSelected
                                ? const Icon(
                                    Icons.check,
                                    size: 14,
                                    color: Colors.white,
                                  )
                                : null,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Bottom Action: Continue Button + Sign In Prompt
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: Column(
              children: [
                Button(
                  '${t('Continue', 'Endelea')}  →',
                  tone: Tone.navy,
                  onTap: onContinue,
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      t('Already have an account? ', 'Je, una akaunti tayari? '),
                      style: body(13.5, color: C.muted),
                    ),
                    TextButton(
                      onPressed: onSignIn,
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(
                        t('Sign in', 'Ingia'),
                        style: body(13.5, color: C.wino, weight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// HELPER: Dot Indicators
// ---------------------------------------------------------------------------
Widget _dots(int activeIndex) {
  return Row(
    children: List.generate(4, (index) {
      final isCurrent = index == activeIndex;
      return AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        margin: const EdgeInsets.only(right: 6),
        width: isCurrent ? 22 : 6,
        height: 6,
        decoration: BoxDecoration(
          color: isCurrent ? C.wino : C.line,
          borderRadius: BorderRadius.circular(3),
        ),
      );
    }),
  );
}

// ---------------------------------------------------------------------------
// OVERLAYS FOR THE ONBOARDING CARDS
// ---------------------------------------------------------------------------

/// Step 2 Overlay: Floating Smartphone mockup card with rental features
class _PhoneMockupOverlay extends StatelessWidget {
  const _PhoneMockupOverlay();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(left: 18, top: 30, bottom: 20),
        width: 175,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: C.card,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: Colors.black.withValues(alpha: .08), width: 3),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: .2),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Speaker bar
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 10),
            _menuTile(Icons.receipt_long_rounded, C.teal, t('Rent Payment', 'Malipo ya Kodi')),
            _menuTile(Icons.build_rounded, const Color(0xFFF59E0B), t('Maintenance', 'Ukarabati')),
            _menuTile(Icons.chat_bubble_rounded, const Color(0xFF3B82F6), t('Messages', 'Ujumbe')),
            _menuTile(Icons.description_rounded, const Color(0xFF8B5CF6), t('Lease Agreement', 'Mkataba')),
          ],
        ),
      ),
    );
  }

  Widget _menuTile(IconData icon, Color color, String title) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
      decoration: BoxDecoration(
        color: C.chokaa,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: color.withValues(alpha: .15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, size: 13, color: color),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: body(10.5, color: C.wino, weight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

/// Step 3 Overlay: Floating Housing Goal Card
class _SavingsGoalOverlay extends StatelessWidget {
  const _SavingsGoalOverlay();

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 24,
      right: 18,
      child: Container(
        width: 170,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: C.card,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: .12),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Text(
                  t('Housing Goal', 'Lengo la Nyumba'),
                  style: body(11, color: C.wino, weight: FontWeight.w700),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  decoration: BoxDecoration(
                    color: C.teal.withValues(alpha: .15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Icon(Icons.trending_up_rounded, size: 12, color: C.teal),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: 0.65,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(C.teal),
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                '65%',
                style: display(11, color: C.teal, weight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Step 4 Overlay: Ecosystem connected avatar bubbles
class _EcosystemOverlay extends StatelessWidget {
  const _EcosystemOverlay();

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: .94),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: .12),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _avatarItem('Alice M.', Icons.person_rounded),
            _connector(),
            _avatarItem('Juma K.', Icons.build_rounded),
            _connector(),
            _avatarItem('CRDB Bank', Icons.account_balance_rounded),
          ],
        ),
      ),
    );
  }

  Widget _avatarItem(String label, IconData icon) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: C.teal.withValues(alpha: .14),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 15, color: C.teal),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: body(10, color: C.wino, weight: FontWeight.w600),
        ),
      ],
    );
  }

  Widget _connector() {
    return Container(
      width: 18,
      height: 1.5,
      color: C.teal.withValues(alpha: .4),
    );
  }
}

// ---------------------------------------------------------------------------
// BRAND MARKS
// ---------------------------------------------------------------------------
class _PangaRibbonLogo extends StatelessWidget {
  const _PangaRibbonLogo({this.size = 54});
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _RibbonPainter(),
      ),
    );
  }
}

class _PangaMiniMark extends StatelessWidget {
  const _PangaMiniMark();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const _PangaRibbonLogo(size: 26),
        const SizedBox(width: 8),
        Text(
          'Panga',
          style: display(18, color: C.wino, weight: FontWeight.w800),
        ),
      ],
    );
  }
}

class _RibbonPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final glow = Paint()
      ..color = C.tealBright.withValues(alpha: .45)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10);

    final path1 = Path()
      ..moveTo(w * 0.18, h * 0.72)
      ..cubicTo(w * 0.22, h * 0.30, w * 0.38, h * 0.15, w * 0.50, h * 0.40)
      ..cubicTo(w * 0.60, h * 0.60, w * 0.75, h * 0.82, w * 0.84, h * 0.32);

    final paintGlow = Paint()
      ..shader = LinearGradient(
        colors: [C.tealBright, Color(0xFF38BDF8), Color(0xFF818CF8)],
      ).createShader(Rect.fromLTWH(0, 0, w, h))
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.16
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(path1, glow);
    canvas.drawPath(path1, paintGlow);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
