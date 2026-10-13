import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:panga_pangisha/screens/owner/identity_verification.dart';
import 'package:panga_pangisha/screens/owner/profile_setup.dart';
import 'package:panga_pangisha/screens/owner/landlord_welcome.dart';
import 'package:panga_pangisha/screens/owner/landlord_dashboard.dart';
import 'package:panga_pangisha/ui.dart';

void main() {
  setUpAll(initializeDateFormatting); // the dashboard shows today's date; main() does this in the real app

  testWidgets('Screen 8 identity form offers a NIDA number or a card photo and checks the number', (tester) async {
    Map<String, dynamic>? sent;

    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: Scaffold(
          body: IdentityForm(reason: 'The photo is blurry.', onSent: (r) => sent = r, onStale: () {}, onRentInstead: () {}),
        ),
      ),
    );

    expect(find.text('Verify your identity'), findsOneWidget);
    expect(find.text('The photo is blurry.'), findsOneWidget); // why the last try was rejected
    expect(find.text('Photo of your NIDA card'), findsOneWidget);
    expect(find.text('Take a photo'), findsNothing); // the photo option is closed until chosen

    // Four digits are not a NIDA number: nothing is sent.
    await tester.enterText(find.byType(TextField), '1985');
    await tester.ensureVisible(find.text('Send for review'));
    await tester.tap(find.text('Send for review'));
    await tester.pumpAndSettle();
    expect(find.text('A NIDA number has 20 digits. You entered 4.'), findsOneWidget);
    expect(sent, isNull);

    // Choosing the photo option opens its buttons; sending without a photo is refused too.
    await tester.ensureVisible(find.text('Photo of your NIDA card'));
    await tester.tap(find.text('Photo of your NIDA card'));
    await tester.pumpAndSettle();
    expect(find.text('Take a photo'), findsOneWidget);
    await tester.ensureVisible(find.text('Send for review'));
    await tester.tap(find.text('Send for review'));
    await tester.pumpAndSettle();
    expect(find.text('Add a photo of your NIDA card first.'), findsOneWidget);
  });

  testWidgets('Screen 9 LandlordProfileSetupScreen renders progress bar and setup actions', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: const LandlordProfileSetupScreen(userName: 'John'),
      ),
    );

    expect(find.text('Welcome, John 👋'), findsOneWidget);
    expect(find.text('Complete your profile'), findsOneWidget);
    expect(find.text('Add Profile Photo'), findsOneWidget);
    expect(find.text('Add Contact Details'), findsOneWidget);
    expect(find.text('Add Business Information'), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);
  });

  testWidgets('Screens 2, 3, 4 LandlordWelcomeScreen renders carousel and next transitions', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: const LandlordWelcomeScreen(),
      ),
    );

    // Slide 1
    expect(find.text('Manage your properties\nwith confidence'), findsOneWidget);
    expect(find.text('Next →'), findsOneWidget);

    // Tap Next
    await tester.tap(find.text('Next →'));
    await tester.pumpAndSettle();

    // Slide 2
    expect(find.text('Find, manage &\nexpand your portfolio'), findsOneWidget);

    // Tap Next
    await tester.tap(find.text('Next →'));
    await tester.pumpAndSettle();

    // Slide 3
    expect(find.text('Get paid,\nstay informed'), findsOneWidget);
    expect(find.text('Go to Dashboard'), findsOneWidget);
  });

  testWidgets('Screen 10 LandlordDashboardScreen greets by name, has the bell, and shows no made-up figures', (tester) async {
    tester.view.physicalSize = const Size(1080, 4200); // tall enough to lay the whole dashboard out
    tester.view.devicePixelRatio = 2.625;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      MaterialApp(
        theme: appTheme(),
        home: const LandlordDashboardScreen(userName: 'John'),
      ),
    );

    expect(find.textContaining(', John'), findsOneWidget); // Good morning / afternoon / evening / night, John
    expect(find.byIcon(Icons.notifications_none_rounded), findsOneWidget); // the bell
    expect(find.text('Rent you are asking each month'), findsOneWidget);
    expect(find.text('TSh 0'), findsOneWidget); // nothing listed: zero, not sample numbers
    expect(find.text('Add property'), findsOneWidget); // the quick actions
    expect(find.text('Waiting for you'), findsOneWidget);
    expect(find.text('Verify your business'), findsOneWidget);
    expect(find.text('Open repairs'), findsOneWidget);
    expect(find.text('Recent activity'), findsNothing); // notifications live behind the bell only
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Properties'), findsNWidgets(2)); // the tab and the overview tile
    expect(find.text('Tenants'), findsNWidgets(2));
  });
}
