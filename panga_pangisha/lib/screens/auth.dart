import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../api.dart';
import '../l10n.dart';
import '../main.dart';
import '../ui.dart';
import 'customecontrols/countries.dart';
import 'customecontrols/pickers.dart';

enum _AuthFlow {
  options, // Screen 6: Account creation options (Google, Apple, Email)
  registerForm, // Screen 7: Registration form (Name, Email, Phone, Password)
  capabilitySelect, // Screen 8: What best describes you? (Multi-select roles)
  signIn, // Existing Sign in flow
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
  final String _selectedRole = AuthScreen.initialSelectedRole;
  bool _agreedToTerms = true;

  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  Country _country = countries.first; // Tanzania
  late final _countryText = TextEditingController(text: '${_country.flag}  ${_country.name}');
  late final _phone = TextEditingController(text: '+${_country.dial} '); // starts with the country's code
  final _email = TextEditingController();
  final _id = TextEditingController(); // phone or email for sign in / forgot
  final _password = TextEditingController();
  final _code = TextEditingController();

  // Multi-select capabilities (Screen 8)
  final Set<String> _selectedCapabilities = {'tenant'};

  bool _busy = false;
  String? _error;
  int _errors = 0;
  int _wait = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in [_name, _phone, _countryText, _email, _id, _password, _code]) {
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

  /// Validates registration fields on Screen 7, executes registration, and advances to Screen 8
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

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await Api.register({
        'fullname': _name.text.trim(),
        'phone_number': fullPhone(_country, _phone.text),
        'country': _country.code,
        'email': _email.text.trim(),
        'password': _password.text,
        'role': _selectedRole == 'landlord' || _selectedRole == 'manager'
            ? 'landlord'
            : (_selectedRole == 'investor' ? 'investor' : 'renter'),
      });
      Api.finishOnboarding();

      if (!mounted) return;

      // Landlords land on Screen 8 (identity check): the root shows it until an admin approves them.
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
      // Swap the dial code and keep whatever was typed after it.
      final typed = _phone.text.replaceFirst(RegExp('^\\+?${_country.dial}'), '').trim();
      _country = c;
      _countryText.text = '${c.flag}  ${c.name}';
      _phone.text = '+${c.dial} $typed';
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
      await Api.post('user/password/forgot/', {
        'identifier': _id.text.trim(),
      });
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

  String? _need(String v) => v.isEmpty ? t('Fill this in', 'Jaza hapa') : null;
  String? _pass(String v) => v.length < 6
      ? t('Use at least 6 characters', 'Tumia angalau herufi 6')
      : null;

  @override
  Widget build(BuildContext context) {
    final isDark = _flow == _AuthFlow.options || _flow == _AuthFlow.signIn;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: isDark ? SystemUiOverlayStyle.light : C.overlay,
      child: PopScope(
        canPop: _flow == _AuthFlow.options,
        onPopInvokedWithResult: (popped, _) {
          if (!popped) {
            if (_flow == _AuthFlow.capabilitySelect) {
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
                colors: [
                  C.teal.withValues(alpha: .22),
                  Colors.transparent,
                ],
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
                  style: display(32, color: Colors.white, weight: FontWeight.w800),
                ),
                const SizedBox(height: 28),

                Text(
                  t('Create your account', 'Fungua akaunti yako'),
                  style: display(26, color: Colors.white, weight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  t('Choose how you\'d like to get started', 'Chagua jinsi ungependa kuanza'),
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
                      t('Use Email/Phone sign up for instant access.', 'Tumia Barua pepe au Simu kwa ufikiaji wa haraka.'),
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
                  leading: const Icon(Icons.apple, size: 24, color: Colors.black),
                  onTap: () {
                    toast(
                      context,
                      t('Use Email/Phone sign up for instant access.', 'Tumia Barua pepe au Simu kwa ufikiaji wa haraka.'),
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
                  leading: const Icon(Icons.mail_outline_rounded, size: 20, color: Colors.white),
                  onTap: () => _go(_AuthFlow.registerForm),
                ),

                const Spacer(flex: 3),

                // Bottom: Already have an account? Sign in
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      t('Already have an account? ', 'Tayari una akaunti? '),
                      style: body(14.5, color: Colors.white.withValues(alpha: .75)),
                    ),
                    Press(
                      onTap: () => _go(_AuthFlow.signIn),
                      child: Text(
                        t('Sign in', 'Ingia'),
                        style: body(14.5, color: C.tealBright, weight: FontWeight.w700),
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
  // SCREEN 7: Registration Form
  // -------------------------------------------------------------------------
  Widget _buildScreen7RegisterForm() {
    return SafeArea(
      key: const ValueKey('registerForm'),
      child: Column(
        children: [
          // Nav header with back button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Row(
              children: [
                Press(
                  onTap: () => _go(_AuthFlow.options),
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
            child: Form(
              key: _form,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _selectedRole == 'landlord'
                          ? t('Landlord Registration', 'Usajili wa Mmiliki')
                          : t('Create your account', 'Fungua akaunti yako'),
                      style: display(28, color: C.wino, weight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _selectedRole == 'landlord'
                          ? t('Set up your owner account', 'Weka akaunti yako ya mmiliki')
                          : t('Let\'s get you started. It only takes a minute.', 'Tuanze sasa. Inachukua dakika moja tu.'),
                      style: body(14.5, color: C.muted),
                    ),
                    const SizedBox(height: 28),

                    // Full Name Field
                    Field(
                      t('Full name', 'Jina kamili'),
                      controller: _name,
                      hint: 'John Doe',
                      icon: Icons.person_outline_rounded,
                      keyboard: TextInputType.name,
                      autofill: const [AutofillHints.name],
                      validator: _need,
                    ),
                    const SizedBox(height: 16),

                    // Email Address Field
                    Field(
                      t('Email address', 'Barua pepe'),
                      controller: _email,
                      hint: 'you@example.com',
                      icon: Icons.mail_outline_rounded,
                      keyboard: TextInputType.emailAddress,
                      autofill: const [AutofillHints.email],
                      validator: (v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v)
                          ? null
                          : t('Enter a valid email', 'Weka barua pepe sahihi'),
                    ),
                    const SizedBox(height: 16),

                    // Country: choosing one puts its dial code in the phone field below
                    PickerField(
                      t('Country', 'Nchi'),
                      controller: _countryText,
                      onTap: _chooseCountry,
                    ),
                    const SizedBox(height: 16),

                    // Phone Number Field
                    Field(
                      t('Phone number', 'Namba ya simu'),
                      controller: _phone,
                      hint: '+${_country.dial} 712 345 678',
                      icon: Icons.phone_outlined,
                      keyboard: TextInputType.phone,
                      autofill: const [AutofillHints.telephoneNumber],
                      formatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d+ ]'))],
                      validator: (v) => fullPhone(_country, v).length - _country.dial.length - 1 < 7
                          ? t('Enter a full phone number', 'Weka namba kamili ya simu')
                          : null,
                    ),
                    const SizedBox(height: 16),

                    // Password Field
                    Field(
                      t('Password', 'Nenosiri'),
                      controller: _password,
                      hint: t('Create a strong password', 'Weka nenosiri imara'),
                      secret: true,
                      icon: Icons.lock_outline_rounded,
                      autofill: const [AutofillHints.newPassword],
                      validator: _pass,
                      action: TextInputAction.done,
                      onSubmit: _submitRegistrationForm,
                    ),

                    const SizedBox(height: 16),

                    // Checkbox: I agree to Terms & Privacy Policy
                    Row(
                      children: [
                        Checkbox(
                          value: _agreedToTerms,
                          activeColor: C.teal,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                          onChanged: (v) => setState(() => _agreedToTerms = v ?? false),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _agreedToTerms = !_agreedToTerms),
                            child: RichText(
                              text: TextSpan(
                                text: t('I agree to the ', 'Ninakubali '),
                                style: body(12, color: C.wino),
                                children: [
                                  TextSpan(
                                    text: t('Terms of Service', 'Vigezo vya Huduma'),
                                    style: TextStyle(color: C.teal, fontWeight: FontWeight.w700),
                                  ),
                                  TextSpan(text: t(' and ', ' na ')),
                                  TextSpan(
                                    text: t('Privacy Policy', 'Sera ya Faragha'),
                                    style: TextStyle(color: C.teal, fontWeight: FontWeight.w700),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      _errorCard(_error!),
                    ],

                    const SizedBox(height: 22),

                    // Primary Button: Dark Navy Create Account Pill
                    Button(
                      t('Create Account', 'Fungua Akaunti'),
                      tone: Tone.navy,
                      onTap: _submitRegistrationForm,
                      busy: _busy,
                    ),

                    const SizedBox(height: 18),

                    // Legal footnote
                    Center(
                      child: Text(
                        t(
                          'By creating an account, you agree to our\nTerms of Service and Privacy Policy.',
                          'Kwa kufungua akaunti, unakubali\nVigezo vya Huduma na Sera ya Faragha.',
                        ),
                        textAlign: TextAlign.center,
                        style: body(12, color: C.muted, height: 1.4),
                      ),
                    ),
                    const SizedBox(height: 16),
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
        desc: t('Invest in real estate projects', 'Wekeza kwenye miradi ya makazi'),
        icon: Icons.trending_up_rounded,
        color: const Color(0xFF3B82F6),
      ),
      (
        key: 'service',
        title: t('Service Provider', 'Mtoa Huduma'),
        desc: t('Offer maintenance or other services', 'Toa huduma za ukarabati na ufundi'),
        icon: Icons.build_outlined,
        color: const Color(0xFF8B5CF6),
      ),
      (
        key: 'finance',
        title: t('Financing Partner', 'Mshirika wa Fedha'),
        desc: t('Provide home financing solutions', 'Toa suluhisho za fedha za makazi'),
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
                  t('What best describes you?', 'Kipi kinakuelezea vizuri zaidi?'),
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
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                                  style: display(15, color: C.wino, weight: FontWeight.w700),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  c.desc,
                                  style: body(12.5, color: C.muted),
                                ),
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
                                ? const Icon(Icons.check, size: 15, color: Colors.white)
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
            padding: EdgeInsets.fromLTRB(24, 8, 24, 18 + MediaQuery.paddingOf(context).bottom),
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
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    const _PangaRibbonLogo(size: 46),
                    const SizedBox(height: 16),
                    Text(
                      t('Welcome back', 'Karibu tena'),
                      style: display(28, color: Colors.white, weight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t('Sign in to continue where you left off.', 'Ingia uendelee ulipoishia.'),
                      style: body(15, color: Colors.white.withValues(alpha: .75)),
                    ),
                    const SizedBox(height: 32),

                    // Inputs inside elevated white card container
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: C.card,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: .2),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Field(
                            t('Phone number or email', 'Namba ya simu au barua pepe'),
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
                                style: body(13.5, color: C.teal, weight: FontWeight.w600),
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
                            t('Don\'t have an account? ', 'Huna akaunti bado? '),
                            style: body(14.5, color: Colors.white.withValues(alpha: .75)),
                          ),
                          Press(
                            onTap: () => _go(_AuthFlow.options),
                            child: Text(
                              t('Create account', 'Fungua akaunti'),
                              style: body(14.5, color: C.tealBright, weight: FontWeight.w700),
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
              t('Six digits sent to your account.', 'Tarakimu sita zilizotumwa kwako.'),
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
                              style: body(14.5, color: C.teal, weight: FontWeight.w700),
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
        border: Border.all(color: const Color(0xFFF87171).withValues(alpha: .4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              msg,
              style: body(13.5, color: const Color(0xFF991B1B), weight: FontWeight.w500),
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

    final pRed = Paint()..color = const Color(0xFFEA4335)..style = PaintingStyle.stroke..strokeWidth = stroke..strokeCap = StrokeCap.butt;
    final pYellow = Paint()..color = const Color(0xFFFBBC05)..style = PaintingStyle.stroke..strokeWidth = stroke..strokeCap = StrokeCap.butt;
    final pGreen = Paint()..color = const Color(0xFF34A853)..style = PaintingStyle.stroke..strokeWidth = stroke..strokeCap = StrokeCap.butt;
    final pBlue = Paint()..color = const Color(0xFF4285F4)..style = PaintingStyle.stroke..strokeWidth = stroke..strokeCap = StrokeCap.butt;

    // Draw Google arcs
    canvas.drawArc(arcRect, 3.14159 * 1.05, 3.14159 * 0.55, false, pRed);
    canvas.drawArc(arcRect, 3.14159 * 0.55, 3.14159 * 0.5, false, pYellow);
    canvas.drawArc(arcRect, 0.05, 3.14159 * 0.5, false, pGreen);
    canvas.drawArc(arcRect, -3.14159 * 0.35, 3.14159 * 0.4, false, pBlue);

    // Blue horizontal bar
    final bar = Paint()..color = const Color(0xFF4285F4)..style = PaintingStyle.fill;
    canvas.drawRect(Rect.fromLTWH(r - stroke * 0.2, r - stroke / 2, r * 1.05, stroke), bar);
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
                                : _focus.hasFocus && i == code.length.clamp(0, 5)
                                    ? C.teal
                                    : i < code.length
                                        ? C.wino
                                        : C.line,
                          ),
                          boxShadow: _focus.hasFocus && i == code.length.clamp(0, 5)
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
                                style: display(24, color: C.wino, weight: FontWeight.w700),
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
              child: Text(state.errorText!, style: body(13, color: const Color(0xFFEF4444))),
            ),
        ],
      ),
    );
  }
}
