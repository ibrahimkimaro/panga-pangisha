import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class ShimmerUserInfo extends StatelessWidget {
  // final String TextValue;
  // final double fontSize;

  const ShimmerUserInfo({
    super.key,
    // required this.TextValue,
    // required this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Container(
        width: 200,
        height: 20.0,
        // alignment: Alignment.topLeft,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(7.0),
        ),
      ),
    );
  }
}

class ShimmerCircelAvatar extends StatelessWidget {
  final double size;

  // UKItaka kupass parameter kweny class lazima uiweke kwenye const ShimmerCircelAvatar({super.key, required this.size})
  const ShimmerCircelAvatar({super.key, required this.size});
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: CircleAvatar(radius: size),
    );
  }
}

class ShimmerRequestCards extends StatelessWidget {
  // UKItaka kupass parameter kweny class lazima uiweke kwenye const ShimmerRequestCards({super.key, required this.size})
  final int ItemCount;
  final double sizBoxHeight;
  final Axis directionAxis;
  final double widthBoxHeight;

  const ShimmerRequestCards({
    super.key,
    required this.ItemCount,
    required this.sizBoxHeight,
    required this.directionAxis,
    required this.widthBoxHeight,
  });
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: ListView.builder(
        itemCount: ItemCount,
        scrollDirection: directionAxis,
        itemBuilder: (context, index) {
          return SizedBox(
            height: sizBoxHeight,
            width: widthBoxHeight,
            child: Card(elevation: 4, margin: EdgeInsets.all(10)),
          );
        },
      ),
    );
  }
}

List<dynamic> users = [];

class ShimmerChattingList extends StatelessWidget {
  // final int ItemCount;

  const ShimmerChattingList({super.key});
  @override
  Widget build(BuildContext context) {
    return SliverList(
      delegate: SliverChildBuilderDelegate((context, index) {
        users[index];
        return Shimmer.fromColors(
          baseColor: Colors.grey.shade300,
          highlightColor: Colors.grey.shade100,
          child: Container(
            width: 200,
            height: 20.0,
            // alignment: Alignment.topLeft,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(7.0),
            ),
          ),
        );
      }, childCount: users.length),
    );
  }
}
