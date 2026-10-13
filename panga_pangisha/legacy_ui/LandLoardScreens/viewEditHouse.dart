import 'package:flutter/material.dart';

class Viewedithouse extends StatefulWidget {
  final String? nameTitle;
  final String? housePicture;
  final String? description;

  const Viewedithouse({
    super.key,
    required this.nameTitle,
    required this.housePicture,
    required this.description,
  });

  @override
  State<Viewedithouse> createState() => _ViewedithouseState();
}

class _ViewedithouseState extends State<Viewedithouse> {
  final BottonStyleStack = ButtonStyle(
    animationDuration: Duration(microseconds: 100),
    backgroundColor: WidgetStateProperty.all(Colors.white),
    overlayColor: WidgetStateProperty.all(
      const Color.fromARGB(255, 126, 127, 129),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      // appBar: AppBar(
      //   centerTitle: true,
      //   title: Text(
      //     widget.nameTitle.toString().toUpperCase(),
      //     style: TextStyle(fontWeight: FontWeight.bold, fontSize: 30),
      //   ),
      // ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Container(
                height: 450,
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: NetworkImage('${widget.housePicture}'),
                    fit: BoxFit.fill,
                    filterQuality: FilterQuality.high,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              Positioned(
                top: 30,
                // left: 10,
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Container(
                    width: size.width / 1.05,
                    height: 70,
                    decoration: BoxDecoration(color: Colors.transparent),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton.outlined(
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          splashRadius: 12,
                          style: BottonStyleStack,
                          icon: Icon(
                            Icons.keyboard_arrow_left_sharp,
                            size: 25,
                            weight: 100,
                            fill: 0.1,
                            grade: 50,
                          ),
                        ),
                        Row(
                          children: [
                            IconButton.outlined(
                              onPressed: () {},
                              style: BottonStyleStack,
                              icon: Icon(
                                Icons.favorite_border_outlined,
                                size: 20,
                              ),
                            ),
                            IconButton.outlined(
                              onPressed: () {},
                              style: BottonStyleStack,
                              icon: Icon(Icons.share_outlined),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 15),
          Padding(
            padding: const EdgeInsets.only(left: 10),
            child: Column(
              spacing: 5,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.nameTitle.toString().toUpperCase(),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 40,
                    fontFamily: 'times new roman',
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Icon(Icons.location_on),
                    Text(
                      "Temeke, kijichi",
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 18,
                        fontFamily: 'aerial',
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 5),
                Container(
                  height: 40,
                  width: 250,
                  // padding: EdgeInsets.all(8.0),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: const Color.fromARGB(255, 16, 16, 15),
                    borderRadius: BorderRadius.all(Radius.circular(10.0)),
                  ),
                  child: Text(
                    'Property Description',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 25,
                      color: Colors.white,
                      fontFamily: 'aerial',
                    ),
                  ),
                ),
                SizedBox(height: 2),
                Container(
                  padding: EdgeInsets.only(left: 8.0),
                  child: Text(
                    '${widget.description}',
                    style: TextStyle(fontSize: 18),
                  ),
                ),
                SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      height: 40,
                      width: 250,
                      // padding: EdgeInsets.all(8.0),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: const Color.fromARGB(255, 16, 16, 15),
                        borderRadius: BorderRadius.all(Radius.circular(10.0)),
                      ),
                      child: Text(
                        'Property details',
                        style: TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 25,
                          color: Colors.white,
                          fontFamily: 'aerial',
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: Text('see all'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
