import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'api.dart';
import 'appearance.dart';
import 'l10n.dart';
import 'live.dart';
import 'screens/auth.dart';
import 'screens/onboarding.dart';
import 'screens/owner/identity_verification.dart';
import 'screens/shell.dart';
import 'screens/splash.dart';
import 'ui.dart';

final navigator = GlobalKey<NavigatorState>();

/// Lets a live notification show its banner from anywhere, whatever screen is open.
final messenger = GlobalKey<ScaffoldMessengerState>();

/// False until the first-run tour is finished or skipped.
final onboarded = ValueNotifier<bool>(false);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting();
  await Api.init();
  await Appearance.load(); // light or dark, the person's accent colour and size
  onboarded.value = Api.seenOnboarding;
  Live.attach(); // notifications arrive while the app is open
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const PangaApp());
}

class PangaApp extends StatelessWidget {
  const PangaApp({super.key});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([lang, Appearance.look]),
    builder: (_, _) => MaterialApp(
      title: 'Panga na Kupangisha',
      debugShowCheckedModeBanner: false,
      navigatorKey: navigator,
      scaffoldMessengerKey: messenger,
      scrollBehavior: const AppScroll(), // an app, not a web page: no stretch when a list is pulled past its end
      theme: appTheme(),
      builder: fitToSize,
      locale: Locale(lang.value),
      supportedLocales: const [Locale('en'), Locale('sw')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: const _Root(),
    ),
  );
}

/// Splash (Screen 1) -> Tour -> Sign in -> (landlords: identity check) -> Shell
class _Root extends StatefulWidget {
  const _Root();

  @override
  State<_Root> createState() => _RootState();
}

class _RootState extends State<_Root> {
  bool _splashFinished = false;
  bool _hadUser = false;

  @override
  void initState() {
    super.initState();
    _hadUser = Api.user.value != null;
  }

  @override
  Widget build(BuildContext context) {
    if (!_splashFinished) {
      return SplashScreen(
        key: const ValueKey('splash_screen'),
        onFinished: () {
          if (mounted) setState(() => _splashFinished = true);
        },
      );
    }

    return ListenableBuilder(
      listenable: Listenable.merge([Api.user, onboarded]),
      builder: (context, _) {
        final user = Api.user.value;

        // Signing in or out: drop whatever was pushed on top (the sign-in form, a detail page).
        if (_hadUser != (user != null)) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            navigator.currentState?.popUntil((r) => r.isFirst);
          });
        }
        _hadUser = user != null;

        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 450),
          switchInCurve: Curves.easeOut,
          child: user != null
              ? (Api.needsIdentity
                    ? const IdentityGate(key: ValueKey('identity'))
                    : Shell(key: ValueKey('shell-${user['role']}')))
              : onboarded.value
              ? const AuthScreen(key: ValueKey('auth'))
              : const Onboarding(key: ValueKey('tour')),
        );
      },
    );
  }
}
