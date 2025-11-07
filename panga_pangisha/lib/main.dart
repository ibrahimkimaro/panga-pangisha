import 'package:flutter/material.dart';
import 'package:panga_pangisha/LandLoardScreens/MainScreen.dart';
// import 'package:panga_pangisha/authScreens/loginScreen.dart';
import 'package:panga_pangisha/LandLoardScreens/notification.dart';
import 'package:panga_pangisha/LandLoardScreens/manageRoom.dart';
import 'package:panga_pangisha/RenterScreens/MainScreen.dart';
import 'package:panga_pangisha/authScreens/regScreen.dart';
import 'package:shared_preferences/shared_preferences.dart';
// import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:panga_pangisha/LandLoardScreens/createHouse.dart';

// final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
//     FlutterLocalNotificationsPlugin();
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // const AndroidInitializationSettings androidInitSettings =
  //     AndroidInitializationSettings('@mipmap/ic_launcher'); // App icon

  // const InitializationSettings initSettings = InitializationSettings(
  //   android: androidInitSettings,
  //   // iOS: IOSInitializationSettings() // Add if you support iOS
  // );

  // await flutterLocalNotificationsPlugin.initialize(initSettings);
  runApp(const PangaNaKupangishaApp());
}

class PangaNaKupangishaApp extends StatelessWidget {
  const PangaNaKupangishaApp({super.key});
  //  void checkLoginStatus(context) async {
  //   final prefs = await SharedPreferences.getInstance();
  //   final isLoggedIn = prefs.getBool('isLoggedIn') ?? false;

  //   // Navigate based on login status
  //   if (isLoggedIn) {
  //     // Navigate to Home screen if logged in
  //     Navigator.pushReplacement(
  //       context,
  //       MaterialPageRoute(builder: (_) => const HomeScreeenNav()),
  //     );
  //   } else {
  //     // Navigate to Login screen if not logged in
  //     Navigator.pushReplacement(
  //       context,
  //       MaterialPageRoute(builder: (_) => RegisterScreen()),
  //     );
  //   }
  // }

  Future<StatefulWidget> goTo() async {
    final prefs = await SharedPreferences.getInstance();
    final _userRole = prefs.getString('user_role');

    if (_userRole == "Landlord") {
      return HomeScreeenNav();
    } else if (_userRole == "Renter") {
      return RenterHomeScreeenNav();
    }
    return goTo();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Panga Kupangisha',
      debugShowCheckedModeBanner: false,
      initialRoute: '/',
      routes: {
        '/': (context) => FutureBuilder(
          future: SharedPreferences.getInstance(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else {
              final prefs = snapshot.data as SharedPreferences;
              final isLoggedIn = prefs.getBool('isLoggedIn_');
              final _userRole = prefs.getString('user_role');
              if (isLoggedIn == true) {
                if (_userRole == "landlord") {
                  return HomeScreeenNav();
                } else {
                  return RenterHomeScreeenNav();
                }
              } else {
                return RegisterScreen();
              }
            }
          },
        ),
        '/register': (context) => RegisterScreen(),
        '/notification': (context) => NotificationPage(),
        '/manageRoom': (context) => Rooms(),
        '/createHouse': (context) => AddHouseScreen(),
      },
    );
  }
}
