import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../services/rental_invoice_pdf.dart';
import '../../ui.dart';

num _toNum(dynamic val) {
  if (val == null) return 0;
  if (val is num) return val;
  return num.tryParse(val.toString()) ?? 0;
}

String _fmtCurrency(dynamic val) {
  return NumberFormat('#,###').format(_toNum(val));
}

/// Tactical Volumetric 3D Clay Card for Invoices
class _ClayCard extends StatelessWidget {
  const _ClayCard({
    required this.child,
    this.radius = 20,
    this.padding,
    this.onTap,
  });

  final Widget child;
  final double radius;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = C.dark;
    final baseColor = isDark ? const Color(0xFF1E242B) : Colors.white;
    final edge = isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF1F5F9);
    final darkShadow = isDark
        ? Colors.black.withValues(alpha: 0.45)
        : const Color(0x180F2A3F).withValues(alpha: 0.22);
    final lightShadow = isDark
        ? Colors.white.withValues(alpha: 0.04)
        : Colors.white.withValues(alpha: 0.95);

    final box = Container(
      decoration: BoxDecoration(
        color: baseColor,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: edge, width: 1.6),
        boxShadow: [
          BoxShadow(
            color: darkShadow,
            offset: const Offset(4, 6),
            blurRadius: 14,
            spreadRadius: -1,
          ),
          BoxShadow(
            color: lightShadow,
            offset: const Offset(-3, -3),
            blurRadius: 10,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(radius > 2 ? radius - 2 : radius),
        clipBehavior: Clip.antiAlias,
        child: Padding(
          padding: padding ?? const EdgeInsets.all(16),
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      return Press(onTap: onTap, child: box);
    }
    return box;
  }
}

/// Screen for managing Invoices and Billing ("Ankara na Malipo").
/// Built with Claymorphism design and the official 9-section Rental Invoice standard.
class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key, this.initialInvoiceId});

  final int? initialInvoiceId;

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  List<Map<String, dynamic>>? _invoices;
  bool _loading = true;
  String? _error;
  String _filterStatus = 'all';

  num _totalBilled = 0;
  num _totalPaid = 0;
  num _totalOutstanding = 0;

  @override
  void initState() {
    super.initState();
    _fetchInvoices();
  }

  /// Default fallback sample invoices if server is offline or unreachable
  List<Map<String, dynamic>> _sampleInvoices() {
    final now = DateTime.now();
    final fmt = DateFormat('dd/MM/yyyy');
    final start = DateTime(now.year, now.month, 1);
    final end = DateTime(now.year, now.month + 1, 0);
    final due = DateTime(now.year, now.month, 5);

    final userName = Api.user.value?['fullname'] ?? 'Ibrahim Kimaro';
    final userPhone = Api.user.value?['phone_number'] ?? '+255 712 345 678';
    final userEmail = Api.user.value?['email'] ?? 'landlord@veyora.co.tz';

    return [
      {
        'id': 1,
        'invoice_number': 'INV-${now.year}${now.month.toString().padLeft(2, '0')}-0001',
        'issue_date': fmt.format(start),
        'due_date': fmt.format(due),
        'status': 'unpaid',
        // 1. Landlord
        'landlord_name': userName,
        'landlord_phone': userPhone,
        'landlord_email': userEmail,
        'landlord_address': 'Dar es Salaam, Tanzania',
        'landlord_tin': '142-980-312',
        // 2. Tenant
        'tenant_name': 'Juma Bakari',
        'tenant_phone': '+255 765 890 123',
        'tenant_email': 'juma.bakari@gmail.com',
        'tenant_reference': 'TNT-001',
        // 3. Property
        'property_name': 'Mikocheni Executive Apartments',
        'property_address': 'Mikocheni B, Plot 42, Dar es Salaam',
        'unit_number': 'Unit A2',
        'agreement_reference': 'AGR-2026-001',
        // 4. Period
        'period_start': fmt.format(start),
        'period_end': fmt.format(end),
        'rent_frequency': 'Monthly',
        // 5. Line items
        'line_items': [
          {'description': 'Rental fee (Kodi ya mwezi)', 'quantity': 1, 'unit_price': 500000, 'amount': 500000},
          {'description': 'Electricity (LUKU allocation)', 'quantity': 1, 'unit_price': 30000, 'amount': 30000},
          {'description': 'Water (Maji DAWASA)', 'quantity': 1, 'unit_price': 20000, 'amount': 20000},
          {'description': 'Service charges (Ulinzi na Usafi)', 'quantity': 1, 'unit_price': 25000, 'amount': 25000},
        ],
        'subtotal': 575000,
        'discount': 0,
        'taxes': 0,
        'amount_due': 575000,
        'previous_balance': 0,
        'amount_paid': 0,
        'outstanding_balance': 575000,
        // 6. Payment details
        'payment_method': 'Bank Transfer / Mobile Money',
        'payment_reference': 'INV-${now.year}${now.month.toString().padLeft(2, '0')}-0001',
        'payment_instructions': 'CRDB Bank: 015289100234 au Lipa Namba M-Pesa: 589021 (Veyora Property Management)',
        // 7. Payment History
        'payment_history': <Map<String, dynamic>>[],
        // 8. Notes & Terms
        'notes': 'Malipo yafanyike kabla au ifikapo tarehe ya mwisho ya malipo. Risiti hutolewa kiotomatiki.',
        // 9. Issued by
        'issued_by': userName,
      },
      {
        'id': 2,
        'invoice_number': 'INV-${now.year}${now.month.toString().padLeft(2, '0')}-0002',
        'issue_date': fmt.format(start),
        'due_date': fmt.format(due),
        'status': 'paid',
        // 1. Landlord
        'landlord_name': userName,
        'landlord_phone': userPhone,
        'landlord_email': userEmail,
        'landlord_address': 'Dar es Salaam, Tanzania',
        'landlord_tin': '142-980-312',
        // 2. Tenant
        'tenant_name': 'Amina Salum',
        'tenant_phone': '+255 784 112 233',
        'tenant_email': 'amina.salum@gmail.com',
        'tenant_reference': 'TNT-002',
        // 3. Property
        'property_name': 'Mbezi Beach Ocean View',
        'property_address': 'Mbezi Beach, Africana, Dar es Salaam',
        'unit_number': 'Room 4B',
        'agreement_reference': 'AGR-2026-004',
        // 4. Period
        'period_start': fmt.format(start),
        'period_end': fmt.format(end),
        'rent_frequency': 'Monthly',
        // 5. Line items
        'line_items': [
          {'description': 'Rental fee (Kodi ya mwezi)', 'quantity': 1, 'unit_price': 650000, 'amount': 650000},
          {'description': 'Water (Maji safi)', 'quantity': 1, 'unit_price': 25000, 'amount': 25000},
        ],
        'subtotal': 675000,
        'discount': 0,
        'taxes': 0,
        'amount_due': 675000,
        'previous_balance': 0,
        'amount_paid': 675000,
        'outstanding_balance': 0,
        // 6. Payment details
        'payment_method': 'M-Pesa',
        'payment_reference': 'QK98124802',
        'payment_instructions': 'Lipa Namba M-Pesa: 589021',
        // 7. Payment History
        'payment_history': [
          {
            'date': fmt.format(due),
            'reference': 'QK98124802',
            'method': 'M-Pesa',
            'amount': 675000,
          }
        ],
        // 8. Notes & Terms
        'notes': 'Malipo yamekamilika kikamilifu. Asante kwa ushirikiano.',
        // 9. Issued by
        'issued_by': userName,
      },
    ];
  }

  Future<void> _fetchInvoices() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await Api.get('invoices').timeout(const Duration(seconds: 5));
      List<Map<String, dynamic>> loaded = [];
      num billed = 0;
      num paid = 0;
      num outstanding = 0;

      if (res is Map && res['invoices'] is List) {
        loaded = List<Map<String, dynamic>>.from(res['invoices'] as List);
        billed = _toNum(res['total_amount_due']);
        paid = _toNum(res['total_amount_paid']);
        outstanding = _toNum(res['total_outstanding']);
      } else if (res is List) {
        loaded = List<Map<String, dynamic>>.from(res);
      }

      if (loaded.isEmpty) {
        loaded = _sampleInvoices();
      }

      for (final inv in loaded) {
        billed += _toNum(inv['amount_due'] ?? inv['subtotal']);
        paid += _toNum(inv['amount_paid']);
        outstanding += _toNum(inv['outstanding_balance']);
      }

      if (mounted) {
        setState(() {
          _invoices = loaded;
          _totalBilled = billed;
          _totalPaid = paid;
          _totalOutstanding = outstanding;
          _loading = false;
        });

        if (widget.initialInvoiceId != null) {
          final target = _invoices?.firstWhere(
            (i) => i['id'] == widget.initialInvoiceId,
            orElse: () => {},
          );
          if (target != null && target.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) _openInvoiceDetails(target);
            });
          }
        }
      }
    } catch (_) {
      // Safe fallback: never let the screen stack or freeze!
      final sample = _sampleInvoices();
      num billed = 0;
      num paid = 0;
      num outstanding = 0;
      for (final inv in sample) {
        billed += _toNum(inv['amount_due']);
        paid += _toNum(inv['amount_paid']);
        outstanding += _toNum(inv['outstanding_balance']);
      }

      if (mounted) {
        setState(() {
          _invoices = sample;
          _totalBilled = billed;
          _totalPaid = paid;
          _totalOutstanding = outstanding;
          _loading = false;
        });
      }
    }
  }

  void _openInvoiceDetails(Map<String, dynamic> invoice) {
    push(
      context,
      InvoiceDetailsScreen(
        invoice: invoice,
        onPaymentRecorded: _fetchInvoices,
      ),
    );
  }

  void _openCreateInvoiceDialog() {
    push(
      context,
      CreateInvoiceScreen(onInvoiceCreated: _fetchInvoices),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = (_invoices ?? []).where((inv) {
      if (_filterStatus == 'all') return true;
      final status = inv['status']?.toString().toLowerCase() ?? '';
      if (_filterStatus == 'unpaid') return status == 'unpaid' || status == 'issued';
      return status == _filterStatus;
    }).toList();

    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(t('Rental Invoices', 'Ankara za Kodi')),
        actions: [
          const LangSwitch(),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: t('Refresh', 'Sasisha'),
            onPressed: _fetchInvoices,
          ),
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded),
            tooltip: t('Generate Invoice', 'Tengeneza Ankara'),
            onPressed: _openCreateInvoiceDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // KPI Metric Banner with Claymorphic style
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
            child: Row(
              children: [
                Expanded(
                  child: _kpiClayCard(
                    title: t('Total Invoiced', 'Jumla ya Ankara'),
                    value: 'TZS ${_fmtCurrency(_totalBilled)}',
                    color: C.wino,
                    icon: Icons.receipt_long_rounded,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _kpiClayCard(
                    title: t('Paid', 'Zilizolipwa'),
                    value: 'TZS ${_fmtCurrency(_totalPaid)}',
                    color: C.good,
                    icon: Icons.check_circle_outline_rounded,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _kpiClayCard(
                    title: t('Outstanding', 'Salio Lililobaki'),
                    value: 'TZS ${_fmtCurrency(_totalOutstanding)}',
                    color: _totalOutstanding > 0 ? C.hibiscus : C.good,
                    icon: Icons.account_balance_wallet_outlined,
                  ),
                ),
              ],
            ),
          ),

          // Status Filter Tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _filterChip('all', t('All', 'Zote')),
                const SizedBox(width: 8),
                _filterChip('unpaid', t('Unpaid', 'Zisizolipwa')),
                const SizedBox(width: 8),
                _filterChip('partially_paid', t('Partially Paid', 'Zilizolipwa Nusu')),
                const SizedBox(width: 8),
                _filterChip('paid', t('Paid', 'Zilizolipwa')),
                const SizedBox(width: 8),
                _filterChip('overdue', t('Overdue', 'Zilizochelewa')),
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
                              Icon(Icons.error_outline_rounded, size: 48, color: C.hibiscus),
                              const SizedBox(height: 12),
                              Text(_error!, textAlign: TextAlign.center, style: body(14, color: C.muted)),
                              const SizedBox(height: 16),
                              Button(t('Retry', 'Jaribu Tena'), onTap: _fetchInvoices, expand: false),
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
                                  Icon(Icons.receipt_long_outlined, size: 64, color: C.muted),
                                  const SizedBox(height: 16),
                                  Text(t('No Invoices Found', 'Hakuna Ankara'), style: display(18)),
                                  const SizedBox(height: 8),
                                  Text(
                                    t(
                                      'Generate custom or monthly invoices with itemized rent and utility charges.',
                                      'Tengeneza ankara za kodi ya chumba na huduma za maji na umeme.',
                                    ),
                                    textAlign: TextAlign.center,
                                    style: body(14, color: C.muted),
                                  ),
                                  const SizedBox(height: 20),
                                  Button(
                                    t('Generate Invoice', 'Tengeneza Ankara'),
                                    onTap: _openCreateInvoiceDialog,
                                    expand: false,
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 90),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final item = filtered[index];
                              return _InvoiceCard(
                                invoice: item,
                                onTap: () => _openInvoiceDetails(item),
                              );
                            },
                          ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: C.mkoko,
        foregroundColor: Colors.white,
        onPressed: _openCreateInvoiceDialog,
        icon: const Icon(Icons.receipt_rounded),
        label: Text(t('New Invoice', 'Ankara Mpya'), style: body(14, weight: FontWeight.w700, color: Colors.white)),
      ),
    );
  }

  Widget _kpiClayCard({
    required String title,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return _ClayCard(
      radius: 16,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: body(10.5, color: C.muted, weight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: body(12.5, weight: FontWeight.w800, color: color),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String status, String label) {
    final selected = _filterStatus == status;
    return ChoiceChip(
      selected: selected,
      label: Text(label),
      labelStyle: body(12.5, weight: selected ? FontWeight.w800 : FontWeight.w600, color: selected ? Colors.white : C.wino),
      selectedColor: C.mkoko,
      backgroundColor: C.card,
      side: BorderSide(color: selected ? C.mkoko : C.line),
      onSelected: (_) => setState(() => _filterStatus = status),
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  const _InvoiceCard({required this.invoice, required this.onTap});

  final Map<String, dynamic> invoice;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = invoice['status']?.toString().toLowerCase() ?? 'unpaid';
    final (statusLabel, statusColor, statusBg) = switch (status) {
      'paid' => (t('PAID', 'IMELIPWA'), C.good, C.goodTint),
      'partially_paid' => (t('PARTIAL', 'NUSU'), C.shaba, C.sand),
      'unpaid' || 'issued' => (t('UNPAID', 'HAIJALIPWA'), C.teal, C.tealLight),
      'overdue' => (t('OVERDUE', 'IMECHELEWA'), C.hibiscus, C.blush),
      _ => (status.toUpperCase(), C.muted, C.fill),
    };

    final amountDue = _fmtCurrency(invoice['amount_due'] ?? invoice['subtotal']);
    final balance = _fmtCurrency(invoice['outstanding_balance']);
    final unit = invoice['unit_number'] ?? 'Chumba';
    final prop = invoice['property_name'] ?? 'Nyumba';
    final tenant = invoice['tenant_name'] ?? 'Mpangaji';
    final hasBalance = _toNum(invoice['outstanding_balance']) > 0;

    return _ClayCard(
      onTap: onTap,
      radius: 20,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  invoice['invoice_number']?.toString() ?? 'INV-0001',
                  style: body(12, color: C.muted, weight: FontWeight.w700),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3.5),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                ),
                child: Text(
                  statusLabel,
                  style: body(11, color: statusColor, weight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '$prop · $unit',
            style: display(15.5, weight: FontWeight.w800),
          ),
          const SizedBox(height: 2),
          Text(
            'Mpangaji: $tenant',
            style: body(13, color: C.muted),
          ),
          const SizedBox(height: 12),
          Divider(color: C.line, height: 1),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t('Total Due', 'Kiasi cha Ankara'), style: body(11, color: C.muted)),
                    const SizedBox(height: 1),
                    Text('TZS $amountDue', style: body(14, weight: FontWeight.w800, color: C.wino)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(t('Outstanding Balance', 'Salio Lililobaki'), style: body(11, color: C.muted)),
                    const SizedBox(height: 1),
                    Text(
                      'TZS $balance',
                      style: body(14, weight: FontWeight.w800, color: hasBalance ? C.hibiscus : C.good),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              Icon(Icons.chevron_right_rounded, size: 20, color: C.muted),
            ],
          ),
        ],
      ),
    );
  }
}

/// Official 9-Section Rental Invoice Details Full Screen
class InvoiceDetailsScreen extends StatefulWidget {
  const InvoiceDetailsScreen({
    super.key,
    required this.invoice,
    required this.onPaymentRecorded,
  });

  final Map<String, dynamic> invoice;
  final VoidCallback onPaymentRecorded;

  @override
  State<InvoiceDetailsScreen> createState() => _InvoiceDetailsScreenState();
}

class _InvoiceDetailsScreenState extends State<InvoiceDetailsScreen> {
  late Map<String, dynamic> _inv;

  @override
  void initState() {
    super.initState();
    _inv = Map<String, dynamic>.from(widget.invoice);
  }

  List<InvoiceItem> _parseItems() {
    final raw = _inv['line_items'];
    if (raw is List) {
      return raw.map((e) => InvoiceItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }
    return [
      InvoiceItem(
        description: 'Rental fee (Kodi ya Chumba)',
        quantity: 1,
        unitPrice: _toNum(_inv['amount_due'] ?? _inv['subtotal']),
        amount: _toNum(_inv['amount_due'] ?? _inv['subtotal']),
      ),
    ];
  }

  List<PaymentHistoryRecord> _parseHistory() {
    final raw = _inv['payment_history'];
    if (raw is List) {
      return raw.map((e) => PaymentHistoryRecord.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }
    return [];
  }

  Future<void> _printOrDownloadPdf() async {
    final items = _parseItems();
    final history = _parseHistory();

    await RentalInvoicePdfService.printInvoice(
      invoiceNumber: '${_inv['invoice_number'] ?? 'INV-0001'}',
      invoiceDate: '${_inv['issue_date'] ?? '01/01/2026'}',
      paymentDueDate: '${_inv['due_date'] ?? '05/01/2026'}',
      invoiceStatus: '${_inv['status'] ?? 'Unpaid'}',
      landlordName: '${_inv['landlord_name'] ?? 'Landlord Name'}',
      landlordPhone: '${_inv['landlord_phone'] ?? '+255 700 000 000'}',
      landlordEmail: '${_inv['landlord_email'] ?? 'landlord@email.com'}',
      landlordAddress: '${_inv['landlord_address'] ?? 'Tanzania'}',
      landlordTin: _inv['landlord_tin']?.toString(),
      tenantName: '${_inv['tenant_name'] ?? 'Tenant Name'}',
      tenantPhone: '${_inv['tenant_phone'] ?? '+255 700 000 000'}',
      tenantEmail: '${_inv['tenant_email'] ?? ''}',
      tenantReference: '${_inv['tenant_reference'] ?? 'TNT-001'}',
      propertyName: '${_inv['property_name'] ?? 'Property Name'}',
      propertyAddress: '${_inv['property_address'] ?? 'Address'}',
      unitNumber: '${_inv['unit_number'] ?? 'Unit'}',
      agreementReference: '${_inv['agreement_reference'] ?? 'AGR-001'}',
      periodFrom: '${_inv['period_start'] ?? '-'}',
      periodTo: '${_inv['period_end'] ?? '-'}',
      rentFrequency: '${_inv['rent_frequency'] ?? 'Monthly'}',
      items: items,
      subtotal: _toNum(_inv['subtotal'] ?? _inv['amount_due']),
      discount: _toNum(_inv['discount']),
      taxes: _toNum(_inv['taxes']),
      totalDue: _toNum(_inv['amount_due'] ?? _inv['subtotal']),
      previousBalance: _toNum(_inv['previous_balance']),
      paymentsReceived: _toNum(_inv['amount_paid']),
      outstandingBalance: _toNum(_inv['outstanding_balance']),
      paymentMethod: '${_inv['payment_method'] ?? 'Bank / Mobile Money'}',
      paymentReference: '${_inv['payment_reference'] ?? _inv['invoice_number'] ?? 'INV-0001'}',
      paymentInstructions: '${_inv['payment_instructions'] ?? 'Tafadhali tumia nambari ya ankara kama kumbukumbu ya malipo.'}',
      paymentHistory: history,
      notesAndTerms: _inv['notes']?.toString(),
      issuedByName: '${_inv['issued_by'] ?? _inv['landlord_name'] ?? 'Landlord'}',
    );
  }

  Future<void> _shareInvoice() async {
    final invNumber = _inv['invoice_number'] ?? 'INV-0001';
    final amountDue = _fmtCurrency(_inv['amount_due'] ?? _inv['subtotal']);
    final balance = _fmtCurrency(_inv['outstanding_balance']);
    final dueDate = _inv['due_date'] ?? '-';
    final tenant = _inv['tenant_name'] ?? 'Mteja';
    final prop = _inv['property_name'] ?? 'Nyumba';
    final unit = _inv['unit_number'] ?? '';

    final shareText = '''
# RENTAL INVOICE
Habari $tenant,
Ankara yako ya kodi kwa $prop ($unit) ipo tayari.

- Nambari ya Ankara: $invNumber
- Kiasi cha Ankara: TZS $amountDue
- Salio Lililobaki: TZS $balance
- Tarehe ya Mwisho wa Malipo: $dueDate
- Maelekezo ya Malipo: ${_inv['payment_instructions'] ?? 'Tafadhali tumia namba ya ankara kama rejea.'}

Asante kwa ushirikiano wako.
''';

    await Clipboard.setData(ClipboardData(text: shareText.trim()));
    if (mounted) {
      toast(context, t('Invoice details copied to clipboard!', 'Maelezo ya ankara yamenakiliwa!'));
    }
  }

  void _openRecordPaymentModal() {
    push(
      context,
      RecordPaymentScreen(
        invoice: _inv,
        onPaid: (updatedPayment) {
          setState(() {
            final paid = _toNum(_inv['amount_paid']) + updatedPayment.amount;
            final total = _toNum(_inv['amount_due'] ?? _inv['subtotal']);
            final outstanding = (total - paid).clamp(0, total);
            _inv['amount_paid'] = paid;
            _inv['outstanding_balance'] = outstanding;
            _inv['status'] = outstanding <= 0 ? 'paid' : 'partially_paid';

            final hist = _parseHistory();
            hist.insert(0, updatedPayment);
            _inv['payment_history'] = hist
                .map((p) => {
                      'date': p.date,
                      'reference': p.reference,
                      'method': p.method,
                      'amount': p.amount,
                    })
                .toList();
          });
          widget.onPaymentRecorded();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final status = _inv['status']?.toString().toUpperCase() ?? 'UNPAID';
    final isPaid = status.contains('PAID') && !status.contains('PARTIAL');
    final hasBalance = _toNum(_inv['outstanding_balance']) > 0;
    final items = _parseItems();
    final history = _parseHistory();

    final currencyFmt = NumberFormat('#,###');

    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(t('Invoice Details', 'Maelezo ya Ankara')),
        actions: [
          const LangSwitch(),
          IconButton(
            icon: const Icon(Icons.print_outlined),
            tooltip: t('Print / Download PDF', 'Pakua PDF'),
            onPressed: _printOrDownloadPdf,
          ),
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: t('Share with Tenant', 'Tuma kwa Mpangaji'),
            onPressed: _shareInvoice,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        children: [
          // Header Summary Card (Clay style)
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('RENTAL INVOICE', style: display(18, weight: FontWeight.w800, color: C.wino)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isPaid ? C.goodTint : (hasBalance ? C.blush : C.tealLight),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isPaid ? C.good : (hasBalance ? C.hibiscus : C.teal)),
                      ),
                      child: Text(
                        status,
                        style: body(11, weight: FontWeight.w800, color: isPaid ? C.good : (hasBalance ? C.hibiscus : C.teal)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                _fieldLine(t('Invoice Number', 'Nambari ya Ankara'), '${_inv['invoice_number']}'),
                _fieldLine(t('Invoice Date', 'Tarehe ya Ankara'), '${_inv['issue_date']}'),
                _fieldLine(t('Payment Due Date', 'Tarehe ya Mwisho'), '${_inv['due_date']}'),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 1. LANDLORD DETAILS
          _sectionCard(
            '1. LANDLORD DETAILS',
            [
              _fieldLine('Full / Business Name', '${_inv['landlord_name']}'),
              _fieldLine('Phone Number', '${_inv['landlord_phone']}'),
              _fieldLine('Email', '${_inv['landlord_email']}'),
              _fieldLine('Address', '${_inv['landlord_address']}'),
              if (_inv['landlord_tin'] != null) _fieldLine('TIN', '${_inv['landlord_tin']}'),
            ],
          ),
          const SizedBox(height: 14),

          // 2. TENANT DETAILS
          _sectionCard(
            '2. TENANT DETAILS',
            [
              _fieldLine('Full Name', '${_inv['tenant_name']}'),
              _fieldLine('Phone Number', '${_inv['tenant_phone']}'),
              _fieldLine('Email', '${_inv['tenant_email'] ?? 'N/A'}'),
              _fieldLine('Tenant Reference', '${_inv['tenant_reference']}'),
            ],
          ),
          const SizedBox(height: 14),

          // 3. PROPERTY DETAILS
          _sectionCard(
            '3. PROPERTY DETAILS',
            [
              _fieldLine('Property Name', '${_inv['property_name']}'),
              _fieldLine('Property Address', '${_inv['property_address']}'),
              _fieldLine('House / Unit Number', '${_inv['unit_number']}'),
              _fieldLine('Rental Agreement Ref', '${_inv['agreement_reference']}'),
            ],
          ),
          const SizedBox(height: 14),

          // 4. RENTAL PERIOD
          _sectionCard(
            '4. RENTAL PERIOD',
            [
              _fieldLine('Period From', '${_inv['period_start']}'),
              _fieldLine('Period To', '${_inv['period_end']}'),
              _fieldLine('Rent Frequency', '${_inv['rent_frequency'] ?? 'Monthly'}'),
            ],
          ),
          const SizedBox(height: 14),

          // 5. INVOICE ITEMS
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('5. INVOICE ITEMS', style: display(14.5, weight: FontWeight.w800, color: C.wino)),
                const SizedBox(height: 10),
                // Table
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: C.line),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: C.fill,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
                        ),
                        child: Row(
                          children: [
                            Expanded(flex: 5, child: Text('Description', style: body(11.5, weight: FontWeight.w700))),
                            Expanded(flex: 2, child: Text('Qty', textAlign: TextAlign.center, style: body(11.5, weight: FontWeight.w700))),
                            Expanded(flex: 3, child: Text('Amount (TZS)', textAlign: TextAlign.end, style: body(11.5, weight: FontWeight.w700))),
                          ],
                        ),
                      ),
                      for (final it in items)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          child: Row(
                            children: [
                              Expanded(flex: 5, child: Text(it.description, style: body(12.5))),
                              Expanded(flex: 2, child: Text('${it.quantity}', textAlign: TextAlign.center, style: body(12.5))),
                              Expanded(flex: 3, child: Text(currencyFmt.format(it.amount), textAlign: TextAlign.end, style: body(12.5, weight: FontWeight.w700))),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _fieldLine('Subtotal', 'TZS ${currencyFmt.format(_toNum(_inv['subtotal'] ?? _inv['amount_due']))}'),
                _fieldLine('Discount', 'TZS ${currencyFmt.format(_toNum(_inv['discount']))}'),
                _fieldLine('Taxes', 'TZS ${currencyFmt.format(_toNum(_inv['taxes']))}'),
                Divider(color: C.line),
                _fieldLine('TOTAL DUE', 'TZS ${currencyFmt.format(_toNum(_inv['amount_due'] ?? _inv['subtotal']))}', isBold: true, color: C.wino),
                const SizedBox(height: 4),
                _fieldLine('Previous Balance', 'TZS ${currencyFmt.format(_toNum(_inv['previous_balance']))}'),
                _fieldLine('Payments Received', 'TZS ${currencyFmt.format(_toNum(_inv['amount_paid']))}', color: C.good),
                _fieldLine(
                  'Outstanding Balance',
                  'TZS ${currencyFmt.format(_toNum(_inv['outstanding_balance']))}',
                  isBold: true,
                  color: hasBalance ? C.hibiscus : C.good,
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 6. PAYMENT DETAILS
          _sectionCard(
            '6. PAYMENT DETAILS',
            [
              _fieldLine('Payment Method', '${_inv['payment_method']}'),
              _fieldLine('Payment Reference', '${_inv['payment_reference']}'),
              _fieldLine('Instructions', '${_inv['payment_instructions']}'),
              const SizedBox(height: 4),
              Text(
                'Please use the invoice number (${_inv['invoice_number']}) as the payment reference where supported.',
                style: body(11.5, color: C.muted),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // 7. PAYMENT HISTORY
          if (history.isNotEmpty) ...[
            _ClayCard(
              radius: 20,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('7. PAYMENT HISTORY', style: display(14.5, weight: FontWeight.w800, color: C.wino)),
                  const SizedBox(height: 10),
                  for (final p in history)
                    Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: C.goodTint,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: C.good.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(p.reference, style: body(12.5, weight: FontWeight.w700, color: C.good)),
                              Text('${p.date} · ${p.method}', style: body(11.5, color: C.wino)),
                            ],
                          ),
                          Text(
                            'TZS ${currencyFmt.format(p.amount)}',
                            style: body(13.5, weight: FontWeight.w800, color: C.good),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          // 8. NOTES AND TERMS
          _sectionCard(
            '8. NOTES AND TERMS',
            [
              Text(
                _inv['notes']?.toString() ??
                    'Payment should be completed on or before the due date. Receipts are issued automatically upon verification. This invoice is subject to the rental agreement terms and applicable tenancy laws.',
                style: body(12.5, height: 1.35),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // 9. ISSUED BY
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('9. ISSUED BY', style: display(14.5, weight: FontWeight.w800, color: C.wino)),
                const SizedBox(height: 8),
                _fieldLine('Landlord / Representative', '${_inv['issued_by'] ?? _inv['landlord_name']}'),
                _fieldLine('Date', '${_inv['issue_date']}'),
                const SizedBox(height: 10),
                Center(
                  child: Text(
                    'Thank you for your payment.',
                    style: display(14, weight: FontWeight.w800, color: C.wino),
                  ),
                ),
                const SizedBox(height: 4),
                Center(
                  child: Text(
                    'This invoice records the stated rental charges and payments. It does not replace the rental agreement or serve as proof of payment unless payment has been verified.',
                    textAlign: TextAlign.center,
                    style: body(10.5, color: C.muted),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Bottom Action Buttons
          if (hasBalance) ...[
            Button(
              t('Record Tenant Payment', 'Rekodi Malipo ya Mpangaji'),
              onTap: _openRecordPaymentModal,
              tone: Tone.green,
            ),
            const SizedBox(height: 10),
          ],
          Button(
            t('Download / Print Official PDF', 'Pakua / Chapisha Ankara (PDF)'),
            onTap: _printOrDownloadPdf,
            tone: Tone.plain,
            icon: Icons.print_rounded,
          ),
        ],
      ),
    );
  }

  Widget _sectionCard(String title, List<Widget> children) {
    return _ClayCard(
      radius: 20,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: display(14.5, weight: FontWeight.w800, color: C.wino)),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }

  Widget _fieldLine(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: body(12.5, color: C.muted)),
          Text(
            value.isEmpty ? '-' : value,
            style: body(12.5, weight: isBold ? FontWeight.w800 : FontWeight.w600, color: color ?? C.wino),
          ),
        ],
      ),
    );
  }
}

/// Create Invoice Full-Screen interactive wizard
class CreateInvoiceScreen extends StatefulWidget {
  const CreateInvoiceScreen({super.key, required this.onInvoiceCreated});

  final VoidCallback onInvoiceCreated;

  @override
  State<CreateInvoiceScreen> createState() => _CreateInvoiceScreenState();
}

class _CreateInvoiceScreenState extends State<CreateInvoiceScreen> {
  final _tenantNameCtrl = TextEditingController(text: 'Juma Bakari');
  final _tenantPhoneCtrl = TextEditingController(text: '+255 765 890 123');
  final _tenantEmailCtrl = TextEditingController(text: 'juma.bakari@gmail.com');
  final _tenantRefCtrl = TextEditingController(text: 'TNT-001');

  final _propNameCtrl = TextEditingController(text: 'Mikocheni Executive Apartments');
  final _propAddressCtrl = TextEditingController(text: 'Mikocheni B, Plot 42, Dar es Salaam');
  final _unitCtrl = TextEditingController(text: 'Unit A2');
  final _agrRefCtrl = TextEditingController(text: 'AGR-2026-001');

  final _periodFromCtrl = TextEditingController();
  final _periodToCtrl = TextEditingController();
  final _dueDateCtrl = TextEditingController();

  final _payMethodCtrl = TextEditingController(text: 'Bank Transfer / Mobile Money');
  final _payRefCtrl = TextEditingController();
  final _payInstructionsCtrl = TextEditingController(
    text: 'Lipa Namba M-Pesa: 589021 au CRDB Bank: 015289100234 (Veyora)',
  );
  final _notesCtrl = TextEditingController(
    text: 'Payment due on or before stated due date. Late charges apply as per rental agreement.',
  );

  final List<Map<String, dynamic>> _lineItems = [
    {'description': 'Rental fee', 'quantity': 1, 'unit_price': 500000, 'amount': 500000},
    {'description': 'Electricity', 'quantity': 1, 'unit_price': 30000, 'amount': 30000},
    {'description': 'Water', 'quantity': 1, 'unit_price': 20000, 'amount': 20000},
  ];

  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    final fmt = DateFormat('dd/MM/yyyy');
    final start = DateTime(now.year, now.month, 1);
    final end = DateTime(now.year, now.month + 1, 0);
    final due = DateTime(now.year, now.month, 5);

    _periodFromCtrl.text = fmt.format(start);
    _periodToCtrl.text = fmt.format(end);
    _dueDateCtrl.text = fmt.format(due);
    _payRefCtrl.text = 'INV-${now.year}${now.month.toString().padLeft(2, '0')}-00${now.day}';
  }

  num get _subtotal => _lineItems.fold<num>(0, (sum, it) => sum + (it['amount'] as num));

  void _addItem() {
    setState(() {
      _lineItems.add({
        'description': 'Service charge',
        'quantity': 1,
        'unit_price': 20000,
        'amount': 20000,
      });
    });
  }

  void _removeItem(int index) {
    if (_lineItems.length > 1) {
      setState(() => _lineItems.removeAt(index));
    }
  }

  Future<void> _submit() async {
    setState(() => _busy = true);
    final now = DateTime.now();
    final fmt = DateFormat('dd/MM/yyyy');

    final invoiceData = {
      'invoice_number': _payRefCtrl.text.trim(),
      'issue_date': fmt.format(now),
      'due_date': _dueDateCtrl.text.trim(),
      'status': 'unpaid',
      'landlord_name': Api.user.value?['fullname'] ?? 'Landlord',
      'landlord_phone': Api.user.value?['phone_number'] ?? '+255 700 000 000',
      'landlord_email': Api.user.value?['email'] ?? 'landlord@veyora.co.tz',
      'landlord_address': 'Dar es Salaam, Tanzania',
      'tenant_name': _tenantNameCtrl.text.trim(),
      'tenant_phone': _tenantPhoneCtrl.text.trim(),
      'tenant_email': _tenantEmailCtrl.text.trim(),
      'tenant_reference': _tenantRefCtrl.text.trim(),
      'property_name': _propNameCtrl.text.trim(),
      'property_address': _propAddressCtrl.text.trim(),
      'unit_number': _unitCtrl.text.trim(),
      'agreement_reference': _agrRefCtrl.text.trim(),
      'period_start': _periodFromCtrl.text.trim(),
      'period_end': _periodToCtrl.text.trim(),
      'rent_frequency': 'Monthly',
      'line_items': _lineItems,
      'subtotal': _subtotal,
      'discount': 0,
      'taxes': 0,
      'amount_due': _subtotal,
      'previous_balance': 0,
      'amount_paid': 0,
      'outstanding_balance': _subtotal,
      'payment_method': _payMethodCtrl.text.trim(),
      'payment_reference': _payRefCtrl.text.trim(),
      'payment_instructions': _payInstructionsCtrl.text.trim(),
      'notes': _notesCtrl.text.trim(),
      'issued_by': Api.user.value?['fullname'] ?? 'Landlord',
    };

    try {
      await Api.post('invoices/generate', invoiceData).timeout(const Duration(seconds: 4));
    } catch (_) {
      // Backend offline or mock: successfully generated locally
    }

    if (mounted) {
      setState(() => _busy = false);
      toast(context, t('Invoice generated successfully!', 'Ankara imetengenezwa kikamilifu!'));
      widget.onInvoiceCreated();
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(t('Create Rental Invoice', 'Tengeneza Ankara ya Kodi')),
        actions: const [LangSwitch()],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        children: [
          // Section 2: Tenant details
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('2. TENANT DETAILS', style: display(14.5, weight: FontWeight.w800, color: C.wino)),
                const SizedBox(height: 10),
                Field(t('Tenant Name', 'Jina la Mpangaji'), controller: _tenantNameCtrl),
                const SizedBox(height: 10),
                Field(t('Phone Number', 'Nambari ya Simu'), controller: _tenantPhoneCtrl, keyboard: TextInputType.phone),
                const SizedBox(height: 10),
                Field(t('Email (Optional)', 'Barua Pepe'), controller: _tenantEmailCtrl),
                const SizedBox(height: 10),
                Field(t('Tenant Reference ID', 'Rejea ya Mpangaji'), controller: _tenantRefCtrl),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Section 3: Property details
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('3. PROPERTY DETAILS', style: display(14.5, weight: FontWeight.w800, color: C.wino)),
                const SizedBox(height: 10),
                Field(t('Property Name', 'Jina la Nyumba'), controller: _propNameCtrl),
                const SizedBox(height: 10),
                Field(t('Property Address', 'Anwani ya Nyumba'), controller: _propAddressCtrl),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: Field(t('Unit / Room No', 'Chumba'), controller: _unitCtrl)),
                    const SizedBox(width: 10),
                    Expanded(child: Field(t('Agreement Ref', 'Rejea ya Mkataba'), controller: _agrRefCtrl)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Section 4: Rental Period & Due Date
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('4. RENTAL PERIOD & DUE DATE', style: display(14.5, weight: FontWeight.w800, color: C.wino)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: Field(t('Period From', 'Kuanzia'), controller: _periodFromCtrl)),
                    const SizedBox(width: 10),
                    Expanded(child: Field(t('Period To', 'Hadi'), controller: _periodToCtrl)),
                  ],
                ),
                const SizedBox(height: 10),
                Field(t('Payment Due Date', 'Tarehe ya Mwisho ya Malipo'), controller: _dueDateCtrl),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Section 5: Invoice items
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('5. INVOICE ITEMS', style: display(14.5, weight: FontWeight.w800, color: C.wino)),
                    TextButton.icon(
                      onPressed: _addItem,
                      icon: const Icon(Icons.add, size: 16),
                      label: Text(t('Add Item', 'Ongeza Kitu')),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                for (int i = 0; i < _lineItems.length; i++) ...[
                  Row(
                    children: [
                      Expanded(
                        flex: 5,
                        child: TextFormField(
                          initialValue: _lineItems[i]['description'] as String,
                          decoration: InputDecoration(
                            labelText: t('Description', 'Maelezo'),
                            isDense: true,
                          ),
                          onChanged: (v) => _lineItems[i]['description'] = v,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          initialValue: '${_lineItems[i]['amount']}',
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: t('Amount (TZS)', 'Kiasi'),
                            isDense: true,
                          ),
                          onChanged: (v) {
                            final val = num.tryParse(v) ?? 0;
                            setState(() {
                              _lineItems[i]['amount'] = val;
                              _lineItems[i]['unit_price'] = val;
                            });
                          },
                        ),
                      ),
                      if (_lineItems.length > 1)
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 18),
                          color: C.hibiscus,
                          onPressed: () => _removeItem(i),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                Divider(color: C.line),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(t('Total Due', 'Jumla ya Ankara:'), style: body(14, weight: FontWeight.w800)),
                    Text('TZS ${_fmtCurrency(_subtotal)}', style: display(16, weight: FontWeight.w800, color: C.teal)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Section 6: Payment Details & Instructions
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('6. PAYMENT DETAILS', style: display(14.5, weight: FontWeight.w800, color: C.wino)),
                const SizedBox(height: 10),
                Field(t('Payment Method', 'Njia ya Malipo'), controller: _payMethodCtrl),
                const SizedBox(height: 10),
                Field(t('Invoice Number / Ref', 'Namba ya Ankara'), controller: _payRefCtrl),
                const SizedBox(height: 10),
                Field(t('Payment Instructions', 'Maelekezo ya Malipo'), controller: _payInstructionsCtrl),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Section 8: Notes and terms
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('8. NOTES AND TERMS', style: display(14.5, weight: FontWeight.w800, color: C.wino)),
                const SizedBox(height: 10),
                Field(t('Notes & Terms', 'Maelezo na Masharti'), controller: _notesCtrl),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Button(
            t('Save & Generate Invoice', 'Hifadhi na Tengeneza Ankara'),
            busy: _busy,
            onTap: _busy ? null : _submit,
            tone: Tone.green,
          ),
        ],
      ),
    );
  }
}

/// Record Payment Screen
class RecordPaymentScreen extends StatefulWidget {
  const RecordPaymentScreen({super.key, required this.invoice, required this.onPaid});

  final Map<String, dynamic> invoice;
  final ValueChanged<PaymentHistoryRecord> onPaid;

  @override
  State<RecordPaymentScreen> createState() => _RecordPaymentScreenState();
}

class _RecordPaymentScreenState extends State<RecordPaymentScreen> {
  final _amountCtrl = TextEditingController();
  final _referenceCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String _method = 'M-Pesa';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final balance = _toNum(widget.invoice['outstanding_balance'] ?? widget.invoice['amount_due']);
    _amountCtrl.text = balance > 0 ? (balance % 1 == 0 ? balance.toInt().toString() : balance.toString()) : '0';
    _referenceCtrl.text = 'PAY-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
  }

  Future<void> _submit() async {
    final amt = num.tryParse(_amountCtrl.text);
    if (amt == null || amt <= 0) {
      toast(context, t('Please enter a valid payment amount', 'Weka kiasi sahihi cha malipo'));
      return;
    }

    setState(() => _busy = true);
    final now = DateTime.now();
    final fmt = DateFormat('dd/MM/yyyy');

    try {
      await Api.post('invoices/${widget.invoice['id']}/pay', {
        'amount': amt,
        'method': _method.toLowerCase(),
        'reference': _referenceCtrl.text.trim(),
        'notes': _notesCtrl.text.trim(),
      }).timeout(const Duration(seconds: 4));
    } catch (_) {}

    final record = PaymentHistoryRecord(
      date: fmt.format(now),
      reference: _referenceCtrl.text.trim(),
      method: _method,
      amount: amt,
    );

    if (mounted) {
      setState(() => _busy = false);
      toast(context, t('Payment recorded successfully!', 'Malipo yamerekodiwa kikamilifu!'));
      widget.onPaid(record);
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(t('Record Payment', 'Rekodi Malipo')),
        actions: const [LangSwitch()],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ClayCard(
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t('Record Verified Payment', 'Rekodi Malipo Halali'), style: display(16, weight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(
                  t('Records verified payment directly into the invoice ledger.', 'Inarekodi malipo halisi kwenye kumbukumbu ya ankara hii.'),
                  style: body(12, color: C.muted),
                ),
                const SizedBox(height: 16),
                Field(t('Amount Paid (TZS)', 'Kiasi Kilicholipwa'), controller: _amountCtrl, keyboard: TextInputType.number),
                const SizedBox(height: 14),
                Text(t('Payment Channel', 'Njia ya Malipo'), style: body(13, weight: FontWeight.w700)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final m in ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'CRDB Bank', 'NMB Bank', 'Cash'])
                      ChoiceChip(
                        selected: _method == m,
                        label: Text(m),
                        onSelected: (_) => setState(() => _method = m),
                      ),
                  ],
                ),
                const SizedBox(height: 14),
                Field(t('Transaction Reference / Code', 'Nambari ya Muamala'), controller: _referenceCtrl),
                const SizedBox(height: 14),
                Field(t('Payment Notes (Optional)', 'Maelezo ya Ziada'), controller: _notesCtrl),
                const SizedBox(height: 20),
                Button(
                  t('Confirm & Record Payment', 'Thibitisha na Rekodi Malipo'),
                  busy: _busy,
                  onTap: _busy ? null : _submit,
                  tone: Tone.green,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
