import '../../api.dart';

/// Representation of a Landlord Compound / Site (e.g. Goba Compound, Sinza Compound)
class CompoundModel {
  CompoundModel({
    required this.id,
    required this.name,
    this.compoundType = 'residential',
    required this.region,
    required this.district,
    this.ward = '',
    this.street = '',
    this.houseNumber = '',
    this.napaNumber = '',
    this.latitude,
    this.longitude,
    this.description = '',
    this.amenities = const [],
    this.coverImage,
    this.status = 'active',
    this.houses = const [],
  });

  final int id;
  final String name;
  final String compoundType;
  final String region;
  final String district;
  final String ward;
  final String street;
  final String houseNumber;
  final String napaNumber;
  final double? latitude;
  final double? longitude;
  final String description;
  final List<String> amenities;
  final String? coverImage;
  final String status;
  final List<House> houses;

  int get totalHouses => houses.length;

  int get totalUnits {
    var count = 0;
    for (final h in houses) {
      count += h.units.isNotEmpty ? h.units.length : 1;
    }
    return count;
  }

  int get occupiedUnits {
    var count = 0;
    for (final h in houses) {
      if (h.units.isNotEmpty) {
        count += h.units.where((u) => u.status == 'occupied' || u.status == 'rented').length;
      } else if (h.status == 'rented' || h.status == 'occupied') {
        count += 1;
      }
    }
    return count;
  }

  int get occupancyRate {
    if (totalUnits == 0) return 0;
    return ((occupiedUnits / totalUnits) * 100).round();
  }

  double get totalMonthlyRent {
    var total = 0.0;
    for (final h in houses) {
      total += h.rent;
    }
    return total;
  }

  String get fullAddress {
    final parts = [street, ward, district, region].where((s) => s.isNotEmpty).toList();
    return parts.join(', ');
  }

  factory CompoundModel.fromJson(Map<String, dynamic> j) {
    final housesRaw = j['houses'] is List ? (j['houses'] as List) : const [];
    final housesList = <House>[];
    for (final h in housesRaw) {
      if (h is Map<String, dynamic>) {
        try {
          housesList.add(House(h));
        } catch (_) {}
      }
    }

    final amenitiesRaw = j['amenities'];
    final amenitiesList = <String>[];
    if (amenitiesRaw is List) {
      for (final a in amenitiesRaw) {
        if (a != null) amenitiesList.add(a.toString());
      }
    }

    return CompoundModel(
      id: j['id'] is int ? j['id'] as int : int.tryParse('${j['id']}') ?? 0,
      name: j['name'] ?? '',
      compoundType: j['compound_type'] ?? 'residential',
      region: j['region'] ?? 'Dar es Salaam',
      district: j['district'] ?? 'Kinondoni',
      ward: j['ward'] ?? '',
      street: j['street'] ?? '',
      houseNumber: j['house_number'] ?? '',
      napaNumber: j['napa_number'] ?? '',
      latitude: j['latitude'] != null ? double.tryParse('${j['latitude']}') : null,
      longitude: j['longitude'] != null ? double.tryParse('${j['longitude']}') : null,
      description: j['description'] ?? '',
      amenities: amenitiesList,
      coverImage: j['cover_image'] ?? (j['cover_photo'] ?? (housesList.firstOrNull?.photos.firstOrNull)),
      status: j['status'] ?? 'active',
      houses: housesList,
    );
  }

  static List<CompoundModel> list(dynamic raw) {
    if (raw is! List) return [];
    return [for (final item in raw) if (item is Map<String, dynamic>) CompoundModel.fromJson(item)];
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'compound_type': compoundType,
    'region': region,
    'district': district,
    'ward': ward,
    'street': street,
    'house_number': houseNumber,
    'napa_number': napaNumber,
    'latitude': latitude,
    'longitude': longitude,
    'description': description,
    'amenities': amenities,
    'cover_image': coverImage,
    'status': status,
  };
}
