import 'package:flutter/material.dart';
import 'package:panga_pangisha/CustomeControl/CustomInputField.dart';
import 'package:panga_pangisha/LandLoardScreens/MainScreen.dart';
import 'package:panga_pangisha/RenterScreens/MainScreen.dart';
import 'package:panga_pangisha/authScreens/regScreen.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  // bool _isLandlord = true;
  bool _obscurePassword = true;

  final TextEditingController phone_number = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  Future<void> saveTokens(
    String accessToken,
    String refreshToken,
    int User_id,
    String role,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token_$role', accessToken);
    await prefs.setString('access_token', accessToken); // screens read this key
    await prefs.setString('refresh_token', refreshToken);
    await prefs.setInt('user_ID', User_id);
  }

  bool connectionError = false;
  bool secureTex = true;

  String? phoneNumber_err;
  String? password_error;

  @override
  void initState() {
    super.initState();

    phone_number.addListener(() {
      // Clear error when user starts typing
      if (phoneNumber_err != null && phone_number.text.isNotEmpty) {
        setState(() {
          phoneNumber_err = null;
        });
      }
    });

    _passwordController.addListener(() {
      // Clear error when user starts typing
      if (password_error != null && _passwordController.text.isNotEmpty) {
        setState(() {
          password_error = null;
        });
      }
    });
  }

  // bool _isLoading = false;

  SnackBar mySnackBar(String message) {
    return SnackBar(
      content: Text(message),
      backgroundColor: Colors.blue,
      duration: Duration(seconds: 3),
    );
  }

  final String LocalIp = '10.171.86.138';
  final String wifiIP = '10.0.2.2';

  Future<void> login() async {
    setState(() {
      // _isLoading = true;
      phoneNumber_err = null;
      password_error = null;
    });

    final loginUrl = Uri.parse('http://$wifiIP:8100/api/user/api/token/');
    try {
      final response = await http.post(
        loginUrl,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone_number': phone_number.text,
          'password': _passwordController.text,
        }),
      );

      // setState(() {
      //   _isLoading = false;
      // });

      final loginFail_Data = jsonDecode(response.body);
      final loginFail = loginFail_Data;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        final access_token = data['access'];
        final refresh_token = data['refresh'];
        final user_id = data['user_id'];
        final user_role = data['role'];
        debugPrint(user_role);
        await saveTokens(access_token, refresh_token, user_id, user_role);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("user_role", user_role);
        await prefs.setBool('isLoggedIn_', true);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            duration: Duration(seconds: 1),
            content: Center(
              child: Text(
                "You're in!",
                style: TextStyle(
                  fontSize: 20,
                  color: const Color.fromARGB(255, 16, 167, 201),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        );
        await Future.delayed(Duration(seconds: 2));
        if (!mounted) return;
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (context) {
              if (user_role == "landlord") {
                return HomeScreeenNav();
              } else {
                return RenterHomeScreeenNav();
              }
            },
          ),
          (route) => false,
        );
      } else if (loginFail != null) {
        debugPrint('Login Failed:');
        setState(() {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              behavior: SnackBarBehavior.floating,
              content: Center(
                child: Text(
                  loginFail['detail'],
                  style: TextStyle(
                    fontSize: 20,
                    // color: Color.fromARGB(255, 211, 91, 113),
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ),
            ),
          );
        });
      } else {
        final data = jsonDecode(response.body);
        setState(() {
          phoneNumber_err = data['phone_number']
              .toString()
              .replaceAll('[', '')
              .replaceAll(']', '')
              .replaceAll('.', ' ');
          if (phoneNumber_err == 'null') {
            phoneNumber_err = 'Wrong phone number ';
          }
          password_error = data['password']
              .toString()
              .replaceAll('[', '')
              .replaceAll(']', '')
              .replaceAll('.', ' ');
        });
      }
    } catch (e) {
      debugPrint('$e');
      if (!mounted) return;
      setState(() {
        connectionError = true;
      });
      if (e.toString().contains('SocketException')) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Network error.')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF6BCDBA),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const Text(
                'LOGIN',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 50,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(255, 239, 233, 233),
                ),
              ),
              const SizedBox(height: 30),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color.fromARGB(255, 238, 240, 240),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Column(
                  children: [
                    CustomTextField(
                      Textcontroller: phone_number,
                      icon: Icons.person_outline,
                      ErrorMsg: phoneNumber_err,
                      labelText: 'Phone number',
                      keybord_type: TextInputType.phone,
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        errorText: password_error,
                        filled: true,
                        fillColor: const Color(0xFFF0F4F8),
                        hintText: 'Password',
                        prefixIcon: const Icon(
                          Icons.lock_outline,
                          color: Colors.grey,
                        ),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          // borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {},
                        child: const Text(
                          'Forgot password?',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    ),
                    // Container(
                    //   padding: const EdgeInsets.symmetric(
                    //     horizontal: 16,
                    //     vertical: 12,
                    //   ),
                    //   decoration: BoxDecoration(
                    //     color: const Color(0xFFF0F4F8),
                    //     borderRadius: BorderRadius.circular(12),
                    //   ),
                    //   child: Row(
                    //     children: [
                    //       const Icon(Icons.home_outlined, color: Colors.green),
                    //       const SizedBox(width: 10),
                    //       const Text("I’m a Landlord"),
                    //       const Spacer(),
                    //       Switch(
                    //         value: _isLandlord,
                    //         activeColor: Colors.green,
                    //         onChanged: (val) {
                    //           setState(() {
                    //             _isLandlord = val;
                    //           });
                    //         },
                    //       ),
                    //     ],
                    //   ),
                    // ),
                    // const SizedBox(height: 10),
                    // Container(
                    //   padding: const EdgeInsets.symmetric(
                    //     horizontal: 16,
                    //     vertical: 12,
                    //   ),
                    //   decoration: BoxDecoration(
                    //     color: const Color(0xFFF0F4F8),
                    //     borderRadius: BorderRadius.circular(12),
                    //   ),
                    //   child: Row(
                    //     children: const [
                    //       Icon(Icons.house, color: Colors.green),
                    //       SizedBox(width: 10),
                    //       Text("I’m a Renter"),
                    //     ],
                    //   ),
                    // ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4DBD9B),
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text(
                        'Log in',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => RegisterScreen(),
                          ),
                        );
                      },
                      child: const Text.rich(
                        TextSpan(
                          text: "Don’t have an account? ",
                          style: TextStyle(color: Colors.black54),
                          children: [
                            TextSpan(
                              text: "Register",
                              style: TextStyle(
                                color: Color(0xFF1C8B68),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
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
  }
}
