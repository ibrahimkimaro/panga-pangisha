import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../api.dart';
import '../l10n.dart';
import '../ui.dart';
import 'chat.dart';
import 'explore.dart';
import 'owner/rental_agreements_screen.dart';

const osmTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmAgent = 'com.example.panga_pangisha';

IconData amenityIcon(String a) => switch (a) {
  'Water' => Icons.water_drop_outlined,
  'Parking' => Icons.directions_car_outlined,
  'Security' => Icons.shield_outlined,
  'Generator' => Icons.bolt_outlined,
  'Fence' => Icons.fence_outlined,
  'AC' => Icons.ac_unit_rounded,
  'Tiles' => Icons.grid_on_rounded,
  'LUKU' => Icons.electric_meter_outlined,
  'WiFi' => Icons.wifi_rounded,
  'Lift' => Icons.elevator_outlined,
  'Pool' => Icons.pool_rounded,
  'Garden' => Icons.yard_outlined,
  _ => Icons.check_rounded,
};

String amenityName(String a) => switch (a) {
  'Water' => t('Water', 'Maji'),
  'Parking' => t('Parking', 'Maegesho'),
  'Security' => t('Guard', 'Mlinzi'),
  'Generator' => t('Generator', 'Jenereta'),
  'Fence' => t('Fenced', 'Uzio'),
  'AC' => t('Air conditioning', 'Kiyoyozi'),
  'Tiles' => t('Tiled floors', 'Vigae'),
  'LUKU' => t('Own LUKU meter', 'LUKU yake'),
  'Lift' => t('Lift', 'Lifti'),
  'Pool' => t('Pool', 'Bwawa la kuogelea'),
  'Garden' => t('Garden', 'Bustani'),
  _ => a,
};

class ListingScreen extends StatefulWidget {
  const ListingScreen(this.house, {super.key, required this.heroTag});
  final House house;
  final String heroTag;

  @override
  State<ListingScreen> createState() => _ListingScreenState();
}

class _ListingScreenState extends State<ListingScreen> {
  int _photo = 0;
  House get h => widget.house;

  @override
  Widget build(BuildContext context) {
    final photos = h.photos.isEmpty ? <String?>[null] : h.photos;
    return Scaffold(
      backgroundColor: C.card,
      bottomNavigationBar: h.isMine ? null : _ActionBar(h),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 330,
            backgroundColor: C.card,
            surfaceTintColor: Colors.transparent,
            systemOverlayStyle: C.overlay,
            automaticallyImplyLeading: false,
            titleSpacing: 12,
            title: Row(
              children: [
                RoundIcon(
                  Icons.arrow_back_rounded,
                  label: t('Back', 'Rudi'),
                  onTap: () => Navigator.pop(context),
                ),
                const Spacer(),
                RoundIcon(
                  Icons.flag_outlined,
                  label: t('Report this listing', 'Ripoti tangazo hili'),
                  onTap: () => sheet(context, _ReportSheet(h)),
                ),
                const SizedBox(width: 10),
                Heart(h.id),
              ],
            ),
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.parallax,
              background: Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    itemCount: photos.length,
                    onPageChanged: (i) => setState(() => _photo = i),
                    itemBuilder: (_, i) => i == 0
                        ? Hero(tag: widget.heroTag, child: Photo(photos[0]))
                        : Photo(photos[i]),
                  ),
                  if (photos.length > 1)
                    Positioned(
                      bottom: 34,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          for (var i = 0; i < photos.length; i++)
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 220),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              height: 6,
                              width: i == _photo ? 20 : 6,
                              decoration: BoxDecoration(
                                color: i == _photo
                                    ? C.card
                                    : Colors.white60,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            // The white sheet's rounded top edge riding over the photo.
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(22),
              child: Container(
                height: 22,
                decoration: BoxDecoration(
                  color: C.card,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
            sliver: SliverList.list(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(tzs(h.rent), style: display(32, color: C.teal)),
                    Padding(
                      padding: const EdgeInsets.only(left: 6, bottom: 5),
                      child: Text(
                        t('a month', 'kwa mwezi'),
                        style: body(15, color: C.muted),
                      ),
                    ),
                  ],
                ).reveal(),
                const SizedBox(height: 8),
                Text(h.name, style: display(24)).reveal(1),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.place_outlined, size: 17, color: C.muted),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        [
                          h.street,
                          h.place,
                        ].where((s) => s.isNotEmpty).join(', '),
                        style: body(15, color: C.muted),
                      ),
                    ),
                  ],
                ).reveal(1),
                if (h.napaNumber != null && h.napaNumber!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.pin_drop_rounded, size: 16, color: C.teal),
                      const SizedBox(width: 6),
                      Text(
                        'NAPA: ${h.napaNumber}',
                        style: body(13.5, color: C.teal, weight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 18),
                Row(
                  children: [
                    _Fact(
                      typeIcon(h.type),
                      typeName(h.type),
                      t('Type', 'Aina'),
                    ),
                    _Fact(
                      Icons.bed_outlined,
                      '${h.bedrooms}',
                      t('Bedrooms', 'Vyumba'),
                    ),
                    _Fact(
                      Icons.shower_outlined,
                      '${h.bathrooms}',
                      t('Bathrooms', 'Bafu'),
                    ),
                  ],
                ).reveal(2),
                const SizedBox(height: 22),
                _Advertiser(h).reveal(3),
                if (h.units.isNotEmpty) ...[
                  _heading(
                    t(
                      'Available Rooms & Units (${h.units.length})',
                      'Vyumba na Nyumba Zilizopo (${h.units.length})',
                    ),
                  ),
                  Text(
                    t(
                      'Each room or independent wing has its own photos, pricing, and terms. Tap any room to view details or inquire directly.',
                      'Kila chumba au nyumba inayojitegemea ina picha zake, bei, na masharti. Gusa kuona maelezo au kuulizia.',
                    ),
                    style: body(14, color: C.muted),
                  ),
                  const SizedBox(height: 14),
                  for (final u in h.units)
                    _UnitCard(u, house: h),
                ],
                if (h.description.isNotEmpty) ...[
                  _heading(t('About this home', 'Kuhusu nyumba hii')),
                  Text(h.description, style: body(16, height: 1.55)),
                ],
                if (h.deposit != null || h.terms != null) ...[
                  _heading(
                    t('What you pay to move in', 'Utakacholipa kuhamia'),
                  ),
                  if (h.terms != null) _line(t('Terms', 'Masharti'), h.terms!),
                  if (h.deposit != null)
                    _line(t('Upfront', 'Malipo ya awali'), tzs(h.deposit!)),
                ],
                _heading(t('Tenancy Documents & Rental Agreement', 'Nyaraka & Mkataba wa Upangaji')),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: C.card,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: C.line, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: C.goodTint,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(Icons.verified_user_rounded, color: C.good, size: 20),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              t('Standard Legal Tenancy Contract Available', 'Mkataba Halali wa Kisheria Unapatikana'),
                              style: display(14.5, color: C.wino, weight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        t(
                          'Review key lease clauses (6-12 month duration, security deposit, 30-day notice, LUKU & DAWASA sub-metering) and required NIDA/identification documents.',
                          'Soma vipengele vya mkataba (miezi 6-12, dhamana, notisi ya siku 30, mita za LUKU & DAWASA) na orodha ya nyaraka za utambulisho.',
                        ),
                        style: body(13, color: C.muted, height: 1.4),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: Button(
                              t('View & Manage Agreements', 'Tazama & Simamia Mikataba'),
                              tone: Tone.teal,
                              icon: Icons.description_outlined,
                              onTap: () {
                                push(context, const RentalAgreementsScreen());
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (h.amenities.isNotEmpty) ...[
                  _heading(t('What it has', 'Ilicho nacho')),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final a in h.amenities)
                        Tag(
                          amenityName(a),
                          icon: amenityIcon(a),
                          bg: C.chokaa,
                          fg: C.wino,
                        ),
                    ],
                  ),
                ],
                if (h.lat != null && h.lng != null) ...[
                  _heading(t('Where it is', 'Ilipo')),
                  _AreaMap(LatLng(h.lat!, h.lng!)),
                  const SizedBox(height: 10),
                  Text(
                    h.isMine
                        ? t(
                            'Renters see an approximate area, not this exact pin.',
                            'Wapangaji wanaona eneo la kukadiria, si alama hii kamili.',
                          )
                        : t(
                            'This is the approximate area. The advertiser shares the exact address when you arrange a viewing.',
                            'Hili ni eneo la kukadiria. Mtangazaji atakupa anwani kamili mkipanga miadi ya kuona.',
                          ),
                    style: body(14, color: C.muted),
                  ),
                ],
                const SizedBox(height: 26),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: C.sand,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.shield_outlined,
                        color: C.brassInk,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          t(
                            'See the home and meet the advertiser before you pay anything. Report anyone who asks for money first.',
                            'Ione nyumba na ukutane na mtangazaji kabla ya kulipa chochote. Ripoti yeyote anayedai pesa kwanza.',
                          ),
                          style: body(
                            14.5,
                            color: const Color(0xFF4D3600),
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _heading(String text) => Padding(
    padding: const EdgeInsets.only(top: 28, bottom: 12),
    child: Text(text, style: display(20)),
  );

  Widget _line(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      children: [
        Expanded(
          child: Text(label, style: body(15.5, color: C.muted)),
        ),
        Text(value, style: body(15.5, weight: FontWeight.w600)),
      ],
    ),
  );
}

class _Fact extends StatelessWidget {
  const _Fact(this.icon, this.value, this.label);
  final IconData icon;
  final String value, label;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: C.chokaa,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: C.teal, size: 22),
          const SizedBox(height: 10),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: display(17),
          ),
          Text(label, style: body(13, color: C.muted, height: 1.2)),
        ],
      ),
    ),
  );
}

/// Who is advertising, in what role, and what has been checked. Never a promise of safety.
class _Advertiser extends StatelessWidget {
  const _Advertiser(this.h);
  final House h;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: C.line, width: 1.4),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Avatar(h.ownerName, photo: h.ownerPhoto, size: 50),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(h.ownerName, style: display(18)),
                  Text(
                    h.byOwner
                        ? t(
                            'Advertising as the owner',
                            'Anatangaza kama mmiliki',
                          )
                        : t(
                            'Advertising for the owner',
                            'Anatangaza kwa niaba ya mmiliki',
                          ),
                    style: body(14, color: C.muted, height: 1.25),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        TrustTags(h),
        const SizedBox(height: 14),
        _check(
          h.verifiedAt != null,
          h.verifiedAt != null
              ? (h.byOwner
                    ? t(
                        'We checked proof of ownership on ${day(h.verifiedAt!)}.',
                        'Tulihakiki uthibitisho wa umiliki tarehe ${day(h.verifiedAt!)}.',
                      )
                    : t(
                        'We checked their permission to let this home on ${day(h.verifiedAt!)}.',
                        'Tulihakiki ruhusa yao ya kupangisha tarehe ${day(h.verifiedAt!)}.',
                      ))
              : t(
                  'We have not checked ownership documents for this listing.',
                  'Hatujahakiki nyaraka za umiliki za tangazo hili.',
                ),
        ),
        _check(
          !h.stale,
          h.confirmedAt == null
              ? t(
                  'The advertiser has not confirmed it is still available.',
                  'Mtangazaji hajathibitisha kama bado ipo.',
                )
              : t(
                  'Advertiser confirmed it was available ${ago(h.confirmedAt!)}.',
                  'Mtangazaji alithibitisha ipo ${ago(h.confirmedAt!)}.',
                ),
        ),
        if (h.ownerSince != null)
          _check(
            true,
            t(
              'On Panga since ${day(h.ownerSince!)}.',
              'Yupo Panga tangu ${day(h.ownerSince!)}.',
            ),
            icon: Icons.event_outlined,
          ),
      ],
    ),
  );

  Widget _check(bool good, String text, {IconData? icon}) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon ??
              (good
                  ? Icons.check_circle_outline_rounded
                  : Icons.info_outline_rounded),
          size: 18,
          color: good ? C.teal : const Color(0xFF8A6100),
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: body(14.5, height: 1.35))),
      ],
    ),
  );
}

/// A still map with a circle, not a pin: the public location is approximate.
class _AreaMap extends StatelessWidget {
  const _AreaMap(this.at);
  final LatLng at;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(22),
    child: SizedBox(
      height: 190,
      child: FlutterMap(
        options: MapOptions(
          initialCenter: at,
          initialZoom: 14.5,
          interactionOptions: const InteractionOptions(
            flags: InteractiveFlag.none,
          ),
        ),
        children: [
          TileLayer(urlTemplate: osmTiles, userAgentPackageName: osmAgent),
          CircleLayer(
            circles: [
              CircleMarker(
                point: at,
                radius: 260,
                useRadiusInMeter: true,
                color: C.mkoko.withValues(alpha: .22),
                borderColor: C.mkoko,
                borderStrokeWidth: 2,
              ),
            ],
          ),
          const SimpleAttributionWidget(
            source: Text('OpenStreetMap contributors'),
          ),
        ],
      ),
    ),
  );
}

class _ActionBar extends StatelessWidget {
  const _ActionBar(this.h);
  final House h;

  @override
  Widget build(BuildContext context) =>
      Container(
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          12 + MediaQuery.paddingOf(context).bottom,
        ),
        decoration: BoxDecoration(
          color: C.card,
          border: Border(top: BorderSide(color: C.line)),
        ),
        child: Row(
          children: [
            Expanded(
              flex: 4,
              child: Button(
                t('Message', 'Ujumbe'),
                icon: Icons.chat_bubble_outline_rounded,
                tone: Tone.plain,
                onTap: () => push(
                  context,
                  ChatScreen(
                    peerId: h.ownerId,
                    name: h.ownerName,
                    photo: h.ownerPhoto,
                    house: h,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 5,
              child: Button(
                t('Request a viewing', 'Omba kuiona'),
                onTap: () => sheet(context, _ViewingSheet(h)),
              ),
            ),
          ],
        ),
      ).animate().moveY(
        begin: 90,
        end: 0,
        delay: 250.ms,
        duration: 420.ms,
        curve: Curves.easeOutCubic,
      );
}

class _ViewingSheet extends StatefulWidget {
  const _ViewingSheet(this.h);
  final House h;

  @override
  State<_ViewingSheet> createState() => _ViewingSheetState();
}

class _ViewingSheetState extends State<_ViewingSheet> {
  final _note = TextEditingController();
  late final _days = [
    for (var i = 1; i <= 7; i++)
      DateUtils.dateOnly(DateTime.now()).add(Duration(days: i)),
  ];
  late DateTime _day = _days.first;
  int _hour = 10;
  bool _busy = false, _sent = false;
  String? _error;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Api.post('houses/${widget.h.id}/viewing-requests', {
        'preferred_at': _day
            .add(Duration(hours: _hour))
            .toUtc()
            .toIso8601String(),
        if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
      });
      HapticFeedback.mediumImpact();
      if (mounted) setState(() => _sent = true);
    } on ApiError catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = MaterialLocalizations.of(context);
    if (_sent) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 10),
          Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(
              color: C.mkoko,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.check_rounded, color: C.shaba, size: 44),
          ).animate().scaleXY(
            begin: 0,
            end: 1,
            duration: 520.ms,
            curve: Curves.elasticOut,
          ),
          const SizedBox(height: 18),
          Text(t('Viewing requested', 'Ombi limetumwa'), style: display(24)),
          const SizedBox(height: 8),
          Text(
            t(
              '${widget.h.ownerName} will accept it or suggest another time. We will notify you.',
              '${widget.h.ownerName} atakubali au kupendekeza muda mwingine. Tutakujulisha.',
            ),
            textAlign: TextAlign.center,
            style: body(15.5, color: C.muted),
          ),
          const SizedBox(height: 22),
          Button(t('Done', 'Sawa'), onTap: () => Navigator.pop(context)),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(t('When can you come?', 'Unaweza kuja lini?'), style: display(24)),
        const SizedBox(height: 4),
        Text(widget.h.name, style: body(15, color: C.muted)),
        const SizedBox(height: 18),
        SizedBox(
          height: 76,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _days.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final d = _days[i], on = d == _day;
              return Press(
                onTap: () => setState(() => _day = d),
                label: loc.formatFullDate(d),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 60,
                  decoration: BoxDecoration(
                    color: on ? C.mkoko : C.chokaa,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: ExcludeSemantics(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          loc.narrowWeekdays[d.weekday % 7],
                          style: body(
                            13,
                            color: on ? C.shaba : C.muted,
                            weight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '${d.day}',
                          style: display(22, color: on ? Colors.white : C.wino),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final hour in [9, 10, 12, 14, 16, 17])
              Choice(
                '${hour.toString().padLeft(2, '0')}:00',
                on: hour == _hour,
                onTap: () => setState(() => _hour = hour),
              ),
          ],
        ),
        const SizedBox(height: 18),
        Field(
          t(
            'Note for the advertiser (optional)',
            'Ujumbe kwa mtangazaji (si lazima)',
          ),
          controller: _note,
          hint: t(
            'For example: I will come with my wife.',
            'Mfano: Nitakuja na mke wangu.',
          ),
          lines: 2,
          action: TextInputAction.done,
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(_error!, style: body(14, color: C.hibiscus)),
          ),
        const SizedBox(height: 18),
        Button(t('Send request', 'Tuma ombi'), onTap: _send, busy: _busy),
      ],
    );
  }
}

class _ReportSheet extends StatefulWidget {
  const _ReportSheet(this.h);
  final House h;

  @override
  State<_ReportSheet> createState() => _ReportSheetState();
}

class _ReportSheetState extends State<_ReportSheet> {
  final _details = TextEditingController();
  String? _reason;
  bool _busy = false;

  @override
  void dispose() {
    _details.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() => _busy = true);
    try {
      await Api.post('houses/${widget.h.id}/report', {
        'reason': _reason,
        if (_details.text.trim().isNotEmpty) 'details': _details.text.trim(),
      });
      if (!mounted) return;
      Navigator.pop(context);
      toast(
        context,
        t(
          'Reported. Our team will review this listing.',
          'Imeripotiwa. Timu yetu italipitia tangazo hili.',
        ),
      );
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final reasons = [
      (
        'asked_for_money',
        t(
          'They asked for money before a viewing',
          'Wamedai pesa kabla ya kuona nyumba',
        ),
      ),
      (
        'not_available',
        t('The home is no longer available', 'Nyumba haipo tena'),
      ),
      (
        'wrong_info',
        t('Photos or details are wrong', 'Picha au maelezo si sahihi'),
      ),
      ('suspected_scam', t('I think this is a scam', 'Nadhani huu ni utapeli')),
      (
        'duplicate',
        t('It is listed more than once', 'Imetangazwa zaidi ya mara moja'),
      ),
      ('other', t('Something else', 'Jambo jingine')),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          t('Report this listing', 'Ripoti tangazo hili'),
          style: display(24),
        ),
        const SizedBox(height: 4),
        Text(
          t(
            'The advertiser is not told who reported it.',
            'Mtangazaji haambiwi nani ameripoti.',
          ),
          style: body(15, color: C.muted),
        ),
        const SizedBox(height: 12),
        RadioGroup<String>(
          groupValue: _reason,
          onChanged: (v) => setState(() => _reason = v),
          child: Column(
            children: [
              for (final (value, label) in reasons)
                RadioListTile<String>(
                  value: value,
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  activeColor: C.mkoko,
                  title: Text(label, style: body(15.5)),
                ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Field(
          t('What happened? (optional)', 'Nini kilitokea? (si lazima)'),
          controller: _details,
          lines: 3,
          action: TextInputAction.done,
        ),
        const SizedBox(height: 18),
        Button(
          t('Send report', 'Tuma ripoti'),
          onTap: _reason == null ? null : _send,
          busy: _busy,
        ),
      ],
    );
  }
}

class _UnitCard extends StatelessWidget {
  const _UnitCard(this.unit, {required this.house});
  final HouseUnit unit;
  final House house;

  @override
  Widget build(BuildContext context) {
    final hasImg = unit.image != null && unit.image!.isNotEmpty;
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: C.line, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => sheet(context, _UnitSheet(unit, house: house)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (hasImg)
              Stack(
                children: [
                  SizedBox(
                    height: 155,
                    width: double.infinity,
                    child: Photo(unit.image),
                  ),
                  if (unit.unitType != null)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          unit.unitType!,
                          style: body(12, color: Colors.white, weight: FontWeight.w600),
                        ),
                      ),
                    ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(
                        color: C.leaf,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: C.teal.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle_rounded, size: 13, color: C.teal),
                          const SizedBox(width: 4),
                          Text(
                            t('Available', 'Ipo Wazi'),
                            style: body(11.5, color: C.teal, weight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          unit.unitNumber,
                          style: display(16, weight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: tzs(unit.rent),
                              style: display(16, color: C.teal, weight: FontWeight.w800),
                            ),
                            TextSpan(
                              text: t(' /mo', ' /mwezi'),
                              style: body(12, color: C.muted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (unit.paymentTerms != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      t('Payment terms: ${unit.paymentTerms}', 'Masharti: ${unit.paymentTerms}'),
                      style: body(13, color: C.mkoko, weight: FontWeight.w600),
                    ),
                  ],
                  if (unit.description.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      unit.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: body(13.5, color: C.wino.withValues(alpha: 0.8), height: 1.35),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(Icons.bed_outlined, size: 16, color: C.muted),
                      const SizedBox(width: 4),
                      Text('${unit.bedrooms} ${t('bed', 'chumba')}', style: body(12.5, color: C.muted)),
                      const SizedBox(width: 14),
                      Icon(Icons.shower_outlined, size: 16, color: C.muted),
                      const SizedBox(width: 4),
                      Text('${unit.bathrooms} ${t('bath', 'bafu')}', style: body(12.5, color: C.muted)),
                      const Spacer(),
                      Text(
                        t('View Details >', 'Angalia zaidi >'),
                        style: body(12.5, color: C.teal, weight: FontWeight.w700),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UnitSheet extends StatelessWidget {
  const _UnitSheet(this.unit, {required this.house});
  final HouseUnit unit;
  final House house;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (unit.image != null && unit.image!.isNotEmpty)
          ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: SizedBox(
              height: 200,
              width: double.infinity,
              child: Photo(unit.image),
            ),
          ),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(unit.unitNumber, style: display(20)),
                  if (unit.unitType != null) ...[
                    const SizedBox(height: 4),
                    Tag(unit.unitType!, bg: C.chokaa, fg: C.wino),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: C.leaf,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_rounded, size: 14, color: C.teal),
                  const SizedBox(width: 4),
                  Text(
                    t('Available', 'Ipo Wazi'),
                    style: body(12, color: C.teal, weight: FontWeight.w700),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: C.chokaa,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(t('Monthly rent', 'Kodi kwa mwezi'), style: body(14, color: C.muted)),
                  Text(tzs(unit.rent), style: display(17, color: C.teal, weight: FontWeight.w800)),
                ],
              ),
              if (unit.paymentTerms != null) ...[
                const Divider(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(t('Payment terms', 'Masharti ya malipo'), style: body(14, color: C.muted)),
                    Text(unit.paymentTerms!, style: body(14, weight: FontWeight.w700, color: C.mkoko)),
                  ],
                ),
              ],
              const Divider(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(t('Rooms & Baths', 'Vyumba na bafu'), style: body(14, color: C.muted)),
                  Text('${unit.bedrooms} ${t('bed', 'chumba')}, ${unit.bathrooms} ${t('bath', 'bafu')}', style: body(14, weight: FontWeight.w600)),
                ],
              ),
            ],
          ),
        ),
        if (unit.description.isNotEmpty) ...[
          const SizedBox(height: 14),
          Text(t('Room details', 'Maelezo ya chumba'), style: body(14, weight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(unit.description, style: body(14.5, height: 1.45)),
        ],
        const SizedBox(height: 20),
        Button(
          t('Inquire About This Room', 'Ulizia Chumba Hiki'),
          icon: Icons.chat_bubble_outline_rounded,
          onTap: () {
            Navigator.pop(context);
            push(
              context,
              ChatScreen(
                peerId: house.ownerId,
                name: house.ownerName,
                photo: house.ownerPhoto,
                house: house,
              ),
            );
          },
        ),
      ],
    );
  }
}
