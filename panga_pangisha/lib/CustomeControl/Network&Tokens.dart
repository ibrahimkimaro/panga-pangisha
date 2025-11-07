import 'package:shared_preferences/shared_preferences.dart';

class LandLordPreferrencesToken {
  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token_landlord');
  }

  Future<int?> getUserID() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('user_ID');
  }
}

class RenterPreferrencesToken {
  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token_renter');
  }

  Future<int?> getUserID() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('user_ID');
  }
}

class APIEndPointURL {
  static const String baseUrl = "http://192.168.2.232:8000/api";
  static const String profilrPic = "http://192.168.2.232:8000";

  // Shared Endpoints
  static const String userProfile = "$baseUrl/profile/UserUpdateProfile/";
  static const String updateProfile = "$baseUrl/profile/update_profile_pic/";

  static const String getAvailableHouses =
      "$baseUrl/landlord/getAvailableHouse/";
  static const String renterLogin = "$baseUrl/renter/login";

  static const String getHouseById = "$baseUrl/landlord/get-house-by-id";
  static const String updateHouse = "$baseUrl/landlord/update-house";
  static const String deleteHouse = "$baseUrl/landlord/delete-house";
  static const String getAllRents = "$baseUrl/renter/get-all-rents";

  // renter
  static const String searchHouse = "$baseUrl/landlord/search_house/";
}
