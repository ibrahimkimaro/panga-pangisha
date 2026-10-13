import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:panga_pangisha/api.dart';
import 'package:panga_pangisha/appearance.dart';
import 'package:panga_pangisha/l10n.dart';
import 'package:panga_pangisha/screens/customecontrols/RegionsDistrict.dart';
import 'package:panga_pangisha/screens/customecontrols/countries.dart';
import 'package:panga_pangisha/screens/owner/identity_verification.dart';
import 'package:panga_pangisha/screens/owner/landlord_dashboard.dart';

void main() {
  test('money reads the way Tanzanians write it', () {
    expect(tzs(850000), 'TSh 850,000');
    expect(tzsShort(180000), '180K');
    expect(tzsShort(1400000), '1.4M');
    expect(tzsShort(3000000), '3M');
  });

  test('a listing parses the server JSON and flags stale availability', () {
    final fresh = DateTime.now().subtract(const Duration(days: 2));
    final old = DateTime.now().subtract(const Duration(days: 45));
    Map<String, dynamic> json(DateTime confirmed) => {
      'id': 7,
      'property_name': 'Flat',
      'monthly_rent': '850000.00',
      'ward': 'Mikocheni',
      'district': 'Kinondoni',
      'house_profile_image': '/storage/houses/a.jpg',
      'image_urls': ['/storage/houses/b.jpg'],
      'advertiser_role': 'representative',
      'availability_confirmed_at': confirmed.toIso8601String(),
      'is_favorite': true,
      'owner': {'id': 3, 'fullname': 'Juma'},
    };
    final h = House(json(fresh));
    expect(h.rent, 850000);
    expect(h.place, 'Mikocheni, Kinondoni');
    expect(h.photos, [
      '${Api.host}/storage/houses/a.jpg',
      '${Api.host}/storage/houses/b.jpg',
    ]);
    expect(h.byOwner, isFalse);
    expect(h.stale, isFalse);
    expect(saved.value, contains(7));
    expect(House(json(old)).stale, isTrue);
  });

  test('a NIDA number is grouped as printed on the card and stops at 20 digits', () {
    String typed(String raw) =>
        NidaFormatter().formatEditUpdate(TextEditingValue.empty, TextEditingValue(text: raw)).text;
    expect(typed('1985'), '1985');
    expect(typed('198507121'), '19850712-1');
    expect(typed('19850712141250000123'), '19850712-14125-00001-23');
    expect(typed('19850712-14125-00001-23999'), '19850712-14125-00001-23');
    expect(typed('abc'), '');
  });

  test('a phone number is sent with its country code however it was typed', () {
    final tz = countries.first;
    final ke = countries.firstWhere((c) => c.code == 'KE');
    expect(tz.dial, '255');
    expect(tz.flag, '🇹🇿');
    expect(fullPhone(tz, '+255 712 345 678'), '+255712345678');
    expect(fullPhone(tz, '+255 0712 345 678'), '+255712345678');
    expect(fullPhone(tz, '0712345678'), '+255712345678');
    expect(fullPhone(ke, '712 345 678'), '+254712345678');
    expect(fullPhone(tz, '+254 712 345 678'), '+254712345678'); // another country's code is kept
    expect(countries.map((c) => c.code).toSet().length, countries.length); // no country listed twice
  });

  test('the dashboard greets by the hour on the clock', () {
    expect([for (final h in [5, 11, 12, 16, 17, 20, 21, 23, 0, 4]) greeting(h)], [
      'Good morning', 'Good morning', 'Good afternoon', 'Good afternoon', 'Good evening', 'Good evening',
      'Good night', 'Good night', 'Good night', 'Good night',
    ]);
  });

  test('every region has districts, and the demo listings use names from the list', () {
    expect(regionDistrictMap.values.every((d) => d.isNotEmpty), isTrue);
    final dar = regionDistrictMap.keys.firstWhere((r) => r.startsWith('Dar es'));
    expect(regionDistrictMap[dar], containsAll(['Kinondoni', 'Ilala', 'Ubungo', 'Kigamboni']));
  });

  test('an appearance choice survives saving, and its colours stay readable', () {
    const look = Look(mode: ThemeMode.dark, accent: 0xFFA8384A, darkTone: 'midnight', size: 'large');
    final back = Look.fromJson(look.toJson());
    expect([back.mode, back.accent, back.darkTone, back.size], [ThemeMode.dark, 0xFFA8384A, 'midnight', 'large']);
    expect(Look.fromJson({'mode': 'nonsense', 'darkTone': 'gone', 'size': 9}).size, 'small'); // bad data falls back

    // White text has to be readable on the button colour, whatever was picked: even pale yellow.
    double contrastWithWhite(Color c) => 1.05 / (c.computeLuminance() + .05);
    for (final mode in [ThemeMode.light, ThemeMode.dark]) {
      for (final accent in [0xFFFFFF66, 0xFF0D9488, 0xFF000000, ...accents.map((a) => a.$2)]) {
        final p = Palette(Look(mode: mode, accent: accent), Brightness.light);
        expect(contrastWithWhite(p.mkoko), greaterThan(4.5), reason: 'button colour for ${accent.toRadixString(16)} in $mode');
      }
    }

    final light = Palette(const Look(), Brightness.light), dark = Palette(const Look(mode: ThemeMode.dark), Brightness.light);
    expect(light.wino.computeLuminance() < .1 && light.card.computeLuminance() > .9, isTrue); // dark ink on a light card
    expect(dark.wino.computeLuminance() > .8 && dark.card.computeLuminance() < .05, isTrue); // and the reverse
    expect(Palette(const Look(mode: ThemeMode.system), Brightness.dark).dark, isTrue); // "System" follows the phone
  });
}
