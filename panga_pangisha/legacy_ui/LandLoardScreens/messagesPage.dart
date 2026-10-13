import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:panga_pangisha/LandLoardScreens/chattingPage.dart';
import 'package:panga_pangisha/LandLoardScreens/newMessage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:panga_pangisha/CustomeControl/Shimmer.dart';

class Messageslandlord extends StatefulWidget {
  const Messageslandlord({super.key});

  @override
  State<Messageslandlord> createState() => _MessageslandlordState();
}

class _MessageslandlordState extends State<Messageslandlord> {
  List<dynamic> users = [];
  String? _username;
  int? _MyId;
  final String wifiIP = '10.0.2.2';
  final String LocalIP = '10.0.2.2';
  bool isloading = false;

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  // Fecth all users in backend for now but later we need to implemnts subscription
  //subscriptions = (only user how subscribe to your account you can see through this API)
  Future<void> fetchUsers() async {
    final accessToken = await getAccessToken();

    try {
      final response = await http.get(
        Uri.parse("http://$wifiIP:8100/api/user/getUsers/"),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
      );
      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        setState(() {
          users = body;
        });
      }
    } catch (e) {
      debugPrint('$e');
    }
  }

  // FUNCTIION of getttingOr create
  Future<int> getOrCreateRoom(String userId) async {
    final accessToken = await getAccessToken();
    final response = await http.get(
      Uri.parse('http://$wifiIP:8100/api/chatApp/get-room-message/$userId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
    );
    // hapa nataka jinsi ya kuhandel data kama ikitokea error app in corrupt if conditions haifanyi kazi kwasabab ya return int
    final data = jsonDecode(response.body);
    return data['room_id'];
  }

  Future<void> fetchData() async {
    final accessToken = await getAccessToken();
    final url = Uri.parse("http://$wifiIP:8100/api/profile/UserUpdateProfile/");
    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
      );
      if (response.statusCode == 200) {
        final body = json.decode(response.body);
        final data = body['data'];
        final name = body['username'];
        final user_Id = data['user'];
        setState(() {
          _username = name;
          _MyId = user_Id;
        });
      } else {
        debugPrint(json.decode(response.body));
        debugPrint("Error");
      }
    } catch (e) {
      debugPrint('$e');
    }
  }

  @override
  void initState() {
    super.initState();
    fetchData();
    fetchUsers();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _username != null && _username!.isNotEmpty
            ? Text(
                '$_username',
                style: TextStyle(
                  color: const Color.fromARGB(255, 126, 23, 146),
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                ),
              )
            : ShimmerUserInfo(),
        // backgroundColor: const Color.fromARGB(255, 236, 195, 160),
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => Newmessage()),
              );
            },
            icon: Icon(Icons.mode_edit_outlined),
          ),
        ],
        primary: true,
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              children: [
                SizedBox(height: 10),
                SizedBox(
                  // width: size.width / 1.05,
                  height: 50,
                  child: SearchBar(
                    leading: Icon(Icons.search, color: Colors.grey),
                    hintText: 'Search....',
                    onSubmitted: (value) {
                      debugPrint(value);
                    },
                    textInputAction: TextInputAction.search,
                    shape: WidgetStateProperty.all(
                      RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),

                SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'messages',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        'Requests',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: const Color.fromARGB(255, 59, 90, 192),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          users.isNotEmpty
              ? SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final user = users[index];
                    return GestureDetector(
                      behavior: HitTestBehavior.translucent,
                      onTap: () async {
                        final user_image =
                            'http://$wifiIP:8100/Media/${user['User_Profile__profile_image']}';
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => Chattingpage(
                              username: user['fullname'],
                              profilePic: user_image,
                              receiverId: user['id'],
                              roomId: null,
                              MyID: _MyId,
                            ),
                          ),
                        );
                      },
                      child: Container(
                        height: 80,
                        decoration: BoxDecoration(
                          // color: Colors.black,
                          borderRadius: BorderRadius.all(Radius.circular(10.0)),
                        ),
                        margin: EdgeInsets.all(8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              spacing: 10,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                CircleAvatar(
                                  radius: 35,

                                  backgroundImage: NetworkImage(
                                    'http://$wifiIP:8100/Media/${user['User_Profile__profile_image']}',
                                  ),
                                ),
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('${user["fullname"]}'),
                                    Text('sent at 5:06'),
                                  ],
                                ),
                              ],
                            ),
                            IconButton(
                              onPressed: () {},
                              icon: Icon(Icons.camera_alt),
                            ),
                          ],
                        ),
                      ),
                    );
                  }, childCount: users.length),
                )
              : ShimmerChattingList(),
        ],
      ),
    );
  }
}

// class ListUsersScreen extends StatelessWidget {
//   final String jwtToken;

//   ListUsersScreen({required this.jwtToken});

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(title: Text("Select User to Chat")),
//       body: FutureBuilder(
//         future: fetchUsers(),
//         builder: (context, snapshot) {
//           if (!snapshot.hasData) return CircularProgressIndicator();
//           List users = snapshot.data as List;
//           return ListView.builder(
//             itemCount: users.length,
//             itemBuilder: (_, index) {
//               var user = users[index];
//               return ListTile(
//                 title: Text(user['username']),
//                 onTap: () async {
//                   int roomId = await getOrCreateRoom(user['id'].toString());
//                   Navigator.pushNamed(context, '/chat', arguments: {
//                     'roomId': roomId,
//                     'jwtToken': jwtToken,
//                     'receiver': user['username']
//                   });
//                 },
//               );
//             },
//           );
//         },
//       ),
//     );
//   }
// }
