import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../ui.dart';
import 'wizard/property_wizard.dart';
import 'wizard/wizard_models.dart';

/// Interactive AI-Driven Property Registration Workspace
/// Combines conversational natural-language input with a live property form,
/// expandable unit cards, instant field editing, validation badges, explanation cards,
/// and direct synchronization with the multi-step Property Wizard.
class AiPropertyWorkspaceScreen extends StatefulWidget {
  const AiPropertyWorkspaceScreen({
    super.key,
    this.initialWizardDraft,
    this.currentStepIndex,
    this.currentStepName,
  });

  final PropertyDraft? initialWizardDraft;
  final int? currentStepIndex;
  final String? currentStepName;

  @override
  State<AiPropertyWorkspaceScreen> createState() => _AiPropertyWorkspaceScreenState();
}

class _ChatMessage {
  _ChatMessage({
    required this.text,
    required this.isUser,
    this.corrections = const [],
    this.explanation,
    this.stepFocus,
    this.quickReplies = const [],
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  final String text;
  final bool isUser;
  final List<String> corrections;
  final String? explanation;
  final String? stepFocus;
  final List<String> quickReplies;
  final DateTime timestamp;
}

class _AiPropertyWorkspaceScreenState extends State<AiPropertyWorkspaceScreen> {
  final _chatController = TextEditingController();
  final _scrollController = ScrollController();

  bool _loading = true;
  bool _sending = false;
  bool _finalizing = false;
  String? _error;

  String? _draftId;
  int _revision = 1;
  Map<String, dynamic> _draft = {};
  Map<String, dynamic> _validation = {};

  final List<_ChatMessage> _messages = [];
  bool _showForm = false; // toggle between chat-centric & form view

  // Form field controllers for inline editing
  final _nameController = TextEditingController();
  final _districtController = TextEditingController();
  final _wardController = TextEditingController();
  final _rentController = TextEditingController();
  final _depositController = TextEditingController();
  final _descriptionController = TextEditingController();

  int _selectedStepIndex = 0;
  String? _selectedStepName;

  final List<(String, String, IconData)> _wizardSteps = const [
    ('Property Basics', 'Misingi ya Nyumba', Icons.home_rounded),
    ('Location & Map', 'Mahali & Ramani', Icons.location_on_rounded),
    ('Features & Amenities', 'Sifa & Vifaa', Icons.checklist_rounded),
    ('Rooms & Units', 'Vyumba & Idadi', Icons.meeting_room_rounded),
    ('Rent & Deposit', 'Kodi & Dhamana', Icons.payments_rounded),
    ('Utilities & Policies', 'LUKU & Kanuni', Icons.bolt_rounded),
    ('Photos & Media', 'Picha & Video', Icons.photo_camera_rounded),
  ];

  void _onStepSelected(int index, String stepName) {
    setState(() {
      _selectedStepIndex = index;
      _selectedStepName = stepName;
    });
  }

  List<String> get _currentStepPrompts {
    switch (_selectedStepIndex) {
      case 0: // Property Basics
        return [
          t('🏠 3 bed standalone house in Mikocheni', '🏠 Nyumba nzima ya vyumba 3 Mikocheni'),
          t('🏢 Apartment block with 4 units in Kijitonyama', '🏢 Jengo la apartment 4 Kijitonyama'),
          t('🚪 Single master bedroom in Sinza', '🚪 Chumba kimoja master Sinza'),
          t('What property types are supported?', 'Aina gani za nyumba zinawezekana?'),
        ];
      case 1: // Location & Map
        return [
          t('📍 Sinza Mori near Kumekucha, Dar es Salaam', '📍 Sinza Mori karibu na Kumekucha, Dar es Salaam'),
          t('📍 Mikocheni B near Shoppers Plaza', '📍 Mikocheni B karibu na Shoppers'),
          t('📍 Dodoma Area C along the main road', '📍 Dodoma Area C barabara kuu'),
          t('Do I need a NAPA postal code?', 'Je, namba ya NAPA inahitajika?'),
        ];
      case 2: // Features & Amenities
        return [
          t('Fence, paved parking, borehole water & LUKU', 'Uzio, parking, maji ya dawasa & LUKU'),
          t('Electric fence, garden & 24hr security guard', 'Fence ya umeme, bustani & mlinzi masaa 24'),
          t('Balcony, tiled floors, gypsum ceiling', 'Balcony, vigae/tiles, dari ya gypsum'),
          t('What amenities attract higher rent?', 'Vifaa gani huongeza thamani ya kodi?'),
        ];
      case 3: // Rooms & Units
        return [
          t('Unit 1: 2 bedrooms rent 600,000/mo', 'Unit 1: vyumba 2 kodi 600,000/mwezi'),
          t('Room A: Master bedroom rent 300,000', 'Chumba A: Master bedroom kodi laki 3'),
          t('All 4 apartments are identical 2-bed units', 'Apartment zote 4 zinafanana vyumba 2'),
          t('How do I list different unit prices?', 'Jinsi ya kuweka bei tofauti kwa vyumba?'),
        ];
      case 4: // Rent & Deposit
        return [
          t('Overall monthly rent 800,000 TZS', 'Kodi ya mwezi TZS 800,000'),
          t('6 months advance with 1 month security deposit', 'Miezi 6 mbele na dhamana mwezi 1'),
          t('What is the market rent in this area?', 'Kodi ya kawaida ya soko hapa ni kiasi gani?'),
          t('Is security deposit legally recommended?', 'Je, dhamana ya tahadhari ni lazima kisheria?'),
        ];
      case 5: // Utilities & Policies
        return [
          t('Independent LUKU sub-meter for each tenant', 'Kila mpangaji ana sub-mita yake ya LUKU'),
          t('Shared water bill divided equally each month', 'Bili ya maji inagawanywa sawa kila mwezi'),
          t('No pets allowed, quiet hours after 10 PM', 'Wanyama hawaruhusiwi, utulivu baada ya saa 4 usiku'),
          t('How to handle water meter billing fairly?', 'Njia bora ya kugawana bili ya maji ya DAWASA?'),
        ];
      case 6: // Photos & Media
        return [
          t('What photos should I take first?', 'Picha gani nizipige kwanza?'),
          t('Can I take photos now or later in wizard?', 'Naweza kuweka picha sasa au baadaye kwenye wizard?'),
          t('Tips for bright, attractive room photos', 'Ushauri wa kupiga picha nzuri zenye mwanga'),
        ];
      default:
        return _quickPrompts;
    }
  }

  final List<String> _quickPrompts = [
    'Mikocheni, 3 bedroom house, rent 800,000',
    'Nyumba ya vyumba 4 Sinza, kodi milioni 1',
    'Add Unit B2 rent 350,000',
    'Badilisha kodi ya chumba cha kwanza kuwa laki 4',
    'What amenities are included?',
  ];

  @override
  void initState() {
    super.initState();
    _selectedStepIndex = widget.currentStepIndex ?? 0;
    _selectedStepName = widget.currentStepName ?? _wizardSteps[_selectedStepIndex].$1;
    _loadActiveDraft();
  }

  @override
  void dispose() {
    _chatController.dispose();
    _scrollController.dispose();
    _nameController.dispose();
    _districtController.dispose();
    _wardController.dispose();
    _rentController.dispose();
    _depositController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadActiveDraft() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await Api.get('property-drafts/active');
      if (res is Map && mounted) {
        setState(() {
          _draftId = res['draft_id'];
          _revision = res['revision'] ?? 1;
          _draft = Map<String, dynamic>.from(res['draft'] ?? {});
          _validation = Map<String, dynamic>.from(res['validation'] ?? {});

          // Merge initial wizard draft if provided
          if (widget.initialWizardDraft != null) {
            final init = widget.initialWizardDraft!;
            if (init.propertyName.isNotEmpty && (_draft['property_name'] == null || _draft['property_name'].isEmpty)) {
              _draft['property_name'] = init.propertyName;
            }
            if (init.region.isNotEmpty) _draft['region'] = init.region;
            if (init.district.isNotEmpty) _draft['district'] = init.district;
            if (init.ward.isNotEmpty) _draft['ward'] = init.ward;
            if (init.street.isNotEmpty) _draft['street'] = init.street;
            if (init.napaNumber.isNotEmpty) _draft['napa_number'] = init.napaNumber;
            if (init.overallRent > 0 && (_draft['monthly_rent'] == null || _draft['monthly_rent'] == 0)) {
              _draft['monthly_rent'] = init.overallRent.toInt();
            }
            if (init.securityDeposit != null && init.securityDeposit! > 0) {
              _draft['security_deposit'] = init.securityDeposit!.toInt();
            }
            if (init.units.isNotEmpty && (_draft['units'] == null || (_draft['units'] as List).isEmpty)) {
              _draft['units'] = [
                for (final u in init.units)
                  {
                    'unit_number': u.unitNumber,
                    'unit_type': u.unitType,
                    'monthly_rent': u.monthlyRent.toInt(),
                    'bedrooms': u.bedrooms,
                    'bathrooms': u.bathrooms,
                    'payment_terms': u.paymentTerms,
                    'description': u.description,
                  }
              ];
            }
          }

          _syncControllersWithDraft();
          _loading = false;
        });

        if (_messages.isEmpty) {
          final stepNote = widget.currentStepName != null
              ? t(
                  ' Currently assisting on: "${widget.currentStepName}". You can describe changes or ask anything about this step.',
                  ' Msaada wa sasa: "${widget.currentStepName}". Unaweza kueleza mabadiliko au kuuliza swali lolote kuhusu hatua hii.',
                )
              : '';
          _messages.add(_ChatMessage(
            text: t(
              "Hello! 😊 I'm Veyora.$stepNote Tell me about your property in English or Kiswahili (e.g. location, rooms, and rent), or ask me about pricing, utility meters, and market standards.",
              'Habari! 😊 Mimi ni Veyora.$stepNote Nieleze kuhusu nyumba yako kwa Kiswahili au Kiingereza (eneo, idadi ya vyumba, kodi), au niulize kuhusu bei, luku, na viwango vya soko.',
            ),
            isUser: false,
            quickReplies: [
              t('Suggest rent for my area', 'Pendekeza kodi ya eneo langu'),
              t('How to setup LUKU sub-meters', 'Jinsi ya kupanga mita za LUKU'),
              t('What deposit is standard?', 'Kodi ya tahadhari/dhamana ni kiasi gani?'),
            ],
          ));
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  void _openInWizard() {
    final wizardDraft = widget.initialWizardDraft ?? PropertyDraft();
    if ((_draft['property_name'] ?? '').isNotEmpty) {
      wizardDraft.propertyName = _draft['property_name'];
    }
    if ((_draft['property_type'] ?? '').isNotEmpty) {
      wizardDraft.propertyType = WizardPropertyType.fromName(_draft['property_type']);
    }
    if ((_draft['region'] ?? '').isNotEmpty) wizardDraft.region = _draft['region'];
    if ((_draft['district'] ?? '').isNotEmpty) wizardDraft.district = _draft['district'];
    if ((_draft['ward'] ?? '').isNotEmpty) wizardDraft.ward = _draft['ward'];
    if ((_draft['street'] ?? '').isNotEmpty) wizardDraft.street = _draft['street'];
    if ((_draft['napa_number'] ?? '').isNotEmpty) wizardDraft.napaNumber = _draft['napa_number'];
    if ((_draft['description'] ?? '').isNotEmpty) wizardDraft.description = _draft['description'];

    if (_draft['monthly_rent'] != null && _draft['monthly_rent'] > 0) {
      wizardDraft.overallRent = (_draft['monthly_rent'] as num).toDouble();
    }
    if (_draft['security_deposit'] != null) {
      wizardDraft.securityDeposit = (_draft['security_deposit'] as num).toDouble();
    }
    if (_draft['shared_amenities'] is List) {
      wizardDraft.sharedAmenities = Set<String>.from(_draft['shared_amenities']);
    }

    final rawUnits = _draft['units'];
    if (rawUnits is List && rawUnits.isNotEmpty) {
      wizardDraft.rentalMode = RentalMode.rooms;
      wizardDraft.units = [
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

    if (widget.initialWizardDraft != null) {
      Navigator.pop(context, wizardDraft);
    } else {
      push(context, PropertyWizardScreen(initialDraft: wizardDraft));
    }
  }

  void _syncControllersWithDraft() {
    _nameController.text = _draft['property_name'] ?? '';
    _districtController.text = _draft['district'] ?? '';
    _wardController.text = _draft['ward'] ?? '';
    _rentController.text = _draft['monthly_rent'] != null && _draft['monthly_rent'] > 0
        ? _draft['monthly_rent'].toString()
        : '';
    _depositController.text = _draft['security_deposit'] != null
        ? _draft['security_deposit'].toString()
        : '';
    _descriptionController.text = _draft['description'] ?? '';
  }

  Future<void> _sendMessage([String? presetText]) async {
    final text = presetText ?? _chatController.text.trim();
    if (text.isEmpty || _sending) return;

    _chatController.clear();
    setState(() {
      _messages.add(_ChatMessage(text: text, isUser: true));
      _sending = true;
      _error = null;
    });

    _scrollToBottom();

    try {
      final res = await Api.post('property-drafts/chat', {
        'message': text,
        'draft_id': _draftId,
        'current_step': _selectedStepName ?? widget.currentStepName,
      });

      if (res is Map && mounted) {
        final replyText = res['response'] ?? 'Draft updated.';
        final corrections = List<String>.from(res['corrections'] ?? []);
        final explanation = res['explanation'] as String?;
        final stepFocus = res['step_focus'] as String?;
        final quickReplies = List<String>.from(res['quick_replies'] ?? []);

        setState(() {
          _draftId = res['draft_id'];
          _revision = res['revision'] ?? _revision;
          _draft = Map<String, dynamic>.from(res['draft'] ?? {});
          _validation = Map<String, dynamic>.from(res['validation'] ?? {});
          _syncControllersWithDraft();
          _messages.add(_ChatMessage(
            text: replyText,
            isUser: false,
            corrections: corrections,
            explanation: explanation,
            stepFocus: stepFocus,
            quickReplies: quickReplies,
          ));
          _sending = false;
        });

        HapticFeedback.lightImpact();
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _sending = false;
          _messages.add(_ChatMessage(
            text: t(
              'Sorry, I had trouble processing that update. Please check your network or edit the fields directly.',
              'Samahani, kumetokea hitilafu kuchakata taarifa hiyo. Tafadhali hakikisha mtandao upo au rekebisha taarifa moja kwa moja.',
            ),
            isUser: false,
          ));
        });
        _scrollToBottom();
      }
    }
  }

  Future<void> _patchField(String field, dynamic value) async {
    if (_draftId == null) return;
    try {
      final res = await Api.patch('property-drafts/$_draftId', {
        'updates': {field: value},
      });
      if (res is Map && mounted) {
        setState(() {
          _draft = Map<String, dynamic>.from(res['draft'] ?? {});
          _validation = Map<String, dynamic>.from(res['validation'] ?? {});
          _revision = res['revision'] ?? _revision;
          _syncControllersWithDraft();
        });
        HapticFeedback.selectionClick();
      }
    } catch (_) {}
  }

  Future<void> _addOrUpdateUnit({
    String? originalUnitNumber,
    required String unitNumber,
    required int monthlyRent,
    String unitType = 'Room',
    int bedrooms = 1,
    int bathrooms = 1,
    String paymentTerms = 'Monthly',
  }) async {
    if (_draftId == null) return;
    final List currentUnits = List.from(_draft['units'] ?? []);

    final updatedUnit = {
      'unit_number': unitNumber,
      'unit_type': unitType,
      'monthly_rent': monthlyRent,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'payment_terms': paymentTerms,
    };

    if (originalUnitNumber != null) {
      final idx = currentUnits.indexWhere(
        (u) => (u['unit_number'] ?? '').toString().toLowerCase() == originalUnitNumber.toLowerCase(),
      );
      if (idx != -1) {
        currentUnits[idx] = updatedUnit;
      } else {
        currentUnits.add(updatedUnit);
      }
    } else {
      currentUnits.add(updatedUnit);
    }

    try {
      final res = await Api.patch('property-drafts/$_draftId', {
        'updates': {'units': currentUnits},
      });
      if (res is Map && mounted) {
        setState(() {
          _draft = Map<String, dynamic>.from(res['draft'] ?? {});
          _validation = Map<String, dynamic>.from(res['validation'] ?? {});
          _revision = res['revision'] ?? _revision;
          _syncControllersWithDraft();
        });
        HapticFeedback.mediumImpact();
      }
    } catch (_) {}
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _openUnitDialog([Map<String, dynamic>? unit]) {
    final numberCtrl = TextEditingController(text: unit?['unit_number'] ?? 'Room ${(_draft['units']?.length ?? 0) + 1}');
    final rentCtrl = TextEditingController(text: unit?['monthly_rent']?.toString() ?? '300000');
    String type = unit?['unit_type'] ?? 'Room';
    int beds = unit?['bedrooms'] ?? 1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                unit == null ? t('Add Unit / Room', 'Ongeza Chumba / Sehemu') : t('Edit Unit', 'Rekebisha Chumba'),
                style: display(18, weight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              Field(
                t('Unit Identifier', 'Namba / Jina la Chumba'),
                controller: numberCtrl,
                hint: 'e.g. Room 1, Master Bed, Suite A',
              ),
              const SizedBox(height: 12),
              Field(
                t('Monthly Rent (TZS)', 'Kodi ya Mwezi (TZS)'),
                controller: rentCtrl,
                hint: '350000',
                keyboard: TextInputType.number,
              ),
              const SizedBox(height: 20),
              Button(
                t('Save Unit', 'Hifadhi Chumba'),
                onTap: () {
                  final num = numberCtrl.text.trim();
                  final rent = int.tryParse(rentCtrl.text.replaceAll(',', '')) ?? 0;
                  if (num.isNotEmpty && rent > 0) {
                    Navigator.pop(ctx);
                    _addOrUpdateUnit(
                      originalUnitNumber: unit?['unit_number'],
                      unitNumber: num,
                      monthlyRent: rent,
                      unitType: type,
                      bedrooms: beds,
                    );
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openReviewModal() {
    final units = List.from(_draft['units'] ?? []);
    final missing = List.from(_validation['missing_required_fields'] ?? []);
    final isReady = _validation['is_ready_for_review'] == true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isReady ? Icons.check_circle_outline_rounded : Icons.pending_actions_rounded,
                  color: isReady ? C.good : C.shaba,
                  size: 26,
                ),
                const SizedBox(width: 10),
                Text(
                  t('Review & Confirmation', 'Ukaguzi & Uthibitisho'),
                  style: display(20, weight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Card(
              child: Column(
                children: [
                  _reviewRow(t('Property Name', 'Jina la Nyumba'), _draft['property_name'] ?? '—'),
                  _reviewRow(t('Type', 'Aina'), _draft['property_type'] ?? 'House'),
                  _reviewRow(t('Location', 'Mahali'), '${_draft['district'] ?? ''}, ${_draft['region'] ?? ''}'),
                  _reviewRow(t('Total Monthly Rent', 'Kodi ya Mwezi'), 'TZS ${_draft['monthly_rent'] ?? 0}'),
                  _reviewRow(t('Units Count', 'Idadi ya Vyumba'), '${units.length}'),
                ],
              ),
            ),
            if (missing.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: C.hibiscus.withValues(alpha: .1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline_rounded, color: C.hibiscus, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        t(
                          'Missing required fields: ${missing.map((m) => m['label']).join(', ')}',
                          'Taarifa zinazokosekana: ${missing.map((m) => m['label_sw']).join(', ')}',
                        ),
                        style: body(13, color: C.hibiscus, weight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),
            Button(
              t('Confirm & Publish Property', 'Thibitisha & Chapisha Nyumba'),
              tone: Tone.green,
              busy: _finalizing,
              onTap: isReady ? () => _finalizeCreation(ctx) : null,
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
                side: BorderSide(color: C.teal.withValues(alpha: 0.5)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: Icon(Icons.tune_rounded, color: C.teal, size: 18),
              label: Text(
                t('Apply Details to Wizard (Manual Steps)', 'Jaza Taarifa kwenye Wizard (Hatua kwa Hatua)'),
                style: body(13.5, weight: FontWeight.w700, color: C.teal),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                _openInWizard();
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _finalizeCreation(BuildContext modalContext) async {
    if (_draftId == null) return;
    setState(() => _finalizing = true);

    try {
      final res = await Api.post('property-drafts/$_draftId/finalize', {
        'idempotency_key': 'confirm_${_draftId}_${DateTime.now().millisecondsSinceEpoch}',
      });

      if (mounted) {
        setState(() => _finalizing = false);
        Navigator.pop(modalContext); // close review modal

        if (res is Map && res['success'] == true) {
          toast(context, t('Property published successfully!', 'Nyumba imechapishwa kikamilifu!'));
          Navigator.pop(context, true);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _finalizing = false);
        Navigator.pop(modalContext);
        toast(context, e.toString());
      }
    }
  }

  Widget _reviewRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: body(13.5, color: C.muted)),
        Text(value, style: body(14, weight: FontWeight.w700)),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    final completionPct = _validation['completion_percentage'] ?? 0;
    final isReady = _validation['is_ready_for_review'] == true;
    final units = List.from(_draft['units'] ?? []);

    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              t('AI Property Creation', 'Usajili wa Nyumba kwa AI'),
              style: display(17, weight: FontWeight.w800),
            ),
            Text(
              '${_draft['property_name']?.isNotEmpty == true ? _draft['property_name'] : t('New Draft', 'Rasimu Mpya')} • $completionPct% complete',
              style: body(12, color: C.muted),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
            child: FilledButton.tonalIcon(
              style: FilledButton.styleFrom(
                backgroundColor: C.teal.withValues(alpha: 0.12),
                foregroundColor: C.teal,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              onPressed: _openInWizard,
              icon: Icon(Icons.tune_rounded, size: 15, color: C.teal),
              label: Text(
                t('Apply to Wizard', 'Fungua Wizard'),
                style: body(12, weight: FontWeight.w700, color: C.teal),
              ),
            ),
          ),
          IconButton(
            tooltip: _showForm ? t('Show Chat', 'Onyesha Mazungumzo') : t('Show Form', 'Onyesha Fomu'),
            icon: Icon(_showForm ? Icons.chat_bubble_outline_rounded : Icons.edit_note_rounded),
            onPressed: () => setState(() => _showForm = !_showForm),
          ),
          IconButton(
            tooltip: t('Review & Publish', 'Kagua & Chapisha'),
            icon: Icon(Icons.verified_outlined, color: isReady ? C.teal : C.muted),
            onPressed: _openReviewModal,
          ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: C.teal))
          : Column(
              children: [
                if (_error != null)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: C.hibiscus.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: C.hibiscus.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline_rounded, color: C.hibiscus, size: 18),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_error!, style: body(12, color: C.hibiscus))),
                        IconButton(
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          onPressed: _loadActiveDraft,
                        ),
                      ],
                    ),
                  ),

                // Top Progress indicator
                LinearProgressIndicator(
                  value: (completionPct as num).toDouble() / 100.0,
                  backgroundColor: C.line,
                  color: isReady ? C.good : C.teal,
                  minHeight: 4,
                ),

                // Live Structured Property Header Card
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: C.teal.withValues(alpha: .12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(Icons.home_work_rounded, color: C.teal, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _draft['property_name']?.isNotEmpty == true
                                      ? _draft['property_name']
                                      : t('Property title not set', 'Jina halijawekwa'),
                                  style: display(15, weight: FontWeight.w700),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${_draft['district'] ?? 'Dar es Salaam'} • ${units.length} unit(s) • TZS ${_draft['monthly_rent'] ?? 0}/mo',
                                  style: body(12.5, color: C.muted),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            onTap: _openReviewModal,
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: isReady ? C.good.withValues(alpha: .12) : C.shaba.withValues(alpha: .12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                isReady ? t('Ready', 'Tayari') : '$completionPct%',
                                style: body(12, color: isReady ? C.good : C.brassInk, weight: FontWeight.w700),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Prominent "Apply Details to Wizard" Card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          C.teal.withValues(alpha: 0.12),
                          C.card,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: C.teal.withValues(alpha: 0.28)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: C.teal,
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: const Icon(Icons.tune_rounded, color: Colors.white, size: 16),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                t('Apply Details to Wizard', 'Hamishia Kwenye Wizard'),
                                style: display(13, weight: FontWeight.w800, color: C.ink),
                              ),
                              Text(
                                _draft['property_name']?.isNotEmpty == true
                                    ? '${_draft['property_name']} • ${units.length} unit(s) captured'
                                    : t('Transfers conversation data to wizard steps', 'Hujaza fomu ya hatua kwa hatua'),
                                style: body(11, color: C.muted),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        FilledButton(
                          onPressed: _openInWizard,
                          style: FilledButton.styleFrom(
                            backgroundColor: C.teal,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            visualDensity: VisualDensity.compact,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(t('Apply', 'Hamisha'), style: body(11.5, weight: FontWeight.w700, color: Colors.white)),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_forward_rounded, size: 13, color: Colors.white),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Wizard Step Navigation Selector
                Container(
                  height: 38,
                  margin: const EdgeInsets.only(top: 4, bottom: 4),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: _wizardSteps.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 6),
                    itemBuilder: (ctx, i) {
                      final s = _wizardSteps[i];
                      final isSelected = _selectedStepIndex == i;
                      return ChoiceChip(
                        avatar: Icon(s.$3, size: 14, color: isSelected ? Colors.white : C.muted),
                        label: Text(
                          t(s.$1, s.$2),
                          style: body(11.5, weight: isSelected ? FontWeight.w700 : FontWeight.w500, color: isSelected ? Colors.white : C.ink),
                        ),
                        selected: isSelected,
                        selectedColor: C.teal,
                        backgroundColor: C.card,
                        side: BorderSide(color: isSelected ? C.teal : C.line),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
                        visualDensity: VisualDensity.compact,
                        showCheckmark: false,
                        onSelected: (_) => _onStepSelected(i, s.$1),
                      );
                    },
                  ),
                ),

                // Main Workspace Area: Chat or Inline Form
                Expanded(
                  child: _showForm ? _buildInlineFormView(units) : _buildChatView(),
                ),

                // Quick Prompt Chips (Step Context Aware)
                if (!_showForm)
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      itemCount: _currentStepPrompts.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (ctx, idx) => ActionChip(
                        label: Text(_currentStepPrompts[idx], style: body(12)),
                        backgroundColor: C.card,
                        side: BorderSide(color: C.line),
                        onPressed: () => _sendMessage(_currentStepPrompts[idx]),
                      ),
                    ),
                  ),

                // Chat Input Bar
                if (!_showForm)
                  Container(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    decoration: BoxDecoration(
                      color: C.chokaa,
                      border: Border(top: BorderSide(color: C.line)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _chatController,
                            textCapitalization: TextCapitalization.sentences,
                            style: body(14.5),
                            decoration: InputDecoration(
                              hintText: t(
                                'Describe property in English or Swahili...',
                                'Eleza nyumba kwa Kiswahili au Kiingereza...',
                              ),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: BorderSide(color: C.line),
                              ),
                            ),
                            onSubmitted: (val) => _sendMessage(),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton.filled(
                          onPressed: _sending ? null : () => _sendMessage(),
                          icon: _sending
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Icon(Icons.arrow_upward_rounded),
                          style: IconButton.styleFrom(
                            backgroundColor: C.teal,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _starterChip(String prompt) => InkWell(
    onTap: () => _sendMessage(prompt),
    borderRadius: BorderRadius.circular(10),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: C.chokaa,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: C.line),
      ),
      child: Text(prompt, style: body(12, color: C.ink, weight: FontWeight.w600)),
    ),
  );

  Widget _buildChatView() => ListView.builder(
    controller: _scrollController,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    itemCount: _messages.length + 1, // index 0 is optional starter/step header
    itemBuilder: (ctx, idx) {
      if (idx == 0) {
        final currentStep = _wizardSteps[_selectedStepIndex];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Active Step Guidance Banner
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: C.tealLight.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: C.teal.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: C.teal,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(currentStep.$3, size: 16, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${t('Active Focus Step', 'Hatua ya Sasa')}: ${t(currentStep.$1, currentStep.$2)}',
                          style: display(13, weight: FontWeight.w800, color: C.teal),
                        ),
                        Text(
                          t(
                            'Describe your details naturally or ask any market or listing questions for this step.',
                            'Eleza nyumba kwa maneno yako au uliza swali lolote la soko au mwongozo wa hatua hii.',
                          ),
                          style: body(11.5, color: C.muted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (_messages.length <= 2) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: C.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: C.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.auto_awesome, size: 17, color: C.teal),
                        const SizedBox(width: 8),
                        Text(
                          t('How would you like to describe your property?', 'Ungependa kueleza vipi nyumba yako?'),
                          style: display(13.5, weight: FontWeight.w800),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t(
                        'Speak or type freely in Kiswahili, English, or street Sheng (e.g. "Chumba na sebule Sinza, kodi laki 3, LUKU inajitegemea"). Veyora will extract the details and you can apply them to the wizard anytime!',
                        'Zungumza au andika kwa Kiswahili, Kiingereza au mchanganyiko wa mtaani. Veyora itatambua taarifa zote na unaweza kuzihamishia kwenye wizard wakati wowote!',
                      ),
                      style: body(11.5, color: C.muted, height: 1.35),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      t('Quick Starter Ideas:', 'Mifano ya Kuanzia:'),
                      style: body(11, weight: FontWeight.w700, color: C.ink),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _starterChip(t('🏠 Standalone 3-bed house in Mikocheni, 800k', '🏠 Nyumba nzima ya vyumba 3 Mikocheni, kodi 800k')),
                        _starterChip(t('🏢 4 units apartment building in Kijitonyama', '🏢 Jengo la apartment 4 Kijitonyama vyumba viwili viwili')),
                        _starterChip(t('🚪 Master bedroom in Sinza, rent 250k/mo', '🚪 Chumba kimoja master Sinza, kodi laki 2.5')),
                        _starterChip(t('❓ What is the average rent around this area?', '❓ Kodi ya kawaida ya soko eneo hili ni kiasi gani?')),
                        _starterChip(t('⚡ How should I setup LUKU sub-meters & water?', '⚡ Bili za LUKU na maji ya DAWASA zipangweje?')),
                        _starterChip(t('💰 What advance & security deposit is customary?', '💰 Miezi mingapi ya kodi na dhamana ni kawaida?')),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ],
        );
      }

      final msg = _messages[idx - 1];
      return Align(
        alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          constraints: BoxConstraints(maxWidth: MediaQuery.of(ctx).size.width * 0.85),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: msg.isUser ? C.teal : C.card,
            borderRadius: BorderRadius.circular(16).copyWith(
              bottomRight: msg.isUser ? const Radius.circular(2) : null,
              bottomLeft: !msg.isUser ? const Radius.circular(2) : null,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: .04),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                msg.text,
                style: body(14.5, color: msg.isUser ? Colors.white : C.wino, height: 1.4),
              ),
              if (msg.explanation != null && msg.explanation!.isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: C.tealLight.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: C.teal.withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.lightbulb_outline_rounded, size: 15, color: C.teal),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              t('Veyora Guidance & Market Advice', 'Ushauri na Maelezo ya Veyora'),
                              style: display(12, weight: FontWeight.w800, color: C.teal),
                            ),
                          ),
                          if (msg.stepFocus != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: C.teal.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                msg.stepFocus!.replaceAll('_', ' ').toUpperCase(),
                                style: body(9.5, weight: FontWeight.w700, color: C.teal),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        msg.explanation!,
                        style: body(12.5, color: C.wino, height: 1.4),
                      ),
                      const SizedBox(height: 8),
                      InkWell(
                        onTap: _openInWizard,
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                          decoration: BoxDecoration(
                            color: C.teal.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: C.teal.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.tune_rounded, size: 13, color: C.teal),
                              const SizedBox(width: 5),
                              Text(
                                t('Apply to Wizard', 'Fungua Wizard'),
                                style: body(11, weight: FontWeight.w700, color: C.teal),
                              ),
                              const SizedBox(width: 4),
                              Icon(Icons.arrow_forward_rounded, size: 12, color: C.teal),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (msg.corrections.isNotEmpty) ...[
                const SizedBox(height: 8),
                for (final c in msg.corrections)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.check_circle_rounded, size: 14, color: C.teal),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(c, style: body(12, color: C.tealBright, weight: FontWeight.w600)),
                      ),
                    ],
                  ),
              ],
              if (!msg.isUser && msg.quickReplies.isNotEmpty) ...[
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final q in msg.quickReplies)
                      InkWell(
                        onTap: () => _sendMessage(q),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: C.chokaa,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: C.teal.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.touch_app_rounded, size: 12, color: C.teal),
                              const SizedBox(width: 4),
                              Text(q, style: body(11.5, weight: FontWeight.w600, color: C.ink)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      );
    },
  );

  Widget _buildInlineFormView(List units) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      Text(t('Basic Property Details', 'Maelezo ya Msingi'), style: display(15, weight: FontWeight.w700)),
      const SizedBox(height: 12),
      Field(
        t('Property Name', 'Jina la Nyumba'),
        controller: _nameController,
        hint: 'e.g. Mwenge Plaza, Mikocheni Villa',
        onChanged: (val) => _patchField('property_name', val),
      ),
      const SizedBox(height: 12),
      Row(
        children: [
          Expanded(
            child: Field(
              t('District', 'Wilaya'),
              controller: _districtController,
              hint: 'Kinondoni',
              onChanged: (val) => _patchField('district', val),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Field(
              t('Ward', 'Kata'),
              controller: _wardController,
              hint: 'Mikocheni',
              onChanged: (val) => _patchField('ward', val),
            ),
          ),
        ],
      ),
      const SizedBox(height: 12),
      Row(
        children: [
          Expanded(
            child: Field(
              t('Total Monthly Rent (TZS)', 'Kodi ya Mwezi'),
              controller: _rentController,
              hint: '800000',
              keyboard: TextInputType.number,
              onChanged: (val) => _patchField('monthly_rent', int.tryParse(val) ?? 0),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Field(
              t('Security Deposit (TZS)', 'Dhamana'),
              controller: _depositController,
              hint: '800000',
              keyboard: TextInputType.number,
              onChanged: (val) => _patchField('security_deposit', int.tryParse(val)),
            ),
          ),
        ],
      ),
      const SizedBox(height: 20),
      Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(t('Units & Rooms', 'Vyumba & Nafasi'), style: display(15, weight: FontWeight.w700)),
          TextButton.icon(
            onPressed: () => _openUnitDialog(),
            icon: const Icon(Icons.add_rounded, size: 18),
            label: Text(t('Add Unit', 'Ongeza Chumba')),
          ),
        ],
      ),
      const SizedBox(height: 8),
      if (units.isEmpty)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(12)),
          child: Center(
            child: Text(
              t('No individual units added yet. Default single unit will be created.', 'Hakuna vyumba vilivyoongezwa bado. Chumba kimoja kikuu kitaundwa.'),
              style: body(13, color: C.muted),
              textAlign: TextAlign.center,
            ),
          ),
        )
      else
        for (final u in units)
          Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: Text(u['unit_number'] ?? 'Unit', style: display(14.5, weight: FontWeight.w700)),
              subtitle: Text(
                'TZS ${u['monthly_rent']} • ${u['bedrooms'] ?? 1} bed • ${u['unit_type'] ?? 'Room'}',
                style: body(13, color: C.muted),
              ),
              trailing: IconButton(
                icon: const Icon(Icons.edit_outlined, size: 20),
                onPressed: () => _openUnitDialog(Map<String, dynamic>.from(u)),
              ),
            ),
          ),
      const SizedBox(height: 24),
      Button(
        t('Review & Confirm Creation', 'Kagua & Thibitisha Usajili'),
        tone: Tone.green,
        onTap: _openReviewModal,
      ),
    ],
  );
}
