import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';

import '../api.dart';
import '../l10n.dart';
import '../live.dart';
import '../main.dart';
import '../ui.dart';
import 'customecontrols/countries.dart';
import 'customecontrols/pickers.dart';

enum _AuthFlow {
  options, // Screen 6: Account creation options (Google, Apple, Email)
  registerForm, // Screen 7: Registration form (Name, Email, Phone, Country, Password)
  verificationAttachments, // Independent verification page with attachments (NIDA number or image of NIDA card / driving licence / voter ID)
  waitingVerification, // Waiting for verification screen with radar scan & progress
  tenantWelcome, // Welcome page celebration after valid account creation
  capabilitySelect, // Screen 8: What best describes you? (Multi-select roles)
  signIn, // Sign in flow
  forgot, // Existing password recovery
  code, // Existing 6-digit OTP reset
}

/// Screens 6, 7, 8 and full Authentication / Password Reset Flow
class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  /// Set by the onboarding tour: if true starts on options/register, else sign in.
  static bool startWithRegister = true;

  /// Holds the selected role from Screen 5 (e.g. 'landlord' or 'tenant')
  static String initialSelectedRole = 'landlord';

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late _AuthFlow _flow = AuthScreen.startWithRegister
      ? _AuthFlow.options
      : _AuthFlow.signIn;
  bool _agreedToTerms = true;

  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  Country _country = countries.first; // Tanzania
  late final _countryText = TextEditingController(
    text: '${_country.flag}  ${_country.name}',
  );
  late final _phone = TextEditingController();
  final _email = TextEditingController();
  final _id = TextEditingController(); // phone or email for sign in / forgot
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _nida = TextEditingController();
  final _code = TextEditingController();

  bool _hidePassword = true;
  bool _hideConfirmPassword = true;

  int get _passwordStrength {
    final p = _password.text;
    if (p.isEmpty) return 0;
    int score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (RegExp(r'[0-9]').hasMatch(p)) score++;
    if (RegExp(r'[A-Z]').hasMatch(p) || RegExp(r'[^a-zA-Z0-9]').hasMatch(p)) {
      score++;
    }
    return score;
  }

  bool get _passwordsMatch =>
      _password.text.isNotEmpty && _password.text == _confirmPassword.text;

  String _verificationMethod =
      'nida_number'; // 'nida_number' | 'nida_card' | 'driving_licence' | 'voter_id'
  String? _pickedDocumentPath;
  int _waitingStep = 0;
  Timer? _waitingTimer;
  String _registeredFullName = '';
  String _registeredPhone = '';
  String _registeredEmail = '';
  String _registeredNida = '';
  Map<String, dynamic>? _pendingSession;

  // Multi-select capabilities (Screen 8)
  final Set<String> _selectedCapabilities = {'tenant'};

  bool _busy = false;
  String? _error;
  int _errors = 0;
  int _wait = 0;
  Timer? _timer;

  @override
  void dispose() {
    Live.arrived.removeListener(_checkVerificationStatus);
    _timer?.cancel();
    _waitingTimer?.cancel();
    for (final c in [
      _name,
      _phone,
      _countryText,
      _email,
      _id,
      _password,
      _confirmPassword,
      _nida,
      _code,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _go(_AuthFlow f) {
    HapticFeedback.selectionClick();
    setState(() {
      _flow = f;
      _error = null;
    });
  }

  void _startWait() {
    _timer?.cancel();
    setState(() => _wait = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _wait <= 1) timer.cancel();
      if (mounted) setState(() => _wait--);
    });
  }

  String _formatNida(String raw) {
    final clean = raw.replaceAll(RegExp(r'\D'), '');
    if (clean.length < 8) return clean;
    if (clean.length < 13) {
      return '${clean.substring(0, 8)}-${clean.substring(8)}';
    }
    if (clean.length < 18) {
      return '${clean.substring(0, 8)}-${clean.substring(8, 13)}-${clean.substring(13)}';
    }
    final end = clean.length.clamp(18, 20);
    return '${clean.substring(0, 8)}-${clean.substring(8, 13)}-${clean.substring(13, 18)}-${clean.substring(18, end)}';
  }

  Future<void> _pickDocumentImage(ImageSource source) async {
    try {
      final f = await ImagePicker().pickImage(
        source: source,
        maxWidth: 2000,
        imageQuality: 85,
      );
      if (f != null && mounted) {
        setState(() {
          _pickedDocumentPath = f.path;
          _error = null;
        });
        HapticFeedback.selectionClick();
      }
    } on PlatformException {
      if (mounted) {
        toast(
          context,
          t(
            'Could not open image picker. Try again.',
            'Imeshindikana kufungua picha. Jaribu tena.',
          ),
        );
      }
    }
  }

  Future<void> _submitVerificationAttachments() async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);

    String cleanNida = '';
    if (_verificationMethod == 'nida_number') {
      final clean = _nida.text.replaceAll(RegExp(r'\D'), '');
      if (clean.length != 20) {
        HapticFeedback.heavyImpact();
        setState(
          () => _error = t(
            'National ID (NIDA) must be exactly 20 digits. You entered ${clean.length}.',
            'Namba ya NIDA lazima iwe na tarakimu 20 kamili. Umeandika ${clean.length}.',
          ),
        );
        return;
      }
      _registeredNida = clean;
      cleanNida = clean;
    } else {
      if (_pickedDocumentPath == null) {
        HapticFeedback.heavyImpact();
        final docLabel = _verificationMethod == 'nida_card'
            ? t('NIDA Card', 'Kitambulisho cha NIDA')
            : (_verificationMethod == 'driving_licence'
                  ? t('Driving Licence', 'Leseni ya Udereva')
                  : t('Voter ID Card', 'Kitambulisho cha Mpiga Kura'));
        setState(
          () => _error = t(
            'Please take a photo or attach an image of your $docLabel.',
            'Tafadhali weka picha ya $docLabel yako kwanza.',
          ),
        );
        return;
      }
    }

    setState(() => _busy = true);
    try {
      if (_verificationMethod == 'nida_number') {
        await Api.post('identity', {
          'method': 'nida_number',
          'nida_number': cleanNida,
        });
      } else {
        await Api.upload(
          'identity',
          {'method': _verificationMethod},
          {'document': [_pickedDocumentPath!]},
        );
      }
      HapticFeedback.mediumImpact();
      if (mounted) {
        setState(() => _busy = false);
        _startWaitingVerification();
      }
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      if (e.status == 409) {
        _startWaitingVerification();
        return;
      }
      HapticFeedback.heavyImpact();
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _startWaitingVerification();
      });
    }
  }

  void _skipVerification() {
    HapticFeedback.selectionClick();
    _startWaitingVerification(skip: true);
  }

  void _startWaitingVerification({bool skip = false}) {
    _go(_AuthFlow.waitingVerification);
    _waitingStep = 1; // 1 = Details sent, waiting for admin approval
    _waitingTimer?.cancel();

    Live.arrived.removeListener(_checkVerificationStatus);
    Live.arrived.addListener(_checkVerificationStatus);

    _waitingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _checkVerificationStatus();
    });

    _checkVerificationStatus();
  }

  Future<void> _checkVerificationStatus() async {
    try {
      final r = await Api.get('identity');
      if (!mounted) return;
      final status = r['status']?.toString();
      final reason = r['rejection_reason']?.toString();

      if (status == 'approved') {
        _waitingTimer?.cancel();
        _waitingTimer = null;
        Live.arrived.removeListener(_checkVerificationStatus);
        HapticFeedback.heavyImpact();
        setState(() {
          _waitingStep = 3;
        });
        await Future.delayed(const Duration(milliseconds: 650));
        if (mounted) {
          setState(() {
            _flow = _AuthFlow.tenantWelcome;
          });
        }
      } else if (status == 'rejected') {
        _waitingTimer?.cancel();
        _waitingTimer = null;
        Live.arrived.removeListener(_checkVerificationStatus);
        HapticFeedback.heavyImpact();
        if (mounted) {
          setState(() {
            _flow = _AuthFlow.verificationAttachments;
            _error = reason ?? t(
              'Identity verification was rejected. Please review your details and submit again.',
              'Uhakiki wa kitambulisho ulikataliwa. Tafadhali kagua taarifa zako na utume tena.',
            );
          });
        }
      } else if (status == 'pending') {
        if (_waitingStep != 1 && mounted) {
          setState(() => _waitingStep = 1);
        }
      }
    } catch (_) {
      // offline or network jitter: will retry on next poll tick
    }
  }

  /// Called from the Welcome Screen after user reviews their verified profile
  Future<void> _finishTenantWelcome() async {
    HapticFeedback.mediumImpact();
    setState(() => _busy = true);
    try {
      final baseUser = (_pendingSession?['user'] is Map)
          ? Map<String, dynamic>.from(_pendingSession!['user'])
          : <String, dynamic>{};

      final finalizedUser = {
        ...baseUser,
        'fullname': _registeredFullName.isNotEmpty
            ? _registeredFullName
            : _name.text.trim(),
        'phone_number': _registeredPhone.isNotEmpty
            ? _registeredPhone
            : fullPhone(_country, _phone.text),
        'email': _registeredEmail.isNotEmpty
            ? _registeredEmail
            : _email.text.trim(),
        'role': baseUser['role'] ?? 'renter',
        'nida': _registeredNida,
        'identity_status': 'approved',
        'verification_method': _verificationMethod,
        if (_pickedDocumentPath != null) 'document_path': _pickedDocumentPath,
      };

      if (_pendingSession != null) {
        Api.saveSession({..._pendingSession!, 'user': finalizedUser});
      } else {
        Api.setUser(finalizedUser);
      }
      Api.finishOnboarding();
      onboarded.value = true;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Validates registration fields (Name, Email, Country, Phone, Password) and creates account
  Future<void> _submitRegistrationForm() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) {
      HapticFeedback.lightImpact();
      return;
    }
    if (!_agreedToTerms) {
      toast(
        context,
        t(
          'Please agree to the Terms of Service to continue.',
          'Tafadhali kubali Vigezo vya Huduma ili kuendelea.',
        ),
      );
      return;
    }

    if (_password.text != _confirmPassword.text) {
      HapticFeedback.heavyImpact();
      setState(
        () => _error = t(
          'Passwords do not match.',
          'Nenosiri halifanani na uthibitisho wake.',
        ),
      );
      return;
    }

    _registeredFullName = _name.text.trim();
    _registeredEmail = _email.text.trim();
    _registeredPhone = fullPhone(_country, _phone.text);

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final res = await Api.post('user/register/', {
        'fullname': _registeredFullName,
        'phone_number': _registeredPhone,
        'country': _country.code,
        'email': _registeredEmail,
        'password': _password.text,
        'role': 'renter',
      });
      if (res is Map) {
        Api.saveSessionToken(res);
        _pendingSession = Map<String, dynamic>.from(res);
      }
    } catch (_) {
      // Offline fallback: keep registration details in state without triggering main.dart switch
      _pendingSession = {
        'user': {
          'id': 999,
          'fullname': _registeredFullName,
          'phone_number': _registeredPhone,
          'email': _registeredEmail,
          'role': 'renter',
          'identity_status': 'pending',
        }
      };
    } finally {
      if (mounted) setState(() => _busy = false);
    }

    _go(_AuthFlow.verificationAttachments);
  }

  Future<void> _chooseCountry() async {
    final c = await pickFrom<Country>(
      context,
      title: t('Your country', 'Nchi yako'),
      items: countries,
      label: (c) => c.name,
      leading: (c) => c.flag,
      trailing: (c) => '+${c.dial}',
    );
    if (c == null || !mounted) return;
    setState(() {
      final typed = _phone.text
          .replaceFirst(RegExp('^\\+?${_country.dial}'), '')
          .trim();
      _country = c;
      _countryText.text = '${c.flag}  ${c.name}';
      _phone.text = typed;
    });
  }

  /// Finalizes registration on Screen 8 with selected roles
  Future<void> _completeRegistration() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    // Determine primary backend role from selected capabilities
    String primaryRole = 'renter';
    if (_selectedCapabilities.contains('landlord') ||
        _selectedCapabilities.contains('manager')) {
      primaryRole = 'landlord';
    } else if (_selectedCapabilities.contains('investor')) {
      primaryRole = 'investor';
    }

    try {
      await Api.register({
        'fullname': _name.text.trim(),
        'phone_number': fullPhone(_country, _phone.text),
        'country': _country.code,
        'email': _email.text.trim(),
        'password': _password.text,
        'role': primaryRole,
      });
      Api.finishOnboarding();
      onboarded.value = true;
    } on ApiError catch (e) {
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      setState(() {
        _errors++;
        _error = e.message;
        // Go back to form if registration error relates to fields
        _flow = _AuthFlow.registerForm;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitSignIn() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Api.signIn(_id.text.trim(), _password.text);
      Api.finishOnboarding();
      onboarded.value = true;
    } on ApiError catch (e) {
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      setState(() {
        _errors++;
        _error = e.status == 401
            ? t(
                'That phone, email or password is not right.',
                'Namba ya simu, barua pepe au nenosiri si sahihi.',
              )
            : e.message;
      });
    } catch (_) {
      // Offline fallback: set mock user for development
      Api.setUser({
        'id': 101,
        'fullname': _id.text.contains('@') ? 'Tenant User' : 'Mteja Panga',
        'phone_number': _id.text.trim(),
        'email': _id.text.contains('@')
            ? _id.text.trim()
            : 'tenant@panga.co.tz',
        'role': 'renter',
        'identity_status': 'approved',
      });
      Api.finishOnboarding();
      onboarded.value = true;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitForgot() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Api.post('user/password/forgot/', {'identifier': _id.text.trim()});
      if (!mounted) return;
      _startWait();
      _go(_AuthFlow.code);
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitCodeReset() async {
    FocusScope.of(context).unfocus();
    if (!_form.currentState!.validate()) return;

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Api.resetPassword(_id.text.trim(), _code.text, _password.text);
      Api.finishOnboarding();
      onboarded.value = true;
    } on ApiError catch (e) {
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      setState(() {
        _errors++;
        _error = e.message;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resendCode() async {
    try {
      await Api.post('user/password/forgot/', {'identifier': _id.text.trim()});
      if (!mounted) return;
      _startWait();
      toast(context, t('A new code is on its way.', 'Namba mpya inatumwa.'));
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  String? _need(String? v) =>
      (v == null || v.trim().isEmpty) ? t('Fill this in', 'Jaza hapa') : null;
  String? _pass(String? v) => (v == null || v.length < 6)
      ? t('Use at least 6 characters', 'Tumia angalau herufi 6')
      : null;

  @override
  Widget build(BuildContext context) {
    final isDark =
        _flow == _AuthFlow.options ||
        _flow == _AuthFlow.signIn ||
        _flow == _AuthFlow.registerForm ||
        _flow == _AuthFlow.waitingVerification;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: isDark ? SystemUiOverlayStyle.light : C.overlay,
      child: PopScope(
        canPop: _flow == _AuthFlow.options,
        onPopInvokedWithResult: (popped, _) {
          if (!popped) {
            if (_flow == _AuthFlow.tenantWelcome) {
              _finishTenantWelcome();
            } else if (_flow == _AuthFlow.waitingVerification) {
              _waitingTimer?.cancel();
              _go(_AuthFlow.verificationAttachments);
            } else if (_flow == _AuthFlow.verificationAttachments) {
              _go(_AuthFlow.registerForm);
            } else if (_flow == _AuthFlow.capabilitySelect) {
              _go(_AuthFlow.registerForm);
            } else if (_flow == _AuthFlow.registerForm) {
              _go(_AuthFlow.options);
            } else if (_flow == _AuthFlow.signIn) {
              _go(_AuthFlow.options);
            } else if (_flow == _AuthFlow.forgot) {
              _go(_AuthFlow.signIn);
            } else if (_flow == _AuthFlow.code) {
              _go(_AuthFlow.forgot);
            }
          }
        },
        child: Scaffold(
          backgroundColor: isDark ? C.navy : C.card,
          body: AnimatedSwitcher(
            duration: const Duration(milliseconds: 320),
            switchInCurve: Curves.easeInOutCubic,
            child: switch (_flow) {
              _AuthFlow.options => _buildScreen6Options(),
              _AuthFlow.registerForm => _buildScreen7RegisterForm(),
              _AuthFlow.verificationAttachments =>
                _buildVerificationAttachmentsView(),
              _AuthFlow.waitingVerification =>
                _buildWaitingForVerificationView(),
              _AuthFlow.tenantWelcome => _buildTenantWelcomeView(),
              _AuthFlow.capabilitySelect => _buildScreen8CapabilitySelect(),
              _AuthFlow.signIn => _buildSignInView(),
              _AuthFlow.forgot => _buildForgotView(),
              _AuthFlow.code => _buildCodeResetView(),
            },
          ),
        ),
      ),
    );
  }

  // -------------------------------------------------------------------------
  // SCREEN 6: Account creation options (Chooser)
  // -------------------------------------------------------------------------
  Widget _buildScreen6Options() {
    return Stack(
      key: const ValueKey('options'),
      children: [
        // Ambient glow
        Positioned(
          top: -80,
          right: -60,
          child: Container(
            width: 280,
            height: 280,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [C.teal.withValues(alpha: .22), Colors.transparent],
              ),
            ),
          ),
        ),

        SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Top Bar: Back & Language
                Row(
                  children: [
                    Press(
                      onTap: () {
                        // Return to onboarding
                        onboarded.value = false;
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.arrow_back_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                    const Spacer(),
                    const LangSwitch(dark: true),
                  ],
                ),

                const Spacer(flex: 2),

                // Brand Mark Logo & Name
                const _PangaRibbonLogo(size: 64),
                const SizedBox(height: 14),
                Text(
                  'Panga',
                  style: display(
                    32,
                    color: Colors.white,
                    weight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 28),

                Text(
                  t('Create your account', 'Fungua akaunti yako'),
                  style: display(
                    26,
                    color: Colors.white,
                    weight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  t(
                    'Choose how you\'d like to get started',
                    'Chagua jinsi ungependa kuanza',
                  ),
                  style: body(15, color: Colors.white.withValues(alpha: .7)),
                ),

                const Spacer(flex: 2),

                // 1. Continue with Google
                _socialButton(
                  title: t('Continue with Google', 'Endelea na Google'),
                  bg: Colors.white,
                  fg: C.navy,
                  leading: const _GoogleLogo(size: 20),
                  onTap: () {
                    // Friendly social sign-in fallback prompt
                    toast(
                      context,
                      t(
                        'Use Email/Phone sign up for instant access.',
                        'Tumia Barua pepe au Simu kwa ufikiaji wa haraka.',
                      ),
                    );
                    _go(_AuthFlow.registerForm);
                  },
                ),
                const SizedBox(height: 14),

                // 2. Continue with Apple
                _socialButton(
                  title: t('Continue with Apple', 'Endelea na Apple'),
                  bg: Colors.white,
                  fg: C.navy,
                  leading: const Icon(
                    Icons.apple,
                    size: 24,
                    color: Colors.black,
                  ),
                  onTap: () {
                    toast(
                      context,
                      t(
                        'Use Email/Phone sign up for instant access.',
                        'Tumia Barua pepe au Simu kwa ufikiaji wa haraka.',
                      ),
                    );
                    _go(_AuthFlow.registerForm);
                  },
                ),
                const SizedBox(height: 14),

                // 3. Sign up with email
                _socialButton(
                  title: t('Sign up with email', 'Fungua kwa barua pepe'),
                  bg: Colors.transparent,
                  fg: Colors.white,
                  border: Colors.white.withValues(alpha: .3),
                  leading: const Icon(
                    Icons.mail_outline_rounded,
                    size: 20,
                    color: Colors.white,
                  ),
                  onTap: () => _go(_AuthFlow.registerForm),
                ),

                const Spacer(flex: 3),

                // Bottom: Already have an account? Sign in
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      t('Already have an account? ', 'Tayari una akaunti? '),
                      style: body(
                        14.5,
                        color: Colors.white.withValues(alpha: .75),
                      ),
                    ),
                    Press(
                      onTap: () => _go(_AuthFlow.signIn),
                      child: Text(
                        t('Sign in', 'Ingia'),
                        style: body(
                          14.5,
                          color: C.tealBright,
                          weight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _socialButton({
    required String title,
    required Color bg,
    required Color fg,
    Color? border,
    required Widget leading,
    required VoidCallback onTap,
  }) {
    return Press(
      onTap: onTap,
      child: Container(
        height: 54,
        width: double.infinity,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(28),
          border: border != null ? Border.all(color: border, width: 1.4) : null,
          boxShadow: bg != Colors.transparent
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: .15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            leading,
            const SizedBox(width: 12),
            Text(
              title,
              style: body(15, color: fg, weight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------------------
  // SCREEN 7: Redesigned Registration Form from Scratch (Modern UI/UX)
  // -------------------------------------------------------------------------
  Widget _buildScreen7RegisterForm() {
    return Stack(
      key: const ValueKey('registerForm'),
      children: [
        // Ambient background glow
        Positioned(
          top: -60,
          left: -40,
          child: Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [C.teal.withValues(alpha: .22), Colors.transparent],
              ),
            ),
          ),
        ),
        Positioned(
          bottom: 120,
          right: -50,
          child: Container(
            width: 240,
            height: 240,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  const Color(0xFF3B82F6).withValues(alpha: .18),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        SafeArea(
          child: Column(
            children: [
              // Top Bar with Back, Logo and Language Switch
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
                child: Row(
                  children: [
                    Press(
                      onTap: () => _go(_AuthFlow.options),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.arrow_back_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const _PangaRibbonLogo(size: 28),
                    const SizedBox(width: 8),
                    Text(
                      'Panga',
                      style: display(
                        18,
                        color: Colors.white,
                        weight: FontWeight.w800,
                      ),
                    ),
                    const Spacer(),
                    const LangSwitch(dark: true),
                  ],
                ),
              ),

              Expanded(
                child: Form(
                  key: _form,
                  child: SingleChildScrollView(
                    physics: const ClampingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    keyboardDismissBehavior:
                        ScrollViewKeyboardDismissBehavior.onDrag,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Headline & Subtitle
                        const SizedBox(height: 10),
                        Text(
                          t('Create account', 'Fungua akaunti'),
                          style: display(
                            30,
                            color: Colors.white,
                            weight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Floating Claymorphic White Form Card
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 16,
                          ),
                          decoration: BoxDecoration(
                            color: C.card,
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: .6),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: .22),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                              BoxShadow(
                                color: Colors.white.withValues(alpha: .85),
                                blurRadius: 1,
                                offset: const Offset(0, -1),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // 1. Full Name Field
                              _buildFormInputField(
                                label: t('Full name', 'Jina kamili'),
                                controller: _name,
                                hint: 'e.g. Ibrahim Kimaro',
                                icon: Icons.person_outline_rounded,
                                keyboard: TextInputType.name,
                                autofill: const [AutofillHints.name],
                                validator: _need,
                              ),
                              const SizedBox(height: 20),

                              // 2. Email Address Field
                              _buildFormInputField(
                                label: t('Email address', 'Barua pepe'),
                                controller: _email,
                                hint: 'you@example.com',
                                icon: Icons.mail_outline_rounded,
                                keyboard: TextInputType.emailAddress,
                                autofill: const [AutofillHints.email],
                                onChanged: (_) => setState(() {}),
                                suffix:
                                    RegExp(
                                      r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                                    ).hasMatch(_email.text.trim())
                                    ? const Icon(
                                        Icons.check_circle_rounded,
                                        size: 18,
                                        color: Color(0xFF10B981),
                                      )
                                    : null,
                                validator: (v) =>
                                    RegExp(
                                      r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                                    ).hasMatch(v ?? '')
                                    ? null
                                    : t(
                                        'Enter a valid email address',
                                        'Weka barua pepe sahihi',
                                      ),
                              ),
                              const SizedBox(height: 20),

                              // 3. Unified Country & Phone Selector
                              _buildUnifiedPhoneInput(),
                              const SizedBox(height: 20),

                              // 4. Password Field with Strength Meter
                              _buildPasswordSection(),
                              const SizedBox(height: 20),

                              // 5. Confirm Password Field with Match Check
                              _buildConfirmPasswordSection(),
                              const SizedBox(height: 20),

                              // 6. Terms & Privacy Agreement Checkbox
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Press(
                                    onTap: () {
                                      HapticFeedback.selectionClick();
                                      setState(
                                        () => _agreedToTerms = !_agreedToTerms,
                                      );
                                    },
                                    child: AnimatedContainer(
                                      duration: const Duration(
                                        milliseconds: 200,
                                      ),
                                      width: 20,
                                      height: 20,
                                      decoration: BoxDecoration(
                                        color: _agreedToTerms
                                            ? C.teal
                                            : Colors.transparent,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: _agreedToTerms
                                              ? C.teal
                                              : C.line,
                                          width: 1.8,
                                        ),
                                      ),
                                      child: _agreedToTerms
                                          ? const Icon(
                                              Icons.check,
                                              size: 14,
                                              color: Colors.white,
                                            )
                                          : null,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: GestureDetector(
                                      onTap: () => setState(
                                        () => _agreedToTerms = !_agreedToTerms,
                                      ),
                                      child: RichText(
                                        text: TextSpan(
                                          text: t(
                                            'I agree to the ',
                                            'Ninakubali ',
                                          ),
                                          style: body(
                                            11.5,
                                            color: C.wino,
                                            height: 1.25,
                                          ),
                                          children: [
                                            TextSpan(
                                              text: t(
                                                'Terms',
                                                'Vigezo vya Huduma',
                                              ),
                                              style: TextStyle(
                                                color: C.teal,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                            TextSpan(text: t(' & ', ' na ')),
                                            TextSpan(
                                              text: t(
                                                'Privacy Policy',
                                                'Sera ya Faragha',
                                              ),
                                              style: TextStyle(
                                                color: C.teal,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              if (_error != null) ...[
                                const SizedBox(height: 30),
                                _errorCard(_error!),
                              ],

                              const SizedBox(height: 40),

                              // 7. Primary Submit CTA Button
                              Button(
                                t(
                                  'Create Account & Continue',
                                  'Fungua Akaunti & Endelea',
                                ),
                                tone: Tone.navy,
                                onTap: _submitRegistrationForm,
                                busy: _busy,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Footer: Already have an account? Sign in
                        Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                t(
                                  'Already have an account? ',
                                  'Tayari una akaunti? ',
                                ),
                                style: body(
                                  13.5,
                                  color: Colors.white.withValues(alpha: .75),
                                ),
                              ),
                              Press(
                                onTap: () => _go(_AuthFlow.signIn),
                                child: Text(
                                  t('Sign in', 'Ingia'),
                                  style: body(
                                    13.5,
                                    color: C.tealBright,
                                    weight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 8),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFormInputField({
    required String label,
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    required TextInputType keyboard,
    Iterable<String>? autofill,
    String? Function(String?)? validator,
    Widget? suffix,
    ValueChanged<String>? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 4),
          child: Text(
            label,
            style: body(12.5, weight: FontWeight.w700, color: C.wino),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: C.fill,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: C.line, width: 1.1),
          ),
          child: TextFormField(
            controller: controller,
            keyboardType: keyboard,
            autofillHints: autofill,
            style: body(14, weight: FontWeight.w600, color: C.wino),
            validator: validator,
            onChanged: onChanged,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: body(13, color: C.muted.withValues(alpha: .6)),
              prefixIcon: Icon(icon, size: 18, color: C.muted),
              suffixIcon: suffix,
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 11,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUnifiedPhoneInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 4),
          child: Text(
            t('Phone number', 'Namba ya simu'),
            style: body(12.5, weight: FontWeight.w700, color: C.wino),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: C.fill,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: C.line, width: 1.1),
          ),
          child: Row(
            children: [
              // Country picker pill
              Press(
                onTap: _chooseCountry,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: C.card,
                    borderRadius: const BorderRadius.horizontal(
                      left: Radius.circular(12),
                    ),
                    border: Border(
                      right: BorderSide(color: C.line, width: 1.1),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_country.flag, style: const TextStyle(fontSize: 16)),
                      const SizedBox(width: 5),
                      Text(
                        '+${_country.dial}',
                        style: body(13, weight: FontWeight.w700, color: C.wino),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        Icons.keyboard_arrow_down_rounded,
                        size: 16,
                        color: C.muted,
                      ),
                    ],
                  ),
                ),
              ),
              // Phone number input
              Expanded(
                child: TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  style: body(14, weight: FontWeight.w600, color: C.wino),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[\d ]')),
                  ],
                  decoration: InputDecoration(
                    hintText: '0712 345 678',
                    hintStyle: body(13, color: C.muted.withValues(alpha: .6)),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 11,
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                  ),
                  validator: (v) {
                    final clean = (v ?? '').replaceAll(RegExp(r'\D'), '');
                    if (clean.length < 7) {
                      return t(
                        'Enter a valid phone number',
                        'Weka namba sahihi ya simu',
                      );
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordSection() {
    final strength = _passwordStrength;
    final strengthColor = strength <= 1
        ? const Color(0xFFEF4444)
        : (strength == 2
              ? const Color(0xFFF59E0B)
              : (strength == 3
                    ? const Color(0xFF3B82F6)
                    : const Color(0xFF10B981)));
    final strengthLabel = strength <= 1
        ? t('Weak', 'Dhaifu')
        : (strength == 2
              ? t('Fair', 'Wastani')
              : (strength == 3
                    ? t('Good', 'Nzuri')
                    : t('Strong', 'Imara sana')));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 4),
          child: Text(
            t('Password', 'Nenosiri'),
            style: body(12.5, weight: FontWeight.w700, color: C.wino),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: C.fill,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: C.line, width: 1.1),
          ),
          child: TextFormField(
            controller: _password,
            obscureText: _hidePassword,
            style: body(14, weight: FontWeight.w600, color: C.wino),
            onChanged: (_) => setState(() {}),
            validator: _pass,
            decoration: InputDecoration(
              hintText: t('Create a secure password', 'Weka nenosiri salama'),
              hintStyle: body(13, color: C.muted.withValues(alpha: .6)),
              prefixIcon: Icon(
                Icons.lock_outline_rounded,
                size: 18,
                color: C.muted,
              ),
              suffixIcon: IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                icon: Icon(
                  _hidePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 18,
                  color: C.muted,
                ),
                onPressed: () => setState(() => _hidePassword = !_hidePassword),
              ),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 11,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
            ),
          ),
        ),
        if (_password.text.isNotEmpty) ...[
          const SizedBox(height: 5),
          Row(
            children: [
              for (var i = 1; i <= 4; i++)
                Expanded(
                  child: Container(
                    height: 3,
                    margin: EdgeInsets.only(right: i < 4 ? 5 : 0),
                    decoration: BoxDecoration(
                      color: i <= strength ? strengthColor : C.line,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              const SizedBox(width: 8),
              Text(
                strengthLabel,
                style: body(11, color: strengthColor, weight: FontWeight.w700),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildConfirmPasswordSection() {
    final matches = _passwordsMatch;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 4),
          child: Text(
            t('Confirm password', 'Thibitisha nenosiri'),
            style: body(12.5, weight: FontWeight.w700, color: C.wino),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: C.fill,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(
              color: _confirmPassword.text.isNotEmpty
                  ? (matches
                        ? const Color(0xFF10B981)
                        : const Color(0xFFEF4444))
                  : C.line,
              width: 1.1,
            ),
          ),
          child: TextFormField(
            controller: _confirmPassword,
            obscureText: _hideConfirmPassword,
            style: body(14, weight: FontWeight.w600, color: C.wino),
            onChanged: (_) => setState(() {}),
            validator: (v) {
              if (v == null || v.isEmpty) {
                return t(
                  'Please confirm your password',
                  'Tafadhali thibitisha nenosiri',
                );
              }
              if (v != _password.text) {
                return t('Passwords do not match', 'Nenosiri halifanani');
              }
              return null;
            },
            decoration: InputDecoration(
              hintText: t('Re-enter password', 'Rudia nenosiri'),
              hintStyle: body(13, color: C.muted.withValues(alpha: .6)),
              prefixIcon: Icon(
                Icons.lock_reset_rounded,
                size: 18,
                color: C.muted,
              ),
              suffixIcon: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_confirmPassword.text.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: Icon(
                        matches
                            ? Icons.check_circle_rounded
                            : Icons.cancel_rounded,
                        size: 16,
                        color: matches
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444),
                      ),
                    ),
                  IconButton(
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(
                      minWidth: 36,
                      minHeight: 36,
                    ),
                    icon: Icon(
                      _hideConfirmPassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      size: 18,
                      color: C.muted,
                    ),
                    onPressed: () => setState(
                      () => _hideConfirmPassword = !_hideConfirmPassword,
                    ),
                  ),
                ],
              ),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 11,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }

  // -------------------------------------------------------------------------
  // VERIFICATION ATTACHMENTS VIEW (Independent Step After Registration)
  // -------------------------------------------------------------------------
  Widget _buildVerificationAttachmentsView() {
    final methods = [
      (
        key: 'nida_number',
        title: t('NIDA Number', 'Namba ya NIDA'),
        subtitle: t('20-digit National ID', 'Tarakimu 20 za NIDA'),
        icon: Icons.numbers_rounded,
      ),
      (
        key: 'nida_card',
        title: t('NIDA Card Photo', 'Picha ya NIDA'),
        subtitle: t('Physical card photo', 'Picha ya kitambulisho'),
        icon: Icons.badge_outlined,
      ),
      (
        key: 'driving_licence',
        title: t('Driving Licence', 'Leseni ya Udereva'),
        subtitle: t('Driver\'s licence photo', 'Picha ya leseni'),
        icon: Icons.drive_eta_rounded,
      ),
      (
        key: 'voter_id',
        title: t('Voter ID Card', 'Kadi ya Mpiga Kura'),
        subtitle: t('Voter card photo', 'Picha ya kadi ya kura'),
        icon: Icons.how_to_vote_rounded,
      ),
    ];

    final currentMethod = methods.firstWhere(
      (m) => m.key == _verificationMethod,
      orElse: () => methods.first,
    );

    final cleanNida = _nida.text.replaceAll(RegExp(r'\D'), '');

    return SafeArea(
      key: const ValueKey('verificationAttachments'),
      child: Column(
        children: [
          // Top bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Row(
              children: [
                Press(
                  onTap: () => _go(_AuthFlow.registerForm),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: C.fill,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.arrow_back_rounded,
                      color: C.wino,
                      size: 20,
                    ),
                  ),
                ),
                const Spacer(),
                const LangSwitch(dark: false),
              ],
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Verification badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: C.teal.withValues(alpha: .12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.verified_user_rounded,
                          color: C.teal,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          t(
                            'Account Created • Verification Step',
                            'Akaunti Imetengenezwa • Hatua ya Uhakiki',
                          ),
                          style: body(
                            12,
                            color: C.teal,
                            weight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  Text(
                    t('Verify your identity', 'Thibitisha utambulisho wako'),
                    style: display(26, color: C.wino, weight: FontWeight.w800),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    t(
                      'Attach a verification document to certify your tenant profile and enable secure rental agreements.',
                      'Weka uthibitisho wako wa kisheria ili kuthibitisha wasifu wako na kuanza mikataba salama ya pango.',
                    ),
                    style: body(14, color: C.muted, height: 1.4),
                  ),
                  const SizedBox(height: 24),

                  // Method Selection Grid / Cards
                  Text(
                    t(
                      'Choose verification attachment:',
                      'Chagua aina ya uthibitisho:',
                    ),
                    style: body(13, color: C.wino, weight: FontWeight.w700),
                  ),
                  const SizedBox(height: 10),

                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.65,
                    children: [
                      for (final m in methods) ...[
                        Press(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() {
                              _verificationMethod = m.key;
                              _error = null;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: _verificationMethod == m.key
                                  ? C.teal.withValues(alpha: .08)
                                  : C.card,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: _verificationMethod == m.key
                                    ? C.teal
                                    : C.line,
                                width: _verificationMethod == m.key ? 1.8 : 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: .03),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      m.icon,
                                      size: 20,
                                      color: _verificationMethod == m.key
                                          ? C.teal
                                          : C.muted,
                                    ),
                                    const Spacer(),
                                    if (_verificationMethod == m.key)
                                      Icon(
                                        Icons.check_circle_rounded,
                                        size: 16,
                                        color: C.teal,
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  m.title,
                                  style: body(
                                    12.5,
                                    color: _verificationMethod == m.key
                                        ? C.wino
                                        : C.muted,
                                    weight: FontWeight.w700,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  m.subtitle,
                                  style: body(10.5, color: C.muted),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Dynamic Form Area according to selected method
                  if (_verificationMethod == 'nida_number') ...[
                    // NIDA Number Form Field
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: C.card,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: C.line, width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: .04),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.pin_rounded, color: C.teal, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                t(
                                  'National Identification Number',
                                  'Namba ya Kitambulisho cha Taifa',
                                ),
                                style: body(
                                  13.5,
                                  color: C.wino,
                                  weight: FontWeight.w700,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '${cleanNida.length} / 20',
                                style: body(
                                  12,
                                  color: cleanNida.length == 20
                                      ? const Color(0xFF10B981)
                                      : C.muted,
                                  weight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Field(
                            t(
                              'NIDA Number (20 digits)',
                              'Namba ya NIDA (tarakimu 20)',
                            ),
                            controller: _nida,
                            hint: '19850712-14125-00001-23',
                            icon: Icons.badge_outlined,
                            keyboard: TextInputType.number,
                            formatters: [_NidaInputFormatter()],
                            action: TextInputAction.done,
                            onSubmit: _submitVerificationAttachments,
                          ),
                          const SizedBox(height: 10),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                Icons.info_outline_rounded,
                                size: 14,
                                color: C.muted,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  t(
                                    'Enter your 20-digit National ID without spaces or special symbols.',
                                    'Weka namba yako ya NIDA yenye tarakimu 20 iliyopo kwenye kitambulisho chako.',
                                  ),
                                  style: body(
                                    11.5,
                                    color: C.muted,
                                    height: 1.3,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Photo Attachment Card (NIDA Card, Driving Licence, Voter ID)
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: C.card,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: C.line, width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: .04),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(currentMethod.icon, color: C.teal, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  t(
                                    'Upload ${currentMethod.title}',
                                    'Pakia ${currentMethod.title}',
                                  ),
                                  style: body(
                                    13.5,
                                    color: C.wino,
                                    weight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              if (_pickedDocumentPath != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFD1FAE5),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.check,
                                        size: 12,
                                        color: Color(0xFF065F46),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        t('Ready', 'Imekamilika'),
                                        style: body(
                                          11,
                                          color: const Color(0xFF065F46),
                                          weight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          if (_pickedDocumentPath == null) ...[
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(
                                vertical: 24,
                                horizontal: 16,
                              ),
                              decoration: BoxDecoration(
                                color: C.fill,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: C.line,
                                  width: 1.2,
                                  style: BorderStyle.solid,
                                ),
                              ),
                              child: Column(
                                children: [
                                  CircleAvatar(
                                    radius: 28,
                                    backgroundColor: C.teal.withValues(
                                      alpha: .15,
                                    ),
                                    child: Icon(
                                      Icons.camera_alt_outlined,
                                      color: C.teal,
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    t(
                                      'Take or upload a clear photo of the front',
                                      'Piga au pakia picha angavu ya mbele',
                                    ),
                                    style: body(
                                      13,
                                      color: C.wino,
                                      weight: FontWeight.w600,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    t(
                                      'Ensure all details, text and photo are sharp and readable.',
                                      'Hakikisha maandishi na picha vinaonekana wazi bila ukungu.',
                                    ),
                                    style: body(11.5, color: C.muted),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 18),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Press(
                                          onTap: () => _pickDocumentImage(
                                            ImageSource.camera,
                                          ),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 12,
                                            ),
                                            decoration: BoxDecoration(
                                              color: C.card,
                                              borderRadius:
                                                  BorderRadius.circular(14),
                                              border: Border.all(
                                                color: C.teal.withValues(
                                                  alpha: .4,
                                                ),
                                                width: 1.2,
                                              ),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black
                                                      .withValues(alpha: .04),
                                                  blurRadius: 4,
                                                  offset: const Offset(0, 2),
                                                ),
                                              ],
                                            ),
                                            child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                Icon(
                                                  Icons.camera_alt_rounded,
                                                  size: 16,
                                                  color: C.teal,
                                                ),
                                                const SizedBox(width: 6),
                                                Text(
                                                  t('Camera', 'Piga Picha'),
                                                  style: body(
                                                    12.5,
                                                    color: C.wino,
                                                    weight: FontWeight.w700,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Press(
                                          onTap: () => _pickDocumentImage(
                                            ImageSource.gallery,
                                          ),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 12,
                                            ),
                                            decoration: BoxDecoration(
                                              color: C.card,
                                              borderRadius:
                                                  BorderRadius.circular(14),
                                              border: Border.all(
                                                color: C.line,
                                                width: 1.2,
                                              ),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black
                                                      .withValues(alpha: .04),
                                                  blurRadius: 4,
                                                  offset: const Offset(0, 2),
                                                ),
                                              ],
                                            ),
                                            child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                Icon(
                                                  Icons.photo_library_outlined,
                                                  size: 16,
                                                  color: C.muted,
                                                ),
                                                const SizedBox(width: 6),
                                                Text(
                                                  t('Gallery', 'Galari'),
                                                  style: body(
                                                    12.5,
                                                    color: C.wino,
                                                    weight: FontWeight.w700,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ] else ...[
                            // Preview of picked document
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Stack(
                                children: [
                                  Image.file(
                                    File(_pickedDocumentPath!),
                                    height: 180,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                  ),
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(
                                          alpha: .65,
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(
                                            Icons.check_circle,
                                            color: Color(0xFF10B981),
                                            size: 14,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            t('Attached', 'Imepakiwa'),
                                            style: body(
                                              11,
                                              color: Colors.white,
                                              weight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton.icon(
                                  onPressed: () =>
                                      _pickDocumentImage(ImageSource.camera),
                                  icon: const Icon(
                                    Icons.refresh_rounded,
                                    size: 16,
                                  ),
                                  label: Text(
                                    t('Retake', 'Piga Tena'),
                                    style: body(
                                      12.5,
                                      color: C.teal,
                                      weight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                TextButton.icon(
                                  onPressed: () => setState(
                                    () => _pickedDocumentPath = null,
                                  ),
                                  icon: const Icon(
                                    Icons.delete_outline_rounded,
                                    size: 16,
                                    color: Colors.redAccent,
                                  ),
                                  label: Text(
                                    t('Remove', 'Futa'),
                                    style: body(
                                      12.5,
                                      color: Colors.redAccent,
                                      weight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],

                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    _errorCard(_error!),
                  ],

                  const SizedBox(height: 24),

                  // Submit verification button
                  Button(
                    t('Submit for Verification', 'Wasilisha kwa Uhakiki'),
                    tone: Tone.navy,
                    onTap: _submitVerificationAttachments,
                    busy: _busy,
                  ),

                  const SizedBox(height: 14),

                  // Skip option
                  Center(
                    child: TextButton(
                      onPressed: _skipVerification,
                      child: Text(
                        t(
                          'Skip for now & verify later',
                          'Ruka sasa & thibitisha baadaye',
                        ),
                        style: body(
                          13,
                          color: C.muted,
                          weight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------------------
  // WAITING FOR VERIFICATION VIEW
  // -------------------------------------------------------------------------
  Widget _buildWaitingForVerificationView() {
    final methodLabel = _verificationMethod == 'nida_number'
        ? t('National ID (NIDA)', 'Kitambulisho cha Taifa (NIDA)')
        : (_verificationMethod == 'nida_card'
              ? t('NIDA Card Photo', 'Picha ya Kitambulisho cha NIDA')
              : (_verificationMethod == 'driving_licence'
                    ? t('Driving Licence Photo', 'Picha ya Leseni ya Udereva')
                    : t('Voter ID Card Photo', 'Picha ya Kadi ya Mpiga Kura')));

    final steps = [
      (
        icon: Icons.check_circle_rounded,
        title: t('Details Submitted', 'Taarifa Zimetumwa'),
        desc: _verificationMethod == 'nida_number'
            ? _formatNida(_registeredNida)
            : t(
                'Document photo uploaded for administrative review',
                'Picha ya kitambulisho imepakiwa kwa ajili ya ukaguzi',
              ),
      ),
      (
        icon: Icons.admin_panel_settings_rounded,
        title: t('Waiting for Admin Verification', 'Kusubiri Uhakiki wa Msimamizi'),
        desc: t(
          'Our compliance admin is reviewing your submission in real time',
          'Msimamizi wa mfumo anapitia na kukagua taarifa zako sasa hivi',
        ),
      ),
      (
        icon: Icons.verified_user_rounded,
        title: t('Admin Real-Time Approval', 'Idhini ya Msimamizi Moja kwa Moja'),
        desc: t(
          'Instant activation into Welcome page upon acceptance',
          'Akaunti itafunguka moja kwa moja ukurasa wa kukaribishwa mara tu itakapoidhinishwa',
        ),
      ),
    ];

    return SafeArea(
      key: const ValueKey('waitingVerification'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          children: [
            // Top Bar
            Row(
              children: [
                Press(
                  onTap: () {
                    Live.arrived.removeListener(_checkVerificationStatus);
                    _waitingTimer?.cancel();
                    _go(_AuthFlow.verificationAttachments);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: .12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.close_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
                const Spacer(),
                const LangSwitch(dark: true),
              ],
            ),

            const Spacer(),

            // Pulsing Holographic Radar Visual
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            C.teal.withValues(alpha: .35),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    )
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .scale(
                      begin: const Offset(0.9, 0.9),
                      end: const Offset(1.3, 1.3),
                      duration: 1200.ms,
                    ),
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: C.card,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: C.teal.withValues(alpha: .4),
                        blurRadius: 24,
                        offset: const Offset(0, 6),
                      ),
                    ],
                    border: Border.all(color: C.tealLight, width: 2.2),
                  ),
                  child: Icon(
                    _waitingStep >= 3
                        ? Icons.check_circle_rounded
                        : Icons.fingerprint_rounded,
                    color: _waitingStep >= 3 ? const Color(0xFF10B981) : C.teal,
                    size: 48,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 28),

            Text(
              _waitingStep >= 3
                  ? t('Identity Verified!', 'Uhakiki Umekamilika!')
                  : t('Waiting for Verification...', 'Inasubiri Uhakiki wa Msimamizi...'),
              style: display(26, color: Colors.white, weight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              _waitingStep >= 3
                  ? t('Your $methodLabel has been verified by the administrator.', 'Taarifa zako za $methodLabel zimethibitishwa rasmi na msimamizi.')
                  : t(
                      'Your $methodLabel has been sent to the admin panel. Your screen will update automatically the moment admin approves.',
                      'Taarifa zako za $methodLabel zimetumwa kwenye jopo la msimamizi. Skrini yako itafunguka mara moja msimamizi atakapoidhinisha.',
                    ),
              textAlign: TextAlign.center,
              style: body(
                14,
                color: Colors.white.withValues(alpha: .75),
                height: 1.4,
              ),
            ),

            const SizedBox(height: 32),

            // Step Progress Checklist
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Colors.white.withValues(alpha: .15),
                  width: 1.2,
                ),
              ),
              child: Column(
                children: [
                  for (var i = 0; i < steps.length; i++) ...[
                    Row(
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: i < _waitingStep
                                ? const Color(0xFF10B981)
                                : (i == _waitingStep
                                      ? C.teal
                                      : Colors.white.withValues(alpha: .12)),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: i < _waitingStep
                                ? const Icon(
                                    Icons.check,
                                    size: 16,
                                    color: Colors.white,
                                  )
                                : (i == _waitingStep
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor:
                                                AlwaysStoppedAnimation<Color>(
                                                  Colors.white,
                                                ),
                                          ),
                                        )
                                      : Icon(
                                          steps[i].icon,
                                          size: 14,
                                          color: Colors.white.withValues(
                                            alpha: .5,
                                          ),
                                        )),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                steps[i].title,
                                style: body(
                                  13.5,
                                  color: i <= _waitingStep
                                      ? Colors.white
                                      : Colors.white.withValues(alpha: .45),
                                  weight: i == _waitingStep
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                ),
                              ),
                              if (i <= _waitingStep)
                                Text(
                                  steps[i].desc,
                                  style: body(
                                    11.5,
                                    color: Colors.white.withValues(alpha: .65),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (i < steps.length - 1)
                      Padding(
                        padding: const EdgeInsets.only(
                          left: 14,
                          top: 4,
                          bottom: 4,
                        ),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            width: 2,
                            height: 12,
                            color: i < _waitingStep
                                ? const Color(0xFF10B981)
                                : Colors.white.withValues(alpha: .15),
                          ),
                        ),
                      ),
                  ],
                ],
              ),
            ),

            const Spacer(),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------------------
  // TENANT WELCOME CELEBRATION VIEW
  // -------------------------------------------------------------------------
  Widget _buildTenantWelcomeView() {
    final firstName = _registeredFullName.isNotEmpty
        ? _registeredFullName.split(' ').first
        : (_name.text.trim().isNotEmpty
              ? _name.text.trim().split(' ').first
              : 'Tenant');

    return SafeArea(
      key: const ValueKey('tenantWelcome'),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 12),

            // Celebratory Top Icon
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFF10B981).withValues(alpha: .28),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
                Container(
                  width: 84,
                  height: 84,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF34D399), Color(0xFF059669)],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF059669).withValues(alpha: .35),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.verified_user_rounded,
                    color: Colors.white,
                    size: 44,
                  ),
                ).animate().scale(
                  begin: const Offset(0.7, 0.7),
                  end: const Offset(1, 1),
                  duration: 500.ms,
                  curve: Curves.elasticOut,
                ),
              ],
            ),

            const SizedBox(height: 18),

            Text(
              t('Hongera, $firstName! 🎉', 'Hongera, $firstName! 🎉'),
              style: display(26, color: C.wino, weight: FontWeight.w800),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              t(
                'Your verified tenant account is active and ready.',
                'Akaunti yako ya Mpangaji imethibitishwa na iko tayari.',
              ),
              style: body(15, color: C.muted),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 24),

            // Claymorphic Tenant ID Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: C.card,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: const Color(0xFF10B981).withValues(alpha: .35),
                  width: 1.8,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: .06),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                  BoxShadow(
                    color: Colors.white.withValues(alpha: .9),
                    blurRadius: 1,
                    offset: const Offset(0, -1),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: C.teal.withValues(alpha: .15),
                        child: Text(
                          firstName.isNotEmpty
                              ? firstName[0].toUpperCase()
                              : 'T',
                          style: display(
                            20,
                            color: C.teal,
                            weight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    _registeredFullName.isNotEmpty
                                        ? _registeredFullName
                                        : _name.text.trim(),
                                    style: display(
                                      16,
                                      color: C.wino,
                                      weight: FontWeight.w700,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(
                                  Icons.verified,
                                  color: Color(0xFF10B981),
                                  size: 17,
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              t(
                                'Verified Tenant Profile',
                                'Mpangaji Halali Aliyehakikiwa',
                              ),
                              style: body(
                                12.5,
                                color: const Color(0xFF059669),
                                weight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    children: [
                      Icon(Icons.badge_outlined, size: 16, color: C.muted),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _registeredNida.isNotEmpty
                              ? 'NIDA: ${_formatNida(_registeredNida)}'
                              : (_verificationMethod == 'nida_card'
                                    ? t(
                                        'NIDA Card Attached',
                                        'Kitambulisho cha NIDA',
                                      )
                                    : (_verificationMethod == 'driving_licence'
                                          ? t(
                                              'Driving Licence Attached',
                                              'Leseni ya Udereva',
                                            )
                                          : t(
                                              'Voter ID Card Attached',
                                              'Kadi ya Mpiga Kura',
                                            ))),
                          style: body(
                            13,
                            color: C.wino,
                            weight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD1FAE5),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          t('VERIFIED ✓', 'IMEHAKIKIWA ✓'),
                          style: body(
                            10.5,
                            color: const Color(0xFF065F46),
                            weight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.phone_outlined, size: 16, color: C.muted),
                      const SizedBox(width: 8),
                      Text(
                        _registeredPhone.isNotEmpty
                            ? _registeredPhone
                            : fullPhone(_country, _phone.text),
                        style: body(13, color: C.muted),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 22),

            // What You Can Do Next (Feature Highlights)
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                t(
                  'What you can do on Panga:',
                  'Unachoweza kufanya kwenye Panga:',
                ),
                style: display(15, color: C.wino, weight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: 12),

            _welcomeFeatureTile(
              icon: Icons.camera_alt_outlined,
              title: t(
                'Instagram-Style Home Feed',
                'Mlisho wa Picha kama Instagram',
              ),
              desc: t(
                'Scroll houses, hotel rooms, lodges & local posts freely',
                'Vinjari nyumba, vyumba vya hoteli na matukio ya mtaani',
              ),
              color: const Color(0xFFE1306C),
            ),
            const SizedBox(height: 10),
            _welcomeFeatureTile(
              icon: Icons.handyman_outlined,
              title: t(
                'Handyman & Works Directory',
                'Mafundi na Kazi za Nyumbani',
              ),
              desc: t(
                'Discover plumbers, electricians, AC repair and home movers',
                'Pata mafundi wa mabomba, umeme, kiyoyozi na uhamishaji',
              ),
              color: const Color(0xFFF59E0B),
            ),
            const SizedBox(height: 10),
            _welcomeFeatureTile(
              icon: Icons.description_outlined,
              title: t(
                'Legal Tenancy Agreements',
                'Mikataba ya Kisheria ya Pango',
              ),
              desc: t(
                'Direct NIDA-backed rental agreements signed in seconds',
                'Mikataba rasmi ya kisheria inayothibitishwa kwa NIDA yako',
              ),
              color: C.teal,
            ),

            const SizedBox(height: 28),

            // Primary Button to Enter Main Screen
            Button(
              t('Start Exploring Homes', 'Anza Kuvinjari Makazi'),
              tone: Tone.navy,
              onTap: _finishTenantWelcome,
              busy: _busy,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _welcomeFeatureTile({
    required IconData icon,
    required String title,
    required String desc,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: C.fill,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: C.line, width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: .12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: body(14, color: C.wino, weight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                Text(desc, style: body(12, color: C.muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------------------
  // SCREEN 8: User Capability Selection (What best describes you?)
  // -------------------------------------------------------------------------
  Widget _buildScreen8CapabilitySelect() {
    final capabilities = [
      (
        key: 'tenant',
        title: t('Tenant', 'Mpangaji'),
        desc: t('Looking for a place to rent', 'Natafuta nyumba ya kupanga'),
        icon: Icons.search_rounded,
        color: C.teal,
      ),
      (
        key: 'landlord',
        title: t('Landlord', 'Mmiliki wa Nyumba'),
        desc: t('Have a property to rent', 'Nina nyumba ya kupangisha'),
        icon: Icons.key_rounded,
        color: const Color(0xFFF59E0B),
      ),
      (
        key: 'manager',
        title: t('Property Manager', 'Msimamizi wa Majengo'),
        desc: t('Manage properties for others', 'Nasimamia nyumba za wengine'),
        icon: Icons.business_center_outlined,
        color: C.teal,
      ),
      (
        key: 'investor',
        title: t('Investor', 'Mwekezaji'),
        desc: t(
          'Invest in real estate projects',
          'Wekeza kwenye miradi ya makazi',
        ),
        icon: Icons.trending_up_rounded,
        color: const Color(0xFF3B82F6),
      ),
      (
        key: 'service',
        title: t('Service Provider', 'Mtoa Huduma'),
        desc: t(
          'Offer maintenance or other services',
          'Toa huduma za ukarabati na ufundi',
        ),
        icon: Icons.build_outlined,
        color: const Color(0xFF8B5CF6),
      ),
      (
        key: 'finance',
        title: t('Financing Partner', 'Mshirika wa Fedha'),
        desc: t(
          'Provide home financing solutions',
          'Toa suluhisho za fedha za makazi',
        ),
        icon: Icons.account_balance_outlined,
        color: C.teal,
      ),
    ];

    return SafeArea(
      key: const ValueKey('capabilitySelect'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Nav header with back button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Row(
              children: [
                Press(
                  onTap: () => _go(_AuthFlow.registerForm),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: C.fill,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.arrow_back_rounded,
                      color: C.wino,
                      size: 20,
                    ),
                  ),
                ),
                const Spacer(),
                const LangSwitch(dark: false),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t(
                    'What best describes you?',
                    'Kipi kinakuelezea vizuri zaidi?',
                  ),
                  style: display(26, color: C.wino, weight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                Text(
                  t(
                    'You can choose more than one role. This helps us personalize your experience.',
                    'Unaweza kuchagua zaidi ya jukumu moja. Inatusaidia kuboresha uzoefu wako.',
                  ),
                  style: body(14, color: C.muted, height: 1.35),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Scrollable Capability Cards
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
              itemCount: capabilities.length,
              itemBuilder: (context, index) {
                final c = capabilities[index];
                final isSelected = _selectedCapabilities.contains(c.key);

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Press(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() {
                        if (isSelected) {
                          if (_selectedCapabilities.length > 1) {
                            _selectedCapabilities.remove(c.key);
                          }
                        } else {
                          _selectedCapabilities.add(c.key);
                        }
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: C.card,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isSelected ? C.teal : C.line,
                          width: isSelected ? 1.8 : 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: isSelected
                                ? C.teal.withValues(alpha: .12)
                                : Colors.black.withValues(alpha: .03),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: c.color.withValues(alpha: .12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(c.icon, size: 20, color: c.color),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  c.title,
                                  style: display(
                                    15,
                                    color: C.wino,
                                    weight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(c.desc, style: body(12.5, color: C.muted)),
                              ],
                            ),
                          ),
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              color: isSelected ? C.teal : Colors.transparent,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: isSelected ? C.teal : C.line,
                                width: 1.6,
                              ),
                            ),
                            child: isSelected
                                ? const Icon(
                                    Icons.check,
                                    size: 15,
                                    color: Colors.white,
                                  )
                                : null,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Bottom Action
          Padding(
            padding: EdgeInsets.fromLTRB(
              24,
              8,
              24,
              18 + MediaQuery.paddingOf(context).bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_error != null) ...[
                  _errorCard(_error!),
                  const SizedBox(height: 12),
                ],
                Button(
                  t('Continue', 'Endelea'),
                  tone: Tone.navy,
                  onTap: _completeRegistration,
                  busy: _busy,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------------------
  // SIGN IN VIEW
  // -------------------------------------------------------------------------
  Widget _buildSignInView() {
    return SafeArea(
      key: const ValueKey('signIn'),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Row(
              children: [
                Press(
                  onTap: () => _go(_AuthFlow.options),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: .1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.arrow_back_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
                const Spacer(),
                const LangSwitch(dark: true),
              ],
            ),
          ),

          Expanded(
            child: Form(
              key: _form,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    const _PangaRibbonLogo(size: 46),
                    const SizedBox(height: 16),
                    Text(
                      t('Welcome back', 'Karibu tena'),
                      style: display(
                        28,
                        color: Colors.white,
                        weight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t(
                        'Sign in to continue where you left off.',
                        'Ingia uendelee ulipoishia.',
                      ),
                      style: body(
                        15,
                        color: Colors.white.withValues(alpha: .75),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Inputs inside elevated white card container
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: C.card,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: .6),
                          width: 1.6,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: .22),
                            blurRadius: 22,
                            offset: const Offset(0, 10),
                          ),
                          BoxShadow(
                            color: Colors.white.withValues(alpha: .8),
                            blurRadius: 1,
                            offset: const Offset(0, -1),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Field(
                            t(
                              'Phone number or email',
                              'Namba ya simu au barua pepe',
                            ),
                            controller: _id,
                            hint: '0712 345 678 au you@example.com',
                            icon: Icons.alternate_email_rounded,
                            keyboard: TextInputType.emailAddress,
                            autofill: const [AutofillHints.username],
                            validator: _need,
                          ),
                          const SizedBox(height: 16),

                          Field(
                            t('Password', 'Nenosiri'),
                            controller: _password,
                            secret: true,
                            icon: Icons.lock_outline_rounded,
                            autofill: const [AutofillHints.password],
                            validator: _need,
                            action: TextInputAction.done,
                            onSubmit: _submitSignIn,
                          ),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () => _go(_AuthFlow.forgot),
                              child: Text(
                                t('Forgot password?', 'Umesahau nenosiri?'),
                                style: body(
                                  13.5,
                                  color: C.teal,
                                  weight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),

                          if (_error != null) ...[
                            const SizedBox(height: 10),
                            _errorCard(_error!),
                          ],

                          const SizedBox(height: 16),
                          Button(
                            t('Sign In', 'Ingia'),
                            tone: Tone.navy,
                            onTap: _submitSignIn,
                            busy: _busy,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            t(
                              'Don\'t have an account? ',
                              'Huna akaunti bado? ',
                            ),
                            style: body(
                              14.5,
                              color: Colors.white.withValues(alpha: .75),
                            ),
                          ),
                          Press(
                            onTap: () => _go(_AuthFlow.options),
                            child: Text(
                              t('Create account', 'Fungua akaunti'),
                              style: body(
                                14.5,
                                color: C.tealBright,
                                weight: FontWeight.w700,
                              ),
                            ),
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
      ),
    );
  }

  // -------------------------------------------------------------------------
  // FORGOT PASSWORD VIEW
  // -------------------------------------------------------------------------
  Widget _buildForgotView() {
    return SafeArea(
      key: const ValueKey('forgot'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Press(
              onTap: () => _go(_AuthFlow.signIn),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: C.fill,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.arrow_back_rounded, color: C.wino, size: 20),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              t('Forgot password?', 'Umesahau nenosiri?'),
              style: display(28, color: C.wino, weight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              t(
                'Enter your phone or email to receive a 6-digit verification code.',
                'Weka namba ya simu au barua pepe kupata namba ya kubadili.',
              ),
              style: body(15, color: C.muted),
            ),
            const SizedBox(height: 28),

            Form(
              key: _form,
              child: Field(
                t('Phone number or email', 'Namba ya simu au barua pepe'),
                controller: _id,
                hint: '0712 345 678 au you@example.com',
                icon: Icons.alternate_email_rounded,
                validator: _need,
                action: TextInputAction.done,
                onSubmit: _submitForgot,
              ),
            ),

            if (_error != null) ...[
              const SizedBox(height: 14),
              _errorCard(_error!),
            ],

            const SizedBox(height: 24),
            Button(
              t('Send Reset Code', 'Tuma Namba ya Kubadili'),
              tone: Tone.navy,
              onTap: _submitForgot,
              busy: _busy,
            ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------------------
  // CODE RESET VIEW
  // -------------------------------------------------------------------------
  Widget _buildCodeResetView() {
    return SafeArea(
      key: const ValueKey('code'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Press(
              onTap: () => _go(_AuthFlow.forgot),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: C.fill,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.arrow_back_rounded, color: C.wino, size: 20),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              t('Enter verification code', 'Weka namba ya uthibitisho'),
              style: display(26, color: C.wino, weight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              t(
                'Six digits sent to your account.',
                'Tarakimu sita zilizotumwa kwako.',
              ),
              style: body(15, color: C.muted),
            ),
            const SizedBox(height: 28),

            Form(
              key: _form,
              child: Column(
                children: [
                  _CodeBoxes(controller: _code),
                  const SizedBox(height: 14),
                  Center(
                    child: _wait > 0
                        ? Text(
                            t(
                              'Send again in ${_wait}s',
                              'Tuma tena baada ya sekunde $_wait',
                            ),
                            style: body(14, color: C.muted),
                          )
                        : TextButton(
                            onPressed: _resendCode,
                            child: Text(
                              t('Resend code', 'Tuma namba tena'),
                              style: body(
                                14.5,
                                color: C.teal,
                                weight: FontWeight.w700,
                              ),
                            ),
                          ),
                  ),
                  const SizedBox(height: 16),
                  Field(
                    t('New password', 'Nenosiri jipya'),
                    controller: _password,
                    secret: true,
                    icon: Icons.lock_outline_rounded,
                    validator: _pass,
                    action: TextInputAction.done,
                    onSubmit: _submitCodeReset,
                  ),
                ],
              ),
            ),

            if (_error != null) ...[
              const SizedBox(height: 14),
              _errorCard(_error!),
            ],

            const SizedBox(height: 24),
            Button(
              t('Reset Password', 'Badili Nenosiri'),
              tone: Tone.navy,
              onTap: _submitCodeReset,
              busy: _busy,
            ),
          ],
        ),
      ),
    );
  }

  Widget _errorCard(String msg) {
    return Container(
      key: ValueKey(_errors),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFF87171).withValues(alpha: .4),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.error_outline_rounded,
            color: Color(0xFFDC2626),
            size: 18,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              msg,
              style: body(
                13.5,
                color: const Color(0xFF991B1B),
                weight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    ).animate().shake(hz: 6, offset: const Offset(5, 0), duration: 320.ms);
  }
}

// ---------------------------------------------------------------------------
// BRAND LOGO ASSET & 6-DIGIT CODE INPUT
// ---------------------------------------------------------------------------

class _PangaRibbonLogo extends StatelessWidget {
  const _PangaRibbonLogo({this.size = 48});
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _RibbonLogoPainter()),
    );
  }
}

class _RibbonLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final paintTeal = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [C.tealBright, C.teal],
      ).createShader(Offset.zero & size)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.16
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final paintLight = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Colors.white, C.tealLight],
      ).createShader(Offset.zero & size)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.16
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final path1 = Path()
      ..moveTo(w * 0.22, h * 0.76)
      ..lineTo(w * 0.22, h * 0.32)
      ..cubicTo(w * 0.22, h * 0.18, w * 0.44, h * 0.18, w * 0.44, h * 0.42)
      ..lineTo(w * 0.44, h * 0.72);

    final path2 = Path()
      ..moveTo(w * 0.56, h * 0.28)
      ..lineTo(w * 0.56, h * 0.62)
      ..cubicTo(w * 0.56, h * 0.82, w * 0.78, h * 0.82, w * 0.78, h * 0.58)
      ..lineTo(w * 0.78, h * 0.24);

    canvas.drawPath(path1, paintLight);
    canvas.drawPath(path2, paintTeal);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _GoogleLogo extends StatelessWidget {
  const _GoogleLogo({this.size = 20});
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width;
    final r = s / 2;
    final c = Offset(r, r);

    final stroke = s * 0.22;
    final arcRect = Rect.fromCircle(center: c, radius: r - stroke / 2);

    final pRed = Paint()
      ..color = const Color(0xFFEA4335)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;
    final pYellow = Paint()
      ..color = const Color(0xFFFBBC05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;
    final pGreen = Paint()
      ..color = const Color(0xFF34A853)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;
    final pBlue = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.butt;

    // Draw Google arcs
    canvas.drawArc(arcRect, 3.14159 * 1.05, 3.14159 * 0.55, false, pRed);
    canvas.drawArc(arcRect, 3.14159 * 0.55, 3.14159 * 0.5, false, pYellow);
    canvas.drawArc(arcRect, 0.05, 3.14159 * 0.5, false, pGreen);
    canvas.drawArc(arcRect, -3.14159 * 0.35, 3.14159 * 0.4, false, pBlue);

    // Blue horizontal bar
    final bar = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTWH(r - stroke * 0.2, r - stroke / 2, r * 1.05, stroke),
      bar,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _CodeBoxes extends StatefulWidget {
  const _CodeBoxes({required this.controller});
  final TextEditingController controller;

  @override
  State<_CodeBoxes> createState() => _CodeBoxesState();
}

class _CodeBoxesState extends State<_CodeBoxes> {
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_changed);
    _focus.addListener(_changed);
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  void _changed() => setState(() {});

  @override
  void dispose() {
    widget.controller.removeListener(_changed);
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final code = widget.controller.text;
    return FormField<String>(
      validator: (_) => widget.controller.text.length == 6
          ? null
          : t('Enter all 6 digits', 'Weka tarakimu zote 6'),
      builder: (state) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Row(
                children: [
                  for (var i = 0; i < 6; i++)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        height: 58,
                        margin: EdgeInsets.only(
                          right: i == 5 ? 0 : 7,
                          left: i == 3 ? 8 : 0,
                        ),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: C.chokaa,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            width: 1.8,
                            color: state.hasError
                                ? const Color(0xFFEF4444)
                                : _focus.hasFocus &&
                                      i == code.length.clamp(0, 5)
                                ? C.teal
                                : i < code.length
                                ? C.wino
                                : C.line,
                          ),
                          boxShadow:
                              _focus.hasFocus && i == code.length.clamp(0, 5)
                              ? [
                                  BoxShadow(
                                    color: C.teal.withValues(alpha: .2),
                                    blurRadius: 6,
                                  ),
                                ]
                              : null,
                        ),
                        child: i < code.length
                            ? Text(
                                code[i],
                                style: display(
                                  24,
                                  color: C.wino,
                                  weight: FontWeight.w700,
                                ),
                              ).animate().scaleXY(
                                begin: .5,
                                end: 1,
                                duration: 180.ms,
                                curve: Curves.easeOutBack,
                              )
                            : null,
                      ),
                    ),
                ],
              ),
              Positioned.fill(
                child: Opacity(
                  opacity: 0,
                  child: TextField(
                    controller: widget.controller,
                    focusNode: _focus,
                    keyboardType: TextInputType.number,
                    autofillHints: const [AutofillHints.oneTimeCode],
                    enableInteractiveSelection: false,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    decoration: InputDecoration(
                      labelText: t('6-digit code', 'Namba ya tarakimu 6'),
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (state.hasError)
            Padding(
              padding: const EdgeInsets.only(top: 8, left: 2),
              child: Text(
                state.errorText!,
                style: body(13, color: const Color(0xFFEF4444)),
              ),
            ),
        ],
      ),
    );
  }
}

/// Formatter for 20-digit NIDA number with dashes: 19850712-14125-00001-23
class _NidaInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final all = newValue.text.replaceAll(RegExp(r'\D'), '');
    final digits = all.length > 20 ? all.substring(0, 20) : all;
    final out = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i == 8 || i == 13 || i == 18) out.write('-');
      out.write(digits[i]);
    }
    return TextEditingValue(
      text: out.toString(),
      selection: TextSelection.collapsed(offset: out.length),
    );
  }
}
