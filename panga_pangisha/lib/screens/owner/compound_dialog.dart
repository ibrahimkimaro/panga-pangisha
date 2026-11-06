import 'package:flutter/material.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../ui.dart';
import '../customecontrols/RegionsDistrict.dart';
import '../customecontrols/pickers.dart';
import 'compound_models.dart';

/// Modal dialog for adding a new Compound / Site with a compact, modern layout.
class AddCompoundDialog extends StatefulWidget {
  const AddCompoundDialog({super.key});

  static Future<CompoundModel?> show(BuildContext context) {
    return showModalBottomSheet<CompoundModel>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddCompoundDialog(),
    );
  }

  @override
  State<AddCompoundDialog> createState() => _AddCompoundDialogState();
}

class _AddCompoundDialogState extends State<AddCompoundDialog> {
  final _nameCtrl = TextEditingController();
  final _wardCtrl = TextEditingController();
  final _streetCtrl = TextEditingController();
  final _napaCtrl = TextEditingController();
  final _houseNoCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  String _region = 'Dar es Salaam';
  String _district = 'Kinondoni';
  String _compoundType = 'residential';
  final Set<String> _amenities = {
    'Fenced Perimeter',
    '24/7 Security Guard',
    'Borehole Water & DAWASA',
    'Dedicated Parking',
    'STS LUKU Submeter',
  };

  bool _submitting = false;
  String? _error;

  static const _availableAmenities = [
    'Fenced Perimeter',
    '24/7 Security Guard',
    'Borehole Water & DAWASA',
    'Dedicated Parking',
    'STS LUKU Submeter',
    'Electric Gate',
    'Standby Generator',
    'Paved Cabro Ground',
    'CCTV Surveillance',
    'Garden & Green Space',
    'Waste Collection',
  ];

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      setState(() => _error = t('Please enter a compound name.', 'Weka jina la compaundi.'));
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final res = await Api.post('landlord/compounds', {
        'name': name,
        'compound_type': _compoundType,
        'region': _region,
        'district': _district,
        'ward': _wardCtrl.text.trim(),
        'street': _streetCtrl.text.trim(),
        'house_number': _houseNoCtrl.text.trim(),
        'napa_number': _napaCtrl.text.trim().toUpperCase(),
        'description': _descCtrl.text.trim(),
        'amenities': _amenities.toList(),
      });

      if (!mounted) return;
      final compound = CompoundModel.fromJson(res is Map<String, dynamic> ? res : {});
      Navigator.of(context).pop(compound);
    } catch (e) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      margin: EdgeInsets.only(bottom: bottomInset),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 16)],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 16, 12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: C.line)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: C.tealLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.domain_rounded, color: C.teal, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t('Register New Compound', 'Sajili Compaundi Mpya'), style: display(16, weight: FontWeight.w800)),
                      Text(
                        t('Parent site for multiple houses or buildings', 'Eneo kuu linalobeba nyumba au fleti kadhaa'),
                        style: body(12, color: C.muted),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Scrollable Form
          Flexible(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              children: [
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(10),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: C.blush,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(_error!, style: body(12.5, color: C.hibiscus, weight: FontWeight.w600)),
                  ),
                ],

                Text(t('Compound Name', 'Jina la Compaundi'), style: body(12, color: C.muted, weight: FontWeight.w600)),
                const SizedBox(height: 5),
                TextField(
                  controller: _nameCtrl,
                  style: body(14),
                  decoration: InputDecoration(
                    hintText: t('e.g. Goba Executive Compound, Sinza Prime Court', 'mf. Goba Executive Compound'),
                    prefixIcon: const Icon(Icons.apartment_rounded, size: 18),
                  ),
                ),

                const SizedBox(height: 12),
                Text(t('Compound Type', 'Aina ya Eneo'), style: body(12, color: C.muted, weight: FontWeight.w600)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    for (final type in ['residential', 'mixed', 'commercial']) ...[
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: Press(
                            onTap: () => setState(() => _compoundType = type),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: _compoundType == type ? C.tealLight : C.chokaa,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: _compoundType == type ? C.teal : C.line),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                type == 'residential'
                                    ? t('Residential', 'Makazi')
                                    : type == 'mixed'
                                        ? t('Mixed', 'Mchanganyiko')
                                        : t('Commercial', 'Biashara'),
                                style: body(12, color: _compoundType == type ? C.teal : C.wino, weight: FontWeight.w600),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),

                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Region', 'Mkoa'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          Press(
                            onTap: () async {
                              final picked = await pickFrom<String>(
                                context,
                                title: t('Select Region', 'Chagua Mkoa'),
                                items: regionDistrictMap.keys.toList(),
                                label: (r) => r,
                              );
                              if (picked != null) {
                                setState(() {
                                  _region = picked;
                                  _district = regionDistrictMap[picked]?.first ?? '';
                                });
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
                              decoration: BoxDecoration(color: C.chokaa, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.line)),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(child: Text(_region, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(13, weight: FontWeight.w600))),
                                  const Icon(Icons.arrow_drop_down, size: 18),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('District', 'Wilaya'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          Press(
                            onTap: () async {
                              final list = regionDistrictMap[_region] ?? ['Kinondoni', 'Ilala', 'Ubungo'];
                              final picked = await pickFrom<String>(
                                context,
                                title: t('Select District', 'Chagua Wilaya'),
                                items: list,
                                label: (d) => d,
                              );
                              if (picked != null) setState(() => _district = picked);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
                              decoration: BoxDecoration(color: C.chokaa, borderRadius: BorderRadius.circular(10), border: Border.all(color: C.line)),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(child: Text(_district, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(13, weight: FontWeight.w600))),
                                  const Icon(Icons.arrow_drop_down, size: 18),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Ward (Kata)', 'Kata'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: _wardCtrl,
                            style: body(13.5),
                            decoration: InputDecoration(hintText: t('e.g. Goba, Sinza', 'mf. Goba')),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('Street (Mtaa)', 'Mtaa'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: _streetCtrl,
                            style: body(13.5),
                            decoration: InputDecoration(hintText: t('e.g. Tegeta A Road', 'mf. Tegeta A')),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('NAPA Postal Code', 'Namba ya NAPA'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: _napaCtrl,
                            style: body(13.5, weight: FontWeight.w600),
                            decoration: const InputDecoration(
                              hintText: '14111-KIN-GOB-0418',
                              prefixIcon: Icon(Icons.tag, size: 16),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(t('House/Plot No.', 'Plot No.'), style: body(12, color: C.muted)),
                          const SizedBox(height: 4),
                          TextField(
                            controller: _houseNoCtrl,
                            style: body(13.5),
                            decoration: const InputDecoration(hintText: 'Plot 418'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                Text(t('Description', 'Maelezo ya Eneo'), style: body(12, color: C.muted)),
                const SizedBox(height: 4),
                TextField(
                  controller: _descCtrl,
                  maxLines: 2,
                  style: body(13.5),
                  decoration: InputDecoration(
                    hintText: t('Describe compound gates, security, parking, water storage...',
                      'Eleza geti, ulinzi, maegesho na akiba ya maji ya compaundi...'),
                  ),
                ),

                const SizedBox(height: 14),
                Text(t('Shared Amenities on Site', 'Huduma za Pamoja Eneoni'), style: display(14, weight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final a in _availableAmenities) ...[
                      Press(
                        onTap: () {
                          setState(() {
                            if (_amenities.contains(a)) {
                              _amenities.remove(a);
                            } else {
                              _amenities.add(a);
                            }
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: _amenities.contains(a) ? C.tealLight : C.chokaa,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: _amenities.contains(a) ? C.teal : C.line),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _amenities.contains(a) ? Icons.check_circle_rounded : Icons.add_circle_outline_rounded,
                                size: 13,
                                color: _amenities.contains(a) ? C.teal : C.muted,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                a,
                                style: body(11.5, color: _amenities.contains(a) ? C.teal : C.wino, weight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // Footer Action
          Container(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
            decoration: BoxDecoration(border: Border(top: BorderSide(color: C.line))),
            child: Row(
              children: [
                Expanded(
                  child: Button(
                    t('Cancel', 'Ghairi'),
                    tone: Tone.plain,
                    onTap: () => Navigator.pop(context),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: Button(
                    _submitting ? t('Saving...', 'Inahifadhi...') : t('Create Compound', 'Sajili Compaundi'),
                    icon: Icons.check_rounded,
                    onTap: _submitting ? null : _submit,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
