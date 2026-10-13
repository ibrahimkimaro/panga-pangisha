import 'package:latlong2/latlong.dart';

/// Rental arrangement / mode (Screen 1)
enum RentalMode {
  entire('entire', 'Entire property as one rental', 'Nyumba nzima kwa pamoja'),
  multiUnit('multi_unit', 'Multiple independent units', 'Nyumba zenye kumbi au fleti tofauti'),
  rooms('rooms', 'Individual rooms within a shared property', 'Vyumba binafsi ndani ya nyumba moja');

  const RentalMode(this.code, this.en, this.sw);
  final String code, en, sw;

  static RentalMode fromCode(String? c) => switch (c) {
    'multi_unit' => RentalMode.multiUnit,
    'rooms' => RentalMode.rooms,
    _ => RentalMode.entire,
  };
}

/// Supported property types (Screen 1)
enum WizardPropertyType {
  standaloneHouse('House', 'Standalone house', 'Nyumba inayojitegemea'),
  sharedHouse('Shared House', 'House rented by individual rooms', 'Nyumba ya vyumba vya kupanga'),
  apartment('Apartment', 'Apartment or flat', 'Fleti / Apartimenti'),
  multiApartment('Multi-Apartment Building', 'Multi-apartment building', 'Jengo la apartimenti nyingi'),
  hostel('Hostel', 'Hostel or shared accommodation', 'Hosteli au bweni'),
  commercial('Commercial', 'Commercial property', 'Jengo la kibiashara'),
  other('Other', 'Other supported property type', 'Aina nyingine ya jengo');

  const WizardPropertyType(this.name, this.en, this.sw);
  final String name, en, sw;

  static WizardPropertyType fromName(String? n) => switch (n) {
    'Shared House' => WizardPropertyType.sharedHouse,
    'Apartment' => WizardPropertyType.apartment,
    'Multi-Apartment Building' => WizardPropertyType.multiApartment,
    'Hostel' => WizardPropertyType.hostel,
    'Commercial' => WizardPropertyType.commercial,
    'Other' => WizardPropertyType.other,
    _ => WizardPropertyType.standaloneHouse,
  };
}

/// Reusable unit template for genuinely similar units (Screen 5)
class UnitTemplate {
  UnitTemplate({
    required this.id,
    required this.name,
    this.unitType = 'Standard Room',
    this.quantity = 1,
    this.bedrooms = 1,
    this.bathrooms = 1,
    this.isPrivateBathroom = true,
    this.furnishing = 'unfurnished', // unfurnished, semi, full
    this.kitchen = 'shared', // private, shared, none
    this.defaultRent = 50000,
    this.deposit = 50000,
    this.paymentTerms = '4 months advance',
    this.description = '',
    this.photoPath,
  });

  final String id;
  String name;
  String unitType;
  int quantity;
  int bedrooms;
  int bathrooms;
  bool isPrivateBathroom;
  String furnishing;
  String kitchen;
  double defaultRent;
  double deposit;
  String paymentTerms;
  String description;
  String? photoPath;

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'unitType': unitType,
    'quantity': quantity,
    'bedrooms': bedrooms,
    'bathrooms': bathrooms,
    'isPrivateBathroom': isPrivateBathroom,
    'furnishing': furnishing,
    'kitchen': kitchen,
    'defaultRent': defaultRent,
    'deposit': deposit,
    'paymentTerms': paymentTerms,
    'description': description,
    'photoPath': photoPath,
  };

  factory UnitTemplate.fromJson(Map<String, dynamic> j) => UnitTemplate(
    id: j['id'] ?? 'tmpl_${DateTime.now().millisecondsSinceEpoch}',
    name: j['name'] ?? 'Room Template',
    unitType: j['unitType'] ?? 'Standard Room',
    quantity: j['quantity'] ?? 1,
    bedrooms: j['bedrooms'] ?? 1,
    bathrooms: j['bathrooms'] ?? 1,
    isPrivateBathroom: j['isPrivateBathroom'] ?? true,
    furnishing: j['furnishing'] ?? 'unfurnished',
    kitchen: j['kitchen'] ?? 'shared',
    defaultRent: (j['defaultRent'] as num?)?.toDouble() ?? 50000,
    deposit: (j['deposit'] as num?)?.toDouble() ?? 50000,
    paymentTerms: j['paymentTerms'] ?? '4 months advance',
    description: j['description'] ?? '',
    photoPath: j['photoPath'],
  );
}

/// An individually identifiable rentable space (Screens 6 & 7)
class WizardUnit {
  WizardUnit({
    required this.id,
    this.templateId,
    required this.unitNumber,
    this.unitType = 'Standard Room',
    this.floor = 'Ground Floor',
    this.bedrooms = 1,
    this.bathrooms = 1,
    required this.monthlyRent,
    this.deposit,
    this.paymentTerms = '4 months advance',
    this.description = '',
    this.imagePath,
    this.status = 'available',
    this.isCustomized = false,
  });

  final String id;
  final String? templateId;
  String unitNumber;
  String unitType;
  String floor;
  int bedrooms;
  int bathrooms;
  double monthlyRent;
  double? deposit;
  String paymentTerms;
  String description;
  String? imagePath;
  String status;
  bool isCustomized;

  Map<String, dynamic> toJson() => {
    'id': id,
    'templateId': templateId,
    'unitNumber': unitNumber,
    'unitType': unitType,
    'floor': floor,
    'bedrooms': bedrooms,
    'bathrooms': bathrooms,
    'monthlyRent': monthlyRent,
    'deposit': deposit,
    'paymentTerms': paymentTerms,
    'description': description,
    'imagePath': imagePath,
    'status': status,
    'isCustomized': isCustomized,
  };

  factory WizardUnit.fromJson(Map<String, dynamic> j) => WizardUnit(
    id: j['id'] ?? 'unit_${DateTime.now().millisecondsSinceEpoch}',
    templateId: j['templateId'],
    unitNumber: j['unitNumber'] ?? 'Unit 1',
    unitType: j['unitType'] ?? 'Standard Room',
    floor: j['floor'] ?? 'Ground Floor',
    bedrooms: j['bedrooms'] ?? 1,
    bathrooms: j['bathrooms'] ?? 1,
    monthlyRent: (j['monthlyRent'] as num?)?.toDouble() ?? 50000,
    deposit: (j['deposit'] as num?)?.toDouble(),
    paymentTerms: j['paymentTerms'] ?? '4 months advance',
    description: j['description'] ?? '',
    imagePath: j['imagePath'],
    status: j['status'] ?? 'available',
    isCustomized: j['isCustomized'] ?? false,
  );
}

/// Comprehensive Property Draft Model supporting autosave, resumption, and API submission
class PropertyDraft {
  PropertyDraft();

  // Screen 1: Property Type & Mode
  WizardPropertyType propertyType = WizardPropertyType.standaloneHouse;
  RentalMode rentalMode = RentalMode.entire;

  // Screen 2: Details & Tanzania Address
  String propertyName = '';
  String propertyCategory = 'Residential';
  String description = '';
  String country = 'Tanzania';
  String region = 'Dar es Salaam';
  String district = 'Kinondoni';
  String ward = '';
  String street = '';
  String houseNumber = '';
  String napaNumber = ''; // NAPA National Address Postal Code
  int floorsCount = 1;
  Set<String> sharedAmenities = {'Water', 'LUKU', 'Security', 'Fence'};
  String advertiserRole = 'owner'; // 'owner' or 'representative'

  // Screen 3: Interactive Map
  LatLng? locationPin;
  String mapAddressConfirmed = '';

  // Screen 4 & 5: Structure & Templates
  List<UnitTemplate> templates = [];

  // Screen 6 & 7: Individual Units
  List<WizardUnit> units = [];

  // Screen 8: Photos & Verification Documents
  String? coverPhotoPath;
  List<String> galleryPhotoPaths = [];
  List<String> verificationDocPaths = []; // Private legal/ownership documents

  // Screen 9: Listing & Rental Settings
  bool isPubliclyListed = true;
  double overallRent = 250000;
  double? securityDeposit = 250000;
  String leaseDuration = '4 months advance';
  String viewingPreference = 'By Appointment';
  DateTime availableFrom = DateTime.now();

  Map<String, dynamic> toJson() => {
    'propertyType': propertyType.name,
    'rentalMode': rentalMode.code,
    'propertyName': propertyName,
    'propertyCategory': propertyCategory,
    'description': description,
    'country': country,
    'region': region,
    'district': district,
    'ward': ward,
    'street': street,
    'houseNumber': houseNumber,
    'napaNumber': napaNumber,
    'floorsCount': floorsCount,
    'sharedAmenities': sharedAmenities.toList(),
    'advertiserRole': advertiserRole,
    'lat': locationPin?.latitude,
    'lng': locationPin?.longitude,
    'mapAddressConfirmed': mapAddressConfirmed,
    'templates': templates.map((t) => t.toJson()).toList(),
    'units': units.map((u) => u.toJson()).toList(),
    'coverPhotoPath': coverPhotoPath,
    'galleryPhotoPaths': galleryPhotoPaths,
    'verificationDocPaths': verificationDocPaths,
    'isPubliclyListed': isPubliclyListed,
    'overallRent': overallRent,
    'securityDeposit': securityDeposit,
    'leaseDuration': leaseDuration,
    'viewingPreference': viewingPreference,
    'availableFrom': availableFrom.toIso8601String(),
  };

  factory PropertyDraft.fromJson(Map<String, dynamic> j) {
    final d = PropertyDraft();
    d.propertyType = WizardPropertyType.fromName(j['propertyType']);
    d.rentalMode = RentalMode.fromCode(j['rentalMode']);
    d.propertyName = j['propertyName'] ?? '';
    d.propertyCategory = j['propertyCategory'] ?? 'Residential';
    d.description = j['description'] ?? '';
    d.country = j['country'] ?? 'Tanzania';
    d.region = j['region'] ?? 'Dar es Salaam';
    d.district = j['district'] ?? 'Kinondoni';
    d.ward = j['ward'] ?? '';
    d.street = j['street'] ?? '';
    d.houseNumber = j['houseNumber'] ?? '';
    d.napaNumber = j['napaNumber'] ?? '';
    d.floorsCount = j['floorsCount'] ?? 1;
    d.sharedAmenities = Set<String>.from(j['sharedAmenities'] ?? ['Water', 'LUKU']);
    d.advertiserRole = j['advertiserRole'] ?? 'owner';
    if (j['lat'] != null && j['lng'] != null) {
      d.locationPin = LatLng((j['lat'] as num).toDouble(), (j['lng'] as num).toDouble());
    }
    d.mapAddressConfirmed = j['mapAddressConfirmed'] ?? '';
    d.templates = [for (final t in j['templates'] ?? []) UnitTemplate.fromJson(Map<String, dynamic>.from(t))];
    d.units = [for (final u in j['units'] ?? []) WizardUnit.fromJson(Map<String, dynamic>.from(u))];
    d.coverPhotoPath = j['coverPhotoPath'];
    d.galleryPhotoPaths = List<String>.from(j['galleryPhotoPaths'] ?? []);
    d.verificationDocPaths = List<String>.from(j['verificationDocPaths'] ?? []);
    d.isPubliclyListed = j['isPubliclyListed'] ?? true;
    d.overallRent = (j['overallRent'] as num?)?.toDouble() ?? 250000;
    d.securityDeposit = (j['securityDeposit'] as num?)?.toDouble();
    d.leaseDuration = j['leaseDuration'] ?? '4 months advance';
    d.viewingPreference = j['viewingPreference'] ?? 'By Appointment';
    if (j['availableFrom'] != null) {
      d.availableFrom = DateTime.tryParse(j['availableFrom']) ?? DateTime.now();
    }
    return d;
  }

  /// Reconcile & generate units from templates
  void generateUnitsFromTemplates() {
    if (rentalMode == RentalMode.entire) {
      if (units.isEmpty) {
        units = [
          WizardUnit(
            id: 'unit_entire_1',
            unitNumber: propertyName.isEmpty ? 'Main House' : propertyName,
            unitType: propertyType.name,
            monthlyRent: overallRent,
            deposit: securityDeposit,
            paymentTerms: leaseDuration,
            description: description,
          ),
        ];
      }
      return;
    }

    final newUnits = <WizardUnit>[];
    for (final tmpl in templates) {
      for (int i = 1; i <= tmpl.quantity; i++) {
        final existing = units.where((u) => u.templateId == tmpl.id && u.unitNumber.endsWith('$i')).firstOrNull;
        if (existing != null && existing.isCustomized) {
          newUnits.add(existing);
        } else {
          newUnits.add(
            WizardUnit(
              id: 'unit_${tmpl.id}_$i',
              templateId: tmpl.id,
              unitNumber: tmpl.quantity == 1 ? tmpl.name : '${tmpl.name} $i',
              unitType: tmpl.unitType,
              bedrooms: tmpl.bedrooms,
              bathrooms: tmpl.bathrooms,
              monthlyRent: tmpl.defaultRent,
              deposit: tmpl.deposit,
              paymentTerms: tmpl.paymentTerms,
              description: tmpl.description,
              imagePath: tmpl.photoPath,
            ),
          );
        }
      }
    }
    units = newUnits;
  }

  /// Validation checklist
  List<String> validate() {
    final errors = <String>[];
    if (propertyName.trim().isEmpty) errors.add('Property display name is required.');
    if (region.trim().isEmpty || district.trim().isEmpty) errors.add('Region and district are required.');
    if (locationPin == null) errors.add('Interactive map location pin must be selected.');
    if (coverPhotoPath == null || coverPhotoPath!.isEmpty) errors.add('A cover photo is required.');
    if (rentalMode != RentalMode.entire && units.isEmpty) {
      errors.add('At least one rentable unit or room must be defined.');
    }
    return errors;
  }
}
