// import 'package:file_picker/file_picker.dart';
import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
// import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'package:panga_pangisha/CustomeControl/RegionsDistruct.dart';
import 'package:panga_pangisha/LandLoardScreens/pdfFileImage.dart';

class AddHouseScreen extends StatefulWidget {
  const AddHouseScreen({super.key});

  @override
  _AddHouseScreenState createState() => _AddHouseScreenState();
}

class _AddHouseScreenState extends State<AddHouseScreen> {
  final _formKey = GlobalKey<FormState>();
  // File? _imageFile;
  double? _latitude;
  double? _longitude;
  File? _pdfFile;
  String? _pdfName;

  Future<void> pickPdfFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );

    if (result != null && result.files.single.path != null) {
      setState(() {
        _pdfFile = File(result.files.single.path!);
        _pdfName = result.files.single.name;
      });
    }
  }

  void deletePdfFile() {
    setState(() {
      _pdfFile = null;
      _pdfName = null;
    });
  }

  void previewPdf(BuildContext context) {
    if (_pdfFile == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('No PDF file selected')));
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => PdfPreviewPage(pdfFile: _pdfFile!)),
    );
  }

  final List<String> waterSupplier = [
    'Dawasa',
    'Sanitary Dug Wells',
    'Community Water Vendors',
  ];
  final List<String> houseTypes = [
    "Apartment",
    "Villa",
    "Bungalow",
    "Duplex",
    "Studio",
    "Mansion",
    "Hostel",
    'Terraced Houses',
    "Cottage",
    "Flat",
    "Bedsitter",
    "Tenement (Uswahilini)",
  ];

  String? selectedHouseType;
  String? selectedRegion;
  String? selectedDistrict;
  String? selectedWaterSuppler;

  // String? _city;
  // String? _district;

  // Future<void> _pickImage() async {
  //   final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
  //   if (picked != null) {
  //     setState(() => _imageFile = File(picked.path));
  //   }
  // }

  Future<void> _getLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();

    if (!serviceEnabled) return;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
    setState(() {
      _latitude = position.latitude;
      _longitude = position.longitude;
      print("Latitude: $_latitude, Longitude: $_longitude");
    });
    List<Placemark> placemarks = await placemarkFromCoordinates(
      _latitude!,
      _longitude!,
    );

    if (placemarks.isNotEmpty) {
      Placemark place = placemarks.first;
      setState(() {
        selectedRegion = place.administrativeArea;
        selectedDistrict = place.subAdministrativeArea;
        print(selectedRegion);
        print(selectedDistrict);
      });
    }
  }

  Map<String, bool> selectedAmenities = {
    "WiFi": false,
    "Parking": false,
    "CCTV": false,
    "Water tank": false,
    "Security": false,
    "Laundry Area": false,
    "Playground": false,
    "Store room": false,
  };
  Map<String, IconData> amenityIcons = {
    "WiFi": Icons.wifi,
    "Parking": Icons.local_parking,
    "CCTV": Icons.videocam,
    "Water tank": Icons.water,
    "Security": Icons.shield,
    "Laundry Area": Icons.local_laundry_service,
    "Playground": Icons.sports_baseball,
    "Store room": Icons.store,
  };
  final TextEditingController selfContainerController = TextEditingController();
  final TextEditingController selfContaineSizeController =
      TextEditingController();
  final TextEditingController singleRoomController = TextEditingController();
  final TextEditingController singleSizeController = TextEditingController();

  Future<void> createHouse() async {
    final uri = Uri.parse(
      "https://your-api-url.com/api/houses/",
    ); // Replace with your endpoint

    List<String> selected = selectedAmenities.entries
        .where((entry) => entry.value)
        .map((entry) => entry.key)
        .toList();

    var request = http.MultipartRequest('POST', uri);

    request.fields['house_type'] = selectedHouseType!;
    request.fields['master_rooms'] = selfContainerController.text;
    request.fields['master_size'] = selfContaineSizeController.text;
    request.fields['standard_rooms'] = singleRoomController.text;
    request.fields['standard_size'] = singleSizeController.text;
    request.fields['water_services'] = selectedWaterSuppler!;
    request.fields['city'] = selectedRegion!;
    request.fields['district'] = selectedDistrict!;
    request.fields['amenities'] = jsonEncode(selected);

    // Attach PDF file if selected
    // if (_pdfFile != null) {
    //   request.files.add(
    //     await http.MultipartFile.fromPath(
    //       'house_document', // Match this with backend field name
    //       _pdfFile!.path,
    //       contentType: MediaType('application', 'pdf'),
    //     ),
    //   );
    // }

    try {
      var response = await request.send();
      if (response.statusCode == 201 || response.statusCode == 200) {
        print("House created successfully");
      } else {
        print("Failed to create house: ${response.statusCode}");
      }
    } catch (e) {
      print("Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        title: Text("Add House"),
        backgroundColor: const Color.fromARGB(255, 236, 195, 160),
        actions: [
          IconButton(
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  clipBehavior: Clip.hardEdge,
                  title: Text("PLEASE HELP ME"),
                  titleTextStyle: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                    fontSize: 20,
                  ),
                  surfaceTintColor: const Color.fromARGB(255, 134, 160, 181),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Divider(height: 2, color: Colors.blueAccent),
                      Text(
                        "If you have any question please contact us",
                        style: TextStyle(fontSize: 16),
                      ),
                      SizedBox(height: 10),
                      Text(
                        "Phone Number: +255 123 456 789",
                        style: TextStyle(fontSize: 16),
                      ),
                      Text("Are you sure you want to go back?"),
                      Text("Are you sure you want to go back?"),
                      Text("Are you sure you want to go back?"),
                      Text("Are you sure you want to go back?"),
                    ],
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text("cancel"),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text("Done"),
                    ),
                  ],
                ),
              );
            },
            icon: Icon(Icons.back_hand),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                value: selectedHouseType,
                borderRadius: BorderRadius.all(Radius.circular(20)),
                icon: const Icon(Icons.arrow_drop_down),
                dropdownColor: Color.fromARGB(255, 187, 201, 200),
                focusNode: FocusNode(canRequestFocus: true),
                items: houseTypes
                    .map(
                      (h) => DropdownMenuItem(
                        // alignment: Alignment.,
                        value: h,
                        child: Text(h),
                      ),
                    )
                    .toList(),
                onChanged: (val) => setState(() => selectedHouseType = val),
                decoration: InputDecoration(
                  labelText: "House Type",
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: const Color.fromARGB(255, 227, 229, 230),
                  border: Border.all(
                    color: const Color.fromARGB(255, 91, 74, 74),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        SizedBox(
                          width: 150,
                          child: _buildTextField(
                            Textcontroller: selfContainerController,
                            "Self Container",
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        SizedBox(
                          width: 150,
                          child: _buildTextField(
                            Textcontroller: selfContaineSizeController,
                            "SelfConaiter size",
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        SizedBox(
                          width: 150,
                          child: _buildTextField(
                            Textcontroller: singleRoomController,
                            "Single Rooms",
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        SizedBox(
                          width: 150,
                          child: _buildTextField(
                            Textcontroller: singleSizeController,
                            "Single Size",
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: selectedWaterSuppler,
                items: waterSupplier
                    .map((w) => DropdownMenuItem(value: w, child: Text(w)))
                    .toList(),
                onChanged: (val) => setState(() => selectedWaterSuppler = val),
                decoration: InputDecoration(
                  labelText: "Water Supplier",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color.fromARGB(255, 227, 229, 230),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.black),
                ),
                child: Column(
                  children: selectedAmenities.keys.map((String key) {
                    return CheckboxListTile(
                      materialTapTargetSize: MaterialTapTargetSize.padded,
                      visualDensity: VisualDensity.comfortable,
                      controlAffinity: ListTileControlAffinity.platform,
                      checkColor: Colors.white,
                      activeColor: const Color.fromARGB(255, 221, 110, 5),
                      title: Row(
                        children: [
                          Icon(
                            amenityIcons[key] ?? Icons.check_box,
                            color: const Color.fromARGB(255, 92, 51, 170),
                          ),
                          const SizedBox(width: 10),
                          Text(key),
                        ],
                      ),
                      value: selectedAmenities[key],
                      onChanged: (bool? value) {
                        setState(() {
                          selectedAmenities[key] = value ?? false;
                        });
                      },
                    );
                  }).toList(),
                ),
              ),
              SizedBox(height: 20),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color.fromARGB(255, 227, 229, 230),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: const Color.fromARGB(255, 121, 34, 34),
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color.fromARGB(255, 227, 229, 230),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: const Color.fromARGB(255, 133, 83, 83),
                        ),
                      ),
                      child: Text(
                        """Hint: If are nearby House, please click the button below to get house 
          location and district. 
 If you are not nearby, please select the region and district from the dropdown below.
  If you are not sure about the district, please select the region and we will help you find the district.
                        """,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 15,
                          color: const Color.fromARGB(255, 43, 64, 203),
                        ),
                      ),
                    ),
                    SizedBox(height: 10),
                    SizedBox(
                      height: 60,
                      width: size.width / 1,
                      child: ElevatedButton.icon(
                        onPressed: _getLocation,
                        icon: Icon(
                          Icons.location_on,
                          color: const Color.fromARGB(255, 65, 39, 5),
                        ),
                        label: Text(
                          "Get Location",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: const Color.fromARGB(255, 5, 5, 5),
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color.fromARGB(
                            255,
                            105,
                            155,
                            196,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: 15),
                    DropdownButtonFormField<String>(
                      value: selectedRegion,
                      decoration: InputDecoration(
                        labelText: "Region",
                        border: OutlineInputBorder(),
                      ),
                      items: regionDistrictMap.keys.map((region) {
                        return DropdownMenuItem(
                          value: region,
                          child: Text(region),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          selectedRegion = value;
                          selectedDistrict = null; // reset district
                        });
                      },
                    ),
                    const SizedBox(height: 20),
                    if (selectedRegion != null)
                      DropdownButtonFormField<String>(
                        value: selectedDistrict,
                        decoration: InputDecoration(
                          labelText: "District",
                          border: OutlineInputBorder(),
                        ),
                        items: regionDistrictMap[selectedRegion!]!.map((
                          district,
                        ) {
                          return DropdownMenuItem(
                            value: district,
                            child: Text(district),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            selectedDistrict = value;
                          });
                        },
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                width: size.width,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color.fromARGB(255, 227, 229, 230),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: const Color.fromARGB(255, 133, 83, 83),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  // crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ElevatedButton.icon(
                      icon: const Icon(Icons.upload_file),
                      label: const Text('Choose PDF File'),
                      onPressed: pickPdfFile,
                    ),
                    SizedBox(height: 20),
                    // hapa tunaonesha file name and options if PDF is selected
                    if (_pdfFile != null) ...[
                      Container(
                        height: 50,
                        width: double.infinity,
                        padding: EdgeInsets.all(8.0),
                        decoration: BoxDecoration(
                          // color: const Color.fromARGB(255, 218, 222, 223),
                          shape: BoxShape.rectangle,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.picture_as_pdf,
                              size: 25,
                              color: Color.fromARGB(255, 151, 29, 20),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _pdfName ?? '',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ElevatedButton.icon(
                            icon: const Icon(Icons.visibility),
                            label: const Text('Preview'),
                            onPressed: () => previewPdf(context),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton.icon(
                            icon: const Icon(Icons.delete),
                            label: const Text(
                              'Delete',
                              style: TextStyle(color: Colors.white),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                            ),
                            onPressed: deletePdfFile,
                          ),
                        ],
                      ),
                    ],
                  ],
                ),

                // child: Column(
                //   children: [
                //     SizedBox(
                //       width: 300,
                //       height: 50,
                //       child: ElevatedButton.icon(
                //         style: ElevatedButton.styleFrom(
                //           backgroundColor: const Color.fromARGB(
                //             255,
                //             128,
                //             135,
                //             141,
                //           ),
                //           shape: RoundedRectangleBorder(
                //             borderRadius: BorderRadius.circular(10),
                //           ),
                //         ),
                //         onPressed: _pickImage,
                //         icon: Icon(Icons.photo),
                //         label: Text("Upload Image"),
                //       ),
                //     ),
                //     const SizedBox(height: 10),
                //     Container(
                //       width: size.width,
                //       child:
                //           _imageFile != null
                //               ? Image.file(
                //                 _imageFile!,
                //                 height: 200,
                //                 // width: 250,
                //                 filterQuality: FilterQuality.high,
                //                 fit: BoxFit.cover,
                //               )
                //               : SizedBox.shrink(),
                //     ),
                //   ],
                // ),
              ),

              // if (_pdfFile != null)
              //   Container(
              //     height: 400,
              //     decoration: BoxDecoration(
              //       border: Border.all(color: Colors.grey),
              //     ),
              //     child: SfPdfViewer.file(_pdfFile!),
              //   ),
              const SizedBox(height: 20),
              Container(
                margin: const EdgeInsets.symmetric(vertical: 20),
                child: SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () {
                      if (_formKey.currentState!.validate()) {
                        // Submit the form
                        createHouse();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color.fromARGB(255, 236, 195, 160),
                      shadowColor: const Color.fromARGB(255, 114, 60, 60),
                      elevation: 5,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      "Submit",
                      style: TextStyle(
                        fontSize: 18,
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(
    String label, {
    TextInputType keyboardType = TextInputType.text,
    final Textcontroller,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: TextFormField(
        controller: Textcontroller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(),
        ),
        validator: (value) =>
            value == null || value.isEmpty ? 'Required' : null,
      ),
    );
  }
}
