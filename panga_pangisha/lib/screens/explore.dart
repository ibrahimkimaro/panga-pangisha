import 'dart:async';

import 'package:flutter/material.dart';

import '../api.dart';
import '../l10n.dart';
import '../live.dart';
import '../ui.dart';
import 'listing.dart';
import 'notifications.dart';

const houseTypes = ['House', 'Apartment', 'Room', 'Studio'];

String typeName(String type) => switch (type) {
  'House' => t('House', 'Nyumba'),
  'Apartment' => t('Apartment', 'Apatimenti'),
  'Room' => t('Room', 'Chumba'),
  'Studio' => t('Studio', 'Studio'),
  _ => type,
};

IconData typeIcon(String type) => switch (type) {
  'House' => Icons.cottage_outlined,
  'Apartment' => Icons.apartment_rounded,
  'Room' => Icons.meeting_room_outlined,
  'Studio' => Icons.weekend_outlined,
  _ => Icons.home_outlined,
};

/// Who advertises, what was checked and when: shown wherever a listing appears (SRS PROP-003/004).
class TrustTags extends StatelessWidget {
  const TrustTags(this.house, {super.key, this.brief = false});
  final House house;

  /// Cards show the two main labels; the listing page shows all of them.
  final bool brief;

  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 6,
    runSpacing: 6,
    children: [
      house.byOwner
          ? Tag(t('Owner', 'Mmiliki'), icon: Icons.key_rounded)
          : Tag(
              t('Representative', 'Mwakilishi'),
              icon: Icons.badge_outlined,
              bg: C.sand,
              fg: C.brassInk,
            ),
      house.verifiedAt != null
          ? Tag(
              t(
                'Checked ${day(house.verifiedAt!)}',
                'Imehakikiwa ${day(house.verifiedAt!)}',
              ),
              icon: Icons.verified_rounded,
              bg: C.mkoko,
              fg: Colors.white,
            )
          : Tag(
              t('Not checked yet', 'Bado haijahakikiwa'),
              icon: Icons.help_outline_rounded,
              bg: Colors.white,
              fg: C.muted,
            ),
      if (house.stale && !brief)
        Tag(
          t(
            'Availability not confirmed lately',
            'Upatikanaji haujathibitishwa karibuni',
          ),
          icon: Icons.schedule_rounded,
          bg: C.blush,
          fg: const Color(0xFF8E1F36),
        ),
    ],
  );
}

/// The heart on every listing. All hearts for one home stay in step through [saved].
class Heart extends StatefulWidget {
  const Heart(this.houseId, {super.key});
  final int houseId;

  @override
  State<Heart> createState() => _HeartState();
}

class _HeartState extends State<Heart> with SingleTickerProviderStateMixin {
  late final _pop = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 420),
    value: 1,
  );
  late bool _on = saved.value.contains(widget.houseId);

  @override
  void initState() {
    super.initState();
    saved.addListener(_changed);
  }

  void _changed() {
    final on = saved.value.contains(widget.houseId);
    if (on == _on) return;
    setState(() => _on = on);
    if (on && !reduceMotion) _pop.forward(from: 0); // only saving celebrates
  }

  @override
  void dispose() {
    saved.removeListener(_changed);
    _pop.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ScaleTransition(
    scale: Tween(
      begin: .6,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _pop, curve: Curves.elasticOut)),
    child: RoundIcon(
      _on ? Icons.favorite_rounded : Icons.favorite_border_rounded,
      color: _on ? C.hibiscus : C.wino,
      label: _on
          ? t('Remove from saved', 'Ondoa kwenye zilizohifadhiwa')
          : t('Save this home', 'Hifadhi nyumba hii'),
      onTap: () => toggleSaved(widget.houseId),
    ),
  );
}

class ListingCard extends StatelessWidget {
  const ListingCard(this.house, {super.key, required this.from});
  final House house;

  /// Which list this card is in; keeps Hero tags unique across tabs.
  final String from;

  @override
  Widget build(BuildContext context) {
    final tag = '$from-${house.id}';
    return Press(
      onTap: () => push(context, ListingScreen(house, heroTag: tag)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Hero(
                tag: tag,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: AspectRatio(
                    aspectRatio: 16 / 10.5,
                    child: Photo(house.photos.firstOrNull),
                  ),
                ),
              ),
              Positioned(top: 12, right: 12, child: Heart(house.id)),
              Positioned(
                left: 12,
                bottom: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 13,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: C.card,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text.rich(
                    TextSpan(
                      text: tzs(house.rent),
                      style: display(17),
                      children: [
                        TextSpan(
                          text: t(' a month', ' kwa mwezi'),
                          style: body(13, color: C.muted),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            house.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: display(19),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.place_outlined, size: 16, color: C.muted),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  house.place,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: body(14.5, color: C.muted, height: 1.2),
                ),
              ),
              Facts(house),
            ],
          ),
          const SizedBox(height: 10),
          TrustTags(house, brief: true),
        ],
      ),
    );
  }
}

/// Bedrooms and bathrooms as two small counts.
class Facts extends StatelessWidget {
  const Facts(this.house, {super.key});
  final House house;

  @override
  Widget build(BuildContext context) {
    Widget fact(IconData icon, int n, String label) => Semantics(
      label: '$n $label',
      child: ExcludeSemantics(
        child: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Row(
            children: [
              Icon(icon, size: 17, color: C.teal),
              const SizedBox(width: 4),
              Text(
                '$n',
                style: body(14.5, weight: FontWeight.w600, height: 1.2),
              ),
            ],
          ),
        ),
      ),
    );
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        fact(
          Icons.bed_outlined,
          house.bedrooms,
          t('bedrooms', 'vyumba vya kulala'),
        ),
        fact(Icons.shower_outlined, house.bathrooms, t('bathrooms', 'bafu')),
      ],
    );
  }
}

class CardBones extends StatelessWidget {
  const CardBones({super.key});

  @override
  Widget build(BuildContext context) => const Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      AspectRatio(
        aspectRatio: 16 / 10.5,
        child: Bone(radius: 24, height: double.infinity),
      ),
      SizedBox(height: 12),
      Bone(height: 20, width: 220),
      SizedBox(height: 8),
      Bone(height: 14, width: 140),
      SizedBox(height: 28),
    ],
  );
}

class _Filters {
  String q = '';
  String? type;
  int? beds;
  int? maxRent;
  bool checked = false;

  int get count =>
      (beds != null ? 1 : 0) + (maxRent != null ? 1 : 0) + (checked ? 1 : 0);

  Map<String, dynamic> get query => {
    'per_page': 50,
    if (q.isNotEmpty) 'q': q,
    'property_type': ?type,
    'min_bedrooms': ?beds,
    'max_price': ?maxRent,
    if (checked) 'verified': 1,
  };
}

/// Renter home: search, filter and browse.
class ExploreTab extends StatefulWidget {
  const ExploreTab({super.key});

  @override
  State<ExploreTab> createState() => _ExploreTabState();
}

class _ExploreTabState extends State<ExploreTab> {
  final _f = _Filters();
  List<House>? _homes;
  String? _error;
  Timer? _typing;
  int _request = 0;
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    _load();
    _loadUnread();
    Live.arrived.addListener(_loadUnread); // the bell counts a new notification the moment it arrives
  }

  @override
  void dispose() {
    Live.arrived.removeListener(_loadUnread);
    _typing?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final mine = ++_request;
    setState(() => _error = null);
    try {
      final homes = House.list(
        await Api.get('landlord/search_house/', _f.query),
      );
      if (mounted && mine == _request) setState(() => _homes = homes);
    } on ApiError catch (e) {
      if (mounted && mine == _request) setState(() => _error = e.message);
    }
  }

  Future<void> _loadUnread() async {
    try {
      final n = (await Api.get('notifications'))['unread'] ?? 0;
      if (mounted) setState(() => _unread = n);
    } on ApiError {
      // The bell just stays quiet.
    }
  }

  void _search(String q) {
    _typing?.cancel();
    _typing = Timer(const Duration(milliseconds: 380), () {
      _f.q = q.trim();
      setState(() => _homes = null);
      _load();
    });
  }

  void _apply(VoidCallback change) {
    setState(() {
      change();
      _homes = null;
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final first = (Api.user.value?['fullname'] ?? '')
        .toString()
        .split(' ')
        .first;
    final homes = _homes;
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        color: C.mkoko,
        onRefresh: _load,
        child: CustomScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            t('Habari, $first', 'Habari, $first'),
                            style: body(
                              15.5,
                              color: C.muted,
                              weight: FontWeight.w500,
                            ),
                          ),
                        ),
                        Badge(
                          isLabelVisible: _unread > 0,
                          backgroundColor: C.hibiscus,
                          label: Text('$_unread'),
                          child: RoundIcon(
                            Icons.notifications_none_rounded,
                            label: t('Notifications', 'Arifa'),
                            onTap: () async {
                              await push(context, const NotificationsScreen());
                              _loadUnread();
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t('Where do you want to live?', 'Unataka kuishi wapi?'),
                      style: display(31),
                    ),
                  ],
                ).reveal(),
              ),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _SearchBar(
                filters: _f,
                onSearch: _search,
                onType: (type) => _apply(() => _f.type = type),
                onFilters: () async {
                  final changed = await sheet<bool>(context, _FilterSheet(_f));
                  if (changed == true) _apply(() {});
                },
              ),
            ),
            if (_error != null && homes == null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Notice(
                  icon: Icons.cloud_off_outlined,
                  title: t('Homes did not load', 'Nyumba hazijafunguka'),
                  text: _error!,
                  action: t('Try again', 'Jaribu tena'),
                  onAction: _load,
                ),
              )
            else if (homes == null)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
                sliver: SliverList.list(
                  children: const [CardBones(), CardBones()],
                ),
              )
            else if (homes.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Notice(
                  icon: Icons.search_off_rounded,
                  title: t(
                    'No homes match yet',
                    'Hakuna nyumba inayolingana bado',
                  ),
                  text: t(
                    'Try a nearby area, a higher budget or fewer filters.',
                    'Jaribu eneo la jirani, bajeti kubwa zaidi au vichujio vichache.',
                  ),
                ),
              )
            else ...[
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(22, 4, 20, 10),
                  child: Text(
                    homes.length == 1
                        ? t('1 home', 'Nyumba 1')
                        : t('${homes.length} homes', 'Nyumba ${homes.length}'),
                    style: body(14, color: C.muted, weight: FontWeight.w600),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                sliver: SliverList.separated(
                  itemCount: homes.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 28),
                  itemBuilder: (_, i) {
                    final card = ListingCard(homes[i], from: 'explore');
                    return i < 3 ? card.reveal(i + 1) : card;
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SearchBar extends SliverPersistentHeaderDelegate {
  _SearchBar({
    required this.filters,
    required this.onSearch,
    required this.onType,
    required this.onFilters,
  });
  final _Filters filters;
  final ValueChanged<String> onSearch;
  final ValueChanged<String?> onType;
  final VoidCallback onFilters;

  @override
  double get minExtent => 138;
  @override
  double get maxExtent => 138;
  @override
  bool shouldRebuild(_SearchBar old) => true;

  @override
  Widget build(BuildContext context, double shrink, bool overlaps) => Container(
    color: C.chokaa,
    padding: const EdgeInsets.only(top: 12),
    child: Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: onSearch,
                  textInputAction: TextInputAction.search,
                  style: body(16),
                  decoration: InputDecoration(
                    hintText: t('Area, street or name', 'Eneo, mtaa au jina'),
                    prefixIcon: Icon(
                      Icons.search_rounded,
                      color: C.teal,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Badge(
                isLabelVisible: filters.count > 0,
                backgroundColor: C.shaba,
                textColor: C.wino,
                label: Text('${filters.count}'),
                child: Press(
                  onTap: onFilters,
                  label: t('Filters', 'Vichujio'),
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: C.mkoko,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.tune_rounded, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            children: [
              Choice(
                t('All', 'Zote'),
                on: filters.type == null,
                onTap: () => onType(null),
              ),
              for (final type in houseTypes)
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Choice(
                    typeName(type),
                    icon: typeIcon(type),
                    on: filters.type == type,
                    onTap: () => onType(filters.type == type ? null : type),
                  ),
                ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet(this.filters);
  final _Filters filters;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late int? _beds = widget.filters.beds;
  late int? _max = widget.filters.maxRent;
  late bool _checked = widget.filters.checked;

  @override
  Widget build(BuildContext context) {
    Widget group<T>(
      String title,
      List<(T?, String)> options,
      T? value,
      ValueChanged<T?> set,
    ) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: body(15, weight: FontWeight.w600)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final (v, label) in options)
              Choice(
                label,
                on: value == v,
                onTap: () => setState(() => set(v)),
              ),
          ],
        ),
        const SizedBox(height: 22),
      ],
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(t('Filters', 'Vichujio'), style: display(24)),
        const SizedBox(height: 18),
        group<int>(
          t('Bedrooms, at least', 'Vyumba vya kulala, angalau'),
          [(null, t('Any', 'Yoyote')), (1, '1'), (2, '2'), (3, '3'), (4, '4+')],
          _beds,
          (v) => _beds = v,
        ),
        group<int>(
          t('Rent a month, up to', 'Kodi kwa mwezi, isizidi'),
          [
            (null, t('Any', 'Yoyote')),
            for (final v in [200000, 500000, 1000000, 2000000]) (v, tzs(v)),
          ],
          _max,
          (v) => _max = v,
        ),
        SwitchListTile.adaptive(
          contentPadding: EdgeInsets.zero,
          activeTrackColor: C.mkoko,
          value: _checked,
          onChanged: (v) => setState(() => _checked = v),
          title: Text(
            t('Checked listings only', 'Matangazo yaliyohakikiwa tu'),
            style: body(15, weight: FontWeight.w600),
          ),
          subtitle: Text(
            t(
              'We confirmed the advertiser owns or may let the home.',
              'Tumethibitisha mtangazaji anamiliki au ana ruhusa ya kupangisha.',
            ),
            style: body(13.5, color: C.muted),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Button(
                t('Clear', 'Futa'),
                tone: Tone.plain,
                onTap: () => setState(() {
                  _beds = _max = null;
                  _checked = false;
                }),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: Button(
                t('Show homes', 'Onyesha nyumba'),
                onTap: () {
                  widget.filters
                    ..beds = _beds
                    ..maxRent = _max
                    ..checked = _checked;
                  Navigator.pop(context, true);
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Homes the renter saved.
class SavedTab extends StatelessWidget {
  const SavedTab({super.key});

  @override
  Widget build(BuildContext context) => SafeArea(
    bottom: false,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
          child: Text(
            t('Saved homes', 'Nyumba ulizohifadhi'),
            style: display(31),
          ),
        ),
        Expanded(
          child: Loader<List<House>>(
            load: () async => House.list(await Api.get('favorites')),
            bones: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: CardBones(),
            ),
            builder: (context, homes, reload) => ValueListenableBuilder(
              valueListenable: saved,
              builder: (context, ids, _) {
                final shown = homes.where((h) => ids.contains(h.id)).toList();
                return RefreshIndicator(
                  color: C.mkoko,
                  onRefresh: reload,
                  child: shown.isEmpty
                      ? ListView(
                          children: [
                            SizedBox(
                              height: 440,
                              child: Notice(
                                icon: Icons.favorite_border_rounded,
                                title: t(
                                  'Nothing saved yet',
                                  'Bado hujahifadhi',
                                ),
                                text: t(
                                  'Tap the heart on a home to keep it here and compare later.',
                                  'Gusa moyo kwenye nyumba ili uihifadhi hapa na kulinganisha baadaye.',
                                ),
                              ),
                            ),
                          ],
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(20, 4, 20, 120),
                          itemCount: shown.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 28),
                          itemBuilder: (_, i) =>
                              ListingCard(shown[i], from: 'saved'),
                        ),
                );
              },
            ),
          ),
        ),
      ],
    ),
  );
}
