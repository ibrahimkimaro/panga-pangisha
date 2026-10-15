import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../l10n.dart';
import '../../ui.dart';

/// Utilities Coming Soon Screen with animated shimmer placeholders
/// and smart IoT telemetry preview.
class UtilitiesComingSoonTab extends StatefulWidget {
  const UtilitiesComingSoonTab({super.key});

  @override
  State<UtilitiesComingSoonTab> createState() => _UtilitiesComingSoonTabState();
}

class _UtilitiesComingSoonTabState extends State<UtilitiesComingSoonTab> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: C.chokaa,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // Top App Bar Header
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
              sliver: SliverToBoxAdapter(
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.water_drop_rounded, color: Color(0xFF0284C7), size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t('Smart Utilities & IoT', 'Huduma na Vifaa Janja'),
                            style: display(18, weight: FontWeight.w800),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            t('Real-time electricity & water tracking', 'Ufuatiliaji wa umeme na maji mubashara'),
                            style: body(12, color: C.muted),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6366F1).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.auto_awesome, size: 12, color: Color(0xFF6366F1)),
                          const SizedBox(width: 4),
                          Text(
                            t('Coming Soon', 'Inakuja'),
                            style: body(11, weight: FontWeight.w700, color: const Color(0xFF6366F1)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Hero Banner Card
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              sliver: SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF0F1E36), Color(0xFF1E293B)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.bolt_rounded, color: Color(0xFF38BDF8), size: 20),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              t('Smart Metering in Development', 'Vipima Umeme Janja Vinaandaliwa'),
                              style: display(15, color: Colors.white, weight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        t(
                          'We are building automated sub-meter tracking, remote disconnects, instant leak detection, and AI utility forecasting for your rental properties.',
                          'Tunaunda ufuatiliaji wa vipima umeme/maji kiotomatiki, kufunga huduma kwa mbali, kugundua uvujaji mara moja, na utabiri wa AI wa matumizi.',
                        ),
                        style: body(12.5, color: const Color(0xFFCBD5E1), height: 1.4),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              t('Live Telemetry Preview Below', 'Hakiki Mfumo Hapa Chini'),
                              style: body(11, color: const Color(0xFF34D399), weight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Shimmering Preview Section Title
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
              sliver: SliverToBoxAdapter(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      t('Live Sub-Meter Preview', 'Mwonekano wa Vipimo vya Kidijitali'),
                      style: display(15, weight: FontWeight.w700),
                    ),
                    Text(
                      t('Simulated', 'Majaribio'),
                      style: body(11.5, color: C.muted, weight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ),

            // Shimmer Card 1: Electricity Sub-metering
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              sliver: SliverToBoxAdapter(
                child: _buildShimmerCard(
                  icon: Icons.electric_bolt_rounded,
                  iconColor: const Color(0xFFF59E0B),
                  title: t('Electricity Consumption', 'Matumizi ya Umeme'),
                  metric: '18,460 kWh',
                  unitSubtitle: t('Across 4 Properties • 14 Units', 'Kwenye Majengo 4 • Vyumba 14'),
                  barsCount: 7,
                ),
              ),
            ),

            // Shimmer Card 2: Smart Water Flow
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              sliver: SliverToBoxAdapter(
                child: _buildShimmerCard(
                  icon: Icons.water_drop_rounded,
                  iconColor: const Color(0xFF0284C7),
                  title: t('Water Flow & Pressure', 'Mtiririko wa Maji na Mgandamizo'),
                  metric: '5,320 m³',
                  unitSubtitle: t('Normal Pressure • Zero Leaks Detected', 'Mgandamizo wa Kawaida • Hakuna Uvujaji'),
                  barsCount: 5,
                ),
              ),
            ),

            // Shimmer Card 3: Automated Luku Prepaid Sync
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              sliver: SliverToBoxAdapter(
                child: _buildShimmerCard(
                  icon: Icons.cell_tower_rounded,
                  iconColor: const Color(0xFF10B981),
                  title: t('IoT Gateway Status', 'Hali ya Gateway ya IoT'),
                  metric: '14 / 14 Online',
                  unitSubtitle: t('All smart meters connected and streaming', 'Vipima vyote vimeunganishwa'),
                  barsCount: 4,
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String metric,
    required String unitSubtitle,
    required int barsCount,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: body(13, weight: FontWeight.w700)),
                    Text(unitSubtitle, style: body(11, color: C.muted)),
                  ],
                ),
              ),
              Text(metric, style: display(15, weight: FontWeight.w800)),
            ],
          ),
          const SizedBox(height: 16),
          // Animated shimmering placeholder bars
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(barsCount, (index) {
              final heights = [38.0, 56.0, 42.0, 68.0, 50.0, 78.0, 62.0];
              final h = heights[index % heights.length];
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Container(
                    height: h,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  )
                      .animate(onPlay: (controller) => controller.repeat())
                      .shimmer(
                        duration: 1500.ms,
                        delay: (index * 120).ms,
                        color: Colors.white.withValues(alpha: 0.7),
                      ),
                ),
              );
            }),
          ),
          const SizedBox(height: 14),
          // Skeleton detail rows
          Row(
            children: [
              Container(
                width: 80,
                height: 12,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(4),
                ),
              )
                  .animate(onPlay: (controller) => controller.repeat())
                  .shimmer(duration: 1500.ms, color: Colors.white),
              const Spacer(),
              Container(
                width: 110,
                height: 12,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(4),
                ),
              )
                  .animate(onPlay: (controller) => controller.repeat())
                  .shimmer(duration: 1500.ms, color: Colors.white),
            ],
          ),
        ],
      ),
    );
  }
}
