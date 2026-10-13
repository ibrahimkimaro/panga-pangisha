import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:loading_icon_button/loading_icon_button.dart';

import '../api.dart';
import '../l10n.dart';
import '../ui.dart';

/// Screen: Veyora AI Assistant
/// Features full lifecycle ThinkingOrb agent animations (breathing, searching,
/// solving, connecting, composing, shaping) with zero fake typing text,
/// instant direct greetings, full conversation history tracking, and New Chat sessions.
class VeyoraAssistantScreen extends StatefulWidget {
  const VeyoraAssistantScreen({super.key});

  @override
  State<VeyoraAssistantScreen> createState() => _VeyoraAssistantScreenState();
}

class _VeyoraChatMessage {
  _VeyoraChatMessage({
    required this.role,
    required this.content,
    required this.timestamp,
    this.orbState,
  });

  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;
  final OrbState? orbState;
}

class _VeyoraAssistantScreenState extends State<VeyoraAssistantScreen> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  final List<_VeyoraChatMessage> _messages = [];

  String? _conversationId;
  String _conversationTitle = 'Veyora AI';
  bool _busy = false;
  OrbState _agentOrbState = OrbState.breathing;
  String _agentStatusText = 'Online & ready';
  Timer? _stateProgressionTimer;

  static const List<String> _suggestedPromptsEn = [
    'Search 2-bedroom apartments in Kinondoni',
    'Show my active tenancy agreement and terms',
    'What is my recent rent payment ledger?',
    'How do I register rentable units as a landlord?',
    'Create a maintenance request for water leakage',
  ];

  static const List<String> _suggestedPromptsSw = [
    'Tafuta vyumba viwili Kinondoni chini ya laki 6',
    'Onyesha mkataba wangu wa pango na masharti yake',
    'Historia ya malipo yangu ya kodi ya pango',
    'Jinsi ya kusajili vyumba vipya kama mwenye nyumba',
    'Fungua tiketi ya marekebisho ya bomba linalovuja',
  ];

  @override
  void initState() {
    super.initState();
    _startInitialGreeting();
  }

  void _startInitialGreeting() {
    _messages.clear();
    _messages.add(
      _VeyoraChatMessage(
        role: 'assistant',
        content: t(
          'Habari! I am Veyora, your official Housing AI Assistant for Panga na Kupangisha. I can search properties, review your tenancy, inspect rent ledgers, or guide you in registering units. How can I help you today?',
          'Habari! Mimi ni Veyora, msaidizi wako rasmi wa AI wa nyumba (Panga na Kupangisha). Naweza kukutafutia nyumba, kukagua mkataba wako, kuangalia kodi, au kukuongoza kuweka vyumba. Nikusaidie nini leo?',
        ),
        timestamp: DateTime.now(),
        orbState: OrbState.breathing,
      ),
    );
  }

  @override
  void dispose() {
    _stateProgressionTimer?.cancel();
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _send([String? presetText]) async {
    final text = (presetText ?? _inputController.text).trim();
    if (text.isEmpty || _busy) return;

    if (presetText == null) {
      _inputController.clear();
    }
    HapticFeedback.lightImpact();

    setState(() {
      _messages.add(
        _VeyoraChatMessage(
          role: 'user',
          content: text,
          timestamp: DateTime.now(),
        ),
      );
      _busy = true;
      _agentOrbState = OrbState.listening;
      _agentStatusText = t('Listening & understanding query...', 'Inapokea na kuelewa swali...');
    });

    _scrollToBottom();

    // Orchestrate lifecycle states across the thought progression:
    // listening -> searching -> connecting -> solving -> composing
    _stateProgressionTimer?.cancel();
    _stateProgressionTimer = Timer(const Duration(milliseconds: 350), () {
      if (!mounted || !_busy) return;
      setState(() {
        _agentOrbState = OrbState.searching;
        _agentStatusText = t('Searching authorized housing data...', 'Inatafuta kwenye mfumo wa nyumba...');
      });

      _stateProgressionTimer = Timer(const Duration(milliseconds: 650), () {
        if (!mounted || !_busy) return;
        setState(() {
          _agentOrbState = OrbState.connecting;
          _agentStatusText = t('Connecting records & checking permissions...', 'Inathibitisha ruhusa na taarifa...');
        });

        _stateProgressionTimer = Timer(const Duration(milliseconds: 700), () {
          if (!mounted || !_busy) return;
          setState(() {
            _agentOrbState = OrbState.solving;
            _agentStatusText = t('Solving & evaluating business logic...', 'Inachambua matokeo ya mfumo...');
          });
        });
      });
    });

    try {
      final res = await Api.post('ai/assistant/message', {
        'message': text,
        if (_conversationId != null) 'conversation_id': _conversationId,
        'context': {
          'screen': 'VeyoraAssistantScreen',
          'role': Api.isOwner ? 'landlord' : 'renter',
        },
      });

      if (!mounted) return;

      _stateProgressionTimer?.cancel();
      setState(() {
        _agentOrbState = OrbState.composing;
        _agentStatusText = t('Composing housing guidance...', 'Inaandaa majibu kamili...');
      });

      await Future.delayed(const Duration(milliseconds: 200));
      if (!mounted) return;

      if (res is Map && res['response'] != null) {
        if (res['conversation_id'] != null) {
          _conversationId = res['conversation_id'].toString();
        }
        setState(() {
          _messages.add(
            _VeyoraChatMessage(
              role: 'assistant',
              content: res['response'].toString(),
              timestamp: DateTime.now(),
              orbState: OrbState.breathing,
            ),
          );
        });
      } else {
        _addError(t('Unable to get response from Veyora.', 'Haikuweza kupata jibu kutoka kwa Veyora.'));
      }
    } catch (e) {
      _addError(t('Unable to connect to Veyora right now. Please try again.', 'Haikuweza kuunganishwa na Veyora kwa sasa. Tafadhali jaribu tena.'));
    } finally {
      if (mounted) {
        _stateProgressionTimer?.cancel();
        setState(() {
          _busy = false;
          _agentOrbState = OrbState.breathing;
          _agentStatusText = t('Online & ready', 'Tayari kusaidia');
        });
        _scrollToBottom();
      }
    }
  }

  void _addError(String message) {
    setState(() {
      _messages.add(
        _VeyoraChatMessage(
          role: 'assistant',
          content: message,
          timestamp: DateTime.now(),
          orbState: OrbState.shaping,
        ),
      );
    });
  }

  void _startNewChat() {
    HapticFeedback.mediumImpact();
    setState(() {
      _conversationId = null;
      _conversationTitle = 'Veyora AI';
      _busy = false;
      _agentOrbState = OrbState.breathing;
      _agentStatusText = t('Online & ready', 'Tayari kusaidia');
      _startInitialGreeting();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(t('Started new chat session.', 'Umeanza mzungumzo mapya.')),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _showHistorySheet() async {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _HistoryBottomSheet(
        activeConversationId: _conversationId,
        onSelect: (convId, title) async {
          Navigator.of(ctx).pop();
          await _loadConversation(convId, title);
        },
        onNewChat: () {
          Navigator.of(ctx).pop();
          _startNewChat();
        },
      ),
    );
  }

  Future<void> _loadConversation(String convId, String title) async {
    setState(() {
      _busy = true;
      _agentOrbState = OrbState.searching;
      _agentStatusText = t('Loading chat history...', 'Inapakia historia...');
    });

    try {
      final res = await Api.get('ai/assistant/conversations/$convId');
      if (!mounted) return;

      if (res is Map && res['messages'] is List) {
        final list = (res['messages'] as List)
            .map((m) => _VeyoraChatMessage(
                  role: m['role']?.toString() ?? 'assistant',
                  content: m['content']?.toString() ?? '',
                  timestamp: m['created_at'] != null ? DateTime.tryParse(m['created_at'].toString()) ?? DateTime.now() : DateTime.now(),
                  orbState: OrbState.breathing,
                ))
            .toList();

        setState(() {
          _conversationId = convId;
          _conversationTitle = title;
          _messages.clear();
          if (list.isEmpty) {
            _startInitialGreeting();
          } else {
            _messages.addAll(list);
          }
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(t('Could not load conversation.', 'Haikuweza kupakia mzungumzo.'))),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
          _agentOrbState = OrbState.breathing;
          _agentStatusText = t('Online & ready', 'Tayari kusaidia');
        });
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = C.dark;
    final orbTheme = isDark ? OrbTheme.dark : OrbTheme.light;
    final suggestions = lang.value == 'sw' ? _suggestedPromptsSw : _suggestedPromptsEn;

    return Scaffold(
      backgroundColor: C.chokaa,
      appBar: AppBar(
        backgroundColor: C.card,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: C.wino),
          onPressed: () => Navigator.of(context).pop(),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            // Dynamic ThinkingOrb Header Indicator (tuned 28 size)
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: C.teal.withValues(alpha: 0.12),
                border: Border.all(
                  color: _busy ? C.teal : C.line,
                  width: 1.2,
                ),
              ),
              child: Center(
                child: ThinkingOrb(
                  state: _agentOrbState,
                  size: 28,
                  theme: orbTheme,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          _conversationId != null ? _conversationTitle : 'Veyora AI',
                          style: display(15, weight: FontWeight.w800),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _busy
                              ? C.shaba.withValues(alpha: 0.2)
                              : C.teal.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          _busy ? _agentOrbState.name : 'AI',
                          style: body(
                            10,
                            color: _busy ? C.brassInk : C.teal,
                            weight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    _agentStatusText,
                    style: body(11, color: C.muted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: t('New Chat', 'Mzungumzo Mapya'),
            icon: Icon(Icons.add_comment_rounded, size: 21, color: C.teal),
            onPressed: _startNewChat,
          ),
          IconButton(
            tooltip: t('Chat History', 'Historia ya Mazungumzo'),
            icon: Icon(Icons.history_rounded, size: 23, color: C.wino),
            onPressed: _showHistorySheet,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Main Message Thread
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                itemCount: _messages.length + (_messages.length <= 1 ? 1 : 0),
                itemBuilder: (context, i) {
                  // If message list is at start, render the interactive Hero section
                  if (i == 1 && _messages.length <= 1) {
                    return _buildHeroSection(orbTheme, suggestions);
                  }

                  final msg = _messages[i];
                  final isUser = msg.role == 'user';

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                      children: [
                        if (!isUser) ...[
                          // AI Avatar featuring pure native ThinkingOrb (size 20 tuned inline preset)
                          Container(
                            width: 28,
                            height: 28,
                            margin: const EdgeInsets.only(top: 2, right: 8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: C.card,
                              border: Border.all(color: C.line),
                            ),
                            child: Center(
                              child: ThinkingOrb(
                                state: msg.orbState ?? OrbState.breathing,
                                size: 20,
                                theme: orbTheme,
                              ),
                            ),
                          ),
                        ],
                        Flexible(
                          child: Container(
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.of(context).size.width * 0.78,
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
                            decoration: BoxDecoration(
                              color: isUser ? C.teal : C.card,
                              borderRadius: BorderRadius.only(
                                topLeft: const Radius.circular(20),
                                topRight: const Radius.circular(20),
                                bottomLeft: Radius.circular(isUser ? 20 : 4),
                                bottomRight: Radius.circular(isUser ? 4 : 20),
                              ),
                              border: Border.all(
                                color: isUser ? C.teal : C.line,
                                width: 1,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Text(
                              msg.content,
                              style: body(
                                14,
                                color: isUser ? Colors.white : C.wino,
                                height: 1.45,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Live State Indicator when Processing (zero typing text, pure Thinking Orb animation)
            if (_busy)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: C.card,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: C.teal.withValues(alpha: 0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: C.teal.withValues(alpha: 0.1),
                      blurRadius: 12,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    ThinkingOrb(
                      state: _agentOrbState,
                      size: 24,
                      theme: orbTheme,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'AGENT: ${_agentOrbState.name.toUpperCase()}',
                                style: body(10, color: C.teal, weight: FontWeight.w800),
                              ),
                              const Spacer(),
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: C.teal,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _agentStatusText,
                            style: body(12, color: C.wino, weight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            // Suggestions Carousel if not busy and message count > 1
            if (!_busy && _messages.length > 1)
              Container(
                height: 38,
                margin: const EdgeInsets.only(bottom: 6),
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  itemCount: suggestions.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, idx) {
                    final p = suggestions[idx];
                    return ActionChip(
                      label: Text(p, style: body(12, color: C.wino)),
                      backgroundColor: C.card,
                      side: BorderSide(color: C.line),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      onPressed: () => _send(p),
                    );
                  },
                ),
              ),

            // Input Bar
            Container(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              decoration: BoxDecoration(
                color: C.card,
                border: Border(top: BorderSide(color: C.line)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: C.chokaa,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: C.line),
                      ),
                      child: TextField(
                        controller: _inputController,
                        style: body(14),
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _send(),
                        decoration: InputDecoration(
                          hintText: t(
                            'Message Veyora AI...',
                            'Tuma ujumbe kwa Veyora AI...',
                          ),
                          hintStyle: body(13, color: C.muted),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Press(
                    onTap: _busy ? null : () => _send(),
                    child: Container(
                      padding: const EdgeInsets.all(11),
                      decoration: BoxDecoration(
                        color: _busy ? C.muted.withValues(alpha: 0.4) : C.teal,
                        shape: BoxShape.circle,
                        boxShadow: [
                          if (!_busy)
                            BoxShadow(
                              color: C.teal.withValues(alpha: 0.35),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                        ],
                      ),
                      child: const Icon(
                        Icons.arrow_upward_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection(OrbTheme orbTheme, List<String> suggestions) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: C.line),
      ),
      child: Column(
        children: [
          // Pre-tuned 64 size Chat Avatar ThinkingOrb preset
          ThinkingOrb(
            state: _agentOrbState,
            size: 64,
            theme: orbTheme,
          ),
          const SizedBox(height: 14),
          Text(
            t('Housing Intelligence Assistant', 'Msaidizi Mahiri wa Nyumba'),
            style: display(17, weight: FontWeight.w800),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            t(
              'Connected to Veyora ecosystem records, tenancies, rent ledgers, and property registry.',
              'Imeunganishwa na kumbukumbu za nyumba, mikataba ya upangaji, kodi na orodha ya nyumba.',
            ),
            style: body(12, color: C.muted),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              t('Suggested prompts:', 'Maswali ya kuanzia:'),
              style: body(12, color: C.muted, weight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 10),
          ...suggestions.map(
            (p) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Press(
                onTap: () => _send(p),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: C.chokaa,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: C.line),
                  ),
                  child: Row(
                    children: [
                      const ThinkingOrb(
                        state: OrbState.breathing,
                        size: 16,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          p,
                          style: body(13, color: C.wino, weight: FontWeight.w600),
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios_rounded, size: 12, color: C.muted),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Bottom Sheet for viewing, switching between, and deleting user conversations
class _HistoryBottomSheet extends StatefulWidget {
  const _HistoryBottomSheet({
    required this.activeConversationId,
    required this.onSelect,
    required this.onNewChat,
  });

  final String? activeConversationId;
  final Function(String id, String title) onSelect;
  final VoidCallback onNewChat;

  @override
  State<_HistoryBottomSheet> createState() => _HistoryBottomSheetState();
}

class _HistoryBottomSheetState extends State<_HistoryBottomSheet> {
  bool _loading = true;
  List<Map<String, dynamic>> _conversations = [];

  @override
  void initState() {
    super.initState();
    _fetchConversations();
  }

  Future<void> _fetchConversations() async {
    try {
      final res = await Api.get('ai/assistant/conversations');
      if (res is Map && res['conversations'] is List) {
        setState(() {
          _conversations = (res['conversations'] as List).cast<Map<String, dynamic>>();
          _loading = false;
        });
        return;
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _deleteConversation(String id) async {
    HapticFeedback.lightImpact();
    try {
      await Api.delete('ai/assistant/conversations/$id');
      setState(() {
        _conversations.removeWhere((c) => c['id'] == id);
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: C.line),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(top: 10, bottom: 8),
            decoration: BoxDecoration(
              color: C.muted.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 6, 18, 12),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    t('Chat History', 'Historia ya Mazungumzo'),
                    style: display(17, weight: FontWeight.w800),
                  ),
                ),
                TextButton.icon(
                  onPressed: widget.onNewChat,
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: Text(t('New Chat', 'Mpya')),
                  style: TextButton.styleFrom(
                    foregroundColor: C.teal,
                    textStyle: body(13, weight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_conversations.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
              child: Column(
                children: [
                  Icon(Icons.forum_outlined, size: 48, color: C.muted.withValues(alpha: 0.4)),
                  const SizedBox(height: 12),
                  Text(
                    t('No saved chats yet', 'Bado hakuna mazungumzo yaliyohifadhiwa'),
                    style: body(14, color: C.muted, weight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    t('Chats with Veyora will automatically appear here.', 'Mazungumzo yako na Veyora yataonekana hapa moja kwa moja.'),
                    style: body(12, color: C.muted),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: _conversations.length,
                separatorBuilder: (_, __) => Divider(height: 1, indent: 18, endIndent: 18, color: C.line),
                itemBuilder: (context, idx) {
                  final conv = _conversations[idx];
                  final id = conv['id']?.toString() ?? '';
                  final title = conv['title']?.toString() ?? 'Veyora Chat';
                  final preview = conv['preview']?.toString() ?? '';
                  final isActive = id == widget.activeConversationId;

                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
                    leading: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: isActive ? C.teal.withValues(alpha: 0.15) : C.chokaa,
                        shape: BoxShape.circle,
                        border: Border.all(color: isActive ? C.teal : C.line),
                      ),
                      child: Center(
                        child: Icon(
                          Icons.chat_bubble_outline_rounded,
                          size: 18,
                          color: isActive ? C.teal : C.muted,
                        ),
                      ),
                    ),
                    title: Text(
                      title,
                      style: body(14, weight: isActive ? FontWeight.w800 : FontWeight.w600, color: C.wino),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: preview.isNotEmpty
                        ? Text(
                            preview,
                            style: body(12, color: C.muted),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          )
                        : null,
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isActive)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              color: C.teal.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              t('Active', 'Inatumika'),
                              style: body(10, color: C.teal, weight: FontWeight.w700),
                            ),
                          ),
                        IconButton(
                          icon: Icon(Icons.delete_outline_rounded, size: 18, color: C.muted),
                          tooltip: t('Delete chat', 'Futa'),
                          onPressed: () => _deleteConversation(id),
                        ),
                      ],
                    ),
                    onTap: () => widget.onSelect(id, title),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
