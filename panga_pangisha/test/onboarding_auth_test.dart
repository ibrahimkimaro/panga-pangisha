import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:panga_pangisha/screens/auth.dart';
import 'package:panga_pangisha/screens/customecontrols/RegionsDistrict.dart';
import 'package:panga_pangisha/screens/customecontrols/pickers.dart';
import 'package:panga_pangisha/screens/onboarding.dart';
import 'package:panga_pangisha/ui.dart';

import 'package:panga_pangisha/screens/splash.dart';

void main() {
  testWidgets('SplashScreen renders loading screen and calls onFinished on tap or timer', (tester) async {
    bool finished = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: SplashScreen(
          onFinished: () {
            finished = true;
          },
        ),
      ),
    );

    expect(find.text('Panga'), findsOneWidget);
    expect(find.text('Loading your space...'), findsOneWidget);

    // Tap to finish splash
    await tester.tap(find.text('Loading your space...'));
    await tester.pump(const Duration(milliseconds: 100));
    expect(finished, isTrue);
  });

  testWidgets('Onboarding renders Screen 1 splash and transitions to Screen 5 role selection', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: const Onboarding(),
      ),
    );

    // Initial Slide 1: Full-screen hero background
    expect(find.text('Find a home\nthat fits your life'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);

    // Tap Skip to advance to Screen 5 Role Selection
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    // Now on Screen 5: Role Selection
    expect(find.text('Welcome to Panga'), findsOneWidget);
    expect(find.text('Tenant'), findsOneWidget);
    expect(find.text('Landlord'), findsOneWidget);
    expect(find.text('Property Manager'), findsOneWidget);
  });

  testWidgets('AuthScreen renders Screen 6 options chooser and navigates to Screen 7 register', (tester) async {
    AuthScreen.startWithRegister = true;
    AuthScreen.initialSelectedRole = 'landlord';

    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: const AuthScreen(),
      ),
    );

    // Screen 6 Chooser
    expect(find.text('Create your account'), findsOneWidget);
    expect(find.text('Continue with Google'), findsOneWidget);
    expect(find.text('Continue with Apple'), findsOneWidget);
    expect(find.text('Sign up with email'), findsOneWidget);

    // Tap "Sign up with email"
    await tester.tap(find.text('Sign up with email'));
    await tester.pumpAndSettle();

    // Screen 7 Registration Form (for Landlord)
    expect(find.text('Landlord Registration'), findsOneWidget);
    expect(find.text('Set up your owner account'), findsOneWidget);
    expect(find.text('Full name'), findsOneWidget);
    expect(find.text('Email address'), findsOneWidget);
    expect(find.text('Phone number'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Create Account'), findsOneWidget);

    // The phone field starts with Tanzania's code; choosing Kenya swaps the code and keeps the typed number.
    expect(find.text('Country'), findsOneWidget);
    expect(find.text('🇹🇿  Tanzania'), findsOneWidget);
    await tester.enterText(find.widgetWithText(TextFormField, '+255 '), '+255 765 432 100');
    await tester.ensureVisible(find.text('🇹🇿  Tanzania'));
    await tester.tap(find.text('🇹🇿  Tanzania'));
    await tester.pumpAndSettle();
    expect(find.text('Your country'), findsOneWidget);
    await tester.enterText(find.widgetWithText(TextField, 'Search'), 'ken');
    await tester.pumpAndSettle();
    expect(find.text('Uganda'), findsNothing);
    await tester.tap(find.text('Kenya'));
    await tester.pumpAndSettle();
    expect(find.text('🇰🇪  Kenya'), findsOneWidget);
    expect(find.text('+254 765 432 100'), findsOneWidget);
  });

  testWidgets('a picker lists the districts of the chosen region', (tester) async {
    final district = TextEditingController();
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: Scaffold(
          body: Builder(
            builder: (context) => PickerField(
              'District',
              controller: district,
              hint: 'Choose',
              onTap: () async {
                final d = await pickFrom<String>(context, title: 'District in Arusha', items: regionDistrictMap['Arusha']!, label: (d) => d);
                if (d != null) district.text = d;
              },
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.byType(TextFormField));
    await tester.pumpAndSettle();
    expect(find.text('District in Arusha'), findsOneWidget);
    expect(find.text('Karatu'), findsOneWidget);
    expect(find.text('Kinondoni'), findsNothing); // that one is in Dar es Salaam
    await tester.tap(find.text('Karatu'));
    await tester.pumpAndSettle();
    expect(district.text, 'Karatu');
  });
}
