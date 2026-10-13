import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../appearance.dart';
import '../l10n.dart';
import '../ui.dart';

/// Account > Appearance: theme, accent colour, background tone and size.
/// Whatever is chosen here applies to every screen and every workspace at once, and is remembered.
class AppearanceScreen extends StatelessWidget {
  const AppearanceScreen({super.key});

  void _set(Look next) {
    HapticFeedback.selectionClick();
    Appearance.set(next);
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Appearance.look,
    builder: (context, _) {
      final look = Appearance.look.value;
      final tones = C.dark ? darkTones : lightTones;
      final tone = C.dark ? look.darkTone : look.lightTone;
      final preset = accents.any((a) => a.$2 == look.accent);
      return Scaffold(
        appBar: AppBar(title: Text(t('Appearance', 'Mwonekano'))),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            _preview(),
            _heading(t('Theme', 'Mandhari')),
            Row(
              children: [
                for (final (mode, icon, label) in [
                  (ThemeMode.light, Icons.light_mode_outlined, t('Light', 'Mwanga')),
                  (ThemeMode.dark, Icons.dark_mode_outlined, t('Dark', 'Giza')),
                  (ThemeMode.system, Icons.phone_android_rounded, t('System', 'Mfumo')),
                ]) ...[
                  Expanded(child: _option(label, look.mode == mode, () => _set(look.copyWith(mode: mode)), icon: icon)),
                  if (mode != ThemeMode.system) const SizedBox(width: 10),
                ],
              ],
            ),
            _hint(t('System follows your phone, so the app goes dark when the phone does.', 'Mfumo hufuata simu yako: simu ikiwa giza, app nayo inakuwa giza.')),

            _heading(t('Accent colour', 'Rangi kuu')),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final (name, value) in accents)
                  _swatch(Color(value), name, look.accent == value, () => _set(look.copyWith(accent: value))),
              ],
            ),
            const SizedBox(height: 18),
            Text(t('Or your own colour', 'Au rangi yako mwenyewe'), style: body(14, weight: FontWeight.w600)),
            const SizedBox(height: 8),
            _HuePicker(
              hue: HSLColor.fromColor(Color(look.accent)).hue,
              active: !preset,
              onPick: (hue) => Appearance.set(look.copyWith(accent: HSLColor.fromAHSL(1, hue, .68, .34).toColor().toARGB32())),
            ),
            _hint(t('Buttons, links and highlights use this colour everywhere in the app.', 'Vitufe, viungo na vivutio hutumia rangi hii kila mahali kwenye app.')),

            _heading(t('Background', 'Mandharinyuma')),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (final e in tones.entries)
                  _toneChip(e.value.$1, Color(e.value.$2), Color(e.value.$3), tone == e.key,
                      () => _set(C.dark ? look.copyWith(darkTone: e.key) : look.copyWith(lightTone: e.key))),
              ],
            ),
            _hint(
              C.dark
                  ? t('Tones for dark mode. Switch to Light to choose its background.', 'Rangi za hali ya giza. Badili kwenda Mwanga kuchagua mandharinyuma yake.')
                  : t('Tones for light mode. Switch to Dark to choose its background.', 'Rangi za hali ya mwanga. Badili kwenda Giza kuchagua mandharinyuma yake.'),
            ),

            _heading(t('Size', 'Ukubwa')),
            Row(
              children: [
                for (final (key, label) in [
                  ('small', t('Small', 'Ndogo')),
                  ('medium', t('Medium', 'Wastani')),
                  ('large', t('Large', 'Kubwa')),
                ]) ...[
                  Expanded(child: _option(label, look.size == key, () => _set(look.copyWith(size: key)))),
                  if (key != 'large') const SizedBox(width: 10),
                ],
              ],
            ),
            _hint(t('Text, cards and spacing all change together.', 'Maandishi, kadi na nafasi hubadilika pamoja.')),

            const SizedBox(height: 24),
            Button(t('Back to the Panga look', 'Rudisha mwonekano wa Panga'), tone: Tone.plain, onTap: () => _set(const Look())),
          ],
        ),
      );
    },
  );

  Widget _heading(String text) => Padding(
    padding: const EdgeInsets.only(top: 26, bottom: 10),
    child: Text(text, style: display(16, weight: FontWeight.w800)),
  );

  Widget _hint(String text) => Padding(
    padding: const EdgeInsets.only(top: 8),
    child: Text(text, style: body(12.5, color: C.muted, height: 1.35)),
  );

  /// A small sample of the interface in the current look.
  Widget _preview() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(20), border: Border.all(color: C.line)),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(color: C.tealLight, borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.home_rounded, color: C.teal, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t('Two-bedroom flat, Mikocheni', 'Fleti ya vyumba viwili, Mikocheni'), style: display(15)),
                  Text(t('TSh 850,000 a month', 'TSh 850,000 kwa mwezi'), style: body(13, color: C.muted)),
                ],
              ),
            ),
            Tag(t('Verified', 'Imethibitishwa'), icon: Icons.verified_outlined),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(child: Button(t('Book a viewing', 'Omba kuiona'), onTap: () {})),
            const SizedBox(width: 10),
            Expanded(child: Button(t('Message', 'Ujumbe'), tone: Tone.plain, onTap: () {})),
          ],
        ),
      ],
    ),
  );

  Widget _option(String label, bool on, VoidCallback onTap, {IconData? icon}) => Press(
    onTap: onTap,
    child: Semantics(
      selected: on,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: on ? C.tealLight : C.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: on ? C.teal : C.line, width: on ? 1.6 : 1),
        ),
        child: Column(
          children: [
            if (icon != null) ...[Icon(icon, size: 20, color: on ? C.teal : C.muted), const SizedBox(height: 4)],
            Text(label, style: body(13.5, weight: on ? FontWeight.w700 : FontWeight.w500, color: on ? C.teal : C.wino)),
          ],
        ),
      ),
    ),
  );

  Widget _swatch(Color color, String name, bool on, VoidCallback onTap) => Press(
    onTap: onTap,
    label: name,
    child: Semantics(
      selected: on,
      child: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: on ? C.wino : Colors.transparent, width: 2.5),
        ),
        child: on ? const Icon(Icons.check_rounded, color: Colors.white, size: 22) : null,
      ),
    ),
  );

  Widget _toneChip(String name, Color page, Color card, bool on, VoidCallback onTap) => Press(
    onTap: onTap,
    child: Semantics(
      selected: on,
      child: Container(
        padding: const EdgeInsets.fromLTRB(8, 8, 14, 8),
        decoration: BoxDecoration(
          color: C.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: on ? C.teal : C.line, width: on ? 1.6 : 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // What the tone looks like: its page colour with a card on it.
            Container(
              width: 34,
              height: 26,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: page, borderRadius: BorderRadius.circular(8), border: Border.all(color: C.line)),
              child: Container(width: 18, height: 10, decoration: BoxDecoration(color: card, borderRadius: BorderRadius.circular(3))),
            ),
            const SizedBox(width: 10),
            Text(name, style: body(13.5, weight: on ? FontWeight.w700 : FontWeight.w500)),
          ],
        ),
      ),
    ),
  );
}

/// A rainbow strip to slide along; the colour under the thumb becomes the accent.
class _HuePicker extends StatelessWidget {
  const _HuePicker({required this.hue, required this.active, required this.onPick});
  final double hue;
  final bool active; // true when the current accent is a custom one, not a swatch
  final ValueChanged<double> onPick;

  @override
  Widget build(BuildContext context) => Stack(
    alignment: Alignment.center,
    children: [
      Container(
        height: 18,
        margin: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(9),
          gradient: LinearGradient(
            colors: [for (var h = 0; h <= 360; h += 30) HSLColor.fromAHSL(1, h.toDouble(), .68, .40).toColor()],
          ),
        ),
      ),
      SliderTheme(
        data: SliderThemeData(
          trackHeight: 18,
          activeTrackColor: Colors.transparent,
          inactiveTrackColor: Colors.transparent,
          overlayColor: Colors.transparent,
          thumbColor: active ? HSLColor.fromAHSL(1, hue, .68, .34).toColor() : C.card,
          thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 13, elevation: 3),
        ),
        child: Slider(
          value: hue.clamp(0, 360),
          max: 360,
          label: t('Your own colour', 'Rangi yako mwenyewe'),
          onChanged: onPick,
        ),
      ),
    ],
  );
}
