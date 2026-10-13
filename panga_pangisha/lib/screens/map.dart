import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../api.dart';
import '../l10n.dart';
import '../ui.dart';
import 'explore.dart';
import 'listing.dart';

const _dar = LatLng(-6.785, 39.255);

/// Homes as rent pins on a map, tied to a swipeable row of cards.
class MapTab extends StatefulWidget {
  const MapTab({super.key});

  @override
  State<MapTab> createState() => _MapTabState();
}

class _MapTabState extends State<MapTab> with SingleTickerProviderStateMixin {
  final _map = MapController();
  final _cards = PageController(viewportFraction: .88);
  late final _fly = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 650),
  );
  List<House> _homes = [];
  String? _error;
  bool _loading = true;
  int _picked = 0;
  LatLng? _me;
  VoidCallback? _tick;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _fly.dispose();
    _cards.dispose();
    _map.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final all = House.list(
        await Api.get('landlord/search_house/', {'per_page': 100}),
      );
      if (!mounted) return;
      setState(
        () =>
            _homes = all.where((h) => h.lat != null && h.lng != null).toList(),
      );
      if (_homes.isNotEmpty) {
        _map.fitCamera(
          CameraFit.coordinates(
            coordinates: [for (final h in _homes) LatLng(h.lat!, h.lng!)],
            padding: const EdgeInsets.fromLTRB(50, 130, 50, 330),
          ),
        );
      }
    } on ApiError catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// Glides the camera instead of jumping, so you keep your bearings.
  void _flyTo(LatLng to, {double? zoom}) {
    final from = _map.camera.center, z0 = _map.camera.zoom;
    final z1 = zoom ?? math.max(z0, 13.5);
    if (reduceMotion) {
      _map.move(to, z1);
      return;
    }
    final curve = CurvedAnimation(parent: _fly, curve: Curves.easeInOutCubic);
    void tick() => _map.move(
      LatLng(
        from.latitude + (to.latitude - from.latitude) * curve.value,
        from.longitude + (to.longitude - from.longitude) * curve.value,
      ),
      z0 + (z1 - z0) * curve.value,
    );
    _fly.stop();
    if (_tick != null) _fly.removeListener(_tick!);
    _tick = tick;
    _fly
      ..addListener(tick)
      ..forward(from: 0);
  }

  void _pick(int i, {bool fromCard = false}) {
    setState(() => _picked = i);
    final h = _homes[i];
    _flyTo(LatLng(h.lat!, h.lng!));
    if (!fromCard && _cards.hasClients) {
      _cards.animateToPage(
        i,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
      );
    }
  }

  Future<void> _locate() async {
    try {
      var p = await Geolocator.checkPermission();
      if (p == LocationPermission.denied) {
        p = await Geolocator.requestPermission();
      }
      if (p == LocationPermission.denied ||
          p == LocationPermission.deniedForever) {
        if (mounted) {
          toast(
            context,
            t(
              'Allow location in Settings to see homes near you.',
              'Ruhusu eneo kwenye Mipangilio ili uone nyumba za karibu nawe.',
            ),
          );
        }
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      if (!mounted) return;
      setState(() => _me = LatLng(pos.latitude, pos.longitude));
      _flyTo(_me!, zoom: 14);
    } catch (_) {
      if (mounted) {
        toast(
          context,
          t(
            'Could not find your location. Turn on GPS and try again.',
            'Imeshindwa kupata eneo lako. Washa GPS kisha ujaribu tena.',
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Stack(
      children: [
        FlutterMap(
          mapController: _map,
          options: MapOptions(
            initialCenter: _dar,
            initialZoom: 11.5,
            minZoom: 5,
            maxZoom: 18,
            backgroundColor: C.leaf,
            interactionOptions: InteractionOptions(
              flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
            ),
          ),
          children: [
            TileLayer(urlTemplate: osmTiles, userAgentPackageName: osmAgent),
            MarkerLayer(
              markers: [
                if (_me != null)
                  Marker(
                    point: _me!,
                    width: 22,
                    height: 22,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF2F7DE1),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                      ),
                    ),
                  ),
                // The picked pin is drawn last so it sits on top of its neighbours.
                for (final i in [
                  for (var i = 0; i < _homes.length; i++)
                    if (i != _picked) i,
                  if (_homes.isNotEmpty) _picked,
                ])
                  Marker(
                    point: LatLng(_homes[i].lat!, _homes[i].lng!),
                    width: 84,
                    height: 44,
                    child: _Pin(
                      _homes[i],
                      on: i == _picked,
                      onTap: () => _pick(i),
                    ),
                  ),
              ],
            ),
          ],
        ),
        Positioned(
          top: top + 14,
          left: 20,
          right: 20,
          child: Row(
            children: [
              Expanded(
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: C.card,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: C.deep.withValues(alpha: .14),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: Text(
                        key: ValueKey('$_loading${_homes.length}$_error'),
                        _loading
                            ? t('Finding homes…', 'Inatafuta nyumba…')
                            : _error != null
                            ? t('Homes did not load', 'Nyumba hazijafunguka')
                            : t(
                                '${_homes.length} homes on the map',
                                'Nyumba ${_homes.length} kwenye ramani',
                              ),
                        style: display(15),
                      ),
                    ),
                  ),
                ),
              ),
              if (_error != null) ...[
                RoundIcon(
                  Icons.refresh_rounded,
                  label: t('Try again', 'Jaribu tena'),
                  onTap: _load,
                ),
                const SizedBox(width: 10),
              ],
              RoundIcon(
                Icons.my_location_rounded,
                color: C.mkoko,
                label: t('Go to my location', 'Nenda nilipo'),
                onTap: _locate,
              ),
            ],
          ),
        ),
        Positioned(
          left: 20,
          bottom: 234 + MediaQuery.paddingOf(context).bottom,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.white70,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '© OpenStreetMap contributors',
              style: body(11, color: C.wino, height: 1.2),
            ),
          ),
        ),
        if (_homes.isNotEmpty)
          Positioned(
            left: 0,
            right: 0,
            bottom: 108 + MediaQuery.paddingOf(context).bottom,
            height: 118,
            child: PageView.builder(
              controller: _cards,
              itemCount: _homes.length,
              onPageChanged: (i) => _pick(i, fromCard: true),
              itemBuilder: (_, i) => _MapCard(_homes[i]),
            ),
          ),
      ],
    );
  }
}

class _Pin extends StatelessWidget {
  const _Pin(this.house, {required this.on, required this.onTap});
  final House house;
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: on,
    label: '${house.name}, ${tzs(house.rent)}',
    child: GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Center(
        child: AnimatedScale(
          scale: on ? 1.16 : 1,
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutBack,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
            decoration: BoxDecoration(
              color: on ? C.mkoko : C.card,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: on ? C.shaba : C.teal,
                width: on ? 2 : 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: C.deep.withValues(alpha: .22),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: ExcludeSemantics(
              child: Text(
                tzsShort(house.rent),
                style: display(14, color: on ? Colors.white : C.wino),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _MapCard extends StatelessWidget {
  const _MapCard(this.house);
  final House house;

  @override
  Widget build(BuildContext context) {
    final tag = 'map-${house.id}';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 5),
      child: Press(
        onTap: () => push(context, ListingScreen(house, heroTag: tag)),
        child: Container(
          padding: const EdgeInsets.all(9),
          decoration: BoxDecoration(
            color: C.card,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: C.deep.withValues(alpha: .16),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Hero(
                tag: tag,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(17),
                  child: SizedBox.square(
                    dimension: 100,
                    child: Photo(house.photos.firstOrNull, width: 100),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(tzs(house.rent), style: display(18, color: C.teal)),
                    Text(
                      house.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: body(14.5, weight: FontWeight.w600, height: 1.3),
                    ),
                    Text(
                      house.place,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: body(13, color: C.muted, height: 1.3),
                    ),
                    const SizedBox(height: 6),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: TrustTags(house, brief: true),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
            ],
          ),
        ),
      ),
    );
  }
}
