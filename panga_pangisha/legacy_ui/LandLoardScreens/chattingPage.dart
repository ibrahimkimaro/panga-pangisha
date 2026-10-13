import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_chat_core/flutter_chat_core.dart';
import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import 'package:phoenix_socket/phoenix_socket.dart';
import 'package:flyer_chat_image_message/flyer_chat_image_message.dart';

// import 'package:flutter_chat_types/flutter_chat_types.dart' as types;

class Chattingpage extends StatefulWidget {
  final String? username;
  final String? profilePic;
  final int? receiverId;
  final int? roomId;
  final int? MyID;

  const Chattingpage({
    super.key,
    required this.username,
    required this.profilePic,
    required this.receiverId,
    required this.roomId,
    required this.MyID,
  });

  @override
  State<Chattingpage> createState() => _ChattingpageState();
}

class _ChattingpageState extends State<Chattingpage> {
  // int? CurreUserID;
  List messageses = [];
  final TextEditingController _controller = TextEditingController();
  PhoenixSocket? _socket;
  PhoenixChannel? _channel;
  String?
  _myChatId; // my UUID on the chat server (messages carry it as author_id)
  final String wifiIP = '10.0.2.2';

  final ChatController chatController = InMemoryChatController();
  // bool isRecording = true;

  String? _FileName;
  String? _Imagefile;
  bool isDoc = false;
  bool _isimg = false;
  Future<void> pickImage() async {
    final pickedFile = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      requestFullMetadata: true,
      // preferredCameraDevice: CameraDevice,
    );
    if (!mounted) return;
    if (pickedFile != null) {
      setState(() {
        _Imagefile = pickedFile.path;
      });
    }
  }

  Future<void> pickPdfFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    // setState(() {

    // });

    if (result != null && result.files.single.path != null) {
      setState(() {
        _FileName = result.files.single.name;
      });
    }
  }

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  // History arrives in the join reply; live messages arrive as "new_msg" (Phoenix chat server).
  TextMessage _toMessage(Map m) => TextMessage(
    authorId: m['author_id'] == _myChatId
        ? widget.MyID.toString()
        : widget.receiverId.toString(),
    id: (m['client_id'] ?? m['id']).toString(),
    text: m['text'] ?? '',
    createdAt: DateTime.tryParse('${m['timestamp']}'),
    status: MessageStatus.seen,
  );

  Future<void> connectChat() async {
    try {
      final res = await http.get(
        Uri.parse(
          'http://$wifiIP:8100/api/chatApp/token/?peer=${widget.receiverId}',
        ),
        headers: {'Authorization': 'Bearer ${await getAccessToken()}'},
      );
      if (res.statusCode != 200) {
        debugPrint('chat token error: ${res.body}');
        return;
      }
      final info = jsonDecode(res.body);
      _myChatId = info['user_id'];
      _socket = PhoenixSocket(
        info['ws_url'],
        socketOptions: PhoenixSocketOptions(params: {'token': info['token']}),
      );
      await _socket!.connect();
      _channel = _socket!.addChannel(topic: info['topic']);
      final joined = await _channel!.join().future;
      if (!mounted) return;
      final history = (joined.response?['messages'] as List? ?? []);
      chatController.insertAllMessages(
        history.map((m) => _toMessage(m as Map)).toList(),
      );
      _channel!.messages.listen((msg) {
        if (msg.event.value != 'new_msg' || !mounted) return;
        final m = msg.payload as Map;
        chatController.insertMessage(_toMessage(m));
      });
    } catch (e) {
      debugPrint('chat connect error: $e');
    }
  }

  void sendMessage({String? text, String? audioPath, String? imagePath}) async {
    // final text = _controller.text.trim();
    // if (text.isEmpty) return;

    if (imagePath != null || audioPath != null) {
      final token = await getAccessToken();

      final uri = Uri.parse("http://10.0.2.2:8100/api/chatApp/messages/");
      final request = http.MultipartRequest("POST", uri);

      request.fields['room_id'] = widget.roomId.toString();
      request.fields['sender_id'] = widget.MyID.toString();
      request.fields['timestamp'] = DateTime.now().toString();
      request.headers["Authorization"] = "Bearer $token";
      if (imagePath != null) {
        request.files.add(
          await http.MultipartFile.fromPath('image_message', imagePath),
        );
      }

      if (audioPath != null) {
        request.files.add(
          await http.MultipartFile.fromPath('voice_message', audioPath),
        );
      }
      final response = await request.send();

      if (response.statusCode == 201) {
        final responseBody = await response.stream.bytesToString();
        debugPrint("Response body: $responseBody");
        final message = jsonDecode(responseBody);
        debugPrint("Message uploaded successfully: ${jsonEncode(message)}");
        _channel?.push('new_msg', {
          'id': const Uuid().v4(),
          'text': '📷 Photo',
        });
      } else {
        // debugPrint("Failed to upload message: ${response.statusCode}");
      }
      final image = ImageMessage(
        id: const Uuid().v4(),
        authorId: widget.MyID.toString(),
        source: imagePath.toString(),
        width: 130,
        height: 200,
        createdAt: DateTime.now(),
        // name: "image",
      );
      chatController.insertMessage(image);
    } else {
      final cid = const Uuid().v4();
      chatController.insertMessage(
        TextMessage(
          authorId: "${widget.MyID}",
          id: cid,
          text: text ?? '',
          createdAt: DateTime.now(),
        ),
      );
      _channel?.push('new_msg', {'id': cid, 'text': text ?? ''});
    }

    _controller.clear();
  }

  @override
  void initState() {
    super.initState();
    connectChat();
  }

  void deleteImage() {
    setState(() {
      isDoc = false;
      // _File = null;
    });
  }

  @override
  void dispose() {
    _socket?.dispose();
    _controller.dispose();
    super.dispose();
  }

  // Future<dynamic> reselUsr() async {
  //   return null;
  // }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(backgroundImage: NetworkImage('${widget.profilePic}')),
            SizedBox(width: 10),
            Text('${widget.username}'),
          ],
        ),
      ),
      body: Chat(
        currentUserId: widget.MyID.toString(),
        resolveUser: (userId) async {
          return User(id: widget.MyID.toString());
        },
        theme: ChatTheme.light(),
        chatController: chatController,
        onMessageSend: (text) {
          sendMessage(text: text);
        },
        // onMessageTap: (message, {details, index}) => OnMessageTapCallback(details),
        // userCache: UserCache(maxSize: 50),
        // timeFormat: DateFormat.yMd(),
        onAttachmentTap: () {
          isDoc = true;
          showCupertinoModalPopup(
            context: context,
            builder: (context) {
              return CupertinoActionSheet(
                message: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Column(
                      spacing: 10,
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(
                              color: Colors.black54,
                              style: BorderStyle.solid,
                              strokeAlign: BorderSide.strokeAlignOutside,
                            ),
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                          child: IconButton(
                            highlightColor: Colors.transparent,
                            onPressed: () {
                              debugPrint('camera attcahment');
                            },
                            icon: Icon(
                              Icons.camera_alt,
                              size: 25,
                              color: Colors.pinkAccent,
                            ),
                          ),
                        ),
                        Text("Camera"),
                      ],
                    ),
                    Column(
                      spacing: 10,
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(
                              color: Colors.black54,
                              style: BorderStyle.solid,
                              strokeAlign: BorderSide.strokeAlignOutside,
                            ),
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                          child: IconButton(
                            highlightColor: Colors.transparent,
                            onPressed: () {
                              pickImage();
                              _isimg = true;
                            },
                            icon: Icon(
                              Icons.photo_library,
                              size: 25,
                              color: Colors.blue,
                            ),
                          ),
                        ),
                        Text("Gallery"),
                      ],
                    ),
                    Column(
                      spacing: 10,
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(
                              color: Colors.black54,
                              style: BorderStyle.solid,
                              strokeAlign: BorderSide.strokeAlignOutside,
                            ),
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                          child: IconButton(
                            highlightColor: Colors.transparent,
                            onPressed: () {
                              pickPdfFile();
                              _isimg = false;
                            },
                            icon: Icon(
                              Icons.attach_file,
                              size: 25,
                              color: Colors.green,
                            ),
                          ),
                        ),
                        Text("Document"),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        },
        builders: Builders(
          // textStreamMessageBuilder: (p0, p1, index, {groupStatus, required isSentByMe}) => TextStreamMessage.fromJson(),
          imageMessageBuilder:
              (p0, p1, index, {groupStatus, required isSentByMe}) =>
                  FlyerChatImageMessage(
                    message: p1,
                    index: index,
                    showStatus: true,
                    timeAndStatusPosition: p1.authorId == widget.MyID.toString()
                        ? TimeAndStatusPosition.end
                        : TimeAndStatusPosition.start,
                  ),

          textMessageBuilder:
              (p0, p1, index, {groupStatus, required isSentByMe}) =>
                  SimpleTextMessage(
                    message: p1,
                    index: index,
                    showTime: true,
                    onlyEmojiFontSize: 40,
                    sentTextStyle: TextStyle(fontSize: 16, color: Colors.white),
                    showStatus: true,
                    receivedTextStyle: TextStyle(
                      fontSize: 16,
                      color: Colors.black,
                    ),
                    timeStyle: p1.authorId == widget.MyID.toString()
                        ? TextStyle(fontSize: 9, color: Colors.white)
                        : TextStyle(fontSize: 9, color: Colors.black),
                    timeAndStatusPosition: p1.authorId == widget.MyID.toString()
                        ? TimeAndStatusPosition.end
                        : TimeAndStatusPosition.start,
                    linkPreviewPosition: LinkPreviewPosition.bottom,
                  ),

          chatMessageBuilder:
              (
                p0,
                message,
                index,
                animation,
                child, {
                MessageGroupStatus? groupStatus,
                bool? isRemoved,
                required bool isSentByMe,
              }) => //
              ChatMessage(
                message: message,
                isRemoved: false,
                index: index,
                animation: animation,

                leadingWidget: message.authorId == widget.receiverId.toString()
                    ? CircleAvatar(
                        radius: 13,
                        backgroundImage: NetworkImage(
                          widget.profilePic.toString(),
                        ),
                      )
                    : null,
                trailingWidget: message.authorId == widget.MyID.toString()
                    ? Icon(Icons.person)
                    : null,
                child: child,
              ),
          scrollToBottomBuilder: (p0, animation, onPressed) {
            return ScrollToBottom(
              animation: animation,
              onPressed: onPressed,
              useComposerHeightForBottomOffset: true,
              backgroundColor: const Color.fromARGB(255, 193, 166, 116),
            );
          },

          composerBuilder: (p0) {
            return Composer(
              filled: true,
              attachmentIcon: Icon(Icons.attach_file),
              sendIconColor: Colors.blueAccent,
              sendIcon: isDoc == true ? null : Icon(Icons.send),
              hintText: 'Type a message....',
              gap: 10,
              // topWidget: IconButton(onPressed: () {}, icon: Icon(Icons.mic)),
              topWidget: isDoc == true
                  ? Stack(
                      children: [
                        Row(
                          // spacing: 30,
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            _isimg == true
                                ? Image(
                                    image: FileImage(
                                      File(_Imagefile.toString()),
                                    ),
                                    fit: BoxFit.cover,
                                    filterQuality: FilterQuality.high,
                                    height: 400,
                                  )
                                : Container(
                                    height: 200,
                                    padding: EdgeInsets.all(8.0),
                                    decoration: BoxDecoration(
                                      // color: const Color.fromARGB(255, 218, 222, 223),
                                      shape: BoxShape.rectangle,
                                    ),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        const Icon(
                                          Icons.picture_as_pdf,
                                          size: 25,
                                          color: Color.fromARGB(
                                            255,
                                            151,
                                            29,
                                            20,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          _FileName ?? '',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 20,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),

                            // : Text(_FileName.toString()),
                            _isimg == true
                                ? IconButton.filled(
                                    highlightColor: Colors.blueAccent,
                                    onPressed: () {
                                      sendMessage(imagePath: _Imagefile);
                                      deleteImage();
                                    },

                                    // onPressed: () {},
                                    // color: Colors.black,
                                    style: ButtonStyle(
                                      backgroundColor: WidgetStatePropertyAll(
                                        const Color.fromARGB(
                                          255,
                                          190,
                                          182,
                                          182,
                                        ),
                                      ),
                                    ),
                                    icon: Icon(
                                      Icons.send,
                                      color: const Color.fromARGB(255, 0, 0, 0),
                                    ),
                                  )
                                : IconButton.filled(
                                    highlightColor: const Color.fromARGB(
                                      255,
                                      8,
                                      8,
                                      8,
                                    ),
                                    onPressed: () {
                                      debugPrint("file pdf: $_FileName");
                                      deleteImage();
                                    },

                                    style: ButtonStyle(
                                      backgroundColor: WidgetStatePropertyAll(
                                        const Color.fromARGB(
                                          255,
                                          190,
                                          182,
                                          182,
                                        ),
                                      ),
                                    ),
                                    icon: Icon(
                                      Icons.send,
                                      color: const Color.fromARGB(
                                        255,
                                        198,
                                        7,
                                        7,
                                      ),
                                    ),
                                  ),
                          ],
                        ),
                        Positioned(
                          left: 400,
                          child: IconButton.outlined(
                            onPressed: deleteImage,
                            icon: Icon(Icons.cancel),
                            color: Colors.red,
                          ),
                        ),
                      ],
                    )
                  : IconButton(onPressed: () {}, icon: Icon(Icons.mic)),
            );
          },
          loadMoreBuilder: (p0) {
            return LoadMore(color: Colors.red, size: 20);
          },
          // emptyChatListBuilder: (p0) => EmptyChatList(),
        ),
      ),
    );
  }
}
