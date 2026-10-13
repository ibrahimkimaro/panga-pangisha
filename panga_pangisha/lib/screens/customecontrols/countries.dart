/// Countries a person can register from, with the dial code the phone field starts with.
/// Tanzania and its neighbours first, then the rest in alphabetical order. To add one: a new line here.
class Country {
  const Country(this.code, this.name, this.dial);

  /// ISO 3166 two-letter code, as stored on the server.
  final String code;
  final String name;

  /// Without the plus: "255".
  final String dial;

  /// The flag emoji, built from the two letters.
  String get flag => String.fromCharCodes(code.codeUnits.map((c) => 0x1F1E6 + c - 65));
}

const countries = [
  Country('TZ', 'Tanzania', '255'),
  Country('KE', 'Kenya', '254'),
  Country('UG', 'Uganda', '256'),
  Country('RW', 'Rwanda', '250'),
  Country('BI', 'Burundi', '257'),
  Country('CD', 'DR Congo', '243'),
  Country('ZM', 'Zambia', '260'),
  Country('MW', 'Malawi', '265'),
  Country('MZ', 'Mozambique', '258'),
  Country('AO', 'Angola', '244'),
  Country('AU', 'Australia', '61'),
  Country('BW', 'Botswana', '267'),
  Country('BR', 'Brazil', '55'),
  Country('CM', 'Cameroon', '237'),
  Country('CA', 'Canada', '1'),
  Country('CN', 'China', '86'),
  Country('KM', 'Comoros', '269'),
  Country('CI', "Côte d'Ivoire", '225'),
  Country('EG', 'Egypt', '20'),
  Country('ET', 'Ethiopia', '251'),
  Country('FR', 'France', '33'),
  Country('DE', 'Germany', '49'),
  Country('GH', 'Ghana', '233'),
  Country('IN', 'India', '91'),
  Country('IT', 'Italy', '39'),
  Country('JP', 'Japan', '81'),
  Country('KW', 'Kuwait', '965'),
  Country('MG', 'Madagascar', '261'),
  Country('MY', 'Malaysia', '60'),
  Country('MU', 'Mauritius', '230'),
  Country('MA', 'Morocco', '212'),
  Country('NA', 'Namibia', '264'),
  Country('NL', 'Netherlands', '31'),
  Country('NG', 'Nigeria', '234'),
  Country('NO', 'Norway', '47'),
  Country('OM', 'Oman', '968'),
  Country('PK', 'Pakistan', '92'),
  Country('QA', 'Qatar', '974'),
  Country('SA', 'Saudi Arabia', '966'),
  Country('SN', 'Senegal', '221'),
  Country('SC', 'Seychelles', '248'),
  Country('SO', 'Somalia', '252'),
  Country('ZA', 'South Africa', '27'),
  Country('KR', 'South Korea', '82'),
  Country('SS', 'South Sudan', '211'),
  Country('ES', 'Spain', '34'),
  Country('SD', 'Sudan', '249'),
  Country('SE', 'Sweden', '46'),
  Country('CH', 'Switzerland', '41'),
  Country('TR', 'Türkiye', '90'),
  Country('AE', 'United Arab Emirates', '971'),
  Country('GB', 'United Kingdom', '44'),
  Country('US', 'United States', '1'),
  Country('ZW', 'Zimbabwe', '263'),
];

/// What the server stores: "+255 0712 345 678", "0712345678" and "712 345 678" all become "+255712345678".
String fullPhone(Country c, String typed) {
  var digits = typed.replaceAll(RegExp(r'\D'), '');
  if (typed.trim().startsWith('+')) {
    if (!digits.startsWith(c.dial)) return '+$digits'; // they typed another country's code: keep it
    digits = digits.substring(c.dial.length);
  }
  return '+${c.dial}${digits.replaceFirst(RegExp(r'^0+'), '')}';
}
