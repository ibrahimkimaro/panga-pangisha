import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../l10n.dart';
import '../ui.dart';

/// Master adaptive presentation renderer for Veyora AI responses in Flutter.
class VeyoraAdaptivePresentation extends StatelessWidget {
  const VeyoraAdaptivePresentation({
    super.key,
    required this.presentation,
    required this.content,
    this.title,
    this.structuredData,
    this.actions = const [],
    this.pagination,
    this.onAction,
  });

  final String presentation;
  final String content;
  final String? title;
  final Map<String, dynamic>? structuredData;
  final List<dynamic> actions;
  final Map<String, dynamic>? pagination;
  final void Function(Map<String, dynamic> action)? onAction;

  @override
  Widget build(BuildContext context) {
    if (structuredData == null || presentation == 'text') {
      return Text(
        content,
        style: body(14, color: C.wino, height: 1.45),
      );
    }

    switch (presentation) {
      case 'summary':
        return VeyoraSummaryCard(
          title: title,
          summary: content,
          data: structuredData!,
          actions: actions,
          onAction: onAction,
        );
      case 'entity_list':
        return VeyoraEntityListCard(
          title: title,
          summary: content,
          data: structuredData!,
          actions: actions,
          onAction: onAction,
        );
      case 'table':
        return VeyoraMobileTable(
          title: title,
          summary: content,
          data: structuredData!,
          actions: actions,
          onAction: onAction,
        );
      case 'chart':
        return VeyoraMobileChart(
          title: title,
          summary: content,
          data: structuredData!,
          actions: actions,
          onAction: onAction,
        );
      case 'detail':
        return VeyoraDetailCard(
          title: title,
          summary: content,
          data: structuredData!,
          actions: actions,
          onAction: onAction,
        );
      case 'alert_list':
        return VeyoraAlertListCard(
          title: title,
          summary: content,
          data: structuredData!,
          actions: actions,
          onAction: onAction,
        );
      case 'action_list':
        return VeyoraActionListCard(
          title: title,
          summary: content,
          data: structuredData!,
          onAction: onAction,
        );
      case 'report':
        return VeyoraReportCard(
          title: title,
          summary: content,
          data: structuredData!,
          actions: actions,
          onAction: onAction,
        );
      default:
        return Text(
          content,
          style: body(14, color: C.wino, height: 1.45),
        );
    }
  }
}

/// 1. KPI Summary Card
class VeyoraSummaryCard extends StatelessWidget {
  const VeyoraSummaryCard({
    super.key,
    this.title,
    required this.summary,
    required this.data,
    this.actions = const [],
    this.onAction,
  });

  final String? title;
  final String summary;
  final Map<String, dynamic> data;
  final List<dynamic> actions;
  final void Function(Map<String, dynamic> action)? onAction;

  @override
  Widget build(BuildContext context) {
    final metrics = (data['metrics'] as List?) ?? [];
    final period = data['period'] as Map<String, dynamic>?;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title!,
                  style: display(15, weight: FontWeight.w700),
                ),
              ),
              if (period != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: C.teal.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${period['label']} (${period['currency'] ?? 'TZS'})',
                    style: body(10, color: C.teal, weight: FontWeight.w600),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
        ],
        Text(
          summary,
          style: body(13, color: C.wino, height: 1.4),
        ),
        const SizedBox(height: 10),
        // Metrics Grid
        LayoutBuilder(
          builder: (context, constraints) {
            return Wrap(
              spacing: 8,
              runSpacing: 8,
              children: metrics.map<Widget>((m) {
                final metric = Map<String, dynamic>.from(m as Map);
                final width = (constraints.maxWidth - 8) / 2;
                return Container(
                  width: width > 130 ? width : constraints.maxWidth,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: C.chokaa.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: C.line),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        metric['label']?.toString() ?? '',
                        style: body(11, color: C.muted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        metric['value']?.toString() ?? '',
                        style: display(15, weight: FontWeight.w800),
                      ),
                      if (metric['trend'] != null) ...[
                        const SizedBox(height: 3),
                        Text(
                          metric['trend'].toString(),
                          style: body(10, color: C.teal, weight: FontWeight.w600),
                        ),
                      ],
                    ],
                  ),
                );
              }).toList(),
            );
          },
        ),
        if (actions.isNotEmpty) _buildActions(actions, onAction),
      ],
    );
  }
}

/// 2. Entity List Card (Compact & Expandable on Mobile)
class VeyoraEntityListCard extends StatefulWidget {
  const VeyoraEntityListCard({
    super.key,
    this.title,
    required this.summary,
    required this.data,
    this.actions = const [],
    this.onAction,
  });

  final String? title;
  final String summary;
  final Map<String, dynamic> data;
  final List<dynamic> actions;
  final void Function(Map<String, dynamic> action)? onAction;

  @override
  State<VeyoraEntityListCard> createState() => _VeyoraEntityListCardState();
}

class _VeyoraEntityListCardState extends State<VeyoraEntityListCard> {
  final Set<String> _expandedIds = {};

  @override
  Widget build(BuildContext context) {
    final items = (widget.data['items'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.title != null) ...[
          Text(widget.title!, style: display(15, weight: FontWeight.w700)),
          const SizedBox(height: 4),
        ],
        Text(widget.summary, style: body(13, color: C.wino, height: 1.4)),
        const SizedBox(height: 10),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, i) {
            final item = Map<String, dynamic>.from(items[i] as Map);
            final id = item['id'].toString();
            final isExpanded = _expandedIds.contains(id);

            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: C.chokaa.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: isExpanded ? C.teal : C.line),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['title']?.toString() ?? '',
                              style: body(13, weight: FontWeight.w700),
                            ),
                            if (item['subtitle'] != null)
                              Text(
                                item['subtitle'].toString(),
                                style: body(11, color: C.muted),
                              ),
                          ],
                        ),
                      ),
                      if (item['badge'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: C.teal.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            item['badge'].toString(),
                            style: body(10, color: C.teal, weight: FontWeight.w600),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item['price']?.toString() ?? '',
                        style: display(14, weight: FontWeight.w800, color: C.teal),
                      ),
                      Press(
                        onTap: () {
                          setState(() {
                            if (isExpanded) {
                              _expandedIds.remove(id);
                            } else {
                              _expandedIds.add(id);
                            }
                          });
                        },
                        child: Row(
                          children: [
                            Text(
                              isExpanded ? t('Less', 'Punguza') : t('Details', 'Maelezo'),
                              style: body(11, color: C.teal, weight: FontWeight.w600),
                            ),
                            Icon(
                              isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                              size: 16,
                              color: C.teal,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (isExpanded && item['specs'] != null) ...[
                    const Divider(height: 14),
                    Text(
                      item['specs'].toString(),
                      style: body(11, color: C.muted),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
        if (widget.actions.isNotEmpty) _buildActions(widget.actions, widget.onAction),
      ],
    );
  }
}

/// 3. Mobile Table (Horizontal scroll with sticky style)
class VeyoraMobileTable extends StatelessWidget {
  const VeyoraMobileTable({
    super.key,
    this.title,
    required this.summary,
    required this.data,
    this.actions = const [],
    this.onAction,
  });

  final String? title;
  final String summary;
  final Map<String, dynamic> data;
  final List<dynamic> actions;
  final void Function(Map<String, dynamic> action)? onAction;

  @override
  Widget build(BuildContext context) {
    final columns = (data['columns'] as List?) ?? [];
    final rows = (data['rows'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Text(title!, style: display(15, weight: FontWeight.w700)),
          const SizedBox(height: 4),
        ],
        Text(summary, style: body(13, color: C.wino, height: 1.4)),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: C.line),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingRowHeight: 36,
              dataRowMinHeight: 36,
              dataRowMaxHeight: 46,
              horizontalMargin: 12,
              columnSpacing: 16,
              headingRowColor: WidgetStatePropertyAll(C.chokaa.withValues(alpha: 0.7)),
              columns: columns.map<DataColumn>((col) {
                final c = Map<String, dynamic>.from(col as Map);
                return DataColumn(
                  label: Text(
                    c['label']?.toString() ?? '',
                    style: body(11, weight: FontWeight.w700),
                  ),
                );
              }).toList(),
              rows: rows.map<DataRow>((r) {
                final row = Map<String, dynamic>.from(r as Map);
                return DataRow(
                  cells: columns.map<DataCell>((col) {
                    final key = col['key']?.toString() ?? '';
                    final val = row[key];
                    final format = col['format']?.toString();
                    String displayVal = val?.toString() ?? '—';
                    if (format == 'currency' && val is num) {
                      displayVal = 'TZS ${val.toInt()}';
                    }
                    return DataCell(
                      Text(displayVal, style: body(11)),
                    );
                  }).toList(),
                );
              }).toList(),
            ),
          ),
        ),
        if (actions.isNotEmpty) _buildActions(actions, onAction),
      ],
    );
  }
}

/// 4. Mobile Chart (Animated Bar Chart with Accessible Text)
class VeyoraMobileChart extends StatelessWidget {
  const VeyoraMobileChart({
    super.key,
    this.title,
    required this.summary,
    required this.data,
    this.actions = const [],
    this.onAction,
  });

  final String? title;
  final String summary;
  final Map<String, dynamic> data;
  final List<dynamic> actions;
  final void Function(Map<String, dynamic> action)? onAction;

  @override
  Widget build(BuildContext context) {
    final labels = (data['labels'] as List?) ?? [];
    final series = (data['series'] as List?) ?? [];
    final firstSeries = series.isNotEmpty ? (series[0]['data'] as List? ?? []) : [];
    final unit = data['unit']?.toString() ?? '';
    final accessibleSummary = data['accessible_summary']?.toString() ?? '';

    num maxVal = 1;
    for (final v in firstSeries) {
      if (v is num && v > maxVal) maxVal = v;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Text(title!, style: display(15, weight: FontWeight.w700)),
          const SizedBox(height: 4),
        ],
        Text(summary, style: body(13, color: C.wino, height: 1.4)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: C.chokaa.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: C.line),
          ),
          child: Column(
            children: [
              SizedBox(
                height: 120,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: List.generate(labels.length, (i) {
                    final val = (i < firstSeries.length && firstSeries[i] is num)
                        ? (firstSeries[i] as num)
                        : 0;
                    final ratio = (val / maxVal).clamp(0.08, 1.0);

                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text(
                              '$val $unit',
                              style: body(9, color: C.muted),
                            ),
                            const SizedBox(height: 3),
                            FractionallySizedBox(
                              heightFactor: ratio.toDouble(),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: C.teal,
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              labels[i].toString().split(' ').first,
                              style: body(10, color: C.muted, weight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ),
              ),
              if (accessibleSummary.isNotEmpty) ...[
                const Divider(height: 18),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, size: 14, color: C.teal),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        accessibleSummary,
                        style: body(11, color: C.muted, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        if (actions.isNotEmpty) _buildActions(actions, onAction),
      ],
    );
  }
}

/// 5. Entity Detail Card
class VeyoraDetailCard extends StatelessWidget {
  const VeyoraDetailCard({
    super.key,
    this.title,
    required this.summary,
    required this.data,
    this.actions = const [],
    this.onAction,
  });

  final String? title;
  final String summary;
  final Map<String, dynamic> data;
  final List<dynamic> actions;
  final void Function(Map<String, dynamic> action)? onAction;

  @override
  Widget build(BuildContext context) {
    final profile = (data['profile'] as Map<String, dynamic>?) ?? {};
    final sections = (data['sections'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Text(title!, style: display(15, weight: FontWeight.w700)),
          const SizedBox(height: 4),
        ],
        Text(summary, style: body(13, color: C.wino, height: 1.4)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: C.chokaa.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: C.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    profile['unit_number'] != null
                        ? 'Unit ${profile['unit_number']}'
                        : (profile['property_name']?.toString() ?? 'Profile'),
                    style: display(16, weight: FontWeight.w800),
                  ),
                  if (profile['monthly_rent'] != null)
                    Text(
                      'TZS ${profile['monthly_rent']}',
                      style: display(15, weight: FontWeight.w800, color: C.teal),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              ...sections.map<Widget>((sec) {
                final s = Map<String, dynamic>.from(sec as Map);
                final items = (s['items'] as List?) ?? [];
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s['title']?.toString() ?? '',
                        style: body(11, weight: FontWeight.w700, color: C.muted),
                      ),
                      const SizedBox(height: 4),
                      ...items.map<Widget>((it) {
                        final item = Map<String, dynamic>.from(it as Map);
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(item['label']?.toString() ?? '', style: body(11, color: C.muted)),
                              Text(item['value']?.toString() ?? '', style: body(11, weight: FontWeight.w600)),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
        if (actions.isNotEmpty) _buildActions(actions, onAction),
      ],
    );
  }
}

/// 6. Alert List Card (Overdue rent, maintenance, offline meter)
class VeyoraAlertListCard extends StatelessWidget {
  const VeyoraAlertListCard({
    super.key,
    this.title,
    required this.summary,
    required this.data,
    this.actions = const [],
    this.onAction,
  });

  final String? title;
  final String summary;
  final Map<String, dynamic> data;
  final List<dynamic> actions;
  final void Function(Map<String, dynamic> action)? onAction;

  @override
  Widget build(BuildContext context) {
    final alerts = (data['alerts'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Row(
            children: [
              Icon(Icons.warning_amber_rounded, size: 18, color: C.shaba),
              const SizedBox(width: 6),
              Expanded(
                child: Text(title!, style: display(15, weight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 4),
        ],
        Text(summary, style: body(13, color: C.wino, height: 1.4)),
        const SizedBox(height: 10),
        ...alerts.map<Widget>((a) {
          final alert = Map<String, dynamic>.from(a as Map);
          final severity = alert['severity']?.toString() ?? 'warning';
          final isCritical = severity == 'critical';

          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isCritical
                  ? C.hibiscus.withValues(alpha: 0.08)
                  : C.shaba.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isCritical
                    ? C.hibiscus.withValues(alpha: 0.3)
                    : C.shaba.withValues(alpha: 0.3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        alert['title']?.toString() ?? '',
                        style: body(13, weight: FontWeight.w700),
                      ),
                    ),
                    if (alert['days_overdue'] != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isCritical ? C.hibiscus : C.shaba,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${alert['days_overdue']}d late',
                          style: body(9, color: Colors.white, weight: FontWeight.w700),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  alert['message']?.toString() ?? '',
                  style: body(11, color: C.muted),
                ),
                if (alert['action'] != null) ...[
                  const SizedBox(height: 8),
                  Press(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      final act = Map<String, dynamic>.from(alert['action'] as Map);
                      onAction?.call(act);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: C.card,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: C.line),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.send_rounded, size: 12, color: C.teal),
                          const SizedBox(width: 4),
                          Text(
                            alert['action']['label']?.toString() ?? 'Action',
                            style: body(11, color: C.teal, weight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        }),
        if (actions.isNotEmpty) _buildActions(actions, onAction),
      ],
    );
  }
}

/// 7. Action List Card
class VeyoraActionListCard extends StatelessWidget {
  const VeyoraActionListCard({
    super.key,
    this.title,
    required this.summary,
    required this.data,
    this.onAction,
  });

  final String? title;
  final String summary;
  final Map<String, dynamic> data;
  final void Function(Map<String, dynamic> action)? onAction;

  @override
  Widget build(BuildContext context) {
    final actions = (data['actions'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Text(title!, style: display(15, weight: FontWeight.w700)),
          const SizedBox(height: 4),
        ],
        Text(summary, style: body(13, color: C.wino, height: 1.4)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: actions.map<Widget>((act) {
            final a = Map<String, dynamic>.from(act as Map);
            return Press(
              onTap: () {
                HapticFeedback.lightImpact();
                onAction?.call(a);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: C.teal.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: C.teal.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.arrow_forward_rounded, size: 14, color: C.teal),
                    const SizedBox(width: 6),
                    Text(
                      a['label']?.toString() ?? '',
                      style: body(12, color: C.teal, weight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

/// 8. Executive Report Card
class VeyoraReportCard extends StatelessWidget {
  const VeyoraReportCard({
    super.key,
    this.title,
    required this.summary,
    required this.data,
    this.actions = const [],
    this.onAction,
  });

  final String? title;
  final String summary;
  final Map<String, dynamic> data;
  final List<dynamic> actions;
  final void Function(Map<String, dynamic> action)? onAction;

  @override
  Widget build(BuildContext context) {
    final kpis = (data['kpis'] as List?) ?? [];
    final sections = (data['sections'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.analytics_rounded, size: 18, color: C.teal),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                title ?? 'Executive Report',
                style: display(15, weight: FontWeight.w700),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: C.teal.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            summary,
            style: body(12, color: C.wino, height: 1.4),
          ),
        ),
        const SizedBox(height: 10),
        if (kpis.isNotEmpty)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: kpis.map<Widget>((k) {
              final kpi = Map<String, dynamic>.from(k as Map);
              return Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: C.card,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: C.line),
                ),
                child: Column(
                  children: [
                    Text(kpi['label']?.toString() ?? '', style: body(10, color: C.muted)),
                    Text(kpi['value']?.toString() ?? '', style: display(13, weight: FontWeight.w700)),
                  ],
                ),
              );
            }).toList(),
          ),
        ...sections.map<Widget>((sec) {
          final s = Map<String, dynamic>.from(sec as Map);
          return Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s['title']?.toString() ?? '', style: body(12, weight: FontWeight.w700)),
                if (s['content'] != null)
                  Text(s['content'].toString(), style: body(11, color: C.muted)),
              ],
            ),
          );
        }),
        if (actions.isNotEmpty) _buildActions(actions, onAction),
      ],
    );
  }
}

Widget _buildActions(List<dynamic> actions, void Function(Map<String, dynamic> action)? onAction) {
  return Padding(
    padding: const EdgeInsets.only(top: 10),
    child: Wrap(
      spacing: 6,
      runSpacing: 6,
      children: actions.map<Widget>((act) {
        final a = Map<String, dynamic>.from(act as Map);
        return Press(
          onTap: () {
            HapticFeedback.lightImpact();
            onAction?.call(a);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: C.teal,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              a['label']?.toString() ?? 'Action',
              style: body(11, color: Colors.white, weight: FontWeight.w600),
            ),
          ),
        );
      }).toList(),
    ),
  );
}
