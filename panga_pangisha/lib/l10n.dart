import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 'en' or 'sw'.
final lang = ValueNotifier<String>('en');

/// Copy lives next to the widget that shows it: `t('Sign in', 'Ingia')`.
String t(String en, String sw) => lang.value == 'sw' ? sw : en;

Future<void> setLang(String code) async {
  if (lang.value == code) return;
  lang.value = code;
  (await SharedPreferences.getInstance()).setString('lang', code);
  // ponytail: every string is read in build(), so a full rebuild is the whole i18n system.
  // Move to gen-l10n/ARB files when translators need to work without touching Dart.
  void visit(Element e) {
    e.markNeedsBuild();
    e.visitChildren(visit);
  }

  WidgetsBinding.instance.rootElement?.visitChildren(visit);
}

final _grouped = NumberFormat('#,##0', 'en');

/// TSh 850,000
String tzs(num v) => 'TSh ${_grouped.format(v)}';

/// 850K, 1.4M: short enough for a map pin.
String tzsShort(num v) {
  if (v >= 1000000) {
    final m = v / 1000000;
    return '${m.toStringAsFixed(m == m.roundToDouble() ? 0 : 1)}M';
  }
  return '${(v / 1000).round()}K';
}

/// 30 Sep 2026
String day(DateTime d) => DateFormat('d MMM y', lang.value).format(d.toLocal());

/// Sat 17 Oct, 14:00
String dayTime(DateTime d) =>
    DateFormat('EEE d MMM, HH:mm', lang.value).format(d.toLocal());

/// today / 3 days ago
String ago(DateTime d) {
  final n = DateTime.now().difference(d).inDays;
  if (n <= 0) return t('today', 'leo');
  if (n == 1) return t('yesterday', 'jana');
  return t('$n days ago', 'siku $n zilizopita');
}
