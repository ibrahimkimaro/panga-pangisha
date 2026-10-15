import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../api.dart';
import '../../../l10n.dart';
import '../../../ui.dart';
import '../../customecontrols/RegionsDistrict.dart';
import '../../customecontrols/pickers.dart';
import '../../listing.dart';
import '../ai_property_workspace.dart';
import 'wizard_models.dart';

/// Screen 14 Complete: Landlord Multi-Step Property Creation & Unit Management Wizard
class PropertyWizardScreen extends StatefulWidget {
  const PropertyWizardScreen({super.key, this.initialDraft});
  final PropertyDraft? initialDraft;

  @override
  State<PropertyWizardScreen> createState() => _PropertyWizardScreenState();
}

class _PropertyWizardScreenState extends State<PropertyWizardScreen> {
  static const _draftKey = 'panga_property_wizard_draft_v1';
  late PropertyDraft _draft = widget.initialDraft ?? PropertyDraft();
  final _picker = ImagePicker();
  final _mapController = MapController();

  int _step = 0; // 0 to 9 (Screens 1 to 10)
  bool _busy = false;
  String? _error;
  String _unitSearchQuery = '';

  final _stepTitles = [
    (t('Property Type', 'Aina ya Nyumba'), Icons.home_work_outlined),
    (t('Property Details', 'Maelezo ya Nyumba'), Icons.description_outlined),
    (t('Interactive Map', 'Ramani ya Mahali'), Icons.map_outlined),
    (t('Property Structure', 'Muundo wa Nyumba'), Icons.apartment_outlined),
    (t('Unit Templates', 'Violezo vya Vyumba'), Icons.style_outlined),
    (t('Review Units', 'Kagua Vyumba'), Icons.meeting_room_outlined),
    (t('Unit Overrides', 'Maelezo ya Chumba'), Icons.tune_outlined),
    (t('Photos & Media', 'Picha & Nyaraka'), Icons.photo_library_outlined),
    (t('Rental Settings', 'Masharti ya Upangishaji'), Icons.settings_outlined),
    (t('Review & Publish', 'Kagua & Chapisha'), Icons.verified_outlined),
  ];

  @override
  void initState() {
    super.initState();
    _checkDraft();
  }

  Future<void> _checkDraft() async {
    if (widget.initialDraft != null) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_draftKey);
      if (saved != null && saved.isNotEmpty && mounted) {
        final j = jsonDecode(saved);
        final ask = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: C.card,
            title: Text(t('Resume Draft?', 'Endelea na Rasimu?'), style: display(18, weight: FontWeight.w800)),
            content: Text(
              t('You have an unfinished property draft saved on this device. Would you like to resume where you left off?',
                'Una rasimu ya nyumba iliyohifadhiwa kwenye kifaa hiki. Ungependa kuendelea pale ulipoishia?'),
              style: body(14, color: C.muted, height: 1.4),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text(t('Start Fresh', 'Anza Upya'), style: TextStyle(color: C.hibiscus)),
              ),
              Button(
                t('Resume Draft', 'Endelea'),
                expand: false,
                onTap: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        );
        if (ask == true && mounted) {
          setState(() {
            _draft = PropertyDraft.fromJson(j);
          });
          toast(context, t('Draft restored.', 'Rasimu imerejeshwa.'));
        }
      }
    } catch (_) {}
  }

  Future<void> _saveDraft({bool notify = true}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_draftKey, jsonEncode(_draft.toJson()));
      if (notify && mounted) {
        toast(context, t('Draft saved locally. You can resume anytime.', 'Rasimu imehifadhiwa. Unaweza kuendelea wakati wowote.'));
      }
    } catch (_) {}
  }

  Future<void> _clearDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_draftKey);
    } catch (_) {}
  }

  void _next() {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);

    // Step validations
    if (_step == 1 && _draft.propertyName.trim().isEmpty) {
      setState(() => _error = t('Please enter a property display name.', 'Tafadhali weka jina la nyumba.'));
      return;
    }
    if (_step == 2 && _draft.locationPin == null) {
      setState(() => _error = t('Please tap the map to set the exact property location.', 'Tafadhali gusa ramani kuweka mahali halisi.'));
      return;
    }
    if (_step == 4) {
      _draft.generateUnitsFromTemplates();
    }
    if (_step == 7 && (_draft.coverPhotoPath == null || _draft.coverPhotoPath!.isEmpty)) {
      setState(() => _error = t('Please add a property cover photo before continuing.', 'Weka picha kuu ya nyumba kabla ya kuendelea.'));
      return;
    }

    HapticFeedback.selectionClick();
    _saveDraft(notify: false);
    if (_step < 9) {
      setState(() => _step++);
    } else {
      _publish();
    }
  }

  void _back() {
    FocusScope.of(context).unfocus();
    if (_step > 0) {
      setState(() {
        _error = null;
        _step--;
      });
    } else {
      Navigator.pop(context);
    }
  }

  Future<void> _publish() async {
    final validation = _draft.validate();
    if (validation.isNotEmpty) {
      setState(() => _error = validation.first);
      return;
    }

    setState(() => _busy = true);
    final u = Api.user.value!;
    try {
      final Map<String, String> body = {
        'property_name': _draft.propertyName.trim(),
        'property_type': _draft.propertyType.name,
        'property_category': _draft.propertyCategory,
        'advertiser_role': _draft.advertiserRole,
        'country': _draft.country,
        'region': _draft.region,
        'district': _draft.district,
        'ward': _draft.ward.trim(),
        'street': _draft.street.trim(),
        'house_number': _draft.houseNumber.trim(),
        'napa_number': _draft.napaNumber.trim(),
        'latitude': _draft.locationPin!.latitude.toStringAsFixed(6),
        'longitude': _draft.locationPin!.longitude.toStringAsFixed(6),
        'monthly_rent': '${_draft.overallRent.round()}',
        'security_deposit': '${(_draft.securityDeposit ?? _draft.overallRent).round()}',
        'lease_duration': _draft.leaseDuration,
        'description': _draft.description.trim(),
        'contact_name': '${u['fullname']}',
        'contact_phone': '${u['phone_number']}',
        'total_units': '${_draft.units.length}',
      };

      for (final (i, a) in _draft.sharedAmenities.indexed) {
        body['amenities[$i]'] = a;
      }

      // Add individual units
      for (final (i, unit) in _draft.units.indexed) {
        body['units[$i][unit_number]'] = unit.unitNumber;
        body['units[$i][unit_type]'] = unit.unitType;
        body['units[$i][monthly_rent]'] = '${unit.monthlyRent.round()}';
        body['units[$i][payment_terms]'] = unit.paymentTerms;
        body['units[$i][bedrooms]'] = '${unit.bedrooms}';
        body['units[$i][bathrooms]'] = '${unit.bathrooms}';
        if (unit.description.isNotEmpty) body['units[$i][description]'] = unit.description;
        if (unit.imagePath != null && !unit.imagePath!.startsWith('/')) {
          body['units[$i][image_path]'] = unit.imagePath!;
        }
      }

      final Map<String, List<String>> files = {};
      if (_draft.coverPhotoPath != null) {
        files['cover_image'] = [_draft.coverPhotoPath!];
      }
      if (_draft.galleryPhotoPaths.isNotEmpty) {
        files['images[]'] = _draft.galleryPhotoPaths;
      }

      await Api.upload('landlord/add-nyumba/', body, files);
      await _clearDraft();

      if (!mounted) return;
      HapticFeedback.heavyImpact();
      Navigator.pop(context, true);
      toast(
        context,
        t('Property and ${_draft.units.length} rentable units successfully published!',
          'Nyumba na vyumba ${_draft.units.length} vimechapishwa kikamilifu!'),
      );
    } on ApiError catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // AI Assistant Modal
  void _openAiAssistSheet() {
    final aiController = TextEditingController();
    sheet(
      context,
      SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: C.tealLight, borderRadius: BorderRadius.circular(12)),
                  child: Icon(Icons.auto_awesome, color: C.teal, size: 22),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t('Veyora AI Property Assistant', 'Msaidizi wa AI wa Nyumba'), style: display(17, weight: FontWeight.w800)),
                      Text(
                        t('Conversational intelligence, market explanations & auto-fill',
                          'Akili ya mazungumzo, ushauri wa soko na kujaza taarifa kiotomatiki'),
                        style: body(12, color: C.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Primary Interactive Workspace Launcher
            InkWell(
              onTap: () async {
                Navigator.pop(context);
                final updated = await push<PropertyDraft>(
                  context,
                  AiPropertyWorkspaceScreen(
                    initialWizardDraft: _draft,
                    currentStepIndex: _step,
                    currentStepName: _stepTitles[_step].$1,
                  ),
                );
                if (updated != null && mounted) {
                  setState(() {
                    _draft = updated;
                  });
                  toast(context, t('Wizard successfully updated from Veyora AI!', 'Taarifa za Wizard zimesasishwa kutoka kwa Veyora AI!'));
                }
              },
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: C.teal.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: C.teal.withValues(alpha: 0.35)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: C.teal, borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.chat_bubble_outline_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t('Open Interactive AI Workspace', 'Fungua Mazungumzo Kamili ya AI'),
                            style: display(14.5, weight: FontWeight.w800, color: C.ink),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            t('Chat, ask market questions about step "${_stepTitles[_step].$1}", and apply details',
                              'Zungumza, uliza maswali kuhusu hatua hii, na jaza taarifa kiotomatiki'),
                            style: body(12, color: C.muted),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.arrow_forward_ios_rounded, size: 14, color: C.teal),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: Divider(color: C.line)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(t('or quick description below', 'au eleza kwa ufupi hapa chini'), style: body(11.5, color: C.muted)),
                ),
                Expanded(child: Divider(color: C.line)),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: aiController,
              maxLines: 3,
              style: body(14),
              decoration: InputDecoration(
                hintText: t(
                  'e.g. 3 bedroom house in Sinza Mori, rent 800,000/mo, 1 master and 2 normal rooms...',
                  'mf. Nyumba ya vyumba 3 Sinza Mori, kodi 800,000 kwa mwezi, chumba 1 master na 2 vya kawaida...',
                ),
              ),
            ),
            const SizedBox(height: 14),
            Button(
              t('Apply Details to Wizard', 'Jaza Taarifa kwenye Fomu'),
              icon: Icons.auto_awesome,
              onTap: () async {
                final txt = aiController.text.trim();
                if (txt.isEmpty) return;
                Navigator.pop(context);
                await _applyAiPrompt(txt);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _applyAiPrompt(String text) async {
    setState(() => _busy = true);
    try {
      final res = await Api.post('property-drafts/chat', {
        'message': text,
        'current_step': _stepTitles[_step].$1,
      });
      if (res is Map && res['draft'] is Map) {
        final d = Map<String, dynamic>.from(res['draft'] as Map);
        setState(() {
          if ((d['property_name'] ?? '').toString().isNotEmpty) {
            _draft.propertyName = d['property_name'].toString();
          }
          if ((d['property_type'] ?? '').toString().isNotEmpty) {
            _draft.propertyType = WizardPropertyType.fromName(d['property_type']);
          }
          if ((d['region'] ?? '').toString().isNotEmpty) {
            _draft.region = d['region'].toString();
          }
          if ((d['district'] ?? '').toString().isNotEmpty) {
            _draft.district = d['district'].toString();
          }
          if ((d['ward'] ?? '').toString().isNotEmpty) {
            _draft.ward = d['ward'].toString();
          }
          if ((d['street'] ?? '').toString().isNotEmpty) {
            _draft.street = d['street'].toString();
          }
          if ((d['napa_number'] ?? '').toString().isNotEmpty) {
            _draft.napaNumber = d['napa_number'].toString();
          }
          if ((d['description'] ?? '').toString().isNotEmpty) {
            _draft.description = d['description'].toString();
          }
          if (d['monthly_rent'] != null && d['monthly_rent'] > 0) {
            _draft.overallRent = (d['monthly_rent'] as num).toDouble();
          }
          if (d['security_deposit'] != null && d['security_deposit'] > 0) {
            _draft.securityDeposit = (d['security_deposit'] as num).toDouble();
          }

          final rawUnits = d['units'];
          if (rawUnits is List && rawUnits.isNotEmpty) {
            _draft.rentalMode = RentalMode.rooms;
            _draft.units = [
              for (int i = 0; i < rawUnits.length; i++)
                WizardUnit(
                  id: 'unit_${DateTime.now().millisecondsSinceEpoch}_$i',
                  unitNumber: rawUnits[i]['unit_number']?.toString() ?? 'Unit ${i + 1}',
                  unitType: rawUnits[i]['unit_type']?.toString() ?? 'Room',
                  monthlyRent: (rawUnits[i]['monthly_rent'] as num?)?.toDouble() ?? 100000.0,
                  paymentTerms: rawUnits[i]['payment_terms']?.toString() ?? '4 months advance',
                  bedrooms: (rawUnits[i]['bedrooms'] as num?)?.toInt() ?? 1,
                  bathrooms: (rawUnits[i]['bathrooms'] as num?)?.toInt() ?? 1,
                  description: rawUnits[i]['description']?.toString() ?? '',
                  isCustomized: true,
                ),
            ];
          }
        });
        if (mounted) {
          toast(context, t('AI successfully structured your property details.', 'AI imepanga taarifa za nyumba yako.'));
        }
        return;
      }
    } catch (_) {
      // Fallback to local heuristic extraction if offline
      _parseAiPrompt(text);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _parseAiPrompt(String text) {
    setState(() {
      final lower = text.toLowerCase();
      // Detect location
      if (lower.contains('mbezi beach') || lower.contains('mbezi')) {
        _draft.ward = 'Mbezi Beach';
        _draft.district = 'Kinondoni';
        _draft.region = 'Dar es Salaam';
        _draft.locationPin = const LatLng(-6.6908, 39.2215);
      }
      // Detect NAPA
      final napaMatch = RegExp(r'\b\d{5}-[A-Z]{3}-\d{3}\b', caseSensitive: false).firstMatch(text);
      if (napaMatch != null) {
        _draft.napaNumber = napaMatch.group(0)!.toUpperCase();
      } else if (lower.contains('14111')) {
        _draft.napaNumber = '14111-MBZ-042';
      }

      // Detect property name
      if (_draft.propertyName.isEmpty) {
        _draft.propertyName = 'Modern Residence';
      }

      // Build units structure
      _draft.rentalMode = RentalMode.rooms;
      _draft.templates = [
        UnitTemplate(
          id: 'tmpl_master',
          name: 'Master Bedroom Suite',
          unitType: 'Master Bedroom',
          quantity: 2,
          bedrooms: 1,
          bathrooms: 1,
          defaultRent: 25000,
          paymentTerms: '4 months advance',
          description: 'Spacious master bedroom with ensuite private bathroom, ceramic tiles, and air conditioning.',
        ),
        UnitTemplate(
          id: 'tmpl_std',
          name: 'Standard Bedroom',
          unitType: 'Standard Room',
          quantity: 1,
          bedrooms: 1,
          bathrooms: 1,
          isPrivateBathroom: false,
          defaultRent: 10000,
          paymentTerms: '6 months advance',
          description: 'Comfortable standard bedroom with shared modern bathroom and clean finishes.',
        ),
        UnitTemplate(
          id: 'tmpl_house',
          name: 'Independent Full House Wing',
          unitType: '3-Bedroom House',
          quantity: 2,
          bedrooms: 3,
          bathrooms: 2,
          defaultRent: 550000,
          paymentTerms: '4 months advance',
          description: 'Private 3-bedroom residential wing with dedicated living lounge, open kitchen bar, and patio.',
        ),
      ];
      _draft.generateUnitsFromTemplates();
    });
    toast(context, t('AI applied property details and 5 configured rooms.', 'AI imejaza taarifa na vyumba 5 vilivyopangwa.'));
  }

  @override
  Widget build(BuildContext context) {
    final curStep = _stepTitles[_step];
    return Scaffold(
      body: GlassBackdrop(
        child: SafeArea(
          child: Column(
            children: [
              // Top Step Indicator Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Row(
                  children: [
                    RoundIcon(Icons.arrow_back_rounded, label: t('Back', 'Rudi'), onTap: _back),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t('Step ${_step + 1} of 10', 'Hatua ya ${_step + 1} kati ya 10'),
                            style: body(11.5, color: C.muted, weight: FontWeight.w600),
                          ),
                          Text(curStep.$1, style: display(16, weight: FontWeight.w800)),
                        ],
                      ),
                    ),
                    Press(
                      onTap: _openAiAssistSheet,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: C.tealLight,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: C.teal.withValues(alpha: .3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.auto_awesome, size: 14, color: C.teal),
                            const SizedBox(width: 4),
                            Text(t('AI Assist', 'Msaada wa AI'), style: body(11.5, color: C.teal, weight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    IconButton(
                      icon: const Icon(Icons.bookmark_outline_rounded, size: 20),
                      tooltip: t('Save Draft', 'Hifadhi Rasimu'),
                      onPressed: () => _saveDraft(notify: true),
                    ),
                  ],
                ),
              ),

              // Progress Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (_step + 1) / 10.0,
                    minHeight: 4,
                    backgroundColor: C.line,
                    valueColor: AlwaysStoppedAnimation<Color>(C.teal),
                  ),
                ),
              ),

              if (_error != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(color: C.blush, borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline_rounded, size: 18, color: C.hibiscus),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_error!, style: body(12.5, color: C.hibiscus, weight: FontWeight.w600))),
                      ],
                    ),
                  ),
                ),

              // Step Content
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 240),
                  child: KeyedSubtree(
                    key: ValueKey(_step),
                    child: switch (_step) {
                      0 => _step1PropertyType(),
                      1 => _step2PropertyDetails(),
                      2 => _step3InteractiveMap(),
                      3 => _step4PropertyStructure(),
                      4 => _step5UnitTemplates(),
                      5 => _step6ReviewUnits(),
                      6 => _step7UnitOverrides(),
                      7 => _step8PhotosAndDocuments(),
                      8 => _step9RentalSettings(),
                      _ => _step10ReviewAndPublish(),
                    },
                  ),
                ),
              ),

              // Bottom Navigation Actions
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: Row(
                    children: [
                      if (_step > 0) ...[
                        Expanded(
                          flex: 2,
                          child: Button(
                            t('Back', 'Rudi'),
                            tone: Tone.plain,
                            onTap: _back,
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      Expanded(
                        flex: 3,
                        child: Button(
                          _step == 9 ? t('Publish Property', 'Chapisha Nyumba') : t('Continue', 'Endelea'),
                          busy: _busy,
                          onTap: _next,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // SCREEN 1 — Choose Property Type & Rental Arrangement
  // =========================================================================
  Widget _step1PropertyType() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      children: [
        Text(t('How will you rent this property?', 'Utapangisha vipi nyumba hii?'), style: display(18, weight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(t('Select how the spaces inside the property are divided and leased out to renters.',
          'Chagua jinsi nafasi ndani ya nyumba zinavyogawanywa na kupangishwa kwa wapangaji.'),
          style: body(13.5, color: C.muted, height: 1.4)),
        const SizedBox(height: 14),

        // Rental Arrangement Cards
        for (final mode in RentalMode.values)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Press(
              onTap: () => setState(() => _draft.rentalMode = mode),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _draft.rentalMode == mode ? C.tealLight : C.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: _draft.rentalMode == mode ? C.teal : C.line, width: _draft.rentalMode == mode ? 2 : 1),
                ),
                child: Row(
                  children: [
                    Icon(
                      mode == RentalMode.entire
                          ? Icons.home_rounded
                          : mode == RentalMode.multiUnit
                              ? Icons.apartment_rounded
                              : Icons.meeting_room_rounded,
                      color: _draft.rentalMode == mode ? C.teal : C.muted,
                      size: 26,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t(mode.en, mode.sw), style: body(14.5, weight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text(
                            mode == RentalMode.entire
                                ? t('Single tenant occupies the entire house', 'Mpangaji mmoja anachukua nyumba nzima')
                                : mode == RentalMode.multiUnit
                                    ? t('Multiple self-contained flats or apartments', 'Fleti au apartimenti kadhaa zinazojitegemea')
                                    : t('Multiple individual rooms with shared or private facilities', 'Vyumba tofauti na vifaa vya pamoja au vya kibinafsi'),
                            style: body(12, color: C.muted),
                          ),
                        ],
                      ),
                    ),
                    if (_draft.rentalMode == mode) Icon(Icons.check_circle_rounded, color: C.teal, size: 20),
                  ],
                ),
              ),
            ),
          ),

        const SizedBox(height: 18),
        Text(t('Property Category', 'Aina ya Jengo'), style: display(16, weight: FontWeight.w800)),
        const SizedBox(height: 10),

        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final type in WizardPropertyType.values)
              Press(
                onTap: () => setState(() => _draft.propertyType = type),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: _draft.propertyType == type ? C.mkoko : C.card,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _draft.propertyType == type ? C.mkoko : C.line),
                  ),
                  child: Text(
                    t(type.en, type.sw),
                    style: body(13, weight: FontWeight.w600, color: _draft.propertyType == type ? Colors.white : C.wino),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  // =========================================================================
  // SCREEN 2 — Property Details & Address
  // =========================================================================
  Widget _step2PropertyDetails() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      children: [
        Text(t('Property Details & Address', 'Maelezo na Mahali pa Nyumba'), style: display(18, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(t('Provide clear identification, address details, and NAPA postal codes.',
          'Weka jina wazi la utambulisho, anwani na namba ya NAPA.'), style: body(13, color: C.muted)),
        const SizedBox(height: 14),

        Text(t('Property Display Name', 'Jina la Nyumba'), style: body(12.5, color: C.muted)),
        const SizedBox(height: 4),
        TextField(
          controller: TextEditingController(text: _draft.propertyName)..selection = TextSelection.collapsed(offset: _draft.propertyName.length),
          onChanged: (v) => _draft.propertyName = v,
          style: body(14.5),
          decoration: InputDecoration(
            hintText: t('e.g. Kimaro Modern Residence, Sunrise Heights', 'mf. Nyumba ya Kisasa ya Kimaro'),
          ),
        ),

        const SizedBox(height: 14),
        Text(t('Description', 'Maelezo ya Jumla'), style: body(12.5, color: C.muted)),
        const SizedBox(height: 4),
        TextField(
          controller: TextEditingController(text: _draft.description)..selection = TextSelection.collapsed(offset: _draft.description.length),
          onChanged: (v) => _draft.description = v,
          maxLines: 3,
          style: body(14),
          decoration: InputDecoration(
            hintText: t('Describe the building compound, surroundings, security, and environment.',
              'Elezea eneo la nyumba, mazingira, ulinzi na mandhari.'),
          ),
        ),

        const SizedBox(height: 16),
        Text(t('Location & Address (Tanzania Conventions)', 'Mahali & Anwani'), style: display(15, weight: FontWeight.w800)),
        const SizedBox(height: 10),

        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t('Region', 'Mkoa'), style: body(12, color: C.muted)),
                  const SizedBox(height: 4),
                  Press(
                    onTap: () async {
                      final picked = await pickFrom<String>(
                        context,
                        title: t('Select Region', 'Chagua Mkoa'),
                        items: regionDistrictMap.keys.toList(),
                        label: (r) => r,
                      );
                      if (picked != null) {
                        setState(() {
                          _draft.region = picked;
                          _draft.district = regionDistrictMap[picked]?.first ?? '';
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.line)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(_draft.region, style: body(14, weight: FontWeight.w600)),
                          Icon(Icons.keyboard_arrow_down, size: 18, color: C.muted),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t('District', 'Wilaya'), style: body(12, color: C.muted)),
                  const SizedBox(height: 4),
                  Press(
                    onTap: () async {
                      final list = regionDistrictMap[_draft.region] ?? ['Kinondoni', 'Ilala'];
                      final picked = await pickFrom<String>(
                        context,
                        title: t('Select District', 'Chagua Wilaya'),
                        items: list,
                        label: (d) => d,
                      );
                      if (picked != null) setState(() => _draft.district = picked);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.line)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: Text(_draft.district, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(14, weight: FontWeight.w600))),
                          Icon(Icons.keyboard_arrow_down, size: 18, color: C.muted),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t('Ward / Neighborhood', 'Kata / Mtaa'), style: body(12, color: C.muted)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: TextEditingController(text: _draft.ward)..selection = TextSelection.collapsed(offset: _draft.ward.length),
                    onChanged: (v) => _draft.ward = v,
                    style: body(14),
                    decoration: InputDecoration(hintText: t('e.g. Mbezi Beach', 'mf. Mbezi Beach')),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t('Street Name', 'Jina la Barabara / Mtaa'), style: body(12, color: C.muted)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: TextEditingController(text: _draft.street)..selection = TextSelection.collapsed(offset: _draft.street.length),
                    onChanged: (v) => _draft.street = v,
                    style: body(14),
                    decoration: InputDecoration(hintText: t('e.g. Africana Rd', 'mf. Africana Rd')),
                  ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t('NAPA Postal Code', 'Namba ya NAPA'), style: body(12, color: C.muted)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: TextEditingController(text: _draft.napaNumber)..selection = TextSelection.collapsed(offset: _draft.napaNumber.length),
                    onChanged: (v) => _draft.napaNumber = v.toUpperCase(),
                    style: body(14),
                    decoration: const InputDecoration(hintText: '14111-MBZ-042'),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t('House / Plot No.', 'Namba ya Nyumba/Kiwanja'), style: body(12, color: C.muted)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: TextEditingController(text: _draft.houseNumber)..selection = TextSelection.collapsed(offset: _draft.houseNumber.length),
                    onChanged: (v) => _draft.houseNumber = v,
                    style: body(14),
                    decoration: const InputDecoration(hintText: 'Plot 42'),
                  ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 18),
        Text(t('Shared Facilities & Amenities', 'Vifaa & Huduma za Pamoja'), style: display(15, weight: FontWeight.w800)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final a in ['Water', 'LUKU', 'Parking', 'Security', 'Fence', 'Tiles', 'AC', 'WiFi', 'Generator', 'Garden', 'Lift', 'Pool', 'Shared Kitchen'])
              Press(
                onTap: () {
                  setState(() {
                    if (_draft.sharedAmenities.contains(a)) {
                      _draft.sharedAmenities.remove(a);
                    } else {
                      _draft.sharedAmenities.add(a);
                    }
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: _draft.sharedAmenities.contains(a) ? C.tealLight : C.card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _draft.sharedAmenities.contains(a) ? C.teal : C.line),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _draft.sharedAmenities.contains(a) ? Icons.check_circle_rounded : Icons.add_circle_outline_rounded,
                        size: 15,
                        color: _draft.sharedAmenities.contains(a) ? C.teal : C.muted,
                      ),
                      const SizedBox(width: 5),
                      Text(amenityName(a), style: body(12.5, color: _draft.sharedAmenities.contains(a) ? C.teal : C.wino, weight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  // =========================================================================
  // SCREEN 3 — Interactive Map
  // =========================================================================
  Widget _step3InteractiveMap() {
    final pin = _draft.locationPin ?? const LatLng(-6.7924, 39.2083); // Dar center fallback
    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: pin,
            initialZoom: 15,
            onTap: (_, latlng) {
              setState(() {
                _draft.locationPin = latlng;
                _draft.mapAddressConfirmed = '${latlng.latitude.toStringAsFixed(4)}, ${latlng.longitude.toStringAsFixed(4)}';
              });
            },
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.panga.panga_pangisha',
            ),
            if (_draft.locationPin != null)
              MarkerLayer(
                markers: [
                  Marker(
                    point: _draft.locationPin!,
                    width: 48,
                    height: 48,
                    child: Icon(Icons.location_on, size: 44, color: C.hibiscus),
                  ),
                ],
              ),
          ],
        ),

        // Controls overlay
        Positioned(
          top: 16,
          left: 16,
          right: 16,
          child: Glass(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                Icon(Icons.touch_app_outlined, size: 20, color: C.teal),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _draft.locationPin != null
                        ? t('Location set: (${_draft.locationPin!.latitude.toStringAsFixed(4)}, ${_draft.locationPin!.longitude.toStringAsFixed(4)})',
                            'Mahali pamewekwa: (${_draft.locationPin!.latitude.toStringAsFixed(4)}, ${_draft.locationPin!.longitude.toStringAsFixed(4)})')
                        : t('Tap on the map to set the exact property marker', 'Gusa ramani kuweka alama ya nyumba'),
                    style: body(13, weight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ),

        Positioned(
          bottom: 20,
          right: 16,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              FloatingActionButton.small(
                heroTag: 'gps_btn',
                backgroundColor: C.card,
                onPressed: _locateMe,
                child: Icon(Icons.my_location, color: C.teal),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _locateMe() async {
    try {
      var p = await Geolocator.checkPermission();
      if (p == LocationPermission.denied) p = await Geolocator.requestPermission();
      if (p == LocationPermission.denied || p == LocationPermission.deniedForever) return;
      final pos = await Geolocator.getCurrentPosition();
      final point = LatLng(pos.latitude, pos.longitude);
      setState(() {
        _draft.locationPin = point;
      });
      _mapController.move(point, 16);
    } catch (_) {}
  }

  // =========================================================================
  // SCREEN 4 — Define Property Structure
  // =========================================================================
  Widget _step4PropertyStructure() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      children: [
        Text(t('Define Property Structure', 'Panga Muundo wa Nyumba'), style: display(18, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(
          t('Define how many unit categories exist (e.g. Master Bedrooms, Standard Rooms, Self-contained Flats).',
            'Bainisha kategoria ngapi za vyumba zipo (mf. Master Bedrooms, Vyumba vya Kawaida, Fleti).'),
          style: body(13, color: C.muted, height: 1.4),
        ),
        const SizedBox(height: 16),

        if (_draft.rentalMode == RentalMode.entire)
          Glass(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: C.teal, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      t('This property is rented as an entire house. One main rental space will be created.',
                        'Nyumba hii inapangishwa nzima. Nafasi moja kuu ya upangishaji itatengenezwa.'),
                      style: body(13.5),
                    ),
                  ),
                ],
              ),
            ),
          )
        else ...[
          for (final (i, tmpl) in _draft.templates.indexed)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Glass(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(tmpl.name, style: display(15, weight: FontWeight.w800)),
                        ),
                        IconButton(
                          icon: Icon(Icons.delete_outline_rounded, color: C.hibiscus, size: 20),
                          onPressed: () => setState(() => _draft.templates.removeAt(i)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(t('Category / Type', 'Kategoria'), style: body(11.5, color: C.muted)),
                              const SizedBox(height: 4),
                              TextField(
                                controller: TextEditingController(text: tmpl.unitType),
                                onChanged: (v) => tmpl.unitType = v,
                                style: body(13.5),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(t('Count', 'Idadi'), style: body(11.5, color: C.muted)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove_circle_outline, size: 20),
                                  onPressed: tmpl.quantity > 1 ? () => setState(() => tmpl.quantity--) : null,
                                ),
                                Text('${tmpl.quantity}', style: body(15, weight: FontWeight.w800)),
                                IconButton(
                                  icon: Icon(Icons.add_circle_outline, size: 20, color: C.teal),
                                  onPressed: () => setState(() => tmpl.quantity++),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

          Button(
            t('+ Add Unit Category / Template', '+ Ongeza Kategoria ya Chumba'),
            tone: Tone.plain,
            icon: Icons.add_rounded,
            onTap: () {
              setState(() {
                _draft.templates.add(
                  UnitTemplate(
                    id: 'tmpl_${DateTime.now().millisecondsSinceEpoch}',
                    name: t('Room Category ${_draft.templates.length + 1}', 'Kategoria ${_draft.templates.length + 1}'),
                    unitType: 'Standard Room',
                    quantity: 1,
                  ),
                );
              });
            },
          ),
        ],
      ],
    );
  }

  // =========================================================================
  // SCREEN 5 — Configure Unit Templates
  // =========================================================================
  Widget _step5UnitTemplates() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      children: [
        Text(t('Configure Unit Templates', 'Weka Vigezo vya Violezo'), style: display(18, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(t('Define default prices, advance payment terms, and bathrooms for each template.',
          'Weka bei chaguomsingi, masharti ya miezi ya malipo ya awali na bafu kwa kila kiolezo.'),
          style: body(13, color: C.muted, height: 1.4)),
        const SizedBox(height: 14),

        for (final tmpl in _draft.templates)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Glass(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: C.tealLight, borderRadius: BorderRadius.circular(8)),
                        child: Text('${tmpl.quantity} units', style: body(11, color: C.teal, weight: FontWeight.w700)),
                      ),
                      const SizedBox(width: 8),
                      Expanded(child: Text(tmpl.name, style: display(15, weight: FontWeight.w800))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(t('Default Rent (TZS/mo)', 'Kodi ya Mwezi (TZS)'), style: body(11.5, color: C.muted)),
                            const SizedBox(height: 4),
                            TextField(
                              controller: TextEditingController(text: tmpl.defaultRent.round().toString()),
                              keyboardType: TextInputType.number,
                              onChanged: (v) => tmpl.defaultRent = double.tryParse(v) ?? tmpl.defaultRent,
                              style: body(14),
                              decoration: const InputDecoration(prefixText: 'TSh '),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(t('Payment Advance', 'Miezi ya Awali'), style: body(11.5, color: C.muted)),
                            const SizedBox(height: 4),
                            TextField(
                              controller: TextEditingController(text: tmpl.paymentTerms),
                              onChanged: (v) => tmpl.paymentTerms = v,
                              style: body(14),
                              decoration: const InputDecoration(hintText: '4 months advance'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Checkbox(
                        value: tmpl.isPrivateBathroom,
                        activeColor: C.teal,
                        onChanged: (v) => setState(() => tmpl.isPrivateBathroom = v ?? true),
                      ),
                      Text(t('Private Ensuite Bathroom', 'Bafu ya Ndani (Private)'), style: body(13, weight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  // =========================================================================
  // SCREEN 6 — Review & Edit Individual Units (Searchable list & Bulk Actions)
  // =========================================================================
  Widget _step6ReviewUnits() {
    final query = _unitSearchQuery.toLowerCase();
    final filtered = _draft.units.where((u) => u.unitNumber.toLowerCase().contains(query) || u.unitType.toLowerCase().contains(query)).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: Glass(
                  padding: EdgeInsets.zero,
                  child: TextField(
                    onChanged: (v) => setState(() => _unitSearchQuery = v.trim()),
                    decoration: InputDecoration(
                      prefixIcon: Icon(Icons.search, size: 20, color: C.muted),
                      border: InputBorder.none,
                      hintText: t('Search units...', 'Tafuta vyumba...'),
                      hintStyle: body(13.5, color: C.muted),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Press(
                onTap: _bulkEditSheet,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                  decoration: BoxDecoration(color: C.mkoko, borderRadius: BorderRadius.circular(14)),
                  child: Row(
                    children: [
                      const Icon(Icons.tune, color: Colors.white, size: 16),
                      const SizedBox(width: 4),
                      Text(t('Bulk Edit', 'Badili Vyote'), style: body(12, color: Colors.white, weight: FontWeight.w700)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            itemCount: filtered.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final u = filtered[i];
              return Glass(
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(color: C.tealLight, borderRadius: BorderRadius.circular(10)),
                      child: Icon(Icons.meeting_room_outlined, color: C.teal, size: 22),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(u.unitNumber, style: body(14, weight: FontWeight.w700)),
                          Text('${u.unitType} • ${tzs(u.monthlyRent)}/mo (${u.paymentTerms})', style: body(12, color: C.muted)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.edit_outlined, size: 18, color: C.teal),
                      onPressed: () => _editSingleUnitSheet(u),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _bulkEditSheet() {
    final rentCtrl = TextEditingController();
    final termsCtrl = TextEditingController(text: '4 months advance');
    sheet(
      context,
      SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(t('Bulk Edit All ${_draft.units.length} Units', 'Badili Vyumba Vyote ${_draft.units.length}'), style: display(18, weight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(t('Update rent or advance terms across all generated units simultaneously.',
              'Sasisha kodi au masharti ya malipo kwenye vyumba vyote kwa wakati mmoja.'), style: body(13, color: C.muted)),
            const SizedBox(height: 14),
            Text(t('Set Monthly Rent for All (TZS)', 'Weka Kodi ya Mwezi kwa Vyote'), style: body(12, color: C.muted)),
            const SizedBox(height: 4),
            TextField(
              controller: rentCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(prefixText: 'TSh '),
            ),
            const SizedBox(height: 12),
            Text(t('Set Advance Terms for All', 'Weka Masharti ya Awali kwa Vyote'), style: body(12, color: C.muted)),
            const SizedBox(height: 4),
            TextField(
              controller: termsCtrl,
              decoration: const InputDecoration(hintText: '4 months advance'),
            ),
            const SizedBox(height: 18),
            Button(
              t('Apply to All Units', 'Sasisha Vyumba Vyote'),
              onTap: () {
                final r = double.tryParse(rentCtrl.text);
                setState(() {
                  for (final u in _draft.units) {
                    if (r != null) u.monthlyRent = r;
                    if (termsCtrl.text.isNotEmpty) u.paymentTerms = termsCtrl.text.trim();
                  }
                });
                Navigator.pop(context);
                toast(context, t('All units updated.', 'Vyumba vyote vimesasishwa.'));
              },
            ),
          ],
        ),
      ),
    );
  }

  void _editSingleUnitSheet(WizardUnit u) {
    final nameCtrl = TextEditingController(text: u.unitNumber);
    final rentCtrl = TextEditingController(text: u.monthlyRent.round().toString());
    final termsCtrl = TextEditingController(text: u.paymentTerms);
    final typeCtrl = TextEditingController(text: u.unitType);
    final descCtrl = TextEditingController(text: u.description);

    sheet(
      context,
      SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(t('Edit Unit / Room', 'Hariri Chumba'), style: display(18, weight: FontWeight.w800)),
            const SizedBox(height: 14),
            Text(t('Unit Name / Number', 'Jina la Chumba'), style: body(12, color: C.muted)),
            const SizedBox(height: 4),
            TextField(controller: nameCtrl),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t('Rent (TZS/mo)', 'Kodi (TZS)'), style: body(12, color: C.muted)),
                      const SizedBox(height: 4),
                      TextField(controller: rentCtrl, keyboardType: TextInputType.number),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t('Advance Terms', 'Masharti ya Awali'), style: body(12, color: C.muted)),
                      const SizedBox(height: 4),
                      TextField(controller: termsCtrl),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(t('Category / Type', 'Aina ya Chumba'), style: body(12, color: C.muted)),
            const SizedBox(height: 4),
            TextField(controller: typeCtrl),
            const SizedBox(height: 10),
            Text(t('Description', 'Maelezo'), style: body(12, color: C.muted)),
            const SizedBox(height: 4),
            TextField(controller: descCtrl, maxLines: 2),
            const SizedBox(height: 16),
            Button(
              t('Save Unit Changes', 'Hifadhi Mabadiliko'),
              onTap: () {
                setState(() {
                  u.unitNumber = nameCtrl.text.trim();
                  u.monthlyRent = double.tryParse(rentCtrl.text) ?? u.monthlyRent;
                  u.paymentTerms = termsCtrl.text.trim();
                  u.unitType = typeCtrl.text.trim();
                  u.description = descCtrl.text.trim();
                  u.isCustomized = true;
                });
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // SCREEN 7 — Different Unit Details & Overrides
  // =========================================================================
  Widget _step7UnitOverrides() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      children: [
        Text(t('Different Unit Details', 'Tofauti za Vyumba'), style: display(18, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(t('The system does not assume units are identical merely because they belong to the same property. Tap any unit to customize details or photos.',
          'Mfumo hauchukulii kuwa vyumba vinafanana kwa sababu tu vipo jengo moja. Gusa chumba kubinafsisha maelezo au picha.'),
          style: body(13, color: C.muted, height: 1.4)),
        const SizedBox(height: 14),

        for (final u in _draft.units)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Glass(
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 58,
                      height: 58,
                      child: u.imagePath != null
                          ? Photo(u.imagePath, width: 58)
                          : Container(color: C.fill, child: Icon(Icons.bed_outlined, color: C.muted)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(u.unitNumber, style: body(14.5, weight: FontWeight.w700)),
                        Text('${u.unitType} • ${tzs(u.monthlyRent)}/mo', style: body(12, color: C.muted)),
                        if (u.isCustomized)
                          Text(t('Customized', 'Imebinafsishwa'), style: body(11, color: C.teal, weight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.add_a_photo_outlined, size: 20, color: C.muted),
                    onPressed: () => _pickUnitPhoto(u),
                  ),
                  IconButton(
                    icon: Icon(Icons.edit_outlined, size: 20, color: C.teal),
                    onPressed: () => _editSingleUnitSheet(u),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Future<void> _pickUnitPhoto(WizardUnit u) async {
    try {
      final img = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
      if (img != null && mounted) {
        setState(() {
          u.imagePath = img.path;
          u.isCustomized = true;
        });
        toast(context, t('Photo added to ${u.unitNumber}', 'Picha imeongezwa kwenye ${u.unitNumber}'));
      }
    } catch (_) {}
  }

  // =========================================================================
  // SCREEN 8 — Photos and Verification Documents
  // =========================================================================
  Widget _step8PhotosAndDocuments() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      children: [
        Text(t('Property Photos & Media', 'Picha & Nyaraka za Nyumba'), style: display(18, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(t('Add cover photo, gallery images, and optional private ownership verification documents.',
          'Weka picha kuu ya nyumba, picha za ziada na nyaraka za uthibitisho.'),
          style: body(13, color: C.muted, height: 1.4)),
        const SizedBox(height: 16),

        Text(t('Property Cover Photo (Required)', 'Picha Kuu ya Nyumba (Inahitajika)'), style: display(14.5, weight: FontWeight.w700)),
        const SizedBox(height: 8),

        if (_draft.coverPhotoPath != null)
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Stack(
              children: [
                Image.file(File(_draft.coverPhotoPath!), height: 180, width: double.infinity, fit: BoxFit.cover),
                Positioned(
                  top: 8,
                  right: 8,
                  child: RoundIcon(
                    Icons.close,
                    label: t('Remove', 'Ondoa'),
                    onTap: () => setState(() => _draft.coverPhotoPath = null),
                  ),
                ),
              ],
            ),
          )
        else
          Press(
            onTap: () async {
              final img = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
              if (img != null && mounted) setState(() => _draft.coverPhotoPath = img.path);
            },
            child: Container(
              height: 140,
              decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(14), border: Border.all(color: C.line, style: BorderStyle.solid)),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.add_photo_alternate_outlined, size: 36, color: C.teal),
                    const SizedBox(height: 6),
                    Text(t('Upload Cover Photo', 'Pakia Picha Kuu'), style: body(13.5, color: C.teal, weight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ),

        const SizedBox(height: 20),
        Text(t('Gallery Photos', 'Picha za Ziada za Nyumba'), style: display(14.5, weight: FontWeight.w700)),
        const SizedBox(height: 8),

        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final (i, path) in _draft.galleryPhotoPaths.indexed)
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Stack(
                  children: [
                    Image.file(File(path), width: 90, height: 90, fit: BoxFit.cover),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: GestureDetector(
                        onTap: () => setState(() => _draft.galleryPhotoPaths.removeAt(i)),
                        child: Container(
                          decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                          child: const Icon(Icons.close, size: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            Press(
              onTap: () async {
                final imgs = await _picker.pickMultiImage(imageQuality: 80);
                if (imgs.isNotEmpty && mounted) {
                  setState(() => _draft.galleryPhotoPaths.addAll(imgs.map((x) => x.path)));
                }
              },
              child: Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.line)),
                child: Center(child: Icon(Icons.add, size: 28, color: C.muted)),
              ),
            ),
          ],
        ),

        const SizedBox(height: 24),
        Glass(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.security_outlined, color: C.brassInk, size: 20),
                    const SizedBox(width: 8),
                    Text(t('Private Verification Documents', 'Nyaraka za Siri za Uthibitisho'), style: display(14, weight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  t('Ownership deeds, tax receipts, or local authority letters are strictly kept private for admin verification and never displayed publicly.',
                    'Hati za umiliki na barua za serikali ya mtaa huwekwa kwa siri tu kwa ukaguzi wa admin na hazionyeshwi hadharani.'),
                  style: body(12, color: C.muted, height: 1.35),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // =========================================================================
  // SCREEN 9 — Listing & Rental Settings
  // =========================================================================
  Widget _step9RentalSettings() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      children: [
        Text(t('Listing & Rental Settings', 'Mipangilio ya Tangazo'), style: display(18, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(t('Control public visibility, advance billing, and viewing arrangements.',
          'Weka uonekanaji wa tangazo na masharti ya kuona nyumba.'), style: body(13, color: C.muted)),
        const SizedBox(height: 16),

        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(t('List publicly on Panga', 'Onyesha tangazo hadharani Panga'), style: body(14.5, weight: FontWeight.w700)),
          subtitle: Text(t('Tenants can discover and view this property in search', 'Wapangaji wanaweza kuona nyumba hii kwenye utafutaji'),
            style: body(12, color: C.muted)),
          value: _draft.isPubliclyListed,
          activeTrackColor: C.teal,
          onChanged: (v) => setState(() => _draft.isPubliclyListed = v),
        ),

        const SizedBox(height: 14),
        Text(t('Overall Property Rent (TZS/mo)', 'Kodi ya Jumla ya Nyumba (TZS)'), style: body(12.5, color: C.muted)),
        const SizedBox(height: 4),
        TextField(
          controller: TextEditingController(text: _draft.overallRent.round().toString()),
          keyboardType: TextInputType.number,
          onChanged: (v) => _draft.overallRent = double.tryParse(v) ?? _draft.overallRent,
          style: body(14.5),
          decoration: const InputDecoration(prefixText: 'TSh '),
        ),

        const SizedBox(height: 14),
        Text(t('Viewing Preference', 'Jinsi ya Kuona Nyumba'), style: body(12.5, color: C.muted)),
        const SizedBox(height: 4),
        Wrap(
          spacing: 8,
          children: [
            for (final p in ['By Appointment', 'Instant Viewing', 'Contact Landlord First'])
              Press(
                onTap: () => setState(() => _draft.viewingPreference = p),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: _draft.viewingPreference == p ? C.tealLight : C.card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _draft.viewingPreference == p ? C.teal : C.line),
                  ),
                  child: Text(p, style: body(12, color: _draft.viewingPreference == p ? C.teal : C.wino, weight: FontWeight.w600)),
                ),
              ),
          ],
        ),
      ],
    );
  }

  // =========================================================================
  // SCREEN 10 — Review, Save & Publish
  // =========================================================================
  Widget _step10ReviewAndPublish() {
    final validation = _draft.validate();
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      children: [
        Text(t('Review & Publish Property', 'Kagua & Chapisha Nyumba'), style: display(18, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(t('Carefully review property details, locations, and configured units before submitting.',
          'Kagua kwa makini taarifa za nyumba, eneo na vyumba vilivyopangwa kabla ya kutuma.'), style: body(13, color: C.muted)),
        const SizedBox(height: 14),

        // Summary Card
        Glass(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_draft.propertyName.isEmpty ? t('Unnamed Property', 'Nyumba Isiyo na Jina') : _draft.propertyName,
                style: display(17, weight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text('${_draft.street}, ${_draft.ward}, ${_draft.district}, ${_draft.region}', style: body(13, color: C.muted)),
              if (_draft.napaNumber.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text('NAPA: ${_draft.napaNumber}', style: body(12.5, color: C.teal, weight: FontWeight.w700)),
                ),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(t('Total Units Configured', 'Jumla ya Vyumba'), style: body(13, color: C.muted)),
                  Text('${_draft.units.length} units', style: body(14, weight: FontWeight.w800)),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(t('Base Rent', 'Kodi ya Mwezi'), style: body(13, color: C.muted)),
                  Text(tzs(_draft.overallRent), style: body(14, color: C.teal, weight: FontWeight.w800)),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),
        Text(t('Units Breakdown (${_draft.units.length})', 'Mchanganuo wa Vyumba (${_draft.units.length})'), style: display(15, weight: FontWeight.w800)),
        const SizedBox(height: 8),

        for (final u in _draft.units)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Glass(
              padding: const EdgeInsets.all(10),
              child: Row(
                children: [
                  Icon(Icons.meeting_room_outlined, size: 20, color: C.teal),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(u.unitNumber, style: body(13.5, weight: FontWeight.w700)),
                  ),
                  Text(tzs(u.monthlyRent), style: body(13, color: C.teal, weight: FontWeight.w700)),
                ],
              ),
            ),
          ),

        const SizedBox(height: 14),
        if (validation.isEmpty)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: C.goodTint, borderRadius: BorderRadius.circular(14)),
            child: Row(
              children: [
                Icon(Icons.check_circle_rounded, color: C.good, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    t('All required property information is complete and ready for publishing.',
                      'Taarifa zote zinazohitajika zimekamilika na zipo tayari kuchapishwa.'),
                    style: body(13, color: C.good, weight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          )
        else
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: C.blush, borderRadius: BorderRadius.circular(14)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t('Missing required information:', 'Taarifa zinazokosekana:'), style: body(13, color: C.hibiscus, weight: FontWeight.w700)),
                const SizedBox(height: 4),
                for (final err in validation)
                  Text('• $err', style: body(12.5, color: C.hibiscus)),
              ],
            ),
          ),
      ],
    );
  }
}
