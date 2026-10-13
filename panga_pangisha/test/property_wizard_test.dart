import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:panga_pangisha/screens/owner/wizard/property_wizard.dart';
import 'package:panga_pangisha/screens/owner/wizard/wizard_models.dart';
import 'package:panga_pangisha/ui.dart';

void main() {
  group('Property Wizard & Unit Management Tests', () {
    test('PropertyDraft serializes and deserializes to JSON accurately for local drafts', () {
      final draft = PropertyDraft();
      draft.propertyName = 'Kimaro Modern Residence';
      draft.napaNumber = '14111-MBZ-042';
      draft.rentalMode = RentalMode.rooms;
      draft.propertyType = WizardPropertyType.standaloneHouse;
      draft.region = 'Dar es Salaam';
      draft.district = 'Kinondoni';
      draft.ward = 'Mbezi Beach';
      draft.street = 'Africana Rd';
      draft.overallRent = 550000;

      draft.templates = [
        UnitTemplate(
          id: 't1',
          name: 'Master Bedroom',
          unitType: 'Master Bedroom',
          quantity: 2,
          defaultRent: 25000,
          paymentTerms: '4 months advance',
        ),
        UnitTemplate(
          id: 't2',
          name: 'Standard Room',
          unitType: 'Standard Room',
          quantity: 1,
          defaultRent: 10000,
          paymentTerms: '6 months advance',
        ),
      ];

      draft.generateUnitsFromTemplates();
      expect(draft.units.length, 3);
      expect(draft.units[0].unitNumber, 'Master Bedroom 1');
      expect(draft.units[1].unitNumber, 'Master Bedroom 2');
      expect(draft.units[2].unitNumber, 'Standard Room');

      // Round-trip through JSON
      final json = draft.toJson();
      final restored = PropertyDraft.fromJson(json);

      expect(restored.propertyName, 'Kimaro Modern Residence');
      expect(restored.napaNumber, '14111-MBZ-042');
      expect(restored.rentalMode, RentalMode.rooms);
      expect(restored.units.length, 3);
      expect(restored.units[0].monthlyRent, 25000);
      expect(restored.units[2].monthlyRent, 10000);
    });

    test('Overriding a single unit does not mutate sibling units', () {
      final draft = PropertyDraft();
      draft.rentalMode = RentalMode.rooms;
      draft.templates = [
        UnitTemplate(
          id: 't_m',
          name: 'Master Bedroom',
          quantity: 2,
          defaultRent: 25000,
          paymentTerms: '4 months advance',
        ),
      ];
      draft.generateUnitsFromTemplates();

      expect(draft.units.length, 2);
      expect(draft.units[0].monthlyRent, 25000);
      expect(draft.units[1].monthlyRent, 25000);

      // Mutate unit 0
      draft.units[0].monthlyRent = 30000;
      draft.units[0].isCustomized = true;

      // Unit 1 must remain untouched
      expect(draft.units[0].monthlyRent, 30000);
      expect(draft.units[1].monthlyRent, 25000);
    });

    test('Bulk updating units applies to all units without altering historical structures', () {
      final draft = PropertyDraft();
      draft.rentalMode = RentalMode.rooms;
      draft.templates = [
        UnitTemplate(id: 't1', name: 'Master Room', quantity: 2, defaultRent: 25000),
        UnitTemplate(id: 't2', name: 'Standard Room', quantity: 1, defaultRent: 10000),
      ];
      draft.generateUnitsFromTemplates();

      // Bulk update terms to '12 months advance'
      for (final u in draft.units) {
        u.paymentTerms = '12 months advance';
      }

      for (final u in draft.units) {
        expect(u.paymentTerms, '12 months advance');
      }
      expect(draft.units[0].monthlyRent, 25000);
      expect(draft.units[2].monthlyRent, 10000);
    });

    testWidgets('PropertyWizardScreen renders Step 1 with property type and rental modes', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: appTheme(),
          home: const PropertyWizardScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Property Type'), findsOneWidget);
      expect(find.text('How will you rent this property?'), findsOneWidget);
      expect(find.text('Entire property as one rental'), findsOneWidget);
      expect(find.text('Multiple independent units'), findsOneWidget);
      expect(find.text('Individual rooms within a shared property'), findsOneWidget);
      expect(find.text('AI Assist'), findsOneWidget);
      expect(find.text('Continue'), findsOneWidget);
    });
  });
}
