import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart' hide Message; // phoenix_socket's Message is the one used here
import 'package:phoenix_socket/phoenix_socket.dart';

import 'api.dart';
import 'l10n.dart';
import 'main.dart';
import 'screens/notifications.dart';
import 'ui.dart';

/// Opens the socket and joins the person's own channel, handing every event to [onEvent].
/// It listens before it joins: the server sends "who is online" the instant the join lands, and an
/// event that arrives before anyone listens is lost. Also gives back what the server said on joining:
/// `unread`, a map of conversation topic to unread count.
Future<(PhoenixSocket, StreamSubscription<Message>, Map<String, dynamic>)> joinUserChannel(
  String url,
  String token,
  String uuid,
  void Function(Message) onEvent,
) async {
  final socket = PhoenixSocket(url, socketOptions: PhoenixSocketOptions(params: {'token': token}));
  await socket.connect().timeout(const Duration(seconds: 12));
  final channel = socket.addChannel(topic: 'user:$uuid');
  final events = channel.messages.listen(onEvent);
  final joined = await channel.join().future.timeout(const Duration(seconds: 12));
  return (socket, events, Map<String, dynamic>.from(joined.response as Map? ?? const {}));
}

/// The app's live line to the server while someone is signed in. Over it arrive:
/// notifications (an admin's message, a decision), new chat messages, who is online and who is typing.
/// Being on this line is also what makes the person show as online to others.
class Live {
  /// Goes up by one each time a notification arrives. Bells and waiting screens listen to it.
  static final arrived = ValueNotifier<int>(0);

  /// Chat-server ids of everyone who has the app open right now.
  static final online = ValueNotifier<Set<String>>({});

  /// Unread chat messages, by conversation topic.
  static final unread = ValueNotifier<Map<String, int>>({});

  /// Conversation topics in which the other person is typing right now.
  static final typing = ValueNotifier<Set<String>>({});

  /// The newest chat message seen per topic since the app opened (the inbox shows it as the preview).
  static final latest = ValueNotifier<Map<String, Map<String, dynamic>>>({});

  /// True once the line is open: from then on [unread] is the truth, before that it is simply empty.
  static final connected = ValueNotifier<bool>(false);

  /// The conversation that is open on screen: its messages are read as they come, so not counted or announced.
  static String? openTopic;

  static PhoenixSocket? _socket;
  static StreamSubscription<Message>? _events;
  static Timer? _retry;
  static final _typingOff = <String, Timer>{};
  static int? _user; // whose line is open

  /// My own id on the chat server, once the line is open.
  static String? myChatId;

  /// Call once at start-up: opens the line on sign-in and closes it on sign-out.
  static void attach() {
    Api.user.addListener(_sync);
    _sync();
  }

  /// The person has now seen everything in [topic].
  static void markRead(String topic) {
    if (unread.value.containsKey(topic)) unread.value = {...unread.value}..remove(topic);
  }

  static void _sync() {
    final id = Api.user.value?['id'] as int?;
    if (id == _user) return;
    _close();
    _user = id;
    online.value = {};
    unread.value = {};
    typing.value = {};
    latest.value = {};
    if (id != null) _open();
  }

  static Future<void> _open() async {
    final me = _user;
    try {
      await Tray.init();
      final info = await Api.get('chatApp/token/');
      final (socket, events, hello) = await joinUserChannel('${info['ws_url']}/websocket', '${info['token']}', '${info['user_id']}', _on);
      if (_user != me) return socket.dispose(); // signed out while connecting
      _socket = socket;
      _events = events;
      myChatId = '${info['user_id']}';
      unread.value = {
        for (final e in (hello['unread'] as Map? ?? const {}).entries) '${e.key}': (e.value as num).toInt(),
      };
      connected.value = true;
      // The token lasts an hour and networks drop: when the socket closes, come back with a fresh one.
      socket.closeStream.first.then((_) => _again(me)).ignore();
    } catch (_) {
      _again(me);
    }
  }

  static void _again(int? me) {
    if (_user != me || me == null) return;
    _close();
    _retry = Timer(const Duration(seconds: 15), () {
      if (_user == me) _open();
    });
  }

  static void _close() {
    _retry?.cancel();
    connected.value = false;
    _events?.cancel();
    _events = null;
    for (final t in _typingOff.values) {
      t.cancel();
    }
    _typingOff.clear();
    final s = _socket;
    _socket = null;
    s?.dispose();
  }

  static void _on(Message m) {
    final p = Map<String, dynamic>.from(m.payload ?? const {});
    switch (m.event.value) {
      case 'notification':
        _notify(p);
      case 'online':
        online.value = {for (final id in (p['ids'] as List? ?? const [])) '$id'};
      case 'typing':
        _typing('${p['topic']}', p['is_typing'] == true);
      case 'notice' || 'group_notice': // a new message in a chat or a group, whether or not it is open
        final topic = '${p['topic']}';
        latest.value = {...latest.value, topic: p};
        _typing(topic, false);
        if (topic != openTopic) {
          unread.value = {...unread.value, topic: (unread.value[topic] ?? 0) + 1};
          final group = p['group_name'];
          Tray.show({
            'title': group ?? p['author_name'],
            'body': group == null ? p['text'] : '${p['author_name']}: ${p['text']}',
            'user_name': Api.user.value?['fullname'],
          });
        }
    }
  }

  /// "Typing" clears itself after a few seconds, in case the "stopped" event never arrives.
  static void _typing(String topic, bool on) {
    _typingOff.remove(topic)?.cancel();
    if (on == typing.value.contains(topic) && !on) return;
    typing.value = on ? {...typing.value, topic} : ({...typing.value}..remove(topic));
    if (on) _typingOff[topic] = Timer(const Duration(seconds: 6), () => _typing(topic, false));
  }

  static Future<void> _notify(Map<String, dynamic> n) async {
    if (n['user_id'] != null && n['user_id'] != Api.myId) return; // addressed to someone else: not ours to show
    arrived.value++;
    if (await Tray.show(n)) return; // the phone's own notification is enough
    // Notifications are turned off for the app: fall back to a banner inside it.
    messenger.currentState
      ?..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: C.navy,
          duration: const Duration(seconds: 8),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${n['title'] ?? ''}', style: body(15, color: Colors.white, weight: FontWeight.w700)),
              Text(
                '${n['body'] ?? ''}',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: body(13.5, color: Colors.white.withValues(alpha: .8), height: 1.35),
              ),
            ],
          ),
          action: SnackBarAction(
            label: t('Open', 'Fungua'),
            textColor: C.tealLight,
            onPressed: () => navigator.currentState?.push(
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            ),
          ),
        ),
      );
  }
}

/// The phone's notification tray: a heads-up banner over whatever is on screen, and an entry that stays
/// until it is opened. Android heads it with the app's name and the name of the account it is for.
class Tray {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _ready = false;
  static bool _allowed = false;
  static int _next = 0;

  /// Sets the plugin up and asks for permission once (Android 13+ shows its own question).
  static Future<void> init() async {
    if (_ready) return;
    _ready = true;
    try {
      await _plugin.initialize(
        settings: const InitializationSettings(
          android: AndroidInitializationSettings('ic_stat_panga'),
          iOS: DarwinInitializationSettings(),
        ),
        onDidReceiveNotificationResponse: (_) => navigator.currentState?.push(
          MaterialPageRoute(builder: (_) => const NotificationsScreen()),
        ),
      );
      final android = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      _allowed = await android?.requestNotificationsPermission() ?? true;
    } catch (_) {
      _allowed = false; // no tray on this platform: Live falls back to the in-app banner
    }
  }

  /// Puts [n] (title, body, user_name) in the tray. False when notifications are turned off for the app.
  static Future<bool> show(Map<String, dynamic> n) async {
    if (!_allowed) return false;
    final who = n['user_name'] == null ? null : '${n['user_name']}';
    try {
      await _plugin.show(
        id: _next++,
        title: '${n['title'] ?? ''}',
        body: '${n['body'] ?? ''}',
        notificationDetails: NotificationDetails(
          android: AndroidNotificationDetails(
            'panga_alerts',
            'Messages and alerts',
            channelDescription: 'Chat messages, messages from the Panga team, viewing requests and verification results',
            importance: Importance.high, // heads-up banner
            priority: Priority.high,
            subText: who, // header reads "Panga na Kupangisha - Amina Said"
            styleInformation: BigTextStyleInformation('${n['body'] ?? ''}'),
            color: C.teal,
          ),
          iOS: DarwinNotificationDetails(subtitle: who),
        ),
      );
      return true;
    } catch (_) {
      return false;
    }
  }
}
