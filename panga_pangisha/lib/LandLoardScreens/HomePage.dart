// import 'dart:io';

import 'dart:io';
// import 'package:local_auth/local_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:panga_pangisha/CustomeControl/Network&Tokens.dart';
import 'package:panga_pangisha/main.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
// import 'package:permission_handler/permission_handler.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:panga_pangisha/CustomeControl/Shimmer.dart';

class Homepage extends StatefulWidget {
  const Homepage({super.key});

  @override
  _HomepageState createState() => _HomepageState();
}

class _HomepageState extends State<Homepage> {
  String? profile_pic;
  String? username;

  Future<void> requestNotificationPermission() async {}

  Future<void> showNotification() async {
    if (Platform.isAndroid) {
      final status = await Permission.notification.status;
      if (status.isGranted) {
        const AndroidNotificationDetails androidDetails =
            AndroidNotificationDetails(
              'channel_id',
              'channel_name',
              channelDescription: 'description of the channel',
              importance: Importance.max,
              priority: Priority.high,
            );

        const NotificationDetails platformDetails = NotificationDetails(
          android: androidDetails,
        );

        await flutterLocalNotificationsPlugin.show(
          0, // Notification ID
          'Hello! Kimmy',
          'This is a local notification',
          platformDetails,
        );
      } else if (status.isDenied) {
        await openAppSettings();
      } else if (status.isPermanentlyDenied) {
        openAppSettings();
      } else {
        await Permission.notification.request();
      }
    } else if (Platform.isIOS) {
      // Handle iOS notification permission request
      // For iOS, you might want to use a different package or method
    }
  }

  // iP address for devlopment in testing i will ngrok for forwaring
  final String LocalIp = '10.227.172.138';
  final String wifiIP = '192.168.1.154';

  Future<void> FetchData() async {
    final accessToken = await LandLordPreferrencesToken().getAccessToken();
    // final _UserID = await getUserID();
    final url = Uri.parse("http://$wifiIP:8000/api/profile/UserUpdateProfile/");
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
        final img = body['data'];
        final name = body['username'];
        final data = img['profile_image'];
        setState(() {
          profile_pic = 'http://$wifiIP:8000$data';
          username = name;
          // profile_pic != null && profile_pic!.isNotEmpty
          //     ?
          //     : null;
          // data2 = datas['email'];
        });
      } else {
        final body = json.decode(response.body);
        print(body);
        print("error");
        setState(() {
          // data2 = "Data error";
        });
      }
    } catch (e) {
      print(e);
      CircularProgressIndicator(color: const Color.fromARGB(255, 201, 127, 16));
      // print(e);
    }
  }

  @override
  void initState() {
    super.initState();
    FetchData();
    // requestNotificationPermission();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        // toolbarHeight: 80,
        title: const Text(
          "Panga Pangisha",
          style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color.fromARGB(255, 236, 195, 160),
        // centerTitle: true,
        actions: [
          Badge(
            label: Text('1'),
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
              iconSize: 23,
              icon: const Icon(Icons.notifications),
              onPressed: () {
                Navigator.pushNamed(context, '/notification');
              },
            ),
          ),
          SizedBox(width: 15),
          CircleAvatar(
            radius: 25,
            backgroundImage: profile_pic != null && profile_pic!.isNotEmpty
                ? NetworkImage(profile_pic!)
                : null,
            child: (profile_pic == null || profile_pic!.isEmpty)
                ? const ShimmerCircelAvatar(size: 25)
                : null,
          ),
          const SizedBox(width: 16),
        ],
      ),
      // backgroundColor: Color(0xFF1B1F3B),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    "Hi",
                    style: TextStyle(fontSize: 30, fontWeight: FontWeight.w500),
                  ),
                  SizedBox(width: 12),
                  username != null && username!.isNotEmpty
                      ? Text(
                          username!,
                          style: const TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.bold,
                            color: Color.fromARGB(255, 164, 139, 28),
                            fontFamily: "times new roman",
                          ),
                        )
                      : const ShimmerUserInfo(
                          // TextValue: "Sir/Madam",
                          // fontSize: 30,
                        ),
                ],
              ),

              const SizedBox(height: 8),
              // const Text(
              //   "Welcome back to your dashboard",
              //   style: TextStyle(fontSize: 20, fontWeight: FontWeight.normal),
              // ),
              const SizedBox(height: 24),

              SearchBar(
                leading: Icon(Icons.search, color: Colors.grey),
                hintText: 'Search for rooms, tenants, etc.',
                onSubmitted: (value) {
                  print(value);
                },
                textInputAction: TextInputAction.search,
                shape: WidgetStateProperty.all(
                  RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              Container(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    GestureDetector(
                      onTap: () {
                        Navigator.pushNamed(context, '/manageRoom');
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        height: 80,
                        width: 200,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          spacing: 10,
                          children: [
                            const Icon(
                              Icons.house_outlined,
                              size: 30,
                              color: Colors.deepPurple,
                            ),
                            const Text(
                              'My Property',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 10),
                          ],
                        ),
                      ),
                    ),
                    GestureDetector(
                      onDoubleTap: () => {print("manage listing")},
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        height: 80,
                        width: 200,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.list_alt,
                              size: 30,
                              color: Colors.deepPurple,
                            ),
                            SizedBox(width: 10),
                            const Text(
                              'Manage \n Listigngs',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 10),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 16),
              // Summary Cards (first row)
              // Row(
              //   children: const [
              //     DashboardCard(title: 'Rooms', value: '12', icon: Icons.home),
              //     SizedBox(width: 16),
              //     DashboardCard(
              //       title: 'Tenants',
              //       value: '34',
              //       icon: Icons.people,
              //     ),
              //   ],
              // ),
              // const SizedBox(height: 16),

              // // Summary Cards (second row)
              // Row(
              //   children: const [
              //     DashboardCard(
              //       title: 'Income',
              //       value: 'TZS 1.2M',
              //       icon: Icons.attach_money,
              //     ),
              //     SizedBox(width: 16),
              //     DashboardCard(
              //       title: 'Vacant',
              //       value: '3',
              //       icon: Icons.meeting_room_outlined,
              //     ),
              //   ],
              // ),
              const SizedBox(height: 24),

              // Quick Actions
              const Text(
                'Your Properties',
                style: TextStyle(fontSize: 40, fontWeight: FontWeight.w600),
              ),
              ElevatedButton(
                onPressed: showNotification,
                child: Text('Show Notification'),
              ),

              // const SizedBox(height: 12),
              // Wrap(
              //   spacing: 16,
              //   runSpacing: 16,
              //   children: const [
              //     ActionButton(label: 'Add Room', icon: Icons.add_home_work),
              //     ActionButton(label: 'View Tenants', icon: Icons.group),
              //     ActionButton(label: 'Payments', icon: Icons.payment),
              //     ActionButton(label: 'Reports', icon: Icons.bar_chart),
              //   ],
              // ),
            ],
          ),
        ),
      ),
    );
  }
}

// class DashboardCard extends StatelessWidget {
//   final String title;
//   final String value;
//   final IconData icon;

//   const DashboardCard({
//     super.key,
//     required this.title,
//     required this.value,
//     required this.icon,
//   });

//   @override
//   Widget build(BuildContext context) {
//     return Expanded(
//       child: Container(
//         padding: const EdgeInsets.all(16),
//         decoration: BoxDecoration(
//           color: Colors.white,
//           borderRadius: BorderRadius.circular(12),
//           boxShadow: const [
//             BoxShadow(
//               color: Colors.black12,
//               blurRadius: 4,
//               offset: Offset(0, 2),
//             ),
//           ],
//         ),
//         child: Column(
//           children: [
//             Icon(icon, size: 30, color: Colors.deepPurple),
//             const SizedBox(height: 10),
//             Text(
//               value,
//               style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//             ),
//             Text(
//               title,
//               style: const TextStyle(fontSize: 14, color: Colors.grey),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

// class ActionButton extends StatelessWidget {
//   final String label;
//   final IconData icon;

//   const ActionButton({super.key, required this.label, required this.icon});

//   @override
//   Widget build(BuildContext context) {
//     return SizedBox(
//       width: 160,
//       child: ElevatedButton.icon(
//         onPressed: () {},
//         icon: Icon(icon, size: 18),
//         label: Text(label),
//         style: ElevatedButton.styleFrom(
//           backgroundColor: Colors.deepPurple,
//           foregroundColor: Colors.white,
//           padding: const EdgeInsets.symmetric(vertical: 14),
//           shape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(10),
//           ),
//         ),
//       ),
//     );
//   }
// }
