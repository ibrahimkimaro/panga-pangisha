import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:panga_pangisha/CustomeControl/Shimmer.dart';

class Rooomsrequests extends StatefulWidget {
  const Rooomsrequests({super.key});

  @override
  State<Rooomsrequests> createState() => _RooomsrequestsState();
}

class _RooomsrequestsState extends State<Rooomsrequests> {
  String? profilePic;
  String? nameOfHouse;
  bool isLoading = false;
  List<dynamic> houses = [];

  final String wifiIP = '10.0.2.2';
  final String locaLIP = '10.240.11.138';

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<void> fetchProfileData() async {
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
        final imageUrl = body['data']['profile_image'];
        setState(() {
          profilePic = 'http://$wifiIP:8100$imageUrl';
        });
      } else {
        debugPrint("Profile fetch error: ${response.body}");
      }
    } catch (e) {
      debugPrint("Error fetching profile: $e");
    }
  }

  Future<void> fetchHouseData() async {
    final accessToken = await getAccessToken();
    final url = Uri.parse("http://$wifiIP:8100/api/landlord/getAllHouses/");
    setState(() {
      isLoading = true;
    });
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
        if (body is List && body.isNotEmpty) {
          setState(() {
            houses = body;
          });
        }
      } else {
        debugPrint("House fetch error: ${response.body}");
      }
    } catch (e) {
      debugPrint("Error fetching house data: $e");
    }
  }

  @override
  void initState() {
    super.initState();
    fetchProfileData();
    fetchHouseData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        // toolbarHeight: 80,
        title: const Text(
          "Requests",
          style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color.fromARGB(255, 236, 195, 160),
        // centerTitle: true,
        actions: [
          Badge(
            label: Text('20+'),
            alignment: Alignment.topRight,
            backgroundColor: Colors.blueGrey,
            offset: Offset(-3, 5),
            child: IconButton(
              style: ButtonStyle(
                backgroundColor: WidgetStateProperty.all(
                  const Color.fromARGB(170, 211, 211, 211),
                ),
                // shape: WidgetStatePropertyAll(BeveledRectangleBorder),
              ),
              highlightColor: const Color.fromARGB(255, 149, 192, 187),
              iconSize: 25,
              icon: const Icon(Icons.notifications),
              onPressed: () {
                Navigator.pushNamed(context, '/notification');
              },
            ),
          ),
          SizedBox(width: 20),
          CircleAvatar(
            radius: 25,
            backgroundImage: profilePic != null && profilePic!.isNotEmpty
                ? Image.network(profilePic!, fit: BoxFit.cover).image
                : AssetImage('assets/images/defaultImage.png'),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: ListView.builder(
        itemCount: 5,
        itemBuilder: (context, index) {
          return SizedBox(
            height: 300,
            child: Card(
              elevation: 4,
              margin: EdgeInsets.all(10),
              child: const ShimmerRequestCards(
                ItemCount: 3,
                sizBoxHeight: 300,
                directionAxis: Axis.vertical,
                widthBoxHeight: 200,
              ),
            ),
          );
        },
      ),
    );
  }
}
