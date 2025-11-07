import 'dart:ffi';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_chat_core/flutter_chat_core.dart';
import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:flutter_chat_ui/src/chat_message/chat_message.dart';
// import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:google_maps_webservice/directions.dart';
import 'package:hive/hive.dart';
import 'package:image_picker/image_picker.dart';
import 'package:panga_pangisha/main.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:flutter_chat_types/flutter_chat_types.dart' as types;
import 'package:http/http.dart' as http;
import 'package:shimmer/main.dart';
import 'package:uuid/uuid.dart';
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/status.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
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
  TextEditingController _controller = TextEditingController();
  late WebSocketChannel channel;
  final String wifiIP = '192.168.1.154';

  final ChatController chatController = InMemoryChatController();
  // bool isRecording = true;

  File? _File;
  String? _FileName;
  String? _Imagefile;
  String? _ImageName;
  bool isDoc = false;
  bool _isimg = false;
  // Future<void> showNotification(id, text) async {
  //   if (Platform.isAndroid) {
  //     final status = await Permission.notification.status;
  //     if (status.isGranted) {
  //       const AndroidNotificationDetails androidDetails =
  //           AndroidNotificationDetails(
  //             'channel_id',
  //             'channel_name',
  //             channelDescription: 'description of the channel',
  //             importance: Importance.max,
  //             priority: Priority.high,
  //             showWhen: true,
  //             channelShowBadge: true,
  //           );

  //       const NotificationDetails platformDetails = NotificationDetails(
  //         android: androidDetails,
  //       );

  //       await flutterLocalNotificationsPlugin.show(
  //         0, // Notification ID
  //         id.toString(),
  //         text.toString(),
  //         platformDetails,
  //       );
  //     } else if (status.isDenied) {
  //       await openAppSettings();
  //     } else if (status.isPermanentlyDenied) {
  //       openAppSettings();
  //     } else {
  //       await Permission.notification.request();
  //     }
  //   } else if (Platform.isIOS) {
  //     // Handle iOS notification permission request
  //     // For iOS, you might want to use a different package or method
  //   }
  // }

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
        _ImageName = pickedFile.name;
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
        _File = File(result.files.single.path!);
        _FileName = result.files.single.name;
      });
    }
  }

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<void> fetchMessages() async {
    final accessToken = await getAccessToken();
    final response = await http.get(
      Uri.parse(
        'http://$wifiIP:8000/api/chatApp/get-messages/${widget.roomId}/',
      ),
      headers: {
        "Authorization": "Bearer $accessToken",
        'Content-Type': 'multipart/form-data',
      },
    );

    if (response.statusCode == 200) {
      // utf8.decode inafanya decod ya bits like emoje message to be decode if you will use jsonDecode() only --
      // -- you can't see emaoje as emoje you will as boxes
      final decode = utf8.decode(response.bodyBytes);
      final data = jsonDecode(decode);
      for (var msg in data) {
        print(msg['text']);
      }

      final messages = (data as List).map((msg) {
        //   print(msg);

        if (msg["image_message"] != null &&
            msg["image_message"].toString().isNotEmpty) {
          return ImageMessage(
            id: msg['id'].toString(),
            authorId: msg['sender'].toString(),
            source: "http://192.168.1.154:8000${msg['image_message']}",
            createdAt: DateTime.tryParse(msg['timestamp']),
            status: MessageStatus.seen,
          );
        } else {
          return TextMessage(
            authorId: "${msg['sender']}",
            id: msg['id'].toString(),
            text: msg['text'] ?? '',
            pinned: true,
            createdAt: DateTime.tryParse(msg['timestamp']),
            status: MessageStatus.seen,
          );
        }
      }).toList();

      chatController.insertAllMessages(messages);

      // });
    } else {
      print("Error fetching messages: ${response.body}");
    }
  }

  void connectWebsocket() async {
    final token = await SharedPreferences.getInstance().then(
      (prefs) => prefs.getString('access_token'),
    );
    try {
      final uri = Uri.parse('ws://$wifiIP:8080/ws?room_id=2');
      // channel = WebSocketChannel.connect(uri);
      channel = IOWebSocketChannel.connect(
        uri.toString(),
        headers: {
          'Authorization': token,
          'Content-Type': 'multipart/form-data',
        },
      );

      // channel = WebSocketChannel(channel);
      channel.stream.listen(
        (message) {
          final decode = jsonDecode(message);
          print("DATA FROM GO $decode");
          final messages = TextMessage(
            authorId: "${widget.receiverId}",
            id: "$decode['id']",
            text: decode['text'],
            createdAt: DateTime.tryParse(decode['timestamp']),
          );
          // showNotification(widget.username, decode['text']);
          chatController.insertMessage(messages);
        },
        onError: (err) {
          print('Websocket Error: $err');
        },
        onDone: () {
          print('websocket connection close');
        },
      );
    } catch (e) {
      print("Erro: $e");
    }
  }

  void sendMessage({String? text, String? audioPath, String? imagePath}) async {
    // final text = _controller.text.trim();
    // if (text.isEmpty) return;

    String? audioFile;
    String? imageFile;

    if (imagePath != null || audioPath != null) {
      final token = await getAccessToken();

      final uri = Uri.parse("http://192.168.1.154:8000/api/chatApp/messages/");
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
        print("Response body: $responseBody");
        final message = jsonDecode(responseBody);
        print("Message uploaded successfully: ${jsonEncode(message)}");
        final newMessageImag = {
          'room_id': widget.roomId,
          'sender_id': widget.MyID,
          'text': null,
          'audio_message': null,
          'image_message': "/Media/message/image_message/$_ImageName",
          'status': null,
          'timestamp': DateTime.now().toString(),
        };
        //   print(newMessageImag);
        //   print(message);
        //   print(_ImageName);
        channel.sink.add(jsonEncode(newMessageImag));
      } else {
        // print("Failed to upload message: ${response.statusCode}");
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
      final newMessage = {
        'room_id': widget.roomId,
        'sender_id': widget.MyID,
        'text': text ?? null,
        'audio_message': audioFile ?? null,
        'image_message': imagePath ?? null,
        'status': 'sent',
        'timestamp': DateTime.now().toString(),
      };
      print(newMessage);
      final messages = TextMessage(
        authorId: "${widget.MyID}",
        id: const Uuid().v4(),
        text: text ?? '',
        createdAt: DateTime.now(),
      );

      chatController.insertMessage(messages);
      channel.sink.add(jsonEncode(newMessage));
    }

    _controller.clear();
  }

  @override
  void initState() {
    super.initState();
    fetchMessages();
    connectWebsocket();
  }

  void deleteImage() {
    setState(() {
      isDoc = false;
      // _File = null;
    });
  }

  @override
  void dispose() {
    channel.sink.close();
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
                              print('camera attcahment');
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
                              ;
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
                                ? Container(
                                    // width: 300,
                                    child: Image(
                                      image: FileImage(
                                        File(_Imagefile.toString()),
                                      ),
                                      fit: BoxFit.cover,
                                      filterQuality: FilterQuality.high,
                                      height: 400,
                                    ),
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
                                      print("file pdf: $_FileName");
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
