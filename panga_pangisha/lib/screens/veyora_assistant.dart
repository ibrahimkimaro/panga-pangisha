import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:loading_icon_button/loading_icon_button.dart';

import '../api.dart';
import '../l10n.dart';
import '../ui.dart';
import '../widgets/veyora_presentation_widgets.dart';

/// Screen: Veyora AI Assistant
/// Features expressive animated AI Face avatar, friendly conversational intelligence,
/// open listening for personal issues and housing needs, full conversation history tracking.
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
    this.presentation = 'text',
    this.title,
    this.structuredData,
    this.actions = const [],
    this.pagination,
  });

  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;
  final OrbState? orbState;
  final String presentation;
  final String? title;
  final Map<String, dynamic>? structuredData;
  final List<dynamic> actions;
  final Map<String, dynamic>? pagination;
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

  @override
  void initState() {
    super.initState();
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
      _agentStatusText = t(
        'Listening & understanding query...',
        'Inapokea na kuelewa swali...',
      );
    });

    _scrollToBottom();

    // Orchestrate lifecycle states across the thought progression:
    // listening -> searching -> connecting -> solving -> composing
    _stateProgressionTimer?.cancel();
    _stateProgressionTimer = Timer(const Duration(milliseconds: 350), () {
      if (!mounted || !_busy) return;
      setState(() {
        _agentOrbState = OrbState.searching;
        _agentStatusText = t(
          'Searching authorized housing data...',
          'Inatafuta kwenye mfumo wa nyumba...',
        );
      });

      _stateProgressionTimer = Timer(const Duration(milliseconds: 650), () {
        if (!mounted || !_busy) return;
        setState(() {
          _agentOrbState = OrbState.connecting;
          _agentStatusText = t(
            'Connecting records & checking permissions...',
            'Inathibitisha ruhusa na taarifa...',
          );
        });

        _stateProgressionTimer = Timer(const Duration(milliseconds: 700), () {
          if (!mounted || !_busy) return;
          setState(() {
            _agentOrbState = OrbState.solving;
            _agentStatusText = t(
              'Solving & evaluating business logic...',
              'Inachambua matokeo ya mfumo...',
            );
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
        _agentStatusText = t(
          'Composing housing guidance...',
          'Inaandaa majibu kamili...',
        );
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
              presentation: res['presentation']?.toString() ?? 'text',
              title: res['title']?.toString(),
              structuredData: res['structured_data'] is Map
                  ? Map<String, dynamic>.from(res['structured_data'] as Map)
                  : null,
              actions: res['actions'] is List ? List.from(res['actions'] as List) : const [],
              pagination: res['pagination'] is Map
                  ? Map<String, dynamic>.from(res['pagination'] as Map)
                  : null,
            ),
          );
        });
      } else {
        _addError(
          t(
            'Unable to get response from Veyora.',
            'Haikuweza kupata jibu kutoka kwa Veyora.',
          ),
        );
      }
    } catch (e) {
      _addError(
        t(
          'Unable to connect to Veyora right now. Please try again.',
          'Haikuweza kuunganishwa na Veyora kwa sasa. Tafadhali jaribu tena.',
        ),
      );
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
      _messages.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          t('Started new chat session.', 'Umeanza mzungumzo mapya.'),
        ),
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
            .map(
              (m) => _VeyoraChatMessage(
                role: m['role']?.toString() ?? 'assistant',
                content: m['content']?.toString() ?? '',
                timestamp: m['created_at'] != null
                    ? DateTime.tryParse(m['created_at'].toString()) ??
                          DateTime.now()
                    : DateTime.now(),
                orbState: OrbState.breathing,
              ),
            )
            .toList();

        setState(() {
          _conversationId = convId;
          _conversationTitle = title;
          _messages.clear();
          if (list.isNotEmpty) {
            _messages.addAll(list);
          }
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t('Could not load conversation.', 'Haikuweza kupakia mzungumzo.'),
            ),
          ),
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
            VeyoraAiFace(size: 34, state: _agentOrbState, isBusy: _busy),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          _conversationId != null
                              ? _conversationTitle
                              : 'Veyora AI',
                          style: display(15, weight: FontWeight.w800),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 14,
                ),
                itemCount: _messages.isEmpty ? 1 : _messages.length,
                itemBuilder: (context, i) {
                  // If message list is empty, render the interactive Hero section
                  if (_messages.isEmpty) {
                    return _buildHeroSection();
                  }

                  final msg = _messages[i];
                  final isUser = msg.role == 'user';
                  final isDark = Theme.of(context).brightness == Brightness.dark;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: isUser
                          ? MainAxisAlignment.end
                          : MainAxisAlignment.start,
                      children: [
                        if (!isUser) ...[
                          Padding(
                            padding: const EdgeInsets.only(top: 2, right: 8),
                            child: VeyoraAiFace(
                              size: 26,
                              state: msg.orbState ?? OrbState.breathing,
                              isBusy: false,
                            ),
                          ),
                        ],
                        Flexible(
                          child: Container(
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.of(context).size.width *
                                  (isUser ? 0.78 : 0.88),
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 15,
                              vertical: 12,
                            ),
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
                                  color: Colors.black.withValues(
                                    alpha: isDark ? 0.25 : 0.04,
                                  ),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: isUser
                                ? Text(
                                    msg.content,
                                    style: body(
                                      14,
                                      color: Colors.white,
                                      height: 1.45,
                                    ),
                                  )
                                : VeyoraAdaptivePresentation(
                                    presentation: msg.presentation,
                                    content: msg.content,
                                    title: msg.title,
                                    structuredData: msg.structuredData,
                                    actions: msg.actions,
                                    pagination: msg.pagination,
                                    onAction: (act) {
                                      final label = act['label']?.toString();
                                      if (label != null) {
                                        _send(label);
                                      }
                                    },
                                  ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Live State Indicator when Processing
            if (_busy)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
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
                    VeyoraAiFace(size: 24, state: _agentOrbState, isBusy: true),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'VEYORA: ${_agentOrbState.name.toUpperCase()}',
                                style: body(
                                  10,
                                  color: C.teal,
                                  weight: FontWeight.w800,
                                ),
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
                            style: body(
                              12,
                              color: C.wino,
                              weight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
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
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
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

  Widget _buildHeroSection() {
    final fullName = (Api.user.value?['fullname'] ?? '').toString().trim();
    final firstName = fullName.isNotEmpty
        ? fullName.split(' ').first
        : (lang.value == 'sw' ? 'Rafiki' : 'Friend');

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
      decoration: BoxDecoration(
        color: C.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: C.line),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: C.dark ? 0.25 : 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Expressive Animated AI Face
          VeyoraAiFace(size: 88, state: _agentOrbState, isBusy: _busy),
          const SizedBox(height: 16),
          // User Name with great emojis
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  'Habari, $firstName! 👋✨',
                  style: display(22, weight: FontWeight.w800),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            t(
              'I am Veyora, your friendly AI companion. We can talk about homes, life, personal advice, or whatever is on your mind today.',
              'Mimi ni Veyora, msaidizi na rafiki yako wa karibu. Tunaweza kuzungumzia nyumba, maisha, ushauri binafsi, au jambo lolote lililopo akilini mwako leo.',
            ),
            style: body(13, color: C.muted, height: 1.4),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          // Friendly Online Status Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: C.teal.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: C.teal.withValues(alpha: 0.25)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  t(
                    'Online & ready to talk 😊',
                    'Nipo hewani tayari kwa mazungumzo 😊',
                  ),
                  style: body(12, color: C.teal, weight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Animated, expressive AI Face Avatar for Veyora.
/// Features dynamic blinking eyes, emotion-driven expressions (listening, searching,
/// solving, composing, breathing), glowing blush cheeks, and ambient aura.
class VeyoraAiFace extends StatefulWidget {
  const VeyoraAiFace({
    super.key,
    this.size = 64,
    this.state = OrbState.breathing,
    this.isBusy = false,
  });

  final double size;
  final OrbState state;
  final bool isBusy;

  @override
  State<VeyoraAiFace> createState() => _VeyoraAiFaceState();
}

class _VeyoraAiFaceState extends State<VeyoraAiFace>
    with TickerProviderStateMixin {
  late final AnimationController _blinkController;
  late final AnimationController _scanController;

  @override
  void initState() {
    super.initState();
    _blinkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3600),
    )..repeat();

    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _blinkController.dispose();
    _scanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = C.dark;
    final size = widget.size;

    return AnimatedBuilder(
      animation: Listenable.merge([_blinkController, _scanController]),
      builder: (context, child) {
        // Natural blink calculation: open most of the cycle, quick blink at the end
        final t = _blinkController.value;
        double blinkScale = 1.0;
        if (t > 0.92) {
          final progress = (t - 0.92) / 0.08;
          blinkScale = math.sin(progress * math.pi);
          blinkScale = 1.0 - (blinkScale * 0.92);
        }

        // Eye scanning offset during searching or connecting
        double scanOffset = 0.0;
        if (widget.state == OrbState.searching ||
            widget.state == OrbState.connecting) {
          scanOffset = (_scanController.value - 0.5) * 2.0; // -1.0 to 1.0
        }

        return Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark
                  ? [const Color(0xFF134E4A), const Color(0xFF0F2E2E)]
                  : [const Color(0xFFE6FFFA), const Color(0xFFCCFBF1)],
            ),
            border: Border.all(
              color: widget.isBusy ? C.teal : C.teal.withValues(alpha: 0.35),
              width: size > 40 ? 2.0 : 1.2,
            ),
            boxShadow: [
              if (widget.isBusy || size > 50)
                BoxShadow(
                  color: C.teal.withValues(alpha: widget.isBusy ? 0.35 : 0.15),
                  blurRadius: size * 0.28,
                  spreadRadius: widget.isBusy ? 2 : 0,
                  offset: const Offset(0, 2),
                ),
            ],
          ),
          child: CustomPaint(
            size: Size(size, size),
            painter: _VeyoraFacePainter(
              blinkScale: blinkScale,
              scanOffset: scanOffset,
              state: widget.state,
              isDark: isDark,
              tealColor: C.teal,
              inkColor: isDark ? Colors.white : const Color(0xFF134E4A),
              size: size,
            ),
          ),
        );
      },
    );
  }
}

class _VeyoraFacePainter extends CustomPainter {
  _VeyoraFacePainter({
    required this.blinkScale,
    required this.scanOffset,
    required this.state,
    required this.isDark,
    required this.tealColor,
    required this.inkColor,
    required this.size,
  });

  final double blinkScale;
  final double scanOffset;
  final OrbState state;
  final bool isDark;
  final Color tealColor;
  final Color inkColor;
  final double size;

  @override
  void paint(Canvas canvas, Size canvasSize) {
    final w = canvasSize.width;
    final h = canvasSize.height;

    final eyePaint = Paint()
      ..color = inkColor
      ..style = PaintingStyle.fill;

    final strokePaint = Paint()
      ..color = inkColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(1.5, w * 0.055)
      ..strokeCap = StrokeCap.round;

    final shinePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final leftEyeCenter = Offset(w * 0.34, h * 0.44);
    final rightEyeCenter = Offset(w * 0.66, h * 0.44);
    final eyeRadius = w * 0.105;

    // 1. Cheeks (if size >= 32)
    if (size >= 32) {
      final blushPaint = Paint()
        ..color = const Color(0xFFFF6B81).withValues(alpha: 0.32)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(Offset(w * 0.22, h * 0.58), w * 0.08, blushPaint);
      canvas.drawCircle(Offset(w * 0.78, h * 0.58), w * 0.08, blushPaint);
    }

    // 2. Eyes
    if (state == OrbState.composing) {
      // Happy arch eyes (^ ^)
      final leftArc = Path()
        ..moveTo(
          leftEyeCenter.dx - eyeRadius,
          leftEyeCenter.dy + eyeRadius * 0.3,
        )
        ..quadraticBezierTo(
          leftEyeCenter.dx,
          leftEyeCenter.dy - eyeRadius * 0.9,
          leftEyeCenter.dx + eyeRadius,
          leftEyeCenter.dy + eyeRadius * 0.3,
        );
      final rightArc = Path()
        ..moveTo(
          rightEyeCenter.dx - eyeRadius,
          rightEyeCenter.dy + eyeRadius * 0.3,
        )
        ..quadraticBezierTo(
          rightEyeCenter.dx,
          rightEyeCenter.dy - eyeRadius * 0.9,
          rightEyeCenter.dx + eyeRadius,
          rightEyeCenter.dy + eyeRadius * 0.3,
        );

      canvas.drawPath(leftArc, strokePaint);
      canvas.drawPath(rightArc, strokePaint);
    } else if (state == OrbState.solving) {
      // Thinking expression: slightly focused/curious eye heights
      final leftRect = Rect.fromCenter(
        center: leftEyeCenter,
        width: eyeRadius * 2,
        height: eyeRadius * 2 * math.max(0.12, blinkScale),
      );
      canvas.drawOval(leftRect, eyePaint);
      if (size >= 32) {
        final browPaint = Paint()
          ..color = tealColor
          ..style = PaintingStyle.stroke
          ..strokeWidth = math.max(1.2, w * 0.04)
          ..strokeCap = StrokeCap.round;
        final browPath = Path()
          ..moveTo(
            leftEyeCenter.dx - eyeRadius,
            leftEyeCenter.dy - eyeRadius * 1.5,
          )
          ..quadraticBezierTo(
            leftEyeCenter.dx,
            leftEyeCenter.dy - eyeRadius * 2.0,
            leftEyeCenter.dx + eyeRadius,
            leftEyeCenter.dy - eyeRadius * 1.3,
          );
        canvas.drawPath(browPath, browPaint);
      }

      final rightRect = Rect.fromCenter(
        center: rightEyeCenter,
        width: eyeRadius * 2,
        height: eyeRadius * 1.3 * math.max(0.12, blinkScale),
      );
      canvas.drawOval(rightRect, eyePaint);
      canvas.drawCircle(
        Offset(
          leftEyeCenter.dx + eyeRadius * 0.3,
          leftEyeCenter.dy - eyeRadius * 0.3,
        ),
        eyeRadius * 0.35,
        shinePaint,
      );
      canvas.drawCircle(
        Offset(
          rightEyeCenter.dx + eyeRadius * 0.3,
          rightEyeCenter.dy - eyeRadius * 0.2,
        ),
        eyeRadius * 0.3,
        shinePaint,
      );
    } else {
      // Normal & dynamic blinking eyes with pupil look-around
      final eyeHeight = eyeRadius * 2.1 * math.max(0.08, blinkScale);
      final pupilDx = scanOffset * (eyeRadius * 0.5);

      final leftRect = Rect.fromCenter(
        center: Offset(leftEyeCenter.dx + pupilDx, leftEyeCenter.dy),
        width: eyeRadius * 1.85,
        height: eyeHeight,
      );
      final rightRect = Rect.fromCenter(
        center: Offset(rightEyeCenter.dx + pupilDx, rightEyeCenter.dy),
        width: eyeRadius * 1.85,
        height: eyeHeight,
      );

      canvas.drawOval(leftRect, eyePaint);
      canvas.drawOval(rightRect, eyePaint);

      // Cute white catchlight shines (only when open)
      if (blinkScale > 0.4) {
        final shineR = eyeRadius * 0.38;
        canvas.drawCircle(
          Offset(
            leftEyeCenter.dx + pupilDx + eyeRadius * 0.35,
            leftEyeCenter.dy - eyeRadius * 0.32,
          ),
          shineR,
          shinePaint,
        );
        canvas.drawCircle(
          Offset(
            rightEyeCenter.dx + pupilDx + eyeRadius * 0.35,
            rightEyeCenter.dy - eyeRadius * 0.32,
          ),
          shineR,
          shinePaint,
        );
        if (size >= 36) {
          canvas.drawCircle(
            Offset(
              leftEyeCenter.dx + pupilDx - eyeRadius * 0.3,
              leftEyeCenter.dy + eyeRadius * 0.3,
            ),
            shineR * 0.5,
            shinePaint,
          );
          canvas.drawCircle(
            Offset(
              rightEyeCenter.dx + pupilDx - eyeRadius * 0.3,
              rightEyeCenter.dy + eyeRadius * 0.3,
            ),
            shineR * 0.5,
            shinePaint,
          );
        }
      }
    }

    // 3. Mouth (if size >= 28)
    if (size >= 28) {
      if (state == OrbState.listening) {
        final mouthPaint = Paint()
          ..color = inkColor
          ..style = PaintingStyle.fill;
        canvas.drawOval(
          Rect.fromCenter(
            center: Offset(w * 0.5, h * 0.69),
            width: w * 0.12,
            height: w * 0.14,
          ),
          mouthPaint,
        );
      } else if (state == OrbState.composing) {
        final smilePath = Path()
          ..moveTo(w * 0.40, h * 0.65)
          ..quadraticBezierTo(w * 0.50, h * 0.77, w * 0.60, h * 0.65)
          ..close();
        final smilePaint = Paint()
          ..color = inkColor
          ..style = PaintingStyle.fill;
        canvas.drawPath(smilePath, smilePaint);
      } else {
        final smilePath = Path()
          ..moveTo(w * 0.42, h * 0.66)
          ..quadraticBezierTo(w * 0.50, h * 0.74, w * 0.58, h * 0.66);
        canvas.drawPath(smilePath, strokePaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _VeyoraFacePainter old) {
    return old.blinkScale != blinkScale ||
        old.scanOffset != scanOffset ||
        old.state != state ||
        old.isDark != isDark ||
        old.tealColor != tealColor;
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
          _conversations = (res['conversations'] as List)
              .cast<Map<String, dynamic>>();
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
                  Icon(
                    Icons.forum_outlined,
                    size: 48,
                    color: C.muted.withValues(alpha: 0.4),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    t(
                      'No saved chats yet',
                      'Bado hakuna mazungumzo yaliyohifadhiwa',
                    ),
                    style: body(14, color: C.muted, weight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    t(
                      'Chats with Veyora will automatically appear here.',
                      'Mazungumzo yako na Veyora yataonekana hapa moja kwa moja.',
                    ),
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
                separatorBuilder: (_, __) => Divider(
                  height: 1,
                  indent: 18,
                  endIndent: 18,
                  color: C.line,
                ),
                itemBuilder: (context, idx) {
                  final conv = _conversations[idx];
                  final id = conv['id']?.toString() ?? '';
                  final title = conv['title']?.toString() ?? 'Veyora Chat';
                  final preview = conv['preview']?.toString() ?? '';
                  final isActive = id == widget.activeConversationId;

                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 4,
                    ),
                    leading: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: isActive
                            ? C.teal.withValues(alpha: 0.15)
                            : C.chokaa,
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
                      style: body(
                        14,
                        weight: isActive ? FontWeight.w800 : FontWeight.w600,
                        color: C.wino,
                      ),
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
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              color: C.teal.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              t('Active', 'Inatumika'),
                              style: body(
                                10,
                                color: C.teal,
                                weight: FontWeight.w700,
                              ),
                            ),
                          ),
                        IconButton(
                          icon: Icon(
                            Icons.delete_outline_rounded,
                            size: 18,
                            color: C.muted,
                          ),
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
