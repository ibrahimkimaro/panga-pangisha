import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:http/http.dart' as http;
import 'package:panga_pangisha/CustomeControl/Shimmer.dart';
import 'package:panga_pangisha/LandLoardScreens/viewEditHouse.dart';
import 'package:shared_preferences/shared_preferences.dart';

class Rooms extends StatefulWidget {
  const Rooms({super.key});

  @override
  State<Rooms> createState() => _RoomsState();
}

class _RoomsState extends State<Rooms> {
  String? nameOfHouse;
  bool isLoading = false;
  List<dynamic> houses = [];

  final String wifiIP = '10.0.2.2';
  final String locaLIP = '10.240.11.138';

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
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

  void __showCreation() {
    showDialog(
      context: context,
      builder: (BuildContext context) => Dialog(
        alignment: Alignment.center,
        insetAnimationCurve: Curves.bounceInOut,
        backgroundColor: Colors.transparent,
        clipBehavior: Clip.antiAlias,
        // elevation: 100,
        semanticsRole: SemanticsRole.dialog,
        shadowColor: const Color.fromARGB(255, 23, 22, 22),
        insetAnimationDuration: Duration(milliseconds: 1000),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            GestureDetector(
              onTap: () {
                Navigator.pushNamed(context, '/createHouse');
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                height: 150,
                width: 180,
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
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.add_home,
                      size: 30,
                      color: Color.fromARGB(255, 65, 219, 193),
                    ),
                    SizedBox(width: 10),
                    const Text(
                      'Create House',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                ),
              ),
            ),
            // SizedBox(width: 10),
            GestureDetector(
              onDoubleTap: () => {
                Dialog(
                  insetAnimationDuration: Duration(seconds: 2),
                  semanticsRole: SemanticsRole.menuItemCheckbox,
                  child: Text("You will create House with rooms"),
                ),
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                height: 150,
                width: 180,
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
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.add_home,
                      size: 30,
                      color: Colors.deepPurple,
                    ),
                    SizedBox(width: 10),
                    const Text(
                      'Create House \n with rooms',
                      style: TextStyle(
                        fontSize: 22,
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
    );
  }

  @override
  void initState() {
    super.initState();
    fetchHouseData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        // toolbarHeight: 40,
        title: const Text(
          'My PROPERTIES',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        // backgroundColor: const Color.fromARGB(255, 236, 195, 160),
        backgroundColor: Colors.transparent,
      ),
      body: houses.isNotEmpty
          ? ListView.builder(
              itemCount: houses.length,
              itemBuilder: (context, index) {
                final house = houses[index];
                return SizedBox(
                  height: 600,
                  child: Card(
                    elevation: 4,
                    margin: EdgeInsets.all(10),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            height: 350,
                            decoration: BoxDecoration(
                              image: DecorationImage(
                                image: NetworkImage(
                                  'http://$wifiIP:8100${house['house_profile_image']}',
                                ),
                                fit: BoxFit.fill,
                                filterQuality: FilterQuality.high,
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            house['house_type'].toString().toUpperCase(),
                            style: TextStyle(
                              fontSize: 30,
                              fontFamily: 'times new roman',
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'city: ${house['city'].toString().toUpperCase()}',
                          ),
                          Text(
                            'District: ${house['district'].toString().toUpperCase()}',
                          ),
                          SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: () {
                              final pro_pic =
                                  'http://$wifiIP:8100${house['house_profile_image']}';
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => Viewedithouse(
                                    nameTitle: house['house_type'],
                                    housePicture: pro_pic,
                                    description: house['description'],
                                  ),
                                ),
                              );
                            },
                            child: Text('View'),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            )
          : const ShimmerRequestCards(
              ItemCount: 3,
              sizBoxHeight: 400,
              directionAxis: Axis.vertical,
              widthBoxHeight: 200,
            ),

      floatingActionButton: SizedBox(
        width: 100,
        child: FloatingActionButton(
          onPressed: __showCreation,
          materialTapTargetSize: MaterialTapTargetSize.padded,
          mini: false,
          elevation: 8,
          isExtended: true,
          clipBehavior: Clip.antiAlias,
          backgroundColor: const Color.fromARGB(255, 236, 195, 160),
          // focusColor: ,
          highlightElevation: 4,
          splashColor: Colors.white,
          child: Icon(
            Icons.add_home,
            size: 30,
            color: const Color.fromARGB(255, 15, 20, 174),
          ),
        ),
      ),
    );
  }
}
