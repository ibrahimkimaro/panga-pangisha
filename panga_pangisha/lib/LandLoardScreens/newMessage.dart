import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

class Newmessage extends StatefulWidget {
  const Newmessage({super.key});

  @override
  State<Newmessage> createState() => _NewmessageState();
}

class _NewmessageState extends State<Newmessage> {
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          "New Message",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: CustomScrollView(
        // scrollBehavior: ScrollBehavior,
        dragStartBehavior: DragStartBehavior.start,
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.manual,
        slivers: [
          //   SliverPersistentHeader(
          //     delegate: SliverPersistentHeaderDelegate,
          //     pinned: true,
          //     floating: true,
          // child: Padding(
          //   padding: const EdgeInsets.only(left: 15),
          //   child: Row(
          //     children: [
          //       Text("To: ", style: TextStyle(fontSize: 20)),
          //       SizedBox(
          //         width: size.width / 1.2,
          //         height: 50,
          //         child: SearchBar(
          //           hintText: "search..",
          //           backgroundColor: WidgetStatePropertyAll(Colors.cyan),
          //           shape: WidgetStateProperty.all(
          //             RoundedRectangleBorder(
          //               borderRadius: BorderRadius.circular(12),
          //               side: BorderSide(color: Colors.white),
          //             ),
          //           ),
          //         ),
          //       ),
          //     ],
          //   ),
          // ),
          // ),
          SliverList(
            delegate: SliverChildBuilderDelegate((context, index) {
              return ListTile(
                title: Text("kimmy"),
                splashColor: Colors.amber,
                tileColor: Colors.blueAccent,
                hoverColor: Colors.deepOrange,
              );
            }),
          ),
        ],
      ),
    );
  }
}
