import 'package:flutter/material.dart';

import 'owner/wizard/property_wizard.dart';
import 'owner/wizard/wizard_models.dart';

export 'owner/wizard/property_wizard.dart';
export 'owner/wizard/wizard_models.dart';

/// Screen 14: Multi-Step Landlord Property Creation & Unit Management Wizard.
class AddHomeScreen extends StatelessWidget {
  const AddHomeScreen({super.key, this.initialDraft});
  final PropertyDraft? initialDraft;

  @override
  Widget build(BuildContext context) => PropertyWizardScreen(initialDraft: initialDraft);
}
