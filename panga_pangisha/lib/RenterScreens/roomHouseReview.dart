import 'package:flutter/material.dart';

class Roomhousereview extends StatefulWidget {
  final nameOfHouse;
  final houseID;
  final houseImage;
  const Roomhousereview({
    super.key,
    required this.nameOfHouse,
    required this.houseID,
    required this.houseImage,
  });

  @override
  State<Roomhousereview> createState() => _RoomhousereviewState();
}

class _RoomhousereviewState extends State<Roomhousereview> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Room House Review')),
      body: Center(
        child: Column(
          // mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              height: 500,
              decoration: BoxDecoration(
                color: const Color.fromARGB(255, 181, 127, 11),

                image: DecorationImage(
                  image: NetworkImage(widget.houseImage),
                  fit: BoxFit.fill,
                  filterQuality: FilterQuality.high,
                ),
                // borderRadius: BorderRadius.circular(8),
              ),
            ),
            Text(widget.nameOfHouse, style: const TextStyle(fontSize: 24)),
            Text(
              widget.houseID.toString(),
              style: const TextStyle(fontSize: 24),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                // Add your button action here
              },
              child: const Text('Review Room House'),
            ),
          ],
        ),
      ),
    );
  }
}
