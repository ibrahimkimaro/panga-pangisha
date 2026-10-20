import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class RentalAgreementPdfService {
  /// Generate the official 14-section Residential Rental Agreement as PDF bytes
  static Future<Uint8List> generateAgreementPdf({
    required String agreementNumber,
    required DateTime agreementDate,
    // Section 1: Landlord
    required String landlordName,
    required String landlordIdNumber,
    required String landlordPhone,
    required String landlordEmail,
    required String landlordAddress,
    required String landlordCountry,
    // Section 1: Tenant
    required String tenantName,
    required String tenantIdNumber,
    required String tenantPhone,
    required String tenantEmail,
    required String tenantAddress,
    required String tenantCountry,
    // Section 2: Property
    required String propertyAddress,
    required String propertyType,
    required String unitNumber,
    required String bedrooms,
    required String permittedUse,
    // Section 3: Period
    required String commencementDate,
    required String expiryDate,
    required String renewalConditions,
    // Section 4: Rent
    required num monthlyRent,
    required String paymentDueDate,
    required String paymentMethod,
    required String paymentReference,
    // Section 5: Deposit
    required num securityDeposit,
    required String depositPaymentDate,
    required String depositRefundTerms,
    // Section 6: Utilities
    required String electricityArrangement,
    required String waterArrangement,
    required String wasteCollectionArrangement,
    required String otherCharges,
    // Section 13: Special Conditions
    List<String>? specialConditions,
    // Section 14: Signatures & Status
    String? landlordSignatureName,
    String? landlordSignedDate,
    String? tenantSignatureName,
    String? tenantSignedDate,
    bool isLandlordSigned = false,
    bool isTenantSigned = false,
    List<Map<String, dynamic>>? inventoryItems,
  }) async {
    final pdf = pw.Document();

    final dateFmt = DateFormat('dd/MM/yyyy');
    final formattedAgreementDate = dateFmt.format(agreementDate);
    final currencyFmt = NumberFormat('#,###');

    // Page theme styling
    final fontRegular = await PdfGoogleFonts.openSansRegular();
    final fontBold = await PdfGoogleFonts.openSansBold();
    final fontItalic = await PdfGoogleFonts.openSansItalic();

    final theme = pw.ThemeData.withFont(
      base: fontRegular,
      bold: fontBold,
      italic: fontItalic,
    );

    pdf.addPage(
      pw.MultiPage(
        pageTheme: pw.PageTheme(
          theme: theme,
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.symmetric(horizontal: 36, vertical: 40),
        ),
        header: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.only(bottom: 8),
            margin: const pw.EdgeInsets.only(bottom: 14),
            decoration: const pw.BoxDecoration(
              border: pw.Border(
                bottom: pw.BorderSide(color: PdfColors.grey300, width: 0.8),
              ),
            ),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  'PANGA PANGISHA  |  RESIDENTIAL RENTAL AGREEMENT',
                  style: pw.TextStyle(
                    fontSize: 8.5,
                    color: PdfColors.grey700,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.Text(
                  'Ref: $agreementNumber  |  Page ${context.pageNumber} of ${context.pagesCount}',
                  style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey600),
                ),
              ],
            ),
          );
        },
        footer: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.only(top: 8),
            margin: const pw.EdgeInsets.only(top: 14),
            decoration: const pw.BoxDecoration(
              border: pw.Border(
                top: pw.BorderSide(color: PdfColors.grey300, width: 0.8),
              ),
            ),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  'Official Tenancy Contract  *  Governed under the Laws of the United Republic of Tanzania',
                  style: const pw.TextStyle(fontSize: 7.5, color: PdfColors.grey500),
                ),
                pw.Text(
                  'Generated via PangaPangisha.com',
                  style: pw.TextStyle(
                    fontSize: 7.5,
                    color: PdfColors.teal700,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ],
            ),
          );
        },
        build: (pw.Context context) {
          return [
            // Title Header Banner
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('#0F2A3F'),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.center,
                children: [
                  pw.Text(
                    'RESIDENTIAL RENTAL AGREEMENT',
                    style: pw.TextStyle(
                      fontSize: 16,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColors.white,
                      letterSpacing: 0.8,
                    ),
                  ),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'MKATABA WA UPANGISHAJI WA NYUMBA / CHUMBA CHA MAKAZI',
                    style: pw.TextStyle(
                      fontSize: 9.5,
                      fontStyle: pw.FontStyle.italic,
                      color: PdfColor.fromHex('#E2E8F0'),
                    ),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 12),

            // Agreement Metadata Bar
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                color: PdfColors.grey100,
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                border: pw.Border.all(color: PdfColors.grey300, width: 0.8),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.RichText(
                    text: pw.TextSpan(
                      text: 'Agreement Reference: ',
                      style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
                      children: [
                        pw.TextSpan(
                          text: agreementNumber,
                          style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('#0F766E'),
                          ),
                        ),
                      ],
                    ),
                  ),
                  pw.RichText(
                    text: pw.TextSpan(
                      text: 'Date of Agreement: ',
                      style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
                      children: [
                        pw.TextSpan(
                          text: formattedAgreementDate,
                          style: const pw.TextStyle(fontWeight: pw.FontWeight.normal),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 1: PARTIES TO THE AGREEMENT
            _buildSectionHeader('1. PARTIES TO THE AGREEMENT (PANDE ZA MKATABA)'),
            pw.SizedBox(height: 6),
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Landlord Box
                pw.Expanded(
                  child: pw.Container(
                    padding: const pw.EdgeInsets.all(10),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                      borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'Landlord (Lessor / Mwenye Nyumba)',
                          style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold,
                            fontSize: 10,
                            color: PdfColor.fromHex('#0F2A3F'),
                          ),
                        ),
                        pw.SizedBox(height: 6),
                        _infoLine('Full Name', landlordName),
                        _infoLine('NIDA / ID Number', landlordIdNumber),
                        _infoLine('Phone Number', landlordPhone),
                        _infoLine('Email Address', landlordEmail.isNotEmpty ? landlordEmail : 'N/A'),
                        _infoLine('Address', landlordAddress.isNotEmpty ? landlordAddress : 'Tanzania'),
                        _infoLine('Country', landlordCountry),
                      ],
                    ),
                  ),
                ),
                pw.SizedBox(width: 10),
                // Tenant Box
                pw.Expanded(
                  child: pw.Container(
                    padding: const pw.EdgeInsets.all(10),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                      borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'Tenant (Lessee / Mpangaji)',
                          style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold,
                            fontSize: 10,
                            color: PdfColor.fromHex('#0F2A3F'),
                          ),
                        ),
                        pw.SizedBox(height: 6),
                        _infoLine('Full Name', tenantName),
                        _infoLine('NIDA / ID Number', tenantIdNumber.isNotEmpty ? tenantIdNumber : 'To be provided at move-in'),
                        _infoLine('Phone Number', tenantPhone),
                        _infoLine('Email Address', tenantEmail.isNotEmpty ? tenantEmail : 'N/A'),
                        _infoLine('Current Address', tenantAddress.isNotEmpty ? tenantAddress : 'Tanzania'),
                        _infoLine('Country', tenantCountry),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            pw.SizedBox(height: 14),

            // SECTION 2: PROPERTY DETAILS
            _buildSectionHeader('2. PROPERTY DETAILS (TAARIFA ZA NYUMBA)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _infoLine('Property Address', propertyAddress),
                  _infoLine('Property Type', propertyType),
                  _infoLine('Unit or Room Number', unitNumber),
                  _infoLine('Number of Bedrooms', bedrooms),
                  _infoLine('Permitted Use', permittedUse),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 3: RENTAL PERIOD
            _buildSectionHeader('3. RENTAL PERIOD (MUDA WA UPANGISHAJI)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _infoLine('Tenancy Commencement Date', commencementDate),
                  _infoLine('Tenancy Expiry Date', expiryDate),
                  _infoLine('Renewal Conditions', renewalConditions),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'Any renewal or extension shall be agreed upon in writing and comply with applicable laws of Tanzania.',
                    style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey700),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 4: RENT AND PAYMENT TERMS
            _buildSectionHeader('4. RENT AND PAYMENT TERMS (KODI NA UTARATIBU WA MALIPO)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _infoLine('Monthly Rent', 'TZS ${currencyFmt.format(monthlyRent)}'),
                  _infoLine('Payment Due Date', paymentDueDate),
                  _infoLine('Payment Method', paymentMethod),
                  _infoLine('Payment Reference', paymentReference),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'The tenant agrees to pay rent according to the agreed schedule. Any rent changes must follow the agreement and applicable law.',
                    style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey700),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 5: SECURITY DEPOSIT
            _buildSectionHeader('5. SECURITY DEPOSIT (DHAMANA YA USALAMA)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _infoLine('Deposit Amount', 'TZS ${currencyFmt.format(securityDeposit)}'),
                  _infoLine('Deposit Payment Date', depositPaymentDate),
                  _infoLine('Refund Terms & Period', depositRefundTerms),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'The deposit shall be handled according to agreed terms and applicable law. Any lawful deductions must be itemized in writing to the tenant, and the remaining balance refunded within the agreed refund period.',
                    style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey700),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 6: UTILITIES AND OTHER CHARGES
            _buildSectionHeader('6. UTILITIES AND OTHER CHARGES (HUDUMA ZA MSINGI NA GHARAMA ZINGINE)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _infoLine('Electricity (Umeme / LUKU)', electricityArrangement),
                  _infoLine('Water (Maji / DAWASA)', waterArrangement),
                  _infoLine('Waste Collection (Ushuru wa Taka)', wasteCollectionArrangement),
                  _infoLine('Other Charges', otherCharges),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 7: LANDLORD'S RESPONSIBILITIES
            _buildSectionHeader("7. LANDLORD'S RESPONSIBILITIES (MAJUKUMU YA MWENYE NYUMBA)"),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _bulletPoint('Provide possession of the property to the tenant on the agreed commencement date.'),
                  _bulletPoint('Maintain the building structure and main utilities in the condition required by law.'),
                  _bulletPoint('Promptly arrange repairs that are the lawful responsibility of the landlord.'),
                  _bulletPoint("Respect the tenant's lawful privacy and peaceful enjoyment of the leased premises."),
                  _bulletPoint('Give legally required notice (at least 24 hours) prior to entering the premises, except in verifiable emergencies.'),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 8: TENANT'S RESPONSIBILITIES
            _buildSectionHeader("8. TENANT'S RESPONSIBILITIES (MAJUKUMU YA MPANGAJI)"),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _bulletPoint('Pay rent and agreed utility charges on or before the due date.'),
                  _bulletPoint('Keep the premises reasonably clean and properly take care of all installations.'),
                  _bulletPoint('Report damage or needed repairs promptly to the landlord in writing.'),
                  _bulletPoint('Avoid unlawful activities, commercial nuisance, and unreasonable noise/disturbance.'),
                  _bulletPoint('Obtain required written permission prior to making structural alterations or subletting.'),
                  _bulletPoint('Return the property and all keys at the expiration of tenancy, subject to fair wear and tear.'),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 9: REPAIRS AND PROPERTY ALTERATIONS
            _buildSectionHeader('9. REPAIRS AND PROPERTY ALTERATIONS (MATENGENEZO NA MABADILIKO)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'The parties shall follow applicable laws and the agreed allocation of repair responsibilities. The tenant shall not make significant structural alterations or paint surfaces without prior written consent from the landlord.',
                    style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800),
                  ),
                  pw.SizedBox(height: 4),
                  _infoLine('Property Condition at Handover', 'Refer to attached Handover Inspection Report and inventory photographs.'),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 10: TERMINATION AND NOTICE
            _buildSectionHeader('10. TERMINATION AND NOTICE (USITISHAJI NA TAARIFA)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _infoLine('Required Notice Period', 'One (1) Calendar Month in writing by either party, or one month rent in lieu of notice.'),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'Any eviction, recovery of possession, or termination for breach must follow procedures prescribed by Tanzanian Law. No provision in this agreement authorizes unlawful self-help eviction or the arbitrary disconnection of water or electricity.',
                    style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 11: BREACH OF AGREEMENT
            _buildSectionHeader('11. BREACH OF AGREEMENT (UVUNJAJI WA MKATABA)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Text(
                'If either party breaches this agreement, the aggrieved party may issue lawful notice to remedy within 14 days, and thereafter pursue lawful remedies under Tanzanian law.',
                style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800),
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 12: DISPUTE RESOLUTION
            _buildSectionHeader('12. DISPUTE RESOLUTION (UTATUZI WA MIGOGORO)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Text(
                'The parties shall first attempt to resolve disputes amicably through good-faith discussion or local mediation (Ward Tribunal / Baraza la Kata). If unresolved, either party may pursue statutory dispute-resolution mechanisms in the courts of Tanzania.',
                style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800),
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 13: SPECIAL CONDITIONS
            _buildSectionHeader('13. SPECIAL CONDITIONS (MASHARTI MAALUM YA ZIADA)'),
            pw.SizedBox(height: 6),
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  if (specialConditions != null && specialConditions.isNotEmpty)
                    for (int i = 0; i < specialConditions.length; i++)
                      _bulletPoint('${i + 1}. ${specialConditions[i]}')
                  else ...[
                    _bulletPoint('1. Quiet hours are strictly observed between 10:00 PM and 6:00 AM.'),
                    _bulletPoint('2. Subletting or transferring occupancy to third parties without written consent is strictly prohibited.'),
                    _bulletPoint('3. Waste and garbage shall be deposited in designated bins following building sanitization rules.'),
                  ],
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'Any additional condition must be lawful and agreed upon by both parties.',
                    style: pw.TextStyle(fontSize: 8, fontStyle: pw.FontStyle.italic, color: PdfColors.grey600),
                  ),
                ],
              ),
            ),

            pw.SizedBox(height: 14),

            // SECTION 14: DECLARATION AND SIGNATURES
            _buildSectionHeader('14. DECLARATION AND SIGNATURES (TAMKO NA SAINI)'),
            pw.SizedBox(height: 6),
            pw.Text(
              'The parties confirm that they have read and understood this agreement, had an opportunity to ask questions, and agree to all its lawful terms.',
              style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800),
            ),
            pw.SizedBox(height: 10),

            pw.Row(
              children: [
                // LANDLORD SIGNATURE BOX
                pw.Expanded(
                  child: pw.Container(
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(
                        color: isLandlordSigned ? PdfColor.fromHex('#0F766E') : PdfColors.grey400,
                        width: 1,
                      ),
                      borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                      color: isLandlordSigned ? PdfColor.fromHex('#F0FDFA') : PdfColors.white,
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'LANDLORD (MWENYE NYUMBA)',
                          style: pw.TextStyle(
                            fontSize: 9.5,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('#0F2A3F'),
                          ),
                        ),
                        pw.SizedBox(height: 8),
                        pw.Text('Full Name: $landlordName', style: const pw.TextStyle(fontSize: 8.5)),
                        pw.SizedBox(height: 12),
                        pw.Container(
                          height: 36,
                          alignment: pw.Alignment.centerLeft,
                          decoration: const pw.BoxDecoration(
                            border: pw.Border(
                              bottom: pw.BorderSide(color: PdfColors.grey400, width: 0.8),
                            ),
                          ),
                          child: isLandlordSigned
                              ? pw.Text(
                                  landlordSignatureName ?? landlordName,
                                  style: pw.TextStyle(
                                    fontSize: 14,
                                    fontWeight: pw.FontWeight.bold,
                                    fontStyle: pw.FontStyle.italic,
                                    color: PdfColor.fromHex('#0F766E'),
                                  ),
                                )
                              : pw.Text(
                                  'Signature: __________________________',
                                  style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey500),
                                ),
                        ),
                        pw.SizedBox(height: 6),
                        pw.Text(
                          'Date: ${isLandlordSigned && landlordSignedDate != null ? landlordSignedDate : "____ / ____ / ________"}',
                          style: const pw.TextStyle(fontSize: 8.5),
                        ),
                      ],
                    ),
                  ),
                ),
                pw.SizedBox(width: 14),
                // TENANT SIGNATURE BOX
                pw.Expanded(
                  child: pw.Container(
                    padding: const pw.EdgeInsets.all(12),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(
                        color: isTenantSigned ? PdfColor.fromHex('#0F766E') : PdfColors.grey400,
                        width: 1,
                      ),
                      borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                      color: isTenantSigned ? PdfColor.fromHex('#F0FDFA') : PdfColors.white,
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'TENANT (MPANGAJI)',
                          style: pw.TextStyle(
                            fontSize: 9.5,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('#0F2A3F'),
                          ),
                        ),
                        pw.SizedBox(height: 8),
                        pw.Text('Full Name: $tenantName', style: const pw.TextStyle(fontSize: 8.5)),
                        pw.SizedBox(height: 12),
                        pw.Container(
                          height: 36,
                          alignment: pw.Alignment.centerLeft,
                          decoration: const pw.BoxDecoration(
                            border: pw.Border(
                              bottom: pw.BorderSide(color: PdfColors.grey400, width: 0.8),
                            ),
                          ),
                          child: isTenantSigned
                              ? pw.Text(
                                  tenantSignatureName ?? tenantName,
                                  style: pw.TextStyle(
                                    fontSize: 14,
                                    fontWeight: pw.FontWeight.bold,
                                    fontStyle: pw.FontStyle.italic,
                                    color: PdfColor.fromHex('#0F766E'),
                                  ),
                                )
                              : pw.Text(
                                  'Signature: __________________________',
                                  style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey500),
                                ),
                        ),
                        pw.SizedBox(height: 6),
                        pw.Text(
                          'Date: ${isTenantSigned && tenantSignedDate != null ? tenantSignedDate : "____ / ____ / ________"}',
                          style: const pw.TextStyle(fontSize: 8.5),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            pw.SizedBox(height: 14),

            // ANNEXURES / SCHEDULES CHECKLIST
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                color: PdfColors.grey100,
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                border: pw.Border.all(color: PdfColors.grey300, width: 0.7),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'ATTACHED SCHEDULES AND VERIFICATION DOCUMENTS:',
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8.5),
                  ),
                  pw.SizedBox(height: 4),
                  _checklistBullet('Property inspection and condition report (Pre-handover audit)'),
                  _checklistBullet('Inventory of furniture, fixtures and electrical equipment'),
                  _checklistBullet('Initial rent and security deposit payment receipts'),
                  _checklistBullet('National Identification (NIDA) or passport verification copies'),
                  _checklistBullet('Any additional signed schedules or special agreed conditions'),
                ],
              ),
            ),
          ];
        },
      ),
    );

    return pdf.save();
  }

  /// Print or download the agreement directly via system print/share sheet
  static Future<void> printOrDownloadPdf({
    required String agreementNumber,
    required DateTime agreementDate,
    required String landlordName,
    required String landlordIdNumber,
    required String landlordPhone,
    required String landlordEmail,
    required String landlordAddress,
    required String landlordCountry,
    required String tenantName,
    required String tenantIdNumber,
    required String tenantPhone,
    required String tenantEmail,
    required String tenantAddress,
    required String tenantCountry,
    required String propertyAddress,
    required String propertyType,
    required String unitNumber,
    required String bedrooms,
    required String permittedUse,
    required String commencementDate,
    required String expiryDate,
    required String renewalConditions,
    required num monthlyRent,
    required String paymentDueDate,
    required String paymentMethod,
    required String paymentReference,
    required num securityDeposit,
    required String depositPaymentDate,
    required String depositRefundTerms,
    required String electricityArrangement,
    required String waterArrangement,
    required String wasteCollectionArrangement,
    required String otherCharges,
    List<String>? specialConditions,
    String? landlordSignatureName,
    String? landlordSignedDate,
    String? tenantSignatureName,
    String? tenantSignedDate,
    bool isLandlordSigned = false,
    bool isTenantSigned = false,
    List<Map<String, dynamic>>? inventoryItems,
  }) async {
    final pdfBytes = await generateAgreementPdf(
      agreementNumber: agreementNumber,
      agreementDate: agreementDate,
      landlordName: landlordName,
      landlordIdNumber: landlordIdNumber,
      landlordPhone: landlordPhone,
      landlordEmail: landlordEmail,
      landlordAddress: landlordAddress,
      landlordCountry: landlordCountry,
      tenantName: tenantName,
      tenantIdNumber: tenantIdNumber,
      tenantPhone: tenantPhone,
      tenantEmail: tenantEmail,
      tenantAddress: tenantAddress,
      tenantCountry: tenantCountry,
      propertyAddress: propertyAddress,
      propertyType: propertyType,
      unitNumber: unitNumber,
      bedrooms: bedrooms,
      permittedUse: permittedUse,
      commencementDate: commencementDate,
      expiryDate: expiryDate,
      renewalConditions: renewalConditions,
      monthlyRent: monthlyRent,
      paymentDueDate: paymentDueDate,
      paymentMethod: paymentMethod,
      paymentReference: paymentReference,
      securityDeposit: securityDeposit,
      depositPaymentDate: depositPaymentDate,
      depositRefundTerms: depositRefundTerms,
      electricityArrangement: electricityArrangement,
      waterArrangement: waterArrangement,
      wasteCollectionArrangement: wasteCollectionArrangement,
      otherCharges: otherCharges,
      specialConditions: specialConditions,
      landlordSignatureName: landlordSignatureName,
      landlordSignedDate: landlordSignedDate,
      tenantSignatureName: tenantSignatureName,
      tenantSignedDate: tenantSignedDate,
      isLandlordSigned: isLandlordSigned,
      isTenantSigned: isTenantSigned,
      inventoryItems: inventoryItems,
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdfBytes,
      name: 'Rental_Agreement_${agreementNumber.replaceAll('/', '_')}.pdf',
    );
  }

  // --- Helpers ---
  static pw.Widget _buildSectionHeader(String title) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromHex('#F1F5F9'),
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(3)),
        border: pw.Border.all(color: PdfColors.grey300, width: 0.6),
      ),
      child: pw.Row(
        children: [
          pw.Text(
            title,
            style: pw.TextStyle(
              fontSize: 9.5,
              fontWeight: pw.FontWeight.bold,
              color: PdfColor.fromHex('#0F2A3F'),
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _infoLine(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(
            width: 145,
            child: pw.Text(
              '$label:',
              style: pw.TextStyle(
                fontSize: 8.5,
                fontWeight: pw.FontWeight.bold,
                color: PdfColors.grey800,
              ),
            ),
          ),
          pw.Expanded(
            child: pw.Text(
              value,
              style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.black),
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _bulletPoint(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text('• ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9)),
          pw.Expanded(
            child: pw.Text(
              text,
              style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey800),
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _checklistBullet(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1),
      child: pw.Row(
        children: [
          pw.Container(
            width: 8,
            height: 8,
            margin: const pw.EdgeInsets.only(right: 6),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey600, width: 0.8),
              borderRadius: const pw.BorderRadius.all(pw.Radius.circular(1.5)),
            ),
          ),
          pw.Expanded(
            child: pw.Text(
              text,
              style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
            ),
          ),
        ],
      ),
    );
  }
}
