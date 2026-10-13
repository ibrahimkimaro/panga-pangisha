import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../l10n.dart';
import '../ui.dart';

/// Screen 1: Official App Splash / Loading Screen
/// Features the full-screen luxury hero background image, brand ribbon logo,
/// and smooth "Loading your space..." circular indicator.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, required this.onFinished});
  final VoidCallback onFinished;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // Preload display duration, then smoothly transition
    _timer = Timer(const Duration(milliseconds: 2200), () {
      if (mounted) widget.onFinished();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _skip() {
    _timer?.cancel();
    HapticFeedback.lightImpact();
    widget.onFinished();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: C.navy,
        body: GestureDetector(
          onTap: _skip,
          behavior: HitTestBehavior.opaque,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // 1. Full-screen background image
              Image.asset(
                'assets/images/welcome_hero.jpg',
                fit: BoxFit.cover,
              ),

              // 2. Rich atmospheric navy/teal gradient overlay
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        C.navy.withValues(alpha: .62),
                        C.navy.withValues(alpha: .82),
                        C.navy.withValues(alpha: .96),
                      ],
                      stops: const [0.0, 0.50, 1.0],
                    ),
                  ),
                ),
              ),

              // Ambient glowing teal orb
              Positioned(
                top: -60,
                right: -60,
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        C.teal.withValues(alpha: .30),
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
                    children: [
                      // Top bar with language switcher
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: const [
                          LangSwitch(dark: true),
                        ],
                      ),

                      const Spacer(flex: 3),

                      // Brand Ribbon Logo with smooth zoom-in & glow
                      const _SplashRibbonLogo(size: 68)
                          .animate()
                          .fadeIn(duration: 600.ms)
                          .scale(
                            begin: const Offset(0.7, 0.7),
                            end: const Offset(1.0, 1.0),
                            curve: Curves.easeOutBack,
                          ),
                      const SizedBox(height: 16),

                      Text(
                        'Panga',
                        style: display(36, color: Colors.white, weight: FontWeight.w800),
                      ).animate().fadeIn(delay: 200.ms, duration: 500.ms),

                      const SizedBox(height: 8),

                      Text(
                        t('Better Homes, Stronger Communities.', 'Makazi Bora, Jamii Imara.'),
                        textAlign: TextAlign.center,
                        style: body(
                          15.5,
                          color: Colors.white.withValues(alpha: .85),
                          weight: FontWeight.w400,
                        ),
                      ).animate().fadeIn(delay: 350.ms, duration: 500.ms),

                      const Spacer(flex: 4),

                      // Bottom subtle loading animation & tap prompt
                      Column(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: .12),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: CircularProgressIndicator(
                              strokeWidth: 2.2,
                              valueColor: AlwaysStoppedAnimation<Color>(C.tealBright),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            t('Loading your space...', 'Inaandaa makazi yako...'),
                            style: body(13, color: Colors.white.withValues(alpha: .7)),
                          ),
                        ],
                      ).animate().fadeIn(delay: 500.ms),

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SplashRibbonLogo extends StatelessWidget {
  const _SplashRibbonLogo({this.size = 54});
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _SplashRibbonPainter(),
      ),
    );
  }
}

class _SplashRibbonPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final glow = Paint()
      ..color = C.tealBright.withValues(alpha: .45)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10);

    final path1 = Path()
      ..moveTo(w * 0.18, h * 0.72)
      ..cubicTo(w * 0.22, h * 0.30, w * 0.38, h * 0.15, w * 0.50, h * 0.40)
      ..cubicTo(w * 0.60, h * 0.60, w * 0.75, h * 0.82, w * 0.84, h * 0.32);

    final paintGlow = Paint()
      ..shader = LinearGradient(
        colors: [C.tealBright, Color(0xFF38BDF8), Color(0xFF818CF8)],
      ).createShader(Rect.fromLTWH(0, 0, w, h))
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.16
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(path1, glow);
    canvas.drawPath(path1, paintGlow);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
