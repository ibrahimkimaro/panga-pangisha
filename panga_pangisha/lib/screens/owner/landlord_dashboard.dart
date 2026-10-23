import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../live.dart';
import '../../ui.dart';
import '../chat.dart';
import '../notifications.dart';
import '../listing.dart';
import '../owner.dart';
import 'properties.dart';
import 'rentals.dart';
import 'utilities_coming_soon.dart';
import '../profile.dart';
import '../veyora_assistant.dart';
import 'favorites_screen.dart';

/// Screen 10: Landlord Dashboard
class LandlordDashboardScreen extends StatefulWidget {
  const LandlordDashboardScreen({super.key, this.userName});
  final String? userName;

  @override
  State<LandlordDashboardScreen> createState() => _LandlordDashboardScreenState();
}

class _LandlordDashboardScreenState extends State<LandlordDashboardScreen> {
  int _tabIndex = 0;
  final GlobalKey<LandlordDashboardHomeViewState> _homeKey = GlobalKey<LandlordDashboardHomeViewState>();

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: C.overlay,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        extendBody: true,
        body: _tabIndex == 0
            ? LandlordDashboardHomeView(key: _homeKey, userName: widget.userName)
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
          minimum: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Container(
            height: 64,
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: Colors.white,
                width: 2,
              ),
              boxShadow: [
                // Primary Claymorphism Deep Drop Shadow
                BoxShadow(
                  color: const Color(0xFF0F1E36).withValues(alpha: 0.12),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                  spreadRadius: 1,
                ),
                // Ambient Soft Blue Clay Glow
                BoxShadow(
                  color: const Color(0xFF0284C7).withValues(alpha: 0.08),
                  blurRadius: 28,
                  offset: const Offset(0, 4),
                ),
                // Top Light Reflection Highlight
                const BoxShadow(
                  color: Colors.white,
                  blurRadius: 6,
                  offset: Offset(0, -3),
                ),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // 1. Home Feed
                _clayNavItem(
                  index: 0,
                  icon: _tabIndex == 0 ? Icons.home_rounded : Icons.home_outlined,
                  label: t('Home', 'Mwanzo'),
                ),
                // 2. Properties
                _clayNavItem(
                  index: 1,
                  icon: _tabIndex == 1 ? Icons.apartment_rounded : Icons.apartment_outlined,
                  label: t('Properties', 'Nyumba'),
                ),
                // 3. Center Claymorphic + Create Button (Instagram style!)
                _buildClayCenterAddButton(),
                // 4. Messages
                _clayNavItem(
                  index: 3,
                  icon: _tabIndex == 3 ? Icons.chat_bubble_rounded : Icons.chat_bubble_outline_rounded,
                  label: t('Messages', 'Ujumbe'),
                ),
                // 5. Account / Profile
                _clayNavItem(
                  index: 5,
                  icon: _tabIndex == 5 ? Icons.person_rounded : Icons.person_outline_rounded,
                  label: t('Account', 'Akaunti'),
                  isProfile: true,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Claymorphic Navigation Item with soft inflated press effect
  Widget _clayNavItem({
    required int index,
    required IconData icon,
    required String label,
    bool isProfile = false,
  }) {
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
          margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
          padding: const EdgeInsets.symmetric(vertical: 4),
          decoration: BoxDecoration(
            color: active ? const Color(0xFF0F1E36) : Colors.transparent,
            borderRadius: BorderRadius.circular(22),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: const Color(0xFF0F1E36).withValues(alpha: 0.30),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                    BoxShadow(
                      color: Colors.white.withValues(alpha: 0.20),
                      blurRadius: 2,
                      offset: const Offset(0, -1),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isProfile)
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: active ? Colors.white : const Color(0xFF94A3B8),
                      width: active ? 1.8 : 1.2,
                    ),
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/images/placeholder.jpg',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Icon(
                        icon,
                        size: 16,
                        color: active ? Colors.white : const Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                )
              else
                Icon(
                  icon,
                  color: active ? Colors.white : const Color(0xFF64748B),
                  size: 22,
                ),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: body(
                  9.5,
                  weight: active ? FontWeight.w800 : FontWeight.w500,
                  color: active ? Colors.white : const Color(0xFF64748B),
                  height: 1.0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Elevated 3D Puffy Claymorphism Center + Button (Instagram Style)
  Widget _buildClayCenterAddButton() {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _showCreateActionSheet(context),
      child: Container(
        width: 48,
        height: 48,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            // Deep Claymorphic Glow Shadow
            BoxShadow(
              color: const Color(0xFF0284C7).withValues(alpha: 0.45),
              blurRadius: 12,
              offset: const Offset(0, 6),
              spreadRadius: 1,
            ),
            // Top-Left Light Specular Highlight
            BoxShadow(
              color: Colors.white.withValues(alpha: 0.65),
              blurRadius: 5,
              offset: const Offset(-1, -2),
            ),
            // Bottom ambient shadow
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.85),
            width: 1.8,
          ),
        ),
        child: const Center(
          child: Icon(
            Icons.add_rounded,
            color: Colors.white,
            size: 26,
          ),
        ),
      ),
    );
  }

  /// Instagram-style Creator Action Sheet
  void _showCreateActionSheet(BuildContext context) {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 24,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4.5,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.add_box_rounded, color: Color(0xFF0284C7), size: 22),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('Create & Post', 'Weka & Chapisha'),
                      style: display(16, weight: FontWeight.w800, color: const Color(0xFF0F1E36)),
                    ),
                    Text(
                      t('Share opportunities or add properties', 'Gawa fursa au ongeza nyumba mpya'),
                      style: body(11.5, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            _clayActionTile(
              icon: Icons.dynamic_feed_rounded,
              color: const Color(0xFF0284C7),
              title: t('Post Opportunity to Feed', 'Chapisha Fursa kwenye Mlisho'),
              subtitle: t('Seeking investors, tenants, or JV partners', 'Tafuta mwekezaji, wapangaji, au ubia'),
              onTap: () {
                Navigator.pop(ctx);
                if (_tabIndex != 0) {
                  setState(() => _tabIndex = 0);
                }
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  _homeKey.currentState?.openPostOpportunityModal(context);
                });
              },
            ),
            const SizedBox(height: 10),
            _clayActionTile(
              icon: Icons.add_home_rounded,
              color: const Color(0xFF10B981),
              title: t('Add New Property (Wizard)', 'Ongeza Nyumba Mpya (Wizard)'),
              subtitle: t('List new units, photos, and rent prices', 'Weka vyumba, picha, na bei ya kodi'),
              onTap: () {
                Navigator.pop(ctx);
                push(context, const AddHomeScreen());
              },
            ),
            const SizedBox(height: 10),
            _clayActionTile(
              icon: Icons.people_alt_rounded,
              color: const Color(0xFF8B5CF6),
              title: t('Manage Tenants & Viewings', 'Simamia Wapangaji na Ukaguzi'),
              subtitle: t('View tenant agreements, rent, and leases', 'Tazama mikataba na malipo ya wapangaji'),
              onTap: () {
                Navigator.pop(ctx);
                setState(() => _tabIndex = 2);
              },
            ),
            const SizedBox(height: 10),
            _clayActionTile(
              icon: Icons.speed_rounded,
              color: const Color(0xFFF59E0B),
              title: t('Utility Readings & STS Meters', 'Vipimo vya Maji na Umeme'),
              subtitle: t('Prepaid tokens and sub-meter status', 'Angalia mita za LUKU na maji'),
              onTap: () {
                Navigator.pop(ctx);
                setState(() => _tabIndex = 4);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _clayActionTile({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 3),
            ),
            const BoxShadow(
              color: Colors.white,
              blurRadius: 3,
              offset: Offset(0, -1),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: body(12.5, weight: FontWeight.w700, color: const Color(0xFF0F1E36))),
                  Text(subtitle, style: body(11, color: const Color(0xFF64748B))),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 18),
          ],
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
  State<LandlordDashboardHomeView> createState() => LandlordDashboardHomeViewState();
}

String greeting(int hour) => hour >= 5 && hour < 12
    ? t('Good morning', 'Habari za asubuhi')
    : hour >= 12 && hour < 17
    ? t('Good afternoon', 'Habari za mchana')
    : hour >= 17 && hour < 21
    ? t('Good evening', 'Habari za jioni')
    : t('Good night', 'Habari za usiku');

class LandlordDashboardHomeViewState extends State<LandlordDashboardHomeView> with WidgetsBindingObserver {
  void openPostOpportunityModal(BuildContext context) => _showPostOpportunityModal(context);
  bool _loading = true;
  List<House> _homes = [];
  int _unread = 3;
  Timer? _clock;

  // Airbnb feed & category filter state
  String _selectedCategory = 'all'; // 'all', 'my_properties', 'house', 'investor', 'tenant', 'partnership'
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  final Set<String> _savedPostIds = {};

  late List<OpportunityItem> _opportunities;

  @override
  void initState() {
    super.initState();
    _opportunities = _getInitialOpportunities();
    _load();
    Live.arrived.addListener(_loadUnread);
    WidgetsBinding.instance.addObserver(this);
    _clock = Timer.periodic(const Duration(minutes: 1), (_) => setState(() {}));
  }

  @override
  void dispose() {
    _searchController.dispose();
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
    final [homes, _] = await Future.wait<dynamic>([
      _try(() => Api.get('landlord/getAllHouses/')),
      _try(() => Api.refreshUser()),
    ]);
    await unread;
    if (!mounted) return;
    setState(() {
      if (homes is List) _homes = House.list(homes);
      _loading = false;
    });
  }

  Future<void> _loadUnread() async {
    final res = await _try(() => Api.get('notifications'));
    if (mounted && res is Map) {
      setState(() => _unread = res['unread'] ?? 3);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Api.user.value;
    final fullName = '${widget.userName ?? user?['fullname'] ?? 'Ibrahim Kimaro'}';
    final now = DateTime.now();
    final hello = greeting(now.hour);

    final filteredPosts = _getFilteredOpportunities();
    final filteredHomes = _getFilteredHomes();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        top: false,
        bottom: false,
        child: CustomScrollView(
          physics: const ClampingScrollPhysics(),
          slivers: [
            // 1. Sleek Airbnb-Style Top Header
            SliverToBoxAdapter(
              child: _buildHeader(fullName, hello, user),
            ),

            if (_loading)
              const SliverToBoxAdapter(
                child: LinearProgressIndicator(
                  minHeight: 2,
                  color: Color(0xFF0284C7),
                  backgroundColor: Colors.transparent,
                ),
              ),

            // 2. Category Filtering Buttons Bar
            SliverToBoxAdapter(
              child: _buildFilterTabsBar(),
            ),

            // 3. Airbnb Opportunity & Property Feed
            if (_selectedCategory == 'my_properties') ...[
              if (filteredHomes.isEmpty)
                SliverToBoxAdapter(
                  child: _buildEmptyFeedState(),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 120),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return _buildAirbnbHouseCard(filteredHomes[index]);
                      },
                      childCount: filteredHomes.length,
                    ),
                  ),
                ),
            ] else ...[
              if (filteredPosts.isEmpty)
                SliverToBoxAdapter(
                  child: _buildEmptyFeedState(),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 120),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return _buildAirbnbOpportunityCard(filteredPosts[index]);
                      },
                      childCount: filteredPosts.length,
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  /// Modern Instagram/Listing-style top bar matching feed aesthetics
  Widget _buildHeader(String fullName, String hello, Map<String, dynamic>? user) {
    return Container(
      padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 8, 16, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: const Color(0xFFF1F5F9), width: 1.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: Avatar + Brand title + Action icons (Post, AI, Notifications, Chat)
          Row(
            children: [
              // Landlord Avatar (Clean Airbnb Host style)
              GestureDetector(
                onTap: () => push(context, const ProfileTab()),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/images/placeholder.jpg',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: const Color(0xFF0F1E36),
                        child: const Icon(Icons.person, color: Colors.white, size: 22),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Brand & Greeting Title
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        RichText(
                          text: TextSpan(
                            style: display(18, weight: FontWeight.w900, color: const Color(0xFF0F1E36)),
                            children: const [
                              TextSpan(text: 'Panga'),
                              TextSpan(
                                text: 'Pangisha',
                                style: TextStyle(color: Color(0xFF0284C7)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text('👑', style: TextStyle(fontSize: 13)),
                      ],
                    ),
                    Text(
                      '$hello, $fullName',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: body(11.5, color: const Color(0xFF64748B), weight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              // Veyora AI Pill Button
              GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  push(context, const VeyoraAssistantScreen());
                },
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Center(
                    child: Container(
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
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Notification Bell with badge
              GestureDetector(
                onTap: () async {
                  await push(context, const NotificationsScreen());
                  _loadUnread();
                },
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: const Icon(Icons.notifications_outlined, color: Color(0xFF1E293B), size: 19),
                    ),
                    if (_unread > 0)
                      Positioned(
                        right: -1,
                        top: -1,
                        child: Container(
                          padding: const EdgeInsets.all(3.5),
                          decoration: const BoxDecoration(
                            color: Color(0xFFEF4444),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '$_unread',
                            style: const TextStyle(fontSize: 8.5, color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Favorite Button (Heart) - Opens Favorites Details Screen
              GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  push(context, const FavoritesScreen());
                },
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.favorite_rounded,
                      color: Color(0xFFEF4444),
                      size: 19,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              const LangSwitch(dark: false),
            ],
          ),
          const SizedBox(height: 12),
          // Seamless Airbnb-style Rounded Search Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
              style: body(13, color: const Color(0xFF1E293B)),
              decoration: InputDecoration(
                border: InputBorder.none,
                isDense: true,
                icon: const Icon(Icons.search_rounded, color: Color(0xFF0F1E36), size: 20),
                hintText: t('Where to? Search properties, locations, deals...', 'Tafuta nyumba, maeneo, fursa...'),
                hintStyle: body(12.5, color: const Color(0xFF94A3B8)),
                suffixIcon: _searchQuery.isNotEmpty
                    ? GestureDetector(
                        onTap: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                        child: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF64748B)),
                      )
                    : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // AIRBNB-STYLE OPPORTUNITY & PROPERTY FEED COMPONENTS
  // =========================================================================

  List<OpportunityItem> _getFilteredOpportunities() {
    return _opportunities.where((opp) {
      final matchesCategory = _selectedCategory == 'all' || opp.category == _selectedCategory;
      if (!matchesCategory) return false;
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery;
      return opp.title.toLowerCase().contains(q) ||
          opp.description.toLowerCase().contains(q) ||
          opp.authorName.toLowerCase().contains(q) ||
          opp.authorLocation.toLowerCase().contains(q) ||
          opp.tags.any((tag) => tag.toLowerCase().contains(q));
    }).toList();
  }

  List<House> _getFilteredHomes() {
    if (_searchQuery.isEmpty) return _homes;
    final q = _searchQuery;
    return _homes.where((h) {
      return h.name.toLowerCase().contains(q) ||
          h.district.toLowerCase().contains(q) ||
          h.ward.toLowerCase().contains(q) ||
          h.type.toLowerCase().contains(q);
    }).toList();
  }

  /// Modern Airbnb-Style Filtering Tabs Bar (All Deals, My Properties, Houses, Investors, Tenants, JVs)
  Widget _buildFilterTabsBar() {
    final categories = [
      {
        'id': 'all',
        'label': t('All Deals', 'Zote'),
        'icon': Icons.explore_rounded,
        'count': _opportunities.length,
      },
      {
        'id': 'my_properties',
        'label': t('My Properties', 'Nyumba Zangu'),
        'icon': Icons.home_work_rounded,
        'count': _homes.length,
      },
      {
        'id': 'house',
        'label': t('Townhouses & Units', 'Nyumba & Miradi'),
        'icon': Icons.apartment_rounded,
        'count': _opportunities.where((o) => o.category == 'house').length,
      },
      {
        'id': 'investor',
        'label': t('Capital & Angels', 'Wawekezaji'),
        'icon': Icons.monetization_on_rounded,
        'count': _opportunities.where((o) => o.category == 'investor').length,
      },
      {
        'id': 'tenant',
        'label': t('Tenant Demands', 'Wapangaji'),
        'icon': Icons.person_pin_circle_rounded,
        'count': _opportunities.where((o) => o.category == 'tenant').length,
      },
      {
        'id': 'partnership',
        'label': t('Joint Ventures', 'Ubia'),
        'icon': Icons.handshake_rounded,
        'count': _opportunities.where((o) => o.category == 'partnership').length,
      },
    ];

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        child: Row(
          children: categories.map((cat) {
            final isSelected = _selectedCategory == cat['id'];
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: InkWell(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedCategory = cat['id'] as String);
                },
                borderRadius: BorderRadius.circular(24),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8.5),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF0F1E36) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF0F1E36) : const Color(0xFFE2E8F0),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isSelected ? 0.12 : 0.02),
                        blurRadius: isSelected ? 6 : 3,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        cat['icon'] as IconData,
                        size: 15,
                        color: isSelected ? Colors.white : const Color(0xFF64748B),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        cat['label'] as String,
                        style: body(
                          12,
                          weight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? Colors.white : const Color(0xFF334155),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? Colors.white.withValues(alpha: 0.20)
                              : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${cat['count']}',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  /// Empty Feed State
  Widget _buildEmptyFeedState() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 30),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: const BoxDecoration(
              color: Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.search_off_rounded, color: Color(0xFF94A3B8), size: 30),
          ),
          const SizedBox(height: 14),
          Text(
            t('No listings or opportunities found', 'Hakuna nyumba au fursa zilizopatikana'),
            style: display(15, weight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(
            t('Try clearing your search query or selecting a different category filter.',
                'Jaribu kufuta utafutaji wako au chagua kichujio kingine cha fursa.'),
            textAlign: TextAlign.center,
            style: body(12, color: const Color(0xFF64748B)),
          ),
          const SizedBox(height: 16),
          TextButton.icon(
            onPressed: () {
              _searchController.clear();
              setState(() {
                _searchQuery = '';
                _selectedCategory = 'all';
              });
            },
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: Text(t('Reset Filters', 'Weka Upya Vichujio')),
          ),
        ],
      ),
    );
  }

  /// Airbnb-Style Opportunity Card (Simple, Reliable, Low-Noise)
  Widget _buildAirbnbOpportunityCard(OpportunityItem post) {
    final isSaved = _savedPostIds.contains(post.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          push(
            context,
            OpportunityDetailsScreen(
              post: post,
              onPitch: () => _showPitchModal(context, post),
              onShare: () => _showShareModal(context, post),
            ),
          );
        },
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Airbnb-Style Photo with Top-Left Badge & Top-Right Heart
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: AspectRatio(
                    aspectRatio: 16 / 10.5,
                    child: Container(
                      color: const Color(0xFFF1F5F9),
                      child: Image.asset(
                        post.imageAsset,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Color(0xFF0F1E36), Color(0xFF1E293B)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                          child: const Center(
                            child: Icon(Icons.apartment_rounded, color: Colors.white, size: 48),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                // Top-Left Floating Badge
                Positioned(
                  top: 12,
                  left: 12,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        color: Colors.black.withValues(alpha: 0.55),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(post.badgeIcon, color: Colors.white, size: 12.5),
                            const SizedBox(width: 4.5),
                            Text(
                              post.badgeText,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // Top-Right Floating Heart Button
                Positioned(
                  top: 12,
                  right: 12,
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        if (isSaved) {
                          _savedPostIds.remove(post.id);
                        } else {
                          _savedPostIds.add(post.id);
                          toast(context, t('Saved to your saved deals! 📌', 'Imehifadhiwa! 📌'));
                        }
                      });
                    },
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.92),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.12),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        isSaved ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        color: isSaved ? const Color(0xFFFF385C) : const Color(0xFF1E293B),
                        size: 20,
                      ),
                    ),
                  ),
                ),

                // Bottom-Right Highlight Pill
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      post.highlightPill,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // 2. Airbnb Typography below Photo (Quiet, Clean, No Noise)
            Padding(
              padding: const EdgeInsets.only(top: 10, left: 2, right: 2),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title + Rating
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          post.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: display(14.5, weight: FontWeight.w700, color: const Color(0xFF0F1E36)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, size: 16, color: Color(0xFF0F1E36)),
                          const SizedBox(width: 3),
                          Text(
                            '4.95',
                            style: body(12.5, weight: FontWeight.w700, color: const Color(0xFF0F1E36)),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),

                  // Location & Author
                  Text(
                    '${post.authorLocation} · ${post.authorName}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: body(12.5, color: const Color(0xFF64748B), weight: FontWeight.w400),
                  ),
                  const SizedBox(height: 2),

                  // Description line
                  Text(
                    post.description,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: body(12.5, color: const Color(0xFF94A3B8), weight: FontWeight.w400),
                  ),
                  const SizedBox(height: 4),

                  // Price
                  RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: post.metrics['Monthly Rent'] ?? post.metrics['Capital'] ?? 'TZS 650,000',
                          style: display(14.5, weight: FontWeight.w800, color: const Color(0xFF0F1E36)),
                        ),
                        TextSpan(
                          text: post.category == 'investor'
                              ? ' ${t('budget', 'bajeti')}'
                              : ' ${t('/ month', '/ mwezi')}',
                          style: body(12.5, color: const Color(0xFF475569), weight: FontWeight.w400),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Airbnb-Style House Card for Landlord's Properties
  Widget _buildAirbnbHouseCard(House house) {
    return ValueListenableBuilder<Set<int>>(
      valueListenable: saved,
      builder: (context, savedSet, _) {
        final isFav = savedSet.contains(house.id);
        final coverUrl = house.photos.isNotEmpty ? house.photos.first : '';

        return Container(
          margin: const EdgeInsets.only(bottom: 24),
          child: InkWell(
            onTap: () {
              HapticFeedback.selectionClick();
              push(context, ListingScreen(house, heroTag: 'landlord_house_${house.id}'));
            },
            borderRadius: BorderRadius.circular(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Photo
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: AspectRatio(
                        aspectRatio: 16 / 10.5,
                        child: Container(
                          color: const Color(0xFFF1F5F9),
                          child: coverUrl.isNotEmpty
                              ? Image.network(
                                  coverUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    color: const Color(0xFF0F1E36),
                                    child: const Center(
                                      child: Icon(Icons.home_work_rounded, color: Colors.white, size: 48),
                                    ),
                                  ),
                                )
                              : Image.asset(
                                  'assets/images/discover_terrace.jpg',
                                  fit: BoxFit.cover,
                                ),
                        ),
                      ),
                    ),

                    // Top-Left Badge
                    Positioned(
                      top: 12,
                      left: 12,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            color: Colors.black.withValues(alpha: 0.55),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.verified_rounded, color: Color(0xFF38BDF8), size: 12.5),
                                const SizedBox(width: 4.5),
                                Text(
                                  house.status == 'available'
                                      ? t('Available', 'Ipo Wazi')
                                      : house.status.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Top-Right Heart Button
                    Positioned(
                      top: 12,
                      right: 12,
                      child: GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          toggleSaved(house.id);
                        },
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.92),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.12),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Icon(
                            isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                            color: isFav ? const Color(0xFFFF385C) : const Color(0xFF1E293B),
                            size: 20,
                          ),
                        ),
                      ),
                    ),

                    // Bottom-Right Units Count
                    if (house.units.isNotEmpty)
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${house.units.length} ${t('Units', 'Vyumba')}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),

                // Details below photo
                Padding(
                  padding: const EdgeInsets.only(top: 10, left: 2, right: 2),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              house.name.isNotEmpty ? house.name : 'Listing #${house.id}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: display(14.5, weight: FontWeight.w700, color: const Color(0xFF0F1E36)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star_rounded, size: 16, color: Color(0xFF0F1E36)),
                              const SizedBox(width: 3),
                              Text(
                                house.verifiedAt != null ? '4.98' : '4.85',
                                style: body(12.5, weight: FontWeight.w700, color: const Color(0xFF0F1E36)),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${house.district}, ${house.ward} · ${house.type.isNotEmpty ? house.type : t('Residential', 'Makazi')}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: body(12.5, color: const Color(0xFF64748B), weight: FontWeight.w400),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${house.bedrooms} ${t('bed', 'vyumba')} · ${house.bathrooms} ${t('bath', 'bafu')}${house.amenities.isNotEmpty ? ' · ${house.amenities.take(2).join(', ')}' : ''}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: body(12.5, color: const Color(0xFF94A3B8), weight: FontWeight.w400),
                      ),
                      const SizedBox(height: 4),
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: tzs(house.rent),
                              style: display(14.5, weight: FontWeight.w800, color: const Color(0xFF0F1E36)),
                            ),
                            TextSpan(
                              text: ' ${t('/ month', '/ mwezi')}',
                              style: body(12.5, color: const Color(0xFF475569), weight: FontWeight.w400),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // =========================================================================
  // INTERACTIVE MODALS & BOTTOM SHEETS
  // =========================================================================

  /// Connect & Pitch Proposal Modal
  void _showPitchModal(BuildContext context, OpportunityItem post) {
    String? selectedProperty = _homes.isNotEmpty ? _homes.first.name : 'House 1 - Mikocheni';
    final noteController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) {
          return Container(
            padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.of(modalCtx).viewInsets.bottom),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundImage: AssetImage(post.imageAsset),
                        backgroundColor: const Color(0xFF0F1E36),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              post.authorName,
                              style: display(14, weight: FontWeight.w800),
                            ),
                            Text(
                              post.badgeText,
                              style: body(11, color: post.badgeColor, weight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    t('Select Your Property to Pitch:', 'Chagua Nyumba Yako ya Kuwasilisha:'),
                    style: body(12, weight: FontWeight.w700, color: const Color(0xFF1E293B)),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (_homes.isNotEmpty)
                        ..._homes.map((h) {
                          final isChosen = selectedProperty == h.name;
                          return ChoiceChip(
                            label: Text(h.name),
                            selected: isChosen,
                            onSelected: (_) => setModalState(() => selectedProperty = h.name),
                            selectedColor: const Color(0xFF0F1E36),
                            labelStyle: TextStyle(
                              color: isChosen ? Colors.white : const Color(0xFF1E293B),
                              fontWeight: FontWeight.w600,
                              fontSize: 11.5,
                            ),
                          );
                        })
                      else ...[
                        ChoiceChip(
                          label: const Text('House 1 - Mikocheni (6 Units)'),
                          selected: selectedProperty == 'House 1 - Mikocheni',
                          onSelected: (_) => setModalState(() => selectedProperty = 'House 1 - Mikocheni'),
                          selectedColor: const Color(0xFF0F1E36),
                          labelStyle: TextStyle(
                            color: selectedProperty == 'House 1 - Mikocheni' ? Colors.white : const Color(0xFF1E293B),
                            fontWeight: FontWeight.w600,
                            fontSize: 11.5,
                          ),
                        ),
                        ChoiceChip(
                          label: const Text('Apartment 2 - Upanga (4 Units)'),
                          selected: selectedProperty == 'Apartment 2 - Upanga',
                          onSelected: (_) => setModalState(() => selectedProperty = 'Apartment 2 - Upanga'),
                          selectedColor: const Color(0xFF0F1E36),
                          labelStyle: TextStyle(
                            color: selectedProperty == 'Apartment 2 - Upanga' ? Colors.white : const Color(0xFF1E293B),
                            fontWeight: FontWeight.w600,
                            fontSize: 11.5,
                          ),
                        ),
                        ChoiceChip(
                          label: const Text('+ Unlisted Land / Project'),
                          selected: selectedProperty == 'unlisted',
                          onSelected: (_) => setModalState(() => selectedProperty = 'unlisted'),
                          selectedColor: const Color(0xFF0F1E36),
                          labelStyle: TextStyle(
                            color: selectedProperty == 'unlisted' ? Colors.white : const Color(0xFF1E293B),
                            fontWeight: FontWeight.w600,
                            fontSize: 11.5,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    t('Proposal Message or Terms:', 'Ujumbe wa Mapendekezo au Masharti:'),
                    style: body(12, weight: FontWeight.w700, color: const Color(0xFF1E293B)),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: noteController,
                    maxLines: 3,
                    style: body(12.5),
                    decoration: InputDecoration(
                      hintText: t(
                        'E.g. We have an uncompleted 6-unit apartment with approved permits. Looking for TZS 300M completion capital...',
                        'Mfano: Tuna nyumba ya ghorofa yenye vyumba 6 na vibali vyote. Tunahitaji mtaji wa TZS 300M wa umaliziaji...',
                      ),
                      hintStyle: body(11.5, color: const Color(0xFF94A3B8)),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        toast(
                          context,
                          t('Proposal sent to ${post.authorName}! 🚀',
                              'Pendekezo limetumwa kwa ${post.authorName}! 🚀'),
                        );
                        push(
                          context,
                          ChatScreen(
                            name: post.authorName,
                            photo: null,
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0284C7),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(
                        t('Send Proposal & Start Chat', 'Tuma Pendekezo & Anzisha Maongezi'),
                        style: display(13, weight: FontWeight.w800, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Post Opportunity Modal
  void _showPostOpportunityModal(BuildContext context) {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    final metricController = TextEditingController();
    String selectedCat = 'house';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) {
          return Container(
            padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.of(modalCtx).viewInsets.bottom),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    t('Post a Landlord Opportunity', 'Weka Fursa ya Mmiliki wa Nyumba'),
                    style: display(16, weight: FontWeight.w800),
                  ),
                  const SizedBox(height: 14),
                  Text(t('Opportunity Type:', 'Aina ya Fursa:'), style: body(11.5, weight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      ChoiceChip(
                        label: Text(t('House / Units', 'Nyumba')),
                        selected: selectedCat == 'house',
                        onSelected: (_) => setModalState(() => selectedCat = 'house'),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: Text(t('Seeking Investor', 'Natafuta Mwekezaji')),
                        selected: selectedCat == 'investor',
                        onSelected: (_) => setModalState(() => selectedCat = 'investor'),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: Text(t('Joint Venture', 'Ubia')),
                        selected: selectedCat == 'partnership',
                        onSelected: (_) => setModalState(() => selectedCat = 'partnership'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: titleController,
                    style: body(13),
                    decoration: InputDecoration(
                      labelText: t('Headline / Title', 'Kichwa cha Fursa'),
                      hintText: t('E.g. 4-Unit Apartment for Acquisition in Masaki', 'Mfano: Nyumba ya vyumba 4 Masaki'),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descController,
                    maxLines: 3,
                    style: body(13),
                    decoration: InputDecoration(
                      labelText: t('Details & Description', 'Maelezo kamili'),
                      hintText: t('Describe units, projected rent, features...', 'Eleza vyumba, kodi, huduma...'),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: metricController,
                    style: body(13),
                    decoration: InputDecoration(
                      labelText: t('Key Highlight (e.g. Budget / Price)', 'Kiwango cha Bei / Mtaji'),
                      hintText: 'TZS 350M • 14% Yield',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F1E36),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () {
                        if (titleController.text.trim().isEmpty) return;
                        final newPost = OpportunityItem(
                          id: 'custom_${DateTime.now().millisecondsSinceEpoch}',
                          category: selectedCat,
                          authorName: widget.userName ?? 'Ibrahim Kimaro',
                          authorRole: 'Verified Landlord',
                          authorLocation: 'Dar es Salaam',
                          authorAvatar: 'assets/images/placeholder.jpg',
                          timeAgo: 'Just now',
                          badgeText: selectedCat == 'investor'
                              ? 'Investor Wanted'
                              : selectedCat == 'partnership'
                                  ? 'Joint Venture'
                                  : 'Featured Property',
                          badgeColor: const Color(0xFF0284C7),
                          badgeIcon: Icons.home_work_rounded,
                          highlightPill: metricController.text.trim().isNotEmpty
                              ? metricController.text.trim()
                              : 'New Deal',
                          highlightColor: const Color(0xFF10B981),
                          imageAsset: 'assets/images/discover_terrace.jpg',
                          title: titleController.text.trim(),
                          description: descController.text.trim().isNotEmpty
                              ? descController.text.trim()
                              : 'Contact landlord for complete specifications and inspection.',
                          metrics: {
                            'Status': 'Active',
                            'Location': 'Dar es Salaam',
                          },
                          tags: ['#NewListing', '#PangaPangisha'],
                          ctaLabel: 'Contact Landlord',
                          ctaIcon: Icons.mail_outline_rounded,
                        );
                        setState(() {
                          _opportunities.insert(0, newPost);
                        });
                        Navigator.pop(ctx);
                        toast(context, t('Opportunity published to feed! 🌟', 'Fursa imechapishwa kwenye mlisho! 🌟'));
                      },
                      child: Text(t('Publish Opportunity', 'Chapisha Fursa'), style: display(13.5, color: Colors.white, weight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Share Modal
  void _showShareModal(BuildContext context, OpportunityItem post) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(22),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 16),
            Text(t('Share Opportunity', 'Gawa Fursa'), style: display(15, weight: FontWeight.w800)),
            const SizedBox(height: 14),
            ListTile(
              leading: const CircleAvatar(backgroundColor: Color(0xFF0284C7), child: Icon(Icons.link_rounded, color: Colors.white)),
              title: Text(t('Copy Opportunity Link', 'Nakili Kiungo cha Fursa')),
              onTap: () {
                Navigator.pop(ctx);
                toast(context, t('Link copied to clipboard! 📋', 'Kiungo kimenakiliwa! 📋'));
              },
            ),
            ListTile(
              leading: const CircleAvatar(backgroundColor: Color(0xFF10B981), child: Icon(Icons.chat_rounded, color: Colors.white)),
              title: Text(t('Share via WhatsApp', 'Tuma kupitia WhatsApp')),
              onTap: () {
                Navigator.pop(ctx);
                toast(context, t('Opening WhatsApp...', 'Inafungua WhatsApp...'));
              },
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // INITIAL OPPORTUNITY DATA
  // =========================================================================

  List<OpportunityItem> _getInitialOpportunities() {
    return [
      const OpportunityItem(
        id: 'inv_1',
        category: 'investor',
        authorName: 'Dr. Salim Bakari (Apex Capital)',
        authorRole: 'Private Equity & Real Estate Angel',
        authorLocation: 'Dar es Salaam, Masaki',
        authorAvatar: 'assets/images/save_piggy.jpg',
        isVerified: true,
        timeAgo: '2h ago',
        badgeText: 'Equity Investor',
        badgeColor: Color(0xFF8B5CF6),
        badgeIcon: Icons.monetization_on_rounded,
        highlightPill: 'Capital: TZS 750M Max',
        highlightColor: Color(0xFF8B5CF6),
        imageAsset: 'assets/images/save_piggy.jpg',
        title: 'Seeking Stalled or Ongoing Multi-Unit Residential Builds for Finishings Financing',
        description:
            'Looking to partner with reliable landlords who have ongoing or stalled residential builds in Mikocheni, Sinza, or Kinondoni. We inject turnkey capital for interior finishings, smart STS sub-metering, and modern kitchens in exchange for structured revenue share or equity buy-in. Minimum 4-unit structures.',
        metrics: {
          'Capital': 'TZS 750M Max',
          'Target': '4–12 Units',
          'Location': 'Dar es Salaam',
          'Structure': 'Equity / Revenue Share',
        },
        tags: ['#InvestorOpportunity', '#ApartmentFinancing', '#DarLandlords', '#CapitalPartner'],
        ctaLabel: 'Pitch Your Property to Dr. Salim',
        ctaIcon: Icons.handshake_rounded,
      ),
      const OpportunityItem(
        id: 'hse_1',
        category: 'house',
        authorName: 'Upanga Heights Realty',
        authorRole: 'Exclusive Landlord Listing',
        authorLocation: 'Mikocheni B, Dar es Salaam',
        authorAvatar: 'assets/images/discover_terrace.jpg',
        isVerified: true,
        timeAgo: '4h ago',
        badgeText: 'Turnkey Townhouse',
        badgeColor: Color(0xFF0284C7),
        badgeIcon: Icons.apartment_rounded,
        highlightPill: 'TZS 4.5M/mo • 100% Tenanted',
        highlightColor: Color(0xFF10B981),
        imageAsset: 'assets/images/discover_terrace.jpg',
        title: 'Turnkey 6-Unit Modern Gated Townhouse Complex with Steady Cash Flow',
        description:
            'Fully occupied residential compound generating steady monthly income. Each unit has separate LUKU prepaid electricity, borehole water reserves with smart filtration, dedicated parking, and 24/7 security. Owner relocating abroad; open to verified landlord takeover or co-ownership.',
        metrics: {
          'Monthly Rent': 'TZS 4.5M',
          'Units': '6 Units (2-Bed)',
          'Occupancy': '100% (All Paid)',
          'Net Yield': '14.2% p.a.',
        },
        tags: ['#MikocheniProperty', '#HighYield', '#TurnkeyRental', '#CashFlowPositive'],
        ctaLabel: 'Request Full Property Schedule',
        ctaIcon: Icons.assignment_outlined,
      ),
      const OpportunityItem(
        id: 'ten_1',
        category: 'tenant',
        authorName: 'AfriRelocate Corporate Housing',
        authorRole: 'Expat & Diplomatic Agency',
        authorLocation: 'Oysterbay / Msasani',
        authorAvatar: 'assets/images/welcome_hero.jpg',
        isVerified: true,
        timeAgo: '5h ago',
        badgeText: 'Corporate Demand',
        badgeColor: Color(0xFF10B981),
        badgeIcon: Icons.people_alt_rounded,
        highlightPill: '2-Yr Lease • 12 Mo Advance',
        highlightColor: Color(0xFF059669),
        imageAsset: 'assets/images/welcome_hero.jpg',
        title: 'Urgent: Seeking 4 Furnished 2-3 Bedroom Apartments for International NGO Mission',
        description:
            'Urgent tenant placement for European NGO mission arriving next month. Requirements: Gated security, standby generator, reliable water storage, in Masaki, Oysterbay, or Upanga. Rent guaranteed directly by the mission in USD/TZS with 12 months advance.',
        metrics: {
          'Budget': 'TZS 3.5M–4.5M/unit',
          'Advance': '1 Year Upfront',
          'Units Req.': '4 Apartments',
          'Move-in': 'Next Month',
        },
        tags: ['#CorporateTenants', '#DiplomaticLease', '#GuaranteedRent', '#UpfrontAdvance'],
        ctaLabel: 'Submit Your Vacant Units',
        ctaIcon: Icons.send_rounded,
      ),
      const OpportunityItem(
        id: 'inv_2',
        category: 'investor',
        authorName: 'Zanzibar & Coast Angel Syndicate',
        authorRole: 'Diaspora Real Estate Fund',
        authorLocation: 'Dar es Salaam & Zanzibar',
        authorAvatar: 'assets/images/connect_ecosystem.jpg',
        isVerified: true,
        timeAgo: '1d ago',
        badgeText: 'Co-Development',
        badgeColor: Color(0xFFF59E0B),
        badgeIcon: Icons.architecture_rounded,
        highlightPill: 'TZS 1.2 Billion Fund',
        highlightColor: Color(0xFFD97706),
        imageAsset: 'assets/images/connect_ecosystem.jpg',
        title: 'Vertical Extension Capital: We Fund Extra Floors & Rooftop Studio Apartments',
        description:
            'We specialize in vertical extension financing. If your building foundation is structurally certified for additional floors (1-2 extra stories of studios/1-bedrooms), we fully fund architectural approvals, lightweight steel construction, and leasing operations under structured revenue share.',
        metrics: {
          'Ticket Size': 'TZS 150M – 400M',
          'Payback': '3.5 Years',
          'Est. IRR': '18% p.a.',
          'Engineering': 'Full Turnkey',
        },
        tags: ['#RooftopDevelopment', '#VerticalExpansion', '#CoInvestment', '#SmartLandlord'],
        ctaLabel: 'Check Building Eligibility',
        ctaIcon: Icons.domain_add_rounded,
      ),
      const OpportunityItem(
        id: 'hse_2',
        category: 'house',
        authorName: 'Peninsula Living Estates',
        authorRole: 'Verified Landlord Developer',
        authorLocation: 'Masaki Peninsula, Dar es Salaam',
        authorAvatar: 'assets/images/manage_bg.jpg',
        isVerified: true,
        timeAgo: '1d ago',
        badgeText: 'Luxury Villa',
        badgeColor: Color(0xFF0D9488),
        badgeIcon: Icons.villa_rounded,
        highlightPill: 'TZS 5.8M/mo • Beachside',
        highlightColor: Color(0xFF0F766E),
        imageAsset: 'assets/images/manage_bg.jpg',
        title: '4-Bedroom Luxury Smart-Villa with Swimming Pool & Standby Solar Invertor',
        description:
            'Prime residential asset in Masaki close to Golden Tulip. Equipped with integrated smart IoT energy monitoring, backup solar invertor, guardhouse, and domestic quarters. Suitable for ambassadorial residence or luxury short/long-term leasing.',
        metrics: {
          'Rental Value': 'TZS 5.8M/mo',
          'Bedrooms': '4 Ensuite',
          'Amenities': 'Pool • Solar • CCTV',
          'Area': 'Masaki Peninsula',
        },
        tags: ['#MasakiVilla', '#LuxuryRental', '#SmartHome', '#ExpatsChoice'],
        ctaLabel: 'View Virtual Tour & Details',
        ctaIcon: Icons.explore_outlined,
      ),
      const OpportunityItem(
        id: 'prt_1',
        category: 'partnership',
        authorName: 'Veyora Smart Building Systems',
        authorRole: 'IoT & Utility Partner',
        authorLocation: 'Tanzania National',
        authorAvatar: 'assets/images/discover_terrace.jpg',
        isVerified: true,
        timeAgo: '2d ago',
        badgeText: 'Utility Upgrade',
        badgeColor: Color(0xFF0284C7),
        badgeIcon: Icons.bolt_rounded,
        highlightPill: '0 Upfront Cost • STS Meters',
        highlightColor: Color(0xFF0284C7),
        imageAsset: 'assets/images/discover_terrace.jpg',
        title: 'Free Smart Prepaid Water & STS Electricity Sub-Meter Installation for 5+ Unit Properties',
        description:
            'Eliminate utility tenant disputes forever! We install digital STS-compliant prepaid split meters for every room or unit with zero initial equipment fee. Tenants buy tokens directly via M-Pesa/Airtel Money; landlord receives net payouts automatically.',
        metrics: {
          'Install Cost': 'TZS 0 Free',
          'Dispute Drop': '99%',
          'Payout': 'Daily via M-Pesa',
          'Units Min': '5 Units',
        },
        tags: ['#SmartMeters', '#PrepaidWater', '#LandlordTech', '#PangaPangisha'],
        ctaLabel: 'Book Free Building Inspection',
        ctaIcon: Icons.speed_rounded,
      ),
    ];
  }
}

class OpportunityItem {
  final String id;
  final String category; // 'investor', 'house', 'tenant', 'partnership'
  final String authorName;
  final String authorRole;
  final String authorLocation;
  final String authorAvatar;
  final bool isVerified;
  final String timeAgo;
  final String badgeText;
  final Color badgeColor;
  final IconData badgeIcon;
  final String highlightPill;
  final Color highlightColor;
  final String imageAsset;
  final String title;
  final String description;
  final Map<String, String> metrics;
  final List<String> tags;
  final String ctaLabel;
  final IconData ctaIcon;

  const OpportunityItem({
    required this.id,
    required this.category,
    required this.authorName,
    required this.authorRole,
    required this.authorLocation,
    required this.authorAvatar,
    this.isVerified = true,
    required this.timeAgo,
    required this.badgeText,
    required this.badgeColor,
    required this.badgeIcon,
    required this.highlightPill,
    required this.highlightColor,
    required this.imageAsset,
    required this.title,
    required this.description,
    required this.metrics,
    required this.tags,
    required this.ctaLabel,
    required this.ctaIcon,
  });
}

class OpportunityDetailsScreen extends StatefulWidget {
  final OpportunityItem post;
  final VoidCallback onPitch;
  final VoidCallback? onShare;

  const OpportunityDetailsScreen({
    super.key,
    required this.post,
    required this.onPitch,
    this.onShare,
  });

  @override
  State<OpportunityDetailsScreen> createState() => _OpportunityDetailsScreenState();
}

class _OpportunityDetailsScreenState extends State<OpportunityDetailsScreen> {
  bool _isSaved = false;

  @override
  Widget build(BuildContext context) {
    final post = widget.post;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // Hero Photo Header
              SliverAppBar(
                expandedHeight: 320,
                pinned: true,
                elevation: 0,
                backgroundColor: const Color(0xFF0F1E36),
                automaticallyImplyLeading: false,
                leading: Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: Center(
                    child: ClipOval(
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          width: 38,
                          height: 38,
                          color: Colors.white.withValues(alpha: 0.9),
                          child: IconButton(
                            icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F1E36), size: 20),
                            onPressed: () => Navigator.pop(context),
                            padding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                actions: [
                  Center(
                    child: ClipOval(
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          width: 38,
                          height: 38,
                          color: Colors.white.withValues(alpha: 0.9),
                          child: IconButton(
                            icon: const Icon(Icons.share_outlined, color: Color(0xFF0F1E36), size: 19),
                            onPressed: () {
                              if (widget.onShare != null) {
                                widget.onShare!();
                              } else {
                                toast(context, t('Link copied to clipboard! 📋', 'Kiungo kimenakiliwa! 📋'));
                              }
                            },
                            padding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Center(
                    child: ClipOval(
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          width: 38,
                          height: 38,
                          color: Colors.white.withValues(alpha: 0.9),
                          child: IconButton(
                            icon: Icon(
                              _isSaved ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                              color: _isSaved ? const Color(0xFFFF385C) : const Color(0xFF0F1E36),
                              size: 20,
                            ),
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              setState(() => _isSaved = !_isSaved);
                              toast(
                                context,
                                _isSaved
                                    ? t('Saved to your favorites! 📌', 'Imehifadhiwa! 📌')
                                    : t('Removed from favorites', 'Imeondolewa'),
                              );
                            },
                            padding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.asset(
                        post.imageAsset,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: const Color(0xFF0F1E36),
                          child: const Center(
                            child: Icon(Icons.apartment_rounded, color: Colors.white, size: 64),
                          ),
                        ),
                      ),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.35),
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.5),
                            ],
                            stops: const [0.0, 0.5, 1.0],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 20,
                        bottom: 20,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(post.badgeIcon, size: 14, color: post.badgeColor),
                              const SizedBox(width: 6),
                              Text(
                                post.badgeText,
                                style: TextStyle(
                                  color: post.badgeColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Content Sliver
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      Text(
                        post.title,
                        style: display(22, weight: FontWeight.w800, color: const Color(0xFF0F1E36)),
                      ),
                      const SizedBox(height: 8),

                      // Location, Rating, Time
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 17, color: Color(0xFF0F1E36)),
                          const SizedBox(width: 3),
                          Text(
                            '4.95',
                            style: body(13, weight: FontWeight.w700, color: const Color(0xFF0F1E36)),
                          ),
                          const SizedBox(width: 8),
                          Text('·', style: body(13, color: const Color(0xFF94A3B8))),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '${post.authorLocation} · ${post.timeAgo}',
                              style: body(13, color: const Color(0xFF64748B), weight: FontWeight.w500),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                      ),

                      // Host / Author profile banner
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 26,
                            backgroundImage: AssetImage(post.authorAvatar),
                            backgroundColor: const Color(0xFFF1F5F9),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      t('Posted by ', 'Imewekwa na '),
                                      style: body(12, color: const Color(0xFF64748B)),
                                    ),
                                    Flexible(
                                      child: Text(
                                        post.authorName,
                                        style: display(14.5, weight: FontWeight.w700, color: const Color(0xFF0F1E36)),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (post.isVerified) ...[
                                      const SizedBox(width: 4),
                                      const Icon(Icons.verified_rounded, size: 15, color: Color(0xFF0284C7)),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  post.authorRole,
                                  style: body(12, color: const Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                      ),

                      // Highlights Section
                      Text(
                        t('Deal Highlights', 'Vivutio vya Fursa'),
                        style: display(16, weight: FontWeight.w800, color: const Color(0xFF0F1E36)),
                      ),
                      const SizedBox(height: 14),
                      _buildDetailHighlightRow(
                        icon: post.badgeIcon,
                        title: post.badgeText,
                        subtitle: t('Category verified on Panga Pangisha Landlord Hub', 'Aina imethibitishwa kwenye mtandao'),
                      ),
                      const SizedBox(height: 14),
                      _buildDetailHighlightRow(
                        icon: Icons.monetization_on_outlined,
                        title: post.highlightPill,
                        subtitle: t('Estimated capital / budget expectation', 'Makadirio ya mtaji au kodi inayotarajiwa'),
                      ),
                      const SizedBox(height: 14),
                      _buildDetailHighlightRow(
                        icon: Icons.shield_outlined,
                        title: t('Direct Verified Party', 'Mhusika Aliyethibitishwa'),
                        subtitle: t('No middleman broker fees, direct communication', 'Hakuna madalali, mawasiliano ya moja kwa moja'),
                      ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                      ),

                      // Overview & Full Description
                      Text(
                        t('About this Opportunity', 'Kuhusu Fursa Hii'),
                        style: display(16, weight: FontWeight.w800, color: const Color(0xFF0F1E36)),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        post.description,
                        style: body(14, color: const Color(0xFF334155), height: 1.6),
                      ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                      ),

                      // Key Specifications / Metrics Grid
                      Text(
                        t('Key Specifications', 'Sifa Kuu za Fursa'),
                        style: display(16, weight: FontWeight.w800, color: const Color(0xFF0F1E36)),
                      ),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: post.metrics.entries.map((entry) {
                          return Container(
                            width: (MediaQuery.of(context).size.width - 52) / 2,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  entry.key,
                                  style: body(11, color: const Color(0xFF64748B), weight: FontWeight.w600),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  entry.value,
                                  style: display(13.5, weight: FontWeight.w800, color: const Color(0xFF0F1E36)),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 100), // Space for sticky bottom bar
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Sticky Airbnb Bottom Bar
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(20, 14, 20, 14 + MediaQuery.of(context).padding.bottom),
              decoration: BoxDecoration(
                color: Colors.white,
                border: const Border(
                  top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          post.metrics['Monthly Rent'] ?? post.metrics['Capital'] ?? post.highlightPill,
                          style: display(15.5, weight: FontWeight.w800, color: const Color(0xFF0F1E36)),
                        ),
                        Text(
                          post.category == 'investor'
                              ? t('Target capital ticket', 'Kiwango cha mtaji')
                              : t('Per month · Direct agreement', 'Kwa mwezi · Mkataba wa moja kwa moja'),
                          style: body(11.5, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      widget.onPitch();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F1E36),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    icon: Icon(post.ctaIcon, size: 18, color: Colors.white),
                    label: Text(
                      t('Connect & Pitch', 'Wasilisha / Ungana'),
                      style: display(13, weight: FontWeight.w700, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailHighlightRow({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 20, color: const Color(0xFF0F1E36)),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: display(13.5, weight: FontWeight.w700, color: const Color(0xFF0F1E36)),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: body(12, color: const Color(0xFF64748B)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

