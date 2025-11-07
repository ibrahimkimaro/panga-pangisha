import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:panga_pangisha/authScreens/loginScreen.dart';
import 'package:panga_pangisha/CustomeControl/CustomInputField.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController _fullName = TextEditingController();
  final TextEditingController emailOrPhone = TextEditingController();
  final TextEditingController password = TextEditingController();
  String confirmPassword = '';
  bool isLandlord = false;
  bool isRenter = false;
  bool _onPasswordSecure = true;

  @override
  void dispose() {
    _fullName.dispose();
    emailOrPhone.dispose();
    password.dispose();
    // Removed dispose calls for isLandlord and isRenter as they are now bools
    super.dispose();
  }

  void Register() {
    print("FULL NAME: ${_fullName.text}");
    print("PHONE NUMBWE: ${emailOrPhone.text}");
    print("PASSWORD: ${password.text}");

    if (isLandlord == true || isRenter == true) {
      if (isLandlord) {
        print("is landlord");
      } else if (isRenter) {
        print("is renter");
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF6BCDBA),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const Text(
                "CREATE ACCOUNT",
                style: TextStyle(
                  fontSize: 35,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(255, 90, 86, 86),
                ),
              ),
              const SizedBox(height: 30),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color.fromARGB(255, 238, 240, 240),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      CustomTextField(
                        Textcontroller: _fullName,
                        icon: Icons.person,
                        labelText: "Full name",
                      ),
                      const SizedBox(height: 15),
                      CustomTextField(
                        Textcontroller: emailOrPhone,
                        icon: Icons.phone,
                        labelText: "Phone number",
                        keybord_type: TextInputType.phone,
                      ),
                      const SizedBox(height: 10),
                      CustomTextField(
                        Textcontroller: password,
                        icon: Icons.lock,
                        labelText: "Password",
                        secureText: _onPasswordSecure,
                        iconPsswrd: IconButton(
                          icon: Icon(
                            _onPasswordSecure
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed: () {
                            setState(() {
                              _onPasswordSecure = !_onPasswordSecure;
                            });
                          },
                        ),
                      ),
                      const SizedBox(height: 15),
                      // _buildTextField(
                      //   Icons.lock_outline,
                      //   "Confirm password",
                      //   obscureText: true,
                      // ),
                      const SizedBox(height: 20),

                      // bool isLandlord = true;
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.home, color: Colors.green),
                              SizedBox(width: 8),
                              Text("I'm a Landlord"),
                            ],
                          ),
                          Switch(
                            splashRadius: 12.8,
                            materialTapTargetSize: MaterialTapTargetSize.padded,
                            activeColor: Colors.black,
                            value: isLandlord,
                            onChanged: (value) {
                              setState(() {
                                isLandlord = value;
                                // print("User is a Landlord");
                              });
                            },
                          ),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.apartment_outlined,
                                color: Colors.green,
                              ),
                              SizedBox(width: 8),
                              Text("I'm a Renter"),
                            ],
                          ),
                          Switch(
                            materialTapTargetSize: MaterialTapTargetSize.padded,
                            activeColor: Colors.black,
                            value: isRenter,
                            onChanged: (value) {
                              setState(() {
                                isRenter = value;
                                // print("User is a Renter");
                              });
                            },
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: Register,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(50),
                          backgroundColor: const Color(0xFF4DBD9B),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                        child: const Text(
                          "Register",
                          style: TextStyle(fontSize: 16),
                        ),
                      ),
                      const SizedBox(height: 15),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => LoginPage(),
                            ),
                          );
                        },
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Already have an account? ",
                              style: TextStyle(
                                color: Color.fromARGB(255, 18, 19, 19),
                              ),
                            ),
                            SizedBox(width: 10),
                            Text(
                              "Log in",
                              style: TextStyle(
                                fontSize: 15,
                                color: Color.fromARGB(255, 2, 104, 83),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

//   Widget _buildTextField(
//     IconData icon,
//     String labelText, {
//     bool obscureText = false,
//     TextValue,
//   }) {
//     return TextFormField(
//       controller: TextValue,
//       obscureText: obscureText,
//       decoration: InputDecoration(
//         prefixIcon: Icon(icon),
//         labelText: labelText,
//         filled: true,
//         fillColor: Colors.white,
//         border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
//       ),
//     );
//   }
// }
