import 'package:flutter/material.dart';

class CustomTextField extends StatelessWidget {
  final IconData icon;
  final String labelText;
  final Textcontroller;
  final bool? secureText;
  final iconPsswrd;
  final keybord_type;
  final ErrorMsg;

  const CustomTextField({
    super.key,
    required this.icon,
    required this.labelText,
    required this.Textcontroller,
    this.secureText,
    this.iconPsswrd,
    this.keybord_type,
    this.ErrorMsg,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: Textcontroller,
      obscureText: secureText ?? false,
      keyboardType: keybord_type,
      // style: TextStyle(fontSize: 8),dsa
      decoration: InputDecoration(
        prefixIcon: Icon(icon),
        suffixIcon: iconPsswrd,
        labelText: labelText,
        filled: true,
        labelStyle: TextStyle(fontSize: 14),
        errorText: ErrorMsg,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}


// class CustomSendVoiceButton extends StatelessWidget {
//   final IconData icon;
//   final  labelText;
//   final Textcontroller;
//   final bool? secureText;
//   final iconPsswrd;
//   final keybord_type;
//   final ErrorMsg;

//   const CustomSendVoiceButton({
//     super.key,
//     required this.icon,
//     required this.labelText,
//     required this.Textcontroller,
//     this.secureText,
//     this.iconPsswrd,
//     this.keybord_type,
//     this.ErrorMsg,
//   });

//   @override
//   Widget build(BuildContext context) {
//     return GestureDetector(
      
//     )
//   }
// }
