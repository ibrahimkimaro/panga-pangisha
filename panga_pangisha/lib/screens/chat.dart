import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:phoenix_socket/phoenix_socket.dart';

import '../api.dart';
import '../l10n.dart';
import '../live.dart';
import '../ui.dart';
import 'new_chat.dart';

/// 14:05 today, "Yesterday", a weekday this week, then the date.
String _when(DateTime at) {
  final now = DateTime.now();
  if (DateUtils.isSameDay(at, now)) return DateFormat.Hm().format(at);
  if (DateUtils.isSameDay(at, now.subtract(const Duration(days: 1)))) return t('Yesterday', 'Jana');
  if (now.difference(at).inDays < 7) return DateFormat.E().format(at);
  return DateFormat('d MMM').format(at);
}

/// Screen 19: the inbox. People come from Laravel; who is online, who is typing, new messages and
/// unread counts arrive live from the chat server through [Live].
class MessagesTab extends StatefulWidget {
  const MessagesTab({super.key});

  @override
  State<MessagesTab> createState() => _MessagesTabState();
}

class _MessagesTabState extends State<MessagesTab> {
  final _searchCtrl = TextEditingController();
  bool _unreadOnly = false;
  String _query = '';
  bool _loading = true;
  List<Map<String, dynamic>> _chats = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadChats();
    Live.latest.addListener(_onMessage);
  }

  @override
  void dispose() {
    Live.latest.removeListener(_onMessage);
    _searchCtrl.dispose();
    super.dispose();
  }

  /// A message from someone who is not in the list yet: fetch the list again so they appear.
  void _onMessage() {
    final known = {for (final c in _chats) c['topic']};
    if (Live.latest.value.keys.any((topic) => !known.contains(topic))) _loadChats(quiet: true);
  }

  Future<void> _loadChats({bool quiet = false}) async {
    if (Api.user.value == null) return setState(() => _loading = false);
    if (!quiet) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final res = await Api.get('conversations');
      if (!mounted) return;
      setState(() {
        _chats = [for (final c in res as List) Map<String, dynamic>.from(c as Map)];
        _loading = false;
      });
    } on ApiError catch (e) {
      if (mounted && !quiet) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    }
  }

  /// Opens "New chat" and then whichever conversation the person picked or created there.
  Future<void> _newChat() async {
    HapticFeedback.selectionClick();
    final chat = await push<ChatScreen>(context, const NewChatScreen());
    if (chat == null || !mounted) return;
    await push(context, chat);
    _loadChats(quiet: true);
  }

  /// The list as it stands this instant: server rows with the live preview, unread count and order on top.
  List<_Row> get _rows {
    final rows = <_Row>[];
    for (final c in _chats) {
      final topic = '${c['topic']}';
      final peer = Map<String, dynamic>.from(c['peer'] ?? const {});
      final group = c['group'] == null ? null : Map<String, dynamic>.from(c['group']);
      final live = Live.latest.value[topic];
      // In a group the preview says who wrote it: "Juma: ...".
      final author = '${live?['author_name'] ?? c['last_author'] ?? ''}'.split(' ').first;
      final row = _Row(
        topic: topic,
        peerId: peer['id'] ?? 0,
        peerUuid: '${peer['uuid']}',
        name: '${group?['name'] ?? peer['fullname'] ?? ''}',
        photo: Api.img(peer['profile_image']),
        house: c['house'] as String?,
        groupSlug: group?['slug'] as String?,
        members: group?['members'] as int? ?? 0,
        author: group == null || author.isEmpty ? null : author,
        text: (live?['text'] ?? c['last_message']) as String?,
        mine: live != null ? '${live['author_id']}' == '${Live.myChatId}' : c['last_mine'] == true,
        at: DateTime.tryParse('${live?['timestamp'] ?? c['updated_at']}')?.toLocal() ?? DateTime.now(),
        unread: Live.connected.value ? (Live.unread.value[topic] ?? 0) : (c['unread'] ?? 0),
      );
      if (_unreadOnly && row.unread == 0) continue;
      if (_query.isNotEmpty && !'${row.name} ${row.text ?? ''} ${row.house ?? ''}'.toLowerCase().contains(_query)) continue;
      rows.add(row);
    }
    return rows..sort((a, b) => b.at.compareTo(a.at));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Colors.transparent,
    body: GlassBackdrop(
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 14, 8),
              child: Row(
                children: [
                  Expanded(child: Text(t('Messages', 'Ujumbe'), style: display(24, weight: FontWeight.w800))),
                  // Find someone to chat with, or start a group.
                  Press(
                    label: t('New chat', 'Mazungumzo mapya'),
                    onTap: _newChat,
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: C.mkoko, shape: BoxShape.circle),
                      child: const Icon(Icons.edit_square, color: Colors.white, size: 19),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  _pill(t('All', 'Yote'), !_unreadOnly, () => setState(() => _unreadOnly = false)),
                  const SizedBox(width: 8),
                  _pill(t('Unread', 'Haijasomwa'), _unreadOnly, () => setState(() => _unreadOnly = true)),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Glass(
                radius: 16,
                padding: EdgeInsets.zero,
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                  style: body(14.5, color: C.wino),
                  decoration: InputDecoration(
                    filled: false,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 13),
                    prefixIcon: Icon(Icons.search_rounded, color: C.muted, size: 20),
                    hintText: t('Search conversations', 'Tafuta mazungumzo'),
                    hintStyle: body(14, color: C.muted),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Expanded(
              child: _loading
                  ? ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      children: const [
                        Bone(height: 78, radius: 20),
                        SizedBox(height: 10),
                        Bone(height: 78, radius: 20),
                        SizedBox(height: 10),
                        Bone(height: 78, radius: 20),
                      ],
                    )
                  : _error != null
                  ? Notice(
                      icon: Icons.cloud_off_outlined,
                      title: t('Could not load messages', 'Imeshindwa kufungua ujumbe'),
                      text: _error!,
                      action: t('Try again', 'Jaribu tena'),
                      onAction: _loadChats,
                    )
                  : ListenableBuilder(
                      listenable: Listenable.merge([Live.online, Live.unread, Live.typing, Live.latest, Live.connected]),
                      builder: (context, _) {
                        final rows = _rows;
                        if (rows.isEmpty) {
                          return Notice(
                            icon: Icons.chat_bubble_outline_rounded,
                            title: _chats.isEmpty
                                ? t('No conversations yet', 'Bado hakuna mazungumzo')
                                : t('Nothing matches', 'Hakuna kinacholingana'),
                            text: _chats.isEmpty
                                ? t(
                                    'When you message someone about a home, the conversation appears here.',
                                    'Ukimwandikia mtu kuhusu nyumba, mazungumzo yataonekana hapa.',
                                  )
                                : t('Try another name, or show all conversations.', 'Jaribu jina jingine, au onyesha mazungumzo yote.'),
                          );
                        }
                        return ListView.builder(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                          itemCount: rows.length,
                          itemBuilder: (context, i) => _card(rows[i]),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _pill(String label, bool on, VoidCallback onTap) => Press(
    onTap: () {
      HapticFeedback.selectionClick();
      onTap();
    },
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
      decoration: BoxDecoration(
        color: on ? C.navy : C.card.withValues(alpha: .6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: C.dark ? .08 : .6)),
      ),
      child: Text(label, style: body(13, weight: on ? FontWeight.w700 : FontWeight.w500, color: on ? Colors.white : C.muted)),
    ),
  );

  Widget _card(_Row r) {
    final typing = Live.typing.value.contains(r.topic);
    final online = Live.online.value.contains(r.peerUuid);
    return Padding(
      key: ValueKey(r.topic),
      padding: const EdgeInsets.only(bottom: 10),
      child: Press(
        onTap: () async {
          await push(
            context,
            r.groupSlug == null
                ? ChatScreen(peerId: r.peerId, name: r.name, photo: r.photo)
                : ChatScreen(name: r.name, groupSlug: r.groupSlug, members: r.members),
          );
          _loadChats(quiet: true);
        },
        child: Glass(
          radius: 20,
          padding: const EdgeInsets.all(14),
          opacity: r.unread > 0 ? .78 : .55,
          child: Row(
            children: [
              r.groupSlug == null ? Face(r.name, r.photo, online: online, size: 48) : const GroupFace(size: 48),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      r.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: display(15.5, color: C.wino, weight: r.unread > 0 ? FontWeight.w800 : FontWeight.w700),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      typing
                          ? t('typing…', 'anaandika…')
                          : r.text == null
                          ? (r.house ?? t('Say habari', 'Sema habari'))
                          : '${r.mine ? t('You: ', 'Wewe: ') : (r.author == null ? '' : '${r.author}: ')}${r.text}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: body(
                        13,
                        color: typing ? C.teal : (r.unread > 0 ? C.wino : C.muted),
                        weight: typing || r.unread > 0 ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _when(r.at),
                    style: body(11.5, color: r.unread > 0 ? C.teal : C.muted, weight: r.unread > 0 ? FontWeight.w700 : FontWeight.w500),
                  ),
                  const SizedBox(height: 6),
                  if (r.unread > 0)
                    Container(
                      constraints: const BoxConstraints(minWidth: 20),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      decoration: BoxDecoration(color: C.teal, borderRadius: BorderRadius.circular(10)),
                      child: Text(
                        '${r.unread}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800, height: 1),
                      ),
                    )
                  else
                    const SizedBox(height: 19),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// One inbox line, already merged with what has arrived live.
class _Row {
  _Row({
    required this.topic,
    required this.peerId,
    required this.peerUuid,
    required this.name,
    required this.photo,
    required this.house,
    required this.groupSlug,
    required this.members,
    required this.author,
    required this.text,
    required this.mine,
    required this.at,
    required this.unread,
  });
  final String topic, peerUuid, name;
  final int peerId, unread, members;
  final String? photo, house, text;

  /// Set for a group: its id on the chat server, and the first name of whoever wrote the last message.
  final String? groupSlug, author;
  final bool mine;
  final DateTime at;
}

/// A group's picture: people on the accent tint.
class GroupFace extends StatelessWidget {
  const GroupFace({super.key, this.size = 40});
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(color: C.tealLight, shape: BoxShape.circle),
    child: Icon(Icons.groups_rounded, color: C.teal, size: size * .52),
  );
}

/// An avatar with a green dot when the person has the app open.
class Face extends StatelessWidget {
  const Face(this.name, this.photo, {super.key, required this.online, this.size = 40});
  final String name;
  final String? photo;
  final bool online;
  final double size;

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      Avatar(name, photo: photo, size: size),
      if (online)
        Positioned(
          bottom: 0,
          right: 0,
          child: Container(
            width: size * .26,
            height: size * .26,
            decoration: BoxDecoration(
              color: const Color(0xFF10B981),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
          ),
        ),
    ],
  );
}

class _Msg {
  _Msg({
    required this.id,
    required this.text,
    required this.mine,
    required this.at,
    this.seq,
    this.author,
    this.sending = false,
    this.read = false,
    this.deleted = false,
  });

  /// Who wrote it, shown above their bubbles in a group.
  final String? author;

  /// The id the sender made up; it stays the same before and after the server stores the message.
  final String id;

  /// The server's running number for the message: orders it, pages history, and is what "read up to" refers to.
  int? seq;
  String text;
  final bool mine;
  final DateTime at;
  bool sending, read, deleted;
  bool failed = false;
}

/// One conversation. Laravel says who may talk; the Phoenix server carries and keeps the messages,
/// and tells both sides who is typing, what was read and what was deleted.
class ChatScreen extends StatefulWidget {
  /// A chat with one person ([peerId]) or, when [groupSlug] is given, a group.
  const ChatScreen({
    super.key,
    this.peerId = 0,
    required this.name,
    this.photo,
    this.house,
    this.groupSlug,
    this.members = 0,
  });
  final int peerId;
  final String name;
  final String? photo;
  final House? house;
  final String? groupSlug;
  final int members;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final _msgs = <_Msg>[]; // newest first: the list is reversed, so index 0 sits at the bottom
  PhoenixSocket? _socket;
  PhoenixChannel? _channel;
  StreamSubscription? _sub;
  String? _me, _peer, _topic; // chat-server ids
  bool _ready = false;
  String? _error;

  bool _hasOlder = false, _loadingOlder = false; // history grows upwards as you scroll up
  bool _farFromBottom = false;
  int _readUpTo = 0; // highest of their messages I have told the server I read

  bool get _group => widget.groupSlug != null;

  bool _peerTyping = false;
  String _typist = ''; // in a group: who is typing
  Timer? _peerTypingOff;
  bool _typingSent = false;
  DateTime _typingAt = DateTime(2000);
  Timer? _typingIdle;

  @override
  void initState() {
    super.initState();
    _input.addListener(_typed);
    _scroll.addListener(_scrolled);
    _connect();
  }

  @override
  void dispose() {
    if (Live.openTopic == _topic) Live.openTopic = null;
    _stopTyping();
    _peerTypingOff?.cancel();
    _sub?.cancel();
    _socket?.dispose();
    _scroll.dispose();
    _input.dispose();
    super.dispose();
  }

  _Msg _read(Map m) => _Msg(
    id: '${m['client_id'] ?? m['id']}',
    seq: m['seq'] as int?,
    author: m['author_name'] as String?,
    text: '${m['text'] ?? ''}',
    mine: m['author_id'] == _me,
    at: DateTime.tryParse('${m['timestamp']}')?.toLocal() ?? DateTime.now(),
    read: m['read_at'] != null,
    deleted: m['deleted_at'] != null,
  );

  Future<void> _connect() async {
    setState(() => _error = null);
    try {
      // One person: Laravel names the conversation. A group: its topic is its own id.
      final info = await Api.get('chatApp/token/', _group ? null : {'peer': widget.peerId, 'house': ?widget.house?.id});
      _me = info['user_id'];
      _topic = _group ? 'room:${widget.groupSlug}' : '${info['topic']}';
      _peer = _group ? null : _topic!.substring('direct:'.length).split('_').firstWhere((id) => id != _me, orElse: () => '');
      _socket = PhoenixSocket(
        '${info['ws_url']}/websocket', // the server gives the socket path; Phoenix adds the transport
        socketOptions: PhoenixSocketOptions(params: {'token': '${info['token']}'}),
      );
      await _socket!.connect().timeout(const Duration(seconds: 12));
      _channel = _socket!.addChannel(topic: _topic!);
      _sub = _channel!.messages.listen(_on); // before joining, so nothing sent in that instant is missed
      final joined = await _channel!.join().future.timeout(const Duration(seconds: 12));
      if (!mounted) return;
      final history = (joined.response?['messages'] as List? ?? []).map((m) => _read(m as Map));
      setState(() {
        _msgs
          ..clear()
          ..addAll(history.toList().reversed);
        _hasOlder = joined.response?['has_more'] == true;
        _ready = true;
      });
      Live.openTopic = _topic;
      _markRead();
    } catch (e) {
      if (mounted) {
        setState(
          () => _error = e is ApiError
              ? e.message
              : t(
                  'Could not reach the chat server. Check your connection.',
                  'Imeshindwa kufikia seva ya mazungumzo. Angalia mtandao wako.',
                ),
        );
      }
    }
  }

  /// Everything the chat server says about this conversation while it is open.
  void _on(Message event) {
    if (!mounted) return;
    final p = event.payload ?? const <String, dynamic>{};
    switch (event.event.value) {
      case 'new_msg':
        final m = _read(p);
        setState(() {
          final i = _msgs.indexWhere((x) => x.id == m.id);
          if (i >= 0) {
            _msgs[i]
              ..sending = false
              ..seq = m.seq;
          } else {
            _msgs.insert(0, m);
          }
          if (!m.mine) _peerTyping = false;
        });
        if (!m.mine) _markRead();
      case 'user_typing':
        if (p['user_id'] != _me) {
          _typist = '${p['author_name'] ?? ''}'.split(' ').first;
          _setPeerTyping(p['is_typing'] == true);
        }
      case 'messages_read': // they have seen my messages up to this number
        final upTo = p['up_to'] as int? ?? 0;
        setState(() {
          for (final m in _msgs) {
            if (m.mine && m.seq != null && m.seq! <= upTo) m.read = true;
          }
        });
      case 'msg_deleted':
        setState(() => _msgs.where((m) => m.seq == p['seq']).forEach((m) => m.deleted = true));
      case 'msg_edited':
        setState(() => _msgs.where((m) => m.seq == p['seq']).forEach((m) => m.text = '${p['text'] ?? m.text}'));
    }
  }

  /// Tells the server (and so the other person) that I have seen everything they sent.
  void _markRead() {
    final theirs = _msgs.where((m) => !m.mine && m.seq != null);
    final top = theirs.isEmpty ? 0 : theirs.map((m) => m.seq!).reduce(max);
    if (top > _readUpTo && _channel != null && !_group) { // the server keeps "seen" for one-to-one chats only
      _readUpTo = top;
      _channel!.push('read_receipt', {'up_to': top});
    }
    if (_topic != null) Live.markRead(_topic!);
  }

  void _setPeerTyping(bool on) {
    _peerTypingOff?.cancel();
    if (on) _peerTypingOff = Timer(const Duration(seconds: 6), () => _setPeerTyping(false)); // in case "stopped" never arrives
    if (mounted && on != _peerTyping) setState(() => _peerTyping = on);
  }

  /// My own typing: "started" at most every three seconds, "stopped" after a pause or an empty box.
  void _typed() {
    if (!_ready || _channel == null) return;
    final has = _input.text.trim().isNotEmpty;
    _typingIdle?.cancel();
    if (!has) return _stopTyping();
    final now = DateTime.now();
    if (!_typingSent || now.difference(_typingAt) > const Duration(seconds: 3)) {
      _channel!.push('typing', {'is_typing': true});
      _typingSent = true;
      _typingAt = now;
    }
    _typingIdle = Timer(const Duration(milliseconds: 2500), _stopTyping);
  }

  void _stopTyping() {
    _typingIdle?.cancel();
    if (_typingSent && _ready) _channel?.push('typing', {'is_typing': false});
    _typingSent = false;
  }

  /// The list is reversed, so its far end is the oldest message: nearing it fetches the page before.
  void _scrolled() {
    final p = _scroll.position;
    final far = p.pixels > 500;
    if (far != _farFromBottom) setState(() => _farFromBottom = far);
    if (_hasOlder && !_loadingOlder && p.pixels > p.maxScrollExtent - 400) _loadOlder();
  }

  Future<void> _loadOlder() async {
    final stored = _msgs.where((m) => m.seq != null);
    if (stored.isEmpty || _channel == null) return;
    setState(() => _loadingOlder = true);
    try {
      final reply = await _channel!
          .push('older', {'before': stored.map((m) => m.seq!).reduce(min)})
          .future
          .timeout(const Duration(seconds: 12));
      if (!mounted) return;
      final older = (reply.response?['messages'] as List? ?? []).map((m) => _read(m as Map)).toList().reversed;
      setState(() {
        _msgs.addAll(older); // appended at the far end: what is on screen does not move
        _hasOlder = reply.response?['has_more'] == true;
      });
    } catch (_) {
      // Scrolling up again retries.
    } finally {
      if (mounted) setState(() => _loadingOlder = false);
    }
  }

  Future<void> _send([_Msg? retry]) async {
    final text = retry?.text ?? _input.text.trim();
    if (text.isEmpty || _channel == null) return;
    final msg =
        retry ??
        _Msg(
          id: '${DateTime.now().microsecondsSinceEpoch}-${Random().nextInt(1 << 31)}',
          text: text,
          mine: true,
          at: DateTime.now(),
          sending: true,
        );
    setState(() {
      if (retry == null) {
        _msgs.insert(0, msg);
        _input.clear();
      }
      msg
        ..sending = true
        ..failed = false;
    });
    _stopTyping();
    if (_scroll.hasClients) _scroll.animateTo(0, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    try {
      final reply = await _channel!
          .push('new_msg', {'id': msg.id, 'text': text})
          .future
          .timeout(const Duration(seconds: 12));
      if (!mounted) return;
      setState(() {
        msg.sending = false;
        msg.failed = !reply.isOk;
        if (reply.isOk) msg.seq = reply.response?['seq'] as int?;
      });
      if (!reply.isOk) {
        toast(context, '${reply.response?['reason'] ?? t('Not sent', 'Haijatumwa')}');
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          msg.sending = false;
          msg.failed = true;
        });
      }
    }
  }

  Future<void> _delete(_Msg m) async {
    try {
      final reply = await _channel!.push('delete_msg', {'id': '${m.seq}'}).future.timeout(const Duration(seconds: 12));
      if (!mounted) return;
      if (reply.isOk) {
        setState(() => m.deleted = true);
      } else {
        toast(context, '${reply.response?['reason'] ?? t('Could not delete', 'Imeshindwa kufuta')}');
      }
    } catch (_) {
      if (mounted) toast(context, t('Could not delete. Check your connection.', 'Imeshindwa kufuta. Angalia mtandao wako.'));
    }
  }

  /// Long-press on a bubble.
  void _actions(_Msg m) {
    if (m.deleted) return;
    HapticFeedback.mediumImpact();
    sheet(
      context,
      Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.copy_rounded),
            title: Text(t('Copy', 'Nakili'), style: body(16)),
            onTap: () {
              Clipboard.setData(ClipboardData(text: m.text));
              Navigator.pop(context);
              toast(context, t('Copied', 'Imenakiliwa'));
            },
          ),
          if (m.mine && m.seq != null)
            ListTile(
              leading: Icon(Icons.delete_outline_rounded, color: C.hibiscus),
              title: Text(t('Delete for everyone', 'Futa kwa wote'), style: body(16, color: C.hibiscus)),
              onTap: () {
                Navigator.pop(context);
                _delete(m);
              },
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: C.card,
    body: GlassBackdrop(
      child: SafeArea(
        child: Column(
          children: [
            _header(),
            Expanded(
              child: _error != null
                  ? Notice(
                      icon: Icons.wifi_off_rounded,
                      title: t('Chat is not connected', 'Mazungumzo hayajaunganishwa'),
                      text: _error!,
                      action: t('Try again', 'Jaribu tena'),
                      onAction: _connect,
                    )
                  : !_ready
                  ? _waiting()
                  : _msgs.isEmpty && !_peerTyping
                  ? Notice(
                      icon: Icons.waving_hand_outlined,
                      title: t('Say habari', 'Sema habari'),
                      text: t(
                        'Ask if the home is still available, or when you can see it.',
                        'Uliza kama nyumba bado ipo, au lini unaweza kuiona.',
                      ),
                    )
                  : Stack(
                      children: [
                        _list(),
                        if (_farFromBottom)
                          Positioned(
                            right: 16,
                            bottom: 10,
                            child: Press(
                              label: t('Go to the newest message', 'Nenda kwenye ujumbe mpya'),
                              onTap: () => _scroll.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut),
                              child: Glass(
                                blur: true,
                                radius: 22,
                                padding: const EdgeInsets.all(9),
                                opacity: .8,
                                child: Icon(Icons.keyboard_arrow_down_rounded, color: C.wino),
                              ),
                            ),
                          ),
                      ],
                    ),
            ),
            _composer(),
          ],
        ),
      ),
    ),
  );

  Widget _header() => Padding(
    padding: const EdgeInsets.fromLTRB(12, 6, 12, 6),
    child: Glass(
      radius: 24,
      padding: const EdgeInsets.fromLTRB(4, 8, 14, 8),
      opacity: .7,
      child: Row(
        children: [
          IconButton(
            tooltip: t('Back', 'Rudi'),
            icon: Icon(Icons.arrow_back_rounded, color: C.wino),
            onPressed: () => Navigator.maybePop(context),
          ),
          _group
              ? const GroupFace()
              : ListenableBuilder(
                  listenable: Live.online,
                  builder: (_, _) => Face(widget.name, widget.photo, online: Live.online.value.contains(_peer)),
                ),
          const SizedBox(width: 12),
          Expanded(
            child: Press(
              onTap: _group ? _showMembers : null,
              child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: display(16.5, color: C.wino)),
                ListenableBuilder(
                  listenable: Live.online,
                  builder: (_, _) {
                    final online = !_group && Live.online.value.contains(_peer);
                    return Text(
                      _peerTyping
                          ? (_group && _typist.isNotEmpty ? t('$_typist is typing…', '$_typist anaandika…') : t('typing…', 'anaandika…'))
                          : _group
                          ? t('${widget.members} people. Tap to see them', 'Watu ${widget.members}. Gusa kuwaona')
                          : online
                          ? t('Online', 'Yupo mtandaoni')
                          : (widget.house?.name ?? t('Offline', 'Hayupo mtandaoni')),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: body(
                        12.5,
                        height: 1.2,
                        color: _peerTyping || online ? C.teal : C.muted,
                        weight: _peerTyping || online ? FontWeight.w600 : FontWeight.w400,
                      ),
                    );
                  },
                ),
              ],
            ),
            ),
          ),
        ],
      ),
    ),
  );

  /// Who is in this group.
  void _showMembers() => sheet(
    context,
    Loader<List>(
      load: () async => await Api.get('chat/groups/${widget.groupSlug}') as List,
      bones: const Column(children: [Bone(height: 52, radius: 16), SizedBox(height: 8), Bone(height: 52, radius: 16)]),
      builder: (context, people, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(widget.name, style: display(19, weight: FontWeight.w800)),
          Text(t('${people.length} people', 'Watu ${people.length}'), style: body(13, color: C.muted)),
          const SizedBox(height: 12),
          for (final p in people)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  ListenableBuilder(
                    listenable: Live.online,
                    builder: (_, _) => Face('${p['fullname']}', Api.img(p['profile_image']), online: Live.online.value.contains(p['uuid']), size: 40),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      p['me'] == true ? t('You', 'Wewe') : '${p['fullname']}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: body(15, weight: FontWeight.w600),
                    ),
                  ),
                  if (p['admin'] == true) Tag(t('Admin', 'Msimamizi')),
                ],
              ),
            ),
        ],
      ),
    ),
  );

  /// While connecting: placeholders stacked from the bottom, where the newest messages will sit.
  Widget _waiting() => ListView(
    reverse: true,
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
    children: const [
      Align(alignment: Alignment.centerRight, child: Bone(height: 44, width: 190, radius: 20)),
      SizedBox(height: 8),
      Align(alignment: Alignment.centerLeft, child: Bone(height: 44, width: 230, radius: 20)),
      SizedBox(height: 8),
      Align(alignment: Alignment.centerRight, child: Bone(height: 44, width: 150, radius: 20)),
    ],
  );

  /// Newest at the bottom. Older pages are added above as you scroll up; nothing reloads from the top down.
  Widget _list() {
    final typing = _peerTyping ? 1 : 0;
    return ListView.builder(
      controller: _scroll,
      reverse: true,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      itemCount: _msgs.length + typing + 1,
      itemBuilder: (_, row) {
        if (row == 0 && _peerTyping) return const _TypingBubble();
        final i = row - typing;
        if (i == _msgs.length) {
          // The far (top) end of the conversation.
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Center(
              child: _loadingOlder || _hasOlder
                  ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: C.teal))
                  : Text(
                      t('This is the start of your conversation', 'Huu ndio mwanzo wa mazungumzo yenu'),
                      style: body(12.5, color: C.muted),
                    ),
            ),
          );
        }
        final m = _msgs[i];
        final newDay = i == _msgs.length - 1 || !DateUtils.isSameDay(m.at, _msgs[i + 1].at);
        return Column(
          key: ValueKey(m.id),
          children: [
            if (newDay)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(day(m.at), style: body(12.5, color: C.muted, weight: FontWeight.w600)),
              ),
            _Bubble(
              m,
              // In a group, name the writer above the first of their bubbles in a row.
              author: _group && !m.mine && (i == _msgs.length - 1 || _msgs[i + 1].mine || _msgs[i + 1].author != m.author) ? m.author : null,
              onRetry: () => _send(m),
              onHold: () => _actions(m),
            ),
          ],
        );
      },
    );
  }

  Widget _composer() => Padding(
    padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
    child: Glass(
      radius: 30,
      padding: const EdgeInsets.fromLTRB(16, 4, 5, 4),
      opacity: .75,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _input,
              enabled: _ready,
              minLines: 1,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              style: body(16),
              decoration: InputDecoration(
                hintText: t('Write a message', 'Andika ujumbe'),
                filled: false,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                disabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 13),
              ),
            ),
          ),
          const SizedBox(width: 8),
          ListenableBuilder(
            listenable: _input,
            builder: (_, _) {
              final can = _ready && _input.text.trim().isNotEmpty;
              return Press(
                onTap: can ? _send : null,
                label: t('Send', 'Tuma'),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 46,
                  height: 46,
                  margin: const EdgeInsets.only(bottom: 2),
                  decoration: BoxDecoration(color: can ? C.teal : C.line, shape: BoxShape.circle),
                  child: Icon(Icons.arrow_upward_rounded, color: can ? Colors.white : C.muted),
                ),
              );
            },
          ),
        ],
      ),
    ),
  );
}

/// Three dots that rise in turn while the other person types.
class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.centerLeft,
    child: Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: C.card.withValues(alpha: .8),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
          bottomRight: Radius.circular(20),
          bottomLeft: Radius.circular(5),
        ),
        border: Border.all(color: Colors.white.withValues(alpha: C.dark ? .08 : .7)),
      ),
      child: Semantics(
        label: t('typing', 'anaandika'),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < 3; i++)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2.5),
                child: reduceMotion
                    ? _dot
                    : _dot
                          .animate(delay: (160 * i).ms, onPlay: (c) => c.repeat(reverse: true))
                          .moveY(begin: 0, end: -5, duration: 420.ms, curve: Curves.easeInOut)
                          .fade(begin: .35, end: 1, duration: 420.ms),
              ),
          ],
        ),
      ),
    ),
  );

  static final Widget _dot = Container(
    width: 7,
    height: 7,
    decoration: BoxDecoration(color: C.teal, shape: BoxShape.circle),
  );
}

class _Bubble extends StatelessWidget {
  const _Bubble(this.m, {required this.onRetry, required this.onHold, this.author});
  final _Msg m;
  final VoidCallback onRetry, onHold;
  final String? author;

  @override
  Widget build(BuildContext context) {
    final onDark = m.mine && !m.deleted;
    final bubble = Align(
      alignment: m.mine ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        onTap: m.failed ? onRetry : null,
        onLongPress: onHold,
        child: Container(
          constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .78),
          margin: const EdgeInsets.only(bottom: 6),
          padding: const EdgeInsets.fromLTRB(15, 10, 15, 8),
          decoration: BoxDecoration(
            // Mine: solid teal. Theirs: a pane of glass over the backdrop.
            // My messages carry the person's accent; white text needs its deeper shades in dark mode.
            gradient: onDark ? LinearGradient(colors: C.dark ? [C.mkoko, C.deep] : [C.teal, C.mkoko]) : null,
            color: onDark ? null : C.card.withValues(alpha: m.deleted ? .45 : .8),
            border: onDark ? null : Border.all(color: Colors.white.withValues(alpha: C.dark ? .08 : .7)),
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(20),
              topRight: const Radius.circular(20),
              bottomLeft: Radius.circular(m.mine ? 20 : 5),
              bottomRight: Radius.circular(m.mine ? 5 : 20),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (author != null)
                Align(
                  alignment: Alignment.centerLeft,
                  widthFactor: 1,
                  child: Text(author!, style: body(12, color: C.teal, weight: FontWeight.w700, height: 1.3)),
                ),
              Text(
                m.deleted ? t('Message deleted', 'Ujumbe umefutwa') : m.text,
                style: body(15.5, color: onDark ? Colors.white : (m.deleted ? C.muted : C.wino), height: 1.35)
                    .copyWith(fontStyle: m.deleted ? FontStyle.italic : null),
              ),
              const SizedBox(height: 3),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    m.failed ? t('Not sent. Tap to retry', 'Haijatumwa. Gusa kujaribu tena') : DateFormat.Hm().format(m.at),
                    style: body(11.5, height: 1.2, color: m.failed ? C.shaba : (onDark ? Colors.white60 : C.muted)),
                  ),
                  if (onDark && !m.failed) ...[
                    const SizedBox(width: 4),
                    // Clock while sending, one tick once stored, two bright ticks once they have seen it.
                    Icon(
                      m.sending
                          ? Icons.schedule_rounded
                          : m.read
                          ? Icons.done_all_rounded
                          : Icons.done_rounded,
                      size: 14,
                      color: m.read ? const Color(0xFF7DE3FF) : Colors.white60,
                      semanticLabel: m.sending
                          ? t('Sending', 'Inatumwa')
                          : m.read
                          ? t('Seen', 'Imeonwa')
                          : t('Sent', 'Imetumwa'),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
    // Only a message you just sent springs in, from the bottom corner; history stays still.
    return m.sending && !reduceMotion
        ? bubble
              .animate()
              .scaleXY(begin: .85, end: 1, alignment: Alignment.bottomRight, duration: 220.ms, curve: Curves.easeOutBack)
              .fadeIn(duration: 120.ms)
        : bubble;
  }
}
