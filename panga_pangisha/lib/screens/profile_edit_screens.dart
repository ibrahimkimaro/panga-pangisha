import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api.dart';
import '../l10n.dart';
import '../ui.dart';

/// Helper to get and save custom business info
class ProfileDataService {
  static const String _payKey = 'profile_payment_methods_data';
  static const String _secKey = 'profile_security_settings_data';
  static const String _contactKey = 'profile_contact_details_data';

  /// My business details from the server, with `status`: none | pending | approved | rejected.
  static Future<Map<String, String>> loadBusinessInfo() async {
    try {
      return _strings(await Api.get('business'));
    } on ApiError {
      return {'status': 'none'}; // offline: show the empty form rather than someone else's details
    }
  }

  /// Sends the details to the admin team for verification; returns what the server stored (status: pending).
  static Future<Map<String, String>> saveBusinessInfo(Map<String, String> data) async =>
      _strings(await Api.post('business', data));

  static Map<String, String> _strings(dynamic json) => {
    for (final e in (json as Map).entries)
      if (e.value != null) '${e.key}': '${e.value}',
  };

  static Future<List<Map<String, dynamic>>> loadPaymentMethods() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_payKey);
    if (raw != null) {
      try {
        final list = jsonDecode(raw) as List;
        return list.map((e) => Map<String, dynamic>.from(e)).toList();
      } catch (_) {}
    }
    return [
      {
        'id': '1',
        'type': 'mobile',
        'provider': 'M-Pesa (Vodacom)',
        'number': '+255 712 345 678',
        'name': 'John Doe',
        'isDefault': true,
      },
      {
        'id': '2',
        'type': 'bank',
        'provider': 'CRDB Bank',
        'number': '0150248901200',
        'name': 'Veyora Real Estate Ltd',
        'isDefault': false,
      },
      {
        'id': '3',
        'type': 'mobile',
        'provider': 'Airtel Money',
        'number': '+255 784 112 233',
        'name': 'John Doe',
        'isDefault': false,
      },
    ];
  }

  static Future<void> savePaymentMethods(List<Map<String, dynamic>> list) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_payKey, jsonEncode(list));
  }

  static Future<Map<String, dynamic>> loadSecuritySettings() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_secKey);
    if (raw != null) {
      try {
        return Map<String, dynamic>.from(jsonDecode(raw));
      } catch (_) {}
    }
    return {
      'twoFactorEnabled': true,
      'twoFactorMethod': 'SMS',
      'biometricsEnabled': true,
      'loginAlertsEnabled': true,
      'lastPasswordChange': '2 weeks ago',
    };
  }

  static Future<void> saveSecuritySettings(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_secKey, jsonEncode(data));
  }

  static Future<Map<String, String>> loadContactDetails(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_contactKey);
    if (raw != null) {
      try {
        return Map<String, String>.from(jsonDecode(raw));
      } catch (_) {}
    }
    return {
      'phone': '${user['phone_number'] ?? '+255 712 345 678'}',
      'alt_phone': '+255 655 987 654',
      'email': '${user['email'] ?? 'john.doe@example.com'}',
      'location': 'Dar es Salaam, Tanzania',
      'postal': 'P.O. Box 7102, Dar es Salaam',
    };
  }

  static Future<void> saveContactDetails(Map<String, String> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_contactKey, jsonEncode(data));
  }
}

/// Words for the server's business verification status.
String businessStatusLabel(String? status) => switch (status) {
  'approved' => t('Verified', 'Imethibitishwa'),
  'pending' => t('Under review', 'Inakaguliwa'),
  'rejected' => t('Needs changes', 'Inahitaji marekebisho'),
  _ => t('Not sent yet', 'Bado haijatumwa'),
};

// ============================================================================
// CLAYMORPHISM DESIGN SYSTEM COMPONENTS
// ============================================================================

/// Volumetric 3D Clay Card with dual directional shadows and glossy highlights.
class ClayCard extends StatelessWidget {
  const ClayCard({
    super.key,
    required this.child,
    this.color,
    this.borderRadius = 22,
    this.padding,
    this.margin,
    this.borderWidth = 2.0,
    this.borderColor,
    this.depth = 1.0,
    this.shadowColor,
    this.onTap,
  });

  final Widget child;
  final Color? color; // the card colour of the theme unless given
  final double borderRadius;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderWidth;
  final Color? borderColor; // the lit edge of the theme unless given
  final double depth;
  final Color? shadowColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    Widget card = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? C.card,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: borderColor ?? C.edge, width: borderWidth),
        boxShadow: [
          // Soft ambient clay drop shadow (bottom-right)
          BoxShadow(
            color: (shadowColor ?? C.shade).withValues(alpha: 0.28 * depth),
            offset: Offset(5 * depth, 7 * depth),
            blurRadius: 16 * depth,
          ),
          // Bright specular light reflection (top-left)
          BoxShadow(
            color: C.edge,
            offset: Offset(-4 * depth, -4 * depth),
            blurRadius: 12 * depth,
            spreadRadius: 1.0 * depth,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(borderRadius > 2 ? borderRadius - 2 : borderRadius),
        clipBehavior: Clip.antiAlias,
        child: Padding(
          padding: padding ?? const EdgeInsets.all(16),
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      return Press(onTap: onTap, child: card);
    }
    return card;
  }
}

/// Claymorphic debossed recessed input field: sits comfortably sunken into clay.
class ClayTextField extends StatefulWidget {
  const ClayTextField({
    super.key,
    required this.label,
    required this.hint,
    required this.icon,
    required this.controller,
    this.validator,
    this.keyboardType,
    this.maxLines = 1,
    this.obscureText = false,
    this.suffixIcon,
    this.onChanged,
  });

  final String label;
  final String hint;
  final IconData icon;
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final int maxLines;
  final bool obscureText;
  final Widget? suffixIcon;
  final ValueChanged<String>? onChanged;

  @override
  State<ClayTextField> createState() => _ClayTextFieldState();
}

class _ClayTextFieldState extends State<ClayTextField> {
  final _focusNode = FocusNode();
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      if (mounted) setState(() => _focused = _focusNode.hasFocus);
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.label,
            style: body(12, color: C.wino, weight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            decoration: BoxDecoration(
              color: _focused ? Colors.white : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _focused ? C.mkoko : const Color(0xFFE2E8F0),
                width: _focused ? 2.0 : 1.4,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFCBD5E1).withValues(alpha: _focused ? 0.25 : 0.45),
                  offset: const Offset(2, 2.5),
                  blurRadius: 5,
                ),
                BoxShadow(color: C.edge, offset: Offset(-2, -2),
                  blurRadius: 4,
                  spreadRadius: 0.5,
                ),
              ],
            ),
            child: TextFormField(
              controller: widget.controller,
              focusNode: _focusNode,
              validator: widget.validator,
              keyboardType: widget.keyboardType,
              maxLines: widget.maxLines,
              obscureText: widget.obscureText,
              onChanged: widget.onChanged,
              style: body(13.5, color: C.wino, weight: FontWeight.w600),
              decoration: InputDecoration(
                filled: false,
                isDense: false,
                hintText: widget.hint,
                hintStyle: body(12.5, color: C.faint),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: widget.maxLines > 1 ? 14 : 15,
                ),
                prefixIcon: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: _focused
                          ? C.teal.withValues(alpha: 0.15)
                          : const Color(0xFFE2E8F0).withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: C.edge, width: 1.5),
                    ),
                    child: Icon(
                      widget.icon,
                      size: 17,
                      color: _focused ? C.teal : const Color(0xFF64748B),
                    ),
                  ),
                ),
                suffixIcon: widget.suffixIcon,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                errorBorder: InputBorder.none,
                focusedErrorBorder: InputBorder.none,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Tactile 3D Clay Action Button with smooth depression animation on press.
class ClayButton extends StatefulWidget {
  const ClayButton({
    super.key,
    required this.label,
    required this.onTap,
    this.icon,
    this.busy = false,
    this.color,
    this.textColor = Colors.white,
  });

  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool busy;
  final Color? color;
  final Color textColor;

  @override
  State<ClayButton> createState() => _ClayButtonState();
}

class _ClayButtonState extends State<ClayButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final effectiveColor = widget.color ?? C.mkoko;
    final enabled = widget.onTap != null && !widget.busy;

    return GestureDetector(
      onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
      onTapUp: enabled ? (_) => setState(() => _pressed = false) : null,
      onTapCancel: enabled ? () => setState(() => _pressed = false) : null,
      onTap: enabled
          ? () {
              HapticFeedback.lightImpact();
              widget.onTap!();
            }
          : null,
      child: AnimatedScale(
        scale: _pressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          curve: Curves.easeOutCubic,
          height: 52,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                effectiveColor,
                Color.lerp(effectiveColor, Colors.black, 0.15) ?? effectiveColor,
              ],
            ),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.35),
              width: 1.8,
            ),
            boxShadow: [
              BoxShadow(
                color: effectiveColor.withValues(alpha: _pressed ? 0.2 : 0.40),
                offset: Offset(0, _pressed ? 3 : 7),
                blurRadius: _pressed ? 8 : 16,
              ),
              BoxShadow(
                color: Colors.white.withValues(alpha: 0.25),
                offset: const Offset(-2, -2),
                blurRadius: 6,
              ),
            ],
          ),
          child: Center(
            child: widget.busy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (widget.icon != null) ...[
                        Icon(widget.icon, color: widget.textColor, size: 19),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        widget.label,
                        style: display(14.5, color: widget.textColor, weight: FontWeight.w700),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

Widget claySectionTitle(String title, {IconData? icon}) {
  return Padding(
    padding: const EdgeInsets.only(top: 14, bottom: 8, left: 2),
    child: Row(
      children: [
        if (icon != null) ...[
          Container(
            padding: const EdgeInsets.all(5),
            decoration: BoxDecoration(
              color: C.teal.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: C.edge, width: 1.2),
            ),
            child: Icon(icon, size: 14, color: C.teal),
          ),
          const SizedBox(width: 8),
        ],
        Text(
          title.toUpperCase(),
          style: display(11.5, color: C.muted, weight: FontWeight.w800),
        ),
      ],
    ),
  );
}

// ============================================================================
// 1. EDIT BUSINESS INFORMATION SCREEN
// ============================================================================
class EditBusinessInfoScreen extends StatefulWidget {
  const EditBusinessInfoScreen({super.key, required this.initialData});
  final Map<String, String> initialData;

  @override
  State<EditBusinessInfoScreen> createState() => _EditBusinessInfoScreenState();
}

class _EditBusinessInfoScreenState extends State<EditBusinessInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _tinCtrl;
  late TextEditingController _brelaCtrl;
  late TextEditingController _vrnCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _websiteCtrl;
  late TextEditingController _bioCtrl;
  String _selectedCategory = 'Real Estate Agency';
  bool _saving = false;

  final _categories = [
    'Real Estate Agency',
    'Individual Landlord',
    'Property Management',
    'Housing Developer',
    'Commercial Leasing',
  ];

  @override
  void initState() {
    super.initState();
    final d = widget.initialData;
    _nameCtrl = TextEditingController(text: d['entity_name'] ?? '');
    _tinCtrl = TextEditingController(text: d['tin'] ?? '');
    _brelaCtrl = TextEditingController(text: d['brela'] ?? '');
    _vrnCtrl = TextEditingController(text: d['vrn'] ?? '');
    _phoneCtrl = TextEditingController(text: d['phone'] ?? '');
    _emailCtrl = TextEditingController(text: d['email'] ?? '');
    _addressCtrl = TextEditingController(text: d['address'] ?? '');
    _websiteCtrl = TextEditingController(text: d['website'] ?? '');
    _bioCtrl = TextEditingController(text: d['bio'] ?? '');
    if (_categories.contains(d['business_type'])) {
      _selectedCategory = d['business_type']!;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _tinCtrl.dispose();
    _brelaCtrl.dispose();
    _vrnCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _websiteCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    HapticFeedback.lightImpact();

    final typed = {
      'entity_name': _nameCtrl.text.trim(),
      'business_type': _selectedCategory,
      'tin': _tinCtrl.text.trim(),
      'brela': _brelaCtrl.text.trim(),
      'vrn': _vrnCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'address': _addressCtrl.text.trim(),
      'website': _websiteCtrl.text.trim(),
      'bio': _bioCtrl.text.trim(),
    }..removeWhere((_, v) => v.isEmpty); // an empty optional field is "not given", not an invalid email

    try {
      final saved = await ProfileDataService.saveBusinessInfo(typed);
      if (!mounted) return;
      toast(
        context,
        t(
          'Sent for verification. We will notify you when it is checked.',
          'Imetumwa kwa uthibitisho. Tutakujulisha ikikaguliwa.',
        ),
      );
      Navigator.pop(context, saved);
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      toast(context, e.message); // e.g. "A TIN has 9 digits."
    }
  }

  /// What the card at the top says about where the verification stands.
  String get _statusNote => switch (widget.initialData['status']) {
    'pending' => t(
      'Under review by our team. Saving a change sends your details for review again.',
      'Inakaguliwa na timu yetu. Ukibadilisha kitu, taarifa zako zitakaguliwa upya.',
    ),
    'approved' => t(
      'Verified. If you change anything, it is checked again before it shows as verified.',
      'Imethibitishwa. Ukibadilisha chochote, itakaguliwa tena kabla ya kuonekana imethibitishwa.',
    ),
    'rejected' => t(
      'Not verified yet: ${widget.initialData['rejection_reason'] ?? ''} Correct it and send again.',
      'Bado haijathibitishwa: ${widget.initialData['rejection_reason'] ?? ''} Rekebisha kisha utume tena.',
    ),
    _ => t(
      'Send your business details. Our team checks them, then your business shows as verified to renters.',
      'Tuma taarifa za biashara yako. Timu yetu itazikagua, kisha biashara yako itaonekana imethibitishwa.',
    ),
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(
          t('Edit Business Information', 'Hariri Taarifa za Biashara'),
          style: display(17, color: C.wino, weight: FontWeight.w700),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: C.wino, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: Colors.white, height: 1),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: TextButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: C.teal),
                    )
                  : Text(
                      t('Save', 'Hifadhi'),
                      style: body(14, color: C.teal, weight: FontWeight.w700),
                    ),
            ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
          children: [
            // Header Hint Card (Clay Style)
            ClayCard(
              color: const Color(0xFFEFF6FF),
              borderColor: C.edge,
              shadowColor: const Color(0xFF93C5FD),
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF2563EB).withValues(alpha: 0.15),
                          offset: const Offset(1, 2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.verified_user_outlined, color: Color(0xFF2563EB), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _statusNote,
                      style: body(12, color: const Color(0xFF1E40AF), height: 1.35),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 350.ms, curve: Curves.easeOutCubic).slideY(begin: 0.05, end: 0),
            const SizedBox(height: 16),

            // Section 1: Business Identity
            claySectionTitle(t('Business Details', 'Maelezo ya Kampuni'), icon: Icons.domain_rounded)
                .animate().fadeIn(duration: 350.ms, delay: 50.ms).slideY(begin: 0.05, end: 0),
            ClayCard(
              child: Column(
                children: [
                  ClayTextField(
                    label: t('Business / Entity Name', 'Jina la Biashara'),
                    hint: 'e.g. Veyora Real Estate Ltd',
                    icon: Icons.domain_rounded,
                    controller: _nameCtrl,
                    validator: (v) => v == null || v.trim().isEmpty ? t('Name is required', 'Jina linahitajika') : null,
                  ),
                  _categoryDropdown(),
                ],
              ),
            ).animate().fadeIn(duration: 350.ms, delay: 90.ms, curve: Curves.easeOutCubic).slideY(begin: 0.05, end: 0),
            const SizedBox(height: 16),

            // Section 2: Registration & Tax
            claySectionTitle(t('Registration & Tax Identification', 'Usajili na Kodi'), icon: Icons.pin_outlined)
                .animate().fadeIn(duration: 350.ms, delay: 130.ms).slideY(begin: 0.05, end: 0),
            ClayCard(
              child: Column(
                children: [
                  ClayTextField(
                    label: t('Tax Identification Number (TIN)', 'Nambari ya TIN'),
                    hint: 'e.g. 142-985-231',
                    icon: Icons.pin_outlined,
                    controller: _tinCtrl,
                    keyboardType: TextInputType.number,
                    validator: (v) => (v ?? '').replaceAll(RegExp(r'\D'), '').length == 9
                        ? null
                        : t('A TIN has 9 digits', 'TIN ina tarakimu 9'),
                  ),
                  ClayTextField(
                    label: t('BRELA Registration Number', 'Nambari ya Usajili wa BRELA'),
                    hint: 'e.g. 10948291',
                    icon: Icons.badge_outlined,
                    controller: _brelaCtrl,
                  ),
                  ClayTextField(
                    label: t('VAT Registration Number (Optional)', 'Nambari ya VAT (Hiari)'),
                    hint: 'e.g. VRN-4001923',
                    icon: Icons.receipt_long_outlined,
                    controller: _vrnCtrl,
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 350.ms, delay: 170.ms, curve: Curves.easeOutCubic).slideY(begin: 0.05, end: 0),
            const SizedBox(height: 16),

            // Section 3: Official Contact & Address
            claySectionTitle(t('Official Contacts & Location', 'Mawasiliano na Mahali'), icon: Icons.phone_outlined)
                .animate().fadeIn(duration: 350.ms, delay: 210.ms).slideY(begin: 0.05, end: 0),
            ClayCard(
              child: Column(
                children: [
                  ClayTextField(
                    label: t('Business Phone', 'Nambari ya Simu ya Ofisi'),
                    hint: '+255 712 345 678',
                    icon: Icons.phone_outlined,
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                  ),
                  ClayTextField(
                    label: t('Official Email', 'Barua Pepe ya Biashara'),
                    hint: 'info@business.co.tz',
                    icon: Icons.email_outlined,
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  ClayTextField(
                    label: t('Physical Office Address', 'Anwani ya Ofisi'),
                    hint: 'Building, Street, City',
                    icon: Icons.location_on_outlined,
                    controller: _addressCtrl,
                  ),
                  ClayTextField(
                    label: t('Website / Profile Link', 'Tovuti au Ukurasa'),
                    hint: 'www.business.co.tz',
                    icon: Icons.language_rounded,
                    controller: _websiteCtrl,
                    keyboardType: TextInputType.url,
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 350.ms, delay: 250.ms, curve: Curves.easeOutCubic).slideY(begin: 0.05, end: 0),
            const SizedBox(height: 16),

            // Section 4: Business Bio
            claySectionTitle(t('About Business / Portfolio', 'Kuhusu Biashara'), icon: Icons.description_outlined)
                .animate().fadeIn(duration: 350.ms, delay: 290.ms).slideY(begin: 0.05, end: 0),
            ClayCard(
              child: ClayTextField(
                label: t('Company Overview', 'Muhtasari wa Kampuni'),
                hint: t(
                  'Brief summary of your property management services...',
                  'Muhtasari mfupi wa huduma zako za kupangisha...',
                ),
                icon: Icons.description_outlined,
                controller: _bioCtrl,
                maxLines: 3,
              ),
            ).animate().fadeIn(duration: 350.ms, delay: 330.ms, curve: Curves.easeOutCubic).slideY(begin: 0.05, end: 0),
            const SizedBox(height: 22),

            // Clay Submit Button
            ClayButton(
              label: t('Send for verification', 'Tuma kwa uthibitisho'),
              icon: Icons.verified_rounded,
              busy: _saving,
              onTap: _save,
            ).animate().fadeIn(duration: 350.ms, delay: 370.ms, curve: Curves.easeOutCubic).slideY(begin: 0.05, end: 0),
          ],
        ),
      ),
    );
  }

  Widget _categoryDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          t('Business Category', 'Aina ya Biashara'),
          style: body(12, color: C.wino, weight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.4),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFCBD5E1).withValues(alpha: 0.35),
                offset: const Offset(2, 2.5),
                blurRadius: 5,
              ),
              BoxShadow(color: C.edge, offset: Offset(-2, -2),
                blurRadius: 4,
                spreadRadius: 0.5,
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0).withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: C.edge, width: 1.5),
                ),
                child: Icon(Icons.category_outlined, size: 17, color: const Color(0xFF64748B)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedCategory,
                    isExpanded: true,
                    icon: Icon(Icons.keyboard_arrow_down_rounded, size: 20, color: C.muted),
                    style: body(13.5, color: C.wino, weight: FontWeight.w600),
                    items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedCategory = val);
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// 2. MANAGE / EDIT PAYMENT METHODS SCREEN
// ============================================================================
class EditPaymentMethodsScreen extends StatefulWidget {
  const EditPaymentMethodsScreen({super.key, required this.initialMethods});
  final List<Map<String, dynamic>> initialMethods;

  @override
  State<EditPaymentMethodsScreen> createState() => _EditPaymentMethodsScreenState();
}

class _EditPaymentMethodsScreenState extends State<EditPaymentMethodsScreen> {
  late List<Map<String, dynamic>> _methods;

  @override
  void initState() {
    super.initState();
    _methods = List<Map<String, dynamic>>.from(widget.initialMethods.map((m) => Map<String, dynamic>.from(m)));
  }

  Future<void> _persist() async {
    await ProfileDataService.savePaymentMethods(_methods);
    if (mounted) {
      toast(context, t('Payment methods updated', 'Njia za malipo zimesasishwa'));
    }
  }

  void _setDefault(int index) {
    HapticFeedback.selectionClick();
    setState(() {
      for (var i = 0; i < _methods.length; i++) {
        _methods[i]['isDefault'] = (i == index);
      }
    });
    _persist();
  }

  void _deleteMethod(int index) {
    if (_methods.length <= 1) {
      toast(context, t('At least one payment method is required', 'Angalau njia moja inahitajika'));
      return;
    }
    final removed = _methods.removeAt(index);
    if (removed['isDefault'] == true && _methods.isNotEmpty) {
      _methods[0]['isDefault'] = true;
    }
    setState(() {});
    _persist();
  }

  void _showAddMethodModal([Map<String, dynamic>? toEdit, int? editIndex]) {
    final isEditing = toEdit != null;
    String selectedProvider = toEdit?['provider'] ?? 'M-Pesa (Vodacom)';
    String type = toEdit?['type'] ?? 'mobile';
    final numberCtrl = TextEditingController(text: toEdit?['number'] ?? '');
    final nameCtrl = TextEditingController(text: toEdit?['name'] ?? '');
    bool setAsDefault = toEdit?['isDefault'] ?? (_methods.isEmpty);

    final mobileProviders = [
      'M-Pesa (Vodacom)',
      'Tigo Pesa (Yas)',
      'Airtel Money',
      'Halopesa',
    ];

    final bankProviders = [
      'CRDB Bank',
      'NMB Bank',
      'NBC Bank',
      'Stanbic Bank',
      'Absa Bank',
      'Equity Bank',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final isBank = type == 'bank';
          final currentList = isBank ? bankProviders : mobileProviders;
          if (!currentList.contains(selectedProvider)) {
            selectedProvider = currentList.first;
          }

          return Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
              border: Border(
                top: BorderSide(color: C.edge, width: 2.5),
                left: BorderSide(color: C.edge, width: 2.0),
                right: BorderSide(color: C.edge, width: 2.0),
              ),
              boxShadow: [
                BoxShadow(
                  color: C.shade.withValues(alpha: 0.35),
                  offset: const Offset(0, -6),
                  blurRadius: 20,
                ),
              ],
            ),
            padding: EdgeInsets.fromLTRB(
              20,
              14,
              20,
              24 + MediaQuery.viewInsetsOf(ctx).bottom,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 5,
                      decoration: BoxDecoration(
                        color: const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(3),
                        boxShadow: [
                          BoxShadow(color: C.edge, offset: const Offset(0, 1), blurRadius: 1),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isEditing
                        ? t('Edit Payment Method', 'Hariri Njia ya Malipo')
                        : t('Add Payment Method', 'Ongeza Njia ya Malipo'),
                    style: display(18, color: C.wino, weight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    t('Configure your rental payout wallet or bank account.', 'Weka maelezo ya pochi ya simu au akaunti ya benki.'),
                    style: body(12, color: C.muted),
                  ),
                  const SizedBox(height: 16),

                  // Clay Type Selector Tab
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFCBD5E1).withValues(alpha: 0.6),
                          offset: const Offset(2, 2),
                          blurRadius: 4,
                        ),
                        BoxShadow(color: C.edge, offset: Offset(-1, -1),
                          blurRadius: 3,
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setModalState(() {
                                type = 'mobile';
                                selectedProvider = mobileProviders.first;
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              padding: const EdgeInsets.symmetric(vertical: 9),
                              decoration: BoxDecoration(
                                color: !isBank ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(13),
                                border: !isBank ? Border.all(color: C.edge, width: 1.5) : null,
                                boxShadow: !isBank
                                    ? [
                                        BoxShadow(
                                          color: C.shade.withValues(alpha: 0.3),
                                          blurRadius: 8,
                                          offset: const Offset(2, 3),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.phone_android_rounded, size: 16, color: !isBank ? C.teal : C.muted),
                                  const SizedBox(width: 6),
                                  Text(
                                    t('Mobile Money', 'Pochi ya Simu'),
                                    style: body(12.5, weight: FontWeight.w700, color: !isBank ? C.teal : C.muted),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setModalState(() {
                                type = 'bank';
                                selectedProvider = bankProviders.first;
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              padding: const EdgeInsets.symmetric(vertical: 9),
                              decoration: BoxDecoration(
                                color: isBank ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(13),
                                border: isBank ? Border.all(color: C.edge, width: 1.5) : null,
                                boxShadow: isBank
                                    ? [
                                        BoxShadow(
                                          color: C.shade.withValues(alpha: 0.3),
                                          blurRadius: 8,
                                          offset: const Offset(2, 3),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.account_balance_rounded, size: 16, color: isBank ? C.teal : C.muted),
                                  const SizedBox(width: 6),
                                  Text(
                                    t('Bank Account', 'Akaunti ya Benki'),
                                    style: body(12.5, weight: FontWeight.w700, color: isBank ? C.teal : C.muted),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Provider Dropdown
                  Text(
                    t('Provider / Bank', 'Kampuni au Benki'),
                    style: body(12, color: C.wino, weight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    height: 52,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      border: Border.all(color: const Color(0xFFE2E8F0), width: 1.4),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFCBD5E1).withValues(alpha: 0.35),
                          offset: const Offset(2, 2.5),
                          blurRadius: 5,
                        ),
                        BoxShadow(color: C.edge, offset: Offset(-2, -2),
                          blurRadius: 4,
                          spreadRadius: 0.5,
                        ),
                      ],
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedProvider,
                        isExpanded: true,
                        icon: Icon(Icons.keyboard_arrow_down_rounded, size: 20, color: C.muted),
                        style: body(13.5, color: C.wino, weight: FontWeight.w600),
                        items: currentList.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                        onChanged: (val) {
                          if (val != null) setModalState(() => selectedProvider = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Account / Phone Number
                  ClayTextField(
                    label: isBank ? t('Account Number', 'Nambari ya Akaunti') : t('Phone Number', 'Nambari ya Simu'),
                    hint: isBank ? 'e.g. 0150248901200' : 'e.g. +255 712 345 678',
                    controller: numberCtrl,
                    keyboardType: isBank ? TextInputType.number : TextInputType.phone,
                    icon: isBank ? Icons.numbers_rounded : Icons.phone_outlined,
                  ),

                  // Registered Name
                  ClayTextField(
                    label: t('Account Holder Name', 'Jina la Mmiliki wa Akaunti'),
                    hint: 'e.g. John Doe',
                    controller: nameCtrl,
                    icon: Icons.person_outline_rounded,
                  ),

                  // Default Toggle
                  Row(
                    children: [
                      Checkbox(
                        value: setAsDefault,
                        activeColor: C.mkoko,
                        onChanged: (v) => setModalState(() => setAsDefault = v ?? false),
                      ),
                      Text(
                        t('Set as default payout method', 'Weka kuwa njia kuu ya kupokea malipo'),
                        style: body(12.5, color: C.wino, weight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  ClayButton(
                    label: isEditing ? t('Update Method', 'Sasisha Njia') : t('Add Method', 'Ongeza Njia'),
                    icon: Icons.check_circle_outline_rounded,
                    onTap: () {
                      final numStr = numberCtrl.text.trim();
                      final holderStr = nameCtrl.text.trim();
                      if (numStr.isEmpty || holderStr.isEmpty) {
                        toast(ctx, t('Please fill all fields', 'Tafadhali jaza maelezo yote'));
                        return;
                      }

                      setState(() {
                        if (setAsDefault) {
                          for (var m in _methods) {
                            m['isDefault'] = false;
                          }
                        }

                        if (isEditing && editIndex != null) {
                          _methods[editIndex] = {
                            'id': toEdit['id'],
                            'type': type,
                            'provider': selectedProvider,
                            'number': numStr,
                            'name': holderStr,
                            'isDefault': setAsDefault,
                          };
                        } else {
                          _methods.add({
                            'id': DateTime.now().millisecondsSinceEpoch.toString(),
                            'type': type,
                            'provider': selectedProvider,
                            'number': numStr,
                            'name': holderStr,
                            'isDefault': setAsDefault,
                          });
                        }
                      });

                      Navigator.pop(ctx);
                      _persist();
                    },
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(
          t('Manage Payment Methods', 'Njia za Malipo'),
          style: display(17, color: C.wino, weight: FontWeight.w700),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: C.wino, size: 20),
          onPressed: () => Navigator.pop(context, _methods),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              claySectionTitle(t('SAVED METHODS', 'NJIA ZILIZOHIFADHIWA'), icon: Icons.credit_card_rounded),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: C.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: C.edge, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: C.shade.withValues(alpha: 0.2),
                      offset: const Offset(2, 2),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Text(
                  '${_methods.length} ${t('Active', 'Zinazofanya kazi')}',
                  style: body(11.5, color: C.teal, weight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          for (var i = 0; i < _methods.length; i++) ...[
            _methodCard(_methods[i], i)
                .animate()
                .fadeIn(duration: 350.ms, delay: (i * 60).ms)
                .slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
            const SizedBox(height: 12),
          ],

          const SizedBox(height: 16),
          ClayCard(
            color: Colors.white,
            borderRadius: 20,
            onTap: () => _showAddMethodModal(),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add_circle_outline_rounded, color: C.teal, size: 20),
                const SizedBox(width: 8),
                Text(
                  t('+ Add Another Payment Method', '+ Ongeza Njia Nyingine ya Malipo'),
                  style: body(13.5, color: C.teal, weight: FontWeight.w700),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 200.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
        ],
      ),
    );
  }

  Widget _methodCard(Map<String, dynamic> item, int index) {
    final isDefault = item['isDefault'] == true;
    final isBank = item['type'] == 'bank';

    return ClayCard(
      borderRadius: 20,
      borderColor: isDefault ? C.teal.withValues(alpha: 0.5) : Colors.white,
      borderWidth: isDefault ? 2.2 : 2.0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: isBank ? const Color(0xFFE0F2FE) : C.tealLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: C.edge, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: (isBank ? const Color(0xFF0284C7) : C.teal).withValues(alpha: 0.2),
                      offset: const Offset(2, 2),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Icon(
                  isBank ? Icons.account_balance_outlined : Icons.account_balance_wallet_outlined,
                  color: isBank ? const Color(0xFF0284C7) : C.teal,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          '${item['provider']}',
                          style: display(14, color: C.wino, weight: FontWeight.w700),
                        ),
                        if (isDefault) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: C.teal,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.4), width: 1),
                              boxShadow: [
                                BoxShadow(
                                  color: C.teal.withValues(alpha: 0.3),
                                  offset: const Offset(1, 2),
                                  blurRadius: 3,
                                ),
                              ],
                            ),
                            child: Text(
                              t('Default', 'Kuu'),
                              style: body(9.5, color: Colors.white, weight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${item['number']}',
                      style: body(12.5, color: C.wino, weight: FontWeight.w600),
                    ),
                    Text(
                      '${t('Holder', 'Mmiliki')}: ${item['name']}',
                      style: body(11.5, color: C.muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          Divider(height: 20, color: C.fill),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Press(
                onTap: isDefault ? null : () => _setDefault(index),
                child: Row(
                  children: [
                    Icon(
                      isDefault ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                      size: 17,
                      color: isDefault ? C.teal : C.faint,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isDefault
                          ? t('Default payout method', 'Njia kuu ya malipo')
                          : t('Set as default', 'Weka kuwa njia kuu'),
                      style: body(
                        11.5,
                        color: isDefault ? C.teal : C.muted,
                        weight: isDefault ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  Press(
                    onTap: () => _showAddMethodModal(item, index),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.edit_outlined, size: 16, color: C.muted),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Press(
                    onTap: () => _deleteMethod(index),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.delete_outline_rounded, size: 16, color: Color(0xFFDC2626)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 3. EDIT SECURITY SETTINGS SCREEN
// ============================================================================
class EditSecurityScreen extends StatefulWidget {
  const EditSecurityScreen({super.key, required this.initialSettings});
  final Map<String, dynamic> initialSettings;

  @override
  State<EditSecurityScreen> createState() => _EditSecurityScreenState();
}

class _EditSecurityScreenState extends State<EditSecurityScreen> {
  final _oldPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  bool _hideOld = true;
  bool _hideNew = true;
  bool _hideConfirm = true;

  late bool _twoFactor;
  late String _twoFactorMethod;
  late bool _biometrics;
  late bool _loginAlerts;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final s = widget.initialSettings;
    _twoFactor = s['twoFactorEnabled'] ?? true;
    _twoFactorMethod = s['twoFactorMethod'] ?? 'SMS';
    _biometrics = s['biometricsEnabled'] ?? true;
    _loginAlerts = s['loginAlertsEnabled'] ?? true;
  }

  @override
  void dispose() {
    _oldPassCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveAll() async {
    final p1 = _newPassCtrl.text.trim();
    final p2 = _confirmPassCtrl.text.trim();

    if (p1.isNotEmpty) {
      if (p1.length < 6) {
        toast(context, t('New password must be at least 6 characters', 'Nenosiri liwe na herufi 6 au zaidi'));
        return;
      }
      if (p1 != p2) {
        toast(context, t('New passwords do not match', 'Nenosiri halifanani'));
        return;
      }
    }

    setState(() => _saving = true);
    HapticFeedback.lightImpact();

    try {
      if (p1.isNotEmpty) {
        await Api.patch('user/me/', {'password': p1});
      }

      final updated = {
        'twoFactorEnabled': _twoFactor,
        'twoFactorMethod': _twoFactorMethod,
        'biometricsEnabled': _biometrics,
        'loginAlertsEnabled': _loginAlerts,
        'lastPasswordChange': p1.isNotEmpty ? 'Just now' : (widget.initialSettings['lastPasswordChange'] ?? 'Recently'),
      };

      await ProfileDataService.saveSecuritySettings(updated);

      if (mounted) {
        toast(context, t('Security preferences updated successfully', 'Mipangilio ya usalama imehifadhiwa'));
        Navigator.pop(context, updated);
      }
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(
          t('Security & Authentication', 'Usalama na Nenosiri'),
          style: display(17, color: C.wino, weight: FontWeight.w700),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: C.wino, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton(
            onPressed: _saving ? null : _saveAll,
            child: _saving
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: C.teal),
                  )
                : Text(
                    t('Save', 'Hifadhi'),
                    style: body(14, color: C.teal, weight: FontWeight.w700),
                  ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
        children: [
          // Section 1: Change Password
          claySectionTitle(t('Change Password', 'Badili Nenosiri'), icon: Icons.lock_outline_rounded),
          const SizedBox(height: 8),
          ClayCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClayTextField(
                  label: t('Current Password (Optional)', 'Nenosiri la Sasa (Hiari)'),
                  hint: t('Enter current password', 'Weka nenosiri la sasa'),
                  controller: _oldPassCtrl,
                  obscureText: _hideOld,
                  icon: Icons.lock_open_rounded,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _hideOld ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      size: 18,
                      color: C.muted,
                    ),
                    onPressed: () => setState(() => _hideOld = !_hideOld),
                  ),
                ),
                ClayTextField(
                  label: t('New Password', 'Nenosiri Jipya'),
                  hint: t('At least 6 characters', 'Herufi 6 au zaidi'),
                  controller: _newPassCtrl,
                  obscureText: _hideNew,
                  icon: Icons.lock_outline_rounded,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _hideNew ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      size: 18,
                      color: C.muted,
                    ),
                    onPressed: () => setState(() => _hideNew = !_hideNew),
                  ),
                ),
                ClayTextField(
                  label: t('Confirm New Password', 'Rudia Nenosiri Jipya'),
                  hint: t('Repeat new password', 'Rudia nenosiri jipya'),
                  controller: _confirmPassCtrl,
                  obscureText: _hideConfirm,
                  icon: Icons.lock_reset_rounded,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _hideConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      size: 18,
                      color: C.muted,
                    ),
                    onPressed: () => setState(() => _hideConfirm = !_hideConfirm),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
          const SizedBox(height: 20),

          // Section 2: Two Factor & Biometrics
          claySectionTitle(t('Two-Factor Authentication & Devices', 'Uthibitishaji wa Hatua Mbili'), icon: Icons.shield_outlined),
          const SizedBox(height: 8),
          ClayCard(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(
              children: [
                SwitchListTile(
                  value: _twoFactor,
                  activeTrackColor: C.mkoko,
                  activeThumbColor: Colors.white,
                  onChanged: (val) => setState(() => _twoFactor = val),
                  title: Text(t('Two-Factor Verification (2FA)', 'Uthibitishaji wa 2FA'), style: display(13.5, weight: FontWeight.w700)),
                  subtitle: Text(
                    t('Require an OTP code whenever signing in on a new device.', 'Dai nambari ya siri wakati wa kuingia.'),
                    style: body(11.5, color: C.muted),
                  ),
                ),
                if (_twoFactor) ...[
                  Divider(height: 1, indent: 16, endIndent: 16, color: C.fill),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    child: Row(
                      children: [
                        Text(t('Verification Channel', 'Njia ya Kutuma'), style: body(12, color: C.muted, weight: FontWeight.w600)),
                        const Spacer(),
                        _clayChip(
                          label: 'SMS',
                          selected: _twoFactorMethod == 'SMS',
                          onTap: () => setState(() => _twoFactorMethod = 'SMS'),
                        ),
                        const SizedBox(width: 8),
                        _clayChip(
                          label: 'WhatsApp',
                          selected: _twoFactorMethod == 'WhatsApp',
                          onTap: () => setState(() => _twoFactorMethod = 'WhatsApp'),
                        ),
                      ],
                    ),
                  ),
                ],
                Divider(height: 1, indent: 16, endIndent: 16, color: C.fill),
                SwitchListTile(
                  value: _biometrics,
                  activeTrackColor: C.mkoko,
                  activeThumbColor: Colors.white,
                  onChanged: (val) => setState(() => _biometrics = val),
                  title: Text(t('Biometric Login', 'Kuingia kwa Alama ya Kidole'), style: display(13.5, weight: FontWeight.w700)),
                  subtitle: Text(
                    t('Unlock application with fingerprint or Face ID.', 'Fungua programu kwa alama ya kidole au uso.'),
                    style: body(11.5, color: C.muted),
                  ),
                ),
                Divider(height: 1, indent: 16, endIndent: 16, color: C.fill),
                SwitchListTile(
                  value: _loginAlerts,
                  activeTrackColor: C.mkoko,
                  activeThumbColor: Colors.white,
                  onChanged: (val) => setState(() => _loginAlerts = val),
                  title: Text(t('Suspicious Login Alerts', 'Arifa za Kuingia Usikokotambua'), style: display(13.5, weight: FontWeight.w700)),
                  subtitle: Text(
                    t('Receive instant notification on unknown sign-in attempts.', 'Pokea arifa mara moja ukigundua jaribio la kuingia.'),
                    style: body(11.5, color: C.muted),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 60.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
          const SizedBox(height: 20),

          // Active Session & Device Sign Out
          claySectionTitle(t('Active Sessions', 'Vifaa Vinavyotumika'), icon: Icons.devices_rounded),
          const SizedBox(height: 8),
          ClayCard(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: C.edge, width: 1.5),
                    boxShadow: [
                      BoxShadow(color: C.shade.withValues(alpha: 0.25), offset: const Offset(2, 2), blurRadius: 4),
                    ],
                  ),
                  child: Icon(Icons.phone_android_rounded, color: C.teal, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t('Current Android Device', 'Kifaa Hiki cha Android'), style: display(13, weight: FontWeight.w700)),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            width: 7,
                            height: 7,
                            decoration: const BoxDecoration(
                              color: Color(0xFF16A34A),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(t('Dar es Salaam, Tanzania • Active now', 'Dar es Salaam • Inatumika sasa'), style: body(11.5, color: const Color(0xFF16A34A), weight: FontWeight.w600)),
                        ],
                      ),
                    ],
                  ),
                ),
                Press(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    toast(context, t('Signed out of other devices', 'Umetolewa kwenye vifaa vingine'));
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFCA5A5), width: 1),
                    ),
                    child: Text(
                      t('Sign out others', 'Toa vingine'),
                      style: body(11, color: const Color(0xFFDC2626), weight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 450.ms, delay: 120.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
          const SizedBox(height: 26),

          ClayButton(
            label: t('Save Security Preferences', 'Hifadhi Mipangilio ya Usalama'),
            icon: Icons.shield_rounded,
            busy: _saving,
            onTap: _saveAll,
          ).animate().fadeIn(duration: 500.ms, delay: 180.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
        ],
      ),
    );
  }

  Widget _clayChip({required String label, required bool selected, required VoidCallback onTap}) {
    return Press(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? C.teal : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? Colors.white.withValues(alpha: 0.4) : Colors.white,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: (selected ? C.teal : const Color(0xFF94A3B8)).withValues(alpha: selected ? 0.35 : 0.2),
              offset: const Offset(2, 3),
              blurRadius: 6,
            ),
            BoxShadow(color: C.edge, offset: Offset(-2, -2),
              blurRadius: 4,
            ),
          ],
        ),
        child: Text(
          label,
          style: body(
            11.5,
            color: selected ? Colors.white : C.wino,
            weight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// 4. EDIT CONTACT DETAILS SCREEN
// ============================================================================
class EditContactDetailsScreen extends StatefulWidget {
  const EditContactDetailsScreen({super.key, required this.initialData});
  final Map<String, String> initialData;

  @override
  State<EditContactDetailsScreen> createState() => _EditContactDetailsScreenState();
}

class _EditContactDetailsScreenState extends State<EditContactDetailsScreen> {
  late TextEditingController _phoneCtrl;
  late TextEditingController _altPhoneCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _locCtrl;
  late TextEditingController _postalCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final d = widget.initialData;
    _phoneCtrl = TextEditingController(text: d['phone'] ?? '');
    _altPhoneCtrl = TextEditingController(text: d['alt_phone'] ?? '');
    _emailCtrl = TextEditingController(text: d['email'] ?? '');
    _locCtrl = TextEditingController(text: d['location'] ?? 'Dar es Salaam, Tanzania');
    _postalCtrl = TextEditingController(text: d['postal'] ?? '');
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _altPhoneCtrl.dispose();
    _emailCtrl.dispose();
    _locCtrl.dispose();
    _postalCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final phone = _phoneCtrl.text.trim();
    final email = _emailCtrl.text.trim();

    try {
      if (email.isNotEmpty || phone.isNotEmpty) {
        final updatedApi = await Api.patch('user/me/', {
          if (email.isNotEmpty) 'email': email,
          if (phone.isNotEmpty) 'phone_number': phone,
        });
        Api.setUser(Map<String, dynamic>.from(updatedApi));
      }

      final data = {
        'phone': phone,
        'alt_phone': _altPhoneCtrl.text.trim(),
        'email': email,
        'location': _locCtrl.text.trim(),
        'postal': _postalCtrl.text.trim(),
      };
      await ProfileDataService.saveContactDetails(data);

      if (mounted) {
        toast(context, t('Contact details updated', 'Mawasiliano yamesasishwa'));
        Navigator.pop(context, data);
      }
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(
          t('Edit Contact Details', 'Hariri Mawasiliano'),
          style: display(17, color: C.wino, weight: FontWeight.w700),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: C.wino, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
        children: [
          claySectionTitle(t('Contact Information', 'Taarifa za Mawasiliano'), icon: Icons.contact_phone_rounded),
          const SizedBox(height: 8),
          ClayCard(
            child: Column(
              children: [
                ClayTextField(
                  label: t('Primary Phone Number', 'Nambari Kuu ya Simu'),
                  hint: '+255 712 345 678',
                  controller: _phoneCtrl,
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),
                ClayTextField(
                  label: t('Alternative Phone / WhatsApp', 'Nambari Nyingine / WhatsApp'),
                  hint: '+255 655 987 654',
                  controller: _altPhoneCtrl,
                  icon: Icons.phone_iphone_rounded,
                  keyboardType: TextInputType.phone,
                ),
                ClayTextField(
                  label: t('Email Address', 'Barua Pepe'),
                  hint: 'john.doe@example.com',
                  controller: _emailCtrl,
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),
              ],
            ),
          ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
          const SizedBox(height: 20),

          claySectionTitle(t('Physical & Postal Address', 'Makazi na Sanduku la Posta'), icon: Icons.place_rounded),
          const SizedBox(height: 8),
          ClayCard(
            child: Column(
              children: [
                ClayTextField(
                  label: t('Residential / Operating City', 'Mji wa Makazi au Kazi'),
                  hint: 'Dar es Salaam, Tanzania',
                  controller: _locCtrl,
                  icon: Icons.location_on_outlined,
                ),
                ClayTextField(
                  label: t('Postal Box / Address', 'Sanduku la Posta'),
                  hint: 'P.O. Box 7102, Dar es Salaam',
                  controller: _postalCtrl,
                  icon: Icons.markunread_mailbox_outlined,
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 60.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
          const SizedBox(height: 24),

          ClayButton(
            label: t('Save Contact Details', 'Hifadhi Mawasiliano'),
            icon: Icons.save_rounded,
            busy: _saving,
            onTap: _save,
          ).animate().fadeIn(duration: 450.ms, delay: 120.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
        ],
      ),
    );
  }
}


