import 'dart:io';
import 'package:flutter/material.dart';
import 'package:pdfx/pdfx.dart';

class PdfPreviewPage extends StatefulWidget {
  final File pdfFile;
  final String? title;

  const PdfPreviewPage({super.key, required this.pdfFile, this.title});

  @override
  State<PdfPreviewPage> createState() => _PdfPreviewPageState();
}

class _PdfPreviewPageState extends State<PdfPreviewPage> {
  late PdfControllerPinch _pdfController;

  @override
  void initState() {
    super.initState();
    _pdfController = PdfControllerPinch(
      document: PdfDocument.openFile(widget.pdfFile.path),
    );
  }

  @override
  void dispose() {
    _pdfController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.title ?? 'Document Preview',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: Colors.red,
      ),
      body: PdfViewPinch(
        controller: _pdfController,
        onPageChanged: (page) {
          // debugPrint('Page changed to: $page');
        },
      ),
    );
  }
}
