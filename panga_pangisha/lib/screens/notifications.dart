import 'package:flutter/material.dart';

import '../api.dart';
import '../l10n.dart';
import '../ui.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(t('Notifications', 'Arifa'))),
    body: Loader<List>(
      load: () async {
        final items = (await Api.get('notifications'))['items'] as List;
        Api.post(
          'notifications/read-all',
        ).ignore(); // opening the list reads them
        return items;
      },
      bones: ListView(
        padding: const EdgeInsets.all(20),
        children: const [
          Bone(height: 64, radius: 18),
          SizedBox(height: 12),
          Bone(height: 64, radius: 18),
        ],
      ),
      builder: (context, items, reload) => RefreshIndicator(
        color: C.mkoko,
        onRefresh: reload,
        child: items.isEmpty
            ? ListView(
                children: [
                  SizedBox(
                    height: 460,
                    child: Notice(
                      icon: Icons.notifications_none_rounded,
                      title: t('Nothing new', 'Hakuna jipya'),
                      text: t(
                        'Viewing requests and replies show up here.',
                        'Maombi ya kuona nyumba na majibu yataonekana hapa.',
                      ),
                    ),
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final n = items[i];
                  final unread = n['read'] != true;
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: unread ? C.leaf : C.card,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          n['kind'] == 'viewing'
                              ? Icons.event_outlined
                              : Icons.notifications_none_rounded,
                          color: C.teal,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${n['title']}',
                                style: body(15.5, weight: FontWeight.w600),
                              ),
                              Text(
                                '${n['body']}',
                                style: body(14.5, color: C.muted, height: 1.35),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                ago(DateTime.parse(n['created_at'])),
                                style: body(12.5, color: C.muted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ).reveal(i.clamp(0, 6));
                },
              ),
      ),
    ),
  );
}
