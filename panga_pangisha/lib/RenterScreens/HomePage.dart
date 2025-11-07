// import 'dart:io';

import 'dart:io';
// import 'package:local_auth/local_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
// import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:panga_pangisha/CustomeControl/Network&Tokens.dart';
import 'package:panga_pangisha/LandLoardScreens/notification.dart';
import 'package:panga_pangisha/RenterScreens/roomHouseReview.dart';
import 'package:panga_pangisha/main.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
// import 'package:permission_handler/permission_handler.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:panga_pangisha/CustomeControl/Shimmer.dart';
import 'package:flutter_speed_dial/flutter_speed_dial.dart';

class RenterHomepage extends StatefulWidget {
  const RenterHomepage({super.key});

  @override
  _HomepageState createState() => _HomepageState();
}

class _HomepageState extends State<RenterHomepage> {
  String? profile_pic;
  String? username;
  bool no_Conn = true;
  List<String> categoryLIst = [
    'House',
    'Office',
    'Apartment',
    'condaminium',
    'Hotel',
    'Rooms',
  ];
  int selectedIndex = 0;
  // String? typeHouse;

  List<dynamic> houses = [];

  Future<void> requestNotificationPermission() async {}

  // Future<void> showNotification() async {
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
  //           );

  //       const NotificationDetails platformDetails = NotificationDetails(
  //         android: androidDetails,
  //       );

  //       await flutterLocalNotificationsPlugin.show(
  //         0, // Notification ID
  //         'Hello! Kimmy',
  //         'This is a local notification',
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

  Future<void> FetchData() async {
    final accessToken = await RenterPreferrencesToken().getAccessToken();
    // final _UserID = await getUserID();
    final url = Uri.parse(APIEndPointURL.userProfile);
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
          profile_pic = '${APIEndPointURL.profilrPic}$data';
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

  Future<void> GetAvailableHouses({String? typeHouse, String? value}) async {
    final accessToken = await RenterPreferrencesToken().getAccessToken();
    // final _UserID = await getUserID();
    print(value);
    final url = Uri.parse(
      "${APIEndPointURL.searchHouse}?house_type=${typeHouse ?? ""}&district=${value ?? ""}",
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
        if (body is List && body.isNotEmpty) {
          setState(() {
            houses = body;
          });
        }
        print(body);
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
    GetAvailableHouses(typeHouse: "House");

    // requestNotificationPermission();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: SafeArea(
          minimum: EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    spacing: 10,
                    children: [
                      CircleAvatar(
                        radius: 25,
                        backgroundImage:
                            profile_pic != null && profile_pic!.isNotEmpty
                            ? NetworkImage(profile_pic!)
                            : null,
                        child: (profile_pic == null || profile_pic!.isEmpty)
                            ? const ShimmerCircelAvatar(size: 25)
                            : null,
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          username != null && username!.isNotEmpty
                              ? Text(
                                  "Hello ${username.toString().toUpperCase()}",
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    // color: Color.fromARGB(255, 164, 139, 28),
                                    fontFamily: "times new roman",
                                  ),
                                )
                              : const ShimmerUserInfo(
                                  // TextValue: "Sir/Madam",
                                  // fontSize: 30,
                                ),
                          Text(
                            "welcome back",
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color.fromARGB(255, 164, 101, 28),
                              fontFamily: "times new roman",
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Badge(
                    // backgroundColor: Colors.transparent,
                    // textColor: const Color.fromARGB(255, 173, 31, 31),
                    label: Text('12'),
                    offset: Offset(-2, 6),
                    child: IconButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => NotificationPage(),
                          ),
                        );
                      },
                      icon: Icon(Icons.notifications_none_outlined),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 50),
              SearchBar(
                leading: Icon(Icons.search, color: Colors.grey),
                hintText: 'Search for rooms, tenants, etc.',
                onSubmitted: (value) {
                  GetAvailableHouses(value: value);
                },
                textInputAction: TextInputAction.search,
                shape: WidgetStateProperty.all(
                  RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),

              const SizedBox(height: 10),
              SizedBox(
                height: 80,
                child: ListView.builder(
                  itemCount: categoryLIst.length,
                  scrollDirection: Axis.horizontal,
                  itemBuilder: (context, index) {
                    final isselected = selectedIndex == index;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          selectedIndex = index;
                          final typeHouse = categoryLIst[index];
                          GetAvailableHouses(typeHouse: typeHouse);
                        });
                      },
                      child: Container(
                        width: 120,
                        margin: EdgeInsetsGeometry.all(12),
                        // padding: EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: isselected
                              ? Colors.grey[200]
                              : const Color.fromARGB(150, 197, 103, 31),
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                        ),
                        child: Center(
                          child: Text(
                            categoryLIst[index],
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isselected ? Colors.black : Colors.white,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              // SizedBox(height: 20),
              houses.isNotEmpty
                  ? SizedBox(
                      height: 300,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: houses.length,
                        itemBuilder: (context, index) {
                          final house = houses[index];
                          return GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => Roomhousereview(
                                    houseID: house['id'],
                                    nameOfHouse: house['house_type'],
                                    houseImage: house['house_profile_image'],
                                  ),
                                ),
                              );
                            },
                            child: SizedBox(
                              width: 300,
                              child: Card(
                                color: const Color.fromARGB(255, 181, 127, 11),
                                margin: EdgeInsets.all(15),
                                child: Stack(
                                  children: [
                                    Container(
                                      height: 500,
                                      decoration: BoxDecoration(
                                        image: DecorationImage(
                                          image: NetworkImage(
                                            house['house_profile_image'],
                                          ),
                                          fit: BoxFit.fill,
                                          filterQuality: FilterQuality.high,
                                        ),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    Positioned(
                                      bottom: 25,
                                      left: 10,
                                      child: Container(
                                        // decoration: BoxDecoration(
                                        //   color: Colors.blueGrey,
                                        //   borderRadius: BorderRadius.all(
                                        //     Radius.circular(4),
                                        //   ),
                                        // ),
                                        child: Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.start,
                                          children: [
                                            Text(
                                              house['house_type'],
                                              style: TextStyle(
                                                color: const Color.fromARGB(
                                                  255,
                                                  230,
                                                  226,
                                                  226,
                                                ),
                                                fontSize: 25,
                                                fontWeight: FontWeight.bold,
                                                overflow: TextOverflow.fade,
                                              ),
                                            ),
                                            Text(
                                              '${house['district']},${house['city']}',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                fontStyle: FontStyle.italic,
                                                overflow: TextOverflow.fade,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      right: 5,
                                      top: 10,
                                      child: Container(
                                        height: 20,
                                        // width: 60,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: Colors.transparent,
                                          borderRadius: BorderRadius.all(
                                            Radius.circular(4),
                                          ),
                                        ),
                                        child: Text(
                                          house['available'],
                                          style: TextStyle(color: Colors.white),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      bottom: 25,
                                      right: 20,
                                      child: Icon(
                                        CupertinoIcons.heart_fill,
                                        color: Colors.red,

                                        size: 18,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    )
                  : SizedBox(
                      height: 300,
                      child: ShimmerRequestCards(
                        ItemCount: 5,
                        sizBoxHeight: 200,
                        directionAxis: Axis.horizontal,
                        widthBoxHeight: 300,
                      ),
                    ),

              houses.isNotEmpty
                  ? Column(
                      children: houses.map((house) {
                        return SizedBox(
                          height: 350,
                          child: Card(
                            color: const Color.fromARGB(255, 181, 127, 11),
                            margin: EdgeInsets.all(20),
                            child: Text(house['house_type']),
                          ),
                        );
                      }).toList(),
                    )
                  : Column(
                      children: houses.map((house) {
                        return SizedBox(
                          height: 300,
                          child: ShimmerRequestCards(
                            ItemCount: 5,
                            sizBoxHeight: 200,
                            directionAxis: Axis.vertical,
                            widthBoxHeight: 300,
                          ),
                        );
                      }).toList(),
                    ),
              // Expanded(
              //   // height: 300,
              //   child: ListView.builder(
              //     scrollDirection: Axis.vertical,
              //     itemCount: 5,
              //     itemBuilder: (context, index) {
              //       return SizedBox(
              //         width: 250,
              //         height: 200,
              //         child: Card(
              //           color: const Color.fromARGB(255, 181, 127, 11),
              //           margin: EdgeInsets.all(15),
              //         ),
              //       );
              //     },
              //   ),
              // ),
            ],
          ),
        ),
      ),
      floatingActionButton: SpeedDial(
        icon: Icons.search,
        activeIcon: Icons.close,
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        overlayColor: Colors.black,
        overlayOpacity: 0.5,
        spacing: 10,
        spaceBetweenChildren: 8,
        children: [
          SpeedDialChild(
            child: Icon(Icons.place),
            label: 'place',
            backgroundColor: Colors.purpleAccent,
            onTap: () => print('Message tapped'),
          ),
          SpeedDialChild(
            child: Icon(CupertinoIcons.circle),
            label: 'status',
            backgroundColor: Colors.green,
            onTap: () => print('Call tapped'),
          ),
          SpeedDialChild(
            child: Icon(Icons.email),
            label: 'Email',
            backgroundColor: Colors.blue,
            onTap: () => print('Email tapped'),
          ),
        ],
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
