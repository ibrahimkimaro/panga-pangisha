# Theme (Flutter app `panga_pangisha`)

Framework: Flutter (Dart), Material 3 widgets with a custom look. No CSS, no Tailwind: colours are run-time tokens read through `C.*`
(`lib/ui.dart`) from `Palette` (`lib/appearance.dart`). The person can change theme, accent and size; the values below are the defaults.

## Part 1: token summary

Fonts: **Bricolage Grotesque** (display: titles, figures; weights 700-800, letter-spacing -0.2px) and **Figtree** (body: 400/600/700).
Type scale (logical px): screen title 22/800, pushed-screen title 19/800, section title 15.5/800, hero figure 30/800, tile figure 22/800,
row title 14-14.5/600, body 13-13.5, secondary 12-12.5, caption 11-11.5, badge 11.5/700, tab label 9.5.
The whole interface is drawn at 0.9 scale by default ("small"), so it is compact.

Light (default)
| token | value |
|---|---|
| `page` | `#F5F7F9` |
| `card` | `#FFFFFF` |
| `line` | `#E2E8F0` |
| `fill` | `#F1F5F9` |
| `accent` | `#173EAB` |
| `accentButton` | `#0E266A` |
| `accentBright` | `#2758E2` |
| `accentTint` | `#D4DDF7` |
| `accentPale` | `#E8EBF3` |
| `navy` | `#0B1B2B` |
| `ink` | `#0F1B2A` |
| `muted` | `#5C6B77` |
| `faint` | `#94A3B8` |
| `brass` | `#F2B01E` |
| `brassInk` | `#7A5200` |
| `brassTint` | `#FFF3D1` |
| `error` | `#D8405A` |
| `errorTint` | `#FCE8EC` |
| `good` | `#0B7A45` |
| `goodTint` | `#DCF5E6` |
| `edge` | `#FFFFFF` |
| `shade` | `#94A3B8` |

Dark
| token | value |
|---|---|
| `page` | `#121316` |
| `card` | `#191B20` |
| `line` | `#292A30` |
| `fill` | `#21242B` |
| `accent` | `#6485E2` |
| `accentButton` | `#173EAB` |
| `accentBright` | `#7897ED` |
| `navy` | `#272930` |
| `ink` | `#F0F0F3` |
| `muted` | `#9AA0A6` |
| `faint` | `#6E737A` |
| `brass` | `#E0B93F` |
| `brassInk` | `#E8C766` |
| `error` | `#FF6B7F` |
| `good` | `#4ADE80` |
| `edge` | `rgba(255,255,255,.07)` |
| `shade` | `#000000` |

Radius: cards 18-24, hero 24-26, chips/badges 20, icon chips 11-12, buttons 18, fields 16, bottom nav 26, round icon buttons 44 circle.
Spacing: page gutter 20; card padding 12-18; gap between cards 10-12; section gap 22.
Clay card (`ClayCard`): fill `card`, 2px border `edge`, drop shadow `shade` at 28% offset (5,7) blur 16, highlight `edge` offset (-4,-4) blur 12 spread 1.
Page background: plain `page`. No gradients, no coloured blobs.
Primary button: height 56, radius 18, fill `accentButton`, white 16/600 text. Plain button: transparent, 1.4px `line` border, `accent` text.
Status badges: pill, 11.5/700; Active/Paid/Resolved = `good` on `goodTint`; In progress/Rent due = `brassInk` on `brassTint`; Open/error = `error` on `errorTint`; Ended = `muted` on `fill`.
Icons: Material Icons, outlined/rounded variants, 17-22px.
Phone canvas: 412 x 892 logical px (1080 x 2340 physical).

## Part 2: source

`lib/appearance.dart` (palette)
```dart
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
```

`lib/ui.dart` (tokens, text styles, theme)
```dart
import 'dart:ui' show ImageFilter;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'appearance.dart';
import 'l10n.dart';

/// The interface's colours. They are not fixed: each one is read from the person's current
/// appearance (light or dark, their accent, their background tone), so a widget that says `C.teal`
/// follows whatever they chose. The names are the original coastal ones: mangrove, brass, lime wash.
abstract final class C {
  static Palette get _p => Appearance.palette;

  /// True in dark mode.
  static bool get dark => _p.dark;

  static Color get mkoko => _p.mkoko; // the accent at button strength (white text sits on it)
  static Color get deep => _p.deep;
  static Color get navy => _p.navy; // the dark surface: hero cards, the dark button
  static Color get teal => _p.teal; // the accent for text, icons and active states
  static Color get tealBright => _p.tealBright; // the accent on a dark surface
  static Color get tealLight => _p.tealLight; // accent tint, for selected backgrounds
  static Color get shaba => _p.shaba; // brass: attention
  static Color get brassInk => _p.brassInk; // text and icons on a brass tint
  static Color get chokaa => _p.chokaa; // page background
  static Color get card => _p.card; // a raised surface: cards, sheets, fields
  static Color get fill => _p.fill; // a quiet fill: chips, icon backs, skeletons
  static Color get wino => _p.wino; // ink: main text
  static Color get ink => _p.wino;
  static Color get muted => _p.muted; // secondary text
  static Color get faint => _p.faint; // hints and disabled
  static Color get line => _p.line;
  static Color get leaf => _p.leaf; // a second, paler accent tint
  static Color get sand => _p.sand; // brass tint
  static Color get hibiscus => _p.hibiscus; // saved hearts, errors
  static Color get blush => _p.blush;
  static Color get good => _p.good; // active, done
  static Color get goodTint => _p.goodTint;
  /// The lit edge of a raised card and the highlight beside it: white by day, barely there in dark.
  static Color get edge => dark ? Colors.white.withValues(alpha: .07) : Colors.white;
  /// The drop shadow under a raised card: a soft grey by day, black in dark (a grey one would glow there).
  static Color get shade => dark ? Colors.black : faint;

  /// Status-bar icons that can be read on the page background.
  static SystemUiOverlayStyle get overlay => dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark;
}

/// Display face: titles and prices. Slightly narrow at large sizes so long Swahili words fit.
TextStyle display(
  double size, {
  Color? color, // main text colour unless given
  FontWeight weight = FontWeight.w700,
}) => TextStyle(
  fontFamily: 'Bricolage',
  fontSize: size,
  height: size >= 28 ? 1.08 : 1.2,
  letterSpacing: size >= 28 ? -0.6 : -0.2,
  color: color ?? C.wino,
  fontWeight: weight,
  fontVariations: [
    FontVariation('wght', weight.value.toDouble()),
    FontVariation('wdth', size >= 28 ? 88 : 96),
    FontVariation('opsz', size.clamp(12, 96).toDouble()),
  ],
);

/// Text face: everything you read or tap.
TextStyle body(
  double size, {
  Color? color, // main text colour unless given
  FontWeight weight = FontWeight.w400,
  double height = 1.45,
}) => TextStyle(
  fontFamily: 'Figtree',
  fontSize: size,
  height: height,
  color: color ?? C.wino,
  fontWeight: weight,
  fontVariations: [FontVariation('wght', weight.value.toDouble())],
);

ThemeData appTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: C.mkoko,
    brightness: C.dark ? Brightness.dark : Brightness.light,
    surface: C.card,
  ).copyWith(
    primary: C.teal,
    onPrimary: Colors.white,
    secondary: C.shaba,
    onSecondary: const Color(0xFF10211E),
    error: C.hibiscus,
    onSurface: C.wino,
    outline: C.line,
  );
  final field = OutlineInputBorder(
    borderRadius: BorderRadius.circular(16),
    borderSide: BorderSide(color: C.line),
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    fontFamily: 'Figtree',
    scaffoldBackgroundColor: C.chokaa,
    splashFactory: InkSparkle.splashFactory,
    textTheme: TextTheme(
      bodyMedium: body(15),
      bodyLarge: body(16),
      titleMedium: body(16, weight: FontWeight.w600),
      labelLarge: body(15, weight: FontWeight.w600),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: C.chokaa,
      surfaceTintColor: Colors.transparent,
      foregroundColor: C.wino,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: display(20),
      systemOverlayStyle: C.overlay,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: C.card,
      hintStyle: body(15, color: C.muted),
      errorStyle: body(13, color: C.hibiscus),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
      border: field,
      enabledBorder: field,
      focusedBorder: field.copyWith(
        borderSide: BorderSide(color: C.teal, width: 1.6),
      ),
      errorBorder: field.copyWith(
        borderSide: BorderSide(color: C.hibiscus),
      ),
      focusedErrorBorder: field.copyWith(
        borderSide: BorderSide(color: C.hibiscus, width: 1.6),
      ),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: C.card,
      surfaceTintColor: Colors.transparent,
      showDragHandle: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: C.dark ? C.fill : const Color(0xFF10211E),
      contentTextStyle: body(14, color: Colors.white),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    dividerTheme: DividerThemeData(color: C.line, thickness: 1, space: 1),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {TargetPlatform.android: FadeForwardsPageTransitionsBuilder()},
    ),
```
