import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:panga_pangisha/LandLoardScreens/pdfFileImage.dart';
import 'package:path_provider/path_provider.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';
// import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:syncfusion_flutter_signaturepad/signaturepad.dart';

class Rentalagreements extends StatefulWidget {
  const Rentalagreements({super.key});

  @override
  State<Rentalagreements> createState() => _PdfFormPageState();
}

class _PdfFormPageState extends State<Rentalagreements> {
  final GlobalKey<SfSignaturePadState> _signatureKey = GlobalKey();

  final nameController = TextEditingController();
  final Phone_NUmberController = TextEditingController();
  final HouseplaceController = TextEditingController();
  final dateController = TextEditingController();
  final amountController = TextEditingController();

  String? pdfPath;
  String? dateTime;

  void _clearSignature() {
    _signatureKey.currentState?.clear();
  }

  Future<void> generatePdf(
    String name,
    int phoneNumber,
    String housePlace,
    double amount,
    String date,
  ) async {
    final signatureState = _signatureKey.currentState;
    if (signatureState == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Signature pad is not ready")));
      return;
    }

    final ui.Image image = await signatureState.toImage();
    final ByteData? byteData = await image.toByteData(
      format: ui.ImageByteFormat.png,
    );
    if (byteData == null) return;

    final Uint8List imageBytes = byteData.buffer.asUint8List();
    final PdfBitmap signatureImage = PdfBitmap(imageBytes);

    final PdfDocument document = PdfDocument();
    final PdfPage page = document.pages.add();
    final double pageWidth = page.getClientSize().width;

    double yOffset = 0;

    // Title
    page.graphics.drawString(
      'MKATABA WA KUPANGISHA NYUMBA',
      PdfStandardFont(PdfFontFamily.helvetica, 20, style: PdfFontStyle.bold),
      bounds: Rect.fromLTWH(0, yOffset, pageWidth, 40),
      format: PdfStringFormat(alignment: PdfTextAlignment.center),
    );
    yOffset += 50;

    // Body text
    final String introText =
        '''
Tarehe: $date
Mimi ndugu: ${name.toUpperCase()}.
nimepangisha sehemu ya nyumba yangu: ${housePlace.toUpperCase()}

Amelipa kiasi cha: $amount TZS

Mkataba huu utaanza rasmi tarehe: ____________  na kumaliza tarehe: ____________
''';
    page.graphics.drawString(
      introText,
      PdfStandardFont(PdfFontFamily.helvetica, 14),
      bounds: Rect.fromLTWH(0, yOffset, pageWidth, 120),
      format: PdfStringFormat(alignment: PdfTextAlignment.center),
    );
    yOffset += 130;

    // Section Title
    page.graphics.drawString(
      'MASHART YA MKATABA HUU',
      PdfStandardFont(
        PdfFontFamily.helvetica,
        16,
        multiStyle: <PdfFontStyle>[PdfFontStyle.bold, PdfFontStyle.underline],
      ),
      bounds: Rect.fromLTWH(0, yOffset, pageWidth, 30),
    );
    yOffset += 40;

    // Contract terms
    final String terms = '''
> Malipo ya mkataba huu yatafanyika mwezi mmoja kabla ya mkataba kuisha.
> Gharama za malipo ya umeme, maji na taka ni Tsh, na italipwa kila mwezi kwa wakati.
> Kodi iliyokwishalipwa haitarudishwa endapo utavunja mkataba huu mwenyewe mpangaji.
> Mpangaji haruhusiwi kupangisha chumba alichokipanga au kumuachia mtu mwingine.
> Mpangaji haruhusiwi kutumia AC au jiko la umeme ndani ya chumba.
> Ifikapo mwisho wa mkataba, mpangaji atakabidhi chumba husika kwa mwenye nyumba kikiwa katika hali ya usafi.
> Endapo mpangishaji au mpangaji atahitaji kuvunja mkataba huu ana uhuru wa kutoa notice mwezi mmoja kabla ya kuisha kwa mkataba.
> Nyumba iheshimike, mwisho kukaa ni watu wawili na pasiwe sehemu ya biashara wala kituo cha mikutano.
> Mpangaji haruhusiwi kuweka muziki kwa sauti ya kuwakera wapangaji wenzake, hususani wakati wa usiku.
> Mpangaji anatakiwa kushiriki katika mambo yote yanayohusiana na usafi.
> Marufuku kutumia mihadarati yoyote ndani ya chumba.
''';
    page.graphics.drawString(
      terms,
      PdfStandardFont(PdfFontFamily.helvetica, 12),
      bounds: Rect.fromLTWH(0, yOffset, pageWidth, 300),
    );
    yOffset += 250;

    // Signature block
    page.graphics.drawString(
      'Jina kamili la Mwenye Nyumba: ${name.toUpperCase()}',
      PdfStandardFont(PdfFontFamily.helvetica, 12),
      bounds: Rect.fromLTWH(0, yOffset, pageWidth, 20),
    );
    yOffset += 20;

    page.graphics.drawString(
      'Namba ya simu: $phoneNumber',
      PdfStandardFont(PdfFontFamily.helvetica, 12),
      bounds: Rect.fromLTWH(0, yOffset, pageWidth, 20),
    );
    yOffset += 20;

    page.graphics.drawString(
      'Sahihi:',
      PdfStandardFont(PdfFontFamily.helvetica, 12),
      bounds: Rect.fromLTWH(0, yOffset, pageWidth, 20),
    );
    page.graphics.drawImage(
      signatureImage,
      Rect.fromLTWH(60, yOffset, 120, 50),
    );
    yOffset += 70;

    // Bottom Warning
    page.graphics.drawString(
      'LIPA KODA KWA WAKATI KUEPUSHA USUMBUFU WA KUTOLEWA KWENYE NYUMBA',
      PdfStandardFont(
        PdfFontFamily.helvetica,
        12,
        multiStyle: <PdfFontStyle>[PdfFontStyle.bold, PdfFontStyle.italic],
      ),
      bounds: Rect.fromLTWH(0, yOffset, pageWidth, 30),
      format: PdfStringFormat(alignment: PdfTextAlignment.center),
    );

    final List<int> bytes = await document.save();
    document.dispose();

    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/filled_contract.pdf');
    await file.writeAsBytes(bytes, flush: true);

    setState(() {
      pdfPath = file.path;
    });
  }

  final LocalAuthentication auth = LocalAuthentication();

  Future<bool> authenticateUser() async {
    final LocalAuthentication auth = LocalAuthentication();

    bool canAuthenticateWithBiometrics = await auth.canCheckBiometrics;
    bool canAuthenticate =
        canAuthenticateWithBiometrics || await auth.isDeviceSupported();

    if (!canAuthenticate) return false;

    try {
      return await auth.authenticate(
        localizedReason: 'Please verify with fingerprint.',
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      );
    } catch (e) {
      debugPrint("Authentication error: $e");
      return false;
    }
  }

  void openPdf(BuildContext context) {
    if (pdfPath == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PdfPreviewPage(pdfFile: File(pdfPath!)),
      ),
    );
  }

  final labelStyle = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    // color: Colors.white,
  );
  IconData? icons;
  final boxStyle = InputDecoration(
    border: OutlineInputBorder(),
    focusedBorder: UnderlineInputBorder(),
    floatingLabelBehavior: FloatingLabelBehavior.always,
  );
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Rental Agreements")),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Container(
            // alignment: Alignment.topLeft,
            // height: 800,
            padding: EdgeInsets.all(10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.all(Radius.circular(18)),
              color: const Color.fromARGB(255, 236, 195, 160),
            ),
            child: Column(
              // mainAxisAlignment: MainAxisAlignment.center,
              spacing: 4,
              children: [
                SizedBox(height: 20),
                Column(
                  // mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("FUll name:", style: labelStyle),
                    TextField(
                      controller: nameController,
                      keyboardType: TextInputType.name,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),

                      decoration: boxStyle,
                    ),
                  ],
                ),
                SizedBox(height: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Phone Number:", style: labelStyle),
                    TextField(
                      controller: Phone_NUmberController,
                      keyboardType: TextInputType.phone,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      decoration: boxStyle,
                    ),
                  ],
                ),
                SizedBox(height: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Address:", style: labelStyle),
                    TextField(
                      controller: HouseplaceController,
                      keyboardType: TextInputType.streetAddress,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      decoration: boxStyle,
                    ),
                  ],
                ),
                SizedBox(height: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Amount:", style: labelStyle),
                    TextField(
                      controller: amountController,
                      keyboardType: TextInputType.number,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      decoration: boxStyle,
                    ),
                  ],
                ),
                SizedBox(height: 20),
                Column(
                  children: [
                    SizedBox(
                      height: 250,
                      child: SfSignaturePad(
                        key: _signatureKey,
                        backgroundColor: Colors.grey[200],
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        // ElevatedButton(
                        //   onPressed: _saveSignature,
                        //   child: Text("Save"),
                        // ),
                        ElevatedButton(
                          onPressed: _clearSignature,
                          child: Text("Clear"),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromARGB(255, 174, 168, 162),
                    minimumSize: const Size.fromHeight(50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () {
                    final DT =
                        "${DateTime.now().day}-${DateTime.now().month}-${DateTime.now().year}";
                    setState(() {
                      dateTime = DT;
                    });
                    generatePdf(
                      nameController.text,
                      int.tryParse(Phone_NUmberController.text) ?? 0,
                      HouseplaceController.text,
                      double.tryParse(amountController.text) ?? 0.0,
                      dateTime!,
                    );
                  },
                  child: Text(
                    "Generate PDF",
                    style: TextStyle(color: Colors.white, fontSize: 20),
                  ),
                ),
                SizedBox(height: 10),
                if (pdfPath != null)
                  SizedBox(
                    width: 300,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color.fromARGB(255, 190, 39, 25),
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () async {
                        bool authenticated = await authenticateUser();
                        if (!context.mounted) return;
                        if (authenticated) {
                          openPdf(context);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("Authentications Faild.")),
                          );
                        }
                      },
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        spacing: 10,
                        children: [
                          Icon(
                            Icons.picture_as_pdf,
                            size: 25,
                            color: Colors.white,
                          ),
                          Text(
                            "View PDF",
                            style: TextStyle(color: Colors.white, fontSize: 20),
                          ),
                        ],
                      ),
                      // onPressed: () => openPdf(context),
                      // style: ElevatedButton.styleFrom(
                      //   backgroundColor: const Color.fromARGB(255, 190, 39, 25),
                      //   minimumSize: const Size.fromHeight(50),
                      //   shape: RoundedRectangleBorder(
                      //     borderRadius: BorderRadius.circular(12),
                      //   ),
                      // ),
                      // child: Row(
                      //   mainAxisAlignment: MainAxisAlignment.center,
                      //   spacing: 10,
                      //   children: [
                      //     Icon(
                      //       Icons.picture_as_pdf,
                      //       size: 25,
                      //       color: Colors.white,
                      //     ),
                      //     Text(
                      //       "View PDF",
                      //       style: TextStyle(color: Colors.white, fontSize: 20),
                      //     ),
                      //   ],
                      // ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
