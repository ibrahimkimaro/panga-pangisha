import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:panga_pangisha/CustomeControl/Network&Tokens.dart';
import 'package:panga_pangisha/LandLoardScreens/rentalAgreements.dart';
import 'package:panga_pangisha/authScreens/loginScreen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:panga_pangisha/CustomeControl/Shimmer.dart';
// import 'package:panga_pangisha/authScreens/loginScreen.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class RenterProfileAccount extends StatefulWidget {
  final void Function(File)? onImageSaved;
  const RenterProfileAccount({super.key, this.onImageSaved});

  @override
  State<RenterProfileAccount> createState() => _ProfileAccountState();
}

class _ProfileAccountState extends State<RenterProfileAccount> {
  // final String wifiIP = '192.168.1.154';
  // final String LocalIP = '10.227.172.138';

  String? profilePic;
  String? _username;
  String? _email;
  String? _phoneNumber;
  File? _imageFile;

  Future<void> _pickImage() async {
    final pickedFile = await ImagePicker().pickImage(
      source: ImageSource.gallery,
    );
    if (!mounted) return;
    if (pickedFile != null) {
      showDialog(
        context: context,
        builder: (BuildContext context) => AlertDialog(
          clipBehavior: Clip.none,
          backgroundColor: const Color.fromARGB(255, 159, 155, 155),
          content: CircleAvatar(
            radius: 90,
            backgroundImage: _imageFile != null ? FileImage(_imageFile!) : null,
            child: _imageFile == null
                ? const Icon(Icons.add_a_photo, size: 40)
                : null,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                "cancel",
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
            TextButton(
              onPressed: _saveImage,
              child: Text(
                "save",
                style: TextStyle(fontSize: 20, color: Colors.white),
              ),
            ),
          ],
        ),
      );
      setState(() {
        _imageFile = File(pickedFile.path);
        // print("Image ilyochaguliwa $_imageFile");
        // profilePic = null;
      });
    }
  }

  Future<void> _saveImage() async {
    if (_imageFile == null) return;

    final accessToken = await RenterPreferrencesToken().getAccessToken();
    final uri = Uri.parse(APIEndPointURL.updateProfile);
    final request = http.MultipartRequest('PATCH', uri);
    request.headers['Authorization'] = 'Bearer $accessToken';
    request.files.add(
      await http.MultipartFile.fromPath('profile_image', _imageFile!.path),
    );

    final response = await request.send();
    if (response.statusCode == 200) {
      Navigator.pop(context);
      await fetchData(); // Close bottom sheet and return
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Failed to upload image.")));
      print("❌ Error: ${response.statusCode}");
    }
  }

  Future<void> fetchData() async {
    final accessToken = await RenterPreferrencesToken().getAccessToken();
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
        final email = body['email'];
        final phoneNo = body['phone_number'];
        final data = img['profile_image'];
        setState(() {
          profilePic = '${APIEndPointURL.profilrPic}$data';
          _username = name;
          _email = email;
          _phoneNumber = phoneNo;
        });
      } else {
        print(json.decode(response.body));
        print("Error");
      }
    } catch (e) {
      print(e);
    }
  }

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  void saveData() {
    print("Saving data...$_imageFile");
  }

  void _BottomSheet() {
    // final size = MediaQuery.of(context).size;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SingleChildScrollView(
          child: Padding(
            padding: MediaQuery.of(context).viewInsets,
            child: Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    "Edit Profile",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SizedBox(
                        width: 350,
                        child: TextField(
                          decoration: InputDecoration(
                            labelText: 'Full Name',
                            prefixIcon: Icon(Icons.person),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color.fromARGB(
                            255,
                            236,
                            195,
                            160,
                          ),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text("Update"),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SizedBox(
                        width: 350,
                        child: TextField(
                          decoration: InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.email),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color.fromARGB(
                            255,
                            236,
                            195,
                            160,
                          ),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text("Update"),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SizedBox(
                        width: 350,
                        child: TextField(
                          decoration: InputDecoration(
                            labelText: 'Phone number',
                            prefixIcon: Icon(Icons.phone),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color.fromARGB(
                            255,
                            236,
                            195,
                            160,
                          ),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text("Update"),
                      ),
                    ],
                  ),
                  // const SizedBox(height: 10),
                  Padding(
                    padding: EdgeInsets.only(
                      bottom: MediaQuery.of(context).viewInsets.bottom,
                      left: 20,
                      right: 20,
                      top: 30,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ElevatedButton.icon(
                          icon: const Icon(Icons.save),
                          label: const Text("Pick image"),
                          onPressed: _pickImage,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color.fromARGB(
                              255,
                              79,
                              85,
                              84,
                            ),
                            foregroundColor: Colors.white,
                            minimumSize: const Size.fromHeight(50),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text(
          "My Profile",
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color.fromARGB(255, 236, 195, 160),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 60,
                    backgroundImage:
                        profilePic != null && profilePic!.isNotEmpty
                        ? NetworkImage(profilePic!)
                        : null,
                    child: (profilePic == null || profilePic!.isEmpty)
                        ? const ShimmerCircelAvatar(size: 70)
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AnimatedSwitcher(
                          duration: Duration(milliseconds: 500),
                          child: _username != null
                              ? Text(
                                  _username!,
                                  key: ValueKey(_username),
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                )
                              : const ShimmerUserInfo(),
                        ),
                        const SizedBox(height: 4),
                        AnimatedSwitcher(
                          duration: Duration(milliseconds: 500),
                          child: _email != null
                              ? Text(
                                  _email!,
                                  key: ValueKey(_email),
                                  style: const TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey,
                                  ),
                                )
                              : const ShimmerUserInfo(),
                        ),
                        const SizedBox(height: 10),
                        ElevatedButton.icon(
                          onPressed: _BottomSheet,
                          icon: const Icon(Icons.edit, size: 18),
                          label: const Text("Edit Profile"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color.fromARGB(
                              255,
                              236,
                              195,
                              160,
                            ),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _buildInfoCard(Icons.email, _email, "Email"),
            _buildInfoCard(Icons.phone, _phoneNumber, "Phone Number"),
            _buildInfoCard(Icons.policy, null, "Privacy Policy"),
            _buildInfoCard(Icons.trending_up, null, "Market Trends"),
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => Rentalagreements()),
                );
              },
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 8),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.teal[50],
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 8,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.description, color: Colors.teal[800]),
                        const SizedBox(width: 10),
                        Text(
                          "Documents",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.teal[800],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      "Uploaded rental agreements, ownership documents, and house verification papers will appear here.",
                      style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                    ),
                  ],
                ),
              ),
            ),
            _buildInfoCard(Icons.settings, null, "Settings"),
            const SizedBox(height: 30),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color.fromARGB(255, 236, 195, 160),
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (BuildContext context) => AlertDialog(
                    content: Text(
                      """Are you sure you wanto to delete this account?
                      """,
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text("cancel"),
                      ),
                      TextButton(
                        onPressed: () async {
                          final prefs = await SharedPreferences.getInstance();
                          await prefs.remove('access_token');
                          await prefs.remove('isLoggedIn_');
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(builder: (_) => LoginPage()),
                            (route) => false,
                          );
                        },
                        child: Text("Done"),
                      ),
                    ],
                  ),
                );
              },
              icon: const Icon(Icons.logout),
              label: const Text("Logout"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(IconData icon, String? data, String label) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.teal[700]),
          const SizedBox(width: 12),
          Expanded(
            child: data != null && data.isNotEmpty
                ? Text(data, style: const TextStyle(fontSize: 16))
                : Text(
                    label,
                    style: const TextStyle(fontSize: 16, color: Colors.grey),
                  ),
          ),
        ],
      ),
    );
  }
}
