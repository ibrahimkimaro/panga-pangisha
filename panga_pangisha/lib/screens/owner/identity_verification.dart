import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';

import '../../api.dart';
import '../../l10n.dart';
import '../../live.dart';
import '../../main.dart';
import '../../ui.dart';
import 'profile_setup.dart';

/// Screen 8, the landlord's door: send a NIDA number or a photo of the card, wait while an admin
/// reviews it, then get welcomed in. The root shows this instead of the dashboard until the
/// server says `identity_status == approved`.
class IdentityGate extends StatefulWidget {
  const IdentityGate({super.key});

  @override
  State<IdentityGate> createState() => _IdentityGateState();
}

class _IdentityGateState extends State<IdentityGate> {
  String _status = 'loading'; // loading | offline | none | pending | approved | rejected
  String? _reason;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _refresh();
    Live.arrived.addListener(_refresh); // the admin's decision is pushed live: no need to wait for the next poll
  }

  @override
  void dispose() {
    Live.arrived.removeListener(_refresh);
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      final r = await Api.get('identity');
      if (mounted) _apply(Map<String, dynamic>.from(r));
    } on ApiError {
      // While waiting, a dropped request just means "ask again on the next tick".
      if (mounted && _status == 'loading') setState(() => _status = 'offline');
    }
  }

  void _apply(Map<String, dynamic> r) {
    final was = _status;
    setState(() {
      _status = r['status'] ?? 'none';
      _reason = r['rejection_reason'];
    });
    if (_status == 'pending') {
      // ponytail: polling every 3 s. Move to the Phoenix user channel if thousands wait at once.
      _poll ??= Timer.periodic(const Duration(seconds: 3), (_) => _refresh());
    } else {
      _poll?.cancel();
      _poll = null;
    }
    if (was == 'pending' && _status != 'pending') HapticFeedback.heavyImpact();
  }

  /// Approved and thanked: on to the landlord profile setup, with the dashboard waiting underneath.
  void _enter() {
    final u = Api.user.value!;
    navigator.currentState?.push(
      MaterialPageRoute(builder: (_) => LandlordProfileSetupScreen(userName: u['fullname'])),
    );
    Api.setUser({...u, 'identity_status': 'approved'}); // the root swaps this gate for the dashboard
  }

  Future<void> _rentInstead() async {
    try {
      Api.setUser(Map<String, dynamic>.from(await Api.patch('user/me/', {'role': 'renter'})));
    } on ApiError catch (e) {
      if (mounted) toast(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) => AnnotatedRegion<SystemUiOverlayStyle>(
    value: C.overlay,
    child: Scaffold(
      backgroundColor: C.card,
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 420),
          switchInCurve: Curves.easeOutCubic,
          layoutBuilder: (current, previous) => Stack(
            fit: StackFit.expand,
            children: [...previous, if (current != null) current],
          ),
          child: switch (_status) {
            'loading' => const Center(key: ValueKey('loading'), child: CircularProgressIndicator()),
            'offline' => Notice(
              key: const ValueKey('offline'),
              icon: Icons.wifi_off_rounded,
              title: t('No connection', 'Hakuna mtandao'),
              text: t(
                'We could not check where your verification stands.',
                'Hatukuweza kuangalia uthibitisho wako umefikia wapi.',
              ),
              action: t('Try again', 'Jaribu tena'),
              onAction: () {
                setState(() => _status = 'loading');
                _refresh();
              },
            ),
            'pending' => _Waiting(key: const ValueKey('pending'), onRentInstead: _rentInstead),
            'approved' => _Welcome(key: const ValueKey('approved'), onContinue: _enter),
            _ => IdentityForm(
              key: const ValueKey('form'),
              reason: _status == 'rejected' ? _reason : null,
              onSent: _apply,
              onStale: _refresh,
              onRentInstead: _rentInstead,
            ),
          },
        ),
      ),
    ),
  );
}

/// 20 digits typed as they are printed on the card: 19850712-14125-00001-23.
class NidaFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
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

Widget _leave(VoidCallback onRentInstead) => Row(
  mainAxisAlignment: MainAxisAlignment.spaceBetween,
  children: [
    TextButton(
      onPressed: onRentInstead,
      child: Text(
        t('I am looking for a home', 'Natafuta nyumba'),
        style: body(13.5, color: C.teal, weight: FontWeight.w600),
      ),
    ),
    TextButton(
      onPressed: Api.signOut,
      child: Text(t('Sign out', 'Ondoka'), style: body(13.5, color: C.muted, weight: FontWeight.w600)),
    ),
  ],
);

/// The two ways to prove who you are. Public so the widget tests can drive it without a server.
class IdentityForm extends StatefulWidget {
  const IdentityForm({
    super.key,
    required this.reason,
    required this.onSent,
    required this.onStale,
    required this.onRentInstead,
  });

  final String? reason; // why the last try was rejected
  final void Function(Map<String, dynamic>) onSent;
  final VoidCallback onStale, onRentInstead;

  @override
  State<IdentityForm> createState() => _IdentityFormState();
}

class _IdentityFormState extends State<IdentityForm> {
  String _method = 'nida_number';
  final _number = TextEditingController();
  String? _card; // path of the picked photo
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _number.dispose();
    super.dispose();
  }

  Future<void> _pick(ImageSource source) async {
    try {
      final f = await ImagePicker().pickImage(source: source, maxWidth: 2000, imageQuality: 85);
      if (f != null && mounted) {
        setState(() {
          _card = f.path;
          _error = null;
        });
      }
    } on PlatformException {
      if (mounted) {
        toast(
          context,
          t(
            'Could not open that. Try the other option.',
            'Imeshindikana kufungua. Jaribu chaguo jingine.',
          ),
        );
      }
    }
  }

  Future<void> _send() async {
    FocusScope.of(context).unfocus();
    final digits = _number.text.replaceAll(RegExp(r'\D'), '');
    String? problem;
    if (_method == 'nida_number' && digits.length != 20) {
      problem = t(
        'A NIDA number has 20 digits. You entered ${digits.length}.',
        'Namba ya NIDA ina tarakimu 20. Umeandika ${digits.length}.',
      );
    } else if (_method == 'nida_card' && _card == null) {
      problem = t(
        'Add a photo of your NIDA card first.',
        'Weka picha ya kitambulisho chako cha NIDA kwanza.',
      );
    }
    if (problem != null) {
      HapticFeedback.heavyImpact();
      setState(() => _error = problem);
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final r = _method == 'nida_number'
          ? await Api.post('identity', {'method': 'nida_number', 'nida_number': digits})
          : await Api.upload('identity', {'method': 'nida_card'}, {'nida_card': [_card!]});
      HapticFeedback.mediumImpact();
      if (mounted) widget.onSent(Map<String, dynamic>.from(r));
    } on ApiError catch (e) {
      if (!mounted) return;
      if (e.status == 409) {
        widget.onStale(); // already sent from another phone
        return;
      }
      setState(() {
        _busy = false;
        _error = e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: const EdgeInsets.fromLTRB(24, 4, 24, 24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _leave(widget.onRentInstead),
        const SizedBox(height: 12),
        Center(
          child: Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              color: C.tealLight,
              shape: BoxShape.circle,
              border: Border.all(color: C.teal.withValues(alpha: .25), width: 2),
            ),
            child: Icon(Icons.assignment_ind_outlined, color: C.teal, size: 44),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          t('Verify your identity', 'Thibitisha utambulisho wako'),
          style: display(26, color: C.wino, weight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          t(
            'Send one of these. A person on our team checks it before your dashboard opens.',
            'Tuma kimojawapo. Mtu wa timu yetu atakikagua kabla dashibodi yako haijafunguka.',
          ),
          style: body(14.5, color: C.muted, height: 1.4),
        ),
        if (widget.reason != null) ...[
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: C.blush, borderRadius: BorderRadius.circular(14)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t('We could not verify you yet', 'Bado hatujaweza kukuthibitisha'),
                  style: display(15, color: C.hibiscus, weight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(widget.reason!, style: body(13.5, color: C.wino, height: 1.4)),
              ],
            ),
          ),
        ],
        const SizedBox(height: 24),
        _option(
          'nida_number',
          Icons.pin_outlined,
          t('NIDA number', 'Namba ya NIDA'),
          t('Type the 20 digits', 'Andika tarakimu 20'),
          Field(
            t('Your number', 'Namba yako'),
            controller: _number,
            hint: '19850712-14125-00001-23',
            help: t('On the front of your national ID', 'Ipo mbele ya kitambulisho chako cha taifa'),
            keyboard: TextInputType.number,
            formatters: [NidaFormatter()],
            action: TextInputAction.done,
            onSubmit: _send,
          ),
        ),
        const SizedBox(height: 14),
        _option(
          'nida_card',
          Icons.badge_outlined,
          t('Photo of your NIDA card', 'Picha ya kitambulisho cha NIDA'),
          t('The front, all four corners showing', 'Upande wa mbele, pembe zote nne zionekane'),
          _card == null
              ? Row(
                  children: [
                    Expanded(
                      child: Button(
                        t('Take a photo', 'Piga picha'),
                        icon: Icons.photo_camera_outlined,
                        tone: Tone.plain,
                        onTap: () => _pick(ImageSource.camera),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Button(
                        t('Gallery', 'Matunzio'),
                        icon: Icons.photo_library_outlined,
                        tone: Tone.plain,
                        onTap: () => _pick(ImageSource.gallery),
                      ),
                    ),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(File(_card!), height: 170, width: double.infinity, fit: BoxFit.cover),
                    ),
                    TextButton(
                      onPressed: () => setState(() => _card = null),
                      child: Text(
                        t('Use a different photo', 'Tumia picha nyingine'),
                        style: body(13.5, color: C.teal, weight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 14),
          Text(
            _error!,
            style: body(13.5, color: C.hibiscus, weight: FontWeight.w600),
          ).animate().shake(hz: 6, offset: const Offset(5, 0), duration: 320.ms),
        ],
        const SizedBox(height: 22),
        Button(t('Send for review', 'Tuma ikaguliwe'), tone: Tone.navy, busy: _busy, onTap: _send),
        const SizedBox(height: 12),
        Center(
          child: Text(
            t(
              'Only our review team sees your NIDA details.',
              'Taarifa zako za NIDA zinaonwa na timu ya ukaguzi pekee.',
            ),
            textAlign: TextAlign.center,
            style: body(12.5, color: C.muted),
          ),
        ),
      ],
    ),
  );

  /// One of the two ways to prove who you are; the chosen one opens to show its input.
  Widget _option(String method, IconData icon, String title, String subtitle, Widget input) {
    final on = _method == method;
    return Semantics(
      selected: on,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: C.card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: on ? C.teal : C.line, width: on ? 1.8 : 1.2),
        ),
        child: Column(
          children: [
            Press(
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() {
                  _method = method;
                  _error = null;
                });
              },
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: on ? C.tealLight : C.fill,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, size: 20, color: on ? C.teal : C.wino),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: display(15, color: C.wino, weight: FontWeight.w700)),
                        const SizedBox(height: 2),
                        Text(subtitle, style: body(12.5, color: C.muted)),
                      ],
                    ),
                  ),
                  Icon(
                    on ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                    color: on ? C.teal : C.faint,
                    size: 22,
                  ),
                ],
              ),
            ),
            if (on) Padding(padding: const EdgeInsets.only(top: 14), child: input),
          ],
        ),
      ),
    );
  }
}

/// Sent and waiting: something alive to look at, and a plain account of what happens next.
class _Waiting extends StatefulWidget {
  const _Waiting({super.key, required this.onRentInstead});
  final VoidCallback onRentInstead;

  @override
  State<_Waiting> createState() => _WaitingState();
}

class _WaitingState extends State<_Waiting> {
  int _tip = 0;
  late final Timer _turn;

  @override
  void initState() {
    super.initState();
    _turn = Timer.periodic(const Duration(seconds: 4), (_) => setState(() => _tip++));
  }

  @override
  void dispose() {
    _turn.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tips = [
      t('Most checks take a few minutes.', 'Ukaguzi mwingi huchukua dakika chache.'),
      t(
        'You can close the app. We keep your place in the queue.',
        'Unaweza kufunga app. Nafasi yako kwenye foleni inabaki.',
      ),
      t(
        'Next: add your first home with photos and a map pin.',
        'Kinachofuata: weka nyumba yako ya kwanza na picha na mahali kwenye ramani.',
      ),
    ];
    return CustomScrollView(
      slivers: [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 4, 24, 24),
            child: Column(
              children: [
                _leave(widget.onRentInstead),
                const Spacer(),
                const _ScanningCard(),
                const SizedBox(height: 36),
                Text(
                  t('We are checking your details', 'Tunakagua taarifa zako'),
                  textAlign: TextAlign.center,
                  style: display(25, color: C.wino, weight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  t(
                    'A person on our team is looking at them now. Your dashboard opens here by itself the moment they approve.',
                    'Mtu wa timu yetu anaziangalia sasa. Dashibodi yako itafunguka hapa yenyewe mara atakapoidhinisha.',
                  ),
                  textAlign: TextAlign.center,
                  style: body(14.5, color: C.muted, height: 1.4),
                ),
                const SizedBox(height: 28),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                  decoration: BoxDecoration(
                    color: C.chokaa,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    children: [
                      _step(
                        Icon(Icons.check_circle_rounded, color: C.teal, size: 22),
                        t('Details sent', 'Taarifa zimetumwa'),
                        done: true,
                      ),
                      _step(
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2.4, color: C.teal),
                        ),
                        t('Our team is reviewing', 'Timu yetu inakagua'),
                        active: true,
                      ),
                      _step(
                        Icon(Icons.radio_button_off_rounded, color: C.faint, size: 22),
                        t('Your dashboard opens', 'Dashibodi yako inafunguka'),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 500),
                  child: Text(
                    tips[_tip % tips.length],
                    key: ValueKey(_tip % tips.length),
                    textAlign: TextAlign.center,
                    style: body(13.5, color: C.muted),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _step(Widget mark, String label, {bool done = false, bool active = false}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 10),
    child: Row(
      children: [
        SizedBox(width: 24, child: Center(child: mark)),
        const SizedBox(width: 14),
        Text(
          label,
          style: body(
            14.5,
            color: done || active ? C.wino : C.muted,
            weight: active ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ],
    ),
  );
}

/// An ID card with a scan line sweeping over it and two rings breathing behind.
class _ScanningCard extends StatelessWidget {
  const _ScanningCard();

  @override
  Widget build(BuildContext context) {
    Widget ring(Duration delay) => Container(
      width: 190,
      height: 190,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: C.teal.withValues(alpha: .45), width: 2),
      ),
    )
        .animate(delay: delay, onPlay: (c) => c.repeat())
        .scaleXY(begin: .65, end: 1.3, duration: 2400.ms, curve: Curves.easeOut)
        .fadeOut(duration: 2400.ms, curve: Curves.easeIn);

    Widget line(double width) => Container(
      width: width,
      height: 8,
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: C.line,
        borderRadius: BorderRadius.circular(4),
      ),
    );

    return ExcludeSemantics(
      child: SizedBox(
        width: 250,
        height: 250,
        child: Stack(
          alignment: Alignment.center,
          children: [
            ring(Duration.zero),
            ring(1200.ms),
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Container(
                width: 200,
                height: 126,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: C.card,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: C.wino.withValues(alpha: .14), width: 1.5),
                ),
                child: Stack(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 54,
                          height: 66,
                          decoration: BoxDecoration(
                            color: C.tealLight,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.person_rounded, color: C.teal, size: 34),
                        ),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [line(84), line(60), line(72), line(40)],
                        ),
                      ],
                    ),
                    Center(
                      child: Container(height: 3, color: C.teal)
                          .animate(onPlay: (c) => c.repeat(reverse: true))
                          .moveY(begin: -44, end: 44, duration: 1500.ms, curve: Curves.easeInOut),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Approved: thank them, welcome them, and hand over to the profile setup.
class _Welcome extends StatelessWidget {
  const _Welcome({super.key, required this.onContinue});
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final first = '${Api.user.value?['fullname'] ?? ''}'.trim().split(' ').first;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Spacer(),
          SizedBox(
            width: 200,
            height: 200,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: C.teal, width: 3),
                  ),
                ).animate().scaleXY(begin: .6, end: 1.6, duration: 900.ms, curve: Curves.easeOut).fadeOut(duration: 900.ms),
                Container(
                  width: 116,
                  height: 116,
                  decoration: BoxDecoration(color: C.teal, shape: BoxShape.circle),
                  child: const Icon(Icons.check_rounded, color: Colors.white, size: 68),
                ).animate().scaleXY(begin: .2, end: 1, duration: 700.ms, curve: Curves.elasticOut),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Text(
            first.isEmpty ? t('Thank you!', 'Asante!') : t('Thank you, $first!', 'Asante, $first!'),
            textAlign: TextAlign.center,
            style: display(30, color: C.wino, weight: FontWeight.w800),
          ).animate(delay: 250.ms).fadeIn(duration: 400.ms).moveY(begin: 12, end: 0),
          const SizedBox(height: 10),
          Text(
            t(
              'Your identity is verified. Welcome to Panga.',
              'Utambulisho wako umethibitishwa. Karibu Panga.',
            ),
            textAlign: TextAlign.center,
            style: body(16, color: C.wino, weight: FontWeight.w600),
          ).animate(delay: 400.ms).fadeIn(duration: 400.ms).moveY(begin: 12, end: 0),
          const SizedBox(height: 8),
          Text(
            t(
              'Next we set up your landlord profile, then your dashboard is yours.',
              'Sasa tuandae wasifu wako wa mwenye nyumba, kisha dashibodi ni yako.',
            ),
            textAlign: TextAlign.center,
            style: body(14.5, color: C.muted, height: 1.4),
          ).animate(delay: 550.ms).fadeIn(duration: 400.ms),
          const Spacer(),
          Button(
            t('Set up my profile', 'Andaa wasifu wangu'),
            tone: Tone.navy,
            onTap: () {
              HapticFeedback.mediumImpact();
              onContinue();
            },
          ).animate(delay: 700.ms).fadeIn(duration: 400.ms),
        ],
      ),
    );
  }
}
