import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../api.dart';
import '../l10n.dart';
import '../live.dart';
import '../ui.dart';
import 'chat.dart';

String _role(Object? role) => switch (role) {
  'landlord' => t('Landlord', 'Mwenye nyumba'),
  'investor' => t('Investor', 'Mwekezaji'),
  _ => t('Tenant', 'Mpangaji'),
};

/// People on Panga, found by name (or by typing a full phone number). The server sends names,
/// roles and photos only. [builder] draws the result; the search box above it is shared.
class _PeopleSearch extends StatefulWidget {
  const _PeopleSearch({required this.builder});
  final Widget Function(BuildContext, List<Map<String, dynamic>> people, bool loading, String? error, String query) builder;

  @override
  State<_PeopleSearch> createState() => _PeopleSearchState();
}

class _PeopleSearchState extends State<_PeopleSearch> {
  final _box = TextEditingController();
  Timer? _pause;
  List<Map<String, dynamic>> _people = [];
  bool _loading = true;
  String? _error;
  String _query = '';
  int _asked = 0;

  @override
  void initState() {
    super.initState();
    _find('');
  }

  @override
  void dispose() {
    _pause?.cancel();
    _box.dispose();
    super.dispose();
  }

  /// Waits for a short pause in typing, so a name does not cost a request per letter.
  void _typed(String text) {
    _pause?.cancel();
    _pause = Timer(const Duration(milliseconds: 280), () => _find(text.trim()));
  }

  Future<void> _find(String q) async {
    final mine = ++_asked;
    setState(() {
      _query = q;
      _loading = true;
      _error = null;
    });
    try {
      final res = await Api.get('people', {'q': q});
      if (!mounted || mine != _asked) return; // an older answer arriving late
      setState(() {
        _people = [for (final p in res as List) Map<String, dynamic>.from(p as Map)];
        _loading = false;
      });
    } on ApiError catch (e) {
      if (mounted && mine == _asked) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 10),
        child: Glass(
          radius: 16,
          padding: EdgeInsets.zero,
          child: TextField(
            controller: _box,
            onChanged: _typed,
            textInputAction: TextInputAction.search,
            style: body(14.5),
            decoration: InputDecoration(
              filled: false,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 13),
              prefixIcon: Icon(Icons.search_rounded, color: C.muted, size: 20),
              hintText: t('Search a name or phone number', 'Tafuta jina au namba ya simu'),
              hintStyle: body(14, color: C.muted),
            ),
          ),
        ),
      ),
      Expanded(child: widget.builder(context, _people, _loading, _error, _query)),
    ],
  );
}

/// What a people list shows while it loads, fails or finds nobody.
Widget? _state(bool loading, String? error, List people, String query) {
  if (loading && people.isEmpty) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      children: const [Bone(height: 60, radius: 18), SizedBox(height: 8), Bone(height: 60, radius: 18), SizedBox(height: 8), Bone(height: 60, radius: 18)],
    );
  }
  if (error != null) return Notice(icon: Icons.cloud_off_outlined, title: t('Could not load people', 'Imeshindwa kupakia watu'), text: error);
  if (people.isEmpty) {
    return Notice(
      icon: Icons.person_search_outlined,
      title: t('Nobody found', 'Hakuna aliyepatikana'),
      text: query.isEmpty
          ? t('Nobody else has joined yet.', 'Bado hakuna mwingine aliyejiunga.')
          : t('Check the spelling, or type their full phone number.', 'Angalia herufi, au andika namba yao kamili ya simu.'),
    );
  }
  return null;
}

/// One person in a list: face (green dot when online), name, role, and whatever sits at the end.
class _PersonTile extends StatelessWidget {
  const _PersonTile(this.p, {required this.onTap, this.trailing});
  final Map<String, dynamic> p;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Press(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 7),
      child: Row(
        children: [
          ListenableBuilder(
            listenable: Live.online,
            builder: (_, _) => Face('${p['fullname']}', Api.img(p['profile_image']), online: Live.online.value.contains(p['uuid']), size: 44),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${p['fullname']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: body(15, weight: FontWeight.w600)),
                Text(_role(p['role']), style: body(12.5, color: C.muted, height: 1.25)),
              ],
            ),
          ),
          ?trailing,
        ],
      ),
    ),
  );
}

Widget _topBar(BuildContext context, String title, String subtitle) => Padding(
  padding: const EdgeInsets.fromLTRB(6, 6, 20, 4),
  child: Row(
    children: [
      IconButton(
        tooltip: t('Back', 'Rudi'),
        icon: Icon(Icons.arrow_back_rounded, color: C.wino),
        onPressed: () => Navigator.maybePop(context),
      ),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: display(19, weight: FontWeight.w800)),
            Text(subtitle, style: body(12.5, color: C.muted, height: 1.25)),
          ],
        ),
      ),
    ],
  ),
);

/// Messages > New chat: find a person and open a conversation with them, or start a group.
/// Closes with the [ChatScreen] to open, so "back" from that chat lands on the inbox.
class NewChatScreen extends StatelessWidget {
  const NewChatScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    body: GlassBackdrop(
      child: SafeArea(
        child: Column(
          children: [
            _topBar(context, t('New chat', 'Mazungumzo mapya'), t('Choose someone to message', 'Chagua wa kumwandikia')),
            Expanded(
              child: _PeopleSearch(
                builder: (context, people, loading, error, query) {
                  final group = query.isEmpty
                      ? Press(
                          onTap: () async {
                            HapticFeedback.selectionClick();
                            final chat = await push<ChatScreen>(context, const NewGroupScreen());
                            if (chat != null && context.mounted) Navigator.pop(context, chat);
                          },
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 2, 20, 10),
                            child: Glass(
                              radius: 18,
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(color: C.mkoko, shape: BoxShape.circle),
                                    child: const Icon(Icons.group_add_rounded, color: Colors.white, size: 22),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(t('New group', 'Kikundi kipya'), style: body(15, weight: FontWeight.w700)),
                                        Text(t('Talk with several people at once', 'Ongea na watu kadhaa kwa pamoja'), style: body(12.5, color: C.muted, height: 1.25)),
                                      ],
                                    ),
                                  ),
                                  Icon(Icons.chevron_right_rounded, color: C.muted),
                                ],
                              ),
                            ),
                          ),
                        ).reveal(0)
                      : null;
                  final state = _state(loading, error, people, query);
                  if (state != null) return Column(children: [?group, Expanded(child: state)]);
                  return ListView.builder(
                    padding: const EdgeInsets.only(bottom: 24),
                    itemCount: people.length + 2,
                    itemBuilder: (context, i) {
                      if (i == 0) return group ?? const SizedBox.shrink();
                      if (i == 1) {
                        return Padding(
                          padding: const EdgeInsets.fromLTRB(20, 6, 20, 6),
                          child: Text(
                            query.isEmpty ? t('People on Panga', 'Watu walio Panga') : t('Found', 'Waliopatikana'),
                            style: body(12.5, color: C.muted, weight: FontWeight.w600),
                          ),
                        );
                      }
                      final p = people[i - 2];
                      return _PersonTile(
                        p,
                        onTap: () => Navigator.pop(
                          context,
                          ChatScreen(peerId: p['id'], name: '${p['fullname']}', photo: Api.img(p['profile_image'])),
                        ),
                        trailing: Icon(Icons.chat_bubble_outline_rounded, color: C.teal, size: 20),
                      ).reveal((i - 1).clamp(0, 7));
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

/// New group, in two steps like the familiar chat apps: tick the people, then name the group.
class NewGroupScreen extends StatefulWidget {
  const NewGroupScreen({super.key});

  @override
  State<NewGroupScreen> createState() => _NewGroupScreenState();
}

class _NewGroupScreenState extends State<NewGroupScreen> {
  final _picked = <Map<String, dynamic>>[]; // in the order they were ticked
  final _name = TextEditingController();
  bool _naming = false, _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  bool _has(Map<String, dynamic> p) => _picked.any((x) => x['id'] == p['id']);

  void _toggle(Map<String, dynamic> p) {
    HapticFeedback.selectionClick();
    setState(() => _has(p) ? _picked.removeWhere((x) => x['id'] == p['id']) : _picked.add(p));
  }

  Future<void> _create() async {
    final name = _name.text.trim();
    if (name.isEmpty) return setState(() => _error = t('Give the group a name', 'Kipe kikundi jina'));
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await Api.post('chat/groups', {'name': name, 'member_ids': [for (final p in _picked) p['id']]});
      HapticFeedback.mediumImpact();
      if (!mounted) return;
      Navigator.pop(context, ChatScreen(name: name, groupSlug: '${res['group']['slug']}', members: res['group']['members'] ?? _picked.length + 1));
    } on ApiError catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_naming,
    onPopInvokedWithResult: (popped, _) {
      if (!popped) setState(() => _naming = false); // back from "name it" returns to the people
    },
    child: Scaffold(
      body: GlassBackdrop(
        child: SafeArea(
          child: Column(
            children: [
              _topBar(
                context,
                t('New group', 'Kikundi kipya'),
                _naming
                    ? t('Name your group', 'Kipe kikundi jina')
                    : _picked.isEmpty
                    ? t('Add people', 'Ongeza watu')
                    : t('${_picked.length} chosen', '${_picked.length} wamechaguliwa'),
              ),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 320),
                  switchInCurve: Curves.easeOutCubic,
                  transitionBuilder: (child, a) => FadeTransition(
                    opacity: a,
                    child: SlideTransition(position: Tween(begin: const Offset(.06, 0), end: Offset.zero).animate(a), child: child),
                  ),
                  child: _naming ? _nameStep() : _peopleStep(),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _peopleStep() => Stack(
    key: const ValueKey('people'),
    children: [
      Column(
        children: [
          // The people ticked so far; tap one to take them out again.
          AnimatedSize(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            alignment: Alignment.topCenter,
            child: _picked.isEmpty
                ? const SizedBox(width: double.infinity)
                : SizedBox(
                    height: 78,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.fromLTRB(20, 2, 20, 8),
                      itemCount: _picked.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 14),
                      itemBuilder: (_, i) {
                        final p = _picked[i];
                        final chip = Press(
                          key: ValueKey(p['id']),
                          label: t('Remove ${p['fullname']}', 'Ondoa ${p['fullname']}'),
                          onTap: () => _toggle(p),
                          child: SizedBox(
                            width: 52,
                            child: Column(
                              children: [
                                Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    Avatar('${p['fullname']}', photo: Api.img(p['profile_image']), size: 46),
                                    Positioned(
                                      right: -3,
                                      top: -3,
                                      child: Container(
                                        padding: const EdgeInsets.all(2),
                                        decoration: BoxDecoration(color: C.muted, shape: BoxShape.circle, border: Border.all(color: C.card, width: 1.5)),
                                        child: const Icon(Icons.close_rounded, size: 11, color: Colors.white),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text('${p['fullname']}'.split(' ').first, maxLines: 1, overflow: TextOverflow.ellipsis, style: body(11.5, color: C.muted)),
                              ],
                            ),
                          ),
                        );
                        return reduceMotion ? chip : chip.animate().scaleXY(begin: .5, end: 1, duration: 240.ms, curve: Curves.easeOutBack).fadeIn(duration: 140.ms);
                      },
                    ),
                  ),
          ),
          Expanded(
            child: _PeopleSearch(
              builder: (context, people, loading, error, query) =>
                  _state(loading, error, people, query) ??
                  ListView.builder(
                    padding: const EdgeInsets.only(bottom: 110),
                    itemCount: people.length,
                    itemBuilder: (_, i) {
                      final p = people[i], on = _has(p);
                      return _PersonTile(
                        p,
                        onTap: () => _toggle(p),
                        trailing: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: on ? C.mkoko : Colors.transparent,
                            shape: BoxShape.circle,
                            border: Border.all(color: on ? C.mkoko : C.faint, width: 1.6),
                          ),
                          child: on ? const Icon(Icons.check_rounded, size: 15, color: Colors.white) : null,
                        ),
                      );
                    },
                  ),
            ),
          ),
        ],
      ),
      // "Next" rises into view once at least one person is ticked.
      Positioned(
        left: 20,
        right: 20,
        bottom: 16,
        child: AnimatedSlide(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOutCubic,
          offset: _picked.isEmpty ? const Offset(0, 1.6) : Offset.zero,
          child: Button(
            t('Next', 'Endelea'),
            icon: Icons.arrow_forward_rounded,
            onTap: _picked.isEmpty ? null : () => setState(() => _naming = true),
          ),
        ),
      ),
    ],
  );

  Widget _nameStep() => ListView(
    key: const ValueKey('name'),
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
    children: [
      const Center(child: GroupFace(size: 76)),
      const SizedBox(height: 18),
      Field(
        t('Group name', 'Jina la kikundi'),
        controller: _name,
        hint: t('Viewing on Saturday', 'Kuona nyumba Jumamosi'),
        action: TextInputAction.done,
        onSubmit: _create,
      ),
      if (_error != null)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(_error!, style: body(13, color: C.hibiscus, weight: FontWeight.w600)),
        ),
      const SizedBox(height: 20),
      Text(t('In this group: you and', 'Kwenye kikundi hiki: wewe na'), style: body(12.5, color: C.muted, weight: FontWeight.w600)),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final p in _picked)
            Container(
              padding: const EdgeInsets.fromLTRB(4, 4, 12, 4),
              decoration: BoxDecoration(color: C.card.withValues(alpha: .7), borderRadius: BorderRadius.circular(24), border: Border.all(color: C.line)),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Avatar('${p['fullname']}', photo: Api.img(p['profile_image']), size: 28),
                  const SizedBox(width: 8),
                  Text('${p['fullname']}', style: body(13, weight: FontWeight.w500)),
                ],
              ),
            ),
        ],
      ),
      const SizedBox(height: 28),
      Button(t('Create group', 'Unda kikundi'), busy: _busy, onTap: _create),
    ],
  );
}
