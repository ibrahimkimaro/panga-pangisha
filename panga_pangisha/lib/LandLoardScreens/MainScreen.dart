import 'package:flutter/material.dart';
import 'package:panga_pangisha/LandLoardScreens/HomePage.dart';
import 'package:panga_pangisha/LandLoardScreens/profileScreens.dart';
import 'package:panga_pangisha/LandLoardScreens/messagesPage.dart';
import 'package:panga_pangisha/LandLoardScreens/requestsPage.dart';

// import 'package:google_nav_bar/google_nav_bar.dart';

class HomeScreeenNav extends StatefulWidget {
  const HomeScreeenNav({super.key});

  @override
  State<HomeScreeenNav> createState() => _HomepageState();
}

class _HomepageState extends State<HomeScreeenNav> {
  int _selectedIndex = 1;
  final _BottmTabColor = const Color.fromARGB(255, 236, 195, 160);
  static const List<Widget> _pages = <Widget>[
    Homepage(),
    Messageslandlord(),
    Rooomsrequests(),
    ProfileAccount(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        // backgroundColor: Colors.blue,
        unselectedItemColor: Colors.black,
        selectedItemColor: Colors.white,
        showUnselectedLabels: true,
        useLegacyColorScheme: true,
        backgroundColor: _BottmTabColor,
        landscapeLayout: BottomNavigationBarLandscapeLayout.spread,
        elevation: 20,
        // unselectedLabelStyle: TextStyle(fontSize: 15),
        selectedLabelStyle: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
        unselectedLabelStyle: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
        ),
        // unselectedIconTheme: IconThemeData(
        //   color: const Color.fromARGB(255, 63, 57, 57),
        //   size: 20,
        // ),
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
            backgroundColor: _BottmTabColor,
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.message_rounded),
            label: 'Messages',
            backgroundColor: _BottmTabColor,
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.request_quote_outlined),
            label: 'Requests',
            backgroundColor: _BottmTabColor,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.account_circle),
            label: 'Profile',
            backgroundColor: _BottmTabColor,
          ),
        ],
      ),
      // );
      // body: _pages[_selectedIndex],
      // bottomNavigationBar: GNav(
      //   gap: 5,
      //   backgroundColor: const Color.fromARGB(255, 161, 100, 8),
      //   // iconSize: 0,
      //   padding: EdgeInsets.symmetric(horizontal: 25, vertical: 5),
      //   textStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
      //   selectedIndex: _selectedIndex,
      //   style: GnavStyle.oldSchool,
      //   // curve: Curves.decelerate,
      //   // duration: Duration(microseconds: 200),
      //   onTabChange: _onItemTapped,
      //   activeColor: const Color.fromARGB(255, 238, 229, 229),
      //   // rippleColor: Colors.black54,
      //   tabs: [
      //     GButton(
      //       icon: Icons.home,
      //       text: 'Home',
      //     ),
      //     GButton(
      //       icon: Icons.document_scanner,
      //       text: 'Documents',
      //     ),
      //     GButton(
      //       icon: Icons.map,
      //       text: 'Map',
      //     ),
      //     GButton(
      //       icon: Icons.account_circle,
      //       text: 'My Profile',
      //     ),
      //   ],
      // ),
    );
  }
}
