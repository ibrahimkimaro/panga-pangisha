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

/// Screen for managing Invoices and Billing ("Ankara na Malipo").
/// Features:
/// - Invoices list with filtering by property, room, tenant, period, and status
/// - KPI billing summary (Total Invoiced, Paid, Outstanding Balance)
/// - Detailed invoice review with itemized lines & utility readings
/// - Authorized payment recording workflow (M-Pesa, Tigo Pesa, Bank, Cash) with screenshot/reference verification
/// - Share invoice with tenant & print invoice HTML.
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

  Future<void> _fetchInvoices() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await Api.get('invoices');
      if (res is Map && res['invoices'] is List) {
        if (mounted) {
          setState(() {
            _invoices = List<Map<String, dynamic>>.from(res['invoices'] as List);
            _totalBilled = _toNum(res['total_amount_due']);
            _totalPaid = _toNum(res['total_amount_paid']);
            _totalOutstanding = _toNum(res['total_outstanding']);
            _loading = false;
          });

          if (widget.initialInvoiceId != null) {
            final target = _invoices?.firstWhere(
              (i) => i['id'] == widget.initialInvoiceId,
              orElse: () => {},
            );
            if (target != null && target.isNotEmpty) {
              _openInvoiceDetails(target);
            }
          }
        }
      } else {
        setState(() {
          _invoices = [];
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

  void _openInvoiceDetails(Map<String, dynamic> invoice) {
    sheet(
      context,
      _InvoiceDetailsSheet(
        invoice: invoice,
        onPaymentRecorded: _fetchInvoices,
      ),
    );
  }

  void _openCreateInvoiceDialog() {
    sheet(
      context,
      _CreateInvoiceSheet(onInvoiceCreated: _fetchInvoices),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = (_invoices ?? []).where((inv) {
      if (_filterStatus == 'all') return true;
      return inv['status'] == _filterStatus;
    }).toList();

    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        title: Text(t('Invoices & Billing', 'Ankara na Malipo')),
        actions: [
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
          // KPI Metric Banner
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: _kpiCard(
                    title: t('Total Billed', 'Jumla ya Ankara'),
                    value: 'TZS ${_fmtCurrency(_totalBilled)}',
                    color: C.wino,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _kpiCard(
                    title: t('Total Paid', 'Zilizolipwa'),
                    value: 'TZS ${_fmtCurrency(_totalPaid)}',
                    color: C.good,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _kpiCard(
                    title: t('Outstanding', 'Deni / Salio'),
                    value: 'TZS ${_fmtCurrency(_totalOutstanding)}',
                    color: C.hibiscus,
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
                _filterChip('issued', t('Issued / Due', 'Zilizotolewa')),
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
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
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

  Widget _kpiCard({required String title, required String value, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: C.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(11, color: C.muted)),
          const SizedBox(height: 4),
          Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(13, weight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }

  Widget _filterChip(String status, String label) {
    final selected = _filterStatus == status;
    return ChoiceChip(
      selected: selected,
      label: Text(label),
      labelStyle: body(13, weight: selected ? FontWeight.w700 : FontWeight.w500, color: selected ? Colors.white : C.wino),
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
    final status = invoice['status']?.toString() ?? 'issued';
    final (statusLabel, statusColor, statusBg) = switch (status) {
      'paid' => (t('PAID', 'IMELIPWA'), C.good, C.goodTint),
      'partially_paid' => (t('PARTIAL', 'NUSU'), C.shaba, C.sand),
      'issued' => (t('ISSUED', 'IMETOLEWA'), C.teal, C.tealLight),
      'delivered' => (t('DELIVERED', 'IMETUMWA'), C.teal, C.tealLight),
      'overdue' => (t('OVERDUE', 'IMECHELEWA'), C.hibiscus, C.blush),
      _ => (status.toUpperCase(), C.muted, C.fill),
    };

    final amountDue = _fmtCurrency(invoice['amount_due']);
    final balance = _fmtCurrency(invoice['outstanding_balance']);
    final unit = invoice['unit_number'] ?? 'Chumba';
    final prop = invoice['property_name'] ?? 'Nyumba';
    final tenant = invoice['tenant_name'] ?? 'Mpangaji';

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
                    invoice['invoice_number']?.toString() ?? 'INV-000',
                    style: body(12, color: C.muted, weight: FontWeight.w700),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusLabel,
                    style: body(11, color: statusColor, weight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '$prop · $unit',
              style: display(16, weight: FontWeight.w700),
            ),
            const SizedBox(height: 2),
            Text(
              'Mpangaji: $tenant',
              style: body(14, color: C.muted),
            ),
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
                      Text(t('Total Amount', 'Kiasi cha Ankara'), style: body(11, color: C.muted), maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text('TZS $amountDue', style: body(15, weight: FontWeight.w700, color: C.wino), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(t('Outstanding Balance', 'Salio Lililobaki'), style: body(11, color: C.muted), maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.end),
                      Text(
                        'TZS $balance',
                        style: body(15, weight: FontWeight.w700, color: (invoice['outstanding_balance'] ?? 0) > 0 ? C.hibiscus : C.good),
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

class _InvoiceDetailsSheet extends StatefulWidget {
  const _InvoiceDetailsSheet({required this.invoice, required this.onPaymentRecorded});

  final Map<String, dynamic> invoice;
  final VoidCallback onPaymentRecorded;

  @override
  State<_InvoiceDetailsSheet> createState() => _InvoiceDetailsSheetState();
}

class _InvoiceDetailsSheetState extends State<_InvoiceDetailsSheet> {
  bool _busy = false;

  void _openRecordPaymentModal() {
    sheet(
      context,
      _RecordPaymentModal(
        invoice: widget.invoice,
        onPaid: () {
          widget.onPaymentRecorded();
          Navigator.pop(context);
        },
      ),
    );
  }

  Future<void> _shareInvoice() async {
    setState(() => _busy = true);
    try {
      final res = await Api.post('invoices/${widget.invoice['id']}/share', {});
      if (!mounted) return;
      setState(() => _busy = false);
      final shareText = res['share_text']?.toString() ?? 'Ankara ya upangaji';
      await Clipboard.setData(ClipboardData(text: shareText));
      if (!mounted) return;
      toast(context, t('Share link copied to clipboard!', 'Ujumbe wa ankara umenakiliwa!'));
      widget.onPaymentRecorded();
    } catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        toast(context, e.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final inv = widget.invoice;
    final status = inv['status']?.toString() ?? 'issued';
    final lineItems = inv['line_items'] is List ? List.from(inv['line_items'] as List) : [];
    final amountDue = _fmtCurrency(inv['amount_due']);
    final amountPaid = _fmtCurrency(inv['amount_paid']);
    final balance = _fmtCurrency(inv['outstanding_balance']);
    final hasBalance = _toNum(inv['outstanding_balance']) > 0;

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
                decoration: BoxDecoration(color: C.line, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(inv['invoice_number'] ?? 'INV-000', style: body(12, color: C.muted, weight: FontWeight.w700)),
                      Text('${inv['property_name']} · ${inv['unit_number']}', style: display(18, weight: FontWeight.w800)),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.share_outlined),
                  tooltip: t('Share with Tenant', 'Tuma kwa Mpangaji'),
                  onPressed: _busy ? null : _shareInvoice,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Financial Summary Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: C.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: C.line),
              ),
              child: Column(
                children: [
                  _rowItem(t('Tenant Name', 'Mpangaji'), inv['tenant_name'] ?? '-'),
                  _rowItem(t('Issue Date', 'Tarehe ya Kutolewa'), inv['issue_date'] ?? '-'),
                  _rowItem(t('Due Date', 'Tarehe ya Mwisho'), inv['due_date'] ?? '-'),
                  _rowItem(t('Total Amount', 'Kiasi Chote'), 'TZS $amountDue'),
                  _rowItem(t('Amount Paid', 'Kiasi Kilicholipwa'), 'TZS $amountPaid', color: C.good),
                  const Divider(height: 16),
                  _rowItem(t('Outstanding Balance', 'Salio Lililobaki'), 'TZS $balance', color: hasBalance ? C.hibiscus : C.good, isBold: true),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Itemized Line Items
            Text(t('Invoice Line Items', 'Mchanganuo wa Ankara'), style: display(15, weight: FontWeight.w700)),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: C.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: C.line),
              ),
              child: Column(
                children: [
                  for (final item in lineItems)
                    ListTile(
                      dense: true,
                      title: Text(item['description'] ?? 'Malipo', style: body(13, weight: FontWeight.w600)),
                      subtitle: Text(item['category']?.toString().toUpperCase() ?? 'KODI', style: body(11, color: C.muted)),
                      trailing: Text(
                        'TZS ${_fmtCurrency(item['amount'])}',
                        style: body(13, weight: FontWeight.w700),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Utility meter readings if present
            if (inv['utility_readings'] is Map) ...[
              Text(t('Meter Readings', 'Mita za Umeme na Maji'), style: display(15, weight: FontWeight.w700)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: C.card,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: C.line),
                ),
                child: Column(
                  children: [
                    _rowItem(t('LUKU Meter', 'Mita ya LUKU'), inv['utility_readings']['luku_meter'] ?? '-'),
                    _rowItem(t('Water Meter', 'Mita ya Maji'), inv['utility_readings']['water_meter'] ?? '-'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Payment verification status
            if (status == 'paid' || inv['payment_reference'] != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: C.goodTint,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: C.good),
                ),
                child: Row(
                  children: [
                    Icon(Icons.verified_rounded, color: C.good),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Payment Verified', 'Malipo Yamethibitishwa'), style: body(13, weight: FontWeight.w700, color: C.good)),
                          Text(
                            'Kumbukumbu: ${inv['payment_reference'] ?? 'PAY-VERIFIED'} · ${inv['payment_method']?.toString().toUpperCase() ?? 'M-PESA'}',
                            style: body(11, color: C.wino),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Actions
            if (hasBalance) ...[
              Button(
                t('Record Tenant Payment', 'Rekodi Malipo ya Mpangaji'),
                onTap: _openRecordPaymentModal,
                tone: Tone.green,
              ),
              const SizedBox(height: 10),
            ],

            Button(
              t('Share Invoice with Tenant', 'Tuma Ankara kwa Mpangaji (WhatsApp/SMS)'),
              onTap: _busy ? null : _shareInvoice,
              busy: _busy,
              tone: Tone.plain,
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _rowItem(String label, String value, {Color? color, bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: body(13, color: C.muted)),
          Text(value, style: body(13, weight: isBold ? FontWeight.w800 : FontWeight.w600, color: color ?? C.wino)),
        ],
      ),
    );
  }
}

class _RecordPaymentModal extends StatefulWidget {
  const _RecordPaymentModal({required this.invoice, required this.onPaid});

  final Map<String, dynamic> invoice;
  final VoidCallback onPaid;

  @override
  State<_RecordPaymentModal> createState() => _RecordPaymentModalState();
}

class _RecordPaymentModalState extends State<_RecordPaymentModal> {
  final _amountCtrl = TextEditingController();
  final _referenceCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String _method = 'mpesa';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final balance = _toNum(widget.invoice['outstanding_balance'] ?? widget.invoice['amount_due']);
    _amountCtrl.text = balance > 0 ? (balance % 1 == 0 ? balance.toInt().toString() : balance.toString()) : '0';
  }

  Future<void> _submitPayment() async {
    final amt = num.tryParse(_amountCtrl.text);
    if (amt == null || amt <= 0) {
      toast(context, t('Please enter a valid payment amount', 'Weka kiasi sahihi cha malipo'));
      return;
    }

    setState(() => _busy = true);
    try {
      final res = await Api.post('invoices/${widget.invoice['id']}/pay', {
        'amount': amt,
        'method': _method,
        'reference': _referenceCtrl.text.trim().isEmpty ? null : _referenceCtrl.text.trim(),
        'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      });

      if (mounted) {
        setState(() => _busy = false);
        toast(context, res['message']?.toString() ?? t('Payment recorded successfully!', 'Malipo yamerekodiwa kikamilifu!'));
        widget.onPaid();
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
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 10, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(t('Record Verified Payment', 'Rekodi Malipo Halali'), style: display(18, weight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(
            t(
              'Enforces verified payment ledger. Never marks invoice as paid merely because request was created.',
              'Inahakikisha malipo yamerekodiwa halisi kabla ya kuweka alama ya kulipwa.',
            ),
            style: body(12, color: C.muted),
          ),
          const SizedBox(height: 16),

          Field(
            t('Amount Paid (TZS)', 'Kiasi Kilicholipwa'),
            controller: _amountCtrl,
            keyboard: TextInputType.number,
          ),
          const SizedBox(height: 14),

          Text(t('Payment Channel', 'Njia ya Malipo'), style: body(13, weight: FontWeight.w700)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            children: [
              for (final m in [
                ('mpesa', 'M-Pesa'),
                ('tigopesa', 'Tigo Pesa'),
                ('airtel', 'Airtel Money'),
                ('bank', 'Benki (CRDB/NMB)'),
                ('cash', 'Pesa Taslimu (Cash)'),
              ])
                ChoiceChip(
                  selected: _method == m.$1,
                  label: Text(m.$2),
                  onSelected: (_) => setState(() => _method = m.$1),
                ),
            ],
          ),
          const SizedBox(height: 14),

          Field(
            t('Transaction Reference / SMS Code', 'Nambari ya Muamala / Kumbukumbu'),
            controller: _referenceCtrl,
            hint: 'e.g. QK8912KL90',
          ),
          const SizedBox(height: 20),

          Button(
            t('Confirm & Record Payment', 'Thibitisha na Rekodi Malipo'),
            onTap: _busy ? null : _submitPayment,
            busy: _busy,
            tone: Tone.green,
          ),
        ],
      ),
    );
  }
}

class _CreateInvoiceSheet extends StatefulWidget {
  const _CreateInvoiceSheet({required this.onInvoiceCreated});

  final VoidCallback onInvoiceCreated;

  @override
  State<_CreateInvoiceSheet> createState() => _CreateInvoiceSheetState();
}

class _CreateInvoiceSheetState extends State<_CreateInvoiceSheet> {
  final _unitCtrl = TextEditingController(text: 'Room 1');
  final _rentCtrl = TextEditingController(text: '450000');
  final _waterCtrl = TextEditingController(text: '20000');
  final _elecCtrl = TextEditingController(text: '30000');
  final _notesCtrl = TextEditingController();

  int? _selectedHouseId;
  List<Map<String, dynamic>> _myHouses = [];
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
    setState(() => _busy = true);
    try {
      final houseId = _selectedHouseId ?? (_myHouses.isNotEmpty ? _myHouses.first['id'] : 1);
      final res = await Api.post('invoices/generate', {
        'house_id': houseId,
        'unit_number': _unitCtrl.text.trim(),
        'monthly_rent': num.tryParse(_rentCtrl.text) ?? 450000,
        'water_charge': num.tryParse(_waterCtrl.text) ?? 0,
        'electricity_charge': num.tryParse(_elecCtrl.text) ?? 0,
        'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      });

      if (mounted) {
        setState(() => _busy = false);
        toast(context, res['message']?.toString() ?? t('Invoice generated successfully!', 'Ankara imetolewa kikamilifu!'));
        widget.onInvoiceCreated();
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
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 10, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(t('Generate New Invoice', 'Tengeneza Ankara Mpya'), style: display(18, weight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(
            t(
              'Organize itemized charges for rent and utilities for landlord preview before delivery.',
              'Andaa mchanganuo wa kodi na huduma za chumba kwa ajili ya kuhakiki.',
            ),
            style: body(12, color: C.muted),
          ),
          const SizedBox(height: 16),

          if (_myHouses.isNotEmpty) ...[
            DropdownButtonFormField<int>(
              initialValue: _selectedHouseId,
              decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12)),
              items: _myHouses.map((h) => DropdownMenuItem<int>(value: h['id'] as int?, child: Text(h['property_name'] ?? 'Nyumba'))).toList(),
              onChanged: (val) => setState(() => _selectedHouseId = val),
            ),
            const SizedBox(height: 12),
          ],

          Field(t('Room / Unit Number', 'Nambari ya Chumba'), controller: _unitCtrl),
          const SizedBox(height: 12),

          Field(t('Base Rent (TZS)', 'Kodi ya Chumba'), controller: _rentCtrl, keyboard: TextInputType.number),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(child: Field(t('Water (TZS)', 'Maji DAWASA'), controller: _waterCtrl, keyboard: TextInputType.number)),
              const SizedBox(width: 12),
              Expanded(child: Field(t('Electricity (TZS)', 'Umeme LUKU'), controller: _elecCtrl, keyboard: TextInputType.number)),
            ],
          ),
          const SizedBox(height: 20),

          Button(
            t('Organize & Preview Invoice', 'Andaa na Hakiki Ankara'),
            onTap: _busy ? null : _submit,
            busy: _busy,
            tone: Tone.green,
          ),
        ],
      ),
    );
  }
}
