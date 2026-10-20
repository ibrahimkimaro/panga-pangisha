import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../ui.dart';
import '../chat.dart';
import '../customecontrols/pickers.dart';
import '../profile.dart';
import 'invoices_screen.dart';
import 'occupancy_screen.dart';
import 'rental_agreements_screen.dart';

// A landlord's records: tenants (screen 15), one tenant (16), rent payments (17) and maintenance (18).
// The server keeps them per home and only shows a landlord their own.

typedef _J = Map<String, dynamic>;

List<_J> _rows(dynamic json) => [for (final j in json as List) _J.from(j)];
DateTime _date(dynamic v) => DateTime.tryParse('$v') ?? DateTime.now();
String _iso(DateTime d) => DateFormat('yyyy-MM-dd').format(d);
num _n(dynamic v) => v is num ? v : num.tryParse('$v') ?? 0;
String? _need(String v) => v.isEmpty ? t('Required', 'Inahitajika') : null;

/// "9 months", "1 year": how long a tenancy has run.
String _lived(_J tn) {
  final from = _date(tn['starts_on']), to = tn['ends_on'] == null ? DateTime.now() : _date(tn['ends_on']);
  final months = (to.year - from.year) * 12 + to.month - from.month;
  if (months < 1) return t('New', 'Mpya');
  if (months < 12) return months == 1 ? t('1 month', 'Mwezi 1') : t('$months months', 'Miezi $months');
  final years = months ~/ 12;
  return years == 1 ? t('1 year', 'Mwaka 1') : t('$years years', 'Miaka $years');
}

/// "A2 · 9 months"
String _unitAndTime(_J tn) => [if ('${tn['unit'] ?? ''}'.isNotEmpty) '${tn['unit']}', _lived(tn)].join(' · ');

/// "Two-bedroom flat, Mikocheni B · A2": where a payment or a repair belongs.
String _place(_J x) => ['${x['house']?['property_name'] ?? ''}', '${x['tenant']?['unit'] ?? ''}'].where((s) => s.isNotEmpty).join(' · ');

(String, Color, Color) _tenancy(String status) =>
    status == 'active' ? (t('Active', 'Hai'), C.good, C.goodTint) : (t('Ended', 'Umeisha'), C.muted, C.fill);

(String, Color, Color) _repair(String status) => switch (status) {
  'resolved' => (t('Resolved', 'Limetatuliwa'), C.good, C.goodTint),
  'in_progress' => (t('In progress', 'Linaendelea'), C.brassInk, C.sand),
  _ => (t('Open', 'Wazi'), C.hibiscus, C.blush),
};

/// Whether this month's rent is in: the words and their colour.
(String, Color) _paid(_J tn) {
  final paid = _n(tn['paid_this_month']);
  if (paid >= _n(tn['monthly_rent'])) return (t('Paid', 'Amelipa'), C.good);
  return (paid > 0 ? t('Part paid', 'Amelipa sehemu') : t('Rent due', 'Kodi inadaiwa'), C.brassInk);
}

String _method(dynamic m) => switch (m) {
  'mobile' => t('Mobile money', 'Pesa ya simu'),
  'bank' => t('Bank', 'Benki'),
  'cash' => t('Cash', 'Taslimu'),
  _ => '',
};

/// Runs a change on the server and says why when it fails. True when it worked.
Future<bool> _do(BuildContext context, Future<dynamic> Function() run) async {
  try {
    await run();
    return true;
  } on ApiError catch (e) {
    if (context.mounted) toast(context, e.message);
    return false;
  }
}

/// The landlord's homes, for a form's "which property?"; says so when there are none.
Future<List<House>?> _myHomes(BuildContext context) async {
  try {
    final homes = House.list(await Api.get('landlord/getAllHouses/'));
    if (homes.isEmpty && context.mounted) toast(context, t('List a property first.', 'Tangaza nyumba kwanza.'));
    return homes.isEmpty ? null : homes;
  } on ApiError catch (e) {
    if (context.mounted) toast(context, e.message);
    return null;
  }
}

class _Badge extends StatelessWidget {
  const _Badge(this.label, this.fg, this.bg);
  final String label;
  final Color fg, bg;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: body(11.5, color: fg, weight: FontWeight.w700, height: 1.1)),
  );
}

/// The frame these screens share: the soft backdrop, a title with a line under it, and one main button.
class _Page extends StatelessWidget {
  const _Page({required this.title, this.sub, this.actions = const [], required this.child, this.button, this.back = true});
  final String title;
  final String? sub;
  final List<Widget> actions;
  final Widget child;
  final Widget? button;
  final bool back; // false for a tab of the shell, which has its own Scaffold

  @override
  Widget build(BuildContext context) {
    final page = GlassBackdrop(
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(back ? 14 : 20, 12, 16, 10),
              child: Row(
                children: [
                  if (back) ...[
                    RoundIcon(Icons.arrow_back_rounded, label: t('Back', 'Rudi'), onTap: () => Navigator.pop(context)),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: display(back ? 19 : 22, weight: FontWeight.w800)),
                        if (sub != null) Text(sub!, style: body(12.5, color: C.muted, height: 1.3)),
                      ],
                    ),
                  ),
                  for (final a in actions) Padding(padding: const EdgeInsets.only(left: 8), child: a),
                ],
              ),
            ),
            Expanded(child: child),
            if (button != null) SafeArea(top: false, child: Padding(padding: const EdgeInsets.fromLTRB(20, 6, 20, 12), child: button)),
          ],
        ),
      ),
    );
    return back ? Scaffold(body: page) : page;
  }
}

/// Tactile volumetric 3D container with dual clay shadows and specular highlights.
class _ClayBox extends StatelessWidget {
  const _ClayBox({
    required this.child,
    this.color,
    this.radius = 20,
    this.padding,
    this.onTap,
  });

  final Widget child;
  final Color? color;
  final double radius;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = C.dark;
    final baseColor = color ?? (isDark ? const Color(0xFF1E242B) : Colors.white);
    final edge = isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF1F5F9);
    final darkShadow = isDark
        ? Colors.black.withValues(alpha: 0.45)
        : const Color(0x180F2A3F).withValues(alpha: 0.22);
    final lightShadow = isDark
        ? Colors.white.withValues(alpha: 0.04)
        : Colors.white.withValues(alpha: 0.95);

    final box = Container(
      decoration: BoxDecoration(
        color: baseColor,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: edge, width: 1.6),
        boxShadow: [
          // Soft ambient clay drop shadow (bottom-right)
          BoxShadow(
            color: darkShadow,
            offset: const Offset(4, 6),
            blurRadius: 14,
            spreadRadius: -1,
          ),
          // Bright specular light reflection (top-left)
          BoxShadow(
            color: lightShadow,
            offset: const Offset(-3, -3),
            blurRadius: 10,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(radius > 2 ? radius - 2 : radius),
        clipBehavior: Clip.antiAlias,
        child: Padding(
          padding: padding ?? const EdgeInsets.all(16),
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      return Press(onTap: onTap, child: box);
    }
    return box;
  }
}

/// Claymorphic quick action item with vibrant bulb icon and bold label.
class _ClayQuickActionItem extends StatelessWidget {
  const _ClayQuickActionItem({
    required this.icon,
    required this.label,
    required this.accentColor,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color accentColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = C.dark;
    return Press(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E242B) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF1F5F9),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.black.withValues(alpha: 0.35) : const Color(0x140F2A3F),
              offset: const Offset(3, 5),
              blurRadius: 10,
              spreadRadius: -1,
            ),
            BoxShadow(
              color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.white,
              offset: const Offset(-2, -2),
              blurRadius: 6,
              spreadRadius: 1,
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: isDark ? 0.22 : 0.12),
                borderRadius: BorderRadius.circular(11),
                border: Border.all(
                  color: accentColor.withValues(alpha: isDark ? 0.35 : 0.25),
                  width: 1,
                ),
              ),
              child: Icon(icon, size: 17, color: accentColor),
            ),
            const SizedBox(width: 9),
            Text(
              label,
              style: body(13, weight: FontWeight.w700, color: C.wino),
            ),
          ],
        ),
      ),
    );
  }
}

/// Recessed / sunken clay search field with clear action.
class _ClaySearchField extends StatelessWidget {
  const _ClaySearchField({
    required this.onChanged,
    required this.hintText,
    this.onClear,
    this.hasQuery = false,
  });

  final ValueChanged<String> onChanged;
  final String hintText;
  final VoidCallback? onClear;
  final bool hasQuery;

  @override
  Widget build(BuildContext context) {
    final isDark = C.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF191E24) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withValues(alpha: 0.3) : const Color(0x100F2A3F),
            offset: const Offset(2, 3),
            blurRadius: 6,
          ),
          BoxShadow(
            color: isDark ? Colors.white.withValues(alpha: 0.02) : Colors.white,
            offset: const Offset(-2, -2),
            blurRadius: 5,
          ),
        ],
      ),
      child: Row(
        children: [
          const SizedBox(width: 14),
          Icon(Icons.search_rounded, color: C.teal, size: 21),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              onChanged: onChanged,
              style: body(14, weight: FontWeight.w600),
              decoration: InputDecoration(
                filled: false,
                isDense: true,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 13),
                hintText: hintText,
                hintStyle: body(14, color: C.muted),
              ),
            ),
          ),
          if (hasQuery && onClear != null)
            GestureDetector(
              onTap: onClear,
              child: Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Icon(Icons.close_rounded, size: 18, color: C.muted),
              ),
            )
          else
            const SizedBox(width: 12),
        ],
      ),
    );
  }
}

/// Tactile 3D Clay Segment Selector: sunken track with elevated sliding clay pill.
class _Seg extends StatelessWidget {
  const _Seg(this.names, this.at, this.onTap);
  final List<String> names;
  final int at;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = C.dark;
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF191E24) : const Color(0xFFEDF2F7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withValues(alpha: 0.3) : const Color(0x100F2A3F),
            offset: const Offset(2, 3),
            blurRadius: 6,
          ),
        ],
      ),
      child: Row(
        children: [
          for (final (i, name) in names.indexed)
            Expanded(
              child: Press(
                onTap: () => onTap(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutCubic,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: at == i ? (isDark ? const Color(0xFF252C35) : Colors.white) : Colors.transparent,
                    borderRadius: BorderRadius.circular(15),
                    border: at == i
                        ? Border.all(
                            color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.white,
                            width: 1.5,
                          )
                        : null,
                    boxShadow: at == i
                        ? [
                            BoxShadow(
                              color: isDark ? Colors.black.withValues(alpha: 0.35) : const Color(0x160F2A3F),
                              offset: const Offset(2, 4),
                              blurRadius: 8,
                            ),
                            BoxShadow(
                              color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white,
                              offset: const Offset(-2, -2),
                              blurRadius: 6,
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: body(
                      13,
                      weight: at == i ? FontWeight.w800 : FontWeight.w600,
                      color: at == i ? (isDark ? Colors.white : C.mkoko) : C.muted,
                      height: 1.2,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Fades between the bodies of a [_Seg].
Widget _switch(int at, Widget child) => AnimatedSwitcher(
  duration: const Duration(milliseconds: 260),
  switchInCurve: Curves.easeOutCubic,
  child: KeyedSubtree(key: ValueKey(at), child: child),
);

/// A line of quiet text in a clay card: "nothing here yet".
Widget _none(String text) => _ClayBox(
  radius: 18,
  child: SizedBox(width: double.infinity, child: Text(text, style: body(13.5, color: C.muted, height: 1.4))),
);

Widget _bones() => ListView(
  padding: const EdgeInsets.symmetric(horizontal: 20),
  children: const [
    Bone(height: 110, radius: 22),
    SizedBox(height: 12),
    Bone(height: 110, radius: 22),
    SizedBox(height: 12),
    Bone(height: 110, radius: 22),
  ],
);

Widget _failed(String error, VoidCallback again) =>
    Notice(icon: Icons.cloud_off_outlined, title: t('This did not load', 'Imeshindwa kufunguka'), text: error, action: t('Try again', 'Jaribu tena'), onAction: again);

/// Redesigned Claymorphism Tenant List Item.
class _TenantRow extends StatelessWidget {
  const _TenantRow(this.tn, {required this.onTap});
  final _J tn;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = C.dark;
    final isActive = tn['status'] == 'active';
    final (label, fg, bg) = _tenancy('${tn['status']}');
    final (paid, paidColor) = _paid(tn);
    final houseName = '${tn['house']?['property_name'] ?? ''}';
    final unit = '${tn['unit'] ?? ''}';
    final rent = _n(tn['monthly_rent']);
    final userId = tn['user_id'];

    return _ClayBox(
      onTap: onTap,
      radius: 22,
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 3D tactile avatar with active status badge
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: isDark ? Colors.black45 : const Color(0x180F2A3F),
                          offset: const Offset(2, 4),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: Avatar('${tn['name']}', size: 48),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: isActive ? C.good : C.muted,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark ? const Color(0xFF1E242B) : Colors.white,
                          width: 2.2,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${tn['name']}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: display(15.5, weight: FontWeight.w800, color: C.wino),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                          decoration: BoxDecoration(
                            color: bg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: fg.withValues(alpha: 0.25),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            label,
                            style: body(11, weight: FontWeight.w800, color: fg, height: 1.1),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        if (houseName.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF28303A) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.home_work_outlined, size: 12, color: C.muted),
                                const SizedBox(width: 4),
                                ConstrainedBox(
                                  constraints: const BoxConstraints(maxWidth: 130),
                                  child: Text(
                                    houseName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: body(11.5, weight: FontWeight.w600, color: C.muted),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        if (unit.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: C.teal.withValues(alpha: isDark ? 0.2 : 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              t('Unit $unit', 'Chumba $unit'),
                              style: body(11.5, weight: FontWeight.w700, color: C.teal),
                            ),
                          ),
                        Text(
                          _lived(tn),
                          style: body(11.5, color: C.muted),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Clay footer strip: Rent amount + Payment status + Quick actions
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF161A20) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? Colors.white.withValues(alpha: 0.04) : const Color(0xFFEDF2F7),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t('Monthly rent', 'Kodi ya mwezi'),
                        style: body(10.5, color: C.muted, height: 1.1),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        tzs(rent),
                        style: display(13.5, weight: FontWeight.w800, color: C.wino),
                      ),
                    ],
                  ),
                ),
                if (isActive) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: paidColor.withValues(alpha: isDark ? 0.2 : 0.12),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: paidColor.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          paidColor == C.good ? Icons.check_circle_rounded : Icons.schedule_rounded,
                          size: 13,
                          color: paidColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          paid,
                          style: body(11, weight: FontWeight.w800, color: paidColor, height: 1.1),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                if (userId != null) ...[
                  Press(
                    onTap: () => push(context, ChatScreen(peerId: userId, name: '${tn['name']}')),
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: C.teal.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: Icon(Icons.chat_bubble_outline_rounded, size: 15, color: C.teal),
                    ),
                  ),
                  const SizedBox(width: 6),
                ],
                Icon(Icons.chevron_right_rounded, size: 18, color: C.muted),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow(this.p, {required this.onTap, this.own = false});
  final _J p;
  final VoidCallback onTap;
  final bool own; // inside one tenant's page: their name would only repeat

  @override
  Widget build(BuildContext context) {
    final on = day(_date(p['paid_on'])), how = _method(p['method']);
    return Press(
      onTap: onTap,
      child: Glass(
        radius: 18,
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            if (own)
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: C.goodTint, shape: BoxShape.circle),
                child: Icon(Icons.check_rounded, size: 18, color: C.good),
              )
            else
              Avatar('${p['tenant']?['name'] ?? ''}', size: 36),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(own ? on : '${p['tenant']?['name'] ?? ''}', maxLines: 1, overflow: TextOverflow.ellipsis, style: body(14, weight: FontWeight.w600, height: 1.25)),
                  Text(own ? how : _place(p), maxLines: 1, overflow: TextOverflow.ellipsis, style: body(12, color: C.muted, height: 1.3)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(tzs(_n(p['amount'])), style: display(14, weight: FontWeight.w700)),
                if (!own) Text(on, style: body(11.5, color: C.muted, height: 1.3)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RequestRow extends StatelessWidget {
  const _RequestRow(this.m, {required this.onTap});
  final _J m;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final (label, fg, bg) = _repair('${m['status']}');
    return Press(
      onTap: onTap,
      child: Glass(
        radius: 18,
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(color: C.leaf, shape: BoxShape.circle),
              child: Icon(Icons.build_outlined, size: 17, color: C.teal),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${m['title']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: body(14.5, weight: FontWeight.w600, height: 1.25)),
                  Text(_place(m), maxLines: 1, overflow: TextOverflow.ellipsis, style: body(12.5, color: C.muted, height: 1.3)),
                  Text(dayTime(_date(m['created_at'])), style: body(11.5, color: C.muted, height: 1.3)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _Badge(label, fg, bg),
          ],
        ),
      ),
    );
  }
}

/// A repair request in full, with the three states to move it between.
void _requestSheet(BuildContext context, _J m, VoidCallback changed) => sheet(
  context,
  Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: [
      const SizedBox(width: double.infinity), // text alone would shrink the sheet to its width
      Text('${m['title']}', style: display(19, weight: FontWeight.w800)),
      const SizedBox(height: 4),
      Text([_place(m), '${m['tenant']?['name'] ?? ''}'].where((s) => s.isNotEmpty).join(' · '), style: body(13, color: C.muted, height: 1.35)),
      Text(dayTime(_date(m['created_at'])), style: body(12.5, color: C.muted, height: 1.35)),
      if ('${m['details'] ?? ''}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text('${m['details']}', style: body(14.5, height: 1.45))),
      const SizedBox(height: 16),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final s in ['open', 'in_progress', 'resolved'])
            Choice(
              _repair(s).$1,
              on: m['status'] == s,
              onTap: () async {
                Navigator.pop(context);
                if (m['status'] != s && await _do(context, () => Api.patch('maintenance/${m['id']}', {'status': s}))) changed();
              },
            ),
        ],
      ),
    ],
  ),
);

/// One payment in full, with a way to take back one recorded by mistake.
void _paymentSheet(BuildContext context, _J p, VoidCallback changed) => sheet(
  context,
  Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: [
      Text(tzs(_n(p['amount'])), style: display(22, color: C.teal, weight: FontWeight.w800)),
      const SizedBox(height: 4),
      Text(['${p['tenant']?['name'] ?? ''}', _place(p)].where((s) => s.isNotEmpty).join(' · '), style: body(13.5, color: C.muted, height: 1.35)),
      Text([day(_date(p['paid_on'])), _method(p['method'])].where((s) => s.isNotEmpty).join(' · '), style: body(13.5, color: C.muted, height: 1.35)),
      if ('${p['note'] ?? ''}'.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 10), child: Text('${p['note']}', style: body(14.5))),
      const SizedBox(height: 16),
      Button(
        t('Remove this payment', 'Ondoa malipo haya'),
        tone: Tone.plain,
        icon: Icons.delete_outline_rounded,
        onTap: () async {
          Navigator.pop(context);
          if (await _do(context, () => Api.delete('rent-payments/${p['id']}'))) changed();
        },
      ),
    ],
  ),
);

/// A form in a bottom sheet: checks the fields, saves, and closes with `true`. A failure shows above the button.
class _FormSheet extends StatefulWidget {
  const _FormSheet({required this.title, required this.fields, required this.action, required this.save});
  final String title, action;
  final List<Widget> fields;
  final Future<dynamic> Function() save;

  @override
  State<_FormSheet> createState() => _FormSheetState();
}

class _FormSheetState extends State<_FormSheet> {
  final _form = GlobalKey<FormState>();
  bool _busy = false;
  String? _error;

  Future<void> _go() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await widget.save();
      if (mounted) Navigator.pop(context, true);
    } on ApiError catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Form(
    key: _form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(widget.title, style: display(19, weight: FontWeight.w800)),
        const SizedBox(height: 14),
        for (final f in widget.fields) Padding(padding: const EdgeInsets.only(bottom: 12), child: f),
        if (_error != null) Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(_error!, style: body(13.5, color: C.hibiscus, height: 1.35))),
        Button(widget.action, busy: _busy, onTap: _go),
      ],
    ),
  );
}

final _digits = [FilteringTextInputFormatter.digitsOnly];

/// "Which property?" for a form, shown only when there is more than one to choose from.
Widget _homeField(BuildContext context, List<House> homes, TextEditingController text, ValueChanged<House> picked) => PickerField(
  t('Property', 'Nyumba'),
  controller: text,
  hint: t('Choose a property', 'Chagua nyumba'),
  validator: _need,
  onTap: () async {
    final h = await pickFrom<House>(context, title: t('Property', 'Nyumba'), items: homes, label: (h) => h.name, trailing: (h) => h.place);
    if (h == null) return;
    text.text = h.name;
    picked(h);
  },
);

/// A day chosen from the calendar, never in the future.
Widget _dayField(BuildContext context, String label, TextEditingController text, DateTime now, ValueChanged<DateTime> picked) => PickerField(
  label,
  controller: text,
  onTap: () async {
    final d = await showDatePicker(context: context, initialDate: now, firstDate: DateTime(2000), lastDate: DateTime.now());
    if (d == null) return;
    text.text = day(d);
    picked(d);
  },
);

class _TenantForm extends StatefulWidget {
  const _TenantForm(this.homes);
  final List<House> homes;

  @override
  State<_TenantForm> createState() => _TenantFormState();
}

class _TenantFormState extends State<_TenantForm> {
  late House? _home = widget.homes.length == 1 ? widget.homes.first : null;
  DateTime _from = DateTime.now();
  final _homeName = TextEditingController(), _name = TextEditingController(), _phone = TextEditingController();
  final _email = TextEditingController(), _unit = TextEditingController();
  late final _rent = TextEditingController(text: _home == null ? '' : '${_home!.rent.round()}');
  late final _fromText = TextEditingController(text: day(_from));

  @override
  Widget build(BuildContext context) => _FormSheet(
    title: t('Add a tenant', 'Ongeza mpangaji'),
    action: t('Save tenant', 'Hifadhi mpangaji'),
    save: () => Api.post('tenants', {
      'house_id': _home!.id,
      'name': _name.text.trim(),
      'phone': _phone.text.trim(),
      if (_email.text.trim().isNotEmpty) 'email': _email.text.trim(),
      'unit': _unit.text.trim(),
      'monthly_rent': int.parse(_rent.text),
      'starts_on': _iso(_from),
    }),
    fields: [
      if (widget.homes.length > 1)
        _homeField(context, widget.homes, _homeName, (h) {
          _home = h;
          if (_rent.text.isEmpty) _rent.text = '${h.rent.round()}';
        }),
      Field(t('Full name', 'Jina kamili'), controller: _name, validator: _need),
      Field(
        t('Phone', 'Simu'),
        controller: _phone,
        keyboard: TextInputType.phone,
        hint: '0712 345 678',
        help: t('If they use Panga with this number, you can message them from here.', 'Wakitumia Panga kwa namba hii, utaweza kuwatumia ujumbe hapa.'),
      ),
      Field(t('Email (optional)', 'Barua pepe (si lazima)'), controller: _email, keyboard: TextInputType.emailAddress),
      Field(t('Unit or room (optional)', 'Chumba au namba (si lazima)'), controller: _unit, hint: 'A2'),
      Field(t('Monthly rent (TSh)', 'Kodi ya mwezi (TSh)'), controller: _rent, keyboard: TextInputType.number, formatters: _digits, validator: _need),
      _dayField(context, t('Move-in date', 'Tarehe ya kuhamia'), _fromText, _from, (d) => _from = d),
    ],
  );
}

class _PaymentForm extends StatefulWidget {
  const _PaymentForm(this.tn);
  final _J tn;

  @override
  State<_PaymentForm> createState() => _PaymentFormState();
}

class _PaymentFormState extends State<_PaymentForm> {
  DateTime _on = DateTime.now();
  String _how = 'mobile';
  final _note = TextEditingController();
  late final _onText = TextEditingController(text: day(_on));
  // What is still owed this month, or a full month when nothing is.
  late final _amount = TextEditingController(
    text: () {
      final rent = _n(widget.tn['monthly_rent']), left = rent - _n(widget.tn['paid_this_month']);
      return '${(left > 0 ? left : rent).round()}';
    }(),
  );

  @override
  Widget build(BuildContext context) => _FormSheet(
    title: t('Payment from ${widget.tn['name']}', 'Malipo kutoka kwa ${widget.tn['name']}'),
    action: t('Record payment', 'Rekodi malipo'),
    save: () => Api.post('tenants/${widget.tn['id']}/payments', {
      'amount': int.parse(_amount.text),
      'paid_on': _iso(_on),
      'method': _how,
      if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
    }),
    fields: [
      Field(
        t('Amount (TSh)', 'Kiasi (TSh)'),
        controller: _amount,
        keyboard: TextInputType.number,
        formatters: _digits,
        validator: (v) => (int.tryParse(v) ?? 0) < 1 ? t('Enter the amount', 'Weka kiasi') : null,
      ),
      _dayField(context, t('Paid on', 'Tarehe ya malipo'), _onText, _on, (d) => _on = d),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [for (final m in ['mobile', 'bank', 'cash']) Choice(_method(m), on: _how == m, onTap: () => setState(() => _how = m))],
      ),
      Field(t('Note (optional)', 'Maelezo (si lazima)'), controller: _note, action: TextInputAction.done),
    ],
  );
}

class _RequestForm extends StatefulWidget {
  const _RequestForm({this.homes = const [], this.tn});
  final List<House> homes;
  final _J? tn; // asked by this tenant, so the property is already known

  @override
  State<_RequestForm> createState() => _RequestFormState();
}

class _RequestFormState extends State<_RequestForm> {
  late House? _home = widget.homes.length == 1 ? widget.homes.first : null;
  final _homeName = TextEditingController(), _title = TextEditingController(), _details = TextEditingController();

  @override
  Widget build(BuildContext context) => _FormSheet(
    title: t('New maintenance request', 'Ombi jipya la matengenezo'),
    action: t('Save request', 'Hifadhi ombi'),
    save: () => Api.post('maintenance', {
      'house_id': widget.tn?['house']?['id'] ?? _home!.id,
      if (widget.tn != null) 'tenancy_id': widget.tn!['id'],
      'title': _title.text.trim(),
      if (_details.text.trim().isNotEmpty) 'details': _details.text.trim(),
    }),
    fields: [
      if (widget.tn == null && widget.homes.length > 1) _homeField(context, widget.homes, _homeName, (h) => _home = h),
      Field(t('What needs fixing?', 'Nini kinahitaji kutengenezwa?'), controller: _title, hint: t('Leaking tap', 'Bomba linavuja'), validator: _need),
      Field(t('Details (optional)', 'Maelezo (si lazima)'), controller: _details, lines: 3, action: TextInputAction.newline),
    ],
  );
}

/// Screen 15: the people who rent from this landlord. Viewing requests sit beside them, one tap away.
class TenantsTab extends StatefulWidget {
  const TenantsTab({super.key});

  @override
  State<TenantsTab> createState() => _TenantsTabState();
}

class _TenantsTabState extends State<TenantsTab> {
  List<_J>? _tenants;
  String? _error;
  String _query = '';
  int _seg = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = _rows(await Api.get('tenants'));
      if (mounted) {
        setState(() {
          _tenants = rows;
          _error = null;
        });
      }
    } on ApiError catch (e) {
      if (mounted && _tenants == null) setState(() => _error = e.message);
    }
  }

  Future<void> _open(Widget screen) async {
    await push(context, screen);
    _load();
  }

  Future<void> _add() async {
    final homes = await _myHomes(context);
    if (homes == null || !mounted) return;
    if (await sheet<bool>(context, _TenantForm(homes)) == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    final all = _tenants;
    final shown = [
      for (final tn in all ?? const <_J>[])
        if (_query.isEmpty || '${tn['name']} ${tn['unit']} ${tn['house']?['property_name']}'.toLowerCase().contains(_query)) tn,
    ];
    final active = all?.where((tn) => tn['status'] == 'active').length ?? 0;
    return _Page(
      back: false,
      title: t('Tenants', 'Wapangaji'),
      sub: all == null ? ' ' : (active == 1 ? t('1 tenant', 'Mpangaji 1') : t('$active tenants', 'Wapangaji $active')),
      actions: [
        RoundIcon(Icons.person_add_alt_1_rounded, label: t('Add tenant', 'Ongeza mpangaji'), onTap: _add),
      ],
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _Seg([t('Tenants', 'Wapangaji'), t('Viewing requests', 'Maombi ya kuona')], _seg, (i) => setState(() => _seg = i)),
          ),
          const SizedBox(height: 12),
          // Middle Claymorphism Quick Navigation Tools (Chosen 1 unified place with Icon + Name)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _ClayQuickActionItem(
                  icon: Icons.description_rounded,
                  label: t('Mikataba', 'Mikataba'),
                  accentColor: const Color(0xFF0D9488),
                  onTap: () => _open(const RentalAgreementsScreen()),
                ),
                const SizedBox(width: 10),
                _ClayQuickActionItem(
                  icon: Icons.receipt_long_rounded,
                  label: t('Ankara & Bili', 'Ankara & Bili'),
                  accentColor: const Color(0xFF6366F1),
                  onTap: () => _open(const InvoicesScreen()),
                ),
                const SizedBox(width: 10),
                _ClayQuickActionItem(
                  icon: Icons.pie_chart_rounded,
                  label: t('Ukaaji wa Vyumba', 'Ukaaji'),
                  accentColor: const Color(0xFFF59E0B),
                  onTap: () => _open(const OccupancyScreen()),
                ),
                const SizedBox(width: 10),
                _ClayQuickActionItem(
                  icon: Icons.payments_rounded,
                  label: t('Malipo ya Kodi', 'Malipo'),
                  accentColor: const Color(0xFF10B981),
                  onTap: () => _open(const RentPaymentsScreen()),
                ),
                const SizedBox(width: 10),
                _ClayQuickActionItem(
                  icon: Icons.handyman_rounded,
                  label: t('Matengenezo', 'Matengenezo'),
                  accentColor: const Color(0xFFE11D48),
                  onTap: () => _open(const MaintenanceScreen()),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _seg == 1
                ? const ViewingsList(asOwner: true)
                : Stack(
                    children: [
                      Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                            child: _ClaySearchField(
                              hasQuery: _query.isNotEmpty,
                              onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                              onClear: () => setState(() => _query = ''),
                              hintText: t('Search tenants, units, properties...', 'Tafuta mpangaji, chumba, nyumba...'),
                            ),
                          ),
                          Expanded(
                            child: _error != null
                                ? _failed(_error!, _load)
                                : all == null
                                ? _bones()
                                : all.isEmpty
                                ? Notice(
                                    icon: Icons.people_outline_rounded,
                                    title: t('No tenants yet', 'Bado hakuna wapangaji'),
                                    text: t('Add the people who rent from you to keep their rent and repairs in one place.', 'Ongeza wanaopanga kwako ili kodi na matengenezo yao yawe sehemu moja.'),
                                    action: t('Add tenant', 'Ongeza mpangaji'),
                                    onAction: _add,
                                  )
                                : shown.isEmpty
                                ? Notice(
                                    icon: Icons.search_off_rounded,
                                    title: t('Nothing matches', 'Hakuna inayolingana'),
                                    text: t('Try another name, unit or property.', 'Jaribu jina, chumba au nyumba nyingine.'),
                                  )
                                : RefreshIndicator(
                                    color: C.teal,
                                    onRefresh: _load,
                                    child: ListView.separated(
                                      padding: const EdgeInsets.fromLTRB(20, 2, 20, 170),
                                      itemCount: shown.length,
                                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                                      itemBuilder: (_, i) => _TenantRow(shown[i], onTap: () => _open(_TenantScreen(shown[i]))).reveal(i.clamp(0, 6)),
                                    ),
                                  ),
                          ),
                        ],
                      ),
                      if (all != null && all.isNotEmpty)
                        Positioned(
                          right: 20,
                          bottom: 100,
                          child: _ClayBox(
                            color: C.mkoko,
                            radius: 22,
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                            onTap: _add,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.person_add_alt_1_rounded, color: Colors.white, size: 19),
                                const SizedBox(width: 8),
                                Text(
                                  t('Add tenant', 'Ongeza mpangaji'),
                                  style: body(13.5, weight: FontWeight.w800, color: Colors.white),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

/// Screen 16: one tenant: how to reach them, the rent they paid, and what they asked to have fixed.
class _TenantScreen extends StatefulWidget {
  const _TenantScreen(this.tn);
  final _J tn;

  @override
  State<_TenantScreen> createState() => _TenantScreenState();
}

class _TenantScreenState extends State<_TenantScreen> {
  late _J tn = widget.tn;
  List<_J>? _payments, _repairs;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final j = _J.from(await Api.get('tenants/${tn['id']}'));
      if (mounted) {
        setState(() {
          tn = j;
          _payments = _rows(j['payments']);
          _repairs = _rows(j['maintenance']);
        });
      }
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  Future<void> _form(Widget form) async {
    if (await sheet<bool>(context, form) == true) _load();
  }

  Future<void> _end() async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(t('End this tenancy?', 'Maliza upangaji huu?')),
        content: Text(t('${tn['name']} moves to past tenants. Their payments stay on record.', '${tn['name']} atahamia kwa wapangaji wa zamani. Malipo yake yanabaki kwenye kumbukumbu.')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(t('Cancel', 'Ghairi'))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: Text(t('End tenancy', 'Maliza upangaji'))),
        ],
      ),
    );
    if (yes == true && mounted && await _do(context, () => Api.patch('tenants/${tn['id']}', {'status': 'ended'}))) _load();
  }

  @override
  Widget build(BuildContext context) {
    final (label, fg, bg) = _tenancy('${tn['status']}');
    return _Page(
      title: t('Tenant', 'Mpangaji'),
      actions: [
        if (tn['user_id'] != null)
          RoundIcon(
            Icons.chat_bubble_outline_rounded,
            label: t('Message', 'Tuma ujumbe'),
            onTap: () => push(context, ChatScreen(peerId: tn['user_id'], name: '${tn['name']}')),
          ),
        if (tn['status'] == 'active') RoundIcon(Icons.person_remove_outlined, label: t('End tenancy', 'Maliza upangaji'), onTap: _end),
      ],
      button: Button(t('Record payment', 'Rekodi malipo'), icon: Icons.add_rounded, onTap: () => _form(_PaymentForm(tn))),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 6, 20, 20),
        children: [
          Row(
            children: [
              Avatar('${tn['name']}', size: 58),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${tn['name']}', style: display(19, weight: FontWeight.w800)),
                    const SizedBox(height: 2),
                    Text(_unitAndTime(tn), style: body(13, color: C.muted, height: 1.3)),
                  ],
                ),
              ),
              _Badge(label, fg, bg),
            ],
          ).reveal(0),
          const SizedBox(height: 16),
          _Seg([t('Overview', 'Muhtasari'), t('Rent', 'Kodi'), t('Maintenance', 'Matengenezo')], _tab, (i) => setState(() => _tab = i)).reveal(1),
          const SizedBox(height: 12),
          _switch(_tab, switch (_tab) {
            0 => _overview(),
            1 => _rent(),
            _ => _maintenance(),
          }).reveal(2),
        ],
      ),
    );
  }

  Widget _line(IconData icon, String label, String value, {VoidCallback? onTap}) => InkWell(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(color: C.leaf, shape: BoxShape.circle),
            child: Icon(icon, size: 17, color: C.teal),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: body(11.5, color: C.muted, height: 1.3)),
                Text(value, style: body(14, weight: FontWeight.w600, height: 1.3)),
              ],
            ),
          ),
          if (onTap != null) Icon(Icons.copy_rounded, size: 16, color: C.faint),
        ],
      ),
    ),
  );

  Widget _overview() {
    final phone = '${tn['phone'] ?? ''}', email = '${tn['email'] ?? ''}';
    void copy(String text) {
      Clipboard.setData(ClipboardData(text: text));
      toast(context, t('Copied', 'Imenakiliwa'));
    }

    return Column(
      children: [
        _ClayBox(
          radius: 20,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            children: [
              _line(Icons.call_outlined, t('Phone', 'Simu'), phone.isEmpty ? t('Not given', 'Haijawekwa') : phone, onTap: phone.isEmpty ? null : () => copy(phone)),
              _line(Icons.mail_outline_rounded, t('Email', 'Barua pepe'), email.isEmpty ? t('Not given', 'Haijawekwa') : email, onTap: email.isEmpty ? null : () => copy(email)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _ClayBox(
          radius: 20,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            children: [
              _line(Icons.apartment_rounded, '${tn['house']?['property_name'] ?? ''}', '${tn['unit'] ?? ''}'.isEmpty ? t('Whole property', 'Nyumba nzima') : t('Unit ${tn['unit']}', 'Chumba ${tn['unit']}')),
              _line(Icons.event_outlined, t('Move-in date', 'Tarehe ya kuhamia'), day(_date(tn['starts_on']))),
              if (tn['ends_on'] != null) _line(Icons.event_busy_outlined, t('Moved out', 'Alihama'), day(_date(tn['ends_on']))),
              _line(Icons.payments_outlined, t('Monthly rent', 'Kodi ya mwezi'), tzs(_n(tn['monthly_rent']))),
            ],
          ),
        ),
      ],
    );
  }

  Widget _rent() {
    final (paid, paidColor) = _paid(tn);
    final list = _payments;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _ClayBox(
          radius: 20,
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t('Paid this month', 'Amelipa mwezi huu'), style: body(12.5, color: C.muted, height: 1.3)),
                    Text(tzs(_n(tn['paid_this_month'])), style: display(20, color: C.teal, weight: FontWeight.w800)),
                    Text(t('of ${tzs(_n(tn['monthly_rent']))}', 'kati ya ${tzs(_n(tn['monthly_rent']))}'), style: body(12.5, color: C.muted, height: 1.3)),
                  ],
                ),
              ),
              if (tn['status'] == 'active') Text(paid, style: body(12.5, weight: FontWeight.w700, color: paidColor)),
            ],
          ),
        ),
        const SizedBox(height: 10),
        if (list == null) const Bone(height: 60, radius: 18),
        if (list != null && list.isEmpty) _none(t('No payment recorded yet.', 'Bado hakuna malipo yaliyorekodiwa.')),
        for (final p in list ?? const <_J>[])
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _PaymentRow(p, own: true, onTap: () => _paymentSheet(context, p, _load)),
          ),
      ],
    );
  }

  Widget _maintenance() {
    final list = _repairs;
    return Column(
      children: [
        if (list == null) const Bone(height: 60, radius: 18),
        if (list != null && list.isEmpty) _none(t('Nothing to fix has been recorded for this tenant.', 'Hakuna tatizo lililorekodiwa kwa mpangaji huyu.')),
        for (final m in list ?? const <_J>[])
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _RequestRow(m, onTap: () => _requestSheet(context, m, _load)),
          ),
        const SizedBox(height: 4),
        Button(t('New request', 'Ombi jipya'), tone: Tone.plain, icon: Icons.add_rounded, onTap: () => _form(_RequestForm(tn: tn))),
      ],
    );
  }
}

/// Six months of rent as bars; this month stands out.
class RentBars extends StatelessWidget {
  const RentBars(this.months, {super.key});
  final List<Map<String, dynamic>> months;

  @override
  Widget build(BuildContext context) {
    final top = months.fold<num>(1, (m, x) => _n(x['total']) > m ? _n(x['total']) : m);
    return SizedBox(
      height: 132,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (final (i, m) in months.indexed)
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(_n(m['total']) > 0 ? tzsShort(_n(m['total'])) : '', style: body(10.5, color: C.muted, height: 1.2)),
                  const SizedBox(height: 4),
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: _n(m['total']) / top),
                    duration: Duration(milliseconds: reduceMotion ? 0 : 520 + 60 * i),
                    curve: Curves.easeOutCubic,
                    builder: (_, v, _) => Container(
                      width: 20,
                      height: 4 + 82 * v,
                      decoration: BoxDecoration(color: i == months.length - 1 ? C.mkoko : C.teal.withValues(alpha: .28), borderRadius: BorderRadius.circular(7)),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(DateFormat('MMM', lang.value).format(_date('${m['month']}-01')), style: body(11, color: C.muted, height: 1.2)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Screen 17: the rent this landlord has recorded: this month against what is due, then the payments.
class RentPaymentsScreen extends StatefulWidget {
  const RentPaymentsScreen({super.key});

  @override
  State<RentPaymentsScreen> createState() => _RentPaymentsScreenState();
}

class _RentPaymentsScreenState extends State<RentPaymentsScreen> {
  _J? _data;
  String? _error;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final j = _J.from(await Api.get('rent-payments'));
      if (mounted) {
        setState(() {
          _data = j;
          _error = null;
        });
      }
    } on ApiError catch (e) {
      if (mounted && _data == null) setState(() => _error = e.message);
    }
  }

  /// Whose payment? Then the amount.
  Future<void> _record() async {
    List<_J> tenants = const [];
    if (!await _do(context, () async => tenants = _rows(await Api.get('tenants')).where((tn) => tn['status'] == 'active').toList()) || !mounted) return;
    if (tenants.isEmpty) return toast(context, t('Add a tenant first, in the Tenants tab.', 'Ongeza mpangaji kwanza, kwenye Wapangaji.'));
    final tn = await pickFrom<_J>(
      context,
      title: t('Who paid?', 'Nani amelipa?'),
      items: tenants,
      label: (tn) => '${tn['name']}',
      trailing: (tn) => '${tn['house']?['property_name'] ?? ''}',
    );
    if (tn != null && mounted && await sheet<bool>(context, _PaymentForm(tn)) == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    final d = _data;
    return _Page(
      title: t('Rent payments', 'Malipo ya kodi'),
      sub: DateFormat('MMMM y', lang.value).format(DateTime.now()),
      button: Button(t('Record payment', 'Rekodi malipo'), icon: Icons.add_rounded, onTap: _record),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _Seg([t('Overview', 'Muhtasari'), t('History', 'Historia')], _tab, (i) => setState(() => _tab = i)),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _error != null
                ? _failed(_error!, _load)
                : d == null
                ? _bones()
                : _switch(_tab, _tab == 0 ? _overview(d) : _history(_rows(d['payments']))),
          ),
        ],
      ),
    );
  }

  Widget _row(_J p) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: _PaymentRow(p, onTap: () => _paymentSheet(context, p, _load)),
  );

  Widget _overview(_J d) {
    final collected = _n(d['collected']), expected = _n(d['expected']);
    final payments = _rows(d['payments']);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      children: [
        Glass(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(t('Collected this month', 'Imekusanywa mwezi huu'), style: body(12.5, color: C.muted, height: 1.3)),
              const SizedBox(height: 2),
              Text(tzs(collected), style: display(26, color: C.teal, weight: FontWeight.w800)),
              const SizedBox(height: 2),
              Text(
                expected > 0
                    ? t(
                        '${d['tenants_paid']} of ${d['tenants']} tenants paid · ${(collected / expected * 100).round()}% of ${tzs(expected)}',
                        'Wapangaji ${d['tenants_paid']} kati ya ${d['tenants']} wamelipa · ${(collected / expected * 100).round()}% ya ${tzs(expected)}',
                      )
                    : t('No active tenants.', 'Hakuna wapangaji waliopo.'),
                style: body(12.5, color: C.muted, height: 1.35),
              ),
              const SizedBox(height: 14),
              RentBars(_rows(d['months'])),
            ],
          ),
        ).reveal(0),
        const SizedBox(height: 18),
        Text(t('Recent payments', 'Malipo ya karibuni'), style: display(15, weight: FontWeight.w800)),
        const SizedBox(height: 8),
        if (payments.isEmpty) _none(t('No payment recorded in the last six months.', 'Hakuna malipo yaliyorekodiwa miezi sita iliyopita.')),
        for (final (i, p) in payments.take(5).indexed) _row(p).reveal(i + 1),
      ],
    );
  }

  Widget _history(List<_J> payments) => payments.isEmpty
      ? Notice(
          icon: Icons.receipt_long_outlined,
          title: t('No payments yet', 'Bado hakuna malipo'),
          text: t('Payments you record in the last six months show here.', 'Malipo unayorekodi ndani ya miezi sita yanaonekana hapa.'),
        )
      : ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 20), children: [for (final p in payments) _row(p)]);
}

/// Screen 18: what needs fixing across the landlord's properties, by state.
class MaintenanceScreen extends StatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  State<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen> {
  List<_J>? _all;
  String? _error;
  String? _is; // null = every state

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final rows = _rows(await Api.get('maintenance'));
      if (mounted) {
        setState(() {
          _all = rows;
          _error = null;
        });
      }
    } on ApiError catch (e) {
      if (mounted && _all == null) setState(() => _error = e.message);
    }
  }

  Future<void> _new() async {
    final homes = await _myHomes(context);
    if (homes == null || !mounted) return;
    if (await sheet<bool>(context, _RequestForm(homes: homes)) == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    final all = _all;
    final shown = [
      for (final m in all ?? const <_J>[])
        if (_is == null || m['status'] == _is) m,
    ];
    final open = all?.where((m) => m['status'] != 'resolved').length ?? 0;
    return _Page(
      title: t('Maintenance', 'Matengenezo'),
      sub: all == null ? ' ' : t('$open to fix', '$open ya kutengeneza'),
      button: Button(t('New request', 'Ombi jipya'), icon: Icons.add_rounded, onTap: _new),
      child: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(20, 0, 12, 10),
              children: [
                for (final (state, name) in [(null, t('All', 'Yote')), for (final s in ['open', 'in_progress', 'resolved']) (s, _repair(s).$1)])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Press(
                      onTap: () => setState(() => _is = state),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        alignment: Alignment.center,
                        padding: const EdgeInsets.symmetric(horizontal: 15),
                        decoration: BoxDecoration(
                          color: _is == state ? C.mkoko : C.card.withValues(alpha: .7),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: _is == state ? C.mkoko : C.line),
                        ),
                        child: Text(name, style: body(12.5, weight: FontWeight.w600, height: 1.2, color: _is == state ? Colors.white : C.wino)),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: _error != null
                ? _failed(_error!, _load)
                : all == null
                ? _bones()
                : shown.isEmpty
                ? Notice(
                    icon: Icons.build_outlined,
                    title: all.isEmpty ? t('Nothing to fix', 'Hakuna cha kutengeneza') : t('None in this state', 'Hakuna katika hali hii'),
                    text: all.isEmpty
                        ? t('When a tenant reports a problem, record it here and follow it until it is fixed.', 'Mpangaji akiripoti tatizo, lirekodi hapa na ulifuatilie hadi litengenezwe.')
                        : t('Choose All to see every request.', 'Chagua Yote kuona maombi yote.'),
                  )
                : RefreshIndicator(
                    color: C.teal,
                    onRefresh: _load,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(20, 2, 20, 20),
                      itemCount: shown.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => _RequestRow(shown[i], onTap: () => _requestSheet(context, shown[i], _load)).reveal(i.clamp(0, 6)),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

/// What a property's own Tenants (1), Payments (2) and Maintenance (3) tabs show: the same records, for that home only.
class HouseRecords extends StatelessWidget {
  const HouseRecords(this.home, this.tab, {super.key});
  final House home;
  final int tab;

  @override
  Widget build(BuildContext context) => Loader<dynamic>(
    load: () => Api.get(const ['tenants', 'rent-payments', 'maintenance'][tab - 1], {'house': home.id}),
    bones: const Column(children: [Bone(height: 60, radius: 18), SizedBox(height: 8), Bone(height: 60, radius: 18)]),
    builder: (context, data, reload) {
      Future<void> form(Widget form) async {
        if (await sheet<bool>(context, form) == true) reload();
      }

      Widget each(Widget row) => Padding(padding: const EdgeInsets.only(bottom: 8), child: row);
      Widget add(String text, Widget f) => Button(text, tone: Tone.plain, icon: Icons.add_rounded, onTap: () => form(f));
      if (tab == 2) {
        final payments = _rows(data['payments']);
        return Column(
          children: [
            if (payments.isEmpty) _none(t('No rent recorded for this property in the last six months.', 'Hakuna kodi iliyorekodiwa kwa nyumba hii miezi sita iliyopita.')),
            for (final p in payments) each(_PaymentRow(p, onTap: () => _paymentSheet(context, p, reload))),
          ],
        );
      }
      final rows = _rows(data);
      return Column(
        children: tab == 1
            ? [
                if (rows.isEmpty) each(_none(t('No tenant recorded for this property.', 'Hakuna mpangaji aliyerekodiwa kwa nyumba hii.'))),
                for (final tn in rows)
                  each(
                    _TenantRow(
                      tn,
                      onTap: () async {
                        await push(context, _TenantScreen(tn));
                        reload();
                      },
                    ),
                  ),
                add(t('Add tenant', 'Ongeza mpangaji'), _TenantForm([home])),
              ]
            : [
                if (rows.isEmpty) each(_none(t('Nothing to fix has been recorded here.', 'Hakuna tatizo lililorekodiwa hapa.'))),
                for (final m in rows) each(_RequestRow(m, onTap: () => _requestSheet(context, m, reload))),
                add(t('New request', 'Ombi jipya'), _RequestForm(homes: [home])),
              ],
      );
    },
  );
}
