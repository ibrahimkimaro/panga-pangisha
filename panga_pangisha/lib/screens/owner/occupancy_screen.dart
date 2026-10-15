import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../ui.dart';

num _toNum(dynamic val) {
  if (val == null) return 0;
  if (val is num) return val;
  return num.tryParse(val.toString()) ?? 0;
}

String _fmtCurrency(dynamic val) {
  return NumberFormat('#,###').format(_toNum(val));
}

/// Screen for Tracking Room Occupancy and Ongoing Durations ("Ukaaji wa Vyumba na Muda").
/// For every room, displays:
/// - Current occupancy status: vacant, reserved, occupied, or under maintenance
/// - Current tenant, tenancy start date & ongoing duration calculated up to today
/// - Contract end date, renewal status, days left
/// - Move-in and move-out records & historical past tenancies
/// - Rent payment status and relevant outstanding balances
/// - Occupancy timeline / rate.
class OccupancyScreen extends StatefulWidget {
  const OccupancyScreen({super.key});

  @override
  State<OccupancyScreen> createState() => _OccupancyScreenState();
}

class _OccupancyScreenState extends State<OccupancyScreen> {
  Map<String, dynamic>? _summary;
  List<Map<String, dynamic>>? _rooms;
  bool _loading = true;
  String? _error;
  String _filter = 'all'; // all, occupied, vacant, expiring_soon

  @override
  void initState() {
    super.initState();
    _fetchOccupancy();
  }

  Future<void> _fetchOccupancy() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await Api.get('occupancy/metrics');
      if (res is Map && mounted) {
        setState(() {
          _summary = res['summary'] is Map ? Map<String, dynamic>.from(res['summary'] as Map) : null;
          _rooms = res['rooms'] is List ? List<Map<String, dynamic>>.from(res['rooms'] as List) : [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = (_rooms ?? []).where((r) {
      if (_filter == 'all') return true;
      if (_filter == 'occupied') return r['status'] == 'occupied';
      if (_filter == 'vacant') return r['status'] == 'vacant';
      if (_filter == 'expiring_soon') {
        final tenant = r['current_tenant'];
        return tenant != null && tenant['is_expiring_soon'] == true;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(t('Room Occupancy & Timeline', 'Ukaaji wa Vyumba na Muda')),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: t('Refresh', 'Sasisha'),
            onPressed: _fetchOccupancy,
          ),
        ],
      ),
      body: Column(
        children: [
          // KPI Metric Bar
          if (_summary != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Row(
                children: [
                  Expanded(
                    child: _summaryTile(
                      label: t('Occupancy Rate', 'Wastani wa Ukaaji'),
                      value: '${_summary!['occupancy_percentage'] ?? 0}%',
                      color: C.good,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _summaryTile(
                      label: t('Occupied Rooms', 'Vilivyopangishwa'),
                      value: '${_summary!['occupied'] ?? 0} / ${_summary!['total_rooms'] ?? 0}',
                      color: C.teal,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _summaryTile(
                      label: t('Expiring Soon', 'Mikataba Inayoisha'),
                      value: '${_summary!['expiring_this_month'] ?? 0}',
                      color: (_summary!['expiring_this_month'] ?? 0) > 0 ? C.hibiscus : C.muted,
                    ),
                  ),
                ],
              ),
            ),

          // Filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _filterChip('all', t('All Rooms', 'Vyumba Vyote')),
                const SizedBox(width: 8),
                _filterChip('occupied', t('Occupied', 'Vilivyopangwa')),
                const SizedBox(width: 8),
                _filterChip('vacant', t('Vacant', 'Vilivyo Wazi')),
                const SizedBox(width: 8),
                _filterChip('expiring_soon', t('Expiring Soon', 'Inayoisha Hivi Karibuni')),
              ],
            ),
          ),

          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.error_outline_rounded, size: 48, color: C.hibiscus),
                              const SizedBox(height: 12),
                              Text(_error!, textAlign: TextAlign.center, style: body(14, color: C.muted)),
                              const SizedBox(height: 16),
                              Button(t('Retry', 'Jaribu Tena'), onTap: _fetchOccupancy, expand: false),
                            ],
                          ),
                        ),
                      )
                    : filtered.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.meeting_room_outlined, size: 64, color: C.muted),
                                  const SizedBox(height: 16),
                                  Text(t('No Rooms Found', 'Hakuna Vyumba'), style: display(18)),
                                  const SizedBox(height: 8),
                                  Text(
                                    t('Add units to your property to track occupancy and rental durations.', 'Ongeza vyumba kwenye nyumba yako ili ufuatilie muda wa ukaaji.'),
                                    textAlign: TextAlign.center,
                                    style: body(14, color: C.muted),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              return _RoomOccupancyCard(room: filtered[index]);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _summaryTile({required String label, required String value, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: C.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(11, color: C.muted)),
          const SizedBox(height: 4),
          Text(value, style: body(14, weight: FontWeight.w800, color: color)),
        ],
      ),
    );
  }

  Widget _filterChip(String filter, String label) {
    final selected = _filter == filter;
    return ChoiceChip(
      selected: selected,
      label: Text(label),
      labelStyle: body(13, weight: selected ? FontWeight.w700 : FontWeight.w500, color: selected ? Colors.white : C.wino),
      selectedColor: C.mkoko,
      backgroundColor: C.card,
      side: BorderSide(color: selected ? C.mkoko : C.line),
      onSelected: (_) => setState(() => _filter = filter),
    );
  }
}

class _RoomOccupancyCard extends StatefulWidget {
  const _RoomOccupancyCard({required this.room});

  final Map<String, dynamic> room;

  @override
  State<_RoomOccupancyCard> createState() => _RoomOccupancyCardState();
}

class _RoomOccupancyCardState extends State<_RoomOccupancyCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final r = widget.room;
    final status = r['status']?.toString() ?? 'vacant';
    final tenant = r['current_tenant'] is Map ? Map<String, dynamic>.from(r['current_tenant'] as Map) : null;
    final history = r['history'] is List ? List.from(r['history'] as List) : [];

    final (statusLabel, statusColor, statusBg) = switch (status) {
      'occupied' => (t('Occupied', 'Imepangishwa'), C.good, C.goodTint),
      'reserved' => (t('Reserved', 'Imetengwa'), C.shaba, C.sand),
      'under_maintenance' => (t('Maintenance', 'Ukarabati'), C.hibiscus, C.blush),
      _ => (t('Vacant', 'Wazi'), C.muted, C.fill),
    };

    final rent = _fmtCurrency(r['monthly_rent']);
    final duration = tenant?['duration'] ?? 'Vacant';
    final isExpiringSoon = tenant?['is_expiring_soon'] == true;
    final daysLeft = tenant?['days_left'];

    return Container(
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isExpiringSoon ? C.hibiscus : C.line, width: isExpiringSoon ? 1.5 : 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        '${r['property_name']} · ${r['unit_number']}',
                        style: display(16, weight: FontWeight.w800),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        statusLabel,
                        style: body(11, color: statusColor, weight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  '${r['unit_type']} · TZS $rent/mwezi',
                  style: body(13, color: C.muted),
                ),
                const SizedBox(height: 12),

                // Expiration warning banner
                if (isExpiringSoon)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: C.blush,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: C.hibiscus.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, size: 18, color: C.hibiscus),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Mkataba unaisha hivi karibuni! Siku $daysLeft zimebaki.',
                            style: body(12, color: C.hibiscus, weight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ),

                if (tenant != null) ...[
                  // Current Tenant Details & Ongoing Duration
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: C.fill,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        _metricRow(t('Current Tenant', 'Mpangaji wa Sasa'), tenant['name'] ?? '-'),
                        _metricRow(t('Phone', 'Simu'), tenant['phone'] ?? '-'),
                        _metricRow(
                          t('Occupancy Duration', 'Muda wa Ukaaji'),
                          duration,
                          color: C.teal,
                          isBold: true,
                        ),
                        _metricRow(
                          t('Lease Period', 'Muda wa Mkataba'),
                          '${tenant['starts_on']} hadi ${tenant['ends_on']}',
                        ),
                        _metricRow(
                          t('Payment Standing', 'Hali ya Kodi'),
                          tenant['payment_status'] == 'paid' ? t('Paid (All clear)', 'Imelipwa (Bila deni)') : t('Due (Has balance)', 'Inadaiwa'),
                          color: tenant['payment_status'] == 'paid' ? C.good : C.hibiscus,
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: C.fill,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle_outline_rounded, color: C.muted, size: 20),
                        const SizedBox(width: 10),
                        Text(
                          t('Room is currently vacant and available for rent.', 'Chumba hiki kiko wazi na tayari kupangishwa.'),
                          style: body(13, color: C.muted),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Historical tenancies & timeline expander
          if (history.isNotEmpty) ...[
            const Divider(height: 1),
            InkWell(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${t("Historical Tenancies", "Wapangaji Waliopita")} (${history.length})',
                      style: body(12, color: C.muted, weight: FontWeight.w700),
                    ),
                    Icon(_expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded, size: 20, color: C.muted),
                  ],
                ),
              ),
            ),
            if (_expanded)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Column(
                  children: [
                    for (final h in history)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                h['tenant_name'] ?? 'Mpangaji',
                                style: body(12, weight: FontWeight.w600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${h['starts_on']} - ${h['ends_on']}',
                              style: body(11, color: C.muted),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _metricRow(String label, String value, {Color? color, bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: body(12, color: C.muted)),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
              style: body(12, weight: isBold ? FontWeight.w800 : FontWeight.w600, color: color ?? C.wino),
            ),
          ),
        ],
      ),
    );
  }
}
