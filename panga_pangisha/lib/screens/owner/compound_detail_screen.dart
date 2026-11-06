import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../ui.dart';
import 'compound_models.dart';
import 'properties.dart';
import 'wizard/property_wizard.dart';
import 'wizard/wizard_models.dart';

class CompoundDetailScreen extends StatefulWidget {
  const CompoundDetailScreen(this.compound, {super.key});
  final CompoundModel compound;

  @override
  State<CompoundDetailScreen> createState() => _CompoundDetailScreenState();
}

class _CompoundDetailScreenState extends State<CompoundDetailScreen> {
  late CompoundModel _compound = widget.compound;
  bool _refreshing = false;

  Future<void> _refresh() async {
    setState(() => _refreshing = true);
    try {
      final res = await Api.get('landlord/compounds/${_compound.id}');
      if (mounted && res is Map<String, dynamic>) {
        setState(() => _compound = CompoundModel.fromJson(res));
      }
    } catch (_) {}
    if (mounted) setState(() => _refreshing = false);
  }

  Future<void> _addHouse() async {
    final draft = PropertyDraft()
      ..compoundId = _compound.id
      ..compoundName = _compound.name
      ..region = _compound.region
      ..district = _compound.district
      ..ward = _compound.ward
      ..street = _compound.street
      ..napaNumber = _compound.napaNumber
      ..houseNumber = _compound.houseNumber
      ..description = t('Building situated inside ${_compound.name}', 'Jengo lililopo ndani ya ${_compound.name}');
    if (_compound.latitude != null && _compound.longitude != null) {
      draft.locationPin = LatLng(_compound.latitude!, _compound.longitude!);
      draft.mapAddressConfirmed = '${_compound.latitude}, ${_compound.longitude}';
    }

    final published = await push<bool>(context, PropertyWizardScreen(initialDraft: draft));
    if (published == true) {
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _compound;
    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        backgroundColor: C.card,
        elevation: 0,
        leading: const BackButton(),
        title: Text(c.name, style: display(16, weight: FontWeight.w800)),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: _refreshing ? C.teal : C.muted),
            onPressed: _refresh,
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          decoration: BoxDecoration(
            color: C.card,
            border: Border(top: BorderSide(color: C.line)),
          ),
          child: Button(
            t('+ Add House into Compound', '+ Ongeza Nyumba Kwenye Compaundi'),
            icon: Icons.add_home_work_rounded,
            onTap: _addHouse,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        children: [
          // Hero Summary Card
          Glass(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: SizedBox.square(
                        dimension: 80,
                        child: Photo(c.coverImage, width: 80),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: C.tealLight, borderRadius: BorderRadius.circular(8)),
                                child: Text(c.compoundType.toUpperCase(), style: body(10.5, color: C.teal, weight: FontWeight.w800)),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: C.goodTint, borderRadius: BorderRadius.circular(8)),
                                child: Text('${c.occupancyRate}% Occupied', style: body(10.5, color: C.good, weight: FontWeight.w700)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 5),
                          Text(c.name, style: display(16, weight: FontWeight.w800)),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Icon(Icons.location_on_outlined, size: 14, color: C.muted),
                              const SizedBox(width: 3),
                              Expanded(
                                child: Text(c.fullAddress, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(12, color: C.muted)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (c.napaNumber.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(color: C.chokaa, borderRadius: BorderRadius.circular(10)),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.qr_code_2_rounded, size: 16, color: C.teal),
                        const SizedBox(width: 6),
                        Text('NAPA: ${c.napaNumber}', style: body(12, color: C.teal, weight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ],
                if (c.description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(c.description, style: body(12.5, color: C.wino, height: 1.4)),
                ],
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Facilities & Amenities
          if (c.amenities.isNotEmpty) ...[
            Text(t('Compound Shared Amenities', 'Huduma za Eneo la Compaundi'), style: display(14.5, weight: FontWeight.w800)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final a in c.amenities)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: C.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: C.line),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle_rounded, size: 13, color: C.teal),
                        const SizedBox(width: 5),
                        Text(a, style: body(11.5, weight: FontWeight.w600)),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 18),
          ],

          // Houses / Buildings Section Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                t('Buildings & Houses (${c.houses.length})', 'Majengo & Nyumba Ndani (${c.houses.length})'),
                style: display(15, weight: FontWeight.w800),
              ),
              Text(
                '${c.totalUnits} ${t('total units', 'vyumba jumla')}',
                style: body(12, color: C.muted, weight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 10),

          if (c.houses.isEmpty) ...[
            Notice(
              icon: Icons.add_home_work_outlined,
              title: t('No houses registered in this compound yet', 'Hakuna nyumba iliyosajiliwa bado'),
              text: t('Tap below to register a standalone house, multi-unit building, or room tenancy structure.',
                'Gusa kitufe hapa chini kusajili nyumba ya pekee, ghorofa au nyumba ya vyumba.'),
              action: t('+ Add House into Compound', '+ Ongeza Nyumba'),
              onAction: _addHouse,
            ),
          ] else ...[
            for (final h in c.houses)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Press(
                  onTap: () => push(context, PropertyDetailScreen(h)),
                  child: Glass(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: SizedBox.square(
                            dimension: 70,
                            child: Photo(h.photos.firstOrNull ?? c.coverImage, width: 70),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(h.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: display(14.5, weight: FontWeight.w700)),
                                  ),
                                  const SizedBox(width: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: h.status == 'occupied' || h.status == 'rented' ? C.goodTint : C.tealLight,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      h.status == 'occupied' || h.status == 'rented' ? t('Occupied', 'Imepangishwa') : t('Active', 'Hai'),
                                      style: body(10.5, color: h.status == 'occupied' || h.status == 'rented' ? C.good : C.teal, weight: FontWeight.w700),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(h.type, style: body(12, color: C.muted)),
                              const SizedBox(height: 5),
                              Row(
                                children: [
                                  Text(
                                    tzs(h.rent),
                                    style: body(13, color: C.teal, weight: FontWeight.w800),
                                  ),
                                  Text(t(' /month', ' /mwezi'), style: body(11, color: C.muted)),
                                  const Spacer(),
                                  if (h.units.isNotEmpty)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: C.chokaa, borderRadius: BorderRadius.circular(6)),
                                      child: Text('${h.units.length} units', style: body(11, color: C.wino, weight: FontWeight.w600)),
                                    )
                                  else
                                    Text('${h.bedrooms} bed • ${h.bathrooms} bath', style: body(11.5, color: C.muted)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}
