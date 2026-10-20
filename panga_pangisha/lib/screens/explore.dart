import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api.dart';
import '../l10n.dart';
import '../live.dart';
import '../ui.dart';
import 'listing.dart';
import 'notifications.dart';
import 'veyora_assistant.dart';
import 'owner/rental_agreements_screen.dart';

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

enum FeedCategory {
  all,
  houses,
  apartments,
  hotels,
  works,
  community,
  rooms,
}

String categoryLabel(FeedCategory cat) => switch (cat) {
  FeedCategory.all => t('All Feeds', 'Zote'),
  FeedCategory.houses => t('Houses & Villas', 'Nyumba & Majengo'),
  FeedCategory.apartments => t('Apartments', 'Apatimenti'),
  FeedCategory.hotels => t('Hotels & Lodges', 'Hoteli & Vyumba'),
  FeedCategory.works => t('Fundi & Works', 'Mafundi & Kazi'),
  FeedCategory.community => t('Community Alerts', 'Taarifa za Mtaa'),
  FeedCategory.rooms => t('Rooms & Studios', 'Vyumba Pekee'),
};

IconData categoryIcon(FeedCategory cat) => switch (cat) {
  FeedCategory.all => Icons.auto_awesome_rounded,
  FeedCategory.houses => Icons.cottage_rounded,
  FeedCategory.apartments => Icons.apartment_rounded,
  FeedCategory.hotels => Icons.hotel_rounded,
  FeedCategory.works => Icons.handyman_rounded,
  FeedCategory.community => Icons.campaign_rounded,
  FeedCategory.rooms => Icons.meeting_room_rounded,
};

class FeedComment {
  FeedComment({
    required this.userName,
    required this.text,
    required this.timeAgo,
    this.userAvatar,
    this.likes = 0,
    this.isLiked = false,
    this.isSaved = false,
    List<FeedComment>? replies,
    this.replyTo,
  }) : replies = replies ?? [];

  final String userName;
  final String text;
  final String timeAgo;
  final String? userAvatar;
  int likes;
  bool isLiked;
  bool isSaved;
  final List<FeedComment> replies;
  final String? replyTo;
}

class FeedPostItem {
  FeedPostItem({
    required this.id,
    required this.category,
    required this.authorName,
    required this.authorRole,
    required this.location,
    required this.timeAgo,
    required this.title,
    required this.description,
    required this.images,
    required this.price,
    required this.badge,
    required this.badgeColor,
    required this.tags,
    required this.likesCount,
    required this.commentsCount,
    required this.comments,
    required this.actionText,
    required this.actionIcon,
    this.isVerified = true,
    this.isLiked = false,
    this.isSaved = false,
    this.authorAvatar,
    this.houseData,
    int? houseLikesCount,
    int? roomLikesCount,
    this.isHouseLiked = false,
    this.isRoomLiked = false,
    this.isHouseSaved = false,
    this.isRoomSaved = false,
  })  : houseLikesCount = houseLikesCount ?? likesCount,
        roomLikesCount = roomLikesCount ?? ((likesCount * 0.7).round() + 3);

  final String id;
  final FeedCategory category;
  final String authorName;
  final String authorRole;
  final String location;
  final String timeAgo;
  final String title;
  final String description;
  final List<String> images;
  final String price;
  final String badge;
  final Color badgeColor;
  final List<String> tags;
  int likesCount;
  int commentsCount;
  final List<FeedComment> comments;
  final String actionText;
  final IconData actionIcon;
  final bool isVerified;
  bool isLiked;
  bool isSaved;
  final String? authorAvatar;
  final House? houseData;

  // Granular Room vs Whole House Like & Save state
  int houseLikesCount;
  int roomLikesCount;
  bool isHouseLiked;
  bool isRoomLiked;
  bool isHouseSaved;
  bool isRoomSaved;
}

class _InstagramFilters {
  String q = '';
  FeedCategory category = FeedCategory.all;
  int? maxPrice;
  bool verifiedOnly = false;
}

/// Instagram-style Discovery Feed Home Screen for Tenants
class ExploreTab extends StatefulWidget {
  const ExploreTab({super.key});

  @override
  State<ExploreTab> createState() => _ExploreTabState();
}

class _ExploreTabState extends State<ExploreTab> {
  final _filters = _InstagramFilters();
  List<House>? _apiHouses;
  int _unread = 0;

  late List<FeedPostItem> _curatedPosts;

  @override
  void initState() {
    super.initState();
    _initCuratedPosts();
    _load();
    _loadUnread();
    Live.arrived.addListener(_loadUnread);
  }

  @override
  void dispose() {
    Live.arrived.removeListener(_loadUnread);
    super.dispose();
  }

  void _initCuratedPosts() {
    _curatedPosts = [
      // 1. House Rental Post
      FeedPostItem(
        id: 'curated-house-1',
        category: FeedCategory.houses,
        authorName: 'Mama Salma Properties',
        authorRole: t('Verified Landlord', 'Mmiliki Aliyehakikiwa'),
        location: 'Mikocheni B, Dar es Salaam',
        timeAgo: '2h ago',
        title: t('Modern 2-Bedroom Apartment with Backup Generator', 'Apatimenti ya Kisasa ya Vyumba 2 na Jenereta'),
        description: t(
          'Executive apartment located in prime Mikocheni B. Comes with full AC in all rooms, backup generator for 24/7 power, borehole + DAWASA water supply, and 24hr security guard. Quiet neighborhood near Shoppers Plaza.',
          'Apatimenti nzuri Mikocheni B. Ina viyoyozi vyumba vyote, jenereta la dharura, maji ya DAWASA na kisima 24/7, ulinzi wa uhakika. Eneo tulivu karibu na Shoppers Plaza.',
        ),
        images: [
          'assets/images/welcome_hero.jpg',
          'assets/images/discover_terrace.jpg',
        ],
        price: 'TZS 650,000 / mwezi',
        badge: t('House for Rent', 'Inapangishwa'),
        badgeColor: C.teal,
        tags: ['2 Bedrooms', '2 Bathrooms', 'AC Units', 'LUKU Yake', 'DAWASA 24/7', 'Parking'],
        likesCount: 184,
        commentsCount: 14,
        actionText: t('Inquire Property', 'Wasiliana na Mmiliki'),
        actionIcon: Icons.phone_in_talk_rounded,
        comments: [
          FeedComment(
            userName: 'baraka_m',
            text: t('Is parking inside the compound gate?', 'Kuna nafasi ya gari ndani ya geti?'),
            timeAgo: '1h ago',
            likes: 4,
          ),
          FeedComment(
            userName: 'neema_j',
            text: t('Very clean finishing! Is rent paid 6 months or 1 year?', 'Pazuri sana! Kodi ni miezi 6 au mwaka?'),
            timeAgo: '45m ago',
            likes: 2,
          ),
        ],
      ),

      // 2. Hotel Room / Lodge Stay Post
      FeedPostItem(
        id: 'curated-hotel-1',
        category: FeedCategory.hotels,
        authorName: 'Serena Ocean Lodge & Suites',
        authorRole: t('Lodge Host', 'Mwenyeji wa Hoteli'),
        location: 'Masaki Peninsula, Dar es Salaam',
        timeAgo: '4h ago',
        title: t('Executive Ocean View Suite - Daily & Weekend Stays', 'Chumba cha Kifahari chenye Mtazamo wa Bahari'),
        description: t(
          'Breathtaking ocean views, super king bed, complimentary buffet breakfast, unlimited high-speed fiber Wi-Fi, and access to infinity pool. Ideal for business trips, short stays or weekend getaways.',
          'Chumba chenye mtazamo maridadi wa bahari Masaki. Kina kitanda kikubwa, kifungua kinywa cha bure, mtandao wa kasi wa Wi-Fi na bwawa la kuogelea. Kinafaa kwa safari za kikazi na mapumziko.',
        ),
        images: [
          'assets/images/discover_terrace.jpg',
          'assets/images/manage_bg.jpg',
        ],
        price: 'TZS 85,000 / usiku',
        badge: t('Hotel Suite', 'Chumba cha Hoteli'),
        badgeColor: const Color(0xFFD97706),
        tags: ['Ocean View', 'Free Breakfast', 'High-Speed Wi-Fi', 'Swimming Pool', 'AC'],
        likesCount: 236,
        commentsCount: 21,
        actionText: t('Book Room Now', 'Hifadhi Chumba'),
        actionIcon: Icons.calendar_month_rounded,
        comments: [
          FeedComment(
            userName: 'david_k',
            text: t('Do you offer airport pick-up service?', 'Mna huduma ya usafiri kutoka uwanja wa ndege?'),
            timeAgo: '2h ago',
            likes: 3,
          ),
        ],
      ),

      // 3. Handyman / Works Post
      FeedPostItem(
        id: 'curated-work-1',
        category: FeedCategory.works,
        authorName: 'Fundi Juma Umeme & AC',
        authorRole: t('Certified Electrical Fundi', 'Fundi Umeme Aliyeidhinishwa'),
        location: 'Sinza, Kijitonyama & Kinondoni',
        timeAgo: '6h ago',
        title: t('Certified Electrical Wiring, LUKU Upgrades & Emergency AC Servicing', 'Wiring za Umeme, Maboresho ya LUKU na Huduma ya AC'),
        description: t(
          'Over 9 years of trusted experience. Professional troubleshooting for tripping circuit breakers, short circuits, LUKU sub-meter installation, split AC gas refill & cleaning. Fast response within 30 minutes in Kinondoni district.',
          'Uzoefu wa zaidi ya miaka 9. Huduma ya haraka ya kurekebisha shoti, kufunga sub-mita za LUKU, kuweka gesi ya AC na kusafisha. Tunafika ndani ya dakika 30 maeneo ya Kinondoni, Sinza na Mikocheni.',
        ),
        images: [
          'assets/images/connect_ecosystem.jpg',
        ],
        price: 'From TZS 25,000 / kazi',
        badge: t('Verified Fundi', 'Fundi Kazini'),
        badgeColor: const Color(0xFF2563EB),
        tags: ['Licensed Fundi', '24/7 Emergency', 'LUKU Sub-meters', 'AC Gas Refill', 'Guaranteed'],
        likesCount: 98,
        commentsCount: 17,
        actionText: t('Call Fundi / Request Work', 'Piga Simu Fundi'),
        actionIcon: Icons.handyman_rounded,
        comments: [
          FeedComment(
            userName: 'rashid_mwamba',
            text: t('Fundi Juma alirekebisha AC yangu jana, anafanya kazi kwa weledi na uaminifu mkubwa!', 'Fundi Juma alirekebisha AC yangu jana, anafanya kazi kwa weledi!'),
            timeAgo: '3h ago',
            likes: 8,
          ),
        ],
      ),

      // 4. Community Alert & Neighborhood Issues Post
      FeedPostItem(
        id: 'curated-issue-1',
        category: FeedCategory.community,
        authorName: 'Mikocheni Residents Association',
        authorRole: t('Ward Committee Admin', 'Kamati ya Maendeleo ya Mtaa'),
        location: 'Mikocheni A & B, Dar es Salaam',
        timeAgo: '8h ago',
        title: t('Scheduled DAWASA Water Pipeline Maintenance & Tanker Water Schedule', 'Ratiba ya Maji DAWASA na Matengenezo ya Mabomba'),
        description: t(
          'Notice to all residents and tenants: DAWASA has scheduled network maintenance this Thursday from 9:00 AM to 4:00 PM. Clean water reserve bowsers will be stationed at Mikocheni B Grounds for registered tenants.',
          'Taarifa kwa wapangaji na wakazi wote: DAWASA wametangaza matengenezo ya miundombinu Alhamisi hii kuanzia saa 3 asubuhi hadi 10 jioni. Magari ya maji safi yatasambazwa viwanja vya Mikocheni B kwa matumizi ya dharura.',
        ),
        images: [
          'assets/images/save_piggy.jpg',
        ],
        price: t('Community Notice', 'Taarifa ya Mtaa'),
        badge: t('Community Alert', 'Taarifa Muhimu'),
        badgeColor: const Color(0xFFDC2626),
        tags: ['DAWASA Alert', 'Water Maintenance', 'Mikocheni Ward', 'Resident Update'],
        likesCount: 312,
        commentsCount: 42,
        actionText: t('Join Neighborhood Discussion', 'Toa Maoni ya Mtaa'),
        actionIcon: Icons.forum_rounded,
        comments: [
          FeedComment(
            userName: 'mama_kelvin',
            text: t('Asanteni sana kwa taarifa mapema, tutajaza matangi yetu leo.', 'Asanteni kwa taarifa mapema, tutajaza matangi leo.'),
            timeAgo: '5h ago',
            likes: 12,
          ),
        ],
      ),

      // 5. Single Room / Studio Post
      FeedPostItem(
        id: 'curated-room-1',
        category: FeedCategory.rooms,
        authorName: 'Kijitonyama Urban Living',
        authorRole: t('Verified Host', 'Mwenyeji Aliyehakikiwa'),
        location: 'Kijitonyama near Makumbusho',
        timeAgo: '1d ago',
        title: t('Modern Self-Contained Master Studio with Private Meter', 'Chumba cha Kisasa Chenye Choo Ndani & Mita Yake'),
        description: t(
          'Perfect single room with modern private washroom, gypsum ceiling, ceramic tiles, paved compound, and dedicated LUKU sub-meter. Located 3 minutes walk from Makumbusho Bus Terminal.',
          'Chumba safi chenye choo cha ndani (master), gypsum, vigae vya kisasa, uzio mzuri na mita yake ya LUKU. Kiko umbali wa dakika 3 tu kutoka kituo cha Makumbusho.',
        ),
        images: [
          'assets/images/welcome_hero.jpg',
        ],
        price: 'TZS 220,000 / mwezi',
        badge: t('Room for Rent', 'Chumba'),
        badgeColor: const Color(0xFF8B5CF6),
        tags: ['Master Bedroom', 'Private LUKU', 'Paved Yard', 'Near Transit'],
        likesCount: 147,
        commentsCount: 9,
        actionText: t('Inquire Room', 'Wasiliana na Mwenyeji'),
        actionIcon: Icons.meeting_room_rounded,
        comments: [
          FeedComment(
            userName: 'john_paul',
            text: t('Is there water supply inside the room?', 'Maji yanatoka ndani ya chumba?'),
            timeAgo: '12h ago',
            likes: 1,
          ),
        ],
      ),
    ];
  }

  Future<void> _load() async {
    try {
      final res = await Api.get('landlord/search_house/', {
        'per_page': 50,
        if (_filters.q.isNotEmpty) 'q': _filters.q,
      });
      if (mounted) {
        setState(() {
          _apiHouses = House.list(res);
        });
      }
    } catch (e) {
      // Offline fallback: keep curated feed vibrant
      if (mounted) setState(() => _apiHouses ??= []);
    }
  }

  Future<void> _loadUnread() async {
    try {
      final n = (await Api.get('notifications'))['unread'] ?? 0;
      if (mounted) setState(() => _unread = n);
    } catch (_) {}
  }

  List<FeedPostItem> _filteredPosts() {
    // Map real API houses to feed items
    final apiFeedItems = <FeedPostItem>[];
    if (_apiHouses != null) {
      for (final h in _apiHouses!) {
        apiFeedItems.add(
          FeedPostItem(
            id: 'house-${h.id}',
            category: h.type.toLowerCase().contains('apart')
                ? FeedCategory.apartments
                : (h.type.toLowerCase().contains('room')
                    ? FeedCategory.rooms
                    : FeedCategory.houses),
            authorName: h.ownerName.isNotEmpty ? h.ownerName : 'Panga Verified Owner',
            authorRole: h.byOwner ? t('Direct Owner', 'Mmiliki') : t('Representative', 'Mwakilishi'),
            location: h.place.isNotEmpty ? h.place : 'Dar es Salaam',
            timeAgo: 'Just now',
            title: h.name,
            description: h.description.isNotEmpty
                ? h.description
                : t('Spacious verified property ready for inspection and immediate occupancy.', 'Nyumba iliyohakikiwa tayari kwa kuangaliwa na kupanga mara moja.'),
            images: h.photos.isNotEmpty ? h.photos : ['assets/images/welcome_hero.jpg'],
            price: '${tzs(h.rent)} / mwezi',
            badge: typeName(h.type),
            badgeColor: C.teal,
            tags: [
              '${h.bedrooms} ${t('Bedrooms', 'Vyumba')}',
              '${h.bathrooms} ${t('Baths', 'Bafu')}',
              ...h.amenities.take(3),
            ],
            likesCount: 75 + (h.id * 7) % 120,
            commentsCount: 6 + (h.id * 3) % 20,
            actionText: t('View House Details', 'Tazama Nyumba'),
            actionIcon: Icons.house_rounded,
            houseData: h,
            isSaved: saved.value.contains(h.id),
            comments: [
              FeedComment(
                userName: 'panga_fan',
                text: t('Is this home still available for viewing this weekend?', 'Bado ipo wazi kuangaliwa wikendi hii?'),
                timeAgo: '1h ago',
                likes: 2,
              ),
            ],
          ),
        );
      }
    }

    final combined = [...apiFeedItems, ..._curatedPosts];

    return combined.where((post) {
      // Category filter
      if (_filters.category != FeedCategory.all && post.category != _filters.category) {
        return false;
      }
      // Search filter
      if (_filters.q.isNotEmpty) {
        final q = _filters.q.toLowerCase();
        final match = post.title.toLowerCase().contains(q) ||
            post.location.toLowerCase().contains(q) ||
            post.authorName.toLowerCase().contains(q) ||
            post.description.toLowerCase().contains(q);
        if (!match) return false;
      }
      // Verified only filter
      if (_filters.verifiedOnly && !post.isVerified) {
        return false;
      }
      return true;
    }).toList();
  }

  void _openComments(FeedPostItem post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CommentsBottomSheet(post: post),
    );
  }

  void _openFilters() async {
    final changed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _InstagramFilterSheet(filters: _filters),
    );
    if (changed == true) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final posts = _filteredPosts();

    return Scaffold(
      backgroundColor: C.card,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: C.teal,
          onRefresh: _load,
          child: CustomScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            slivers: [
              // 1. Sleek Panga Top App Bar with Veyora AI
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 10, 16, 12),
                  child: Row(
                    children: [
                      // Brand Logo & Title with Panga aesthetics
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: C.teal,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: C.teal.withValues(alpha: 0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.home_work_rounded, color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Panga',
                                style: display(22, color: C.wino, weight: FontWeight.w900),
                              ),
                              Text(
                                t('Find Your Space', 'Tafuta Makazi'),
                                style: body(11, color: C.muted, weight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ],
                      ),

                      const Spacer(),

                      // Action 1: Veyora AI Button right in the Top Bar!
                      Press(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          push(context, const VeyoraAssistantScreen());
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6.5),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [C.tealLight, C.teal.withValues(alpha: 0.15)],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: C.teal.withValues(alpha: 0.35), width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: C.teal.withValues(alpha: 0.12),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.auto_awesome_rounded, size: 16, color: C.teal),
                              const SizedBox(width: 6),
                              Text(
                                'Veyora AI',
                                style: body(12, color: C.teal, weight: FontWeight.w800),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Action 2: Search & Filter
                      Press(
                        onTap: _openFilters,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: C.fill,
                            shape: BoxShape.circle,
                            border: Border.all(color: C.line, width: 1),
                          ),
                          child: Icon(Icons.tune_rounded, color: C.wino, size: 20),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Action 3: Notifications Bell
                      Badge(
                        isLabelVisible: _unread > 0,
                        backgroundColor: const Color(0xFFEF4444),
                        label: Text('$_unread'),
                        child: Press(
                          onTap: () async {
                            await push(context, const NotificationsScreen());
                            _loadUnread();
                          },
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: C.fill,
                              shape: BoxShape.circle,
                              border: Border.all(color: C.line, width: 1),
                            ),
                            child: Icon(Icons.notifications_outlined, color: C.wino, size: 20),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 2. Clean Horizontal Claymorphic Property Filter Status Bar
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 44,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: FeedCategory.values.length,
                    itemBuilder: (context, index) {
                      final cat = FeedCategory.values[index];
                      final isSelected = _filters.category == cat;

                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Press(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() {
                              _filters.category = cat;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                            decoration: BoxDecoration(
                              color: isSelected ? C.navy : Colors.white,
                              borderRadius: BorderRadius.circular(22),
                              border: Border.all(
                                color: isSelected ? C.navy : C.line,
                                width: 1.2,
                              ),
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: C.navy.withValues(alpha: 0.25),
                                        blurRadius: 8,
                                        offset: const Offset(0, 3),
                                      ),
                                    ]
                                  : [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.03),
                                        blurRadius: 4,
                                        offset: const Offset(0, 1),
                                      ),
                                    ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  categoryIcon(cat),
                                  size: 16,
                                  color: isSelected ? Colors.white : C.muted,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  categoryLabel(cat),
                                  style: body(
                                    12.5,
                                    color: isSelected ? Colors.white : C.wino,
                                    weight: isSelected ? FontWeight.w700 : FontWeight.w600,
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
              ),

              const SliverToBoxAdapter(
                child: SizedBox(height: 12),
              ),

              // 3. Instagram Feed Posts Continuous Scrolling
              if (posts.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.feed_outlined, size: 54, color: C.muted),
                          const SizedBox(height: 12),
                          Text(
                            t('No posts in this category yet', 'Hakuna taarifa kwenye kitengo hiki bado'),
                            style: display(18, color: C.wino),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            t('Try selecting another category or resetting filters.', 'Jaribu kuchagua kitengo kingine au kuweka upya vichujio.'),
                            style: body(14, color: C.muted),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 18),
                          Button(
                            t('Show All Feeds', 'Onyesha Zote'),
                            tone: Tone.plain,
                            onTap: () {
                              setState(() {
                                _filters.category = FeedCategory.all;
                                _filters.q = '';
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.only(bottom: 120),
                  sliver: SliverList.separated(
                    itemCount: posts.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 6),
                    itemBuilder: (context, index) {
                      final post = posts[index];
                      return _ClayPropertyCard(
                        post: post,
                        onComment: () => _openComments(post),
                        onLike: () {
                          HapticFeedback.selectionClick();
                          setState(() {
                            post.isLiked = !post.isLiked;
                            if (post.isLiked) {
                              post.likesCount++;
                            } else {
                              post.likesCount--;
                            }
                          });
                        },
                        onSave: () {
                          HapticFeedback.lightImpact();
                          setState(() {
                            post.isSaved = !post.isSaved;
                            if (post.houseData != null) {
                              toggleSaved(post.houseData!.id);
                            }
                          });
                          toast(
                            context,
                            post.isSaved
                                ? t('Saved to your collection ✓', 'Imehifadhiwa kwenye mkusanyiko wako ✓')
                                : t('Removed from saved', 'Imeondolewa kwenye zilizohifadhiwa'),
                          );
                        },
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A state-of-the-art Claymorphic Property Card with image overlays and engagement actions
class _ClayPropertyCard extends StatefulWidget {
  const _ClayPropertyCard({
    required this.post,
    required this.onComment,
    required this.onLike,
    required this.onSave,
  });

  final FeedPostItem post;
  final VoidCallback onComment;
  final VoidCallback onLike;
  final VoidCallback onSave;

  @override
  State<_ClayPropertyCard> createState() => _ClayPropertyCardState();
}

class _ClayPropertyCardState extends State<_ClayPropertyCard> {
  int _activeImageIndex = 0;

  Widget _buildMediaItem(String src) {
    if (src.startsWith('assets/')) {
      return Image.asset(src, fit: BoxFit.cover, width: double.infinity);
    }
    return Photo(src, fit: BoxFit.cover, width: double.infinity);
  }

  void _openDetail() {
    HapticFeedback.selectionClick();
    final post = widget.post;
    if (post.houseData != null) {
      push(
        context,
        ListingScreen(post.houseData!, heroTag: 'explore-${post.id}'),
      );
      return;
    }

    final rentNum = double.tryParse(post.price.replaceAll(RegExp(r'[^\d.]'), '')) ?? 500000;
    final syntheticHouse = House({
      'id': 9000 + post.id.hashCode.abs() % 1000,
      'property_name': post.title,
      'property_type': post.badge,
      'description': post.description,
      'district': post.location.split(',').first.trim(),
      'ward': post.location.contains(',') ? post.location.split(',').last.trim() : 'Dar es Salaam',
      'region': 'Dar es Salaam',
      'street': post.location,
      'bedrooms': post.tags.any((t) => t.toLowerCase().contains('bed')) ? 2 : 1,
      'bathrooms': 1,
      'monthly_rent': rentNum,
      'security_deposit': rentNum,
      'amenities': post.tags,
      'house_profile_image': post.images.firstOrNull,
      'image_urls': post.images.skip(1).toList(),
      'status': 'available',
      'advertiser_role': 'owner',
      'verified_at': DateTime.now().toIso8601String(),
      'owner': {
        'id': 100,
        'fullname': post.authorName,
        'profile_image': post.authorAvatar,
      },
    });

    push(
      context,
      ListingScreen(syntheticHouse, heroTag: 'explore-${post.id}'),
    );
  }

  void _openDocumentsAndAgreement() {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _TenantDocumentsAndAgreementSheet(post: widget.post),
    );
  }

  void _toggleHouseLike() {
    HapticFeedback.selectionClick();
    final post = widget.post;
    setState(() {
      post.isHouseLiked = !post.isHouseLiked;
      if (post.isHouseLiked) {
        post.houseLikesCount++;
      } else {
        post.houseLikesCount--;
      }
      post.isLiked = post.isHouseLiked || post.isRoomLiked;
      post.likesCount = post.houseLikesCount + post.roomLikesCount;
    });
    toast(
      context,
      post.isHouseLiked
          ? t('Liked whole house ❤️', 'Umeipenda nyumba nzima ❤️')
          : t('Unliked house', 'Umeondoa upendo kwenye nyumba'),
    );
  }

  void _toggleRoomLike() {
    HapticFeedback.selectionClick();
    final post = widget.post;
    setState(() {
      post.isRoomLiked = !post.isRoomLiked;
      if (post.isRoomLiked) {
        post.roomLikesCount++;
      } else {
        post.roomLikesCount--;
      }
      post.isLiked = post.isHouseLiked || post.isRoomLiked;
      post.likesCount = post.houseLikesCount + post.roomLikesCount;
    });
    if (post.isRoomLiked) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: C.navy,
          content: Text(
            t('🚪 Room saved! View rental agreement & documents?', '🚪 Chumba kimehifadhiwa! Tazama mkataba na nyaraka?'),
            style: body(13, color: Colors.white, weight: FontWeight.w600),
          ),
          action: SnackBarAction(
            label: t('View', 'Tazama'),
            textColor: const Color(0xFF38BDF8),
            onPressed: _openDocumentsAndAgreement,
          ),
          duration: const Duration(seconds: 4),
        ),
      );
    } else {
      toast(context, t('Removed room from saved', 'Umeondoa chumba kwenye zilizohifadhiwa'));
    }
  }

  void _showLikeOptions() {
    HapticFeedback.selectionClick();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
        decoration: BoxDecoration(
          color: C.card,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: .2), blurRadius: 20),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: C.line,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              t('Choose What to Like & Save', 'Chagua Unachopenda & Kuhifadhi'),
              style: display(17, color: C.wino, weight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(
              t('You can like either the individual room or the entire property unit.', 'Unaweza kupenda chumba kimoja maalum au nyumba nzima.'),
              style: body(13, color: C.muted),
            ),
            const SizedBox(height: 18),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: widget.post.isRoomLiked ? const Color(0xFFFEF2F2) : C.fill,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.meeting_room_rounded,
                  color: widget.post.isRoomLiked ? const Color(0xFFEF4444) : C.teal,
                ),
              ),
              title: Text(t('Like Specific Room / Studio', 'Penda Chumba Maalum'), style: body(14.5, weight: FontWeight.w700)),
              subtitle: Text(
                '${widget.post.roomLikesCount} ${t('tenants liked this room', 'wapangaji wamependa chumba hiki')}',
                style: body(12, color: C.muted),
              ),
              trailing: Icon(
                widget.post.isRoomLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                color: widget.post.isRoomLiked ? const Color(0xFFEF4444) : C.muted,
              ),
              onTap: () {
                Navigator.pop(ctx);
                _toggleRoomLike();
              },
            ),
            const Divider(height: 1),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: widget.post.isHouseLiked ? const Color(0xFFFEF2F2) : C.fill,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.cottage_rounded,
                  color: widget.post.isHouseLiked ? const Color(0xFFEF4444) : C.teal,
                ),
              ),
              title: Text(t('Like Entire House / Villa', 'Penda Nyumba Nzima'), style: body(14.5, weight: FontWeight.w700)),
              subtitle: Text(
                '${widget.post.houseLikesCount} ${t('tenants liked whole house', 'wapangaji wamependa nyumba nzima')}',
                style: body(12, color: C.muted),
              ),
              trailing: Icon(
                widget.post.isHouseLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                color: widget.post.isHouseLiked ? const Color(0xFFEF4444) : C.muted,
              ),
              onTap: () {
                Navigator.pop(ctx);
                _toggleHouseLike();
              },
            ),
            const Divider(height: 1),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: C.tealLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.description_outlined, color: C.teal),
              ),
              title: Text(t('View Documents & Rental Agreement', 'Nyaraka & Mkataba wa Upangaji'), style: body(14.5, color: C.teal, weight: FontWeight.w700)),
              subtitle: Text(t('Lease agreement terms, NIDA checklist & utilities', 'Masharti ya mkataba, orodha ya vitambulisho na huduma'), style: body(12, color: C.muted)),
              trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
              onTap: () {
                Navigator.pop(ctx);
                _openDocumentsAndAgreement();
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.07),
            offset: const Offset(0, 8),
            blurRadius: 20,
            spreadRadius: -2,
          ),
          const BoxShadow(
            color: Colors.white,
            offset: Offset(-2, -2),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Cover Image with Overlaid Details (Direct Click opens dedicated page!)
          GestureDetector(
            onTap: _openDetail,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              child: Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 16 / 10.5,
                    child: post.images.length > 1
                        ? PageView.builder(
                            itemCount: post.images.length,
                            onPageChanged: (i) => setState(() => _activeImageIndex = i),
                            itemBuilder: (_, i) => _buildMediaItem(post.images[i]),
                          )
                        : _buildMediaItem(post.images.firstOrNull ?? 'assets/images/welcome_hero.jpg'),
                  ),

                  // Gradient shade for overlay legibility
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.35),
                            Colors.transparent,
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.65),
                          ],
                          stops: const [0.0, 0.25, 0.65, 1.0],
                        ),
                      ),
                    ),
                  ),

                  // TOP-LEFT OVERLAY: Property Type & Verified Badge
                  Positioned(
                    top: 12,
                    left: 12,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5.5),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.55),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.25), width: 1),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(categoryIcon(post.category), size: 13, color: Colors.white),
                              const SizedBox(width: 5),
                              Text(
                                post.badge,
                                style: body(11.5, color: Colors.white, weight: FontWeight.w700),
                              ),
                              if (post.isVerified) ...[
                                const SizedBox(width: 5),
                                const Icon(Icons.verified_rounded, size: 14, color: Color(0xFF38BDF8)),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // TOP-RIGHT OVERLAY: Claymorphic Heart / Room & House Like Button
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Press(
                      onTap: _showLikeOptions,
                      child: Container(
                        height: 38,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.92),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.15),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              (post.isRoomLiked || post.isHouseLiked || post.isSaved)
                                  ? Icons.favorite_rounded
                                  : Icons.favorite_border_rounded,
                              color: (post.isRoomLiked || post.isHouseLiked || post.isSaved)
                                  ? const Color(0xFFEF4444)
                                  : C.wino,
                              size: 18,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              post.isRoomLiked
                                  ? t('Room', 'Chumba')
                                  : (post.isHouseLiked ? t('House', 'Nyumba') : t('Save', 'Hifadhi')),
                              style: body(
                                11.5,
                                color: (post.isRoomLiked || post.isHouseLiked || post.isSaved)
                                    ? const Color(0xFFEF4444)
                                    : C.wino,
                                weight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // BOTTOM-LEFT OVERLAY: Price Pill
                  Positioned(
                    left: 12,
                    bottom: 12,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: C.navy.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            post.price,
                            style: display(14.5, color: Colors.white, weight: FontWeight.w800),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // BOTTOM-RIGHT OVERLAY: Multi-Photo Counter
                  if (post.images.length > 1)
                    Positioned(
                      right: 12,
                      bottom: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.photo_library_rounded, size: 12, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(
                              '${_activeImageIndex + 1}/${post.images.length}',
                              style: body(11, color: Colors.white, weight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // 2. Card Content & Specs
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Location & Host snippet
                Row(
                  children: [
                    Icon(Icons.location_on_rounded, size: 15, color: C.teal),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        post.location,
                        style: body(12.5, color: C.muted, weight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(post.timeAgo, style: body(11, color: C.faint)),
                  ],
                ),
                const SizedBox(height: 6),

                // Title (tappable to open detail page)
                GestureDetector(
                  onTap: _openDetail,
                  child: Text(
                    post.title,
                    style: display(16.5, color: C.wino, weight: FontWeight.w800),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 8),

                // Description
                Text(
                  post.description,
                  style: body(13, color: C.muted, height: 1.35),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),

                // Amenities / Key tags
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final tag in post.tags.take(3))
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
                        ),
                        child: Text(tag, style: body(11.5, color: C.wino, weight: FontWeight.w600)),
                      ),
                  ],
                ),

                const SizedBox(height: 14),
                const Divider(height: 1, thickness: 0.8),
                const SizedBox(height: 12),

                // 3. Tactile Claymorphic Engagement Row (Room Like, House Like, Comment, Agreement & View Details)
                Wrap(
                  spacing: 7,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    // A. Like Specific Room Pill
                    Press(
                      onTap: _toggleRoomLike,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6.5),
                        decoration: BoxDecoration(
                          color: post.isRoomLiked ? const Color(0xFFFEF2F2) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: post.isRoomLiked ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 4,
                              offset: const Offset(0, 1.5),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.meeting_room_rounded,
                              color: post.isRoomLiked ? const Color(0xFFEF4444) : C.wino,
                              size: 14.5,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              t('Room', 'Chumba'),
                              style: body(
                                11.5,
                                color: post.isRoomLiked ? const Color(0xFFEF4444) : C.wino,
                                weight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${post.roomLikesCount}',
                              style: body(
                                11,
                                color: post.isRoomLiked ? const Color(0xFFEF4444) : C.muted,
                                weight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // B. Like Whole House Pill
                    Press(
                      onTap: _toggleHouseLike,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6.5),
                        decoration: BoxDecoration(
                          color: post.isHouseLiked ? const Color(0xFFFEF2F2) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: post.isHouseLiked ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 4,
                              offset: const Offset(0, 1.5),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.cottage_rounded,
                              color: post.isHouseLiked ? const Color(0xFFEF4444) : C.wino,
                              size: 14.5,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              t('House', 'Nyumba'),
                              style: body(
                                11.5,
                                color: post.isHouseLiked ? const Color(0xFFEF4444) : C.wino,
                                weight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${post.houseLikesCount}',
                              style: body(
                                11,
                                color: post.isHouseLiked ? const Color(0xFFEF4444) : C.muted,
                                weight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // C. Comment / Inquiry Pill
                    Press(
                      onTap: widget.onComment,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 4,
                              offset: const Offset(0, 1.5),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.chat_bubble_outline_rounded, color: C.wino, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '${post.commentsCount}',
                              style: body(11.5, color: C.wino, weight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // D. Rental Agreement & Documents Pill
                    Press(
                      onTap: _openDocumentsAndAgreement,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6.5),
                        decoration: BoxDecoration(
                          color: C.tealLight,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: C.teal.withValues(alpha: 0.35), width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: C.teal.withValues(alpha: 0.08),
                              blurRadius: 4,
                              offset: const Offset(0, 1.5),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.description_outlined, color: C.teal, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              t('Mkataba & Docs', 'Mkataba & Nyaraka'),
                              style: body(11.5, color: C.teal, weight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // E. Share Button
                    Press(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        toast(
                          context,
                          t('Listing link copied to clipboard!', 'Link ya tangazo imenakiliwa!'),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(7.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 4,
                              offset: const Offset(0, 1.5),
                            ),
                          ],
                        ),
                        child: Icon(Icons.share_outlined, color: C.wino, size: 14),
                      ),
                    ),

                    // F. Primary "View Property" Button
                    Press(
                      onTap: _openDetail,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: C.teal,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: C.teal.withValues(alpha: 0.35),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              t('View Details', 'Tazama'),
                              style: body(12, color: Colors.white, weight: FontWeight.w700),
                            ),
                            const SizedBox(width: 3),
                            const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 13),
                          ],
                        ),
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

/// Interactive Comments Sheet with Like, Save, and Reply-to-Comment features
class _CommentsBottomSheet extends StatefulWidget {
  const _CommentsBottomSheet({required this.post});
  final FeedPostItem post;

  @override
  State<_CommentsBottomSheet> createState() => _CommentsBottomSheetState();
}

class _CommentsBottomSheetState extends State<_CommentsBottomSheet> {
  final _commentController = TextEditingController();
  final _focusNode = FocusNode();
  FeedComment? _replyingTo;

  @override
  void dispose() {
    _commentController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _addComment() {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    final userName = (Api.user.value?['fullname'] ?? 'Tenant User').toString();

    setState(() {
      if (_replyingTo != null) {
        _replyingTo!.replies.add(
          FeedComment(
            userName: userName,
            text: text,
            timeAgo: 'Just now',
            likes: 0,
            replyTo: _replyingTo!.userName,
          ),
        );
        widget.post.commentsCount++;
        toast(context, t('Reply sent!', 'Jibu limetumwa!'));
        _replyingTo = null;
      } else {
        widget.post.comments.insert(
          0,
          FeedComment(
            userName: userName,
            text: text,
            timeAgo: 'Just now',
            likes: 0,
          ),
        );
        widget.post.commentsCount++;
      }
      _commentController.clear();
    });
    HapticFeedback.lightImpact();
  }

  Widget _buildCommentItem(FeedComment c, {bool isReply = false}) {
    return Padding(
      padding: EdgeInsets.only(
        left: isReply ? 34.0 : 0.0,
        top: 6,
        bottom: 8,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: isReply ? 14 : 17,
            backgroundColor: isReply ? C.navy.withValues(alpha: .12) : C.teal.withValues(alpha: .15),
            child: Text(
              c.userName.isNotEmpty ? c.userName[0].toUpperCase() : 'U',
              style: body(
                isReply ? 11 : 13,
                color: isReply ? C.navy : C.teal,
                weight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      c.userName,
                      style: body(13, color: C.wino, weight: FontWeight.w700),
                    ),
                    if (c.replyTo != null) ...[
                      const SizedBox(width: 4),
                      Icon(Icons.arrow_right_rounded, size: 16, color: C.muted),
                      Text(
                        '@${c.replyTo}',
                        style: body(11.5, color: C.teal, weight: FontWeight.w600),
                      ),
                    ],
                    const SizedBox(width: 8),
                    Text(
                      c.timeAgo,
                      style: body(11, color: C.muted),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  c.text,
                  style: body(13.5, color: C.wino, height: 1.3),
                ),
                const SizedBox(height: 6),

                // Micro-actions: Like, Save, and Reply
                Row(
                  children: [
                    // 1. Like Comment
                    Press(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          c.isLiked = !c.isLiked;
                          if (c.isLiked) {
                            c.likes++;
                          } else {
                            c.likes = (c.likes - 1).clamp(0, 99999);
                          }
                        });
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            c.isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                            size: 14,
                            color: c.isLiked ? const Color(0xFFEF4444) : C.muted,
                          ),
                          if (c.likes > 0) ...[
                            const SizedBox(width: 4),
                            Text(
                              '${c.likes}',
                              style: body(
                                11,
                                color: c.isLiked ? const Color(0xFFEF4444) : C.muted,
                                weight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),

                    // 2. Save / Bookmark Comment
                    Press(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          c.isSaved = !c.isSaved;
                        });
                        toast(
                          context,
                          c.isSaved
                              ? t('Comment saved to your notes ✓', 'Maoni yamehifadhiwa ✓')
                              : t('Comment removed from saved', 'Maoni yameondolewa'),
                        );
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            c.isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                            size: 14,
                            color: c.isSaved ? C.teal : C.muted,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            c.isSaved ? t('Saved', 'Imehifadhiwa') : t('Save', 'Hifadhi'),
                            style: body(
                              11,
                              color: c.isSaved ? C.teal : C.muted,
                              weight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),

                    // 3. Reply to this comment
                    if (!isReply)
                      Press(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          setState(() {
                            _replyingTo = c;
                          });
                          _focusNode.requestFocus();
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.reply_rounded, size: 14, color: C.muted),
                            const SizedBox(width: 3),
                            Text(
                              t('Reply', 'Jibu'),
                              style: body(11, color: C.muted, weight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),

                // Nested Replies display
                if (c.replies.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  for (final r in c.replies)
                    _buildCommentItem(r, isReply: true),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.76,
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: .2), blurRadius: 20),
        ],
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 8),
              width: 38,
              height: 4.5,
              decoration: BoxDecoration(
                color: C.line,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
            child: Row(
              children: [
                Text(
                  t('Comments & Inquiries', 'Maoni & Maswali'),
                  style: display(17.5, color: C.wino, weight: FontWeight.w800),
                ),
                const SizedBox(width: 8),
                Text(
                  '(${widget.post.comments.length})',
                  style: body(15, color: C.muted, weight: FontWeight.w600),
                ),
                const Spacer(),
                Press(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: C.fill,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.close_rounded, color: C.muted, size: 19),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Comments List
          Expanded(
            child: widget.post.comments.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.chat_bubble_outline_rounded, size: 44, color: C.muted),
                        const SizedBox(height: 10),
                        Text(
                          t('No comments yet. Ask about this room!', 'Hakuna maoni bado. Ulizia chumba hiki!'),
                          style: body(14, color: C.muted),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    itemCount: widget.post.comments.length,
                    itemBuilder: (context, i) {
                      return _buildCommentItem(widget.post.comments[i]);
                    },
                  ),
          ),

          // Replying banner indicator
          if (_replyingTo != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
              color: C.tealLight,
              child: Row(
                children: [
                  Icon(Icons.reply_rounded, size: 16, color: C.teal),
                  const SizedBox(width: 6),
                  Text.rich(
                    TextSpan(
                      text: t('Replying to ', 'Unamjibu '),
                      style: body(12, color: C.wino),
                      children: [
                        TextSpan(
                          text: '@${_replyingTo!.userName}',
                          style: body(12, color: C.teal, weight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Press(
                    onTap: () => setState(() => _replyingTo = null),
                    child: Icon(Icons.close_rounded, size: 18, color: C.muted),
                  ),
                ],
              ),
            ),

          // Bottom Input Field
          SafeArea(
            top: false,
            child: Container(
              padding: EdgeInsets.fromLTRB(14, 8, 14, 8 + MediaQuery.viewInsetsOf(context).bottom),
              decoration: BoxDecoration(
                color: C.card,
                border: Border(top: BorderSide(color: C.line)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      focusNode: _focusNode,
                      style: body(14.5),
                      decoration: InputDecoration(
                        hintText: _replyingTo != null
                            ? t('Write a reply to @${_replyingTo!.userName}...', 'Andika jibu kwa @${_replyingTo!.userName}...')
                            : t('Ask about price, deposit, or rules...', 'Ulizia bei, kodi, au masharti...'),
                        filled: true,
                        fillColor: C.fill,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Press(
                    onTap: _addComment,
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: C.teal,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: C.teal.withValues(alpha: 0.35),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
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

/// Comprehensive Tenant Documents, Move-in Verification & Rental Agreement Sheet
class _TenantDocumentsAndAgreementSheet extends StatefulWidget {
  const _TenantDocumentsAndAgreementSheet({required this.post});
  final FeedPostItem post;

  @override
  State<_TenantDocumentsAndAgreementSheet> createState() => _TenantDocumentsAndAgreementSheetState();
}

class _TenantDocumentsAndAgreementSheetState extends State<_TenantDocumentsAndAgreementSheet> {
  int _activeTab = 0; // 0: Agreement, 1: Documents, 2: Utilities & Move-in

  void _requestAgreement() {
    HapticFeedback.mediumImpact();
    Navigator.pop(context);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: C.goodTint,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.check_circle_rounded, color: C.good, size: 24),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                t('Agreement Requested!', 'Ombi la Mkataba Limetumwa!'),
                style: display(17.5, color: C.wino, weight: FontWeight.w800),
              ),
            ),
          ],
        ),
        content: Text(
          t(
            'Your formal tenancy agreement request for "${widget.post.title}" has been sent to the property landlord (${widget.post.authorName}). You will receive a notification as soon as the draft is ready for review and e-signature.',
            'Ombi lako rasmi la mkataba wa upangaji kwa ajili ya "${widget.post.title}" limetumwa kwa mmiliki (${widget.post.authorName}). Utapokea arifa mkataba ukiwa tayari kwa mapitio na saini yako ya kielektroniki.',
          ),
          style: body(13.5, color: C.muted, height: 1.4),
        ),
        actions: [
          Button(
            t('View My Agreements', 'Tazama Mikataba Yangu'),
            tone: Tone.navy,
            onTap: () {
              Navigator.pop(ctx);
              push(context, const RentalAgreementsScreen());
            },
          ),
          Button(
            t('Done', 'Nimeelewa'),
            tone: Tone.plain,
            onTap: () => Navigator.pop(ctx),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;

    return Container(
      height: MediaQuery.sizeOf(context).height * 0.82,
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: .25), blurRadius: 22),
        ],
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 8),
              width: 38,
              height: 4.5,
              decoration: BoxDecoration(
                color: C.line,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: C.tealLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.gavel_rounded, color: C.teal, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t('Rental Agreement & Documents', 'Nyaraka & Mkataba wa Upangaji'),
                        style: display(16.5, color: C.wino, weight: FontWeight.w800),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        post.title,
                        style: body(12, color: C.muted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Press(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: C.fill,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.close_rounded, color: C.muted, size: 20),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Segmented Clay Tabs
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: C.fill,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: C.line, width: 1),
            ),
            child: Row(
              children: [
                for (final (idx, label, icon) in [
                  (0, t('Agreement', 'Mkataba'), Icons.description_outlined),
                  (1, t('Checklist', 'Nyaraka'), Icons.fact_check_outlined),
                  (2, t('Utilities', 'Huduma'), Icons.electric_meter_outlined),
                ])
                  Expanded(
                    child: Press(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _activeTab = idx);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _activeTab == idx ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: _activeTab == idx
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.06),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              icon,
                              size: 14,
                              color: _activeTab == idx ? C.teal : C.muted,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              label,
                              style: body(
                                12,
                                color: _activeTab == idx ? C.wino : C.muted,
                                weight: _activeTab == idx ? FontWeight.w700 : FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Tab Body
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
              children: [
                if (_activeTab == 0) ...[
                  // Tab 0: Mkataba wa Upangaji (Rental Lease Agreement)
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: C.goodTint,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: C.good.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.verified_user_rounded, color: C.good, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            t(
                              'Legally compliant with Tanzania Rent Restriction and Residential Tenancy Act.',
                              'Inafuata Sheria Rasmi ya Upangishaji na Makazi Tanzania.',
                            ),
                            style: body(12, color: const Color(0xFF065F46), weight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Agreement summary card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: C.line, width: 1.2),
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
                        Text(
                          t('Key Tenancy Terms', 'Vipengele Muhimu vya Mkataba'),
                          style: display(15, color: C.wino, weight: FontWeight.w700),
                        ),
                        const SizedBox(height: 12),
                        _buildTermRow(t('Rent Amount', 'Kodi ya Mwezi'), post.price),
                        _buildTermRow(t('Deposit', 'Dhamana ya Awali'), '${post.price} (1 Month)'),
                        _buildTermRow(t('Lease Duration', 'Muda wa Mkataba'), t('6 or 12 Months Renewable', 'Miezi 6 au 12')),
                        _buildTermRow(t('Notice Period', 'Notisi ya Notisi'), t('30 Days in advance', 'Siku 30 kabla')),
                        _buildTermRow(t('Landlord', 'Mmiliki'), post.authorName),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Action Buttons
                  Button(
                    t('Request Tenancy Agreement Now', 'Omba Mkataba wa Upangaji Sasa'),
                    tone: Tone.teal,
                    icon: Icons.edit_document,
                    onTap: _requestAgreement,
                  ),
                  const SizedBox(height: 10),
                  Button(
                    t('Open My Signed Agreements', 'Tazama Mikataba Yangu Rasmi'),
                    tone: Tone.plain,
                    icon: Icons.folder_open_rounded,
                    onTap: () {
                      Navigator.pop(context);
                      push(context, const RentalAgreementsScreen());
                    },
                  ),
                ] else if (_activeTab == 1) ...[
                  // Tab 1: Checklist ya Nyaraka Zinazohitajika
                  Text(
                    t('Required Tenant Verification Documents', 'Nyaraka Zinazohitajika Kabla ya Kuhamia'),
                    style: display(15, color: C.wino, weight: FontWeight.w700),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    t(
                      'Landlords require these documents to prepare your tenancy agreement and hand over room keys.',
                      'Mmiliki anahitaji nyaraka hizi kukamilisha mkataba na kukabidhi funguo.',
                    ),
                    style: body(12.5, color: C.muted),
                  ),
                  const SizedBox(height: 14),

                  _buildDocItem(
                    title: t('National ID (NIDA) or Driver License', 'Kitambulisho cha NIDA au Leseni'),
                    desc: t('Verified in your Panga account profile', 'Kimehakikiwa kwenye akaunti yako ya Panga'),
                    isDone: true,
                  ),
                  _buildDocItem(
                    title: t('Guarantor / Local Ward Letter', 'Barua ya Mdhamini au Serikali ya Mtaa'),
                    desc: t('Recommended before signing lease', 'Inahitajika kabla ya kusaini mkataba'),
                    isDone: false,
                  ),
                  _buildDocItem(
                    title: t('Proof of Income / Employment', 'Uthibitisho wa Ajira au Biashara'),
                    desc: t('Payslip, business license, or M-Pesa statement', 'Barua ya kazi au taarifa ya benki/simu'),
                    isDone: false,
                  ),
                  _buildDocItem(
                    title: t('2 Passport Size Photos', 'Picha 2 za Pasipoti'),
                    desc: t('For hardcopy file record', 'Kwa ajili ya kumbukumbu ya faili'),
                    isDone: false,
                  ),
                ] else ...[
                  // Tab 2: Utilities & Move-in Condition
                  Text(
                    t('Move-in Condition & Utilities Arrangement', 'Hali ya Chumba na Mipangilio ya Huduma'),
                    style: display(15, color: C.wino, weight: FontWeight.w700),
                  ),
                  const SizedBox(height: 14),

                  _buildUtilityCard(
                    icon: Icons.electric_bolt_rounded,
                    title: t('Electricity (LUKU Sub-Meter)', 'Umeme (Mita Ndogo ya LUKU)'),
                    desc: t(
                      'Dedicated LUKU sub-meter. Tenant buys tokens directly. Check starting reading before move-in.',
                      'Chumba kina mita yake ya LUKU. Mpangaji ananunua umeme mwenyewe. Thibitisha uniti za mwanzo.',
                    ),
                    color: const Color(0xFFF59E0B),
                  ),
                  const SizedBox(height: 10),
                  _buildUtilityCard(
                    icon: Icons.water_drop_rounded,
                    title: t('Clean Water (DAWASA)', 'Maji Safi (DAWASA & Tanki)'),
                    desc: t(
                      'Running water connected with reserve tanks. Shared cost per headcount or sub-metered.',
                      'Maji ya bomba yapo pamoja na tenki la akiba. Gharama inagawanywa au inalipwa kwa mita.',
                    ),
                    color: const Color(0xFF0284C7),
                  ),
                  const SizedBox(height: 10),
                  _buildUtilityCard(
                    icon: Icons.vpn_key_rounded,
                    title: t('Key Handover & Security Checklist', 'Makabidhiano ya Funguo & Usalama'),
                    desc: t(
                      'Two sets of keys provided (Main Gate and Room). Locks must remain intact.',
                      'Mpangaji anapewa funguo 2 (Geti kuu na Chumbani). Kufuli zinathibitishwa kufanya kazi.',
                    ),
                    color: const Color(0xFF10B981),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTermRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5.5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: body(13, color: C.muted)),
          Text(value, style: body(13.5, color: C.wino, weight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildDocItem({required String title, required String desc, required bool isDone}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: C.line, width: 1.2),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: isDone ? C.goodTint : C.fill,
              shape: BoxShape.circle,
            ),
            child: Icon(
              isDone ? Icons.check_circle_rounded : Icons.pending_actions_rounded,
              color: isDone ? C.good : C.muted,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: body(13.5, color: C.wino, weight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(desc, style: body(11.5, color: C.muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUtilityCard({required IconData icon, required String title, required String desc, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: C.line, width: 1.2),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: body(13.5, color: C.wino, weight: FontWeight.w700)),
                const SizedBox(height: 3),
                Text(desc, style: body(12, color: C.muted, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}



/// Filter Sheet for Instagram Discovery Feed
class _InstagramFilterSheet extends StatefulWidget {
  const _InstagramFilterSheet({required this.filters});
  final _InstagramFilters filters;

  @override
  State<_InstagramFilterSheet> createState() => _InstagramFilterSheetState();
}

class _InstagramFilterSheetState extends State<_InstagramFilterSheet> {
  late FeedCategory _selectedCategory = widget.filters.category;
  late final _searchCtrl = TextEditingController(text: widget.filters.q);
  late bool _verifiedOnly = widget.filters.verifiedOnly;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 38,
              height: 4.5,
              decoration: BoxDecoration(
                color: C.line,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
          const SizedBox(height: 14),

          Text(
            t('Filter Feeds', 'Chuja Mlisho'),
            style: display(22, color: C.wino, weight: FontWeight.w800),
          ),
          const SizedBox(height: 16),

          // Search Field
          TextField(
            controller: _searchCtrl,
            style: body(15),
            decoration: InputDecoration(
              hintText: t('Search area, service, or landlord...', 'Tafuta eneo, huduma, au mmiliki...'),
              prefixIcon: Icon(Icons.search_rounded, color: C.teal),
              filled: true,
              fillColor: C.fill,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 18),

          Text(
            t('Category', 'Kitengo'),
            style: body(14.5, color: C.wino, weight: FontWeight.w700),
          ),
          const SizedBox(height: 10),

          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final cat in FeedCategory.values)
                Choice(
                  categoryLabel(cat),
                  icon: categoryIcon(cat),
                  on: _selectedCategory == cat,
                  onTap: () => setState(() => _selectedCategory = cat),
                ),
            ],
          ),
          const SizedBox(height: 18),

          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: _verifiedOnly,
            activeTrackColor: C.teal,
            title: Text(
              t('Verified Listings Only', 'Yaliyohakikiwa Pekee'),
              style: body(14.5, weight: FontWeight.w600),
            ),
            subtitle: Text(
              t('Show only NIDA-verified owners & certified professionals', 'Onyesha wamiliki na mafundi walioidhinishwa tu'),
              style: body(12.5, color: C.muted),
            ),
            onChanged: (v) => setState(() => _verifiedOnly = v),
          ),
          const SizedBox(height: 20),

          Row(
            children: [
              Expanded(
                child: Button(
                  t('Reset', 'Weka Upya'),
                  tone: Tone.plain,
                  onTap: () {
                    widget.filters.category = FeedCategory.all;
                    widget.filters.q = '';
                    widget.filters.verifiedOnly = false;
                    Navigator.pop(context, true);
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: Button(
                  t('Apply Filters', 'Tumia Vichujio'),
                  tone: Tone.navy,
                  onTap: () {
                    widget.filters.category = _selectedCategory;
                    widget.filters.q = _searchCtrl.text.trim();
                    widget.filters.verifiedOnly = _verifiedOnly;
                    Navigator.pop(context, true);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
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
