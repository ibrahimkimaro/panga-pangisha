import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// What the person chose under Account > Appearance. One choice for the whole app,
/// whichever workspace they are in: tenant, landlord or investor.
class Look {
  const Look({
    this.mode = ThemeMode.light,
    this.accent = 0xFF1D4ED8, // Panga navy blue
    this.lightTone = 'paper',
    this.darkTone = 'slate',
    this.size = 'small',
  });

  final ThemeMode mode;

  /// The accent as 0xAARRGGBB: buttons, links, active states, tints.
  final int accent;

  /// Background tone: 'paper' or 'warm' in light, 'slate', 'olbongo', 'espresso' or 'midnight' in dark.
  final String lightTone, darkTone;

  /// How large everything is drawn: 'small', 'medium' or 'large'.
  final String size;

  Look copyWith({ThemeMode? mode, int? accent, String? lightTone, String? darkTone, String? size}) => Look(
    mode: mode ?? this.mode,
    accent: accent ?? this.accent,
    lightTone: lightTone ?? this.lightTone,
    darkTone: darkTone ?? this.darkTone,
    size: size ?? this.size,
  );

  Map<String, dynamic> toJson() => {'mode': mode.name, 'accent': accent, 'lightTone': lightTone, 'darkTone': darkTone, 'size': size};

  factory Look.fromJson(Map<String, dynamic> j) => Look(
    mode: ThemeMode.values.firstWhere((m) => m.name == j['mode'], orElse: () => ThemeMode.light),
    accent: j['accent'] is int ? j['accent'] : 0xFF1D4ED8,
    lightTone: lightTones.containsKey(j['lightTone']) ? j['lightTone'] : 'paper',
    darkTone: darkTones.containsKey(j['darkTone']) ? j['darkTone'] : 'slate',
    size: sizes.containsKey(j['size']) ? j['size'] : 'small',
  );
}

/// Accent colours offered as swatches. Each is dark enough for white text on it and for text on a light page.
const accents = <(String, int)>[
  ('Panga navy', 0xFF1D4ED8),
  ('Teal', 0xFF0D9488),
  ('Emerald', 0xFF0A7854),
  ('Sky', 0xFF0A73A3),
  ('Ocean', 0xFF0F3D5E),
  ('Forest', 0xFF1F4D36),
  ('Brass', 0xFF836919),
  ('Clay', 0xFF8A3B25),
  ('Berry', 0xFFA8384A),
  ('Plum', 0xFF4B2A5A),
  ('Cocoa', 0xFF4A3426),
];

/// tone -> (name, page, card, line, fill)
const lightTones = <String, (String, int, int, int, int)>{
  'paper': ('Paper', 0xFFF5F7F9, 0xFFFFFFFF, 0xFFE2E8F0, 0xFFF1F5F9),
  'warm': ('Warm paper', 0xFFF7F4EE, 0xFFFFFDF9, 0xFFE4DED1, 0xFFEFEADF),
};
const darkTones = <String, (String, int, int, int, int)>{
  'slate': ('Slate', 0xFF121316, 0xFF191B20, 0xFF292A30, 0xFF21242B),
  'olbongo': ('Forest night', 0xFF0A0F0D, 0xFF111814, 0xFF1C2720, 0xFF17211B),
  'espresso': ('Espresso', 0xFF161311, 0xFF1F1A17, 0xFF2F2723, 0xFF28211D),
  'midnight': ('Midnight', 0xFF0C1017, 0xFF131822, 0xFF212938, 0xFF1A2130),
};

/// size -> how much the whole interface is scaled.
const sizes = <String, double>{'small': .9, 'medium': 1, 'large': 1.08};

/// Every colour the interface uses, worked out from a [Look]. Screens never hold colours of their
/// own; they ask `C` (in ui.dart), which reads the current palette.
class Palette {
  Palette(Look look, Brightness system)
    : dark = look.mode == ThemeMode.dark || (look.mode == ThemeMode.system && system == Brightness.dark) {
    final tone = dark ? darkTones[look.darkTone]! : lightTones[look.lightTone]!;
    chokaa = Color(tone.$2);
    card = Color(tone.$3);
    line = Color(tone.$4);
    fill = Color(tone.$5);

    // A picked colour that is too pale could not carry white text: bring its lightness down to a readable band.
    final picked = HSLColor.fromColor(Color(look.accent));
    final a = picked.withLightness(picked.lightness.clamp(.16, .38));
    Color over(Color c, double alpha) => Color.alphaBlend(c.withValues(alpha: alpha), card);
    // HSL lightness is not how bright a colour looks (yellow at 35% is still bright), so the button
    // colour is darkened step by step until white text on it passes the 4.5:1 contrast rule.
    Color button(HSLColor c) {
      while (1.05 / (c.toColor().computeLuminance() + .05) < 4.6 && c.lightness > .05) {
        c = c.withLightness(c.lightness - .02);
      }
      return c.toColor();
    }

    if (dark) {
      mkoko = button(a.withLightness(a.lightness.clamp(.30, .38)));
      deep = a.withLightness(.20).toColor();
      teal = a.withLightness(.64).withSaturation((a.saturation * .9).clamp(0, 1)).toColor();
      tealBright = a.withLightness(.70).toColor();
      tealLight = over(a.toColor(), .30);
      leaf = over(a.toColor(), .16);
      navy = Color.alphaBlend(Colors.white.withValues(alpha: .06), card); // a raised dark surface
      wino = const Color(0xFFF0F0F3);
      muted = const Color(0xFF9AA0A6);
      faint = const Color(0xFF6E737A);
      shaba = const Color(0xFFE0B93F);
      brassInk = const Color(0xFFE8C766);
      sand = over(shaba, .20);
      hibiscus = const Color(0xFFFF6B7F);
      blush = over(hibiscus, .20);
      good = const Color(0xFF4ADE80);
      goodTint = over(good, .16);
    } else {
      mkoko = button(a.withLightness((a.lightness * .62).clamp(.12, .30)));
      deep = a.withLightness((a.lightness * .42).clamp(.08, .20)).toColor();
      teal = a.toColor();
      tealBright = a.withLightness(.52).toColor();
      tealLight = a.withLightness(.90).withSaturation((a.saturation * .9).clamp(0, 1)).toColor();
      leaf = a.withLightness(.93).withSaturation((a.saturation * .4).clamp(0, 1)).toColor();
      navy = const Color(0xFF0B1B2B);
      wino = const Color(0xFF0F1B2A);
      muted = const Color(0xFF5C6B77);
      faint = const Color(0xFF94A3B8);
      shaba = const Color(0xFFF2B01E);
      brassInk = const Color(0xFF7A5200);
      sand = const Color(0xFFFFF3D1);
      hibiscus = const Color(0xFFD8405A);
      blush = const Color(0xFFFCE8EC);
      good = const Color(0xFF0B7A45);
      goodTint = const Color(0xFFDCF5E6);
    }
  }

  final bool dark;
  late final Color chokaa, card, line, fill; // page, raised surface, hairline, quiet fill
  late final Color mkoko, deep, teal, tealBright, tealLight, leaf; // the accent family
  late final Color navy; // the dark surface: hero cards, the dark button
  late final Color wino, muted, faint; // text: main, secondary, hint
  late final Color shaba, brassInk, sand, hibiscus, blush; // attention and error
  late final Color good, goodTint; // "active", "done": a fixed green, whatever the accent
}

class Appearance with WidgetsBindingObserver {
  Appearance._();
  static final _watcher = Appearance._();

  /// The current choice. Listen to it to rebuild; change it with [set].
  static final look = ValueNotifier<Look>(const Look());
  static Palette palette = Palette(const Look(), Brightness.light);

  static double get scale => sizes[look.value.size] ?? 1;

  static Brightness get _system => WidgetsBinding.instance.platformDispatcher.platformBrightness;

  /// Reads the saved choice. Call once before the first frame.
  static Future<void> load() async {
    final raw = (await SharedPreferences.getInstance()).getString('look');
    if (raw != null) {
      try {
        look.value = Look.fromJson(Map<String, dynamic>.from(jsonDecode(raw)));
      } catch (_) {
        // A saved choice from an older version that no longer parses: keep the default.
      }
    }
    palette = Palette(look.value, _system);
    WidgetsBinding.instance.addObserver(_watcher); // follow the phone when the choice is "System"
  }

  /// Applies a new choice at once, everywhere, and remembers it.
  static void set(Look next) {
    palette = Palette(next, _system);
    look.value = next;
    SharedPreferences.getInstance().then((p) => p.setString('look', jsonEncode(next.toJson())));
    _repaint();
  }

  /// Colours are read while widgets build, so every widget on screen is asked to build again.
  static void _repaint() {
    void visit(Element e) {
      e.markNeedsBuild();
      e.visitChildren(visit);
    }

    WidgetsBinding.instance.rootElement?.visitChildren(visit);
  }

  @override
  void didChangePlatformBrightness() {
    if (look.value.mode != ThemeMode.system) return;
    palette = Palette(look.value, _system);
    look.value = look.value.copyWith(); // a new object, so listeners (the app's theme) rebuild
    _repaint();
  }
}
