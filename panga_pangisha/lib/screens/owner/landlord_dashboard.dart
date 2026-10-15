import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../live.dart';
import '../../ui.dart';
import '../chat.dart';
import '../notifications.dart';
import '../owner.dart';
import 'properties.dart';
import 'rentals.dart';
import 'utilities_coming_soon.dart';
import '../profile.dart';
import '../veyora_assistant.dart';

/// Screen 10: Landlord Dashboard
class LandlordDashboardScreen extends StatefulWidget {
  const LandlordDashboardScreen({super.key, this.userName});
  final String? userName;

  @override
  State<LandlordDashboardScreen> createState() => _LandlordDashboardScreenState();
}

class _LandlordDashboardScreenState extends State<LandlordDashboardScreen> {
  int _tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: C.overlay,
      child: Scaffold(
        backgroundColor: C.chokaa,
        extendBody: true,
        body: _tabIndex == 0
            ? LandlordDashboardHomeView(userName: widget.userName)
            : _tabIndex == 1
                ? const OwnerHomeTab() // Screen 12: Properties
                : _tabIndex == 2
                    ? const TenantsTab() // Screen 15: Tenants / Viewings
                    : _tabIndex == 3
                        ? const MessagesTab() // Screen 19: Messages
                        : _tabIndex == 4
                            ? const UtilitiesComingSoonTab() // Screen 20: Utilities Coming Soon
                            : const ProfileTab(), // Screen 21: Account / Profile & Settings
        bottomNavigationBar: SafeArea(
          minimum: const EdgeInsets.fromLTRB(14, 0, 14, 10),
          child: Row(
            children: [
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
                          _navItem(0, Icons.home_rounded, t('Home', 'Mwanzo')),
                          _navItem(1, Icons.apartment_rounded, t('Properties', 'Nyumba')),
                          _navItem(2, Icons.people_outline_rounded, t('Tenants', 'Wapangaji')),
                          _navItem(3, Icons.chat_bubble_outline_rounded, t('Messages', 'Ujumbe')),
                          _navItem(4, Icons.water_drop_rounded, t('Utilities', 'Huduma')),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _accountSideButton(
                active: _tabIndex == 5,
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _tabIndex = 5);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _accountSideButton({required bool active, required VoidCallback onTap}) {
    return Semantics(
      button: true,
      selected: active,
      label: t('Account', 'Akaunti'),
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
                gradient: active
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
                  color: active
                      ? C.tealBright.withValues(alpha: 0.8)
                      : Colors.white.withValues(alpha: 0.22),
                  width: active ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: active
                        ? C.teal.withValues(alpha: 0.45)
                        : Colors.black.withValues(alpha: 0.20),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                  if (!active)
                    BoxShadow(
                      color: Colors.white.withValues(alpha: 0.08),
                      blurRadius: 1,
                      offset: const Offset(0, 0.5),
                    ),
                ],
              ),
              child: Center(
                child: Icon(
                  active ? Icons.person_rounded : Icons.person_outline_rounded,
                  color: active ? Colors.white : Colors.white.withValues(alpha: 0.75),
                  size: 21,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData icon, String label) {
    final active = _tabIndex == index;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => _tabIndex = index);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          decoration: BoxDecoration(
            color: active ? Colors.white.withValues(alpha: 0.18) : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: active
                ? Border.all(
                    color: Colors.white.withValues(alpha: 0.28),
                    width: 1,
                  )
                : null,
            boxShadow: active
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
                color: active ? Colors.white : Colors.white.withValues(alpha: 0.60),
                size: 18,
              ),
              const SizedBox(height: 2),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: body(
                    9.5,
                    weight: active ? FontWeight.w700 : FontWeight.w500,
                    color: active ? Colors.white : Colors.white.withValues(alpha: 0.60),
                    height: 1.1,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Screen 10 View: Modern Landlord Dashboard matching design requirements.
class LandlordDashboardHomeView extends StatefulWidget {
  const LandlordDashboardHomeView({super.key, this.userName});
  final String? userName;

  @override
  State<LandlordDashboardHomeView> createState() => _LandlordDashboardHomeViewState();
}

String greeting(int hour) => hour >= 5 && hour < 12
    ? t('Good morning', 'Habari za asubuhi')
    : hour >= 12 && hour < 17
    ? t('Good afternoon', 'Habari za mchana')
    : hour >= 17 && hour < 21
    ? t('Good evening', 'Habari za jioni')
    : t('Good night', 'Habari za usiku');

class _LandlordDashboardHomeViewState extends State<LandlordDashboardHomeView> with WidgetsBindingObserver {
  bool _loading = true;
  List<House> _homes = [];
  Map<String, dynamic> _rent = {};
  int _unread = 3;
  Timer? _clock;
  int _propertyPageIndex = 0;

  @override
  void initState() {
    super.initState();
    _load();
    Live.arrived.addListener(_loadUnread);
    WidgetsBinding.instance.addObserver(this);
    _clock = Timer.periodic(const Duration(minutes: 1), (_) => setState(() {}));
  }

  @override
  void dispose() {
    _clock?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    Live.arrived.removeListener(_loadUnread);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _load();
  }

  Future<dynamic> _try(Future<dynamic> Function() ask) async {
    try {
      return await ask();
    } on ApiError {
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> _load() async {
    if (Api.user.value == null) return setState(() => _loading = false);
    setState(() => _loading = true);
    final unread = _loadUnread();
    final [homes, rent] = await Future.wait<dynamic>([
      _try(() => Api.get('landlord/getAllHouses/')),
      _try(() => Api.get('rent-payments')),
    ]);
    await unread;
    if (!mounted) return;
    setState(() {
      if (homes is List) _homes = House.list(homes);
      if (rent is Map) _rent = Map<String, dynamic>.from(rent);
      _loading = false;
    });
  }

  Future<void> _loadUnread() async {
    final res = await _try(() => Api.get('notifications'));
    if (mounted && res is Map) {
      setState(() => _unread = res['unread'] ?? 3);
    }
  }

  Future<void> _go(Widget screen) async {
    await push(context, screen);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final user = Api.user.value;
    final fullName = '${widget.userName ?? user?['fullname'] ?? 'Ibrahim Kimaro'}';
    final now = DateTime.now();
    final hello = greeting(now.hour);

    num rent(String key) => _rent[key] is num ? _rent[key] : 0;
    final collected = rent('collected') > 0 ? rent('collected') : 4850000;
    final tenants = rent('tenants').toInt() > 0 ? rent('tenants').toInt() : 14;
    final paid = rent('tenants_paid').toInt() > 0 ? rent('tenants_paid').toInt() : 12;
    final vacant = tenants - paid > 0 ? tenants - paid : 2;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        top: false,
        bottom: false,
        child: CustomScrollView(
          physics: const ClampingScrollPhysics(),
          slivers: [
            // 1. Sleek Top Header (Dark Navy Container)
            SliverToBoxAdapter(
              child: _buildHeader(fullName, hello, user),
            ),

            if (_loading)
              SliverToBoxAdapter(
                child: LinearProgressIndicator(
                  minHeight: 2,
                  color: const Color(0xFF0284C7),
                  backgroundColor: Colors.transparent,
                ),
              ),

            // 2. 4 Metrics KPI Grid
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              sliver: SliverToBoxAdapter(
                child: _buildKpiGrid(collected, tenants, paid, vacant),
              ),
            ),

            // 3. Rent Collection Overview & Recent Alerts
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverToBoxAdapter(
                child: _buildRentCollectionOverview(collected),
              ),
            ),

            // 4. Recent Alerts Card
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverToBoxAdapter(
                child: _buildRecentAlertsCard(),
              ),
            ),

            // 5. Properties Overview Card
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverToBoxAdapter(
                child: _buildPropertiesOverviewCard(),
              ),
            ),

            // 6. Quick Actions Card
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverToBoxAdapter(
                child: _buildQuickActionsCard(),
              ),
            ),

            // 7. Utilities Summary Card
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverToBoxAdapter(
                child: _buildUtilitiesSummaryCard(),
              ),
            ),

            // 8. Recent Activity Card
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              sliver: SliverToBoxAdapter(
                child: _buildRecentActivityCard(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Top dark navy header with avatar, name, crown, notification bell, Veyora AI pill, and search bar.
  Widget _buildHeader(String fullName, String hello, Map<String, dynamic>? user) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 12, 20, 20),
      decoration: const BoxDecoration(
        color: Color(0xFF0F1E36),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar with white border ring
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2.2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: Image.asset(
                    'assets/images/placeholder.jpg',
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 50,
                      height: 50,
                      color: const Color(0xFF1E293B),
                      child: const Icon(Icons.person, color: Colors.white, size: 30),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // User Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$hello,',
                      style: body(12, color: const Color(0xFF94A3B8), weight: FontWeight.w400),
                    ),
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            fullName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: display(17, color: Colors.white, weight: FontWeight.w800),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text('👑', style: TextStyle(fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 1),
                    Text(
                      t('Landlord', 'Mwenye Nyumba'),
                      style: body(11.5, color: const Color(0xFFCBD5E1), weight: FontWeight.w600),
                    ),
                    Text(
                      'Better homes. Smarter living.',
                      style: body(10.5, color: const Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
              // Notification Bell
              GestureDetector(
                onTap: () async {
                  await push(context, const NotificationsScreen());
                  _loadUnread();
                },
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.20)),
                      ),
                      child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 20),
                    ),
                    Positioned(
                      right: -2,
                      top: -2,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFFEF4444),
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '$_unread',
                          style: const TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              // Veyora AI Pill Button
              GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  push(context, const VeyoraAssistantScreen());
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF06B6D4)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Text(
                            'AI',
                            style: TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w900),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'Veyora',
                            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                          Row(
                            children: [
                              Container(
                                width: 5,
                                height: 5,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 3),
                              const Text(
                                'Online',
                                style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          // White rounded search bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    t('Search properties, rooms, tenants...', 'Tafuta nyumba, vyumba, wapangaji...'),
                    style: body(13, color: const Color(0xFF94A3B8)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 4 KPI Metrics Grid (Total Properties, Total Tenants, Monthly Rent Collected, Utilities Total)
  Widget _buildKpiGrid(num collected, int tenants, int paid, int vacant) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                icon: Icons.home_rounded,
                iconBg: const Color(0xFF0284C7),
                title: t('Total Properties', 'Jumla ya Nyumba'),
                value: '${_homes.isNotEmpty ? _homes.length : 4}',
                subtitle: t('2 Houses • 2 Apartments', 'Nyumba 2 • Ghorofa 2'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                icon: Icons.people_alt_rounded,
                iconBg: const Color(0xFF8B5CF6),
                title: t('Total Tenants', 'Jumla ya Wapangaji'),
                value: '$tenants',
                subtitle: t('$paid Active • $vacant Vacant', '$paid Hai • $vacant Huru'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                icon: Icons.payments_rounded,
                iconBg: const Color(0xFF10B981),
                title: t('Monthly Rent Collected', 'Kodi Iliyokusanywa'),
                value: 'TZS ${NumberFormat('#,###').format(collected)}',
                subtitle: '↑ 12% vs last month',
                subtitleColor: const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                icon: Icons.bolt_rounded,
                iconBg: const Color(0xFF3B82F6),
                title: t('Utilities (Total)', 'Huduma (Jumla)'),
                value: '18,460 kWh',
                subtitle: '5,320 m³',
                subtitleColor: const Color(0xFF0284C7),
                isDualMetric: true,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required IconData icon,
    required Color iconBg,
    required String title,
    required String value,
    required String subtitle,
    Color? subtitleColor,
    bool isDualMetric = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: iconBg,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(height: 10),
          Text(title, style: body(11.5, color: const Color(0xFF64748B), weight: FontWeight.w500)),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value, style: display(isDualMetric ? 16 : 19, weight: FontWeight.w800)),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: body(
              isDualMetric ? 14 : 11,
              weight: isDualMetric ? FontWeight.w800 : FontWeight.w500,
              color: subtitleColor ?? const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }

  /// Rent Collection Overview Card with Progress bar and 31-day Bar Chart
  Widget _buildRentCollectionOverview(num collected) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_month_rounded, color: Color(0xFF0284C7), size: 18),
                  const SizedBox(width: 8),
                  Text(
                    t('Rent Collection Overview', 'Muhtasari wa Makusanyo'),
                    style: display(14.5, weight: FontWeight.w700),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Text(
                      t('This Month', 'Mwezi Huu'),
                      style: body(11, color: const Color(0xFF64748B), weight: FontWeight.w500),
                    ),
                    const SizedBox(width: 2),
                    const Icon(Icons.keyboard_arrow_down_rounded, size: 14, color: Color(0xFF64748B)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Total Collected
          Text(
            'TZS ${NumberFormat('#,###').format(collected)}',
            style: display(24, weight: FontWeight.w800),
          ),
          Text(
            t('Collected', 'Iliyokusanywa'),
            style: body(11.5, color: const Color(0xFF64748B)),
          ),
          const SizedBox(height: 10),
          // Target progress
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: 0.81,
              minHeight: 8,
              backgroundColor: const Color(0xFFF1F5F9),
              valueColor: const AlwaysStoppedAnimation(Color(0xFF10B981)),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            t('81% of TZS 6,000,000 target', '81% ya lengo la TZS 6,000,000'),
            style: body(11, color: const Color(0xFF10B981), weight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          // Daily Collection Bar Chart
          SizedBox(
            height: 110,
            child: _buildDailyBars(),
          ),
        ],
      ),
    );
  }

  Widget _buildDailyBars() {
    final days = [1, 5, 10, 15, 20, 25, 31];
    final sampleHeights = [
      0.35, 0.5, 0.4, 0.6, 0.3, 0.45, 0.55, 0.7, 0.4, 0.65,
      0.8, 0.5, 0.6, 0.4, 0.75, 0.55, 0.45, 0.7, 0.85, 0.6,
      0.5, 0.75, 0.65, 0.9, 0.7, 0.6, 0.8, 0.7, 0.5, 0.65, 0.6
    ];

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Y Axis Labels
        SizedBox(
          width: 24,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('6M', style: TextStyle(fontSize: 8.5, color: Color(0xFF94A3B8))),
              Text('4M', style: TextStyle(fontSize: 8.5, color: Color(0xFF94A3B8))),
              Text('2M', style: TextStyle(fontSize: 8.5, color: Color(0xFF94A3B8))),
              Text('0M', style: TextStyle(fontSize: 8.5, color: Color(0xFF94A3B8))),
            ],
          ),
        ),
        const SizedBox(width: 6),
        // Bars
        Expanded(
          child: Column(
            children: [
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: List.generate(31, (index) {
                    final hFactor = sampleHeights[index % sampleHeights.length];
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 1.2),
                        child: Container(
                          height: 80 * hFactor,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: [Color(0xFF0D9488), Color(0xFF10B981)],
                            ),
                            borderRadius: BorderRadius.circular(2.5),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 6),
              // X Axis Labels
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: days.map((d) => Text('$d', style: const TextStyle(fontSize: 8.5, color: Color(0xFF94A3B8)))).toList(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Recent Alerts Card
  Widget _buildRecentAlertsCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.notifications_active_outlined, color: Color(0xFF0284C7), size: 18),
                  const SizedBox(width: 8),
                  Text(
                    t('Recent Alerts', 'Arifa za Karibuni'),
                    style: display(14.5, weight: FontWeight.w700),
                  ),
                ],
              ),
              Text(
                t('View all →', 'Ona Zote →'),
                style: body(11.5, color: const Color(0xFF0284C7), weight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _alertItem(
            icon: Icons.arrow_upward_rounded,
            iconColor: Colors.white,
            iconBg: const Color(0xFFEF4444),
            title: t('Room 3 - High electricity usage', 'Chumba 3 - Matumizi makubwa ya umeme'),
            time: t('2 hours ago', 'Masaa 2 yaliyopita'),
          ),
          const SizedBox(height: 12),
          _alertItem(
            icon: Icons.water_drop_rounded,
            iconColor: Colors.white,
            iconBg: const Color(0xFF3B82F6),
            title: t('Room 2 - High water flow', 'Chumba 2 - Mtiririko mkubwa wa maji'),
            time: t('4 hours ago', 'Masaa 4 yaliyopita'),
          ),
          const SizedBox(height: 12),
          _alertItem(
            icon: Icons.warning_amber_rounded,
            iconColor: Colors.white,
            iconBg: const Color(0xFFF59E0B),
            title: t('Rent payment received', 'Malipo ya kodi yamepokelewa'),
            subtitle: 'Asha Msuya (Room 2)',
            time: t('6 hours ago', 'Masaa 6 yaliyopita'),
          ),
          const SizedBox(height: 12),
          _alertItem(
            icon: Icons.wifi_off_rounded,
            iconColor: Colors.white,
            iconBg: const Color(0xFF64748B),
            title: t('Room 5 - Device offline', 'Chumba 5 - Kifaa hakipo mtandaoni'),
            time: t('8 hours ago', 'Masaa 8 yaliyopita'),
          ),
        ],
      ),
    );
  }

  Widget _alertItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    String? subtitle,
    required String time,
  }) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: body(12.5, weight: FontWeight.w700)),
              if (subtitle != null)
                Text(subtitle, style: body(11, color: const Color(0xFF64748B))),
              Text(time, style: body(10.5, color: const Color(0xFF94A3B8))),
            ],
          ),
        ),
      ],
    );
  }

  /// Properties Overview Card with Horizontal Property Cards
  Widget _buildPropertiesOverviewCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.home_work_outlined, color: Color(0xFF0284C7), size: 18),
                  const SizedBox(width: 8),
                  Text(
                    t('Properties Overview', 'Muhtasari wa Nyumba'),
                    style: display(14.5, weight: FontWeight.w700),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => push(context, const OwnerHomeTab()),
                child: Text(
                  t('View all →', 'Ona Zote →'),
                  style: body(11.5, color: const Color(0xFF0284C7), weight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 180,
            child: PageView(
              onPageChanged: (i) => setState(() => _propertyPageIndex = i),
              children: [
                _propertyPreviewCard(
                  title: 'House 1 - Mikocheni',
                  location: 'Mikocheni, Dar es Salaam',
                  occupied: '3/3 Occupied',
                  rooms: '5 Rooms',
                  imageAsset: 'assets/images/placeholder.jpg',
                ),
                _propertyPreviewCard(
                  title: 'Apartment 1 - Upanga',
                  location: 'Upanga, Dar es Salaam',
                  occupied: '5/5 Occupied',
                  rooms: '5 Rooms',
                  imageAsset: 'assets/images/placeholder.jpg',
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(4, (index) {
              final active = index == _propertyPageIndex;
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: active ? 14 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: active ? const Color(0xFF0284C7) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _propertyPreviewCard({
    required String title,
    required String location,
    required String occupied,
    required String rooms,
    required String imageAsset,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
            child: Container(
              height: 95,
              width: double.infinity,
              color: const Color(0xFF1E293B),
              child: Image.asset(
                imageAsset,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: const Color(0xFF0F1E36),
                  child: const Center(
                    child: Icon(Icons.apartment, color: Colors.white, size: 40),
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: body(12.5, weight: FontWeight.w700)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 12, color: Color(0xFF64748B)),
                    const SizedBox(width: 2),
                    Text(location, style: body(11, color: const Color(0xFF64748B))),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        occupied,
                        style: const TextStyle(fontSize: 10, color: Color(0xFF059669), fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        rooms,
                        style: const TextStyle(fontSize: 10, color: Color(0xFF0284C7), fontWeight: FontWeight.w700),
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

  /// Quick Actions Card with vertical action list
  Widget _buildQuickActionsCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.bolt_rounded, color: Color(0xFF0284C7), size: 18),
              const SizedBox(width: 8),
              Text(
                t('Quick Actions', 'Hatua za Haraka'),
                style: display(14.5, weight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _quickActionRow(
            icon: Icons.add_home_rounded,
            label: t('Add New Property', 'Ongeza Nyumba Mpya'),
            onTap: () => _go(const AddHomeScreen()),
          ),
          _quickActionRow(
            icon: Icons.person_add_rounded,
            label: t('Add New Tenant', 'Ongeza Mpangaji Mpya'),
            onTap: () => push(context, const TenantsTab()),
          ),
          _quickActionRow(
            icon: Icons.credit_card_rounded,
            label: t('Record Rent Payment', 'Rekodi Malipo ya Kodi'),
            onTap: () => _go(const RentPaymentsScreen()),
          ),
          _quickActionRow(
            icon: Icons.description_outlined,
            label: t('Generate Report', 'Tengeneza Ripoti'),
            onTap: () => _go(const RentPaymentsScreen()),
          ),
          _quickActionRow(
            icon: Icons.speed_rounded,
            label: t('View Utility Readings', 'Tazama Vipimo vya Huduma'),
            onTap: () => push(context, const UtilitiesComingSoonTab()),
          ),
          _quickActionRow(
            icon: Icons.auto_awesome_rounded,
            label: t('Chat with Veyora (AI)', 'Zungumza na Veyora (AI)'),
            isAi: true,
            onTap: () => push(context, const VeyoraAssistantScreen()),
          ),
        ],
      ),
    );
  }

  Widget _quickActionRow({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isAi = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        child: Row(
          children: [
            Icon(icon, size: 20, color: isAi ? const Color(0xFF8B5CF6) : const Color(0xFF0284C7)),
            const SizedBox(width: 12),
            Expanded(
              child: Row(
                children: [
                  Text(
                    label,
                    style: body(
                      12.5,
                      weight: isAi ? FontWeight.w700 : FontWeight.w500,
                      color: isAi ? const Color(0xFF6D28D9) : const Color(0xFF1E293B),
                    ),
                  ),
                  if (isAi) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF8B5CF6).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        t('New', 'Mpya'),
                        style: const TextStyle(fontSize: 9.5, color: Color(0xFF8B5CF6), fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, size: 18, color: Color(0xFF94A3B8)),
          ],
        ),
      ),
    );
  }

  /// Utilities Summary Card with Electricity & Water Sparklines
  Widget _buildUtilitiesSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.water_drop_rounded, color: Color(0xFF0284C7), size: 18),
                  const SizedBox(width: 8),
                  Text(
                    t('Utilities Summary', 'Muhtasari wa Huduma'),
                    style: display(14.5, weight: FontWeight.w700),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Text(
                      t('This Month', 'Mwezi Huu'),
                      style: body(11, color: const Color(0xFF64748B), weight: FontWeight.w500),
                    ),
                    const SizedBox(width: 2),
                    const Icon(Icons.keyboard_arrow_down_rounded, size: 14, color: Color(0xFF64748B)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _utilitySparklineCard(
                  icon: Icons.electric_bolt_rounded,
                  iconColor: const Color(0xFF0284C7),
                  title: t('Electricity', 'Umeme'),
                  value: '12,480 kWh',
                  trend: '↑ 8% vs last month',
                  trendColor: const Color(0xFF10B981),
                  waveColor: const Color(0xFF38BDF8),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _utilitySparklineCard(
                  icon: Icons.water_drop_rounded,
                  iconColor: const Color(0xFF0284C7),
                  title: t('Water', 'Maji'),
                  value: '4,160 m³',
                  trend: '↑ 5% vs last month',
                  trendColor: const Color(0xFF10B981),
                  waveColor: const Color(0xFF10B981),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _utilitySparklineCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String value,
    required String trend,
    required Color trendColor,
    required Color waveColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 16, color: iconColor),
              ),
              const SizedBox(width: 8),
              Text(title, style: body(11.5, weight: FontWeight.w600, color: const Color(0xFF64748B))),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: display(15, weight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(trend, style: body(9.5, color: trendColor, weight: FontWeight.w600)),
          const SizedBox(height: 8),
          SizedBox(
            height: 24,
            width: double.infinity,
            child: CustomPaint(
              painter: _SparklinePainter(color: waveColor),
            ),
          ),
        ],
      ),
    );
  }

  /// Recent Activity Card
  Widget _buildRecentActivityCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.schedule_rounded, color: Color(0xFF0284C7), size: 18),
                  const SizedBox(width: 8),
                  Text(
                    t('Recent Activity', 'Shughuli za Karibuni'),
                    style: display(14.5, weight: FontWeight.w700),
                  ),
                ],
              ),
              Text(
                t('View all →', 'Ona Zote →'),
                style: body(11.5, color: const Color(0xFF0284C7), weight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _activityItem(
            icon: Icons.electric_bolt_rounded,
            iconBg: const Color(0xFFF59E0B),
            title: 'Rent received - Apartment 1 (Room 3)',
            time: '2 hours ago',
            status: 'Success',
            statusColor: const Color(0xFF10B981),
          ),
          const SizedBox(height: 10),
          _activityItem(
            icon: Icons.water_drop_rounded,
            iconBg: const Color(0xFF3B82F6),
            title: 'Water reading updated - House 2',
            time: '4 hours ago',
            status: 'In Progress',
            statusColor: const Color(0xFF0284C7),
          ),
          const SizedBox(height: 10),
          _activityItem(
            icon: Icons.warning_amber_rounded,
            iconBg: const Color(0xFFF59E0B),
            title: 'Maintenance request - Room 5',
            time: '6 hours ago',
            status: 'Pending',
            statusColor: const Color(0xFFF59E0B),
          ),
          const SizedBox(height: 10),
          _activityItem(
            icon: Icons.person_add_rounded,
            iconBg: const Color(0xFF10B981),
            title: 'New tenant registered - Asha Msuya',
            time: '1 day ago',
            status: 'Success',
            statusColor: const Color(0xFF10B981),
          ),
        ],
      ),
    );
  }

  Widget _activityItem({
    required IconData icon,
    required Color iconBg,
    required String title,
    required String time,
    required String status,
    required Color statusColor,
  }) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: iconBg.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconBg, size: 16),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(11.5, weight: FontWeight.w600)),
              Text(time, style: body(10, color: const Color(0xFF94A3B8))),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            status,
            style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}

/// Custom Sparkline wave painter for electricity & water cards
class _SparklinePainter extends CustomPainter {
  _SparklinePainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final path = Path();
    path.moveTo(0, size.height * 0.7);
    path.quadraticBezierTo(size.width * 0.25, size.height * 0.9, size.width * 0.5, size.height * 0.4);
    path.quadraticBezierTo(size.width * 0.75, size.height * 0.1, size.width, size.height * 0.5);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
