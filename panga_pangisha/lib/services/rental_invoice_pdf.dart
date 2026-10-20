import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class InvoiceItem {
  const InvoiceItem({
    required this.description,
    this.quantity = 1,
    required this.unitPrice,
    required this.amount,
  });

  final String description;
  final num quantity;
  final num unitPrice;
  final num amount;

  factory InvoiceItem.fromJson(Map<String, dynamic> j) {
    final qty = j['quantity'] is num ? j['quantity'] as num : (num.tryParse('${j['quantity']}') ?? 1);
    final amt = j['amount'] is num ? j['amount'] as num : (num.tryParse('${j['amount']}') ?? 0);
    final price = j['unit_price'] is num
        ? j['unit_price'] as num
        : (num.tryParse('${j['unit_price']}') ?? (qty > 0 ? amt / qty : amt));
    return InvoiceItem(
      description: '${j['description'] ?? 'Item'}',
      quantity: qty,
      unitPrice: price,
      amount: amt,
    );
  }
}

class PaymentHistoryRecord {
  const PaymentHistoryRecord({
    required this.date,
    required this.reference,
    required this.method,
    required this.amount,
  });

  final String date;
  final String reference;
  final String method;
  final num amount;

  factory PaymentHistoryRecord.fromJson(Map<String, dynamic> j) {
    return PaymentHistoryRecord(
      date: '${j['date'] ?? j['paid_on'] ?? '-'}',
      reference: '${j['reference'] ?? j['ref'] ?? j['transaction_id'] ?? '-'}',
      method: '${j['method'] ?? j['channel'] ?? 'Mobile Money'}',
      amount: j['amount'] is num ? j['amount'] as num : (num.tryParse('${j['amount']}') ?? 0),
    );
  }
}

class RentalInvoicePdfService {
  /// Generate the official 9-section Residential Rental Invoice as PDF bytes
  static Future<Uint8List> generateInvoicePdf({
    required String invoiceNumber,
    required String invoiceDate,
    required String paymentDueDate,
    required String invoiceStatus, // Unpaid, Partially Paid, Paid, Overdue
    // 1. Landlord
    required String landlordName,
    required String landlordPhone,
    required String landlordEmail,
    required String landlordAddress,
    String? landlordTin,
    // 2. Tenant
    required String tenantName,
    required String tenantPhone,
    required String tenantEmail,
    required String tenantReference,
    // 3. Property
    required String propertyName,
    required String propertyAddress,
    required String unitNumber,
    required String agreementReference,
    // 4. Period
    required String periodFrom,
    required String periodTo,
    String rentFrequency = 'Monthly',
    // 5. Items & Totals
    required List<InvoiceItem> items,
    num subtotal = 0,
    num discount = 0,
    num taxes = 0,
    num totalDue = 0,
    num previousBalance = 0,
    num paymentsReceived = 0,
    num outstandingBalance = 0,
    // 6. Payment Details
    required String paymentMethod,
    required String paymentReference,
    required String paymentInstructions,
    // 7. Payment History
    List<PaymentHistoryRecord>? paymentHistory,
    // 8. Notes & Terms
    String? notesAndTerms,
    // 9. Issued By
    required String issuedByName,
    String? issuedDate,
  }) async {
    final pdf = pw.Document();
    final currencyFmt = NumberFormat('#,###');

    // Page fonts
    final fontRegular = await PdfGoogleFonts.openSansRegular();
    final fontBold = await PdfGoogleFonts.openSansBold();
    final fontItalic = await PdfGoogleFonts.openSansItalic();

    final theme = pw.ThemeData.withFont(
      base: fontRegular,
      bold: fontBold,
      italic: fontItalic,
    );

    final statusUpper = invoiceStatus.toUpperCase();
    PdfColor statusColor = PdfColors.orange700;
    if (statusUpper.contains('PAID') && !statusUpper.contains('PARTIAL')) {
      statusColor = PdfColors.green700;
    } else if (statusUpper.contains('OVERDUE')) {
      statusColor = PdfColors.red700;
    } else if (statusUpper.contains('PARTIAL')) {
      statusColor = PdfColors.amber800;
    }

    pdf.addPage(
      pw.MultiPage(
        pageTheme: pw.PageTheme(
          theme: theme,
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(36),
        ),
        header: (context) => pw.Container(
          margin: const pw.EdgeInsets.only(bottom: 12),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(
                'PANGA PANGISHA · RESIDENTIAL RENTAL INVOICE',
                style: pw.TextStyle(fontSize: 8.5, color: PdfColors.grey700, fontWeight: pw.FontWeight.bold),
              ),
              pw.Text(
                'Invoice Ref: $invoiceNumber',
                style: pw.TextStyle(fontSize: 8.5, color: PdfColors.grey700, fontWeight: pw.FontWeight.bold),
              ),
            ],
          ),
        ),
        footer: (context) => pw.Container(
          margin: const pw.EdgeInsets.only(top: 12),
          padding: const pw.EdgeInsets.only(top: 6),
          decoration: const pw.BoxDecoration(
            border: pw.Border(top: pw.BorderSide(color: PdfColors.grey300, width: 0.8)),
          ),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(
                'Veyora Housing Platform · Official Billing Record',
                style: pw.TextStyle(fontSize: 8, color: PdfColors.grey600),
              ),
              pw.Text(
                'Page ${context.pageNumber} of ${context.pagesCount}',
                style: pw.TextStyle(fontSize: 8, color: PdfColors.grey600),
              ),
            ],
          ),
        ),
        build: (context) => [
          // Header box
          pw.Container(
            padding: const pw.EdgeInsets.all(14),
            decoration: pw.BoxDecoration(
              color: PdfColors.grey100,
              borderRadius: pw.BorderRadius.circular(8),
              border: pw.Border.all(color: PdfColors.grey300),
            ),
            child: pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'RENTAL INVOICE',
                        style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Row(
                        children: [
                          pw.Text('Invoice Number: ', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                          pw.Text(invoiceNumber, style: pw.TextStyle(fontSize: 10, color: PdfColors.blue900, fontWeight: pw.FontWeight.bold)),
                        ],
                      ),
                      pw.SizedBox(height: 2),
                      pw.Row(
                        children: [
                          pw.Text('Invoice Date: ', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                          pw.Text(invoiceDate, style: const pw.TextStyle(fontSize: 10)),
                        ],
                      ),
                      pw.SizedBox(height: 2),
                      pw.Row(
                        children: [
                          pw.Text('Payment Due Date: ', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                          pw.Text(paymentDueDate, style: pw.TextStyle(fontSize: 10, color: PdfColors.red900, fontWeight: pw.FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: pw.BoxDecoration(
                    color: statusColor,
                    borderRadius: pw.BorderRadius.circular(6),
                  ),
                  child: pw.Text(
                    statusUpper,
                    style: pw.TextStyle(color: PdfColors.white, fontWeight: pw.FontWeight.bold, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 14),

          // Two-column details: Section 1 & Section 2
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // 1. LANDLORD DETAILS
              pw.Expanded(
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey300),
                    borderRadius: pw.BorderRadius.circular(6),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('1. LANDLORD DETAILS', style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
                      pw.SizedBox(height: 6),
                      _fieldRow('Full / Business Name:', landlordName),
                      _fieldRow('Phone Number:', landlordPhone),
                      _fieldRow('Email:', landlordEmail),
                      _fieldRow('Address:', landlordAddress),
                      if (landlordTin != null && landlordTin.isNotEmpty) _fieldRow('TIN:', landlordTin),
                    ],
                  ),
                ),
              ),
              pw.SizedBox(width: 10),
              // 2. TENANT DETAILS
              pw.Expanded(
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey300),
                    borderRadius: pw.BorderRadius.circular(6),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('2. TENANT DETAILS', style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
                      pw.SizedBox(height: 6),
                      _fieldRow('Full Name:', tenantName),
                      _fieldRow('Phone Number:', tenantPhone),
                      _fieldRow('Email:', tenantEmail.isEmpty ? 'N/A' : tenantEmail),
                      _fieldRow('Tenant Reference:', tenantReference),
                    ],
                  ),
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 10),

          // Two-column details: Section 3 & Section 4
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // 3. PROPERTY DETAILS
              pw.Expanded(
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey300),
                    borderRadius: pw.BorderRadius.circular(6),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('3. PROPERTY DETAILS', style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
                      pw.SizedBox(height: 6),
                      _fieldRow('Property Name:', propertyName),
                      _fieldRow('Property Address:', propertyAddress),
                      _fieldRow('Unit / Room No:', unitNumber),
                      _fieldRow('Agreement Ref:', agreementReference),
                    ],
                  ),
                ),
              ),
              pw.SizedBox(width: 10),
              // 4. RENTAL PERIOD
              pw.Expanded(
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey300),
                    borderRadius: pw.BorderRadius.circular(6),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('4. RENTAL PERIOD', style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
                      pw.SizedBox(height: 6),
                      _fieldRow('Period From:', periodFrom),
                      _fieldRow('Period To:', periodTo),
                      _fieldRow('Rent Frequency:', rentFrequency),
                    ],
                  ),
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 14),

          // 5. INVOICE ITEMS TABLE
          pw.Text('5. INVOICE ITEMS', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
          pw.SizedBox(height: 6),
          pw.Table(
            border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.8),
            columnWidths: {
              0: const pw.FlexColumnWidth(4.5),
              1: const pw.FlexColumnWidth(1.2),
              2: const pw.FlexColumnWidth(2.2),
              3: const pw.FlexColumnWidth(2.3),
            },
            children: [
              // Header
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                children: [
                  _tableCell('Description', isHeader: true),
                  _tableCell('Qty', isHeader: true, align: pw.TextAlign.center),
                  _tableCell('Unit Price (TZS)', isHeader: true, align: pw.TextAlign.right),
                  _tableCell('Amount (TZS)', isHeader: true, align: pw.TextAlign.right),
                ],
              ),
              // Items
              for (final it in items)
                pw.TableRow(
                  children: [
                    _tableCell(it.description),
                    _tableCell('${it.quantity}', align: pw.TextAlign.center),
                    _tableCell(currencyFmt.format(it.unitPrice), align: pw.TextAlign.right),
                    _tableCell(currencyFmt.format(it.amount), align: pw.TextAlign.right, isBold: true),
                  ],
                ),
            ],
          ),
          pw.SizedBox(height: 8),

          // Financial Summary Row
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(
                flex: 5,
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.grey50,
                    borderRadius: pw.BorderRadius.circular(6),
                    border: pw.Border.all(color: PdfColors.grey300),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      _summaryLine('Previous Balance:', 'TZS ${currencyFmt.format(previousBalance)}'),
                      _summaryLine('Payments Received:', 'TZS ${currencyFmt.format(paymentsReceived)}', color: PdfColors.green800),
                      pw.Divider(color: PdfColors.grey300),
                      _summaryLine(
                        'Outstanding Balance:',
                        'TZS ${currencyFmt.format(outstandingBalance)}',
                        isBold: true,
                        color: outstandingBalance > 0 ? PdfColors.red800 : PdfColors.green800,
                      ),
                    ],
                  ),
                ),
              ),
              pw.SizedBox(width: 14),
              pw.Expanded(
                flex: 5,
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.blueGrey50,
                    borderRadius: pw.BorderRadius.circular(6),
                    border: pw.Border.all(color: PdfColors.blueGrey200),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      _summaryLine('Subtotal:', 'TZS ${currencyFmt.format(subtotal)}'),
                      _summaryLine('Discount:', 'TZS ${currencyFmt.format(discount)}'),
                      _summaryLine('Taxes:', 'TZS ${currencyFmt.format(taxes)}'),
                      pw.Divider(color: PdfColors.blueGrey200),
                      _summaryLine('TOTAL DUE:', 'TZS ${currencyFmt.format(totalDue)}', isBold: true, color: PdfColors.blueGrey900, size: 12),
                    ],
                  ),
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 14),

          // 6. PAYMENT DETAILS
          pw.Container(
            padding: const pw.EdgeInsets.all(10),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300),
              borderRadius: pw.BorderRadius.circular(6),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('6. PAYMENT DETAILS', style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
                pw.SizedBox(height: 6),
                _fieldRow('Payment Method:', paymentMethod),
                _fieldRow('Payment Reference:', paymentReference),
                _fieldRow('Payment Instructions:', paymentInstructions),
                pw.SizedBox(height: 4),
                pw.Text(
                  'Please use the invoice number ($invoiceNumber) as the payment reference where supported.',
                  style: pw.TextStyle(fontSize: 8.5, fontStyle: pw.FontStyle.italic, color: PdfColors.grey700),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 12),

          // 7. PAYMENT HISTORY
          if (paymentHistory != null && paymentHistory.isNotEmpty) ...[
            pw.Text('7. PAYMENT HISTORY', style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
            pw.SizedBox(height: 4),
            pw.Table(
              border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.8),
              columnWidths: {
                0: const pw.FlexColumnWidth(2.5),
                1: const pw.FlexColumnWidth(3.0),
                2: const pw.FlexColumnWidth(2.5),
                3: const pw.FlexColumnWidth(2.5),
              },
              children: [
                pw.TableRow(
                  decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                  children: [
                    _tableCell('Date', isHeader: true),
                    _tableCell('Payment Reference', isHeader: true),
                    _tableCell('Method', isHeader: true),
                    _tableCell('Amount (TZS)', isHeader: true, align: pw.TextAlign.right),
                  ],
                ),
                for (final p in paymentHistory)
                  pw.TableRow(
                    children: [
                      _tableCell(p.date),
                      _tableCell(p.reference),
                      _tableCell(p.method),
                      _tableCell(currencyFmt.format(p.amount), align: pw.TextAlign.right, isBold: true),
                    ],
                  ),
              ],
            ),
            pw.SizedBox(height: 12),
          ],

          // 8. NOTES AND TERMS
          pw.Container(
            padding: const pw.EdgeInsets.all(10),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300),
              borderRadius: pw.BorderRadius.circular(6),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('8. NOTES AND TERMS', style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
                pw.SizedBox(height: 4),
                pw.Text(
                  notesAndTerms != null && notesAndTerms.isNotEmpty
                      ? notesAndTerms
                      : 'Payment should be completed on or before the due date. Receipts are issued automatically upon verification. This invoice is subject to the rental agreement terms and applicable tenancy laws.',
                  style: const pw.TextStyle(fontSize: 8.5, height: 1.35),
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 12),

          // 9. ISSUED BY
          pw.Container(
            padding: const pw.EdgeInsets.all(10),
            decoration: pw.BoxDecoration(
              color: PdfColors.grey50,
              border: pw.Border.all(color: PdfColors.grey300),
              borderRadius: pw.BorderRadius.circular(6),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('9. ISSUED BY', style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)),
                pw.SizedBox(height: 6),
                _fieldRow('Landlord / Representative:', issuedByName),
                _fieldRow('Issue Date:', issuedDate ?? invoiceDate),
                pw.SizedBox(height: 8),
                pw.Row(
                  children: [
                    pw.Text('Signature: ', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
                    pw.Container(
                      width: 180,
                      decoration: const pw.BoxDecoration(
                        border: pw.Border(bottom: pw.BorderSide(color: PdfColors.grey600, width: 0.8)),
                      ),
                      child: pw.Text('  $issuedByName (Verified)', style: pw.TextStyle(fontSize: 9, fontStyle: pw.FontStyle.italic, color: PdfColors.blueGrey800)),
                    ),
                  ],
                ),
                pw.SizedBox(height: 10),
                pw.Center(
                  child: pw.Text(
                    'Thank you for your payment.',
                    style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900),
                  ),
                ),
                pw.SizedBox(height: 4),
                pw.Center(
                  child: pw.Text(
                    'This invoice records the stated rental charges and payments. It does not replace the rental agreement or serve as proof of payment unless payment has been verified.',
                    textAlign: pw.TextAlign.center,
                    style: pw.TextStyle(fontSize: 7.5, color: PdfColors.grey600, fontStyle: pw.FontStyle.italic),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    return pdf.save();
  }

  static pw.Widget _fieldRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(
            width: 115,
            child: pw.Text(label, style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColors.grey800)),
          ),
          pw.Expanded(
            child: pw.Text(value.isEmpty ? '-' : value, style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.black)),
          ),
        ],
      ),
    );
  }

  static pw.Widget _tableCell(String text, {bool isHeader = false, bool isBold = false, pw.TextAlign align = pw.TextAlign.left}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 5),
      child: pw.Text(
        text,
        textAlign: align,
        style: pw.TextStyle(
          fontSize: isHeader ? 8.5 : 8.5,
          fontWeight: isHeader || isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: isHeader ? PdfColors.blueGrey900 : PdfColors.black,
        ),
      ),
    );
  }

  static pw.Widget _summaryLine(String label, String val, {bool isBold = false, PdfColor? color, double size = 9}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 2),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: pw.TextStyle(fontSize: size, fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal)),
          pw.Text(
            val,
            style: pw.TextStyle(
              fontSize: size,
              fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
              color: color ?? PdfColors.black,
            ),
          ),
        ],
      ),
    );
  }

  /// Print or layout invoice PDF directly using printing dialog
  static Future<void> printInvoice({
    required String invoiceNumber,
    required String invoiceDate,
    required String paymentDueDate,
    required String invoiceStatus,
    required String landlordName,
    required String landlordPhone,
    required String landlordEmail,
    required String landlordAddress,
    String? landlordTin,
    required String tenantName,
    required String tenantPhone,
    required String tenantEmail,
    required String tenantReference,
    required String propertyName,
    required String propertyAddress,
    required String unitNumber,
    required String agreementReference,
    required String periodFrom,
    required String periodTo,
    String rentFrequency = 'Monthly',
    required List<InvoiceItem> items,
    num subtotal = 0,
    num discount = 0,
    num taxes = 0,
    num totalDue = 0,
    num previousBalance = 0,
    num paymentsReceived = 0,
    num outstandingBalance = 0,
    required String paymentMethod,
    required String paymentReference,
    required String paymentInstructions,
    List<PaymentHistoryRecord>? paymentHistory,
    String? notesAndTerms,
    required String issuedByName,
    String? issuedDate,
  }) async {
    final bytes = await generateInvoicePdf(
      invoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate,
      paymentDueDate: paymentDueDate,
      invoiceStatus: invoiceStatus,
      landlordName: landlordName,
      landlordPhone: landlordPhone,
      landlordEmail: landlordEmail,
      landlordAddress: landlordAddress,
      landlordTin: landlordTin,
      tenantName: tenantName,
      tenantPhone: tenantPhone,
      tenantEmail: tenantEmail,
      tenantReference: tenantReference,
      propertyName: propertyName,
      propertyAddress: propertyAddress,
      unitNumber: unitNumber,
      agreementReference: agreementReference,
      periodFrom: periodFrom,
      periodTo: periodTo,
      rentFrequency: rentFrequency,
      items: items,
      subtotal: subtotal,
      discount: discount,
      taxes: taxes,
      totalDue: totalDue,
      previousBalance: previousBalance,
      paymentsReceived: paymentsReceived,
      outstandingBalance: outstandingBalance,
      paymentMethod: paymentMethod,
      paymentReference: paymentReference,
      paymentInstructions: paymentInstructions,
      paymentHistory: paymentHistory,
      notesAndTerms: notesAndTerms,
      issuedByName: issuedByName,
      issuedDate: issuedDate,
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => bytes,
      name: 'Invoice_$invoiceNumber.pdf',
    );
  }
}
