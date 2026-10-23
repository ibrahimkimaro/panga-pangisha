import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../ui.dart';
import '../customecontrols/pickers.dart';
import '../explore.dart';
import '../listing.dart';
import '../owner.dart';
import 'ai_property_workspace.dart';
import 'rentals.dart';

/// What a landlord calls each listing state, with the colours of its badge.
(String, Color, Color) _status(String status) => switch (status) {
  'available' => (t('Active', 'Hai'), C.good, C.goodTint),
  'rented' => (t('Rented', 'Imepangishwa'), C.muted, C.fill),
  'reserved' => (t('Reserved', 'Imehifadhiwa'), C.brassInk, C.sand),
  'maintenance' => (t('Maintenance', 'Matengenezo'), C.brassInk, C.sand),
  'suspended' => (t('Suspended', 'Imesimamishwa'), C.hibiscus, C.blush),
  _ => (status, C.muted, C.fill),
};

class _StatusBadge extends StatelessWidget {
  const _StatusBadge(this.status);
  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, fg, bg) = _status(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: body(11.5, color: fg, weight: FontWeight.w700, height: 1.1)),
    );
  }
}

String _beds(int n) => n == 1 ? t('1 bed', 'chumba 1') : t('$n beds', 'vyumba $n');
String _baths(int n) => n == 1 ? t('1 bath', 'bafu 1') : t('$n baths', 'bafu $n');

/// "TSh 650,000 /month" then beds and baths, as on every property card.
class _Facts extends StatelessWidget {
  const _Facts(this.h);
  final House h;

  @override
  Widget build(BuildContext context) {
    Widget fact(IconData icon, String text) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: C.muted),
        const SizedBox(width: 3),
        Text(text, style: body(12, color: C.muted, height: 1.2)),
      ],
    );
    return Wrap(
      spacing: 10,
      runSpacing: 2,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text.rich(
          TextSpan(
            children: [
              TextSpan(text: tzs(h.rent), style: body(13.5, color: C.teal, weight: FontWeight.w700, height: 1.2)),
              TextSpan(text: t(' /month', ' /mwezi'), style: body(12, color: C.muted, height: 1.2)),
            ],
          ),
        ),
        if (h.units.isNotEmpty)
          fact(Icons.meeting_room_outlined, '${h.units.length} ${h.units.length == 1 ? t('unit', 'chumba') : t('units', 'vyumba')}')
        else ...[
          fact(Icons.bed_outlined, _beds(h.bedrooms)),
          fact(Icons.bathtub_outlined, _baths(h.bathrooms)),
        ],
      ],
    );
  }
}

/// A choice in one of the filter sheets: the value it stands for (null = "all") and its label.
typedef _Pick = (String? value, String label);

/// Screen 12: the landlord's properties, searchable, filterable and sortable.
class OwnerHomeTab extends StatefulWidget {
  const OwnerHomeTab({super.key});

  @override
  State<OwnerHomeTab> createState() => _OwnerHomeTabState();
}

class _OwnerHomeTabState extends State<OwnerHomeTab> {
  List<House>? _homes;
  String? _error;
  String _query = '';
  String? _statusIs, _typeIs; // null = all
  String _sort = 'newest';

  static const _sorts = ['newest', 'high', 'low'];
  String _sortName(String s) => switch (s) {
    'high' => t('Rent: high to low', 'Kodi: juu hadi chini'),
    'low' => t('Rent: low to high', 'Kodi: chini hadi juu'),
    _ => t('Newest', 'Mpya zaidi'),
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (Api.user.value == null) return setState(() => _homes = []);
    try {
      final homes = House.list(await Api.get('landlord/getAllHouses/'));
      if (mounted) {
        setState(() {
          _homes = homes;
          _error = null;
        });
      }
    } on ApiError catch (e) {
      if (mounted && _homes == null) setState(() => _error = e.message);
    }
  }

  Future<void> _add() async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: C.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                t('Add New Property', 'Ongeza Nyumba Mpya'),
                style: display(18, weight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                t('Choose how you would like to register your property:',
                  'Chagua jinsi unavyotaka kusajili nyumba yako:'),
                style: body(13, color: C.muted),
              ),
              const SizedBox(height: 16),
              ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: BorderSide(color: C.teal.withValues(alpha: 0.3)),
                ),
                tileColor: C.teal.withValues(alpha: 0.08),
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: C.teal,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 20),
                ),
                title: Text(
                  t('AI Conversational Assistant', 'Msaidizi wa AI (Kiswahili & Kiingereza)'),
                  style: display(14.5, weight: FontWeight.w700, color: C.ink),
                ),
                subtitle: Text(
                  t('Describe in natural language, ask questions, get market advice & live preview',
                    'Eleza kwa maneno ya kawaida, uliza maswali ya soko na jaza vyumba kiotomatiki'),
                  style: body(12, color: C.muted),
                ),
                trailing: Icon(Icons.chevron_right_rounded, color: C.teal),
                onTap: () => Navigator.pop(ctx, 'ai'),
              ),
              const SizedBox(height: 10),
              ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: BorderSide(color: C.line),
                ),
                tileColor: C.chokaa,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: C.card,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.tune_rounded, color: C.ink, size: 20),
                ),
                title: Text(
                  t('Step-by-Step Manual Wizard', 'Fomu ya Hatua kwa Hatua'),
                  style: display(14.5, weight: FontWeight.w700, color: C.ink),
                ),
                subtitle: Text(
                  t('Fill forms manually step by step with map pin picker',
                    'Jaza fomu wewe mwenyewe hatua kwa hatua'),
                  style: body(12, color: C.muted),
                ),
                trailing: Icon(Icons.chevron_right_rounded, color: C.muted),
                onTap: () => Navigator.pop(ctx, 'manual'),
              ),
            ],
          ),
        ),
      ),
    );

    if (choice == 'ai' && mounted) {
      await push<bool>(context, const AiPropertyWorkspaceScreen());
      _load();
    } else if (choice == 'manual' && mounted) {
      await push<bool>(context, const AddHomeScreen());
      _load();
    }
  }

  Future<void> _open(Widget screen) async {
    await push(context, screen);
    _load(); // whatever changed in there (status, rent, deleted) shows on return
  }

  /// The list after search, filters and sort. The server already sends it newest first.
  List<House> get _shown {
    final list = [
      for (final h in _homes ?? const <House>[])
        if ((_statusIs == null || h.status == _statusIs) &&
            (_typeIs == null || h.type == _typeIs) &&
            (_query.isEmpty || '${h.name} ${h.place} ${h.street}'.toLowerCase().contains(_query)))
          h,
    ];
    if (_sort == 'high') list.sort((a, b) => b.rent.compareTo(a.rent));
    if (_sort == 'low') list.sort((a, b) => a.rent.compareTo(b.rent));
    return list;
  }

  Future<void> _choose(String title, List<_Pick> options, void Function(String?) apply) async {
    final picked = await pickFrom<_Pick>(context, title: title, items: options, label: (o) => o.$2);
    if (picked != null) setState(() => apply(picked.$1));
  }

  @override
  Widget build(BuildContext context) {
    final homes = _homes, shown = _shown;
    return GlassBackdrop(
      child: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 16, 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(t('Properties', 'Nyumba'), style: display(22, weight: FontWeight.w800)),
                            Text(
                              homes == null ? ' ' : t('${homes.length} properties', 'Nyumba ${homes.length}'),
                              style: body(12.5, color: C.muted, height: 1.3),
                            ),
                          ],
                        ),
                      ),
                      RoundIcon(
                        Icons.map_outlined,
                        label: t('See them on the map', 'Zione kwenye ramani'),
                        onTap: () => _open(PropertiesMapScreen(homes ?? const [])),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Glass(
                    radius: 16,
                    padding: EdgeInsets.zero,
                    child: TextField(
                      onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                      style: body(14.5),
                      decoration: InputDecoration(
                        filled: false,
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 13),
                        prefixIcon: Icon(Icons.search_rounded, color: C.muted, size: 20),
                        hintText: t('Search properties', 'Tafuta nyumba'),
                        hintStyle: body(14, color: C.muted),
                      ),
                    ),
                  ),
                ),
                SizedBox(
                  height: 54,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 8),
                    children: [
                      _filter(
                        _statusIs == null ? t('All status', 'Hali zote') : _status(_statusIs!).$1,
                        _statusIs != null,
                        () => _choose(t('Status', 'Hali'), [
                          (null, t('All status', 'Hali zote')),
                          for (final s in ['available', 'rented', 'reserved', 'maintenance', 'suspended']) (s, _status(s).$1),
                        ], (v) => _statusIs = v),
                      ),
                      _filter(
                        _typeIs == null ? t('All types', 'Aina zote') : typeName(_typeIs!),
                        _typeIs != null,
                        () => _choose(t('Type', 'Aina'), [
                          (null, t('All types', 'Aina zote')),
                          for (final type in houseTypes) (type, typeName(type)),
                        ], (v) => _typeIs = v),
                      ),
                      _filter(
                        t('Sort: ${_sortName(_sort)}', 'Panga: ${_sortName(_sort)}'),
                        _sort != 'newest',
                        () => _choose(t('Sort by', 'Panga kwa'), [for (final s in _sorts) (s, _sortName(s))], (v) => _sort = v ?? 'newest'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: _error != null
                      ? Notice(
                          icon: Icons.cloud_off_outlined,
                          title: t('Could not load your properties', 'Imeshindwa kupakia nyumba zako'),
                          text: _error!,
                          action: t('Try again', 'Jaribu tena'),
                          onAction: _load,
                        )
                      : homes == null
                      ? ListView(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          children: const [Bone(height: 98, radius: 22), SizedBox(height: 10), Bone(height: 98, radius: 22), SizedBox(height: 10), Bone(height: 98, radius: 22)],
                        )
                      : homes.isEmpty
                      ? Notice(
                          icon: Icons.add_home_outlined,
                          title: t('List your first property', 'Tangaza nyumba yako ya kwanza'),
                          text: t('It takes about three minutes. Renters contact you directly.', 'Inachukua kama dakika tatu. Wapangaji wanawasiliana nawe moja kwa moja.'),
                          action: t('Add property', 'Ongeza nyumba'),
                          onAction: _add,
                        )
                      : shown.isEmpty
                      ? Notice(
                          icon: Icons.filter_alt_off_outlined,
                          title: t('Nothing matches', 'Hakuna inayolingana'),
                          text: t('Change the search or the filters to see more.', 'Badili utafutaji au vichujio kuona zaidi.'),
                        )
                      : RefreshIndicator(
                          color: C.teal,
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(20, 2, 20, 170),
                            itemCount: shown.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 10),
                            itemBuilder: (_, i) => _PropertyCard(
                              shown[i],
                              onTap: () => _open(PropertyDetailScreen(shown[i])),
                            ).reveal(i.clamp(0, 6)),
                          ),
                        ),
                ),
              ],
            ),
            if (homes != null && homes.isNotEmpty)
              Positioned(
                right: 20,
                bottom: 100,
                child: Button(t('Add property', 'Ongeza nyumba'), icon: Icons.add_rounded, expand: false, onTap: _add),
              ),
          ],
        ),
      ),
    );
  }

  Widget _filter(String label, bool on, VoidCallback onTap) => Padding(
    padding: const EdgeInsets.only(right: 8),
    child: Press(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.fromLTRB(13, 0, 8, 0),
        decoration: BoxDecoration(
          color: on ? C.tealLight : C.card.withValues(alpha: .7),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: on ? C.teal : C.line),
        ),
        child: Row(
          children: [
            Text(label, style: body(12.5, weight: FontWeight.w600, color: on ? C.teal : C.wino)),
            Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: on ? C.teal : C.muted),
          ],
        ),
      ),
    ),
  );
}

class _PropertyCard extends StatelessWidget {
  const _PropertyCard(this.h, {required this.onTap});
  final House h;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Press(
    onTap: onTap,
    child: Glass(
      padding: const EdgeInsets.all(10),
      child: Row(
        children: [
          Hero(
            tag: 'property-${h.id}',
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox.square(dimension: 78, child: Photo(h.photos.firstOrNull, width: 78)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(h.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: display(15, weight: FontWeight.w700)),
                    ),
                    const SizedBox(width: 6),
                    _StatusBadge(h.status),
                  ],
                ),
                const SizedBox(height: 2),
                Text(h.place, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(12.5, color: C.muted, height: 1.3)),
                const SizedBox(height: 6),
                _Facts(h),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

/// Screen 11: the landlord's properties as pins, with a card for the one in focus.
class PropertiesMapScreen extends StatefulWidget {
  const PropertiesMapScreen(this.homes, {super.key});
  final List<House> homes;

  @override
  State<PropertiesMapScreen> createState() => _PropertiesMapScreenState();
}

class _PropertiesMapScreenState extends State<PropertiesMapScreen> {
  final _map = MapController();
  final _cards = PageController(viewportFraction: .9);
  String _query = '';
  int _at = 0;

  @override
  void dispose() {
    _map.dispose();
    _cards.dispose();
    super.dispose();
  }

  /// Only homes with a pin can be on a map.
  List<House> get _pinned => [
    for (final h in widget.homes)
      if (h.lat != null && h.lng != null && (_query.isEmpty || '${h.name} ${h.place}'.toLowerCase().contains(_query))) h,
  ];

  void _focus(int i, {bool turnCard = true}) {
    final h = _pinned[i];
    HapticFeedback.selectionClick();
    setState(() => _at = i);
    _map.move(LatLng(h.lat!, h.lng!), 14.5);
    if (turnCard && _cards.hasClients) {
      _cards.animateToPage(i, duration: const Duration(milliseconds: 320), curve: Curves.easeOutCubic);
    }
  }

  @override
  Widget build(BuildContext context) {
    final homes = _pinned;
    final at = homes.isEmpty ? 0 : _at.clamp(0, homes.length - 1);
    final start = homes.isEmpty ? const LatLng(-6.785, 39.255) : LatLng(homes[at].lat!, homes[at].lng!);
    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            mapController: _map,
            options: MapOptions(
              initialCenter: start,
              initialZoom: homes.isEmpty ? 11 : 12.5,
              interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
            ),
            children: [
              TileLayer(urlTemplate: osmTiles, userAgentPackageName: osmAgent),
              MarkerLayer(
                markers: [
                  for (final (i, h) in homes.indexed)
                    Marker(
                      point: LatLng(h.lat!, h.lng!),
                      width: 46,
                      height: 46,
                      child: Press(
                        label: h.name,
                        onTap: () => _focus(i),
                        child: AnimatedScale(
                          scale: i == at ? 1 : .8,
                          duration: const Duration(milliseconds: 220),
                          curve: Curves.easeOutBack,
                          child: Container(
                            decoration: BoxDecoration(
                              color: i == at ? C.mkoko : C.card,
                              shape: BoxShape.circle,
                              border: Border.all(color: i == at ? Colors.white : C.mkoko, width: 2),
                              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .22), blurRadius: 8, offset: const Offset(0, 3))],
                            ),
                            child: Icon(Icons.home_rounded, size: 22, color: i == at ? Colors.white : C.mkoko),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
              child: Row(
                children: [
                  RoundIcon(Icons.arrow_back_rounded, label: t('Back', 'Rudi'), onTap: () => Navigator.pop(context)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Glass(
                      blur: true,
                      radius: 24,
                      padding: EdgeInsets.zero,
                      opacity: .8,
                      child: TextField(
                        onChanged: (v) => setState(() {
                          _query = v.trim().toLowerCase();
                          _at = 0;
                        }),
                        style: body(14.5),
                        decoration: InputDecoration(
                          filled: false,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                          prefixIcon: Icon(Icons.search_rounded, color: C.muted, size: 20),
                          hintText: t('Search your properties', 'Tafuta nyumba zako'),
                          hintStyle: body(14, color: C.muted),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
                    child: Row(
                      children: [
                        // The map's credit, kept clear of the cards that cover the bottom edge.
                        Expanded(
                          child: Text('© OpenStreetMap contributors', style: body(10.5, color: const Color(0xFF475569))),
                        ),
                        Press(
                      onTap: () => Navigator.pop(context),
                      child: Glass(
                        blur: true,
                        radius: 22,
                        opacity: .85,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.format_list_bulleted_rounded, size: 16, color: C.teal),
                            const SizedBox(width: 6),
                            Text(t('View list', 'Ona orodha'), style: body(13, color: C.teal, weight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ),
                      ],
                    ),
                  ),
                  if (homes.isEmpty)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                      child: Glass(
                        blur: true,
                        opacity: .85,
                        child: Text(
                          widget.homes.isEmpty
                              ? t('You have no properties yet. Add one and mark it on the map.', 'Bado huna nyumba. Ongeza moja na uiweke kwenye ramani.')
                              : t('No property with a map pin matches.', 'Hakuna nyumba yenye alama ya ramani inayolingana.'),
                          style: body(14, color: C.muted, height: 1.4),
                        ),
                      ),
                    )
                  else
                    SizedBox(
                      height: 124,
                      child: PageView.builder(
                        controller: _cards,
                        itemCount: homes.length,
                        onPageChanged: (i) => _focus(i, turnCard: false),
                        itemBuilder: (_, i) {
                          final h = homes[i];
                          return Padding(
                            padding: const EdgeInsets.fromLTRB(5, 0, 5, 14),
                            child: Press(
                              onTap: () => push(context, PropertyDetailScreen(h)),
                              child: Glass(
                                blur: true,
                                opacity: .88,
                                padding: const EdgeInsets.all(10),
                                child: Row(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(14),
                                      child: SizedBox(width: 96, height: double.infinity, child: Photo(h.photos.firstOrNull, width: 96)),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(child: Text(h.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: display(15))),
                                              const SizedBox(width: 6),
                                              _StatusBadge(h.status),
                                            ],
                                          ),
                                          const SizedBox(height: 2),
                                          Text(h.place, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(12.5, color: C.muted, height: 1.3)),
                                          const SizedBox(height: 6),
                                          _Facts(h),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
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
}

/// Screen 13: one property as its landlord sees it, with what can be done to it.
class PropertyDetailScreen extends StatefulWidget {
  const PropertyDetailScreen(this.house, {super.key});
  final House house;

  @override
  State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  late House h = widget.house;
  int _tab = 0;
  int _photo = 0;
  bool _busy = false;
  List<Map<String, dynamic>>? _asked; // viewing requests for this home, loaded when its tab is first opened

  Future<void> _change(Map<String, dynamic> body, String done) async {
    setState(() => _busy = true);
    try {
      final json = await Api.patch('landlord/houses/${h.id}', body);
      HapticFeedback.mediumImpact();
      if (!mounted) return;
      setState(() => h = House(Map<String, dynamic>.from(json)));
      toast(context, done);
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _loadAsked() async {
    if (_asked != null) return;
    try {
      final all = await Api.get('viewing-requests', {'as': 'owner'}) as List;
      if (mounted) {
        setState(() => _asked = [
          for (final v in all)
            if (v['house']?['id'] == h.id) Map<String, dynamic>.from(v),
        ]);
      }
    } on ApiError {
      if (mounted) setState(() => _asked = []);
    }
  }

  String _unitFilter = 'all';

  Future<void> _refreshHouse() async {
    try {
      final res = await Api.get('landlord/houses/${h.id}');
      if (mounted && res is Map<String, dynamic>) {
        setState(() => h = House(res));
      }
    } catch (_) {}
  }

  Future<void> _changeUnitStatus(HouseUnit u, String newStatus) async {
    try {
      await Api.patch('landlord/units/${u.id}', {'status': newStatus});
      HapticFeedback.mediumImpact();
      if (mounted) toast(context, t('Unit status updated.', 'Hali ya chumba imesasishwa.'));
      await _refreshHouse();
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  Future<void> _deleteUnitPrompt(HouseUnit u) async {
    final sure = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: C.card,
        title: Text(t('Delete this unit?', 'Futa chumba hiki?'), style: display(18)),
        content: Text(
          t('Are you sure you want to remove "${u.unitNumber}" from this property?', 'Una uhakika unataka kuondoa "${u.unitNumber}" kutoka kwenye nyumba hii?'),
          style: body(14),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(t('Cancel', 'Ghairi'))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(t('Delete', 'Futa'), style: TextStyle(color: C.hibiscus))),
        ],
      ),
    );
    if (sure != true) return;
    try {
      await Api.delete('landlord/units/${u.id}');
      if (mounted) toast(context, t('Unit removed.', 'Chumba kimeondolewa.'));
      await _refreshHouse();
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  Future<void> _editUnitSheet(HouseUnit u) async {
    final nameCtrl = TextEditingController(text: u.unitNumber);
    final rentCtrl = TextEditingController(text: u.rent.round().toString());
    final termsCtrl = TextEditingController(text: u.paymentTerms ?? '');
    final typeCtrl = TextEditingController(text: u.unitType ?? '');
    final descCtrl = TextEditingController(text: u.description);
    String status = u.status;

    await sheet(
      context,
      StatefulBuilder(
        builder: (ctx, setModalState) {
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        t('Edit Unit / Room', 'Hariri Chumba / Nafasi'),
                        style: display(18, weight: FontWeight.w800),
                      ),
                    ),
                    _StatusBadge(status),
                  ],
                ),
                const SizedBox(height: 16),
                Text(t('Unit Name or Number', 'Jina au Namba ya Chumba'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                TextField(
                  controller: nameCtrl,
                  style: body(14.5),
                  decoration: InputDecoration(
                    hintText: t('e.g. Master Bedroom 1, Wing A', 'mf. Chumba cha Master 1'),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Monthly Rent (TZS)', 'Kodi kwa Mwezi (TZS)'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: rentCtrl,
                            keyboardType: TextInputType.number,
                            style: body(14.5),
                            decoration: const InputDecoration(prefixText: 'TSh '),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Payment Terms', 'Masharti ya Malipo'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: termsCtrl,
                            style: body(14.5),
                            decoration: InputDecoration(
                              hintText: t('e.g. 4 months advance', 'mf. miezi 4 mbele'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(t('Unit Category / Type', 'Aina ya Chumba'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                TextField(
                  controller: typeCtrl,
                  style: body(14.5),
                  decoration: InputDecoration(
                    hintText: t('e.g. Master Bedroom, Standard Room, 3-Bed House', 'mf. Master Bedroom, Chumba cha Kawaida'),
                  ),
                ),
                const SizedBox(height: 14),
                Text(t('Status', 'Hali ya Chumba'), style: body(12, color: C.muted)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final s in ['available', 'rented', 'reserved', 'maintenance'])
                      Press(
                        onTap: () => setModalState(() => status = s),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: status == s ? C.teal : C.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: status == s ? C.teal : C.line),
                          ),
                          child: Text(
                            _status(s).$1,
                            style: body(12, color: status == s ? Colors.white : C.wino, weight: FontWeight.w600),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(t('Description', 'Maelezo'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                TextField(
                  controller: descCtrl,
                  maxLines: 2,
                  style: body(14),
                  decoration: InputDecoration(
                    hintText: t('Optional room details or amenities', 'Maelezo ya ziada ya chumba'),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: Button(
                        t('Save Changes', 'Hifadhi Mabadiliko'),
                        onTap: () async {
                          final rent = double.tryParse(rentCtrl.text) ?? u.rent;
                          Navigator.pop(ctx);
                          try {
                            await Api.patch('landlord/units/${u.id}', {
                              'unit_number': nameCtrl.text.trim(),
                              'monthly_rent': rent,
                              'payment_terms': termsCtrl.text.trim(),
                              'unit_type': typeCtrl.text.trim(),
                              'description': descCtrl.text.trim(),
                              'status': status,
                            });
                            if (mounted) toast(context, t('Unit updated.', 'Chumba kimesasishwa.'));
                            await _refreshHouse();
                          } on ApiError catch (e) {
                            if (mounted) toast(context, e.message);
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _addUnitSheet() async {
    final nameCtrl = TextEditingController();
    final rentCtrl = TextEditingController(text: h.rent.round().toString());
    final termsCtrl = TextEditingController(text: '4 months advance');
    final typeCtrl = TextEditingController(text: 'Master Bedroom');
    final descCtrl = TextEditingController();

    await sheet(
      context,
      StatefulBuilder(
        builder: (ctx, setModalState) {
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  t('Add Rentable Unit / Room', 'Ongeza Chumba / Nafasi'),
                  style: display(18, weight: FontWeight.w800),
                ),
                const SizedBox(height: 16),
                Text(t('Unit Name or Number', 'Jina au Namba ya Chumba'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                TextField(
                  controller: nameCtrl,
                  style: body(14.5),
                  decoration: InputDecoration(
                    hintText: t('e.g. Master Bedroom 3, Room 102', 'mf. Chumba cha Master 3'),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Monthly Rent (TZS)', 'Kodi kwa Mwezi (TZS)'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: rentCtrl,
                            keyboardType: TextInputType.number,
                            style: body(14.5),
                            decoration: const InputDecoration(prefixText: 'TSh '),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Payment Terms', 'Masharti ya Malipo'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: termsCtrl,
                            style: body(14.5),
                            decoration: InputDecoration(
                              hintText: t('e.g. 4 months advance', 'mf. miezi 4 mbele'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(t('Unit Category / Type', 'Aina ya Chumba'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                TextField(
                  controller: typeCtrl,
                  style: body(14.5),
                  decoration: InputDecoration(
                    hintText: t('e.g. Master Bedroom, Standard Room, 3-Bed House', 'mf. Master Bedroom, Chumba cha Kawaida'),
                  ),
                ),
                const SizedBox(height: 12),
                Text(t('Description', 'Maelezo'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                TextField(
                  controller: descCtrl,
                  maxLines: 2,
                  style: body(14),
                  decoration: InputDecoration(
                    hintText: t('Optional room details or amenities', 'Maelezo ya ziada ya chumba'),
                  ),
                ),
                const SizedBox(height: 20),
                Button(
                  t('Create Unit', 'Ongeza Chumba'),
                  onTap: () async {
                    if (nameCtrl.text.trim().isEmpty) {
                      toast(context, t('Enter a unit name', 'Weka jina la chumba'));
                      return;
                    }
                    final rent = double.tryParse(rentCtrl.text) ?? 10000;
                    Navigator.pop(ctx);
                    try {
                      await Api.post('landlord/houses/${h.id}/units', {
                        'unit_number': nameCtrl.text.trim(),
                        'monthly_rent': rent,
                        'payment_terms': termsCtrl.text.trim(),
                        'unit_type': typeCtrl.text.trim(),
                        'description': descCtrl.text.trim(),
                        'bedrooms': 1,
                        'bathrooms': 1,
                        'status': 'available',
                      });
                      if (mounted) toast(context, t('Unit added successfully.', 'Chumba kimeongezwa kikamilifu.'));
                      await _refreshHouse();
                    } on ApiError catch (e) {
                      if (mounted) toast(context, e.message);
                    }
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _changeRent() async {
    final box = TextEditingController(text: h.rent.round().toString());
    final rent = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: C.card,
        title: Text(t('Rent a month', 'Kodi kwa mwezi'), style: display(18)),
        content: TextField(
          controller: box,
          autofocus: true,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(9)],
          style: body(16),
          decoration: const InputDecoration(prefixText: 'TSh '),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(t('Cancel', 'Ghairi'))),
          TextButton(onPressed: () => Navigator.pop(ctx, int.tryParse(box.text)), child: Text(t('Save', 'Hifadhi'))),
        ],
      ),
    );
    if (rent != null && rent >= 1000) _change({'monthly_rent': rent}, t('Rent updated.', 'Kodi imesasishwa.'));
  }

  Future<void> _delete() async {
    final sure = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: C.card,
        title: Text(t('Delete this property?', 'Futa nyumba hii?'), style: display(18)),
        content: Text(
          t(
            'The listing, its photos and its viewing requests are removed. This cannot be undone. To hide it instead, mark it as rented.',
            'Tangazo, picha zake na maombi ya kuiona vitaondolewa. Haiwezi kurudishwa. Kuificha tu, iweke kama imepangishwa.',
          ),
          style: body(14.5, color: C.muted, height: 1.4),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(t('Keep it', 'Iache'))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(t('Delete', 'Futa'), style: TextStyle(color: C.hibiscus))),
        ],
      ),
    );
    if (sure != true) return;
    try {
      await Api.delete('landlord/houses/${h.id}');
      if (!mounted) return;
      Navigator.pop(context);
      toast(context, t('Property deleted.', 'Nyumba imefutwa.'));
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  Future<void> _editPropertySheet() async {
    final nameCtrl = TextEditingController(text: h.name);
    final typeCtrl = TextEditingController(text: h.type);
    final regionCtrl = TextEditingController(text: h.region);
    final districtCtrl = TextEditingController(text: h.district);
    final wardCtrl = TextEditingController(text: h.ward);
    final streetCtrl = TextEditingController(text: h.street);
    final rentCtrl = TextEditingController(text: h.rent.round().toString());
    final bedsCtrl = TextEditingController(text: h.bedrooms.toString());
    final bathsCtrl = TextEditingController(text: h.bathrooms.toString());
    final descCtrl = TextEditingController(text: h.description);

    await sheet(
      context,
      StatefulBuilder(
        builder: (ctx, setModalState) {
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      t('Edit Property & Location', 'Hariri Nyumba na Eneo'),
                      style: display(18, weight: FontWeight.w800),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(t('Property Name', 'Jina la Nyumba'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                TextField(
                  controller: nameCtrl,
                  style: body(14.5),
                  decoration: InputDecoration(
                    hintText: t('e.g. Mikocheni Garden Compound', 'mf. Mikocheni Garden Compound'),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Property Type', 'Aina ya Nyumba'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: typeCtrl,
                            style: body(14),
                            decoration: InputDecoration(hintText: t('e.g. House, Villa', 'mf. Nyumba')),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Monthly Rent (TZS)', 'Kodi kwa Mwezi'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: rentCtrl,
                            keyboardType: TextInputType.number,
                            style: body(14),
                            decoration: const InputDecoration(prefixText: 'TSh '),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(t('Location (Mkoa & Wilaya)', 'Eneo (Mkoa na Wilaya)'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: regionCtrl,
                        style: body(14),
                        decoration: InputDecoration(hintText: t('Region e.g. Dar es Salaam', 'Mkoa')),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: districtCtrl,
                        style: body(14),
                        decoration: InputDecoration(hintText: t('District e.g. Kinondoni', 'Wilaya')),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(t('Ward & Street (Kata na Mtaa)', 'Kata na Mtaa'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: wardCtrl,
                        style: body(14),
                        decoration: InputDecoration(hintText: t('Ward e.g. Mikocheni', 'Kata')),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: streetCtrl,
                        style: body(14),
                        decoration: InputDecoration(hintText: t('Street e.g. Chwaka Rd', 'Mtaa')),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Bedrooms', 'Vyumba vya Kulala'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: bedsCtrl,
                            keyboardType: TextInputType.number,
                            style: body(14),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Bathrooms', 'Bafu'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: bathsCtrl,
                            keyboardType: TextInputType.number,
                            style: body(14),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(t('Description & Compound Amenities', 'Maelezo na Huduma'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                TextField(
                  controller: descCtrl,
                  maxLines: 3,
                  style: body(13.5),
                  decoration: InputDecoration(
                    hintText: t('Describe compound security, water supply, STS meters, etc.', 'Eleza ulinzi, maji, mita za luku n.k.'),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: Button(
                        t('Save Changes', 'Hifadhi Mabadiliko'),
                        onTap: () async {
                          final rent = double.tryParse(rentCtrl.text) ?? h.rent;
                          final beds = int.tryParse(bedsCtrl.text) ?? h.bedrooms;
                          final baths = int.tryParse(bathsCtrl.text) ?? h.bathrooms;
                          Navigator.pop(ctx);
                          await _change({
                            'property_name': nameCtrl.text.trim(),
                            'property_type': typeCtrl.text.trim(),
                            'region': regionCtrl.text.trim(),
                            'district': districtCtrl.text.trim(),
                            'ward': wardCtrl.text.trim(),
                            'street': streetCtrl.text.trim(),
                            'monthly_rent': rent,
                            'bedrooms': beds,
                            'bathrooms': baths,
                            'description': descCtrl.text.trim(),
                          }, t('Property details and location updated.', 'Taarifa za nyumba na eneo zimesasishwa.'));
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _manage() {
    final open = h.status == 'available', locked = h.status == 'suspended';
    Widget row(IconData icon, String title, String hint, VoidCallback onTap, {Color? color}) => ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(9),
        decoration: BoxDecoration(color: C.fill, borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, size: 20, color: color ?? C.teal),
      ),
      title: Text(title, style: body(15, weight: FontWeight.w600, color: color)),
      subtitle: Text(hint, style: body(12.5, color: C.muted, height: 1.3)),
      onTap: () {
        Navigator.pop(context);
        onTap();
      },
    );
    sheet(
      context,
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(t('Manage property', 'Simamia nyumba'), style: display(19, weight: FontWeight.w800)),
          const SizedBox(height: 6),
          if (locked)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                t('Panga suspended this listing. Contact support to bring it back.', 'Panga imesimamisha tangazo hili. Wasiliana na huduma ili lirudishwe.'),
                style: body(14, color: C.hibiscus, height: 1.4),
              ),
            ),
          if (open)
            row(
              Icons.verified_outlined,
              t('Still available', 'Bado ipo'),
              t('Tell renters this listing is current', 'Waambie wapangaji tangazo hili ni la sasa'),
              () => _change({'confirm_available': true}, t('Confirmed. Renters see it as fresh.', 'Imethibitishwa. Wapangaji wanaiona ni mpya.')),
            ),
          if (!locked)
            row(
              open ? Icons.lock_outline_rounded : Icons.campaign_outlined,
              open ? t('Mark as rented', 'Weka kama imepangishwa') : t('Advertise again', 'Tangaza tena'),
              open ? t('Hides it from search', 'Inaificha kwenye utafutaji') : t('Puts it back in search', 'Inairudisha kwenye utafutaji'),
              () => open
                  ? _change({'status': 'rented'}, t('Marked as rented.', 'Imewekwa kama imepangishwa.'))
                  : _change({'status': 'available', 'confirm_available': true}, t('Your property is back in search.', 'Nyumba yako imerudi kwenye utafutaji.')),
            ),
          if (!locked) row(Icons.payments_outlined, t('Change the rent', 'Badili kodi'), tzs(h.rent), _changeRent),
          if (!locked)
            row(
              Icons.edit_location_alt_outlined,
              t('Edit property & location', 'Hariri nyumba na eneo'),
              t('Change title, region, district, ward, rent & specs', 'Badili jina, mkoa, wilaya, kata, kodi na vipengele'),
              _editPropertySheet,
            ),
          row(Icons.delete_outline_rounded, t('Delete property', 'Futa nyumba'), t('Removes it for good', 'Inaiondoa kabisa'), _delete, color: C.hibiscus),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      t('Overview', 'Muhtasari'),
      h.units.isNotEmpty
          ? t('Units (${h.units.length})', 'Vyumba (${h.units.length})')
          : t('Units', 'Vyumba'),
      t('Tenants', 'Wapangaji'),
      t('Payments', 'Malipo'),
      t('Maintenance', 'Matengenezo'),
    ];
    return Scaffold(
      body: GlassBackdrop(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _photos(),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: Text(h.name, style: display(20, weight: FontWeight.w800))),
                            const SizedBox(width: 10),
                            _StatusBadge(h.status),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.location_on_outlined, size: 15, color: C.muted),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(
                                [h.place, h.region].where((s) => s.isNotEmpty).join(', '),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: body(13, color: C.muted),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(text: tzs(h.rent), style: display(22, color: C.teal, weight: FontWeight.w800)),
                              TextSpan(text: t(' /month', ' /mwezi'), style: body(13.5, color: C.muted)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _pill(Icons.bed_outlined, _beds(h.bedrooms)),
                            _pill(Icons.bathtub_outlined, _baths(h.bathrooms)),
                            if (h.units.isNotEmpty)
                              _pill(Icons.meeting_room_outlined, '${h.units.length} ${h.units.length == 1 ? t('unit', 'chumba') : t('units', 'vyumba')}'),
                            if (h.type.isNotEmpty) _pill(typeIcon(h.type), typeName(h.type)),
                          ],
                        ),
                        const SizedBox(height: 18),
                        // Overview, Units & Rooms, Tenants, Payments, Maintenance
                        Glass(
                          radius: 16,
                          padding: const EdgeInsets.all(4),
                          child: Row(
                            children: [
                              for (final (i, name) in tabs.indexed)
                                Expanded(
                                  child: Press(
                                    onTap: () {
                                      HapticFeedback.selectionClick();
                                      setState(() => _tab = i);
                                      if (i == 2) _loadAsked();
                                    },
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 220),
                                      curve: Curves.easeOutCubic,
                                      padding: const EdgeInsets.symmetric(vertical: 9),
                                      decoration: BoxDecoration(color: _tab == i ? C.mkoko : Colors.transparent, borderRadius: BorderRadius.circular(12)),
                                      child: Text(
                                        name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        textAlign: TextAlign.center,
                                        style: body(11.5, weight: FontWeight.w700, color: _tab == i ? Colors.white : C.muted, height: 1.2),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 260),
                          switchInCurve: Curves.easeOutCubic,
                          child: KeyedSubtree(
                            key: ValueKey(_tab),
                            child: switch (_tab) {
                              0 => _overview(),
                              1 => _unitsTab(),
                              2 => _tenants(),
                              3 => HouseRecords(h, 2),
                              4 => HouseRecords(h, 3),
                              _ => _overview(),
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 6, 20, 12),
                child: Button(t('Manage property', 'Simamia nyumba'), busy: _busy, onTap: _manage),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _photos() => SizedBox(
    height: 270,
    child: Stack(
      fit: StackFit.expand,
      children: [
        h.photos.isEmpty
            ? Hero(tag: 'property-${h.id}', child: const Photo(null))
            : PageView.builder(
                itemCount: h.photos.length,
                onPageChanged: (i) => setState(() => _photo = i),
                itemBuilder: (_, i) {
                  final photo = Photo(h.photos[i]);
                  return i == 0 ? Hero(tag: 'property-${h.id}', child: photo) : photo;
                },
              ),
        // A soft shade so the buttons and dots read on any photo.
        IgnorePointer(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black.withValues(alpha: .35), Colors.transparent, Colors.black.withValues(alpha: .28)],
                stops: const [0, .35, 1],
              ),
            ),
          ),
        ),
        SafeArea(
          bottom: false,
          child: Align(
            alignment: Alignment.topCenter,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
              child: Row(
                children: [
                  RoundIcon(Icons.arrow_back_rounded, label: t('Back', 'Rudi'), onTap: () => Navigator.pop(context)),
                  const Spacer(),
                  if (h.lat != null && h.lng != null)
                    RoundIcon(Icons.map_outlined, label: t('See it on the map', 'Ione kwenye ramani'), onTap: () => push(context, PropertiesMapScreen([h]))),
                  const SizedBox(width: 8),
                  RoundIcon(Icons.edit_location_alt_outlined, label: t('Edit property & location', 'Hariri nyumba na eneo'), onTap: _editPropertySheet),
                  const SizedBox(width: 8),
                  RoundIcon(Icons.tune_rounded, label: t('Manage property', 'Simamia nyumba'), onTap: _manage),
                ],
              ),
            ),
          ),
        ),
        if (h.photos.length > 1)
          Positioned(
            bottom: 10,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < h.photos.length; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: i == _photo ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: i == _photo ? 1 : .6), borderRadius: BorderRadius.circular(3)),
                  ),
              ],
            ),
          ),
      ],
    ),
  );

  Widget _pill(IconData icon, String text) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(color: C.card.withValues(alpha: .7), borderRadius: BorderRadius.circular(20), border: Border.all(color: C.line)),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: C.teal),
        const SizedBox(width: 5),
        Text(text, style: body(12.5, weight: FontWeight.w600, height: 1.2)),
      ],
    ),
  );

  Widget _overview() {
    Widget line(String label, String value) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 118, child: Text(label, style: body(13, color: C.muted))),
          Expanded(child: Text(value, style: body(13.5, weight: FontWeight.w600))),
        ],
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Glass(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(t('Property details', 'Maelezo ya nyumba'), style: display(15, weight: FontWeight.w800)),
              const SizedBox(height: 6),
              line(t('Type', 'Aina'), h.type.isEmpty ? t('Not set', 'Haijawekwa') : typeName(h.type)),
              line(t('Location', 'Mahali'), [h.street, h.ward, h.district, h.region].where((s) => s.isNotEmpty).join(', ')),
              if (h.napaNumber != null && h.napaNumber!.isNotEmpty) line(t('NAPA Code', 'Namba ya NAPA'), h.napaNumber!),
              if (h.deposit != null) line(t('Paid upfront', 'Malipo ya awali'), '${tzs(h.deposit!)}${h.terms == null ? '' : ' (${h.terms})'}'),
              line(
                t('Verification', 'Uthibitisho'),
                h.verifiedAt == null ? t('Not verified by Panga yet', 'Bado haijathibitishwa na Panga') : t('Verified ${day(h.verifiedAt!)}', 'Imethibitishwa ${day(h.verifiedAt!)}'),
              ),
              if (h.status == 'available')
                line(
                  t('Availability', 'Upatikanaji'),
                  h.confirmedAt == null ? t('Not confirmed', 'Haijathibitishwa') : t('Confirmed ${ago(h.confirmedAt!)}', 'Imethibitishwa ${ago(h.confirmedAt!)}'),
                ),
            ],
          ),
        ),
        if (h.units.isNotEmpty) ...[
          const SizedBox(height: 10),
          Glass(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      t('Rentable Units & Rooms (${h.units.length})', 'Vyumba & Nafasi (${h.units.length})'),
                      style: display(15, weight: FontWeight.w800),
                    ),
                    Press(
                      onTap: () => setState(() => _tab = 1),
                      child: Text(
                        t('Manage All →', 'Simamia Vyote →'),
                        style: body(12.5, color: C.teal, weight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  t('Tap any unit to edit rent, status, or details', 'Gusa chumba kubadili kodi, hali au maelezo'),
                  style: body(12, color: C.muted),
                ),
                const SizedBox(height: 10),
                for (final u in h.units)
                  _UnitSummaryRow(
                    u,
                    onTap: () => _editUnitSheet(u),
                  ),
              ],
            ),
          ),
        ],
        if (h.description.isNotEmpty) ...[
          const SizedBox(height: 10),
          Glass(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t('Description', 'Maelezo'), style: display(15, weight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(h.description, style: body(14, color: C.muted, height: 1.45)),
              ],
            ),
          ),
        ],
        if (h.amenities.isNotEmpty) ...[
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [for (final a in h.amenities) _pill(amenityIcon(a), amenityName(a))],
          ),
        ],
      ],
    );
  }

  Widget _unitsTab() {
    final filter = _unitFilter;
    final units = switch (filter) {
      'available' => h.units.where((u) => u.status == 'available').toList(),
      'rented' => h.units.where((u) => u.status == 'rented').toList(),
      'maintenance' => h.units.where((u) => u.status == 'maintenance').toList(),
      _ => h.units,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t('Rentable Units & Rooms', 'Vyumba & Nafasi'), style: display(16, weight: FontWeight.w800)),
                  Text(
                    t('${h.units.length} total units configured', 'Jumla ya vyumba ${h.units.length}'),
                    style: body(12.5, color: C.muted),
                  ),
                ],
              ),
            ),
            Button(
              t('Add Unit', 'Ongeza'),
              icon: Icons.add_rounded,
              expand: false,
              tone: Tone.plain,
              onTap: _addUnitSheet,
            ),
          ],
        ),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final (k, label) in [
                ('all', t('All (${h.units.length})', 'Vyote (${h.units.length})')),
                ('available', t('Available (${h.units.where((u) => u.status == 'available').length})', 'Wazi (${h.units.where((u) => u.status == 'available').length})')),
                ('rented', t('Rented (${h.units.where((u) => u.status == 'rented').length})', 'Zilizojaa (${h.units.where((u) => u.status == 'rented').length})')),
                ('maintenance', t('Maintenance (${h.units.where((u) => u.status == 'maintenance').length})', 'Matengenezo (${h.units.where((u) => u.status == 'maintenance').length})')),
              ])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Press(
                    onTap: () => setState(() => _unitFilter = k),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: filter == k ? C.teal : C.card.withValues(alpha: .7),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: filter == k ? C.teal : C.line),
                      ),
                      child: Text(
                        label,
                        style: body(12, weight: FontWeight.w700, color: filter == k ? Colors.white : C.wino),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        if (units.isEmpty)
          Glass(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.meeting_room_outlined, size: 40, color: C.muted),
                    const SizedBox(height: 10),
                    Text(
                      t('No units found matching this filter', 'Hakuna vyumba vinavyolingana na kichujio hiki'),
                      style: body(14, color: C.muted, weight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          )
        else
          for (final u in units)
            _OwnerUnitCard(
              unit: u,
              onEdit: () => _editUnitSheet(u),
              onStatusChange: (status) => _changeUnitStatus(u, status),
              onDelete: () => _deleteUnitPrompt(u),
            ),
      ],
    );
  }

  /// There are no tenancies in Panga yet, so this tab shows who has asked to see the home.
  Widget _tenants() {
    final asked = _asked;
    if (asked == null) return const Column(children: [Bone(height: 58, radius: 18), SizedBox(height: 8), Bone(height: 58, radius: 18)]);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        HouseRecords(h, 1),
        const SizedBox(height: 18),
        Text(t('People who asked to view it', 'Walioomba kuiona'), style: display(15, weight: FontWeight.w800)),
        const SizedBox(height: 8),
        if (asked.isEmpty)
          Glass(child: Text(t('Nobody has asked to view this property yet.', 'Bado hakuna aliyeomba kuiona nyumba hii.'), style: body(14, color: C.muted, height: 1.4))),
        for (final v in asked)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Glass(
              radius: 18,
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Avatar('${v['user']?['fullname'] ?? ''}', size: 38),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${v['user']?['fullname'] ?? ''}', style: body(14.5, weight: FontWeight.w600)),
                        Text(dayTime(DateTime.tryParse('${v['preferred_at']}') ?? DateTime.now()), style: body(12.5, color: C.muted, height: 1.3)),
                      ],
                    ),
                  ),
                  Text(
                    switch (v['status']) {
                      'accepted' => t('Accepted', 'Limekubaliwa'),
                      'declined' => t('Declined', 'Limekataliwa'),
                      'cancelled' => t('Cancelled', 'Limeghairiwa'),
                      _ => t('Waiting', 'Linasubiri'),
                    },
                    style: body(12, weight: FontWeight.w700, color: v['status'] == 'pending' ? C.brassInk : C.muted),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _UnitSummaryRow extends StatelessWidget {
  const _UnitSummaryRow(this.u, {required this.onTap});
  final HouseUnit u;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Press(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: C.card.withValues(alpha: .5),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: C.line),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 54,
                  height: 54,
                  child: u.image != null
                      ? Photo(u.image, width: 54)
                      : Container(
                          color: C.fill,
                          child: Icon(Icons.meeting_room_outlined, size: 24, color: C.muted),
                        ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(u.unitNumber, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(13.5, weight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(
                      '${u.unitType ?? t('Unit', 'Chumba')} • ${tzs(u.rent)}${u.paymentTerms != null ? ' (${u.paymentTerms})' : ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: body(11.5, color: C.muted),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              _StatusBadge(u.status),
            ],
          ),
        ),
      ),
    );
  }
}

class _OwnerUnitCard extends StatelessWidget {
  const _OwnerUnitCard({
    required this.unit,
    required this.onEdit,
    required this.onStatusChange,
    required this.onDelete,
  });
  final HouseUnit unit;
  final VoidCallback onEdit;
  final ValueChanged<String> onStatusChange;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Glass(
        radius: 18,
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (unit.image != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  height: 140,
                  width: double.infinity,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Photo(unit.image),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: _StatusBadge(unit.status),
                      ),
                      if (unit.unitType != null && unit.unitType!.isNotEmpty)
                        Positioned(
                          bottom: 8,
                          left: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: .6),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              unit.unitType!,
                              style: body(11, color: Colors.white, weight: FontWeight.w600),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(unit.unitNumber, style: display(15, weight: FontWeight.w800)),
                      const SizedBox(height: 2),
                      Text(
                        '${unit.bedrooms} ${unit.bedrooms == 1 ? t('bed', 'chumba') : t('beds', 'vyumba')} • ${unit.bathrooms} ${unit.bathrooms == 1 ? t('bath', 'bafu') : t('baths', 'mabafu')}',
                        style: body(12, color: C.muted),
                      ),
                    ],
                  ),
                ),
                if (unit.image == null) _StatusBadge(unit.status),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  tzs(unit.rent),
                  style: display(16, color: C.teal, weight: FontWeight.w800),
                ),
                Text(t(' /month', ' /mwezi'), style: body(12, color: C.muted)),
                if (unit.paymentTerms != null && unit.paymentTerms!.isNotEmpty) ...[
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: C.brassInk.withValues(alpha: .12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      unit.paymentTerms!,
                      style: body(11, color: C.brassInk, weight: FontWeight.w700),
                    ),
                  ),
                ],
              ],
            ),
            if (unit.description.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                unit.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: body(12.5, color: C.muted, height: 1.35),
              ),
            ],
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Wrap(
                    spacing: 6,
                    children: [
                      for (final s in ['available', 'rented', 'maintenance'])
                        Press(
                          onTap: () => onStatusChange(s),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: unit.status == s ? C.tealLight : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: unit.status == s ? C.teal : C.line),
                            ),
                            child: Text(
                              _status(s).$1,
                              style: body(10.5, color: unit.status == s ? C.teal : C.muted, weight: FontWeight.w600),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  color: C.wino,
                  onPressed: onEdit,
                  tooltip: t('Edit unit', 'Hariri chumba'),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, size: 18),
                  color: C.hibiscus,
                  onPressed: onDelete,
                  tooltip: t('Delete unit', 'Futa chumba'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
