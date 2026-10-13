import 'package:flutter/material.dart';

import '../../l10n.dart';
import '../../ui.dart';

/// Looks like [Field], but opens a list instead of the keyboard.
class PickerField extends StatelessWidget {
  const PickerField(
    this.label, {
    super.key,
    required this.controller,
    required this.onTap,
    this.hint,
    this.validator,
  });

  final String label;
  final TextEditingController controller; // holds the chosen text
  final VoidCallback onTap;
  final String? hint;
  final String? Function(String)? validator;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.only(left: 2, bottom: 7),
        child: Text(label, style: body(14, weight: FontWeight.w600)),
      ),
      TextFormField(
        controller: controller,
        readOnly: true,
        onTap: onTap,
        validator: (v) => validator?.call((v ?? '').trim()),
        autovalidateMode: AutovalidateMode.onUserInteraction,
        style: body(16),
        decoration: InputDecoration(
          hintText: hint,
          suffixIcon: Icon(Icons.expand_more_rounded, color: C.muted),
        ),
      ),
    ],
  );
}

/// A list in a bottom sheet (with a search box once it is long); returns the chosen item.
Future<T?> pickFrom<T>(
  BuildContext context, {
  required String title,
  required List<T> items,
  required String Function(T) label,
  String Function(T)? leading,
  String Function(T)? trailing,
}) => showModalBottomSheet<T>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  builder: (_) => _PickSheet<T>(title, items, label, leading, trailing),
);

class _PickSheet<T> extends StatefulWidget {
  const _PickSheet(this.title, this.items, this.label, this.leading, this.trailing);
  final String title;
  final List<T> items;
  final String Function(T) label;
  final String Function(T)? leading, trailing;

  @override
  State<_PickSheet<T>> createState() => _PickSheetState<T>();
}

class _PickSheetState<T> extends State<_PickSheet<T>> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final found = [
      for (final item in widget.items)
        if ('${widget.label(item)} ${widget.trailing?.call(item) ?? ''}'.toLowerCase().contains(_q)) item,
    ];
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * .7,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: Text(widget.title, style: display(20, weight: FontWeight.w800)),
            ),
            if (widget.items.length > 8)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: TextField(
                  autofocus: false,
                  onChanged: (v) => setState(() => _q = v.trim().toLowerCase()),
                  style: body(16),
                  decoration: InputDecoration(
                    hintText: t('Search', 'Tafuta'),
                    prefixIcon: Icon(Icons.search_rounded, size: 20, color: C.muted),
                  ),
                ),
              ),
            Expanded(
              child: found.isEmpty
                  ? Center(child: Text(t('Nothing matches', 'Hakuna kinacholingana'), style: body(14.5, color: C.muted)))
                  : ListView.builder(
                      itemCount: found.length,
                      itemBuilder: (context, i) {
                        final item = found[i];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                          leading: widget.leading == null
                              ? null
                              : Text(widget.leading!(item), style: const TextStyle(fontSize: 24)),
                          title: Text(widget.label(item), style: body(16, weight: FontWeight.w500)),
                          trailing: widget.trailing == null
                              ? null
                              : Text(widget.trailing!(item), style: body(14.5, color: C.muted)),
                          onTap: () => Navigator.pop(context, item),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
