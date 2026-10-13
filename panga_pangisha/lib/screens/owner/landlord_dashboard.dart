import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
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
import '../profile.dart';
import '../profile_edit_screens.dart';

extension on Widget {
  Widget smoothIn([int order = 0]) {
    if (Platform.environment.containsKey('FLUTTER_TEST')) return this;
    return animate(delay: (60 * order).ms)
        .fadeIn(duration: 350.ms, curve: Curves.easeOut)
        .slideY(begin: 0.05, end: 0, curve: Curves.easeOutCubic);
  }
}

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
                        : const ProfileTab(), // Screen 20: Account / Profile & Settings
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
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _accountSideButton(
                active: _tabIndex == 4,
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _tabIndex = 4);
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

/// Screen 10 View: what a landlord sees first. Every figure on it comes from the server.
class LandlordDashboardHomeView extends StatefulWidget {
  const LandlordDashboardHomeView({super.key, this.userName});
  final String? userName;

  @override
  State<LandlordDashboardHomeView> createState() => _LandlordDashboardHomeViewState();
}

/// The greeting for an hour on the phone's clock: morning from 5, afternoon from 12, evening from 17, night from 21.
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
  List<Map<String, dynamic>> _viewings = [];
  Map<String, dynamic> _rent = {}; // this month's rent and the last six months, as the server counts them
  int _repairs = 0; // repair requests not resolved yet
  int _unread = 0;
  String _business = 'none'; // none | pending | approved | rejected
  Timer? _clock;

  @override
  void initState() {
    super.initState();
    _load();
    Live.arrived.addListener(_loadUnread); // something that arrives now moves the bell
    WidgetsBinding.instance.addObserver(this);
    _clock = Timer.periodic(const Duration(minutes: 1), (_) => setState(() {})); // the greeting follows the clock
  }

  @override
  void dispose() {
    _clock?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    Live.arrived.removeListener(_loadUnread);
    super.dispose();
  }

  /// No pull-to-refresh here: the figures refresh themselves when the app comes back to the front.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _load();
  }

  /// One failed request leaves its part of the screen as it was; the rest still fills in.
  Future<dynamic> _try(Future<dynamic> Function() ask) async {
    try {
      return await ask();
    } on ApiError {
      return null;
    }
  }

  Future<void> _load() async {
    if (Api.user.value == null) return setState(() => _loading = false);
    setState(() => _loading = true);
    final unread = _loadUnread();
    final [homes, viewings, business, rent, repairs] = await Future.wait<dynamic>([
      _try(() => Api.get('landlord/getAllHouses/')),
      _try(() => Api.get('viewing-requests', {'as': 'owner'})),
      _try(() => Api.get('business')),
      _try(() => Api.get('rent-payments')),
      _try(() => Api.get('maintenance')),
    ]);
    await unread;
    if (!mounted) return;
    setState(() {
      if (homes is List) _homes = House.list(homes);
      if (viewings is List) _viewings = [for (final v in viewings) Map<String, dynamic>.from(v)];
      if (business is Map) _business = '${business['status'] ?? 'none'}';
      if (rent is Map) _rent = Map<String, dynamic>.from(rent);
      if (repairs is List) _repairs = repairs.where((m) => m['status'] != 'resolved').length;
      _loading = false;
    });
  }

  Future<void> _loadUnread() async {
    final res = await _try(() => Api.get('notifications'));
    if (mounted && res is Map) setState(() => _unread = res['unread'] ?? 0);
  }

  /// Opens a screen and refreshes the figures on the way back: something probably changed in there.
  Future<void> _go(Widget screen) async {
    await push(context, screen);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final user = Api.user.value;
    final fullName = '${widget.userName ?? user?['fullname'] ?? ''}';
    final firstName = fullName.split(' ').first;
    final now = DateTime.now();
    final hello = greeting(now.hour);

    final live = _homes.where((h) => h.status == 'available').length;
    final asking = _homes.where((h) => h.status == 'available' || h.status == 'rented').fold<double>(0, (sum, h) => sum + h.rent);
    final stale = _homes.where((h) => h.status == 'available' && h.stale).length;
    final waiting = _viewings.where((v) => v['status'] == 'pending').length;
    final byRent = [..._homes]..sort((a, b) => b.rent.compareTo(a.rent));
    num rent(String key) => _rent[key] is num ? _rent[key] : 0;
    final collected = rent('collected'), expected = rent('expected');
    final tenants = rent('tenants').toInt(), paid = rent('tenants_paid').toInt();
    final unpaid = tenants - paid;
    final months = [for (final m in (_rent['months'] as List? ?? const [])) Map<String, dynamic>.from(m)];

    return GlassBackdrop(
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
          physics: const ClampingScrollPhysics(), // stops at its ends: no stretch, no bounce
          children: [
            // Who is signed in, and the bell
            Row(
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: C.edge, width: 2.5),
                    boxShadow: [BoxShadow(color: C.shade.withValues(alpha: .3), offset: const Offset(3, 4), blurRadius: 9)],
                  ),
                  child: Avatar(fullName, photo: Api.img(user?['profile_image']), size: 44),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        firstName.isEmpty ? hello : '$hello, $firstName',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: display(17, weight: FontWeight.w800),
                      ),
                      const SizedBox(height: 2),
                      Text(DateFormat('EEEE, d MMMM', lang.value).format(now), style: body(12.5, color: C.muted, height: 1.3)),
                    ],
                  ),
                ),
                Badge(
                  isLabelVisible: _unread > 0,
                  backgroundColor: C.hibiscus,
                  offset: const Offset(-4, 4),
                  label: Text('$_unread'),
                  child: RoundIcon(
                    Icons.notifications_none_rounded,
                    label: _unread > 0 ? t('Notifications, $_unread unread', 'Arifa, $_unread hazijasomwa') : t('Notifications', 'Arifa'),
                    onTap: () async {
                      await push(context, const NotificationsScreen());
                      _loadUnread(); // opening the list marks them read
                    },
                  ),
                ),
              ],
            ),
            if (_loading)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: LinearProgressIndicator(minHeight: 2, color: C.teal, backgroundColor: Colors.transparent),
              ),
            const SizedBox(height: 18),

            // The headline: rent that came in this month against what is due. Before any tenant is added, what the homes ask.
            ClayCard(
              color: C.navy,
              borderColor: Colors.white.withValues(alpha: .1),
              borderRadius: 24,
              padding: const EdgeInsets.all(18),
              onTap: tenants > 0 ? () => _go(const RentPaymentsScreen()) : null,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          tenants > 0
                              ? t('Rent collected in ${DateFormat('MMMM', lang.value).format(now)}', 'Kodi iliyokusanywa ${DateFormat('MMMM', lang.value).format(now)}')
                              : t('Rent you are asking each month', 'Kodi unayoomba kila mwezi'),
                          style: body(12.5, color: Colors.white.withValues(alpha: .72), height: 1.3),
                        ),
                      ),
                      if (tenants > 0) Icon(Icons.chevron_right_rounded, size: 20, color: Colors.white.withValues(alpha: .6)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(tzs(tenants > 0 ? collected : asking), style: display(30, color: Colors.white, weight: FontWeight.w800)),
                  ),
                  if (tenants > 0) ...[
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(5),
                      child: LinearProgressIndicator(
                        value: expected == 0 ? 0 : (collected / expected).clamp(0, 1).toDouble(),
                        minHeight: 8,
                        color: C.tealBright,
                        backgroundColor: Colors.white.withValues(alpha: .14),
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    tenants > 0
                        ? (collected >= expected
                              ? t('All $tenants tenants have paid', 'Wapangaji wote $tenants wamelipa')
                              : t('$paid of $tenants tenants paid · ${tzs(expected - collected)} still due', 'Wapangaji $paid kati ya $tenants wamelipa · ${tzs(expected - collected)} bado'))
                        : _homes.isEmpty
                        ? t('List your first home to start receiving viewing requests.', 'Tangaza nyumba yako ya kwanza uanze kupokea maombi ya kuiona.')
                        : t('${_homes.length} homes listed, $live live now', 'Nyumba ${_homes.length} zimetangazwa, $live zipo hewani sasa'),
                    style: body(12.5, color: Colors.white.withValues(alpha: .85), height: 1.35),
                  ),
                ],
              ),
            ).smoothIn(0),
            const SizedBox(height: 16),

            // The things a landlord does most, one tap away
            Row(
              children: [
                _action(Icons.add_home_outlined, t('Add property', 'Ongeza nyumba'), const AddHomeScreen()),
                const SizedBox(width: 10),
                _action(Icons.payments_outlined, t('Rent', 'Kodi'), const RentPaymentsScreen()),
                const SizedBox(width: 10),
                _action(Icons.build_outlined, t('Repairs', 'Matengenezo'), const MaintenanceScreen()),
                const SizedBox(width: 10),
                _action(Icons.map_outlined, t('Map', 'Ramani'), PropertiesMapScreen(_homes)),
              ],
            ).smoothIn(1),
            const SizedBox(height: 22),

            Text(t('Overview', 'Muhtasari'), style: display(15.5, weight: FontWeight.w800)),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: _stat(Icons.apartment_rounded, t('Properties', 'Nyumba'), '${_homes.length}', t('$live live now', '$live zipo hewani'))),
                const SizedBox(width: 12),
                Expanded(
                  child: _stat(Icons.people_outline_rounded, t('Tenants', 'Wapangaji'), '$tenants', tenants > 0 ? t('$paid paid this month', '$paid wamelipa mwezi huu') : t('None added yet', 'Bado hakuna')),
                ),
              ],
            ).smoothIn(2),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _stat(Icons.event_available_outlined, t('Viewing requests', 'Maombi ya kuona'), '${_viewings.length}', t('$waiting waiting', '$waiting yanasubiri'))),
                const SizedBox(width: 12),
                Expanded(
                  child: _stat(Icons.build_outlined, t('Open repairs', 'Matengenezo'), '$_repairs', t('To fix', 'Ya kutengeneza'), onTap: () => _go(const MaintenanceScreen())),
                ),
              ],
            ).smoothIn(2),
            const SizedBox(height: 22),

            // Only what is true right now; quiet when nothing is waiting
            Text(t('Waiting for you', 'Yanayokusubiri'), style: display(15.5, weight: FontWeight.w800)),
            const SizedBox(height: 10),
            if (waiting > 0)
              _todo(
                Icons.event_available_outlined,
                waiting == 1 ? t('1 viewing request to answer', 'Ombi 1 la kuona nyumba linasubiri jibu') : t('$waiting viewing requests to answer', 'Maombi $waiting ya kuona nyumba yanasubiri jibu'),
                t('Open the Tenants tab to accept or decline', 'Fungua Wapangaji ukubali au ukatae'),
              ),
            if (unpaid > 0)
              _todo(
                Icons.payments_outlined,
                unpaid == 1 ? t('1 tenant has not paid this month', 'Mpangaji 1 hajalipa mwezi huu') : t('$unpaid tenants have not paid this month', 'Wapangaji $unpaid hawajalipa mwezi huu'),
                t('Record a payment when it comes in', 'Rekodi malipo yanapoingia'),
                onTap: () => _go(const RentPaymentsScreen()),
              ),
            if (stale > 0)
              _todo(
                Icons.update_rounded,
                stale == 1 ? t('1 home not confirmed for 30 days', 'Nyumba 1 haijathibitishwa kwa siku 30') : t('$stale homes not confirmed for 30 days', 'Nyumba $stale hazijathibitishwa kwa siku 30'),
                t('Open Properties and tap "Still available"', 'Fungua Nyumba ubonyeze "Bado ipo"'),
              ),
            if (_business != 'approved')
              _todo(
                Icons.domain_verification_outlined,
                switch (_business) {
                  'pending' => t('Your business details are being checked', 'Taarifa za biashara yako zinakaguliwa'),
                  'rejected' => t('Your business details need changes', 'Taarifa za biashara yako zinahitaji marekebisho'),
                  _ => t('Verify your business', 'Thibitisha biashara yako'),
                },
                _business == 'pending' ? t('We will notify you here', 'Tutakujulisha hapa') : t('Send your TIN and business details', 'Tuma TIN na taarifa za biashara'),
                onTap: _business == 'pending'
                    ? null
                    : () async {
                        final current = await ProfileDataService.loadBusinessInfo();
                        if (!context.mounted) return;
                        _go(EditBusinessInfoScreen(initialData: current));
                      },
              ),
            if (waiting == 0 && unpaid <= 0 && stale == 0 && _business == 'approved')
              _todo(
                Icons.check_circle_outline_rounded,
                t('Nothing is waiting for you', 'Hakuna kinachokusubiri'),
                t('New viewing requests show up here', 'Maombi mapya yataonekana hapa'),
                calm: true,
              ),

            if (months.any((m) => (m['total'] ?? 0) > 0)) ...[
              const SizedBox(height: 14),
              Text(t('Rent collected, last 6 months', 'Kodi iliyokusanywa, miezi 6'), style: display(15.5, weight: FontWeight.w800)),
              const SizedBox(height: 10),
              ClayCard(borderRadius: 22, padding: const EdgeInsets.fromLTRB(10, 14, 10, 12), child: RentBars(months)).smoothIn(3),
            ],

            if (byRent.isNotEmpty) ...[
              const SizedBox(height: 22),
              Text(t('Rent by home', 'Kodi kwa kila nyumba'), style: display(15.5, weight: FontWeight.w800)),
              const SizedBox(height: 10),
              ClayCard(
                borderRadius: 22,
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: Column(
                  children: [
                    for (final h in byRent.take(4))
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(h.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(13, weight: FontWeight.w600)),
                                ),
                                const SizedBox(width: 10),
                                Text(tzsShort(h.rent), style: body(13, color: C.muted, weight: FontWeight.w600)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: byRent.first.rent == 0 ? 0 : h.rent / byRent.first.rent,
                                minHeight: 7,
                                color: h.status == 'available' ? C.teal : C.faint,
                                backgroundColor: C.fill,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ).smoothIn(4),
            ],
          ],
        ),
      ),
    );
  }

  /// A round-cornered clay key with its name under it.
  Widget _action(IconData icon, String label, Widget screen) => Expanded(
    child: Column(
      children: [
        ClayCard(
          borderRadius: 18,
          padding: const EdgeInsets.symmetric(vertical: 13),
          onTap: () => _go(screen),
          child: Center(child: Icon(icon, size: 22, color: C.teal)),
        ),
        const SizedBox(height: 7),
        Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: body(11.5, weight: FontWeight.w600, height: 1.2)),
      ],
    ),
  );

  /// One thing that needs the landlord. Brass when it is waiting, quiet when it is just information.
  Widget _todo(IconData icon, String title, String hint, {VoidCallback? onTap, bool calm = false}) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: ClayCard(
      borderRadius: 18,
      padding: const EdgeInsets.all(12),
      color: calm ? null : C.sand,
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, color: calm ? C.teal : C.brassInk, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: body(13.5, weight: FontWeight.w700, height: 1.3)),
                Text(hint, style: body(12.5, color: C.muted, height: 1.3)),
              ],
            ),
          ),
          if (onTap != null) Icon(Icons.chevron_right_rounded, color: C.muted, size: 20),
        ],
      ),
    ),
  );

  Widget _stat(IconData icon, String label, String value, String note, {VoidCallback? onTap}) => ClayCard(
    borderRadius: 20,
    padding: const EdgeInsets.all(14),
    onTap: onTap,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(color: C.leaf, borderRadius: BorderRadius.circular(11)),
              child: Icon(icon, size: 18, color: C.teal),
            ),
            const Spacer(),
            Text(value, style: display(22, weight: FontWeight.w800)),
          ],
        ),
        const SizedBox(height: 10),
        Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(12.5, weight: FontWeight.w600, height: 1.3)),
        Text(note, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(11.5, color: C.muted, height: 1.3)),
      ],
    ),
  );
}
