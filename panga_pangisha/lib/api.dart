import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'l10n.dart';

class ApiError implements Exception {
  ApiError(this.message, [this.status = 0]);
  final String message;
  final int status;
  @override
  String toString() => message;
}

/// One place for the server address, the session and every HTTP call.
class Api {
  /// 10.0.2.2 is the host machine as seen from the Android emulator.
  /// On a real phone: flutter run --dart-define=API_HOST=http://192.168.x.x:8100
  static const host = String.fromEnvironment(
    'API_HOST',
    defaultValue: 'http://10.0.2.2:8100',
  );

  static late SharedPreferences _prefs;
  static String? _token;

  /// The signed-in user (id, fullname, phone_number, email, role, profile_image), or null.
  static final user = ValueNotifier<Map<String, dynamic>?>(null);

  static bool get isOwner => user.value?['role'] == 'landlord';
  static int get myId => user.value?['id'] ?? 0;

  /// A landlord's dashboard stays shut until an admin approves their NIDA details.
  static bool get needsIdentity =>
      isOwner && user.value?['identity_status'] != 'approved';

  static bool get seenOnboarding => _prefs.getBool('onboarded') ?? false;
  static void finishOnboarding() => _prefs.setBool('onboarded', true);

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    lang.value = _prefs.getString('lang') ?? 'en';
    _token = _prefs.getString('token');
    final u = _prefs.getString('user');
    if (_token != null && u != null) user.value = jsonDecode(u);
  }

  static void setUser(Map<String, dynamic> u) {
    _prefs.setString('user', jsonEncode(u));
    user.value = u;
  }

  /// Stores the session returned by register / sign in / password reset.
  static void _signedIn(Map body) {
    final tokens = body['tokens'] ?? body;
    _token = tokens['access'];
    _prefs.setString('token', _token!);
    setUser(Map<String, dynamic>.from(body['user']));
  }

  static Future<void> signOut() async {
    if (_token != null) post('user/logout/').ignore();
    _token = null;
    await _prefs.remove('token');
    await _prefs.remove('user');
    saved.value = {};
    user.value = null;
  }

  static String? img(String? path) =>
      path == null || path.isEmpty ? null : '$host$path';

  static Future<dynamic> get(String path, [Map<String, dynamic>? query]) =>
      _send('GET', path, query: query);
  static Future<dynamic> post(String path, [Map<String, dynamic>? body]) =>
      _send('POST', path, body: body);
  static Future<dynamic> patch(String path, [Map<String, dynamic>? body]) =>
      _send('PATCH', path, body: body);
  static Future<dynamic> delete(String path) => _send('DELETE', path);

  static Future<void> signIn(String identifier, String password) async =>
      _signedIn(
        await post('user/api/token/', {
          'phone_number': identifier,
          'password': password,
        }),
      );

  static Future<void> register(Map<String, dynamic> fields) async =>
      _signedIn(await post('user/register/', fields));

  static Future<void> resetPassword(
    String identifier,
    String code,
    String password,
  ) async => _signedIn(
    await post('user/password/reset/', {
      'identifier': identifier,
      'code': code,
      'password': password,
    }),
  );

  /// Multipart POST: [files] maps a field name to file paths (`images[]` for several).
  static Future<dynamic> upload(
    String path,
    Map<String, String> fields,
    Map<String, List<String>> files,
  ) async {
    final req = http.MultipartRequest('POST', Uri.parse('$host/api/$path'))
      ..fields.addAll(fields)
      ..headers.addAll(_headers(json: false));
    for (final e in files.entries) {
      for (final p in e.value) {
        req.files.add(await http.MultipartFile.fromPath(e.key, p));
      }
    }
    return _guard(() async {
      final res = await http.Response.fromStream(
        await req.send().timeout(const Duration(seconds: 90)),
      );
      return _read(res);
    });
  }

  static Map<String, String> _headers({bool json = true}) => {
    'Accept': 'application/json',
    if (json) 'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  static Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Map<String, dynamic>? body,
  }) {
    final uri = Uri.parse(
      '$host/api/$path',
    ).replace(queryParameters: query?.map((k, v) => MapEntry(k, '$v')));
    return _guard(() async {
      final req = http.Request(method, uri)..headers.addAll(_headers());
      if (body != null) req.body = jsonEncode(body);
      final res = await http.Response.fromStream(
        await req.send().timeout(const Duration(seconds: 20)),
      );
      return _read(res);
    });
  }

  static Future<dynamic> _guard(Future<dynamic> Function() run) async {
    try {
      return await run();
    } on SocketException {
      throw ApiError(_offline);
    } on TimeoutException {
      throw ApiError(_offline);
    } on http.ClientException {
      throw ApiError(_offline);
    }
  }

  static String get _offline => t(
    'No connection. Check your internet and try again.',
    'Hakuna mtandao. Angalia intaneti yako kisha ujaribu tena.',
  );

  static dynamic _read(http.Response res) {
    dynamic data;
    try {
      data = res.body.isEmpty ? null : jsonDecode(res.body);
    } on FormatException {
      data = null;
    }
    if (res.statusCode < 300) return data;
    if (res.statusCode == 401 && _token != null) signOut(); // session ended
    throw ApiError(_message(data, res.statusCode), res.statusCode);
  }

  /// Laravel sends {message, errors:{field:[..]}}; our own endpoints send {detail}.
  static String _message(dynamic data, int status) {
    if (status == 429) {
      return t(
        'Too many tries. Wait a few minutes and try again.',
        'Umejaribu mara nyingi. Subiri dakika chache kisha ujaribu tena.',
      );
    }
    if (data is Map) {
      final errors = data['errors'];
      if (errors is Map && errors.isNotEmpty) {
        final first = errors.values.first;
        return '${first is List ? first.first : first}';
      }
      if (data['detail'] != null) return '${data['detail']}';
      if (data['message'] != null && status < 500) return '${data['message']}';
    }
    return t(
      'Something went wrong on our side. Try again.',
      'Kuna hitilafu upande wetu. Jaribu tena.',
    );
  }
}

/// Ids of the homes this user saved; every heart in the app listens to it.
final saved = ValueNotifier<Set<int>>({});

Future<void> toggleSaved(int houseId) async {
  final was = saved.value.contains(houseId);
  void set(bool on) => saved.value = on
      ? {...saved.value, houseId}
      : ({...saved.value}..remove(houseId));
  set(!was); // answer the tap now, fix it up if the server disagrees
  try {
    final res = await Api.post('houses/$houseId/favorite');
    set(res['is_favorite'] == true);
  } on ApiError {
    set(was);
  }
}

DateTime? _date(dynamic v) => v == null ? null : DateTime.tryParse('$v');
double? _num(dynamic v) => v == null ? null : double.tryParse('$v');

class HouseUnit {
  HouseUnit(Map<String, dynamic> j)
    : id = j['id'],
      unitNumber = j['unit_number'] ?? '',
      unitType = j['unit_type'],
      rent = _num(j['monthly_rent']) ?? 0,
      paymentTerms = j['payment_terms'],
      bedrooms = j['bedrooms'] ?? 1,
      bathrooms = j['bathrooms'] ?? 1,
      image = Api.img(j['image_url'] ?? j['image_path']),
      description = j['description'] ?? '',
      status = j['status'] ?? 'available';

  final int id;
  final String unitNumber;
  final String? unitType;
  final double rent;
  final String? paymentTerms;
  final int bedrooms, bathrooms;
  final String? image;
  final String description;
  final String status;
}

class House {
  House(Map<String, dynamic> j)
    : id = j['id'],
      name = j['property_name'] ?? '',
      type = j['property_type'] ?? '',
      description = j['description'] ?? '',
      region = j['region'] ?? '',
      district = j['district'] ?? '',
      ward = j['ward'] ?? '',
      street = j['street'] ?? '',
      napaNumber = j['napa_number'],
      bedrooms = j['bedrooms'] ?? 0,
      bathrooms = j['bathrooms'] ?? 0,
      rent = _num(j['monthly_rent']) ?? 0,
      deposit = _num(j['security_deposit']),
      terms = j['lease_duration'],
      amenities = List<String>.from(j['amenities'] ?? const []),
      photos = [
        j['house_profile_image'],
        ...(j['image_urls'] ?? const []),
      ].map((p) => Api.img(p)).whereType<String>().toList(),
      units = [
        for (final u in j['units'] ?? const [])
          HouseUnit(Map<String, dynamic>.from(u)),
      ],
      lat = _num(j['latitude']),
      lng = _num(j['longitude']),
      status = j['status'] ?? 'available',
      isMine = j['is_mine'] == true,
      byOwner = j['advertiser_role'] != 'representative',
      verifiedAt = _date(j['verified_at']),
      confirmedAt = _date(j['availability_confirmed_at']),
      ownerId = j['owner']?['id'] ?? j['owner_id'],
      ownerName = j['owner']?['fullname'] ?? '',
      ownerPhoto = Api.img(j['owner']?['profile_image']),
      ownerSince = _date(j['owner']?['member_since']) {
    if (j['is_favorite'] == true && !saved.value.contains(id)) {
      saved.value = {...saved.value, id};
    }
  }

  final int id;
  final String name, type, description, region, district, ward, street;
  final String? napaNumber;
  final int bedrooms, bathrooms;
  final double rent;
  final double? deposit;
  final String? terms;
  final List<String> amenities, photos;
  final List<HouseUnit> units;
  final double? lat, lng;
  String status;
  final bool isMine, byOwner;
  final DateTime? verifiedAt;
  DateTime? confirmedAt;
  final int ownerId;
  final String ownerName;
  final String? ownerPhoto;
  final DateTime? ownerSince;

  String get place => [ward, district].where((s) => s.isNotEmpty).join(', ');

  /// SRS: listings not re-confirmed for a while are flagged, not hidden.
  bool get stale =>
      confirmedAt == null ||
      DateTime.now().difference(confirmedAt!).inDays > 30;

  static List<House> list(dynamic json) => [
    for (final j in json as List) House(Map<String, dynamic>.from(j)),
  ];
}
