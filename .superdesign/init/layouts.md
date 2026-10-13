# Layouts

## App shell and floating bottom navigation
`panga_pangisha/lib/screens/shell.dart`. Five tabs for a landlord: Home, Properties, Tenants, Messages in a dark frosted pill (height 52, radius 26), and a separate round Account button (52) to its right. The bar floats 10px above the bottom edge with 14px side margins; content scrolls under it.
```dart
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api.dart';
import '../l10n.dart';
import '../ui.dart';
import 'chat.dart';
import 'explore.dart';
import 'map.dart';
import 'owner/properties.dart';
import 'owner/rentals.dart';
import 'owner/landlord_dashboard.dart';
import 'profile.dart';

/// The signed-in app: a set of tabs for the active workspace, renter or owner.
class Shell extends StatefulWidget {
  const Shell({super.key});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _at = 0;
  final _opened = {0}; // tabs are built the first time they are visited

  @override
  Widget build(BuildContext context) {
    final tabs = Api.isOwner
        ? [
            (
              Icons.home_rounded,
              t('Home', 'Mwanzo'),
              const LandlordDashboardHomeView(),
            ),
            (
              Icons.apartment_rounded,
              t('Properties', 'Nyumba'),
              const OwnerHomeTab(),
            ),
            (
              Icons.people_outline_rounded,
              t('Tenants', 'Wapangaji'),
              const TenantsTab(),
            ),
            (
              Icons.chat_bubble_outline_rounded,
              t('Messages', 'Ujumbe'),
              const MessagesTab(),
            ),
            (
              Icons.person_outline_rounded,
              t('Account', 'Akaunti'),
              const ProfileTab(),
            ),
          ]
        : [
            (Icons.search_rounded, t('Explore', 'Tafuta'), const ExploreTab()),
            (Icons.map_outlined, t('Map', 'Ramani'), const MapTab()),
            (
              Icons.favorite_border_rounded,
              t('Saved', 'Zilizohifadhiwa'),
              const SavedTab(),
            ),
            (
              Icons.chat_bubble_outline_rounded,
              t('Messages', 'Ujumbe'),
              const MessagesTab(),
            ),
            (
              Icons.person_outline_rounded,
              t('Account', 'Akaunti'),
              const ProfileTab(),
            ),
          ];

    return PopScope(
      canPop: _at == 0,
      onPopInvokedWithResult: (popped, _) {
        if (!popped) setState(() => _at = 0);
      },
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        // Hidden tabs stay in the tree, so the status bar style is decided here, for the visible one.
        value: tabs[_at].$3 is ProfileTab
            ? SystemUiOverlayStyle.light
            : C.overlay,
        child: Scaffold(
          extendBody: true,
          resizeToAvoidBottomInset: false,
          body: Stack(
            children: [
              for (var i = 0; i < tabs.length; i++)
                if (_opened.contains(i))
                  IgnorePointer(
                    ignoring: i != _at,
                    child: AnimatedOpacity(
                      opacity: i == _at ? 1 : 0,
                      duration: const Duration(milliseconds: 220),
                      curve: Curves.easeOut,
                      child: TickerMode(
                        enabled: i == _at,
                        child: ExcludeSemantics(
                          excluding: i != _at,
                          child: tabs[i].$3,
                        ),
                      ),
                    ),
                  ),
            ],
          ),
          bottomNavigationBar: SafeArea(
            minimum: const EdgeInsets.fromLTRB(14, 0, 14, 10),
            child: Row(
              children: [
                // 1. Sleek Frosted Glass Floating Navigation Bar (Tabs 0..3)
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(26),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                      child: Container(
                        height: 52,
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              const Color(0xFF16181D).withValues(alpha: 0.55),
                              C.wino.withValues(alpha: 0.38),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(26),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.22),
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.20),
                              blurRadius: 20,
                              offset: const Offset(0, 6),
                            ),
                            BoxShadow(
                              color: Colors.white.withValues(alpha: 0.08),
                              blurRadius: 1,
                              offset: const Offset(0, 0.5),
                            ),
                          ],
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            for (var i = 0; i < 4; i++)
                              _TabButton(
                                icon: tabs[i].$1,
                                label: tabs[i].$2,
                                on: i == _at,
                                onTap: () {
                                  HapticFeedback.selectionClick();
                                  setState(() {
                                    _at = i;
                                    _opened.add(i);
                                  });
                                },
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // 2. Circular Frosted Glass Floating Account Button (Tab 4)
                _AccountSideButton(
                  on: _at == 4,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() {
                      _at = 4;
                      _opened.add(4);
                    });
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Frosted Glass Tab Button: Active tab gets a sleek rounded glass pill highlight
class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.icon,
    required this.label,
    required this.on,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Semantics(
        button: true,
        selected: on,
        label: label,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            decoration: BoxDecoration(
              color: on
                  ? Colors.white.withValues(alpha: 0.18)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(20),
              border: on
                  ? Border.all(
                      color: Colors.white.withValues(alpha: 0.28),
                      width: 1,
                    )
                  : null,
              boxShadow: on
                  ? [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.10),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 2),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  size: 18,
                  color: on ? Colors.white : Colors.white.withValues(alpha: 0.60),
                ),
                const SizedBox(height: 2),
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: body(
                      9.5,
                      color: on ? Colors.white : Colors.white.withValues(alpha: 0.60),
                      weight: on ? FontWeight.w700 : FontWeight.w500,
                      height: 1.1,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Circular Frosted Glass Independent Account Button (Profile tab)
class _AccountSideButton extends StatelessWidget {
  const _AccountSideButton({
    required this.on,
    required this.onTap,
  });

  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: on,
      label: 'Account',
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: onTap,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: on
                    ? LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          C.teal.withValues(alpha: 0.85),
                          C.teal.withValues(alpha: 0.60),
                        ],
                      )
                    : LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          const Color(0xFF16181D).withValues(alpha: 0.55),
                          C.wino.withValues(alpha: 0.38),
                        ],
                      ),
                border: Border.all(
                  color: on
                      ? C.tealBright.withValues(alpha: 0.8)
                      : Colors.white.withValues(alpha: 0.22),
                  width: on ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: on
                        ? C.teal.withValues(alpha: 0.45)
                        : Colors.black.withValues(alpha: 0.20),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                  if (!on)
                    BoxShadow(
                      color: Colors.white.withValues(alpha: 0.08),
                      blurRadius: 1,
                      offset: const Offset(0, 0.5),
                    ),
                ],
              ),
              child: Center(
                child: Icon(
                  on ? Icons.person_rounded : Icons.person_outline_rounded,
                  color: on ? Colors.white : Colors.white.withValues(alpha: 0.75),
                  size: 21,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

## Screen frame for pushed landlord screens (`_Page`)
`panga_pangisha/lib/screens/owner/rentals.dart`: round back button, title with a line under it, round action icons on the right, body, one full-width primary button pinned at the bottom.
```dart
/// The frame these screens share: the soft backdrop, a title with a line under it, and one main button.
class _Page extends StatelessWidget {
  const _Page({required this.title, this.sub, this.actions = const [], required this.child, this.button, this.back = true});
  final String title;
  final String? sub;
  final List<Widget> actions;
  final Widget child;
  final Widget? button;
  final bool back; // false for a tab of the shell, which has its own Scaffold

  @override
  Widget build(BuildContext context) {
    final page = GlassBackdrop(
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(back ? 14 : 20, 12, 16, 10),
              child: Row(
                children: [
                  if (back) ...[
                    RoundIcon(Icons.arrow_back_rounded, label: t('Back', 'Rudi'), onTap: () => Navigator.pop(context)),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: display(back ? 19 : 22, weight: FontWeight.w800)),
                        if (sub != null) Text(sub!, style: body(12.5, color: C.muted, height: 1.3)),
                      ],
                    ),
                  ),
                  for (final a in actions) Padding(padding: const EdgeInsets.only(left: 8), child: a),
                ],
              ),
            ),
            Expanded(child: child),
            if (button != null) SafeArea(top: false, child: Padding(padding: const EdgeInsets.fromLTRB(20, 6, 20, 12), child: button)),
          ],
        ),
      ),
    );
    return back ? Scaffold(body: page) : page;
  }
}
```
