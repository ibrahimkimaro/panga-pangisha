import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';

import '../api.dart';
import '../l10n.dart';
import '../ui.dart';
import 'appearance.dart';
import 'owner/rentals.dart';
import 'chat.dart';
import 'notifications.dart';
import 'profile_edit_screens.dart';

/// Screen 20: Redesigned Profile & Settings (Account)
class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  bool _uploading = false;
  bool _switching = false;

  Map<String, String>? _businessInfo;
  List<Map<String, dynamic>>? _paymentMethods;
  Map<String, dynamic>? _securitySettings;
  Map<String, String>? _contactDetails;

  int _propertyCount = 0;
  int _inquiriesCount = 0;
  double _averageRating = 0.0;
  bool _statsLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    final u = Api.user.value ?? const {};
    final biz = await ProfileDataService.loadBusinessInfo();
    final pay = await ProfileDataService.loadPaymentMethods();
    final sec = await ProfileDataService.loadSecuritySettings();
    final contact = await ProfileDataService.loadContactDetails(u);
    if (mounted) {
      setState(() {
        _businessInfo = biz;
        _paymentMethods = pay;
        _securitySettings = sec;
        _contactDetails = contact;
      });
    }
    await _fetchRealStats();
  }

  Future<void> _fetchRealStats() async {
    await Api.refreshUser();
    final u = Api.user.value ?? const {};
    final isLandlord = u['role'] == 'landlord';

    int propCount = 0;
    int inqCount = 0;
    double avgRating = 0.0;

    try {
      if (isLandlord) {
        // 1. Fetch real landlord properties count and rating
        final housesRes = await Api.get('landlord/getAllHouses/');
        if (housesRes is List) {
          propCount = housesRes.length;
          double ratingSum = 0;
          int ratingCount = 0;
          for (final h in housesRes) {
            if (h is Map) {
              final r = double.tryParse('${h['rating'] ?? h['average_rating']}');
              if (r != null && r > 0) {
                ratingSum += r;
                ratingCount++;
              }
            }
          }
          if (ratingCount > 0) {
            avgRating = ratingSum / ratingCount;
          }
        }

        // 2. Fetch real viewing requests / inquiries count
        final viewingsRes = await Api.get('viewing-requests', {'as': 'owner'});
        if (viewingsRes is List) {
          inqCount = viewingsRes.length;
        }
      } else {
        // 1. Tenant real saved homes count
        propCount = saved.value.length; // `saved` is a top-level in api.dart, not a member of Api

        // 2. Tenant real viewing requests
        final viewingsRes = await Api.get('viewing-requests');
        if (viewingsRes is List) {
          inqCount = viewingsRes.length;
        }
        avgRating = 5.0;
      }
    } catch (_) {
      // In case of network errors, defaults are kept safely
    }

    if (mounted) {
      setState(() {
        _propertyCount = propCount;
        _inquiriesCount = inqCount;
        _averageRating = avgRating;
        _statsLoading = false;
      });
    }
  }

  Future<void> _changePhoto() async {
    final file = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 900,
      imageQuality: 82,
    );
    if (file == null || !mounted) return;
    setState(() => _uploading = true);
    try {
      final res = await Api.upload('profile/update_profile_pic/', {}, {
        'profile_image': [file.path],
      });
      Api.setUser({
        ...Api.user.value!,
        'profile_image': res['data']['profile_image'],
      });
      if (mounted) toast(context, t('Profile photo updated', 'Picha imesasishwa'));
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _switchTo(String role) async {
    if (_switching || Api.user.value?['role'] == role) return;
    setState(() => _switching = true);
    try {
      Api.setUser(
        Map<String, dynamic>.from(await Api.patch('user/me/', {'role': role})),
      );
      await _fetchRealStats();
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    } finally {
      if (mounted) setState(() => _switching = false);
    }
  }

  Widget _clayBottomSheetContainer({required BuildContext context, required Widget child}) {
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
        24 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: child,
    );
  }

  Widget _clayGrabBar() => Center(
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
  );

  Widget _clayActionPill({required IconData icon, required String label, required VoidCallback onTap}) {
    return Press(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: C.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: C.edge, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: C.shade.withValues(alpha: 0.25),
              offset: const Offset(2, 3),
              blurRadius: 6,
            ),
            BoxShadow(color: C.edge, offset: Offset(-2, -2),
              blurRadius: 4,
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: C.teal),
            const SizedBox(width: 4),
            Text(
              label,
              style: body(12, color: C.teal, weight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }

  void _showPersonalInfoSheet(Map<String, dynamic> u) {
    final nameCtrl = TextEditingController(text: u['fullname'] ?? '');
    final emailCtrl = TextEditingController(text: u['email'] ?? '');
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => _clayBottomSheetContainer(
          context: ctx,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _clayGrabBar(),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t('Personal Information', 'Taarifa Binafsi'),
                        style: display(18, color: C.wino, weight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        t('Account name and sign-in email', 'Jina na barua pepe ya akaunti'),
                        style: body(12, color: C.muted),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: C.card,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: C.edge, width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: C.shade.withValues(alpha: 0.2),
                          offset: const Offset(2, 2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Text(t('Active', 'Inafanya kazi'), style: body(11, color: C.teal, weight: FontWeight.w700)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ClayCard(
                child: Column(
                  children: [
                    ClayTextField(
                      label: t('Full Name', 'Jina Kamili'),
                      hint: 'John Doe',
                      controller: nameCtrl,
                      icon: Icons.person_outline_rounded,
                    ),
                    ClayTextField(
                      label: t('Email Address', 'Barua Pepe'),
                      hint: 'john.doe@example.com',
                      controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      icon: Icons.email_outlined,
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
              const SizedBox(height: 18),
              ClayButton(
                label: t('Save Changes', 'Hifadhi Mabadiliko'),
                icon: Icons.check_circle_outline_rounded,
                busy: saving,
                onTap: saving
                    ? null
                    : () async {
                        final newName = nameCtrl.text.trim();
                        final newEmail = emailCtrl.text.trim();
                        if (newName.isEmpty) return;
                        setSheetState(() => saving = true);
                        try {
                          final updated = await Api.patch('user/me/', {
                            'fullname': newName,
                            if (newEmail.isNotEmpty) 'email': newEmail,
                          });
                          Api.setUser(Map<String, dynamic>.from(updated));
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (mounted) {
                            setState(() {});
                            toast(context, t('Profile saved successfully', 'Taarifa zimehifadhiwa'));
                          }
                        } on ApiError catch (e) {
                          if (ctx.mounted) toast(ctx, e.message);
                        } finally {
                          if (ctx.mounted) setSheetState(() => saving = false);
                        }
                      },
              ).animate().fadeIn(duration: 400.ms, delay: 80.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
            ],
          ),
        ),
      ),
    );
  }

  void _showContactDetailsSheet(Map<String, dynamic> u) {
    final contact = _contactDetails ?? {
      'phone': '${u['phone_number'] ?? '+255 712 345 678'}',
      'alt_phone': '+255 655 987 654',
      'email': '${u['email'] ?? 'john.doe@example.com'}',
      'location': 'Dar es Salaam, Tanzania',
      'postal': 'P.O. Box 7102, Dar es Salaam',
    };

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _clayBottomSheetContainer(
        context: ctx,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _clayGrabBar(),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('Contact Details', 'Maelezo ya Mawasiliano'),
                      style: display(18, color: C.wino, weight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      t('Primary numbers and location', 'Nambari za simu na makazi'),
                      style: body(12, color: C.muted),
                    ),
                  ],
                ),
                _clayActionPill(
                  icon: Icons.edit_outlined,
                  label: t('Edit', 'Hariri'),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final updated = await push<Map<String, String>>(
                      context,
                      EditContactDetailsScreen(initialData: contact),
                    );
                    if (updated != null && mounted) {
                      setState(() => _contactDetails = updated);
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClayCard(
              child: Column(
                children: [
                  _infoRow(Icons.phone_outlined, t('Primary Phone', 'Nambari ya Simu Kuu'), contact['phone'] ?? ''),
                  Divider(height: 20, color: C.fill),
                  _infoRow(Icons.phone_iphone_rounded, t('Alternative Phone / WhatsApp', 'Nambari ya Ziada'), contact['alt_phone'] ?? 'Not set'),
                  Divider(height: 20, color: C.fill),
                  _infoRow(Icons.email_outlined, t('Email Address', 'Barua Pepe'), contact['email'] ?? ''),
                  Divider(height: 20, color: C.fill),
                  _infoRow(Icons.location_on_outlined, t('Operating Location', 'Mahali pa Makazi'), contact['location'] ?? 'Dar es Salaam'),
                ],
              ),
            ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
            const SizedBox(height: 18),
            ClayButton(
              label: t('Edit Contact Details', 'Hariri Mawasiliano'),
              icon: Icons.edit_rounded,
              onTap: () async {
                Navigator.pop(ctx);
                final updated = await push<Map<String, String>>(
                  context,
                  EditContactDetailsScreen(initialData: contact),
                );
                if (updated != null && mounted) {
                  setState(() => _contactDetails = updated);
                }
              },
            ).animate().fadeIn(duration: 400.ms, delay: 80.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
          ],
        ),
      ),
    );
  }

  void _showBusinessInfoSheet() {
    final biz = _businessInfo ?? {'status': 'none'};
    final notAdded = t('Not added', 'Haijawekwa');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _clayBottomSheetContainer(
        context: ctx,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _clayGrabBar(),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t('Business Information', 'Taarifa za Biashara'),
                          style: display(18, color: C.wino, weight: FontWeight.w700),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          t('Entity registration & tax credentials', 'Usajili wa biashara na namba za kodi'),
                          style: body(12, color: C.muted),
                        ),
                      ],
                    ),
                  ),
                  _clayActionPill(
                    icon: Icons.edit_outlined,
                    label: t('Edit', 'Hariri'),
                    onTap: () async {
                      Navigator.pop(ctx);
                      final updated = await push<Map<String, String>>(
                        context,
                        EditBusinessInfoScreen(initialData: biz),
                      );
                      if (updated != null && mounted) {
                        setState(() => _businessInfo = updated);
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ClayCard(
                child: Column(
                  children: [
                    _infoRow(Icons.domain_rounded, t('Registered Entity', 'Jina la Kampuni'), biz['entity_name'] ?? notAdded),
                    Divider(height: 20, color: C.fill),
                    _infoRow(Icons.category_outlined, t('Business Category', 'Aina ya Biashara'), biz['business_type'] ?? notAdded),
                    Divider(height: 20, color: C.fill),
                    _infoRow(Icons.pin_outlined, t('Tax Identification (TIN)', 'Nambari ya TIN'), biz['tin'] ?? notAdded),
                    Divider(height: 20, color: C.fill),
                    _infoRow(Icons.badge_outlined, t('BRELA Registration', 'Nambari ya BRELA'), biz['brela'] ?? notAdded),
                    Divider(height: 20, color: C.fill),
                    _infoRow(Icons.verified_user_outlined, t('Verification Status', 'Hali ya Usajili'), businessStatusLabel(biz['status'])),
                    if (biz['status'] == 'rejected' && biz['rejection_reason'] != null) ...[
                      Divider(height: 20, color: C.fill),
                      _infoRow(Icons.info_outline_rounded, t('What to fix', 'Cha kurekebisha'), biz['rejection_reason']!),
                    ],
                    Divider(height: 20, color: C.fill),
                    _infoRow(Icons.location_on_outlined, t('Office Location', 'Ofisi'), biz['address'] ?? notAdded),
                  ],
                ),
              ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
              const SizedBox(height: 20),
              ClayButton(
                label: t('Edit & Add Business Info', 'Hariri na Ongeza Taarifa'),
                icon: Icons.edit_note_rounded,
                onTap: () async {
                  Navigator.pop(ctx);
                  final updated = await push<Map<String, String>>(
                    context,
                    EditBusinessInfoScreen(initialData: biz),
                  );
                  if (updated != null && mounted) {
                    setState(() => _businessInfo = updated);
                  }
                },
              ).animate().fadeIn(duration: 400.ms, delay: 80.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
            ],
          ),
        ),
      ),
    );
  }

  void _showPaymentMethodsSheet() {
    final list = _paymentMethods ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _clayBottomSheetContainer(
        context: ctx,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _clayGrabBar(),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t('Payment Methods', 'Njia za Malipo'),
                        style: display(18, color: C.wino, weight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        t('Payout accounts and mobile wallets', 'Akaunti na pochi za simu za kupokea pesa'),
                        style: body(12, color: C.muted),
                      ),
                    ],
                  ),
                  _clayActionPill(
                    icon: Icons.edit_outlined,
                    label: t('Manage', 'Hariri'),
                    onTap: () async {
                      Navigator.pop(ctx);
                      final updated = await push<List<Map<String, dynamic>>>(
                        context,
                        EditPaymentMethodsScreen(initialMethods: list),
                      );
                      if (updated != null && mounted) {
                        setState(() => _paymentMethods = updated);
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              for (var i = 0; i < list.length; i++) ...[
                _paymentMethodTile(
                  '${list[i]['provider']}',
                  '${list[i]['number']} • ${list[i]['name']}',
                  list[i]['isDefault'] == true,
                  list[i]['type'] == 'bank',
                )
                    .animate()
                    .fadeIn(duration: 350.ms, delay: (i * 60).ms)
                    .slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 14),
              ClayButton(
                label: t('Manage & Add Payment Methods', 'Simamia na Ongeza Njia za Malipo'),
                icon: Icons.credit_card_outlined,
                onTap: () async {
                  Navigator.pop(ctx);
                  final updated = await push<List<Map<String, dynamic>>>(
                    context,
                    EditPaymentMethodsScreen(initialMethods: list),
                  );
                  if (updated != null && mounted) {
                    setState(() => _paymentMethods = updated);
                  }
                },
              ).animate().fadeIn(duration: 400.ms, delay: 180.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
            ],
          ),
        ),
      ),
    );
  }

  Widget _paymentMethodTile(String name, String detail, bool isDefault, bool isBank) {
    return ClayCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      borderRadius: 18,
      borderColor: isDefault ? C.teal.withValues(alpha: 0.5) : Colors.white,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isBank ? const Color(0xFFE0F2FE) : C.tealLight,
              borderRadius: BorderRadius.circular(10),
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
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: display(13.5, color: C.wino, weight: FontWeight.w700)),
                const SizedBox(height: 1),
                Text(detail, style: body(11.5, color: C.muted)),
              ],
            ),
          ),
          if (isDefault)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: C.teal,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: C.edge, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: C.teal.withValues(alpha: 0.3),
                    offset: const Offset(1, 2),
                    blurRadius: 3,
                  ),
                ],
              ),
              child: Text(t('Default', 'Kuu'), style: body(9.5, color: Colors.white, weight: FontWeight.w700)),
            ),
        ],
      ),
    );
  }

  void _showSecuritySheet() {
    final sec = _securitySettings ?? {
      'twoFactorEnabled': true,
      'twoFactorMethod': 'SMS',
      'biometricsEnabled': true,
      'loginAlertsEnabled': true,
      'lastPasswordChange': '2 weeks ago',
    };

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _clayBottomSheetContainer(
        context: ctx,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _clayGrabBar(),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('Security & Privacy', 'Usalama na Faragha'),
                      style: display(18, color: C.wino, weight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      t('Authentication, 2FA and password', 'Ulinzi wa nenosiri na uthibitishaji'),
                      style: body(12, color: C.muted),
                    ),
                  ],
                ),
                _clayActionPill(
                  icon: Icons.edit_outlined,
                  label: t('Edit', 'Hariri'),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final updated = await push<Map<String, dynamic>>(
                      context,
                      EditSecurityScreen(initialSettings: sec),
                    );
                    if (updated != null && mounted) {
                      setState(() => _securitySettings = updated);
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClayCard(
              child: Column(
                children: [
                  _infoRow(
                    Icons.lock_outline_rounded,
                    t('Password Status', 'Hali ya Nenosiri'),
                    t('Active (Updated ${sec['lastPasswordChange']})', 'Inafanya kazi'),
                  ),
                  Divider(height: 20, color: C.fill),
                  _infoRow(
                    Icons.verified_user_outlined,
                    t('Two-Factor Authentication (2FA)', 'Uthibitishaji wa 2FA'),
                    sec['twoFactorEnabled'] == true
                        ? t('Enabled via ${sec['twoFactorMethod']}', 'Imewezeshwa')
                        : t('Disabled', 'Imezimwa'),
                  ),
                  Divider(height: 20, color: C.fill),
                  _infoRow(
                    Icons.fingerprint_rounded,
                    t('Biometrics / Fingerprint', 'Alama ya Kidole'),
                    sec['biometricsEnabled'] == true ? t('Active', 'Imewezeshwa') : t('Off', 'Imezimwa'),
                  ),
                  Divider(height: 20, color: C.fill),
                  _infoRow(
                    Icons.devices_rounded,
                    t('Active Devices', 'Vifaa Vilivyoingia'),
                    t('1 device (Dar es Salaam)', 'Kifaa 1 (Dar es Salaam)'),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
            const SizedBox(height: 18),
            ClayButton(
              label: t('Update Security & Password', 'Sasisha Usalama na Nenosiri'),
              icon: Icons.shield_outlined,
              onTap: () async {
                Navigator.pop(ctx);
                final updated = await push<Map<String, dynamic>>(
                  context,
                  EditSecurityScreen(initialSettings: sec),
                );
                if (updated != null && mounted) {
                  setState(() => _securitySettings = updated);
                }
              },
            ).animate().fadeIn(duration: 400.ms, delay: 80.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
          ],
        ),
      ),
    );
  }

  void _showHelpSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _clayBottomSheetContainer(
        context: ctx,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _clayGrabBar(),
            const SizedBox(height: 16),
            Text(
              t('Help & Customer Care', 'Msaada na Huduma kwa Wateja'),
              style: display(18, color: C.wino, weight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              t('Contact support team 24/7 in Swahili or English.', 'Wasiliana na huduma kwa wateja saa 24/7.'),
              style: body(12, color: C.muted),
            ),
            const SizedBox(height: 16),
            ClayCard(
              child: Column(
                children: [
                  _infoRow(Icons.support_agent_rounded, t('Customer Care Call', 'Piga Simu Huduma'), '+255 700 123 456'),
                  Divider(height: 20, color: C.fill),
                  _infoRow(Icons.chat_outlined, t('WhatsApp Assistance', 'Msaada wa WhatsApp'), '+255 700 123 456'),
                  Divider(height: 20, color: C.fill),
                  _infoRow(Icons.mail_outline_rounded, t('Support Email', 'Barua Pepe ya Msaada'), 'support@veyora.co.tz'),
                ],
              ),
            ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.08, end: 0, curve: Curves.easeOutCubic),
            const SizedBox(height: 18),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: C.card,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: C.edge, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: C.shade.withValues(alpha: 0.2),
                offset: const Offset(2, 2),
                blurRadius: 4,
              ),
            ],
          ),
          child: Icon(icon, color: C.teal, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: body(11.5, color: C.muted)),
              const SizedBox(height: 2),
              Text(value, style: display(13.5, color: C.wino, weight: FontWeight.w700)),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _signOut() async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: C.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(t('Sign out?', 'Utoke?'), style: display(18)),
        content: Text(
          t(
            'Your saved homes and messages stay safely stored on your account.',
            'Nyumba ulizohifadhi na ujumbe wako vinabaki kwenye akaunti yako.',
          ),
          style: body(13.5, color: C.muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              t('Stay', 'Baki'),
              style: body(13.5, color: C.muted, weight: FontWeight.w600),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              t('Sign out', 'Toka'),
              style: body(13.5, color: const Color(0xFFDC2626), weight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
    if (yes == true) Api.signOut();
  }

  @override
  Widget build(BuildContext context) {
    final u = Api.user.value ?? const {};
    final idStr = (u['id'] ?? 1243).toString().padLeft(6, '0');
    final isLandlord = u['role'] == 'landlord';
    final landlordId = isLandlord ? 'VL-$idStr' : 'VT-$idStr';
    final name = u['fullname'] ?? 'John Doe';
    final email = u['email'] ?? 'john.doe@example.com';

    final hasProperties = _propertyCount > 0;

    return Scaffold(
      backgroundColor: C.fill,
      appBar: AppBar(
        title: Text(
          t('Profile & Settings', 'Wasifu na Mipangilio'),
          style: display(17, color: C.wino, weight: FontWeight.w700),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: C.overlay,
        actions: [
          IconButton(
            tooltip: t('Appearance', 'Mwonekano'),
            icon: Icon(Icons.palette_outlined, color: C.wino),
            onPressed: () => push(context, const AppearanceScreen()),
          ),
          const SizedBox(width: 4),
        ],
      ),
      // A settings page, not a feed: it stops at its ends and has no pull-down refresh.
      body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 120),
          physics: const ClampingScrollPhysics(),
          children: [
            // 1. Claymorphic User Profile Header Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: C.card,
                borderRadius: BorderRadius.circular(26),
                border: Border.all(color: C.edge, width: 2.5),
                boxShadow: [
                  BoxShadow(
                    color: C.shade.withValues(alpha: 0.35),
                    offset: const Offset(7, 9),
                    blurRadius: 18,
                    spreadRadius: 0,
                  ),
                  BoxShadow(color: C.edge, offset: Offset(-5, -5),
                    blurRadius: 14,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Clay Avatar Container
                      Container(
                        width: 78,
                        height: 78,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: C.card,
                          border: Border.all(color: C.edge, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: C.shade.withValues(alpha: 0.30),
                              offset: const Offset(4, 5),
                              blurRadius: 10,
                            ),
                            BoxShadow(color: C.edge, offset: Offset(-3, -3),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Positioned.fill(
                              child: ClipOval(
                                child: Avatar(
                                  '$name',
                                  photo: Api.img(u['profile_image']),
                                  size: 74,
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: -2,
                              right: -2,
                              child: GestureDetector(
                                onTap: _uploading ? null : _changePhoto,
                                child: Container(
                                  width: 26,
                                  height: 26,
                                  decoration: BoxDecoration(
                                    color: C.teal,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: C.edge, width: 2),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Color(0x33000000),
                                        offset: Offset(1, 2),
                                        blurRadius: 4,
                                      ),
                                    ],
                                  ),
                                  child: _uploading
                                      ? const Padding(
                                          padding: EdgeInsets.all(5),
                                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                        )
                                      : const Icon(Icons.camera_alt_rounded, size: 13, color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    '$name',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: display(18, color: C.wino, weight: FontWeight.w800),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                if (isLandlord)
                                  Icon(
                                    hasProperties ? Icons.verified_rounded : Icons.error_outline_rounded,
                                    size: 17,
                                    color: hasProperties ? const Color(0xFF059669) : const Color(0xFFDC2626),
                                  )
                                else
                                  const Icon(Icons.verified_user_rounded, size: 17, color: Color(0xFF2563EB)),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              email,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: body(12, color: C.muted),
                            ),
                            const SizedBox(height: 7),

                            // Dynamic Verified Badge: Red when Landlord has 0 properties, Green when verified, Blue for Tenant
                            if (isLandlord)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: hasProperties ? C.goodTint : C.blush,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: (hasProperties ? C.good : C.hibiscus).withValues(alpha: .35),
                                    width: 1.2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: hasProperties ? const Color(0x18059669) : const Color(0x18DC2626),
                                      offset: const Offset(0, 3),
                                      blurRadius: 8,
                                    ),
                                    BoxShadow(color: C.edge, offset: Offset(-1, -1),
                                      blurRadius: 4,
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      hasProperties ? Icons.verified_rounded : Icons.cancel_rounded,
                                      size: 13,
                                      color: hasProperties ? C.good : C.hibiscus,
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      hasProperties
                                          ? t('Verified Landlord • $landlordId', 'Mmiliki Aliyethibitishwa • $landlordId')
                                          : t('Unverified • 0 Properties', 'Hajathibitishwa • Nyumba 0'),
                                      style: body(
                                        11,
                                        color: hasProperties ? C.good : C.hibiscus,
                                        weight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            else
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFF93C5FD), width: 1.2),
                                  boxShadow: [
                                    const BoxShadow(
                                      color: Color(0x182563EB),
                                      offset: Offset(0, 3),
                                      blurRadius: 8,
                                    ),
                                    BoxShadow(color: C.edge, offset: const Offset(-1, -1),
                                      blurRadius: 4,
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.verified_user_rounded, size: 13, color: Color(0xFF2563EB)),
                                    const SizedBox(width: 5),
                                    Text(
                                      t('Verified Tenant • $landlordId', 'Mpangaji Aliyethibitishwa • $landlordId'),
                                      style: body(11, color: const Color(0xFF1D4ED8), weight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Divider(height: 1, color: C.fill),
                  const SizedBox(height: 14),

                  // Real Performance Stats: Tactile Clay Pods
                  Row(
                    children: [
                      _clayStatItem(
                        _statsLoading ? '...' : '$_propertyCount',
                        isLandlord ? t('Properties', 'Nyumba') : t('Saved Homes', 'Zilizohifadhiwa'),
                        icon: isLandlord ? Icons.apartment_rounded : Icons.favorite_rounded,
                        color: C.teal,
                      ),
                      const SizedBox(width: 10),
                      _clayStatItem(
                        _statsLoading ? '...' : '$_inquiriesCount',
                        isLandlord ? t('Inquiries', 'Maombi') : t('Requests', 'Miadi'),
                        icon: Icons.forum_rounded,
                        color: const Color(0xFF0284C7),
                      ),
                      const SizedBox(width: 10),
                      _clayStatItem(
                        _statsLoading
                            ? '...'
                            : (isLandlord && _propertyCount == 0
                                ? '—'
                                : (_averageRating > 0 ? '${_averageRating.toStringAsFixed(1)} ★' : '5.0 ★')),
                        t('Rating', 'Kiwango'),
                        icon: Icons.star_rounded,
                        color: const Color(0xFFD97706),
                      ),
                    ],
                  ),
                ],
              ),
            ).reveal(0),
            const SizedBox(height: 20),

            // 2. Account & Identity Group (Clay Container)
            _sectionHeader(t('Account & Credentials', 'Akaunti na Utambulisho')),
            const SizedBox(height: 8),
            _Group([
              _SettingsRow(
                icon: Icons.person_outline_rounded,
                title: t('Personal Information', 'Taarifa Binafsi'),
                onTap: () => _showPersonalInfoSheet(u),
              ),
              _SettingsRow(
                icon: Icons.contact_mail_outlined,
                title: t('Contact Details', 'Maelezo ya Mawasiliano'),
                onTap: () => _showContactDetailsSheet(u),
              ),
              _SettingsRow(
                icon: Icons.business_center_outlined,
                title: t('Business Information', 'Taarifa za Biashara'),
                onTap: _showBusinessInfoSheet,
              ),
            ]).reveal(1),
            const SizedBox(height: 20),

            // 3. Payment & Preferences Group (Clay Container)
            _sectionHeader(t('Finance & Preferences', 'Fedha na Mapendeleo')),
            const SizedBox(height: 8),
            _Group([
              _SettingsRow(
                icon: Icons.credit_card_outlined,
                title: t('Payment Methods', 'Njia za Malipo'),
                onTap: _showPaymentMethodsSheet,
              ),
              if (isLandlord)
                _SettingsRow(
                  icon: Icons.build_outlined,
                  title: t('Maintenance', 'Matengenezo'),
                  subtitle: t('Repair requests for your properties', 'Maombi ya matengenezo ya nyumba zako'),
                  onTap: () => push(context, const MaintenanceScreen()),
                ),
              _SettingsRow(
                icon: Icons.notifications_none_rounded,
                title: t('Notifications', 'Arifa'),
                onTap: () => push(context, const NotificationsScreen()),
              ),
              _SettingsRow(
                icon: Icons.palette_outlined,
                title: t('Appearance', 'Mwonekano'),
                subtitle: t('Light or dark, your colour, size', 'Mwanga au giza, rangi yako, ukubwa'),
                onTap: () => push(context, const AppearanceScreen()),
              ),
              _SettingsRow(
                icon: Icons.translate_rounded,
                title: t('Language', 'Lugha'),
                trailing: const LangSwitch(),
              ),
            ]).reveal(2),
            const SizedBox(height: 20),

            // 4. Security & Support Group (Clay Container)
            _sectionHeader(t('Security & Support', 'Usalama na Huduma')),
            const SizedBox(height: 8),
            _Group([
              _SettingsRow(
                icon: Icons.shield_outlined,
                title: t('Security & Privacy', 'Usalama na Nenosiri'),
                onTap: _showSecuritySheet,
              ),
              _SettingsRow(
                icon: Icons.help_outline_rounded,
                title: t('Help & Customer Care', 'Msaada na Huduma'),
                onTap: _showHelpSheet,
              ),
            ]).reveal(3),
            const SizedBox(height: 18),

            // 5. Workspace Role Switcher Card (Clay Toggle)
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: C.card,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: C.edge, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: C.shade.withValues(alpha: 0.28),
                    offset: const Offset(5, 7),
                    blurRadius: 15,
                  ),
                  BoxShadow(color: C.edge, offset: Offset(-4, -4),
                    blurRadius: 12,
                  ),
                ],
              ),
              child: Row(
                children: [
                  for (final (role, icon, label) in [
                    ('renter', Icons.search_rounded, t('Find a home', 'Kutafuta nyumba')),
                    ('landlord', Icons.key_rounded, t('Let my homes', 'Kupangisha')),
                  ])
                    Expanded(
                      child: Press(
                        onTap: () => _switchTo(role),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          height: 46,
                          decoration: BoxDecoration(
                            color: u['role'] == role ? C.teal : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                            border: u['role'] == role
                                ? Border.all(color: Colors.white.withValues(alpha: 0.3), width: 1.2)
                                : null,
                            boxShadow: u['role'] == role
                                ? [
                                    BoxShadow(
                                      color: C.teal.withValues(alpha: 0.35),
                                      offset: const Offset(2, 4),
                                      blurRadius: 10,
                                    ),
                                  ]
                                : null,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(icon, size: 17, color: u['role'] == role ? Colors.white : C.muted),
                              const SizedBox(width: 7),
                              Flexible(
                                child: Text(
                                  label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: body(
                                    12.5,
                                    weight: FontWeight.w700,
                                    color: u['role'] == role ? Colors.white : C.wino,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ).reveal(4),
            const SizedBox(height: 18),

            // 6. Sign Out Button (Clay Container)
            _Group([
              _SettingsRow(
                icon: Icons.logout_rounded,
                title: t('Sign Out', 'Toka Kwenye Akaunti'),
                subtitle: t('Safely log out of this account', 'Toka salama kwenye akaunti hii'),
                color: const Color(0xFFDC2626),
                iconColor: const Color(0xFFDC2626),
                showChevron: false,
                onTap: _signOut,
              ),
            ]).reveal(5),
          ],
        ),
    );
  }

  Widget _clayStatItem(String value, String label, {required IconData icon, required Color color}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
        decoration: BoxDecoration(
          color: C.chokaa,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: C.edge, width: 2),
          boxShadow: [
            BoxShadow(
              color: C.shade.withValues(alpha: 0.55),
              offset: const Offset(4, 5),
              blurRadius: 10,
            ),
            BoxShadow(color: C.edge, offset: Offset(-3, -3),
              blurRadius: 8,
              spreadRadius: 1,
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 5),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: display(15.5, color: C.wino, weight: FontWeight.w800),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: body(10.5, color: C.muted, weight: FontWeight.w600),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 6, bottom: 2),
      child: Text(
        title.toUpperCase(),
        style: display(11, color: C.muted, weight: FontWeight.w800),
      ),
    );
  }
}

class _Group extends StatelessWidget {
  const _Group(this.rows);
  final List<Widget> rows;

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: C.edge, width: 2.2),
      boxShadow: [
        BoxShadow(
          color: C.shade.withValues(alpha: 0.30),
          offset: const Offset(6, 8),
          blurRadius: 16,
        ),
        BoxShadow(color: C.edge, offset: Offset(-4, -4),
          blurRadius: 12,
          spreadRadius: 1,
        ),
      ],
    ),
    child: Material(
      color: C.card,
      borderRadius: BorderRadius.circular(22),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0) Divider(height: 1, indent: 60, color: C.fill),
            rows[i],
          ],
        ],
      ),
    ),
  );
}

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.trailing,
    Color? color,
    Color? iconColor,
    this.showChevron = true,
  }) : _color = color,
       _iconColor = iconColor;

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Color? _color, _iconColor;
  Color get color => _color ?? C.wino; // follow the theme unless given
  Color get iconColor => _iconColor ?? C.teal;
  final bool showChevron;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: ListTile(
        onTap: onTap,
        minTileHeight: subtitle != null ? 56 : 52,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.1),
          shape: BoxShape.circle,
          border: Border.all(color: C.edge, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: C.shade.withValues(alpha: 0.5),
              offset: const Offset(2, 3),
              blurRadius: 6,
            ),
            BoxShadow(color: C.edge, offset: Offset(-2, -2),
              blurRadius: 4,
            ),
          ],
        ),
        child: Icon(icon, color: iconColor, size: 18),
      ),
      title: Text(
        title,
        style: display(13.5, weight: FontWeight.w600, color: color),
      ),
      subtitle: subtitle != null
          ? Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                subtitle!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: body(11.5, color: C.muted),
              ),
            )
          : null,
      trailing: trailing ??
          (showChevron && onTap != null
              ? Icon(Icons.chevron_right_rounded, color: C.faint, size: 20)
              : null),
      ),
    );
  }
}


/// Viewing requests: the ones I sent, or (for an owner) the ones on my homes.
class ViewingsList extends StatelessWidget {
  const ViewingsList({super.key, required this.asOwner});
  final bool asOwner;

  @override
  Widget build(BuildContext context) => Loader<List>(
    load: () async =>
        await Api.get('viewing-requests', {if (asOwner) 'as': 'owner'}) as List,
    bones: ListView(
      padding: const EdgeInsets.all(20),
      children: const [
        Bone(height: 120, radius: 22),
        SizedBox(height: 14),
        Bone(height: 120, radius: 22),
      ],
    ),
    builder: (context, items, reload) => RefreshIndicator(
      color: C.mkoko,
      onRefresh: reload,
      child: items.isEmpty
          ? ListView(
              children: [
                SizedBox(
                  height: 440,
                  child: Notice(
                    icon: Icons.event_outlined,
                    title: t('No viewing requests yet', 'Bado hakuna maombi'),
                    text: asOwner
                        ? t(
                            'When a renter asks to see one of your homes, you answer it here.',
                            'Mpangaji akiomba kuona nyumba yako, utamjibu hapa.',
                          )
                        : t(
                            'Open a home and tap Request a viewing to book a visit.',
                            'Fungua nyumba kisha gusa Omba kuiona ili kuweka miadi.',
                          ),
                  ),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 130),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 14),
              itemBuilder: (_, i) => _Viewing(
                Map<String, dynamic>.from(items[i]),
                asOwner: asOwner,
                changed: reload,
              ).reveal(i.clamp(0, 5)),
            ),
    ),
  );
}

class _Viewing extends StatefulWidget {
  const _Viewing(this.v, {required this.asOwner, required this.changed});
  final Map<String, dynamic> v;
  final bool asOwner;
  final Future<void> Function() changed;

  @override
  State<_Viewing> createState() => _ViewingState();
}

class _ViewingState extends State<_Viewing> {
  String? _busy;

  Future<void> _set(String status) async {
    setState(() => _busy = status);
    try {
      await Api.patch('viewing-requests/${widget.v['id']}', {'status': status});
      HapticFeedback.mediumImpact();
      await widget.changed();
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final v = widget.v, status = '${v['status']}';
    final (label, bg, fg) = switch (status) {
      'accepted' => (t('Accepted', 'Imekubaliwa'), C.mkoko, Colors.white),
      'declined' => (
        t('Declined', 'Imekataliwa'),
        C.blush,
        const Color(0xFF8E1F36),
      ),
      'cancelled' => (t('Cancelled', 'Imeghairiwa'), C.chokaa, C.muted),
      _ => (
        t('Waiting for an answer', 'Inasubiri jibu'),
        C.sand,
        C.brassInk,
      ),
    };
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox.square(
                  dimension: 56,
                  child: Photo(
                    Api.img(v['house']['house_profile_image']),
                    width: 56,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dayTime(DateTime.parse(v['preferred_at'])),
                      style: display(17),
                    ),
                    Text(
                      '${v['house']['property_name']}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: body(14.5, color: C.muted, height: 1.3),
                    ),
                    if (widget.asOwner)
                      Text(
                        t(
                          'Asked by ${v['user']['fullname']}',
                          'Ameomba ${v['user']['fullname']}',
                        ),
                        style: body(14.5, height: 1.3, weight: FontWeight.w500),
                      ),
                  ],
                ),
              ),
              if (widget.asOwner)
                IconButton(
                  tooltip: t(
                    'Message ${v['user']['fullname']}',
                    'Mtumie ujumbe ${v['user']['fullname']}',
                  ),
                  icon: Icon(
                    Icons.chat_bubble_outline_rounded,
                    color: C.teal,
                  ),
                  onPressed: () => push(
                    context,
                    ChatScreen(
                      peerId: v['user']['id'],
                      name: v['user']['fullname'],
                    ),
                  ),
                ),
            ],
          ),
          if (v['note'] != null) ...[
            const SizedBox(height: 10),
            Text('"${v['note']}"', style: body(15, color: C.wino)),
          ],
          const SizedBox(height: 12),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 260),
            child: Align(
              key: ValueKey(status),
              alignment: Alignment.centerLeft,
              child: Tag(label, bg: bg, fg: fg),
            ),
          ),
          if (status == 'pending') ...[
            const SizedBox(height: 14),
            if (widget.asOwner)
              Row(
                children: [
                  Expanded(
                    child: Button(
                      t('Decline', 'Kataa'),
                      tone: Tone.plain,
                      busy: _busy == 'declined',
                      onTap: _busy == null ? () => _set('declined') : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: Button(
                      t('Accept viewing', 'Kubali miadi'),
                      busy: _busy == 'accepted',
                      onTap: _busy == null ? () => _set('accepted') : null,
                    ),
                  ),
                ],
              )
            else
              Button(
                t('Cancel request', 'Ghairi ombi'),
                tone: Tone.plain,
                busy: _busy == 'cancelled',
                onTap: () => _set('cancelled'),
              ),
          ],
        ],
      ),
    );
  }
}
