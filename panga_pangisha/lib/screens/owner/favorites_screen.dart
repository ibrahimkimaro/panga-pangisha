import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../ui.dart';
import '../explore.dart';
import '../listing.dart';

/// Screen listing favorite/saved properties for landlords and investors.
class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  List<House>? _favorites;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchFavorites();
  }

  Future<void> _fetchFavorites() async {
    setState(() {
      _loading = true;
    });

    try {
      final res = await Api.get('favorites');
      final list = House.list(res);
      if (mounted) {
        setState(() {
          _favorites = list.isNotEmpty ? list : _sampleFavorites();
          _loading = false;
        });
      }
    } catch (_) {
      // Fallback sample favorites if offline or mock
      if (mounted) {
        setState(() {
          _favorites = _sampleFavorites();
          _loading = false;
        });
      }
    }
  }

  List<House> _sampleFavorites() {
    return [
      House({
        'id': 101,
        'property_name': 'Mikocheni Executive Villa',
        'property_type': 'House',
        'monthly_rent': 650000,
        'region': 'Dar es Salaam',
        'district': 'Kinondoni',
        'ward': 'Mikocheni',
        'bedrooms': 3,
        'bathrooms': 2,
        'house_profile_image': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        'is_favorite': true,
      }),
      House({
        'id': 102,
        'property_name': 'Masaki Oceanview Penthouse',
        'property_type': 'Apartment',
        'monthly_rent': 1200000,
        'region': 'Dar es Salaam',
        'district': 'Kinondoni',
        'ward': 'Masaki',
        'bedrooms': 2,
        'bathrooms': 2,
        'house_profile_image': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
        'is_favorite': true,
      }),
      House({
        'id': 103,
        'property_name': 'Kijitonyama Modern Apartment',
        'property_type': 'Apartment',
        'monthly_rent': 450000,
        'region': 'Dar es Salaam',
        'district': 'Kinondoni',
        'ward': 'Kijitonyama',
        'bedrooms': 1,
        'bathrooms': 1,
        'house_profile_image': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
        'is_favorite': true,
      }),
    ];
  }

  void _removeFavorite(int id) {
    toggleSaved(id);
    setState(() {
      _favorites = _favorites?.where((h) => h.id != id).toList();
    });
    toast(context, t('Removed from favorites', 'Imeondolewa kwenye pendwa'));
  }

  @override
  Widget build(BuildContext context) {
    final currencyFmt = NumberFormat('#,###');

    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(t('Favorite Properties', 'Nyumba Pendwa')),
        actions: [
          const LangSwitch(),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: t('Refresh', 'Sasisha'),
            onPressed: _fetchFavorites,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchFavorites,
              child: (_favorites == null || _favorites!.isEmpty)
                  ? ListView(
                      padding: const EdgeInsets.all(32),
                      children: [
                        const SizedBox(height: 80),
                        Center(
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: const BoxDecoration(
                              color: Color(0xFFFEE2E2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.favorite_border_rounded,
                              size: 48,
                              color: Color(0xFFEF4444),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Center(
                          child: Text(
                            t('No Favorite Properties Yet', 'Bado Hujahifadhi Nyumba Pendwa'),
                            style: display(18, weight: FontWeight.w800),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Center(
                          child: Text(
                            t(
                              'Tap the heart icon on any property to save it here for market rate tracking and quick reference.',
                              'Gusa alama ya moyo kwenye nyumba ili kuihifadhi hapa kwa ulinganishi wa bei za soko na kumbukumbu ya haraka.',
                            ),
                            style: body(13, color: C.muted),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 80),
                      itemCount: _favorites!.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 14),
                      itemBuilder: (context, index) {
                        final house = _favorites![index];
                        final tag = 'fav-${house.id}';
                        final locationText = [
                          if (house.ward.isNotEmpty) house.ward,
                          if (house.district.isNotEmpty) house.district,
                          if (house.region.isNotEmpty) house.region,
                        ].join(', ');

                        return Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFF1F5F9), width: 1.5),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                offset: const Offset(0, 4),
                                blurRadius: 12,
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () => push(context, ListingScreen(house, heroTag: tag)),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Image + Badges
                                    Stack(
                                      children: [
                                        Hero(
                                          tag: tag,
                                          child: AspectRatio(
                                            aspectRatio: 16 / 9,
                                            child: Photo(house.photos.firstOrNull),
                                          ),
                                        ),
                                        Positioned(
                                          top: 10,
                                          right: 10,
                                          child: GestureDetector(
                                            onTap: () => _removeFavorite(house.id),
                                            child: Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: BoxDecoration(
                                                color: Colors.white.withValues(alpha: 0.9),
                                                shape: BoxShape.circle,
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black.withValues(alpha: 0.15),
                                                    blurRadius: 6,
                                                  ),
                                                ],
                                              ),
                                              child: const Icon(
                                                Icons.favorite_rounded,
                                                color: Color(0xFFEF4444),
                                                size: 20,
                                              ),
                                            ),
                                          ),
                                        ),
                                        Positioned(
                                          left: 10,
                                          bottom: 10,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                            decoration: BoxDecoration(
                                              color: Colors.black.withValues(alpha: 0.75),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: Text(
                                              'TZS ${currencyFmt.format(house.rent)} ${t('/ month', '/ mwezi')}',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w800,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    // Details
                                    Padding(
                                      padding: const EdgeInsets.all(14),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  house.name.isNotEmpty ? house.name : t('Property', 'Nyumba'),
                                                  style: display(15.5, weight: FontWeight.w800, color: C.wino),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF1F5F9),
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: Text(
                                                  typeName(house.type),
                                                  style: body(11, color: C.muted, weight: FontWeight.w600),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF64748B)),
                                              const SizedBox(width: 4),
                                              Expanded(
                                                child: Text(
                                                  locationText.isNotEmpty ? locationText : (house.place.isNotEmpty ? house.place : t('Tanzania', 'Tanzania')),
                                                  style: body(12, color: const Color(0xFF64748B)),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 10),
                                          const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                          const SizedBox(height: 10),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                '${house.bedrooms} ${t('Beds', 'Vyumba')} · ${house.bathrooms} ${t('Baths', 'Bafu')}',
                                                style: body(12, color: C.muted, weight: FontWeight.w600),
                                              ),
                                              Row(
                                                children: [
                                                  Text(
                                                    t('View Details', 'Tazama Maelezo'),
                                                    style: body(12, color: const Color(0xFF0284C7), weight: FontWeight.w700),
                                                  ),
                                                  const SizedBox(width: 2),
                                                  const Icon(Icons.arrow_forward_ios_rounded, size: 11, color: Color(0xFF0284C7)),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
