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
  );
}

bool get reduceMotion => WidgetsBinding
    .instance
    .platformDispatcher
    .accessibilityFeatures
    .disableAnimations;

extension Reveal on Widget {
  /// The page-load moment: content rises into place in reading order. Used once per screen.
  Widget reveal([int order = 0]) => reduceMotion
      ? this
      : animate(delay: (60 * order).ms)
            .fadeIn(duration: 380.ms, curve: Curves.easeOut)
            .moveY(
              begin: 18,
              end: 0,
              duration: 460.ms,
              curve: Curves.easeOutCubic,
            );
}

void toast(BuildContext context, String message) =>
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));

Future<T?> push<T>(BuildContext context, Widget page) =>
    Navigator.of(context).push<T>(MaterialPageRoute(builder: (_) => page));

Future<T?> sheet<T>(BuildContext context, Widget child) =>
    showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          20 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: SingleChildScrollView(child: child),
      ),
    );

/// Anything tappable: sinks a little under the finger, so the tap is felt before the result shows.
class Press extends StatefulWidget {
  const Press({
    super.key,
    required this.child,
    required this.onTap,
    this.label,
  });
  final Widget child;
  final VoidCallback? onTap;
  final String? label;

  @override
  State<Press> createState() => _PressState();
}

class _PressState extends State<Press> {
  bool _down = false;
  void _set(bool v) => setState(() => _down = v);

  @override
  Widget build(BuildContext context) {
    final on = widget.onTap != null;
    return Semantics(
      button: true,
      enabled: on,
      label: widget.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: on ? (_) => _set(true) : null,
        onTapCancel: on ? () => _set(false) : null,
        onTapUp: on ? (_) => _set(false) : null,
        onTap: on
            ? () {
                HapticFeedback.selectionClick();
                widget.onTap!();
              }
            : null,
        child: AnimatedScale(
          scale: _down ? 0.96 : 1,
          duration: const Duration(milliseconds: 110),
          curve: Curves.easeOut,
          child: widget.child,
        ),
      ),
    );
  }
}

enum Tone { green, brass, plain, white, navy, teal }

class Button extends StatelessWidget {
  const Button(
    this.text, {
    super.key,
    required this.onTap,
    this.tone = Tone.green,
    this.busy = false,
    this.icon,
    this.expand = true,
  });
  final String text;
  final VoidCallback? onTap;
  final Tone tone;
  final bool busy;
  final IconData? icon;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = switch (tone) {
      Tone.green => (C.mkoko, Colors.white, C.mkoko),
      Tone.brass => (C.shaba, const Color(0xFF10211E), C.shaba), // dark text on brass in both themes
      Tone.white => (Colors.white, C.mkoko, Colors.white),
      Tone.plain => (Colors.transparent, C.teal, C.line),
      Tone.navy => (C.navy, Colors.white, C.navy),
      Tone.teal => (C.dark ? C.mkoko : C.teal, Colors.white, C.dark ? C.mkoko : C.teal), // white text needs the deeper accent in dark
    };
    final off = onTap == null && !busy;
    return Press(
      onTap: busy ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 56,
        width: expand ? double.infinity : null,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: off ? C.line : bg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: off ? C.line : border, width: 1.4),
        ),
        alignment: Alignment.center,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: busy
              ? SizedBox(
                  key: const ValueKey('busy'),
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2.4, color: fg),
                )
              : Row(
                  key: ValueKey(text),
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (icon != null) ...[
                      Icon(icon, size: 20, color: off ? C.muted : fg),
                      const SizedBox(width: 8),
                    ],
                    Flexible(
                      child: Text(
                        text,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: body(
                          16,
                          color: off ? C.muted : fg,
                          weight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

/// Labelled text field. The label sits above so it stays visible while typing.
class Field extends StatefulWidget {
  const Field(
    this.label, {
    super.key,
    this.controller,
    this.hint,
    this.help,
    this.icon,
    this.secret = false,
    this.keyboard,
    this.validator,
    this.action = TextInputAction.next,
    this.lines = 1,
    this.autofill,
    this.onSubmit,
    this.onChanged,
    this.formatters,
  });
  final String label;
  final TextEditingController? controller;
  final String? hint, help;
  final IconData? icon;
  final bool secret;
  final TextInputType? keyboard;
  final String? Function(String)? validator;
  final TextInputAction action;
  final int lines;
  final Iterable<String>? autofill;
  final VoidCallback? onSubmit;
  final ValueChanged<String>? onChanged;
  final List<TextInputFormatter>? formatters;

  @override
  State<Field> createState() => _FieldState();
}

class _FieldState extends State<Field> {
  late bool _hidden = widget.secret;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.only(left: 2, bottom: 7),
        child: Text(widget.label, style: body(14, weight: FontWeight.w600)),
      ),
      TextFormField(
        controller: widget.controller,
        obscureText: _hidden,
        keyboardType: widget.keyboard,
        textInputAction: widget.action,
        maxLines: widget.lines,
        autofillHints: widget.autofill,
        inputFormatters: widget.formatters,
        onFieldSubmitted: (_) => widget.onSubmit?.call(),
        onChanged: widget.onChanged,
        validator: (v) => widget.validator?.call((v ?? '').trim()),
        autovalidateMode: AutovalidateMode.onUserInteraction,
        style: body(16),
        cursorColor: C.teal,
        decoration: InputDecoration(
          hintText: widget.hint,
          helperText: widget.help,
          helperStyle: body(13, color: C.muted),
          helperMaxLines: 2,
          prefixIcon: widget.icon == null
              ? null
              : Icon(widget.icon, size: 20, color: C.muted),
          suffixIcon: widget.secret
              ? IconButton(
                  tooltip: _hidden
                      ? t('Show password', 'Onyesha nenosiri')
                      : t('Hide password', 'Ficha nenosiri'),
                  icon: Icon(
                    _hidden
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                    size: 20,
                    color: C.muted,
                  ),
                  onPressed: () => setState(() => _hidden = !_hidden),
                )
              : null,
        ),
      ),
    ],
  );
}

/// The border of a kanga cloth (its "pindo"): the app's one recurring ornament.
class KangaBand extends StatelessWidget {
  const KangaBand({
    super.key,
    this.height = 22,
    this.color,
    this.ground,
  });
  final double height;
  final Color? color, ground; // brass on the deep accent unless given

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(painter: _KangaPainter(color ?? C.shaba, ground ?? C.deep)),
    ),
  );
}

class _KangaPainter extends CustomPainter {
  _KangaPainter(this.color, this.ground);
  final Color color, ground;

  @override
  void paint(Canvas canvas, Size s) {
    canvas.drawRect(Offset.zero & s, Paint()..color = ground);
    final fill = Paint()..color = color;
    final h = s.height, unit = h; // one diamond + dot per unit
    final count = (s.width / unit).ceil() + 1;
    final shift = (s.width - count * unit) / 2;
    for (var i = 0; i < count; i++) {
      final x = shift + i * unit;
      canvas.drawPath(
        Path()
          ..moveTo(x + unit * .5, h * .18)
          ..lineTo(x + unit * .82, h * .5)
          ..lineTo(x + unit * .5, h * .82)
          ..lineTo(x + unit * .18, h * .5)
          ..close(),
        fill,
      );
      canvas.drawCircle(Offset(x, h * .5), h * .07, fill);
    }
    final rule = Paint()
      ..color = color
      ..strokeWidth = math.max(1, h * .05);
    canvas.drawLine(Offset(0, h * .04), Offset(s.width, h * .04), rule);
    canvas.drawLine(Offset(0, h * .96), Offset(s.width, h * .96), rule);
  }

  @override
  bool shouldRepaint(_KangaPainter old) =>
      old.color != color || old.ground != ground;
}

/// Network photo that fades in and never shows a broken-image icon.
class Photo extends StatelessWidget {
  const Photo(this.url, {super.key, this.fit = BoxFit.cover, this.width});
  final String? url;
  final BoxFit fit;

  /// Decode width in logical pixels; keeps memory low on small phones.
  final double? width;

  @override
  Widget build(BuildContext context) {
    final blank = ColoredBox(
      color: C.leaf,
      child: Center(
        child: Icon(Icons.home_work_outlined, color: C.teal, size: 30),
      ),
    );
    if (url == null) return blank;
    final w = width ?? MediaQuery.sizeOf(context).width;
    return Image.network(
      url!,
      fit: fit,
      cacheWidth: (w * MediaQuery.devicePixelRatioOf(context)).round().clamp(
        1,
        1400,
      ),
      errorBuilder: (_, _, _) => blank,
      frameBuilder: (_, child, frame, sync) => sync
          ? child
          : Stack(
              fit: StackFit.passthrough,
              children: [
                Positioned.fill(child: ColoredBox(color: C.leaf)),
                AnimatedOpacity(
                  opacity: frame == null ? 0 : 1,
                  duration: const Duration(milliseconds: 300),
                  child: child,
                ),
              ],
            ),
    );
  }
}

class Avatar extends StatelessWidget {
  const Avatar(this.name, {super.key, this.photo, this.size = 44});
  final String name;
  final String? photo;
  final double size;

  @override
  Widget build(BuildContext context) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    final initials = parts.take(2).map((p) => p[0].toUpperCase()).join();
    return ClipOval(
      child: SizedBox.square(
        dimension: size,
        child: photo != null
            ? Photo(photo, width: size)
            : ColoredBox(
                color: C.leaf,
                child: Center(
                  child: Text(
                    initials,
                    style: display(size * .36, color: C.teal),
                  ),
                ),
              ),
      ),
    );
  }
}

/// Small fact with an icon: used for trust labels and listing facts.
class Tag extends StatelessWidget {
  const Tag(
    this.text, {
    super.key,
    this.icon,
    Color? bg,
    Color? fg,
  }) : _bg = bg,
       _fg = fg;
  final String text;
  final IconData? icon;
  final Color? _bg, _fg;
  Color get bg => _bg ?? C.leaf; // the pale accent tint unless given
  Color get fg => _fg ?? C.teal;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(30),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 14, color: fg),
          const SizedBox(width: 5),
        ],
        Flexible(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: body(12.5, color: fg, weight: FontWeight.w600, height: 1.2),
          ),
        ),
      ],
    ),
  );
}

/// Selectable pill for filters and choices.
class Choice extends StatelessWidget {
  const Choice(
    this.text, {
    super.key,
    required this.on,
    required this.onTap,
    this.icon,
  });
  final String text;
  final bool on;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Press(
    onTap: onTap,
    child: Semantics(
      selected: on,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
        decoration: BoxDecoration(
          color: on ? C.mkoko : C.card,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: on ? C.teal : C.line),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 17, color: on ? C.shaba : C.muted),
              const SizedBox(width: 7),
            ],
            Text(
              text,
              style: body(
                14,
                height: 1.2,
                color: on ? Colors.white : C.wino,
                weight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Round white button that floats over photos and maps.
class RoundIcon extends StatelessWidget {
  const RoundIcon(
    this.icon, {
    super.key,
    required this.onTap,
    required this.label,
    this.color,
  });
  final IconData icon;
  final VoidCallback onTap;
  final String label;
  final Color? color; // main text colour unless given

  @override
  Widget build(BuildContext context) => Press(
    onTap: onTap,
    label: label,
    child: Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: C.card,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: C.deep.withValues(alpha: .14),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Icon(icon, size: 21, color: color ?? C.wino),
    ),
  );
}

/// Placeholder block while content loads.
class Bone extends StatelessWidget {
  const Bone({super.key, this.height = 16, this.width, this.radius = 10});
  final double height;
  final double? width;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final box = Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: C.line,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
    return reduceMotion
        ? box
        : box
              .animate(onPlay: (c) => c.repeat())
              .shimmer(duration: 1300.ms, color: Colors.white70);
  }
}

/// Empty or failed screens say what happened and offer the next step.
class Notice extends StatelessWidget {
  const Notice({
    super.key,
    required this.icon,
    required this.title,
    required this.text,
    this.action,
    this.onAction,
  });
  final IconData icon;
  final String title, text;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 76,
            height: 76,
            decoration: BoxDecoration(
              color: C.leaf,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: C.teal, size: 32),
          ),
          const SizedBox(height: 18),
          Text(title, textAlign: TextAlign.center, style: display(21)),
          const SizedBox(height: 8),
          Text(
            text,
            textAlign: TextAlign.center,
            style: body(15, color: C.muted),
          ),
          if (action != null) ...[
            const SizedBox(height: 20),
            Button(action!, onTap: onAction, expand: false),
          ],
        ],
      ),
    ),
  );
}

/// Loads something once, shows bones while waiting and a retry when it fails.
class Loader<T> extends StatefulWidget {
  const Loader({
    super.key,
    required this.load,
    required this.builder,
    required this.bones,
  });
  final Future<T> Function() load;
  final Widget Function(BuildContext, T data, Future<void> Function() reload)
  builder;
  final Widget bones;

  @override
  State<Loader<T>> createState() => LoaderState<T>();
}

class LoaderState<T> extends State<Loader<T>> {
  T? _data;
  Object? _error;

  @override
  void initState() {
    super.initState();
    reload();
  }

  Future<void> reload() async {
    if (_error != null) setState(() => _error = null);
    try {
      final d = await widget.load();
      if (mounted) setState(() => _data = d);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_data != null) return widget.builder(context, _data as T, reload);
    if (_error != null) {
      return Notice(
        icon: Icons.cloud_off_outlined,
        title: t('This did not load', 'Imeshindwa kufunguka'),
        text: '$_error',
        action: t('Try again', 'Jaribu tena'),
        onAction: reload,
      );
    }
    return widget.bones;
  }
}

/// Bilingual English / Swahili toggle switch
class LangSwitch extends StatelessWidget {
  const LangSwitch({super.key, this.dark = false});
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: lang,
      builder: (context, current, _) {
        final isEn = current == 'en';
        return GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            setLang(isEn ? 'sw' : 'en');
          },
          behavior: HitTestBehavior.opaque,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: dark
                  ? Colors.white.withValues(alpha: .15)
                  : C.fill,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: dark ? Colors.white24 : C.line,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'EN',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isEn ? FontWeight.w800 : FontWeight.w500,
                    color: dark
                        ? (isEn ? Colors.white : Colors.white60)
                        : (isEn ? C.wino : C.muted),
                  ),
                ),
                Text(
                  ' / ',
                  style: TextStyle(
                    fontSize: 12,
                    color: dark ? Colors.white38 : C.muted,
                  ),
                ),
                Text(
                  'SW',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: !isEn ? FontWeight.w800 : FontWeight.w500,
                    color: dark
                        ? (!isEn ? Colors.white : Colors.white60)
                        : (!isEn ? C.wino : C.muted),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// A translucent card with a light edge. With [blur] it frosts what is behind it: worth it over a map,
/// photos or scrolling messages, wasted (and costly on slow phones) over the plain page.
class Glass extends StatelessWidget {
  const Glass({
    super.key,
    required this.child,
    this.radius = 22,
    this.padding = const EdgeInsets.all(16),
    this.tint,
    this.opacity = .55,
    this.blur = false,
  });

  final Widget child;
  final double radius;
  final EdgeInsetsGeometry padding;

  /// The colour of the sheet; the card colour of the current theme unless given.
  final Color? tint;
  final double opacity;
  final bool blur;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(radius),
    child: BackdropFilter(
      enabled: blur,
      filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: (tint ?? C.card).withValues(alpha: opacity),
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(color: Colors.white.withValues(alpha: C.dark ? .09 : .55)),
        ),
        child: child,
      ),
    ),
  );
}

/// The page behind glass cards: the plain page background of the theme, nothing coloured.
class GlassBackdrop extends StatelessWidget {
  const GlassBackdrop({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => ColoredBox(color: C.chokaa, child: child);
}

/// Lists stop at their ends: no stretch and no glow when you pull past the top or bottom.
class AppScroll extends MaterialScrollBehavior {
  const AppScroll();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) => const ClampingScrollPhysics();

  @override
  Widget buildOverscrollIndicator(BuildContext context, Widget child, ScrollableDetails details) => child;
}

/// MaterialApp.builder for the person's size choice: the interface is laid out on a larger (or smaller)
/// canvas and fitted to the screen, so text, cards and spacing all change together.
Widget fitToSize(BuildContext context, Widget? child) {
  if (child == null) return const SizedBox.shrink();
  final k = Appearance.scale;
  if (k == 1) return child;
  final mq = MediaQuery.of(context);
  if (mq.size.isEmpty) return child;
  final size = mq.size / k;
  return FittedBox(
    fit: BoxFit.contain,
    child: SizedBox(
      width: size.width,
      height: size.height,
      child: MediaQuery(
        data: mq.copyWith(size: size, padding: mq.padding / k, viewPadding: mq.viewPadding / k, viewInsets: mq.viewInsets / k),
        child: child,
      ),
    ),
  );
}
