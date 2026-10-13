import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// import 'package:http/http.dart' as http;
// import 'dart:convert';
// import 'package:shared_preferences/shared_preferences.dart';

class NotificationPage extends StatefulWidget {
  const NotificationPage({super.key});

  @override
  State<NotificationPage> createState() => _NotificationPageState();
}

class _NotificationPageState extends State<NotificationPage> {
  String? profile_pic;
  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<int?> getUserID() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('user_ID');
  }

  // iP address for devlopment in testing i will ngrok for forwaring
  final String LocalIp = '10.0.2.2';
  final String wifiIP = '10.0.2.2';

  Future<void> FetchData() async {
    final accessToken = await getAccessToken();
    // final _UserID = await getUserID();
    final url = Uri.parse(
      "http://$LocalIp:8100/api/profile/UserUpdateProfile/",
    );
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
        final img = data['profile_image'];
        setState(() {
          profile_pic = 'http://$LocalIp:8100$img';
          // data2 = datas['email'];
        });
      } else {
        debugPrint("error");
        setState(() {
          // data2 = "Data error";
        });
      }
    } catch (e) {
      debugPrint('$e');
      CircularProgressIndicator(color: const Color.fromARGB(255, 201, 127, 16));
      // debugPrint('$e');
    }
  }

  @override
  void initState() {
    super.initState();
    FetchData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Notifications"),
        centerTitle: true,
        // toolbarHeight: 80,
        backgroundColor: const Color.fromARGB(255, 191, 180, 209),

        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 20),
            child: CircleAvatar(
              radius: 20,
              backgroundImage: profile_pic != null && profile_pic!.isNotEmpty
                  ? Image.network(profile_pic!, fit: BoxFit.cover).image
                  : AssetImage('assets/images/defaultImage.png'),
            ),
          ),
        ],
      ),
      body: Center(child: Text("See all notifications here")),
    );
  }
}
