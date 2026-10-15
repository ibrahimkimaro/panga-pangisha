import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../ui.dart';

num _toNum(dynamic val) {
  if (val == null) return 0;
  if (val is num) return val;
  return num.tryParse(val.toString()) ?? 0;
}

String _fmtCurrency(dynamic val) {
  return NumberFormat('#,###').format(_toNum(val));
}

/// Screen for Managing Rental Agreements ("Mkataba wa Upangishaji").
/// Enforces the legally compliant signing workflow:
/// 1. Landlord drafts agreement -> 2. Review draft -> 3. Tenant signs -> 4. Landlord countersigns -> 5. Active & Initial Invoice.
class RentalAgreementsScreen extends StatefulWidget {
  const RentalAgreementsScreen({super.key, this.initialAgreementId});

  final int? initialAgreementId;

  @override
  State<RentalAgreementsScreen> createState() => _RentalAgreementsScreenState();
}

class _RentalAgreementsScreenState extends State<RentalAgreementsScreen> {
  List<Map<String, dynamic>>? _agreements;
  bool _loading = true;
  String? _error;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _fetchAgreements();
  }

  Future<void> _fetchAgreements() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await Api.get('agreements');
      if (res is Map && res['agreements'] is List) {
        if (mounted) {
          setState(() {
            _agreements = List<Map<String, dynamic>>.from(
              res['agreements'] as List,
            );
            _loading = false;
          });

          if (widget.initialAgreementId != null) {
            final target = _agreements?.firstWhere(
              (a) => a['id'] == widget.initialAgreementId,
              orElse: () => {},
            );
            if (target != null && target.isNotEmpty) {
              _openAgreementDetails(target);
            }
          }
        }
      } else {
        setState(() {
          _agreements = [];
          _loading = false;
        });
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

  void _openAgreementDetails(Map<String, dynamic> agreement) {
    sheet(
      context,
      _AgreementDetailsSheet(
        agreement: agreement,
        onAgreementUpdated: _fetchAgreements,
      ),
    );
  }

  void _openDraftWizard() {
    sheet(context, _DraftAgreementWizard(onCreated: _fetchAgreements));
  }

  @override
  Widget build(BuildContext context) {
    final filtered = (_agreements ?? []).where((ag) {
      if (_filterStatus == 'all') return true;
      return ag['status'] == _filterStatus;
    }).toList();

    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(t('Rental Agreements', 'Mikataba ya Upangaji')),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: t('Refresh', 'Sasisha'),
            onPressed: _fetchAgreements,
          ),
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded),
            tooltip: t('Draft Agreement', 'Andaa Mkataba'),
            onPressed: _openDraftWizard,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                _filterChip('all', t('All', 'Yote')),
                const SizedBox(width: 8),
                _filterChip(
                  'pending_tenant_signature',
                  t('Pending Tenant', 'Saini ya Mpangaji'),
                ),
                const SizedBox(width: 8),
                _filterChip(
                  'pending_landlord_signature',
                  t('Pending Landlord', 'Saini ya Mwenye Nyumba'),
                ),
                const SizedBox(width: 8),
                _filterChip(
                  'active',
                  t('Active & Signed', 'Imethibitishwa / Hai'),
                ),
              ],
            ),
          ),

          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.error_outline_rounded,
                            size: 48,
                            color: C.hibiscus,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: body(14, color: C.muted),
                          ),
                          const SizedBox(height: 16),
                          Button(
                            t('Retry', 'Jaribu Tena'),
                            onTap: _fetchAgreements,
                            expand: false,
                          ),
                        ],
                      ),
                    ),
                  )
                : filtered.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.description_outlined,
                            size: 64,
                            color: C.muted,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            t('No Agreements Found', 'Hakuna Mikataba'),
                            style: display(18),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            t(
                              'Draft a new rental contract with standard terms, rent, and inventory before tenant move-in.',
                              'Andaa mkataba mpya wenye masharti, kodi, na orodha ya mali kabla ya mpangaji kuingia.',
                            ),
                            textAlign: TextAlign.center,
                            style: body(14, color: C.muted),
                          ),
                          const SizedBox(height: 20),
                          Button(
                            t('Draft New Agreement', 'Andaa Mkataba Mpya'),
                            onTap: _openDraftWizard,
                            expand: false,
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = filtered[index];
                      return _AgreementCard(
                        agreement: item,
                        onTap: () => _openAgreementDetails(item),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: C.mkoko,
        foregroundColor: Colors.white,
        onPressed: _openDraftWizard,
        icon: const Icon(Icons.add_rounded),
        label: Text(
          t('Draft Agreement', 'Andaa Mkataba'),
          style: body(14, weight: FontWeight.w700, color: Colors.white),
        ),
      ),
    );
  }

  Widget _filterChip(String status, String label) {
    final selected = _filterStatus == status;
    return ChoiceChip(
      selected: selected,
      label: Text(label),
      labelStyle: body(
        13,
        weight: selected ? FontWeight.w700 : FontWeight.w500,
        color: selected ? Colors.white : C.wino,
      ),
      selectedColor: C.mkoko,
      backgroundColor: C.card,
      side: BorderSide(color: selected ? C.mkoko : C.line),
      onSelected: (_) => setState(() => _filterStatus = status),
    );
  }
}

class _AgreementCard extends StatelessWidget {
  const _AgreementCard({required this.agreement, required this.onTap});

  final Map<String, dynamic> agreement;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = agreement['status']?.toString() ?? 'draft';
    final (statusLabel, statusColor, statusBg) = switch (status) {
      'active' => (
        t('Active & Signed', 'Hai & Imesainiwa'),
        C.good,
        C.goodTint,
      ),
      'pending_tenant_signature' => (
        t('Tenant Signature Needed', 'Mpangaji Anasubiriwa'),
        C.shaba,
        C.sand,
      ),
      'pending_landlord_signature' => (
        t('Countersignature Needed', 'Saini Yako Inasubiriwa'),
        C.teal,
        C.tealLight,
      ),
      _ => (status.toUpperCase(), C.muted, C.fill),
    };

    final rent = _fmtCurrency(agreement['monthly_rent']);
    final unit = agreement['unit_number'] ?? 'Chumba';
    final prop = agreement['property_name'] ?? 'Nyumba';
    final tenant = agreement['tenant_name'] ?? 'Mpangaji';

    return Press(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: C.card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: C.line),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    agreement['agreement_number']?.toString() ?? 'MKT-000',
                    style: body(12, color: C.muted, weight: FontWeight.w700),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusLabel,
                    style: body(
                      11,
                      color: statusColor,
                      weight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text('$prop · $unit', style: display(17, weight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('Mpangaji: $tenant', style: body(14, color: C.muted)),
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t('Monthly Rent', 'Kodi ya Mwezi'),
                        style: body(11, color: C.muted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'TZS $rent',
                        style: body(14, weight: FontWeight.w700, color: C.teal),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        t('Tenancy Period', 'Muda wa Mkataba'),
                        style: body(11, color: C.muted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.end,
                      ),
                      Text(
                        '${agreement['starts_on']} hadi ${agreement['ends_on']}',
                        style: body(12, weight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.end,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AgreementDetailsSheet extends StatefulWidget {
  const _AgreementDetailsSheet({
    required this.agreement,
    required this.onAgreementUpdated,
  });

  final Map<String, dynamic> agreement;
  final VoidCallback onAgreementUpdated;

  @override
  State<_AgreementDetailsSheet> createState() => _AgreementDetailsSheetState();
}

class _AgreementDetailsSheetState extends State<_AgreementDetailsSheet> {
  bool _busy = false;

  Future<void> _signAsLandlord() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(t('Countersign Agreement', 'Weka Saini ya Mkataba')),
        content: Text(
          t(
            'By signing, you confirm all terms and agree to activate this tenancy. The initial move-in invoice will be generated automatically.',
            'Kwa kusaini, unathibitisha masharti yote na kuanzisha rasmi upangaji. Ankara ya awali ya kodi na dhamana itazalishwa kiotomatiki.',
          ),
          style: body(14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(t('Cancel', 'Ghairi')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: C.mkoko),
            child: Text(t('Confirm & Sign', 'Thibitisha na Saini')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      final res =
          await Api.post('agreements/${widget.agreement['id']}/sign-landlord', {
            'signer_name': Api.user.value?['fullname'] ?? 'Ibrahim Kimaro',
            'accept_terms': true,
          });

      if (mounted) {
        setState(() => _busy = false);
        toast(
          context,
          res['message']?.toString() ??
              t(
                'Agreement signed and activated!',
                'Mkataba umesainiwa na kuanzishwa!',
              ),
        );
        widget.onAgreementUpdated();
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        toast(context, e.toString());
      }
    }
  }

  Future<void> _signAsTenant() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(t('Tenant Sign Agreement', 'Mpangaji Kusaini Mkataba')),
        content: Text(
          t(
            'Sign this lease agreement as the tenant to accept property rules, rent, deposit, and move-in terms.',
            'Weka saini kama mpangaji ili kukubali kanuni za makazi, kodi ya pango, dhamana, na taratibu za kuishi.',
          ),
          style: body(14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(t('Cancel', 'Ghairi')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: C.teal),
            child: Text(t('Sign Electronically', 'Saini Kidijitali')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      final res =
          await Api.post('agreements/${widget.agreement['id']}/sign-tenant', {
            'signer_name': widget.agreement['tenant_name'] ?? 'Mpangaji',
            'accept_terms': true,
          });

      if (mounted) {
        setState(() => _busy = false);
        toast(
          context,
          res['message']?.toString() ??
              t('Signed successfully!', 'Imesainiwa kikamilifu!'),
        );
        widget.onAgreementUpdated();
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        toast(context, e.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ag = widget.agreement;
    final status = ag['status']?.toString() ?? 'draft';
    final canSignTenant = status == 'pending_tenant_signature';
    final canSignLandlord = status == 'pending_landlord_signature';

    final rent = _fmtCurrency(ag['monthly_rent']);
    final dep = _fmtCurrency(ag['security_deposit']);

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scroll) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: ListView(
          controller: scroll,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: C.line,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ag['agreement_number'] ?? 'MKT-000',
                        style: body(
                          12,
                          color: C.muted,
                          weight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        ag['property_name'] ?? 'Nyumba',
                        style: display(20, weight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.print_rounded),
                  tooltip: t('Print / PDF', 'Chapisha'),
                  onPressed: () {
                    final url =
                        '${Api.host}landlord/agreements/${ag['id']}/print';
                    Clipboard.setData(ClipboardData(text: url));
                    toast(
                      context,
                      '${t("Print link copied:", "Kiungo cha kuchapisha kimenakiliwa:")} $url',
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Key terms banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: C.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: C.line),
              ),
              child: Column(
                children: [
                  _rowItem(
                    t('Tenant Name', 'Jina la Mpangaji'),
                    ag['tenant_name'] ?? '-',
                  ),
                  _rowItem(
                    t('Room / Unit', 'Chumba'),
                    ag['unit_number'] ?? '-',
                  ),
                  _rowItem(t('Monthly Rent', 'Kodi ya Mwezi'), 'TZS $rent'),
                  _rowItem(t('Security Deposit', 'Dhamana'), 'TZS $dep'),
                  _rowItem(
                    t('Start Date', 'Tarehe ya Kuanza'),
                    ag['starts_on'] ?? '-',
                  ),
                  _rowItem(
                    t('End Date', 'Tarehe ya Kuisha'),
                    ag['ends_on'] ?? '-',
                  ),
                  _rowItem(
                    t('Payment Method', 'Njia ya Malipo'),
                    ag['payment_method'] ?? 'M-Pesa / Benki',
                  ),
                  _rowItem(
                    t('Document Version', 'Toleo la Mkataba'),
                    'v${ag['version'] ?? 1}.0',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Signing Workflow Status Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: status == 'active' ? C.goodTint : C.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: status == 'active' ? C.good : C.line),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t('Signature Workflow', 'Hali ya Saini za Mkataba'),
                    style: display(15, weight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  _sigItem(
                    title: t('1. Tenant Signature', '1. Saini ya Mpangaji'),
                    isSigned: ag['tenant_signature'] != null,
                    signer: ag['tenant_signer_name'] ?? ag['tenant_name'],
                    date: ag['tenant_signed_at'],
                  ),
                  const SizedBox(height: 8),
                  _sigItem(
                    title: t(
                      '2. Landlord Countersignature',
                      '2. Saini ya Mwenye Nyumba',
                    ),
                    isSigned: ag['landlord_signature'] != null,
                    signer: ag['landlord_signer_name'] ?? 'Landlord',
                    date: ag['landlord_signed_at'],
                  ),
                  const SizedBox(height: 8),
                  _sigItem(
                    title: t(
                      '3. Tenancy Activation & Initial Invoice',
                      '3. Kuanza Upangishaji & Ankara ya Awali',
                    ),
                    isSigned: status == 'active',
                    signer: status == 'active'
                        ? t('Activated', 'Imekamilika')
                        : t('Pending Dual Signatures', 'Inasubiri Saini Zote'),
                    date: ag['activated_at'],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Action Buttons
            if (canSignTenant) ...[
              Button(
                t(
                  'Tenant: Review & Sign Agreement',
                  'Mpangaji: Hakiki na Weka Saini',
                ),
                onTap: _busy ? null : _signAsTenant,
                busy: _busy,
                tone: Tone.teal,
              ),
              const SizedBox(height: 10),
            ],

            if (canSignLandlord) ...[
              Button(
                t(
                  'Landlord: Countersign & Activate',
                  'Mwenye Nyumba: Saini na Anzisha Upangaji',
                ),
                onTap: _busy ? null : _signAsLandlord,
                busy: _busy,
                tone: Tone.green,
              ),
              const SizedBox(height: 10),
            ],

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _rowItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: body(13, color: C.muted)),
          Text(value, style: body(13, weight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _sigItem({
    required String title,
    required bool isSigned,
    String? signer,
    dynamic date,
  }) {
    return Row(
      children: [
        Icon(
          isSigned
              ? Icons.check_circle_rounded
              : Icons.radio_button_unchecked_rounded,
          color: isSigned ? C.good : C.muted,
          size: 20,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: body(13, weight: FontWeight.w600)),
              if (isSigned && signer != null)
                Text(
                  '${t('Signed by', 'Imesainiwa na')} $signer ${date != null ? "($date)" : ""}',
                  style: body(11, color: C.muted),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DraftAgreementWizard extends StatefulWidget {
  const _DraftAgreementWizard({required this.onCreated});

  final VoidCallback onCreated;

  @override
  State<_DraftAgreementWizard> createState() => _DraftAgreementWizardState();
}

class _DraftAgreementWizardState extends State<_DraftAgreementWizard> {
  final _formKey = GlobalKey<FormState>();
  final _tenantNameCtrl = TextEditingController();
  final _tenantPhoneCtrl = TextEditingController(text: '+255');
  final _tenantEmailCtrl = TextEditingController();
  final _tenantNidaCtrl = TextEditingController();
  final _rentCtrl = TextEditingController(text: '450000');
  final _depositCtrl = TextEditingController(text: '450000');
  final _unitCtrl = TextEditingController(text: 'Room 1');

  int? _selectedHouseId;
  List<Map<String, dynamic>> _myHouses = [];
  int _durationMonths = 6;
  String _language = 'sw';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _loadHouses();
  }

  Future<void> _loadHouses() async {
    try {
      final res = await Api.get('houses/my');
      if (res is List && mounted) {
        setState(() {
          _myHouses = List<Map<String, dynamic>>.from(res);
          if (_myHouses.isNotEmpty) {
            _selectedHouseId = _myHouses.first['id'] as int?;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedHouseId == null && _myHouses.isEmpty) {
      toast(
        context,
        t(
          'No property found. Create a property first.',
          'Tafadhali sajili nyumba kwanza.',
        ),
      );
      return;
    }

    setState(() => _busy = true);
    try {
      final houseId =
          _selectedHouseId ??
          (_myHouses.isNotEmpty ? _myHouses.first['id'] : 1);
      final res = await Api.post('agreements/draft', {
        'house_id': houseId,
        'tenant_name': _tenantNameCtrl.text.trim(),
        'tenant_phone': _tenantPhoneCtrl.text.trim(),
        'tenant_email': _tenantEmailCtrl.text.trim().isEmpty
            ? null
            : _tenantEmailCtrl.text.trim(),
        'tenant_nida': _tenantNidaCtrl.text.trim().isEmpty
            ? null
            : _tenantNidaCtrl.text.trim(),
        'unit_number': _unitCtrl.text.trim(),
        'monthly_rent': num.tryParse(_rentCtrl.text) ?? 450000,
        'security_deposit': num.tryParse(_depositCtrl.text) ?? 450000,
        'starts_on': DateFormat('yyyy-MM-dd').format(DateTime.now()),
        'duration_months': _durationMonths,
        'language': _language,
      });

      if (mounted) {
        setState(() => _busy = false);
        toast(
          context,
          res['message']?.toString() ??
              t(
                'Draft agreement prepared! Preview and save.',
                'Mkataba umeandaliwa! Hakiki na uhifadhi.',
              ),
        );
        widget.onCreated();
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        toast(context, e.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.6,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scroll) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Form(
          key: _formKey,
          child: ListView(
            controller: scroll,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: C.line,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                t('Draft Rental Agreement', 'Andaa Mkataba wa Upangishaji'),
                style: display(20, weight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                t(
                  'Organize tenant details, rent, and lease terms. You will preview and confirm the draft before delivering to tenant.',
                  'Andaa taarifa za mpangaji, kodi, na muda wa upangishaji. Utapata fursa ya kuhakiki kabla ya kutuma.',
                ),
                style: body(13, color: C.muted),
              ),
              const SizedBox(height: 20),

              // Property Selector
              if (_myHouses.isNotEmpty) ...[
                Text(
                  t('Select Property', 'Chagua Nyumba'),
                  style: body(13, weight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<int>(
                  initialValue: _selectedHouseId,
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                  ),
                  items: _myHouses.map((h) {
                    return DropdownMenuItem<int>(
                      value: h['id'] as int?,
                      child: Text(h['property_name'] ?? 'Nyumba'),
                    );
                  }).toList(),
                  onChanged: (val) => setState(() => _selectedHouseId = val),
                ),
                const SizedBox(height: 16),
              ],

              Field(
                t('Room / Unit Number', 'Nambari ya Chumba'),
                controller: _unitCtrl,
                hint: 'e.g. Room 4, A2',
              ),
              const SizedBox(height: 14),

              Field(
                t('Tenant Full Name', 'Jina Kamili la Mpangaji'),
                controller: _tenantNameCtrl,
                hint: 'e.g. Hamisi Bakari',
                validator: (v) => v.isEmpty
                    ? t(
                        'Tenant name is required',
                        'Jina la mpangaji linahitajika',
                      )
                    : null,
              ),
              const SizedBox(height: 14),

              Field(
                t('Tenant Phone Number', 'Nambari ya Simu ya Mpangaji'),
                controller: _tenantPhoneCtrl,
                hint: '+255 7...',
                keyboard: TextInputType.phone,
                validator: (v) => v.length < 8
                    ? t(
                        'Valid phone number is required',
                        'Weka nambari sahihi ya simu',
                      )
                    : null,
              ),
              const SizedBox(height: 14),

              Field(
                t('Tenant NIDA ID (Optional)', 'Nambari ya NIDA (Hiari)'),
                controller: _tenantNidaCtrl,
                hint: '1990...',
              ),
              const SizedBox(height: 14),

              Row(
                children: [
                  Expanded(
                    child: Field(
                      t('Monthly Rent (TZS)', 'Kodi ya Mwezi'),
                      controller: _rentCtrl,
                      keyboard: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Field(
                      t('Security Deposit (TZS)', 'Dhamana ya Nyumba'),
                      controller: _depositCtrl,
                      keyboard: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Duration selector
              Text(
                t('Lease Duration', 'Muda wa Upangishaji'),
                style: body(13, weight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  for (final months in [3, 6, 12])
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        selected: _durationMonths == months,
                        label: Text('$months ${t("Months", "Miezi")}'),
                        onSelected: (_) =>
                            setState(() => _durationMonths = months),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),

              // Language selector
              Text(
                t('Contract Language', 'Lugha ya Mkataba'),
                style: body(13, weight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  ChoiceChip(
                    selected: _language == 'sw',
                    label: const Text('Kiswahili (Tanzania)'),
                    onSelected: (_) => setState(() => _language = 'sw'),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    selected: _language == 'en',
                    label: const Text('English (Lease Agreement)'),
                    onSelected: (_) => setState(() => _language = 'en'),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              Button(
                t(
                  'Organize & Preview Draft Agreement',
                  'Andaa na Hakiki Mkataba',
                ),
                onTap: _busy ? null : _submit,
                busy: _busy,
                tone: Tone.green,
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}
