import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../l10n.dart';
import '../../ui.dart';

/// Screens 2, 3, 4: Landlord Welcome Details / Onboarding Tour
class LandlordWelcomeScreen extends StatefulWidget {
  const LandlordWelcomeScreen({super.key, this.userName});
  final String? userName;

  @override
  State<LandlordWelcomeScreen> createState() => _LandlordWelcomeScreenState();
}

class _LandlordWelcomeScreenState extends State<LandlordWelcomeScreen> {
  final _pages = PageController();
  int _activePage = 0;

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  void _finish() {
    HapticFeedback.mediumImpact();
    // Screen 10, the landlord dashboard, is already waiting underneath: close the setup screens.
    Navigator.of(context).popUntil((r) => r.isFirst);
  }

  void _next() {
    HapticFeedback.selectionClick();
    if (_activePage == 2) {
      _finish();
    } else {
      _pages.nextPage(
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final slides = [
      (
        title: t('Manage your properties\nwith confidence', 'Simamia nyumba zako\nkwa uhakika na amani'),
        desc: t(
          'Track tenants, handle payments, manage maintenance and grow your rental business — all in one place.',
          'Fuatilia wapangaji, pokea malipo, simamia ukarabati na kukuza biashara yako ya makazi — yote mahali pamoja.',
        ),
        image: 'assets/images/welcome_hero.jpg',
      ),
      (
        title: t('Find, manage &\nexpand your portfolio', 'Gundua, simamia na\nkuza miradi yako'),
        desc: t(
          'Add properties, view on map, connect with tenants and access all your tools in one app.',
          'Weka nyumba mpya, tazama kwenye ramani, wasiliana na wapangaji na tumia vifaa vyote kwenye app moja.',
        ),
        image: 'assets/images/discover_terrace.jpg',
      ),
      (
        title: t('Get paid,\nstay informed', 'Lipwa kwa wakati,\npata taarifa sahihi'),
        desc: t(
          'Track rent, view reports, receive notifications and keep everything organized.',
          'Fuatilia kodi ya pango, tazama ripoti za fedha, pata taarifa za papo kwa hapo na weka kila kitu sawa.',
        ),
        image: 'assets/images/save_piggy.jpg',
      ),
    ];

    final isLast = _activePage == 2;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: C.overlay,
      child: Scaffold(
        backgroundColor: C.card,
        body: SafeArea(
          child: Column(
            children: [
              // Top Bar with Skip
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    const Spacer(),
                    TextButton(
                      onPressed: _finish,
                      child: Text(
                        t('Skip', 'Ruka'),
                        style: body(14.5, color: C.muted, weight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),

              // PageView Slides
              Expanded(
                child: PageView.builder(
                  controller: _pages,
                  itemCount: slides.length,
                  onPageChanged: (i) => setState(() => _activePage = i),
                  itemBuilder: (context, i) {
                    final s = slides[i];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Top visual container with arched corners
                          Expanded(
                            flex: 6,
                            child: Center(
                              child: Container(
                                width: double.infinity,
                                constraints: const BoxConstraints(maxHeight: 320),
                                clipBehavior: Clip.antiAlias,
                                decoration: const BoxDecoration(
                                  borderRadius: BorderRadius.only(
                                    topLeft: Radius.circular(32),
                                    topRight: Radius.circular(32),
                                    bottomLeft: Radius.circular(32),
                                    bottomRight: Radius.circular(68),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black12,
                                      blurRadius: 18,
                                      offset: Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: Image.asset(
                                  s.image,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 20),

                          // Titles
                          Expanded(
                            flex: 4,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  s.title,
                                  style: display(26, color: C.wino, weight: FontWeight.w800),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  s.desc,
                                  style: body(15, color: C.muted, height: 1.45),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Bottom Progress Bar & Button
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
                child: Row(
                  children: [
                    // 3 Animated Dots
                    Row(
                      children: [
                        for (int i = 0; i < 3; i++)
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOutCubic,
                            margin: const EdgeInsets.only(right: 6),
                            width: i == _activePage ? 22 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: i == _activePage ? C.teal : const Color(0xFFD1D5DB),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                      ],
                    ),

                    const Spacer(),

                    // Next / Get Started button
                    Press(
                      onTap: _next,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
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
                              isLast ? t('Go to Dashboard', 'Fungua Dashibodi') : t('Next →', 'Endelea →'),
                              style: body(14.5, color: Colors.white, weight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
