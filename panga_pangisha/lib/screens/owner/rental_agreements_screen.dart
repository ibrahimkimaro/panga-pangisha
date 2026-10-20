import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../ui.dart';
import '../../services/rental_agreement_pdf.dart';

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
    push(
      context,
      AgreementDetailsScreen(
        agreement: agreement,
        onAgreementUpdated: _fetchAgreements,
      ),
    );
  }

  void _openDraftWizard([Map<String, dynamic>? initialRequest]) {
    push(
      context,
      DraftAgreementScreen(
        onCreated: _fetchAgreements,
        initialRequest: initialRequest,
        initialHouse: initialRequest?['house'],
        initialTenant: initialRequest?['user'],
      ),
    );
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

class AgreementDetailsScreen extends StatefulWidget {
  const AgreementDetailsScreen({
    super.key,
    required this.agreement,
    required this.onAgreementUpdated,
  });

  final Map<String, dynamic> agreement;
  final VoidCallback onAgreementUpdated;

  @override
  State<AgreementDetailsScreen> createState() => _AgreementDetailsScreenState();
}

class _AgreementDetailsScreenState extends State<AgreementDetailsScreen> {
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

  Future<void> _downloadPdf() async {
    final ag = widget.agreement;
    final terms = ag['terms'] is Map ? Map<String, dynamic>.from(ag['terms']) : {};
    final activeTerms = terms['en'] is Map
        ? Map<String, dynamic>.from(terms['en'])
        : (terms['sw'] is Map ? Map<String, dynamic>.from(terms['sw']) : {});
    final parties = activeTerms['parties'] is Map ? Map<String, dynamic>.from(activeTerms['parties']) : {};
    final lLandlord = parties['landlord'] is Map ? Map<String, dynamic>.from(parties['landlord']) : {};
    final tTenant = parties['tenant'] is Map ? Map<String, dynamic>.from(parties['tenant']) : {};

    try {
      await RentalAgreementPdfService.printOrDownloadPdf(
        agreementNumber: ag['agreement_number']?.toString() ?? 'MKT-2026-001',
        agreementDate: DateTime.tryParse(ag['created_at']?.toString() ?? '') ?? DateTime.now(),
        landlordName: lLandlord['name']?.toString() ?? Api.user.value?['fullname'] ?? 'Landlord',
        landlordIdNumber: Api.user.value?['nida_number']?.toString() ?? Api.user.value?['nida']?.toString() ?? '19901234-56789-00001-22',
        landlordPhone: lLandlord['phone']?.toString() ?? Api.user.value?['phone_number']?.toString() ?? '+255 712 345 678',
        landlordEmail: lLandlord['email']?.toString() ?? Api.user.value?['email']?.toString() ?? '',
        landlordAddress: Api.user.value?['address']?.toString() ?? 'Dar es Salaam, Tanzania',
        landlordCountry: 'Tanzania',
        tenantName: ag['tenant_name']?.toString() ?? tTenant['name']?.toString() ?? 'Tenant',
        tenantIdNumber: ag['tenant_nida']?.toString() ?? tTenant['nida']?.toString() ?? 'Pending ID/NIDA',
        tenantPhone: ag['tenant_phone']?.toString() ?? tTenant['phone']?.toString() ?? '',
        tenantEmail: ag['tenant_email']?.toString() ?? tTenant['email']?.toString() ?? '',
        tenantAddress: 'Tanzania',
        tenantCountry: 'Tanzania',
        propertyAddress: ag['property_name']?.toString() ?? 'Dar es Salaam, Tanzania',
        propertyType: 'Residential Accommodation',
        unitNumber: ag['unit_number']?.toString() ?? 'Room 1',
        bedrooms: '1 Bedroom',
        permittedUse: 'Residential only',
        commencementDate: ag['starts_on']?.toString() ?? DateFormat('dd/MM/yyyy').format(DateTime.now()),
        expiryDate: ag['ends_on']?.toString() ?? '',
        renewalConditions: 'Renewable upon 30 days prior written notice subject to mutual consent.',
        monthlyRent: _toNum(ag['monthly_rent']),
        paymentDueDate: '1st day of each billing cycle',
        paymentMethod: ag['payment_method']?.toString() ?? 'M-Pesa / Tigo Pesa / Airtel Money / Bank',
        paymentReference: ag['agreement_number']?.toString() ?? '',
        securityDeposit: _toNum(ag['security_deposit']),
        depositPaymentDate: ag['starts_on']?.toString() ?? DateFormat('dd/MM/yyyy').format(DateTime.now()),
        depositRefundTerms: 'Refundable within 14 days following handover inspection, subject to lawful deductions.',
        electricityArrangement: 'Tenant responsibility via LUKU sub-meter',
        waterArrangement: 'Tenant responsibility via DAWASA sub-meter / Shared',
        wasteCollectionArrangement: 'Municipal collection fee per building schedule',
        otherCharges: 'None',
        landlordSignatureName: ag['landlord_signer_name']?.toString(),
        landlordSignedDate: ag['landlord_signed_at']?.toString(),
        tenantSignatureName: ag['tenant_signer_name']?.toString(),
        tenantSignedDate: ag['tenant_signed_at']?.toString(),
        isLandlordSigned: ag['landlord_signature'] != null,
        isTenantSigned: ag['tenant_signature'] != null,
      );
    } catch (e) {
      if (mounted) toast(context, e.toString());
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

    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(ag['property_name'] ?? t('Agreement Details', 'Taarifa za Mkataba')),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_rounded),
            tooltip: t('Download PDF Agreement', 'Pakua Mkataba wa PDF'),
            onPressed: _downloadPdf,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
        children: [
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
                IconButton.filledTonal(
                  icon: const Icon(Icons.picture_as_pdf_rounded),
                  tooltip: t('Download PDF Agreement', 'Pakua Mkataba wa PDF'),
                  onPressed: _downloadPdf,
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

            Button(
              t('Download / Print Official PDF', 'Pakua Mkataba Kamili (PDF)'),
              icon: Icons.picture_as_pdf_rounded,
              tone: Tone.plain,
              onTap: _downloadPdf,
            ),
            const SizedBox(height: 30),
          ],
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

class _SignaturePadWidget extends StatefulWidget {
  const _SignaturePadWidget({
    required this.signerName,
    required this.roleLabel,
    required this.onSigned,
    this.initialSigned = false,
  });

  final String signerName;
  final String roleLabel;
  final ValueChanged<String?> onSigned;
  final bool initialSigned;

  @override
  State<_SignaturePadWidget> createState() => _SignaturePadWidgetState();
}

class _SignaturePadWidgetState extends State<_SignaturePadWidget> {
  final List<Offset?> _points = [];
  bool _isSigned = false;
  bool _useDigitalScript = true;

  @override
  void initState() {
    super.initState();
    _isSigned = widget.initialSigned;
  }

  void _clear() {
    setState(() {
      _points.clear();
      _isSigned = false;
    });
    widget.onSigned(null);
  }

  void _confirmDigitalSignature() {
    setState(() {
      _isSigned = true;
    });
    widget.onSigned(widget.signerName);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _isSigned ? const Color(0xFFF0FDF4) : C.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isSigned ? const Color(0xFF16A34A) : C.line,
          width: _isSigned ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${widget.roleLabel}: ${widget.signerName}',
                style: body(13, weight: FontWeight.w700),
              ),
              if (_isSigned)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.verified_rounded, size: 16, color: Color(0xFF16A34A)),
                    const SizedBox(width: 4),
                    Text(
                      t('Signed', 'Imesainiwa'),
                      style: body(11, weight: FontWeight.w700, color: const Color(0xFF16A34A)),
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (_useDigitalScript)
            Container(
              height: 56,
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.centerLeft,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: C.line),
              ),
              child: _isSigned
                  ? Text(
                      widget.signerName,
                      style: const TextStyle(
                        fontFamily: 'Bricolage',
                        fontSize: 22,
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF0F766E),
                      ),
                    )
                  : Text(
                      t('Tap "Sign Electronically" below', 'Gusa "Weka Saini" hapa chini'),
                      style: body(12, color: C.muted),
                    ),
            )
          else
            Container(
              height: 90,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: C.line),
              ),
              child: GestureDetector(
                onPanUpdate: (details) {
                  setState(() {
                    _points.add(details.localPosition);
                    _isSigned = true;
                  });
                  widget.onSigned(widget.signerName);
                },
                onPanEnd: (_) => setState(() => _points.add(null)),
                child: CustomPaint(
                  painter: _SignaturePainter(_points),
                  child: _points.isEmpty
                      ? Center(
                          child: Text(
                            t('Draw signature here with finger/mouse', 'Chora saini yako hapa'),
                            style: body(12, color: C.muted),
                          ),
                        )
                      : null,
                ),
              ),
            ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: () {
                  setState(() {
                    _useDigitalScript = !_useDigitalScript;
                    _points.clear();
                  });
                },
                icon: Icon(
                  _useDigitalScript ? Icons.draw_outlined : Icons.font_download_outlined,
                  size: 16,
                  color: C.muted,
                ),
                label: Text(
                  _useDigitalScript
                      ? t('Draw by Hand', 'Chora kwa Mkono')
                      : t('Digital Script', 'Maandishi'),
                  style: body(11, color: C.muted),
                ),
              ),
              if (!_isSigned && _useDigitalScript)
                FilledButton.tonal(
                  onPressed: _confirmDigitalSignature,
                  style: FilledButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    backgroundColor: C.tealLight,
                  ),
                  child: Text(
                    t('Sign Electronically', 'Weka Saini'),
                    style: body(12, weight: FontWeight.w700, color: C.teal),
                  ),
                )
              else if (_isSigned)
                TextButton(
                  onPressed: _clear,
                  child: Text(
                    t('Clear / Re-sign', 'Futa / Saini Upya'),
                    style: body(11, color: C.hibiscus),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  _SignaturePainter(this.points);
  final List<Offset?> points;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0F2A3F)
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2.5;

    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}

/// Comprehensive 14-Section Residential Rental Agreement Draft Screen
class DraftAgreementScreen extends StatefulWidget {
  const DraftAgreementScreen({
    super.key,
    required this.onCreated,
    this.initialHouseId,
    this.initialHouse,
    this.initialTenant,
    this.initialRequest,
  });

  final VoidCallback onCreated;
  final int? initialHouseId;
  final Map<String, dynamic>? initialHouse;
  final Map<String, dynamic>? initialTenant;
  final Map<String, dynamic>? initialRequest;

  @override
  State<DraftAgreementScreen> createState() => _DraftAgreementScreenState();
}

typedef DraftAgreementWizard = DraftAgreementScreen;

class _DraftAgreementScreenState extends State<DraftAgreementScreen> {
  final _formKey = GlobalKey<FormState>();

  // Reference & Date
  late String _agreementRef;
  final DateTime _agreementDate = DateTime.now();

  // Section 1: Landlord Details (Auto-filled from Api.user)
  final _landlordNameCtrl = TextEditingController();
  final _landlordNidaCtrl = TextEditingController();
  final _landlordPhoneCtrl = TextEditingController();
  final _landlordEmailCtrl = TextEditingController();
  final _landlordAddressCtrl = TextEditingController();
  final _landlordCountryCtrl = TextEditingController(text: 'Tanzania');

  // Section 1: Tenant Details (Auto-filled from Request / DB)
  final _tenantNameCtrl = TextEditingController();
  final _tenantNidaCtrl = TextEditingController();
  final _tenantPhoneCtrl = TextEditingController();
  final _tenantEmailCtrl = TextEditingController();
  final _tenantAddressCtrl = TextEditingController();
  final _tenantCountryCtrl = TextEditingController(text: 'Tanzania');

  // Section 2: Property Details
  int? _selectedHouseId;
  List<Map<String, dynamic>> _myHouses = [];
  final _propertyAddressCtrl = TextEditingController();
  final _propertyTypeCtrl = TextEditingController(text: 'House / Apartment');
  final _unitCtrl = TextEditingController(text: 'Room 1');
  final _bedroomsCtrl = TextEditingController(text: '1 Bedroom (Self-contained)');
  final _permittedUseCtrl = TextEditingController(text: 'Residential only, unless otherwise agreed in writing.');

  // Section 3: Rental Period
  DateTime _startsOn = DateTime.now();
  int _durationMonths = 6;
  final _renewalConditionsCtrl = TextEditingController(
    text: 'Any renewal or extension shall be agreed upon in writing 30 days prior and comply with applicable law.',
  );

  // Section 4: Rent and Payment Terms
  final _rentCtrl = TextEditingController(text: '450000');
  final _paymentDueDateCtrl = TextEditingController(text: '1st day of each month');
  final _paymentMethodCtrl = TextEditingController(text: 'M-Pesa / Mobile Money');
  final _paymentRefCtrl = TextEditingController(text: 'PangaPangisha Lipa Namba');

  // Section 5: Security Deposit
  final _depositCtrl = TextEditingController(text: '450000');
  final _depositDateCtrl = TextEditingController(text: DateFormat('dd/MM/yyyy').format(DateTime.now()));
  final _depositRefundTermsCtrl = TextEditingController(
    text: 'Refundable within 14 days following handover inspection, subject to lawful deductions.',
  );

  // Section 6: Utilities and Other Charges
  final _electricityCtrl = TextEditingController(text: 'Tenant responsibility via LUKU sub-meter tokens.');
  final _waterCtrl = TextEditingController(text: 'Tenant responsibility via DAWASA sub-meter / Shared arrangement.');
  final _wasteCtrl = TextEditingController(text: 'Tenant / Landlord per building sanitation schedule.');
  final _otherChargesCtrl = TextEditingController(text: 'None (Building security included in rent).');

  // Section 13: Special Conditions
  final List<String> _specialConditions = [
    'Quiet hours are strictly observed between 10:00 PM and 6:00 AM.',
    'Subletting or transferring occupancy without prior written landlord approval is prohibited.',
    'Waste and garbage shall be deposited in designated bins following building sanitization rules.',
  ];
  final _newConditionCtrl = TextEditingController();

  // Section 14: Signatures
  String? _landlordSignature;
  String? _tenantSignature;
  bool _busy = false;

  // Incoming client requests from DB
  List<Map<String, dynamic>> _clientRequests = [];
  Map<String, dynamic>? _selectedClientRequest;

  @override
  void initState() {
    super.initState();
    _agreementRef = 'MKT-${DateTime.now().year}-${(DateTime.now().millisecondsSinceEpoch % 100000).toString().padLeft(5, '0')}';

    // Auto-fill Landlord from logged in user
    final u = Api.user.value;
    _landlordNameCtrl.text = u?['fullname']?.toString() ?? 'Ibrahim Kimaro';
    _landlordNidaCtrl.text = u?['nida_number']?.toString() ?? u?['nida']?.toString() ?? '19901234-56789-00001-22';
    _landlordPhoneCtrl.text = u?['phone_number']?.toString() ?? u?['phone']?.toString() ?? '+255 712 345 678';
    _landlordEmailCtrl.text = u?['email']?.toString() ?? 'landlord@pangapangisha.com';
    _landlordAddressCtrl.text = u?['address']?.toString() ?? 'Dar es Salaam, Tanzania';

    // Auto-fill Tenant from initial parameters if supplied
    if (widget.initialTenant != null) {
      _applyTenantData(widget.initialTenant!);
    }
    if (widget.initialHouse != null) {
      _applyHouseData(widget.initialHouse!);
    }
    if (widget.initialRequest != null) {
      _selectedClientRequest = widget.initialRequest;
    }

    _loadData();
  }

  void _applyTenantData(Map<String, dynamic> tenant) {
    _tenantNameCtrl.text = tenant['fullname']?.toString() ?? tenant['name']?.toString() ?? _tenantNameCtrl.text;
    _tenantPhoneCtrl.text = tenant['phone_number']?.toString() ?? tenant['phone']?.toString() ?? _tenantPhoneCtrl.text;
    _tenantEmailCtrl.text = tenant['email']?.toString() ?? _tenantEmailCtrl.text;
    _tenantNidaCtrl.text = tenant['nida_number']?.toString() ?? tenant['nida']?.toString() ?? _tenantNidaCtrl.text;
    _tenantAddressCtrl.text = tenant['address']?.toString() ?? _tenantAddressCtrl.text;
  }

  void _applyHouseData(Map<String, dynamic> house) {
    _selectedHouseId = house['id'] as int?;
    final address = [house['ward'], house['district'], 'Tanzania'].where((e) => e != null && e.toString().isNotEmpty).join(', ');
    _propertyAddressCtrl.text = address.isNotEmpty ? address : (house['property_name'] ?? 'Dar es Salaam, Tanzania');
    _propertyTypeCtrl.text = house['type']?.toString() ?? 'House / Apartment';
    if (house['monthly_rent'] != null) {
      _rentCtrl.text = house['monthly_rent'].toString();
      _depositCtrl.text = house['monthly_rent'].toString();
    }
  }

  Future<void> _loadData() async {
    try {
      final housesRes = await Api.get('houses/my');
      if (housesRes is List && mounted) {
        setState(() {
          _myHouses = List<Map<String, dynamic>>.from(housesRes);
          if (_selectedHouseId == null && _myHouses.isNotEmpty) {
            _applyHouseData(_myHouses.first);
          }
        });
      }
    } catch (_) {}

    try {
      final requestsRes = await Api.get('viewing-requests', {'as': 'owner'});
      if (requestsRes is List && mounted) {
        setState(() {
          _clientRequests = List<Map<String, dynamic>>.from(requestsRes);
        });
      }
    } catch (_) {}
  }

  void _selectClientRequest(Map<String, dynamic> req) {
    setState(() {
      _selectedClientRequest = req;
      if (req['user'] is Map) {
        _applyTenantData(Map<String, dynamic>.from(req['user']));
      }
      if (req['house'] is Map) {
        _applyHouseData(Map<String, dynamic>.from(req['house']));
      }
      if (req['preferred_unit'] != null) {
        _unitCtrl.text = req['preferred_unit'].toString();
      }
    });

    toast(
      context,
      t(
        'Tenant & room details auto-filled from client request!',
        'Taarifa za mpangaji na chumba zimewekwa kikamilifu!',
      ),
    );
  }

  DateTime get _expiryDate => DateTime(_startsOn.year, _startsOn.month + _durationMonths, _startsOn.day);

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startsOn,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _startsOn = picked);
    }
  }

  Future<void> _downloadOrPrintPdf() async {
    try {
      await RentalAgreementPdfService.printOrDownloadPdf(
        agreementNumber: _agreementRef,
        agreementDate: _agreementDate,
        landlordName: _landlordNameCtrl.text.trim().isEmpty ? 'Ibrahim Kimaro' : _landlordNameCtrl.text.trim(),
        landlordIdNumber: _landlordNidaCtrl.text.trim().isEmpty ? '19901234-56789-00001-22' : _landlordNidaCtrl.text.trim(),
        landlordPhone: _landlordPhoneCtrl.text.trim(),
        landlordEmail: _landlordEmailCtrl.text.trim(),
        landlordAddress: _landlordAddressCtrl.text.trim().isEmpty ? 'Dar es Salaam, Tanzania' : _landlordAddressCtrl.text.trim(),
        landlordCountry: _landlordCountryCtrl.text.trim().isEmpty ? 'Tanzania' : _landlordCountryCtrl.text.trim(),
        tenantName: _tenantNameCtrl.text.trim().isEmpty ? 'Tenant' : _tenantNameCtrl.text.trim(),
        tenantIdNumber: _tenantNidaCtrl.text.trim().isEmpty ? 'Pending Verification' : _tenantNidaCtrl.text.trim(),
        tenantPhone: _tenantPhoneCtrl.text.trim(),
        tenantEmail: _tenantEmailCtrl.text.trim(),
        tenantAddress: _tenantAddressCtrl.text.trim().isEmpty ? 'Tanzania' : _tenantAddressCtrl.text.trim(),
        tenantCountry: _tenantCountryCtrl.text.trim().isEmpty ? 'Tanzania' : _tenantCountryCtrl.text.trim(),
        propertyAddress: _propertyAddressCtrl.text.trim().isEmpty ? 'Dar es Salaam, Tanzania' : _propertyAddressCtrl.text.trim(),
        propertyType: _propertyTypeCtrl.text.trim(),
        unitNumber: _unitCtrl.text.trim().isEmpty ? 'Room 1' : _unitCtrl.text.trim(),
        bedrooms: _bedroomsCtrl.text.trim(),
        permittedUse: _permittedUseCtrl.text.trim(),
        commencementDate: DateFormat('dd/MM/yyyy').format(_startsOn),
        expiryDate: DateFormat('dd/MM/yyyy').format(_expiryDate),
        renewalConditions: _renewalConditionsCtrl.text.trim(),
        monthlyRent: num.tryParse(_rentCtrl.text) ?? 450000,
        paymentDueDate: _paymentDueDateCtrl.text.trim(),
        paymentMethod: _paymentMethodCtrl.text.trim(),
        paymentReference: _paymentRefCtrl.text.trim(),
        securityDeposit: num.tryParse(_depositCtrl.text) ?? 450000,
        depositPaymentDate: _depositDateCtrl.text.trim(),
        depositRefundTerms: _depositRefundTermsCtrl.text.trim(),
        electricityArrangement: _electricityCtrl.text.trim(),
        waterArrangement: _waterCtrl.text.trim(),
        wasteCollectionArrangement: _wasteCtrl.text.trim(),
        otherCharges: _otherChargesCtrl.text.trim(),
        specialConditions: _specialConditions,
        landlordSignatureName: _landlordSignature,
        landlordSignedDate: _landlordSignature != null ? DateFormat('dd/MM/yyyy').format(DateTime.now()) : null,
        tenantSignatureName: _tenantSignature,
        tenantSignedDate: _tenantSignature != null ? DateFormat('dd/MM/yyyy').format(DateTime.now()) : null,
        isLandlordSigned: _landlordSignature != null,
        isTenantSigned: _tenantSignature != null,
      );
    } catch (e) {
      if (mounted) toast(context, e.toString());
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedHouseId == null && _myHouses.isEmpty) {
      toast(context, t('No property found. Create a property first.', 'Tafadhali sajili nyumba kwanza.'));
      return;
    }

    setState(() => _busy = true);
    try {
      final houseId = _selectedHouseId ?? (_myHouses.isNotEmpty ? _myHouses.first['id'] : 1);
      final res = await Api.post('agreements/draft', {
        'house_id': houseId,
        'tenant_name': _tenantNameCtrl.text.trim(),
        'tenant_phone': _tenantPhoneCtrl.text.trim(),
        'tenant_email': _tenantEmailCtrl.text.trim().isEmpty ? null : _tenantEmailCtrl.text.trim(),
        'tenant_nida': _tenantNidaCtrl.text.trim().isEmpty ? null : _tenantNidaCtrl.text.trim(),
        'unit_number': _unitCtrl.text.trim(),
        'monthly_rent': num.tryParse(_rentCtrl.text) ?? 450000,
        'security_deposit': num.tryParse(_depositCtrl.text) ?? 450000,
        'starts_on': DateFormat('yyyy-MM-dd').format(_startsOn),
        'duration_months': _durationMonths,
        'language': 'sw',
        'special_conditions': _specialConditions,
        'landlord_signature': _landlordSignature,
        'tenant_signature': _tenantSignature,
      });

      if (mounted) {
        setState(() => _busy = false);
        toast(
          context,
          res['message']?.toString() ??
              t('Draft agreement created & saved! PDF ready for download.', 'Mkataba umeandaliwa na kuhifadhiwa!'),
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

  void _addSpecialCondition() {
    final text = _newConditionCtrl.text.trim();
    if (text.isNotEmpty) {
      setState(() {
        _specialConditions.add(text);
        _newConditionCtrl.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(t('Draft Rental Agreement', 'Andaa Mkataba wa Upangaji')),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_rounded),
            tooltip: t('Download PDF', 'Pakua PDF'),
            onPressed: _downloadOrPrintPdf,
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 60),
          children: [

              // Agreement Title & Reference
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t('RESIDENTIAL RENTAL AGREEMENT', 'MKATABA WA UPANGISHAJI WA MAKAZI'),
                          style: display(19, weight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${t("Agreement Reference:", "Nambari ya Kumbukumbu:")} $_agreementRef',
                          style: body(12, color: C.teal, weight: FontWeight.w700),
                        ),
                        Text(
                          '${t("Date of Agreement:", "Tarehe ya Mkataba:")} ${DateFormat("dd/MM/yyyy").format(_agreementDate)}',
                          style: body(12, color: C.muted),
                        ),
                      ],
                    ),
                  ),
                  IconButton.filledTonal(
                    icon: const Icon(Icons.picture_as_pdf_rounded),
                    tooltip: t('Download PDF', 'Pakua PDF'),
                    onPressed: _downloadOrPrintPdf,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // AUTO-FILL FROM CLIENT DATABASE / INCOMING ROOM REQUESTS
              if (_clientRequests.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: C.tealLight.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: C.teal.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.auto_awesome_rounded, size: 18, color: Color(0xFF0F766E)),
                          const SizedBox(width: 6),
                          Text(
                            t('Auto-fill from Tenant Request / Client DB', 'Weka Taarifa kutoka Maombi ya Wateja'),
                            style: body(13, weight: FontWeight.w700, color: const Color(0xFF0F766E)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        t(
                          'Tap a tenant who picked a room to auto-fill their NIDA, phone, address, and chosen room details:',
                          'Gusa mpangaji aliyeomba chumba kuweka taarifa zake za NIDA, simu, na chumba kiotomatiki:',
                        ),
                        style: body(11.5, color: C.muted),
                      ),
                      const SizedBox(height: 10),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: _clientRequests.map((req) {
                            final isSel = _selectedClientRequest?['id'] == req['id'];
                            final user = req['user'] as Map<String, dynamic>?;
                            final house = req['house'] as Map<String, dynamic>?;
                            final name = user?['fullname'] ?? user?['name'] ?? 'Mpangaji';
                            final prop = house?['property_name'] ?? 'Nyumba';
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                selected: isSel,
                                selectedColor: C.teal,
                                label: Text(
                                  '$name · $prop',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                                    color: isSel ? Colors.white : C.wino,
                                  ),
                                ),
                                onSelected: (_) => _selectClientRequest(req),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // SECTION 1: PARTIES TO THE AGREEMENT
              _sectionCard(
                title: '1. PARTIES TO THE AGREEMENT (PANDE ZA MKATABA)',
                icon: Icons.people_outline_rounded,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Landlord block
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: C.sand.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: C.line),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t("Landlord (Lessor / Mwenye Nyumba)", "Mwenye Nyumba (Lessor)"),
                            style: body(13, weight: FontWeight.w700, color: C.mkoko),
                          ),
                          const SizedBox(height: 8),
                          Field(t('Full Name', 'Jina Kamili'), controller: _landlordNameCtrl),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(child: Field(t('ID / NIDA Number', 'NIDA / Namba ya Kitambulisho'), controller: _landlordNidaCtrl)),
                              const SizedBox(width: 8),
                              Expanded(child: Field(t('Phone Number', 'Simu'), controller: _landlordPhoneCtrl, keyboard: TextInputType.phone)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(child: Field(t('Email Address', 'Barua Pepe'), controller: _landlordEmailCtrl)),
                              const SizedBox(width: 8),
                              Expanded(child: Field(t('Country', 'Nchi'), controller: _landlordCountryCtrl)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Field(t('Address', 'Anwani ya Makazi'), controller: _landlordAddressCtrl),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Tenant block
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: C.tealLight.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: C.line),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t("Tenant (Lessee / Mpangaji)", "Mpangaji (Lessee)"),
                            style: body(13, weight: FontWeight.w700, color: C.teal),
                          ),
                          const SizedBox(height: 8),
                          Field(
                            t('Full Name', 'Jina Kamili la Mpangaji'),
                            controller: _tenantNameCtrl,
                            validator: (v) => v.isEmpty ? t('Tenant name is required', 'Jina la mpangaji linahitajika') : null,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: Field(
                                  t('ID / NIDA Number', 'NIDA ya Mpangaji'),
                                  controller: _tenantNidaCtrl,
                                  hint: '19901234-56789-00001-22',
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Field(
                                  t('Phone Number', 'Simu ya Mpangaji'),
                                  controller: _tenantPhoneCtrl,
                                  keyboard: TextInputType.phone,
                                  validator: (v) => v.length < 8 ? t('Valid phone required', 'Namba sahihi inahitajika') : null,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(child: Field(t('Email Address', 'Barua Pepe'), controller: _tenantEmailCtrl)),
                              const SizedBox(width: 8),
                              Expanded(child: Field(t('Country', 'Nchi'), controller: _tenantCountryCtrl)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Field(t('Current / Previous Address', 'Anwani ya Mpangaji'), controller: _tenantAddressCtrl),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // SECTION 2: PROPERTY DETAILS
              _sectionCard(
                title: '2. PROPERTY DETAILS (TAARIFA ZA NYUMBA NA CHUMBA)',
                icon: Icons.home_work_outlined,
                child: Column(
                  children: [
                    if (_myHouses.isNotEmpty) ...[
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(t('Select Owned Property', 'Chagua Nyumba'), style: body(12, weight: FontWeight.w700)),
                      ),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<int>(
                        initialValue: _selectedHouseId,
                        decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12)),
                        items: _myHouses.map((h) {
                          return DropdownMenuItem<int>(
                            value: h['id'] as int?,
                            child: Text(h['property_name'] ?? 'Nyumba'),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() {
                            _selectedHouseId = val;
                            final target = _myHouses.firstWhere((h) => h['id'] == val, orElse: () => {});
                            if (target.isNotEmpty) _applyHouseData(target);
                          });
                        },
                      ),
                      const SizedBox(height: 10),
                    ],
                    Field(t('Full Property Address', 'Anwani Kamili ya Nyumba'), controller: _propertyAddressCtrl),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: Field(t('Unit or Room Number', 'Namba ya Chumba'), controller: _unitCtrl)),
                        const SizedBox(width: 8),
                        Expanded(child: Field(t('Property Type', 'Aina ya Nyumba'), controller: _propertyTypeCtrl)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: Field(t('Number of Bedrooms', 'Idadi ya Vyumba'), controller: _bedroomsCtrl)),
                        const SizedBox(width: 8),
                        Expanded(child: Field(t('Permitted Use', 'Matumizi'), controller: _permittedUseCtrl)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // SECTION 3: RENTAL PERIOD
              _sectionCard(
                title: '3. RENTAL PERIOD (MUDA WA UPANGISHAJI)',
                icon: Icons.calendar_month_outlined,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: _pickStartDate,
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.line)),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(t('Commencement Date', 'Tarehe ya Kuanza'), style: body(11, color: C.muted)),
                                  const SizedBox(height: 4),
                                  Text(DateFormat('dd/MM/yyyy').format(_startsOn), style: body(14, weight: FontWeight.w700)),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.line)),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(t('Expiry Date', 'Tarehe ya Kumalizika'), style: body(11, color: C.muted)),
                                const SizedBox(height: 4),
                                Text(DateFormat('dd/MM/yyyy').format(_expiryDate), style: body(14, weight: FontWeight.w700, color: C.teal)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(t('Lease Duration', 'Muda wa Mkataba'), style: body(12, weight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Row(
                      children: [3, 6, 12].map((months) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            selected: _durationMonths == months,
                            label: Text('$months ${t("Months", "Miezi")}'),
                            onSelected: (_) => setState(() => _durationMonths = months),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 10),
                    Field(t('Renewal Conditions', 'Masharti ya Kufanya Upya'), controller: _renewalConditionsCtrl),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // SECTION 4: RENT AND PAYMENT TERMS
              _sectionCard(
                title: '4. RENT AND PAYMENT TERMS (KODI NA UTARATIBU WA MALIPO)',
                icon: Icons.payments_outlined,
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: Field(t('Monthly Rent (TZS)', 'Kodi ya Mwezi'), controller: _rentCtrl, keyboard: TextInputType.number)),
                        const SizedBox(width: 8),
                        Expanded(child: Field(t('Payment Due Date', 'Siku ya Malipo'), controller: _paymentDueDateCtrl)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: Field(t('Payment Method', 'Njia ya Malipo'), controller: _paymentMethodCtrl)),
                        const SizedBox(width: 8),
                        Expanded(child: Field(t('Payment Reference', 'Kumbukumbu ya Malipo'), controller: _paymentRefCtrl)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // SECTION 5: SECURITY DEPOSIT
              _sectionCard(
                title: '5. SECURITY DEPOSIT (DHAMANA YA USALAMA)',
                icon: Icons.security_outlined,
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: Field(t('Deposit Amount (TZS)', 'Kiasi cha Dhamana'), controller: _depositCtrl, keyboard: TextInputType.number)),
                        const SizedBox(width: 8),
                        Expanded(child: Field(t('Deposit Payment Date', 'Tarehe ya Kulipa Dhamana'), controller: _depositDateCtrl)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Field(t('Refund Terms & Period', 'Muda na Utaratibu wa Kurudisha'), controller: _depositRefundTermsCtrl),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // SECTION 6: UTILITIES AND OTHER CHARGES
              _sectionCard(
                title: '6. UTILITIES AND OTHER CHARGES (HUDUMA ZA MSINGI NA GHARAMA)',
                icon: Icons.bolt_outlined,
                child: Column(
                  children: [
                    Field(t('Electricity Arrangement', 'Umeme (LUKU)'), controller: _electricityCtrl),
                    const SizedBox(height: 8),
                    Field(t('Water Arrangement', 'Maji (DAWASA)'), controller: _waterCtrl),
                    const SizedBox(height: 8),
                    Field(t('Waste Collection', 'Ushuru wa Taka'), controller: _wasteCtrl),
                    const SizedBox(height: 8),
                    Field(t('Other Charges (Security, compound)', 'Gharama Zingine'), controller: _otherChargesCtrl),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // SECTIONS 7 - 12: STATUTORY OBLIGATIONS PREVIEW
              _sectionCard(
                title: '7-12. STATUTORY RIGHTS & LEASE COVENANTS',
                icon: Icons.gavel_outlined,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _subClause('7. Landlord Obligations', 'Provide peaceful possession, maintain building structure, make essential repairs, give 24-hour notice before entry.'),
                    _subClause('8. Tenant Obligations', 'Pay rent on time, keep premises clean, report damages promptly, no unauthorized alterations or subletting.'),
                    _subClause('9. Repairs & Alterations', 'Structural repairs by landlord; day-to-day care by tenant. Condition report attached at move-in.'),
                    _subClause('10. Termination & Notice', 'One (1) Calendar Month notice in writing. Evictions strictly follow lawful court process.'),
                    _subClause('11. Breach of Agreement', 'Notice to remedy within 14 days, followed by statutory remedies.'),
                    _subClause('12. Dispute Resolution', 'Good-faith mediation, Ward Tribunal (Baraza la Kata), or Tanzania Civil Courts.'),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // SECTION 13: SPECIAL CONDITIONS
              _sectionCard(
                title: '13. SPECIAL CONDITIONS (MASHARTI MAALUM YA ZIADA)',
                icon: Icons.rule_outlined,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t('Add or customize specific house rules for this tenant:', 'Ongeza au badilisha masharti maalum ya nyumba:'),
                      style: body(12, color: C.muted),
                    ),
                    const SizedBox(height: 8),
                    for (int i = 0; i < _specialConditions.length; i++)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${i + 1}. ', style: body(12, weight: FontWeight.w700)),
                            Expanded(child: Text(_specialConditions[i], style: body(12.5))),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(Icons.close_rounded, size: 16),
                              onPressed: () => setState(() => _specialConditions.removeAt(i)),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _newConditionCtrl,
                            decoration: InputDecoration(
                              hintText: t('e.g. No smoking inside, parking slot 2...', 'Mfano: Marufuku kuvuta sigara ndani...'),
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                            onSubmitted: (_) => _addSpecialCondition(),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton.filledTonal(
                          icon: const Icon(Icons.add_rounded),
                          onPressed: _addSpecialCondition,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // SECTION 14: DECLARATION AND SIGNATURES
              _sectionCard(
                title: '14. DECLARATION AND SIGNATURES (TAMKO NA SAINI)',
                icon: Icons.draw_outlined,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t(
                        'Both parties confirm they have read, understood, and agree to all terms of this agreement.',
                        'Pande zote zinathibitisha kuwa zimesoma, zimeelewa, na zinakubaliana na masharti yote.',
                      ),
                      style: body(12, color: C.muted),
                    ),
                    const SizedBox(height: 12),

                    // Landlord Signature Pad
                    _SignaturePadWidget(
                      signerName: _landlordNameCtrl.text.trim().isEmpty ? 'Landlord' : _landlordNameCtrl.text.trim(),
                      roleLabel: t('Landlord Signature', 'Saini ya Mwenye Nyumba'),
                      initialSigned: _landlordSignature != null,
                      onSigned: (sig) => setState(() => _landlordSignature = sig),
                    ),
                    const SizedBox(height: 12),

                    // Tenant Signature Pad
                    _SignaturePadWidget(
                      signerName: _tenantNameCtrl.text.trim().isEmpty ? 'Tenant' : _tenantNameCtrl.text.trim(),
                      roleLabel: t('Tenant Signature', 'Saini ya Mpangaji'),
                      initialSigned: _tenantSignature != null,
                      onSigned: (sig) => setState(() => _tenantSignature = sig),
                    ),
                    const SizedBox(height: 12),

                    // Annexures checklist
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: C.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: C.line)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Handover Schedules Checklist:', 'Viambatisho vya Makabidhiano:'), style: body(12, weight: FontWeight.w700)),
                          const SizedBox(height: 6),
                          _checkItem(t('Property inspection and condition report', 'Ripoti ya ukaguzi wa awali wa nyumba')),
                          _checkItem(t('Inventory of furniture and equipment', 'Orodha ya samani na vifaa vya chumba')),
                          _checkItem(t('Payment and deposit receipts', 'Stakabadhi za malipo ya kodi na dhamana')),
                          _checkItem(t('Tenant NIDA or official identification copy', 'Nakala ya kitambulisho cha NIDA')),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ACTION BUTTONS: Download PDF & Save Draft
              Row(
                children: [
                  Expanded(
                    child: Button(
                      t('Download PDF', 'Pakua PDF'),
                      icon: Icons.picture_as_pdf_rounded,
                      tone: Tone.plain,
                      onTap: _downloadOrPrintPdf,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: Button(
                      t('Save & Prepare Draft', 'Hifadhi & Andaa Mkataba'),
                      busy: _busy,
                      tone: Tone.green,
                      onTap: _busy ? null : _submit,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 36),
            ],
          ),
        ),
      );
  }

  Widget _sectionCard({required String title, required IconData icon, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: C.line),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
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
              Icon(icon, size: 18, color: C.teal),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: body(12.5, weight: FontWeight.w800, color: C.wino),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _subClause(String title, String desc) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('• ', style: body(12, weight: FontWeight.w800)),
          Expanded(
            child: RichText(
              text: TextSpan(
                text: '$title: ',
                style: body(11.5, weight: FontWeight.w700, color: C.wino),
                children: [
                  TextSpan(
                    text: desc,
                    style: body(11.5, color: C.muted),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _checkItem(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline_rounded, size: 14, color: Color(0xFF16A34A)),
          const SizedBox(width: 6),
          Expanded(child: Text(title, style: body(11.5, color: C.muted))),
        ],
      ),
    );
  }
}

